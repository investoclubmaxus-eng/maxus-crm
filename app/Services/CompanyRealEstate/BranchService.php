<?php

namespace App\Services\CompanyRealEstate;

use App\Models\Branch;
use App\Models\Company;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class BranchService
{
    /**
     * Ensure the tenant connection is activated for the given company.
     */
    public function ensureTenantContext(Company $company): void
    {
        $company->makeCurrent();
    }

    /**
     * Get paginated branches for a company with filters.
     */
    public function getBranches(Company $company, array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $this->ensureTenantContext($company);

        $query = Branch::query()
            ->where('company_id', $company->id)
            ->with(['manager']);

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('state', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['state']) && $filters['state'] !== 'all') {
            $query->where('state', $filters['state']);
        }

        $query->orderBy('id', 'desc');

        return $query->paginate($perPage);
    }

    /**
     * Get all active branches for quick dropdowns.
     */
    public function getAllActiveBranches(Company $company): Collection
    {
        $this->ensureTenantContext($company);

        return Branch::query()
            ->where('company_id', $company->id)
            ->where('status', 'active')
            ->orderBy('name')
            ->get();
    }

    /**
     * Get a single branch.
     */
    public function getBranch(Company $company, int $branchId): Branch
    {
        $this->ensureTenantContext($company);

        return Branch::query()
            ->where('company_id', $company->id)
            ->with(['manager'])
            ->findOrFail($branchId);
    }

    /**
     * Create a new branch.
     */
    public function createBranch(Company $company, array $data): Branch
    {
        $this->ensureTenantContext($company);

        return Branch::create([
            'company_id' => $company->id,
            'name' => trim($data['name']),
            'code' => strtoupper(trim($data['code'])),
            'email' => !empty($data['email']) ? strtolower(trim($data['email'])) : null,
            'phone' => !empty($data['phone']) ? trim($data['phone']) : null,
            'address' => !empty($data['address']) ? trim($data['address']) : null,
            'city' => !empty($data['city']) ? trim($data['city']) : null,
            'state' => !empty($data['state']) ? trim($data['state']) : null,
            'country' => !empty($data['country']) ? trim($data['country']) : 'India',
            'postal_code' => !empty($data['postal_code']) ? trim($data['postal_code']) : null,
            'user_id' => !empty($data['user_id']) ? (int) $data['user_id'] : null,
            'status' => $data['status'] ?? 'active',
        ]);
    }

    /**
     * Update an existing branch.
     */
    public function updateBranch(Company $company, Branch $branch, array $data): Branch
    {
        $this->ensureTenantContext($company);

        $branch->update([
            'name' => trim($data['name']),
            'code' => strtoupper(trim($data['code'])),
            'email' => !empty($data['email']) ? strtolower(trim($data['email'])) : null,
            'phone' => !empty($data['phone']) ? trim($data['phone']) : null,
            'address' => !empty($data['address']) ? trim($data['address']) : null,
            'city' => !empty($data['city']) ? trim($data['city']) : null,
            'state' => !empty($data['state']) ? trim($data['state']) : null,
            'country' => !empty($data['country']) ? trim($data['country']) : 'India',
            'postal_code' => !empty($data['postal_code']) ? trim($data['postal_code']) : null,
            'user_id' => !empty($data['user_id']) ? (int) $data['user_id'] : null,
            'status' => $data['status'] ?? $branch->status,
        ]);

        return $branch->fresh();
    }

    /**
     * Update branch status.
     */
    public function updateStatus(Company $company, Branch $branch, string $status): Branch
    {
        $this->ensureTenantContext($company);

        $branch->update([
            'status' => $status,
        ]);

        return $branch->fresh(['manager']);
    }

    /**
     * Delete a branch.
     */
    public function deleteBranch(Company $company, Branch $branch): bool
    {
        $this->ensureTenantContext($company);

        return (bool) $branch->delete();
    }
}
