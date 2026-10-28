<?php

namespace App\Http\Controllers\CompanyRealEstate;

use App\Http\Controllers\Controller;
use App\Http\Requests\CompanyRealEstate\Designation\StoreDesignationRequest;
use App\Http\Requests\CompanyRealEstate\Designation\UpdateDesignationRequest;
use App\Models\Company;
use App\Models\Designation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class DesignationController extends Controller
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
     * Auto-generate a unique designation code (e.g. DES-001) scoped per company.
     */
    public static function generateDesignationCode(?int $companyId = null): string
    {
        $query = Designation::where('designation_code', 'like', 'DES-%');
        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        $lastDesignation = $query->orderBy('id', 'desc')->first();

        $nextNumber = 1;
        if ($lastDesignation && preg_match('/DES-(\d+)/', $lastDesignation->designation_code, $matches)) {
            $nextNumber = ((int) $matches[1]) + 1;
        } else {
            $countQuery = Designation::query();
            if ($companyId) {
                $countQuery->where('company_id', $companyId);
            }
            $nextNumber = $countQuery->count() + 1;
        }

        $code = sprintf('DES-%03d', $nextNumber);

        $existsQuery = function ($c) use ($companyId) {
            $q = Designation::where('designation_code', $c);
            if ($companyId) {
                $q->where('company_id', $companyId);
            }
            return $q->exists();
        };

        while ($existsQuery($code)) {
            $nextNumber++;
            $code = sprintf('DES-%03d', $nextNumber);
        }

        return $code;
    }

    /**
     * Auto-generate a unique slug from designation name scoped per company.
     */
    public static function generateUniqueSlug(string $name, ?int $ignoreId = null, ?int $companyId = null): string
    {
        $base = Str::slug($name);
        if ($base === '') {
            $base = 'desig';
        }

        $slug = $base;
        $counter = 1;

        $query = Designation::where('slug', $slug);
        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }
        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        while ($query->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;

            $query = Designation::where('slug', $slug);
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
     * Return next auto-generated designation code.
     */
    public function nextCode(Request $request): JsonResponse
    {
        $company = $this->resolveCompany($request);
        $companyId = $company?->id;

        return response()->json([
            'success'    => true,
            'code'       => self::generateDesignationCode($companyId),
            'company_id' => $companyId,
            'industry'   => $company?->industry,
        ]);
    }

    /**
     * Display a listing of designations.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 10);
        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status');
        $departmentId = $request->query('department_id');

        $company = $this->resolveCompany($request);
        $companyId = $company ? $company->id : ($request->query('company_id') ?? $request->header('X-Company-Id'));

        $query = Designation::with([
            'department:id,name,department_code',
            'company:id,name,code,industry',
        ]);

        if (!empty($companyId)) {
            $query->where('company_id', $companyId);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $term = '%' . strtolower($search) . '%';
                $q->whereRaw('LOWER(name) LIKE ?', [$term])
                  ->orWhereRaw('LOWER(designation_code) LIKE ?', [$term])
                  ->orWhereRaw('LOWER(slug) LIKE ?', [$term])
                  ->orWhereRaw('LOWER(COALESCE(industry, "")) LIKE ?', [$term])
                  ->orWhereRaw('LOWER(COALESCE(description, "")) LIKE ?', [$term]);
            });
        }

        if (!empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        if (!empty($departmentId) && $departmentId !== 'all') {
            $query->where('department_id', $departmentId);
        }

        $query->orderBy('id', 'desc');

        $designations = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Designations retrieved successfully.',
            'data'    => $designations->items(),
            'company' => $company ? [
                'id'       => $company->id,
                'name'     => $company->name,
                'code'     => $company->code,
                'industry' => $company->industry,
            ] : null,
            'pagination' => [
                'current_page' => $designations->currentPage(),
                'last_page'    => $designations->lastPage(),
                'per_page'     => $designations->perPage(),
                'total'        => $designations->total(),
            ],
        ]);
    }

    /**
     * Store a newly created designation.
     */
    public function store(StoreDesignationRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $company = $this->resolveCompany($request);

        if (!$company && $request->input('company_id')) {
            $company = Company::find($request->input('company_id'));
        }

        // Ensure authenticated company ID and industry are attached
        $companyId = $company ? $company->id : ($validated['company_id'] ?? null);
        if (!$companyId && !empty($validated['company_id'])) {
            $companyId = (int) $validated['company_id'];
        }
        $validated['company_id'] = $companyId;

        if ($company && $company->industry) {
            $validated['industry'] = $company->industry;
        } elseif (empty($validated['industry']) && $request->input('industry')) {
            $validated['industry'] = $request->input('industry');
        }

        if (empty($validated['designation_code'])) {
            $validated['designation_code'] = self::generateDesignationCode($companyId);
        }

        if (empty($validated['slug'])) {
            $validated['slug'] = self::generateUniqueSlug($validated['name'], null, $companyId);
        }

        $designation = Designation::create($validated);
        $designation->load(['department:id,name,department_code', 'company:id,name,code,industry']);

        return response()->json([
            'success' => true,
            'message' => 'Designation created successfully.',
            'data'    => $designation,
        ], 201);
    }

    /**
     * Display the specified designation.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $designation = Designation::with([
            'department:id,name,department_code',
            'company:id,name,code,industry',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Designation retrieved successfully.',
            'data'    => $designation,
        ]);
    }

    /**
     * Update the specified designation.
     */
    public function update(UpdateDesignationRequest $request, int $id): JsonResponse
    {
        $designation = Designation::findOrFail($id);
        $company = $this->resolveCompany($request);

        $validated = $request->validated();

        $companyId = $company ? $company->id : ($validated['company_id'] ?? $designation->company_id);
        if (!empty($companyId)) {
            $validated['company_id'] = $companyId;
        }

        if ($company && $company->industry) {
            $validated['industry'] = $company->industry;
        } elseif (empty($validated['industry']) && $designation->industry) {
            $validated['industry'] = $designation->industry;
        }

        if (empty($validated['designation_code'])) {
            $validated['designation_code'] = $designation->designation_code;
        }

        if (empty($validated['slug'])) {
            $validated['slug'] = self::generateUniqueSlug($validated['name'], $id, $companyId);
        }

        $designation->update($validated);
        $designation->load(['department:id,name,department_code', 'company:id,name,code,industry']);

        return response()->json([
            'success' => true,
            'message' => 'Designation updated successfully.',
            'data'    => $designation,
        ]);
    }

    /**
     * Update designation status (active / inactive).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $designation = Designation::findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['active', 'inactive'])],
        ]);

        $designation->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Designation status updated to ' . $validated['status'] . ' successfully.',
            'data'    => $designation,
        ]);
    }

    /**
     * Remove the specified designation.
     */
    public function destroy(int $id): JsonResponse
    {
        $designation = Designation::findOrFail($id);

        $designation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Designation deleted successfully.',
        ]);
    }
}
