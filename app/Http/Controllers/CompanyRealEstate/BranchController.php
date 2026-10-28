<?php

namespace App\Http\Controllers\CompanyRealEstate;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Company;
use App\Services\CompanyRealEstate\BranchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Requests\CompanyRealEstate\Branch\StoreBranchRequest;
use App\Http\Requests\CompanyRealEstate\Branch\UpdateBranchRequest;

class BranchController extends Controller
{
    public function __construct(
        protected BranchService $branchService
    ) {}

    /**
     * Resolve the active company from request headers or user context.
    */
    protected function resolveCompany(Request $request): Company
    {

        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        $companyId = $request->header('X-Company-Id')
            ?? $request->input('company_id')
            ?? $request->query('company_id');

        // Match the exact value stored in your users table.
        $isSuperAdmin = $user->user_type === 'Super Admin';

        // If a company was explicitly selected, validate access to it.
        if ($companyId) {
            $company = Company::where('id', $companyId)
                ->where('status', 'active')
                ->first();

            if (!$company) {
                abort(404, 'Selected company not found or inactive.');
            }

            if ($isSuperAdmin) {
                $company->makeCurrent();
                return $company;
            }

            $hasAccess = $user->companies()
                ->where('companies.id', $company->id)
                ->where('companies.status', 'active')
                ->wherePivot('status', 'active')
                ->exists();

            if ($hasAccess) {
                $company->makeCurrent();
                return $company;
            }

            abort(403, 'You do not have active access to this company.');
        }

        // Otherwise, use the user's default active company.
        $userCompany = $user->companies()
            ->where('companies.status', 'active')
            ->wherePivot('status', 'active')
            ->orderByDesc('company_user_access.is_default')
            ->first();

        if ($userCompany) {
            $userCompany->makeCurrent();
            return $userCompany;
        }

        // Super Admin can use an active company if none was selected.
        if ($isSuperAdmin) {
            $first = Company::where('status', 'active')->first();

            if ($first) {
                $first->makeCurrent();
                return $first;
            }
        }
        abort(403, 'No active company assigned or selected.');
    }

    /**
     * List paginated branches.
    */
    public function index(Request $request): JsonResponse
    {
        
        $company = $this->resolveCompany($request);
        
        
       
        $perPage = (int) $request->query('per_page', 10);

        $branches = $this->branchService->getBranches($company, [
            'search' => $request->query('search'),
            'status' => $request->query('status'),
            'state' => $request->query('state'),
        ], $perPage);
        
        return response()->json([
            'success' => true,
            'message' => 'Branches retrieved successfully.',
            'data' => $branches->items(),
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'code' => $company->code,
                'database' => $company->database,
            ],
            'pagination' => [
                'current_page' => $branches->currentPage(),
                'last_page' => $branches->lastPage(),
                'per_page' => $branches->perPage(),
                'total' => $branches->total(),
            ],
        ]);
    }

    /**
     * Store a new branch.
    */
    public function store(StoreBranchRequest  $request): JsonResponse
    {
        $company = $this->resolveCompany($request);

        $validated = $request->validated();

        // The authenticated user is the branch manager/creator.
        $validated['user_id'] = $request->user()->id;
        

        $branch = $this->branchService->createBranch($company, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Branch created successfully.',
            'data' => $branch,
        ], 201);
    }

    /**
     * Show a branch.
    */
    public function show(Request $request, int $id): JsonResponse
    {
        $company = $this->resolveCompany($request);
        $branch = $this->branchService->getBranch($company, $id);

        return response()->json([
            'success' => true,
            'message' => 'Branch retrieved successfully.',
            'data' => $branch,
        ]);
    }

    /**
     * Update a branch.
    */
    public function update(UpdateBranchRequest $request, int $id): JsonResponse
    {
        $company = $this->resolveCompany($request);
        $branch = $this->branchService->getBranch($company, $id);

        $validated = $request->validated();

        $updatedBranch = $this->branchService->updateBranch($company, $branch, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Branch updated successfully.',
            'data' => $updatedBranch,
        ]);
    }

    /**
     * Update branch status (active / inactive).
    */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $company = $this->resolveCompany($request);
        $branch = $this->branchService->getBranch($company, $id);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $updatedBranch = $this->branchService->updateStatus($company, $branch, $validated['status']);

        return response()->json([
            'success' => true,
            'message' => 'Branch status updated to ' . $validated['status'] . ' successfully.',
            'data' => $updatedBranch,
        ]);
    }

    /**
     * Delete a branch.
    */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $company = $this->resolveCompany($request);
        $branch = $this->branchService->getBranch($company, $id);

        $this->branchService->deleteBranch($company, $branch);

        return response()->json([
            'success' => true,
            'message' => 'Branch deleted successfully.',
        ]);
    }
}
