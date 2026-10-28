<?php

namespace App\Http\Controllers\CompanyRealEstate;

use App\Http\Controllers\Controller;
use App\Http\Requests\CompanyRealEstate\Department\StoreDepartmentRequest;
use App\Http\Requests\CompanyRealEstate\Department\UpdateDepartmentRequest;
use App\Models\Company;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
    /**
     * Resolve the active company from request headers, inputs, or user context.
     */
    protected function resolveCompany(Request $request): ?Company
    {
        $user = $request->user();
        if (!$user) {
            return null;
        }

        $companyId = $request->header('X-Company-Id')
            ?? $request->input('company_id')
            ?? $request->query('company_id');

        $isSuperAdmin = $user->user_type === 'Super Admin';

        if ($companyId) {
            $company = Company::find($companyId);

            if ($company) {
                if ($isSuperAdmin) {
                    return $company;
                }

                $hasAccess = $user->companies()
                    ->where('companies.id', $company->id)
                    ->exists();

                if ($hasAccess) {
                    return $company;
                }
            }
        }

        // If user belongs to companies, use the default or first active one
        $userCompany = $user->companies()
            ->where('companies.status', 'active')
            ->orderByDesc('company_user_access.is_default')
            ->first() ?? $user->companies()->first();

        if ($userCompany) {
            return $userCompany;
        }

        // Super Admin fallback to first active company
        if ($isSuperAdmin) {
            return Company::where('status', 'active')->first() ?? Company::first();
        }

        return null;
    }

    /**
     * Auto-generate a unique department code scoped per company (e.g. DEP-001).
     */
    public static function generateDepartmentCode(?int $companyId = null): string
    {
        $query = Department::where('department_code', 'like', 'DEP-%');
        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        $lastDepartment = $query->orderBy('id', 'desc')->first();

        $nextNumber = 1;
        if ($lastDepartment && preg_match('/DEP-(\d+)/', $lastDepartment->department_code, $matches)) {
            $nextNumber = ((int) $matches[1]) + 1;
        } else {
            $countQuery = Department::query();
            if ($companyId) {
                $countQuery->where('company_id', $companyId);
            }
            $nextNumber = $countQuery->count() + 1;
        }

        $code = sprintf('DEP-%03d', $nextNumber);

        $existsQuery = function ($c) use ($companyId) {
            $q = Department::where('department_code', $c);
            if ($companyId) {
                $q->where('company_id', $companyId);
            }
            return $q->exists();
        };

        while ($existsQuery($code)) {
            $nextNumber++;
            $code = sprintf('DEP-%03d', $nextNumber);
        }

        return $code;
    }

    /**
     * Auto-generate a unique slug from department name scoped per company.
     */
    public static function generateUniqueSlug(string $name, ?int $ignoreId = null, ?int $companyId = null): string
    {
        $base = Str::slug($name);
        if ($base === '') {
            $base = 'dept';
        }

        $slug = $base;
        $counter = 1;

        $query = Department::where('slug', $slug);
        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }
        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        while ($query->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;

            $query = Department::where('slug', $slug);
            if ($ignoreId) {
                $query->where('id', '!=', $ignoreId);
            }
            if ($companyId) {
                $query->where('company_id', $companyId);
            }
        }

        return $slug;
    }

    /**
     * Return next auto-generated department code for the active company.
     */
    public function nextCode(Request $request): JsonResponse
    {
        $company = $this->resolveCompany($request);
        $companyId = $company?->id;

        return response()->json([
            'success'    => true,
            'code'       => self::generateDepartmentCode($companyId),
            'company_id' => $companyId,
            'industry'   => $company?->industry,
        ]);
    }

    /**
     * Display a listing of departments.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 10);
        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status');

        $company = $this->resolveCompany($request);
        $companyId = $company ? $company->id : ($request->query('company_id') ?? $request->header('X-Company-Id'));

        $query = Department::with('company:id,name,code,industry');

        if (!empty($companyId)) {
            $query->where('company_id', $companyId);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $term = '%' . strtolower($search) . '%';
                $q->whereRaw('LOWER(name) LIKE ?', [$term])
                  ->orWhereRaw('LOWER(department_code) LIKE ?', [$term])
                  ->orWhereRaw('LOWER(slug) LIKE ?', [$term])
                  ->orWhereRaw('LOWER(COALESCE(industry, "")) LIKE ?', [$term])
                  ->orWhereRaw('LOWER(COALESCE(description, "")) LIKE ?', [$term]);
            });
        }

        if (!empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        $query->orderBy('id', 'desc');

        $departments = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Departments retrieved successfully.',
            'data'    => $departments->items(),
            'company' => $company ? [
                'id'       => $company->id,
                'name'     => $company->name,
                'code'     => $company->code,
                'industry' => $company->industry,
            ] : null,
            'pagination' => [
                'current_page' => $departments->currentPage(),
                'last_page'    => $departments->lastPage(),
                'per_page'     => $departments->perPage(),
                'total'        => $departments->total(),
            ],
        ]);
    }

    /**
     * Store a newly created department.
     */
    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        $company = $this->resolveCompany($request);

        if (!$company && $request->input('company_id')) {
            $company = Company::find($request->input('company_id'));
        }

        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'No authorized active company found.',
            ], 403);
        }

        $validated = $request->validated();

        $validated['company_id'] = $company->id;
        $validated['industry'] = $company->industry ?? ($request->input('industry') ?? null);

        if (empty($validated['department_code'])) {
            $validated['department_code'] = self::generateDepartmentCode($company->id);
        }

        if (empty($validated['slug'])) {
            $validated['slug'] = self::generateUniqueSlug($validated['name'], null, $company->id);
        }

        $department = Department::create($validated);
        $department->load('company:id,name,code,industry');

        return response()->json([
            'success' => true,
            'message' => 'Department created successfully.',
            'data'    => $department,
        ], 201);
    }

    /**
     * Display the specified department.
     */
    public function show(int $id): JsonResponse
    {
        $department = Department::with('company:id,name,code,industry')->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Department retrieved successfully.',
            'data'    => $department,
        ]);
    }

    /**
     * Update the specified department.
     */
    public function update(UpdateDepartmentRequest $request, int $id): JsonResponse
    {
        $department = Department::findOrFail($id);
        $company = $this->resolveCompany($request);

        $validated = $request->validated();

        $companyId = $company ? $company->id : ($department->company_id ?? $request->input('company_id'));
        if ($companyId) {
            $validated['company_id'] = $companyId;
        }

        if ($company && $company->industry) {
            $validated['industry'] = $company->industry;
        } elseif (empty($validated['industry']) && $department->industry) {
            $validated['industry'] = $department->industry;
        }

        if (empty($validated['department_code'])) {
            $validated['department_code'] = $department->department_code;
        }

        if (empty($validated['slug'])) {
            $validated['slug'] = self::generateUniqueSlug($validated['name'], $id, $companyId);
        }

        $department->update($validated);
        $department->load('company:id,name,code,industry');

        return response()->json([
            'success' => true,
            'message' => 'Department updated successfully.',
            'data'    => $department,
        ]);
    }

    /**
     * Update department status (active / inactive).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $department = Department::findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['active', 'inactive'])],
        ]);

        $department->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Department status updated to ' . $validated['status'] . ' successfully.',
            'data'    => $department,
        ]);
    }

    /**
     * Remove the specified department.
     */
    public function destroy(int $id): JsonResponse
    {
        $department = Department::findOrFail($id);

        $department->delete();

        return response()->json([
            'success' => true,
            'message' => 'Department deleted successfully.',
        ]);
    }
}
