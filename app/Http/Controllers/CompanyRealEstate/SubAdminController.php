<?php

namespace App\Http\Controllers\CompanyRealEstate;

use App\Http\Controllers\Controller;
use App\Http\Requests\CompanyRealEstate\SubAdmin\StoreSubAdminRequest;
use App\Http\Requests\CompanyRealEstate\SubAdmin\UpdateSubAdminRequest;
use App\Models\AdminInvitation;                                    // ← add
use App\Models\Company;
use App\Models\User;
use App\Services\CompanyRealEstate\SubAdminService;
use App\Services\Superadmin\Admin\AdminInvitationService;
use App\Services\Superadmin\Settings\EmailTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;                                 // ← add
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;                               // ← add
use Illuminate\Validation\Rule;
use Throwable;

class SubAdminController extends Controller
{
    public function __construct(
        protected SubAdminService $subAdminService,
        protected AdminInvitationService $subAdminInvitationService,
        protected EmailTemplateService $emailTemplateService
    ) {}

    /**
     * Resolve the active company from request headers or user context.
     */
    protected function resolveCompany(Request $request, bool $required = false): ?Company
    {
        $user = $request->user();
        $companyId = $request->header('X-Company-Id')
            ?? $request->input('company_id')
            ?? $request->query('company_id');

        $isSuperAdmin = $user && $user->user_type === 'Super Admin';

        if ($companyId) {
            $company = Company::where('id', $companyId)
                ->where('status', 'active')
                ->first();

            if ($company) {
                if ($isSuperAdmin) {
                    $company->makeCurrent();
                    return $company;
                }

                $hasAccess = $user && $user->companies()
                    ->where('companies.id', $company->id)
                    ->where('companies.status', 'active')
                    ->wherePivot('status', 'active')
                    ->exists();

                if ($hasAccess) {
                    $company->makeCurrent();
                    return $company;
                }
            }
        }

        if ($user) {
            $userCompany = $user->companies()
                ->where('companies.status', 'active')
                ->wherePivot('status', 'active')
                ->first();

            if ($userCompany) {
                $userCompany->makeCurrent();
                return $userCompany;
            }
        }

        if ($required && !$isSuperAdmin) {
            abort(403, 'No active company assigned.');
        }

        return null;
    }

    /**
     * Get all Sub Admins.
     */
    public function index(Request $request): JsonResponse
    {
        
        $company = $this->resolveCompany($request, false);
        //dd($company);
        $subAdmins = $this->subAdminService->getAllSubAdmins($company);
        

        return response()->json([
            'success' => true,
            'message' => $subAdmins->isEmpty()
                ? 'No Sub Admins found.'
                : 'Sub Admins retrieved successfully.',
            'data' => $subAdmins,
        ]);
    }

