<?php

namespace App\Http\Controllers\Superadmin\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Superadmin\Admin\AdminCompanyAccessRequest;
use App\Http\Requests\Superadmin\Admin\AdminRequest;
use App\Http\Requests\Superadmin\Admin\AdminStatusRequest;
use App\Models\AdminInvitation;
use App\Models\Company;
use App\Models\User;
use App\Services\Superadmin\Admin\AdminInvitationService;
use App\Services\Superadmin\Admin\AdminService;
use App\Services\Superadmin\Settings\EmailTemplateService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class AdminController extends Controller
{
    public function __construct(
        private AdminService $adminService,
        private AdminInvitationService $adminInvitationService,
        private EmailTemplateService $emailTemplateService
    ) {}

    /**
     * Get all admins.
     */
    public function index(): JsonResponse
    {
        $admins = $this->adminService->getAllAdmins();

        return response()->json([
            'success' => true,
            'message' => $admins->isEmpty()
                ? 'No admins found.'
                : 'Admins retrieved successfully.',
            'data' => $admins,
        ]);
    }

    /**
     * Get active companies available for admin assignment.
     */
    public function availableCompanies(): JsonResponse
    {
        $companies = Company::query()
            ->where('companies.status', 'active')
            ->whereDoesntHave('users', function (Builder $query) {
                $query->whereIn(
                    'company_user_access.status',
                    ['active', 'pending']
                );
            })
            ->orderBy('companies.name')
            ->get([
                'companies.id',
                'companies.name',
                'companies.code',
                'companies.email',
                'companies.status',
            ]);

        return response()->json([
            'success' => true,
            'message' => $companies->isEmpty()
                ? 'No available companies found.'
                : 'Available companies retrieved successfully.',
            'data' => $companies,
        ]);
    }

    /**
     * Create admin.
     */
    public function store(AdminRequest $request): JsonResponse
    {
        $admin = $this->adminService->createAdmin(
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Admin created successfully.',
            'data' => $admin,
        ], 201);
    }

    /**
     * Get admin details.
     */
    public function show(User $admin): JsonResponse
    {
        $this->ensureAdmin($admin);

        $admin = $this->adminService->getAdmin($admin->id);

        return response()->json([
            'success' => true,
            'message' => 'Admin retrieved successfully.',
            'data' => $admin,
        ]);
    }

    /**
     * Update admin.
     */
    public function update(
        AdminRequest $request,
        User $admin
    ): JsonResponse {
        $this->ensureAdmin($admin);

        $admin = $this->adminService->updateAdmin(
            $admin,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Admin updated successfully.',
            'data' => $admin,
        ]);
    }

    /**
     * Send or resend an activation invitation to an administrator.
     */
    public function sendInvitation(User $admin): JsonResponse
    {
        $this->ensureAdmin($admin);

        try {
            $result = DB::transaction(function () use ($admin): array {
                $admin = User::query()
                    ->whereKey($admin->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (AdminInvitation::query()
                    ->where('user_id', $admin->id)
                    ->whereNotNull('accepted_at')
                    ->exists()) {
                    return [
                        'error' => 'This administrator has already activated their account.',
                    ];
                }

                if (
                    strtolower((string) $admin->status) === 'inactive'
                    && AdminInvitation::query()
                        ->where('user_id', $admin->id)
                        ->whereNotNull('revoked_at')
                        ->exists()
                ) {
                    return [
                        'error' => 'This administrator was intentionally deactivated. Set the account active before sending a new invitation.',
                    ];
                }

                $invitationResult = $this->adminInvitationService
                    ->createInvitation($admin, auth()->id());
                $companyNames = $admin->companies()
                    ->pluck('name')
                    ->filter()
                    ->unique()
                    ->implode(', ');
                $email = $this->emailTemplateService
                    ->buildAdminInvitationEmail(
                        $admin,
                        $invitationResult['activation_url'],
                        $companyNames !== '' ? $companyNames : null
                    );

                return [
                    'admin' => $admin,
                    'invitation' => $invitationResult['invitation'],
                    'email' => $email,
                ];
            });

            if (isset($result['error'])) {
                return response()->json([
                    'success' => false,
                    'message' => $result['error'],
                ], 409);
            }

            Mail::to($result['admin']->email)
                ->queue($result['email']->onQueue('emails'));

            $result['invitation']->forceFill([
                'sent_at' => now(),
            ])->save();
        } catch (Throwable $exception) {
            Log::error('Unable to queue admin activation invitation.', [
                'admin_id' => $admin->id,
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'The activation invitation could not be queued. Check the email template and queue settings, then try again.',
            ], 502);
        }

        return response()->json([
            'success' => true,
            'message' => "Activation invitation queued for {$result['admin']->email}.",
            'email_template' => 'new-admin-invitation',
            'data' => [
                'has_pending_invitation' => true,
                'invitation_sent_at' => $result['invitation']->sent_at,
            ],
        ]);
    }

    /**
     * Update admin status.
     */
    public function updateStatus(AdminStatusRequest $request, User $admin): JsonResponse
    {
        $this->ensureAdmin($admin);

        $status = $request->validated('status');

        if (strtolower((string) $admin->status) === $status) {
            return response()->json([
                'success' => true,
                'message' => 'Admin already has this status.',
                'data' => $admin->load('companies'),
                'email_queued' => false,
            ]);
        }

        try {
            $result = DB::transaction(function () use ($admin, $status): array {
                $admin = User::query()
                    ->whereKey($admin->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (strtolower((string) $admin->status) === $status) {
                    return [
                        'admin' => $admin->load('companies'),
                        'email_template' => null,
                        'email_description' => null,
                    ];
                }

                $admin = $this->adminService->updateStatus($admin, $status);

                if ($status === 'inactive') {
                    AdminInvitation::query()
                        ->where('user_id', $admin->id)
                        ->whereNull('accepted_at')
                        ->whereNull('revoked_at')
                        ->update(['revoked_at' => now()]);

                    $email = $this->emailTemplateService
                        ->buildAdminStatusEmail($admin, 'account-disabled');
                    $emailTemplate = 'account-disabled';
                } else {
                    $email = $this->emailTemplateService
                        ->buildAdminStatusEmail(
                            $admin,
                            'admin-account-activated'
                        );
                    $emailTemplate = 'admin-account-activated';
                }

                Mail::to($admin->email)
                    ->queue($email->onQueue('emails')->afterCommit());

                return [
                    'admin' => $admin->fresh('companies'),
                    'email_template' => $emailTemplate,
                    'email_description' => match ($emailTemplate) {
                        'admin-account-activated' => 'account activated',
                        'account-disabled' => 'account disabled',
                    },
                ];
            });
        } catch (Throwable $exception) {
            Log::error('Unable to queue admin status email.', [
                'admin_id' => $admin->id,
                'status' => $status,
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to complete the admin status update and queue its email. Check the administrator status before retrying, and verify the SMTP settings and email template.',
            ], 502);
        }

        if ($result['email_template'] === null) {
            return response()->json([
                'success' => true,
                'message' => 'Admin already has this status.',
                'data' => $result['admin'],
                'email_queued' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Admin status updated and {$result['email_description']} email queued for {$result['admin']->email}.",
            'email_queued' => true,
            'email_template' => $result['email_template'],
            'data' => $result['admin'],
        ]);
    }

    /**
     * Delete admin.
     */
    public function destroy(User $admin): JsonResponse
    {
        $this->ensureAdmin($admin);

        $this->adminService->deleteAdmin($admin);

        return response()->json([
            'success' => true,
            'message' => 'Admin deleted successfully.',
        ]);
    }

    /**
     * Get admin company access.
     */
    public function companies(User $admin): JsonResponse
    {
        $this->ensureAdmin($admin);

        $companies = $this->adminService->getCompanyAccess($admin);

        return response()->json([
            'success' => true,
            'message' => 'Admin company access retrieved successfully.',
            'data' => $companies,
        ]);
    }

    /**
     * Grant company access.
     */
    public function grantCompanyAccess(AdminCompanyAccessRequest $request, User $admin): JsonResponse
    {
        $this->ensureAdmin($admin);

        $admin = $this->adminService->grantCompanyAccess(
            $admin,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Company access granted successfully.',
            'data' => $admin,
        ], 201);
    }

    /**
     * Update company access.
     */
    public function updateCompanyAccess(AdminCompanyAccessRequest $request, User $admin, Company $company): JsonResponse
    {
        $this->ensureAdmin($admin);

        $admin = $this->adminService->updateCompanyAccess(
            $admin,
            $company,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Company access updated successfully.',
            'data' => $admin,
        ]);
    }

    /**
     * Revoke company access.
     */
    public function revokeCompanyAccess(
        User $admin,
        Company $company
    ): JsonResponse {
        $this->ensureAdmin($admin);

        $admin = $this->adminService->revokeCompanyAccess(
            $admin,
            $company
        );

        return response()->json([
            'success' => true,
            'message' => 'Company access revoked successfully.',
            'data' => $admin,
        ]);
    }

    /**
     * Set default company.
     */
    public function setDefaultCompany(
        User $admin,
        Company $company
    ): JsonResponse {
        $this->ensureAdmin($admin);

        $admin = $this->adminService->setDefaultCompany(
            $admin,
            $company
        );

        return response()->json([
            'success' => true,
            'message' => 'Default company updated successfully.',
            'data' => $admin,
        ]);
    }

    /**
     * Make sure route user is actually an Admin.
     */
    private function ensureAdmin(User $admin): void
    {
        abort_unless(
            strtolower((string) $admin->user_type) === 'admin',
            404,
            'Admin not found.'
        );
    }
}