    /**
     * Get active companies available for Sub Admin assignment.
     */
    public function availableCompanies(): JsonResponse
    {
        $companies = Company::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'status']);

        return response()->json([
            'success' => true,
            'message' => 'Available companies retrieved successfully.',
            'data' => $companies,
        ]);
    }

    /**
     * Create a Sub Admin and assign company/branch access.
     */
    public function store(StoreSubAdminRequest $request): JsonResponse
    {
        
        try {
            $company = $this->resolveCompany($request, false);
            $subAdmin = $this->subAdminService->createSubAdmin(
                $request->validated()
            );
           

            // Reload enriched branch access data for response
            $subAdmin = $this->subAdminService->getSubAdmin($subAdmin->id, $company);

            return response()->json([
                'success' => true,
                'message' => 'Sub Admin created successfully.',
                'data' => $subAdmin,
            ], 201);
        } catch (Throwable $exception) {
            Log::error('Unable to create Sub Admin.', [
                'exception' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }


    

    /**
     * Get Sub Admin details.
     */
    public function show(Request $request, User $subAdmin): JsonResponse
    {
        $this->ensureSubAdmin($subAdmin);
        $company = $this->resolveCompany($request, false);

        $subAdmin = $this->subAdminService->getSubAdmin($subAdmin->id, $company);

        return response()->json([
            'success' => true,
            'message' => 'Sub Admin retrieved successfully.',
            'data' => $subAdmin,
        ]);
    }

    /**
     * Update Sub Admin details and access assignments.
     */
    public function update(
        UpdateSubAdminRequest $request,
        User $subAdmin
    ): JsonResponse {
        $this->ensureSubAdmin($subAdmin);
        $company = $this->resolveCompany($request, false);

        $this->subAdminService->updateSubAdmin(
            $subAdmin,
            $request->validated()
        );

        $updatedSubAdmin = $this->subAdminService->getSubAdmin($subAdmin->id, $company);

        return response()->json([
            'success' => true,
            'message' => 'Sub Admin updated successfully.',
            'data' => $updatedSubAdmin,
        ]);
    }

    /**
     * Update Sub Admin account status.
     */
    // public function updateStatus(Request $request, User $subAdmin): JsonResponse
    // {
    //     $this->ensureSubAdmin($subAdmin);

    //     $validated = $request->validate([
    //         'status' => ['required', Rule::in(['active', 'inactive'])],
    //     ]);

    //     $company = $this->resolveCompany($request, false);

    //     $this->subAdminService->updateStatus(
    //         $subAdmin,
    //         $validated['status']
    //     );

    //     $updatedSubAdmin = $this->subAdminService->getSubAdmin($subAdmin->id, $company);

    //     return response()->json([
    //         'success' => true,
    //         'message' => 'Sub Admin status updated successfully.',
    //         'data' => $updatedSubAdmin,
    //     ]);
    // }

    /**
 * Update Sub Admin account status and queue status email.
 */
    public function updateStatus(Request $request, User $subAdmin): JsonResponse
    {
        $this->ensureSubAdmin($subAdmin);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $status = $validated['status'];
        $company = $this->resolveCompany($request, false);

        if (strtolower((string) $subAdmin->status) === $status) {
            return response()->json([
                'success' => true,
                'message' => 'Sub Admin already has this status.',
                'data' => $this->subAdminService->getSubAdmin($subAdmin->id, $company),
                'email_queued' => false,
            ]);
        }

        try {
            $result = DB::transaction(function () use ($subAdmin, $status, $company): array {
                $subAdmin = User::query()
                    ->whereKey($subAdmin->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (strtolower((string) $subAdmin->status) === $status) {
                    return [
                        'subAdmin' => $this->subAdminService->getSubAdmin($subAdmin->id, $company),
                        'email_template' => null,
                        'email_description' => null,
                    ];
                }

                $this->subAdminService->updateStatus($subAdmin, $status);
                $subAdmin = $subAdmin->fresh();

                if ($status === 'inactive') {
                    AdminInvitation::query()
                        ->where('user_id', $subAdmin->id)
                        ->whereNull('accepted_at')
                        ->whereNull('revoked_at')
                        ->update(['revoked_at' => now()]);

                    $email = $this->emailTemplateService
                        ->buildAdminStatusEmail($subAdmin, 'account-disabled');
                    $emailTemplate = 'account-disabled';
                } else {
                    $email = $this->emailTemplateService
                        ->buildAdminStatusEmail($subAdmin, 'admin-account-activated');
                    $emailTemplate = 'admin-account-activated';
                }

                Mail::to($subAdmin->email)
                    ->queue($email->onQueue('emails')->afterCommit());

                return [
                    'subAdmin' => $this->subAdminService->getSubAdmin($subAdmin->id, $company),
                    'email_template' => $emailTemplate,
                    'email_description' => match ($emailTemplate) {
                        'admin-account-activated' => 'account activated',
                        'account-disabled' => 'account disabled',
                        default => 'status updated',
                    },
                ];
            });
        } catch (Throwable $exception) {
            Log::error('Unable to queue sub-admin status email.', [
                'sub_admin_id' => $subAdmin->id,
                'status' => $status,
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to complete the status update and queue its email. Check SMTP and email templates.',
            ], 502);
        }

        if ($result['email_template'] === null) {
            return response()->json([
                'success' => true,
                'message' => 'Sub Admin already has this status.',
                'data' => $result['subAdmin'],
                'email_queued' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Sub Admin status updated and {$result['email_description']} email queued for {$result['subAdmin']->email}.",
            'email_queued' => true,
            'email_template' => $result['email_template'],
            'data' => $result['subAdmin'],
        ]);
    }

    /**
     * Get branch access for a Sub Admin in a company.
     */
    public function branchAccess(
        Request $request,
        User $subAdmin
    ): JsonResponse {
        $this->ensureSubAdmin($subAdmin);

        $company = $this->resolveCompany($request, false);

        if (! $company) {
            $validated = $request->validate([
                'company_id' => ['required', 'integer', 'exists:companies,id'],
            ]);
            $company = Company::where('status', 'active')->findOrFail($validated['company_id']);
        }

        $branchAccess = $this->subAdminService->getBranchAccess(
            $subAdmin,
            $company
        );

        return response()->json([
            'success' => true,
            'message' => 'Sub Admin branch access retrieved successfully.',
            'data' => $branchAccess,
        ]);
    }

    /**
     * Assign or replace branch access.
     */
    public function updateBranchAccess(
        Request $request,
        User $subAdmin
    ): JsonResponse {
        $this->ensureSubAdmin($subAdmin);

        $company = $this->resolveCompany($request, false);

        $validated = $request->validate([
            'company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'branches' => ['required', 'array', 'min:1'],
            'branches.*' => ['required', 'integer', 'distinct', 'min:1'],
            'default_branch_id' => ['required', 'integer', 'min:1'],
            'branch_access_status' => [
                'sometimes',
                Rule::in(['active', 'pending', 'inactive']),
            ],
        ]);

        if (! $company) {
            $companyId = $validated['company_id'] ?? null;
            if (! $companyId) {
                abort(422, 'Company ID is required.');
            }
            $company = Company::where('status', 'active')->findOrFail($companyId);
        }

        $branchAccess = $this->subAdminService->updateBranchAccess(
            $subAdmin,
            $company,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Sub Admin branch access updated successfully.',
            'data' => $branchAccess,
        ]);
    }

    /**
     * Delete a Sub Admin.
    */
    public function destroy(User $subAdmin): JsonResponse
    {
        $this->ensureSubAdmin($subAdmin);

        $this->subAdminService->deleteSubAdmin($subAdmin);

        return response()->json([
            'success' => true,
            'message' => 'Sub Admin deleted successfully.',
        ]);
    }

    /**
     * Ensure the requested user is actually a Sub Admin.
    */
    private function ensureSubAdmin(User $subAdmin): void
    {
        abort_unless(
            $subAdmin->user_type === 'Sub Admin',
            404,
            'Sub Admin not found.'
        );
    }


    /**
 * Send or resend an activation invitation to a sub-administrator.
 * Same pattern as AdminController::sendInvitation — not called on create.
 */
public function sendInvitation(Request $request, User $subAdmin): JsonResponse
{
    $this->ensureSubAdmin($subAdmin);

    try {
        $result = DB::transaction(function () use ($subAdmin, $request): array {
            $subAdmin = User::query()
                ->whereKey($subAdmin->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (AdminInvitation::query()
                ->where('user_id', $subAdmin->id)
                ->whereNotNull('accepted_at')
                ->exists()) {
                return [
                    'error' => 'This sub-administrator has already activated their account.',
                ];
            }

            if (
                strtolower((string) $subAdmin->status) === 'inactive'
                && AdminInvitation::query()
                    ->where('user_id', $subAdmin->id)
                    ->whereNotNull('revoked_at')
                    ->exists()
            ) {
                return [
                    'error' => 'This sub-administrator was intentionally deactivated. Set the account active before sending a new invitation.',
                ];
            }

            $invitationResult = $this->subAdminInvitationService
                ->createInvitation($subAdmin, auth()->id());

            $company = $this->resolveCompany($request, false);
            $companyName = $company?->name
                ?? $subAdmin->companies()->pluck('name')->filter()->unique()->implode(', ');
            $companyName = $companyName !== '' ? $companyName : null;

            $branchNames = method_exists($subAdmin, 'branches')
                ? $subAdmin->branches()->pluck('name')->filter()->unique()->implode(', ')
                : null;

            $email = $this->emailTemplateService
                ->buildSubAdminInvitationEmail(
                    $subAdmin,
                    $invitationResult['activation_url'],
                    $companyName,
                    $branchNames
                );

            return [
                'subAdmin'   => $subAdmin,
                'invitation' => $invitationResult['invitation'],
                'email'      => $email,
            ];
        });

        if (isset($result['error'])) {
            return response()->json([
                'success' => false,
                'message' => $result['error'],
            ], 409);
        }

        Mail::to($result['subAdmin']->email)
            ->queue($result['email']->onQueue('emails'));

        $result['invitation']->forceFill([
            'sent_at' => now(),
        ])->save();
    } catch (Throwable $exception) {
        Log::error('Unable to queue sub-admin activation invitation.', [
            'sub_admin_id' => $subAdmin->id,
            'exception'    => $exception,
        ]);

        return response()->json([
            'success' => false,
            'message' => 'The activation invitation could not be queued. Check the email template and queue settings, then try again.',
        ], 502);
    }

    return response()->json([
        'success'        => true,
        'message'        => "Activation invitation queued for {$result['subAdmin']->email}.",
        'email_template' => 'new-sub-admin-invitation',
        'data'           => [
            'has_pending_invitation' => true,
            'invitation_sent_at'     => $result['invitation']->sent_at,
        ],
    ]);
}
}
