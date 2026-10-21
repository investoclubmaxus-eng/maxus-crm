<?php

namespace App\Services\CompanyRealEstate;

use App\Models\Branch;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SubAdminService
{
    /**
     * Get all Sub Admins, optionally filtered and enriched for a specific company.
     */
    public function getAllSubAdmins(?Company $company = null): Collection
    {

        $query = User::query()
            ->where('user_type', 'Sub Admin');

        if ($company) {
            $query->whereHas('companies', function ($q) use ($company) {
                $q->where('companies.id', $company->id);
            })->with(['companies' => function ($q) use ($company) {
                $q->where('companies.id', $company->id);
            }]);
        } else {
            $query->with('companies');
        }

        $subAdmins = $query->latest()->get();

        if ($company && $company->database) {
            $company->makeCurrent();

            $accessRecords = DB::connection('tenant')
                ->table('branch_user_access')
                ->where('company_id', $company->id)
                ->whereIn('user_id', $subAdmins->pluck('id'))
                ->where('status', '!=', 'revoked')
                ->get()
                ->groupBy('user_id');

            $branches = Branch::query()
                ->where('company_id', $company->id)
                ->get(['id', 'name', 'code', 'city', 'status'])
                ->keyBy('id');

            foreach ($subAdmins as $subAdmin) {
                $userAccess = $accessRecords->get($subAdmin->id, collect());
                $branchIds = $userAccess->pluck('branch_id')->map(fn ($id) => (int) $id)->values()->all();
                $defaultRecord = $userAccess->firstWhere('is_default', 1) ?? $userAccess->first();

                $subAdmin->setAttribute('branch_ids', $branchIds);
                $subAdmin->setAttribute('primary_branch_id', $defaultRecord ? (int) $defaultRecord->branch_id : ($branchIds[0] ?? null));
                $subAdmin->setAttribute('branch_access_status', $defaultRecord?->status ?? 'active');
                $subAdmin->setAttribute('assigned_branches', $userAccess->map(function ($acc) use ($branches) {
                    $b = $branches->get($acc->branch_id);
                    return [
                        'id' => (int) $acc->branch_id,
                        'name' => $b?->name ?? "Branch #{$acc->branch_id}",
                        'code' => $b?->code ?? '',
                        'city' => $b?->city ?? '',
                        'is_default' => (bool) $acc->is_default,
                        'status' => $acc->status,
                    ];
                })->values()->all());
                $subAdmin->syncOriginal();
            }
        }

        return $subAdmins;
    }

    /**
     * Get a single Sub Admin with branch access enriched.
     */
    public function getSubAdmin(int $id, ?Company $company = null): User
    {
        $subAdmin = User::query()
            ->where('user_type', 'Sub Admin')
            ->with('companies')
            ->findOrFail($id);

        if (! $company && $subAdmin->companies->isNotEmpty()) {
            $company = $subAdmin->companies->first();
        }

        if ($company && $company->database) {
            $this->attachBranchAccessData($subAdmin, $company);
        }

        return $subAdmin;
    }

    /**
     * Create a Sub Admin and assign company/branch access.
     */
    public function createSubAdmin(array $data): User
    {
        $companies = collect($data['companies'] ?? []);

        if ($companies->isEmpty()) {
            throw ValidationException::withMessages([
                'companies' => 'Assign at least one company to the Sub Admin.',
            ]);
        }

        $companyIds = $companies
            ->pluck('company_id')
            ->map(fn ($id) => (int) $id);

        if ($companyIds->unique()->count() !== $companyIds->count()) {
            throw ValidationException::withMessages([
                'companies' => 'A company cannot be assigned more than once.',
            ]);
        }

        $activeCompanies = Company::query()
            ->whereIn('id', $companyIds)
            ->where('status', 'active')
            ->get()
            ->keyBy('id');

        if ($activeCompanies->count() !== $companyIds->count()) {
            throw ValidationException::withMessages([
                'companies' => 'Select active companies only.',
            ]);
        }

        // Validate tenant branch assignments before creating the user.
        foreach ($companies as $companyData) {
            $company = $activeCompanies->get(
                (int) $companyData['company_id']
            );

            $this->validateBranchAssignments($company, $companyData);
        }

        // The user is stored in the central database.
        return DB::transaction(function () use (
            $data,
            $companies,
            $activeCompanies
        ): User {
            $subAdmin = User::create([
                'name' => trim($data['name']),
                'email' => strtolower(trim($data['email'])),
                'user_type' => 'Sub Admin',
                'status' => $data['status'] ?? 'inactive',
                'phone' => $data['phone'] ?? null,
                'location' => $data['location'] ?? null,
                'avatar' => $data['avatar'] ?? null,
                'password' => Hash::make(Str::random(40)),
            ]);
            

            foreach ($companies as $index => $companyData) {
                $companyId = (int) $companyData['company_id'];

                $company = $activeCompanies->get($companyId);

                $isDefaultCompany = filter_var(
                    $companyData['is_default'] ?? ($index === 0),
                    FILTER_VALIDATE_BOOLEAN
                );

                $subAdmin->companies()->attach($companyId, [
                    'role' => $companyData['role'] ?? 'sub_admin',
                    'status' => $companyData['status'] ?? 'active',
                    'is_default' => $isDefaultCompany,
                    'granted_by' => auth()->id(),
                    'granted_at' => now(),
                ]);

                $this->syncBranchAccess(
                    $subAdmin,
                    $company,
                    $companyData
                );
            }

            $firstCompany = $activeCompanies->first();
            if ($firstCompany) {
                $this->attachBranchAccessData($subAdmin, $firstCompany);
            }

            return $subAdmin;
        });
    }

    /**
     * Update Sub Admin details and optional access assignments.
    */
    public function updateSubAdmin(
        User $subAdmin,
        array $data
    ): User {
        $this->ensureSubAdmin($subAdmin);

        if (array_key_exists('companies', $data)) {
            $companies = collect($data['companies']);

            $companyIds = $companies
                ->pluck('company_id')
                ->map(fn ($id) => (int) $id);

            if ($companyIds->unique()->count() !== $companyIds->count()) {
                throw ValidationException::withMessages([
                    'companies' => 'A company cannot be assigned more than once.',
                ]);
            }

            $activeCompanies = Company::query()
                ->whereIn('id', $companyIds)
                ->where('status', 'active')
                ->get()
                ->keyBy('id');

            if ($activeCompanies->count() !== $companyIds->count()) {
                throw ValidationException::withMessages([
                    'companies' => 'Select active companies only.',
                ]);
            }

            foreach ($companies as $companyData) {
                $this->validateBranchAssignments(
                    $activeCompanies->get(
                        (int) $companyData['company_id']
                    ),
                    $companyData
                );
            }
        }

        return DB::transaction(function () use (
            $subAdmin,
            $data
        ): User {
            $updateData = [];
            if (isset($data['name'])) {
                $updateData['name'] = trim($data['name']);
            }
            if (isset($data['email'])) {
                $updateData['email'] = strtolower(trim($data['email']));
            }
            if (array_key_exists('phone', $data)) {
                $updateData['phone'] = $data['phone'];
            }
            if (array_key_exists('location', $data)) {
                $updateData['location'] = $data['location'];
            }
            if (array_key_exists('avatar', $data)) {
                $updateData['avatar'] = $data['avatar'];
            }
            if (isset($data['status'])) {
                $updateData['status'] = $data['status'];
            }

            if (! empty($updateData)) {
                User::query()->where('id', $subAdmin->id)->update($updateData);
            }

            if (array_key_exists('companies', $data)) {
                $companies = collect($data['companies']);

                $companyIds = $companies
                    ->pluck('company_id')
                    ->map(fn ($id) => (int) $id);

                $activeCompanies = Company::query()
                    ->whereIn('id', $companyIds)
                    ->where('status', 'active')
                    ->get()
                    ->keyBy('id');

                // Remove company assignments no longer selected.
                $subAdmin->companies()->sync([]);

                foreach ($companies as $index => $companyData) {
                    $companyId = (int) $companyData['company_id'];

                    $company = $activeCompanies->get($companyId);

                    $subAdmin->companies()->attach($companyId, [
                        'role' => $companyData['role'] ?? 'sub_admin',
                        'status' => $companyData['status'] ?? 'active',
                        'is_default' => filter_var(
                            $companyData['is_default'] ?? ($index === 0),
                            FILTER_VALIDATE_BOOLEAN
                        ),
                        'granted_by' => auth()->id(),
                        'granted_at' => now(),
                    ]);

                    $this->syncBranchAccess(
                        $subAdmin,
                        $company,
                        $companyData
                    );
                }
            }

            return User::query()
                ->where('user_type', 'Sub Admin')
                ->with('companies')
                ->findOrFail($subAdmin->id);
        });
    }

    /**
     * Update Sub Admin account status.
     */
    public function updateStatus(
        User $subAdmin,
        string $status
    ): User {
        $this->ensureSubAdmin($subAdmin);

        User::query()->where('id', $subAdmin->id)->update([
            'status' => $status,
        ]);

        return User::query()
            ->where('user_type', 'Sub Admin')
            ->with('companies')
            ->findOrFail($subAdmin->id);
    }

    /**
     * Remove a Sub Admin and revoke their branch assignments.
     */
    public function deleteSubAdmin(User $subAdmin): bool
    {
        $this->ensureSubAdmin($subAdmin);

        $companyIds = $subAdmin->companies()
            ->pluck('companies.id');

        foreach ($companyIds as $companyId) {
            $company = Company::find($companyId);

            if ($company && $company->database) {
                $company->makeCurrent();

                DB::connection('tenant')
                    ->table('branch_user_access')
                    ->where('company_id', $company->id)
                    ->where('user_id', $subAdmin->id)
                    ->update([
                        'status' => 'revoked',
                        'is_default' => false,
                        'updated_at' => now(),
                    ]);
            }
        }

        // Remove central company assignments and then the user.
        return DB::transaction(function () use ($subAdmin): bool {
            $subAdmin->companies()->detach();

            return (bool) $subAdmin->delete();
        });
    }

    /**
     * Get branch permissions for a Sub Admin in a company.
     */
    public function getBranchAccess(
        User $subAdmin,
        Company $company
    ): array {
        $this->ensureSubAdmin($subAdmin);
        $this->ensureCompanyAccess($subAdmin, $company);

        $company->makeCurrent();

        return DB::connection('tenant')
            ->table('branch_user_access')
            ->where('company_id', $company->id)
            ->where('user_id', $subAdmin->id)
            ->orderBy('branch_id')
            ->get()
            ->toArray();
    }

    /**
     * Assign or replace branch access for one company.
     */
    public function updateBranchAccess(
        User $subAdmin,
        Company $company,
        array $data
    ): array {
        $this->ensureSubAdmin($subAdmin);
        $this->ensureCompanyAccess($subAdmin, $company);
        $this->validateBranchAssignments($company, $data);

        return DB::transaction(function () use (
            $subAdmin,
            $company,
            $data
        ): array {
            $company->makeCurrent();

            $this->syncBranchAccess($subAdmin, $company, $data);

            return $this->getBranchAccess($subAdmin, $company);
        });
    }

    /**
     * Helper to load and attach branch access data onto a Sub Admin model instance.
     */
    public function attachBranchAccessData(User $subAdmin, Company $company): void
    {
        if (! $company->database) {
            return;
        }

        $company->makeCurrent();

        $userAccess = DB::connection('tenant')
            ->table('branch_user_access')
            ->where('company_id', $company->id)
            ->where('user_id', $subAdmin->id)
            ->where('status', '!=', 'revoked')
            ->get();

        $branches = Branch::query()
            ->where('company_id', $company->id)
            ->get(['id', 'name', 'code', 'city', 'status'])
            ->keyBy('id');

        $branchIds = $userAccess->pluck('branch_id')->map(fn ($bId) => (int) $bId)->values()->all();
        $defaultRecord = $userAccess->firstWhere('is_default', 1) ?? $userAccess->first();

        $subAdmin->setAttribute('branch_ids', $branchIds);
        $subAdmin->setAttribute('primary_branch_id', $defaultRecord ? (int) $defaultRecord->branch_id : ($branchIds[0] ?? null));
        $subAdmin->setAttribute('branch_access_status', $defaultRecord?->status ?? 'active');
        $subAdmin->setAttribute('assigned_branches', $userAccess->map(function ($acc) use ($branches) {
            $b = $branches->get($acc->branch_id);
            return [
                'id' => (int) $acc->branch_id,
                'name' => $b?->name ?? "Branch #{$acc->branch_id}",
                'code' => $b?->code ?? '',
                'city' => $b?->city ?? '',
                'is_default' => (bool) $acc->is_default,
                'status' => $acc->status,
            ];
        })->values()->all());
        $subAdmin->syncOriginal();
    }

    /**
     * Validate the requested branches in the selected tenant.
     */
    private function validateBranchAssignments(
        Company $company,
        array $data
    ): void {
        if (! $company->database) {
            throw ValidationException::withMessages([
                'company_id' => 'The selected company has no tenant database configured.',
            ]);
        }

        $branchIds = collect($data['branches'] ?? [])
            ->map(function ($branch) {
                return (int) (
                    is_array($branch)
                        ? ($branch['branch_id'] ?? $branch['id'] ?? 0)
                        : $branch
                );
            })
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values();

        if ($branchIds->isEmpty()) {
            throw ValidationException::withMessages([
                'branches' => 'Select at least one branch.',
            ]);
        }

        $company->makeCurrent();

        $branches = Branch::query()
            ->where('company_id', $company->id)
            ->whereIn('id', $branchIds)
            ->where('status', 'active')
            ->get(['id']);

        if ($branches->count() !== $branchIds->count()) {
            throw ValidationException::withMessages([
                'branches' => 'One or more selected branches are invalid or inactive.',
            ]);
        }

        $defaultBranchId = isset($data['default_branch_id'])
            ? (int) $data['default_branch_id']
            : null;

        if (
            $defaultBranchId !== null
            && ! $branchIds->contains($defaultBranchId)
        ) {
            throw ValidationException::withMessages([
                'default_branch_id' => 'The default branch must be one of the assigned branches.',
            ]);
        }
    }

    /**
     * Synchronize branch access in the company's tenant database.
     */
    private function syncBranchAccess(
        User $subAdmin,
        Company $company,
        array $data
    ): void {
        $company->makeCurrent();

        $connection = DB::connection('tenant');

        $branchIds = collect($data['branches'] ?? [])
            ->map(function ($branch) {
                return (int) (
                    is_array($branch)
                        ? ($branch['branch_id'] ?? $branch['id'] ?? 0)
                        : $branch
                );
            })
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values();

        $defaultBranchId = isset($data['default_branch_id'])
            ? (int) $data['default_branch_id']
            : (int) $branchIds->first();

        // Keep the selected branch assignments and revoke removed ones.
        $existingIds = $connection
            ->table('branch_user_access')
            ->where('company_id', $company->id)
            ->where('user_id', $subAdmin->id)
            ->pluck('branch_id');

        $removedIds = $existingIds->diff($branchIds);

        if ($removedIds->isNotEmpty()) {
            $connection->table('branch_user_access')
                ->where('company_id', $company->id)
                ->where('user_id', $subAdmin->id)
                ->whereIn('branch_id', $removedIds)
                ->update([
                    'status' => 'revoked',
                    'is_default' => false,
                    'updated_at' => now(),
                ]);
        }

        foreach ($branchIds as $branchId) {
            $connection->table('branch_user_access')->updateOrInsert(
                [
                    'company_id' => $company->id,
                    'user_id' => $subAdmin->id,
                    'branch_id' => $branchId,
                ],
                [
                    'role' => 'sub_admin',
                    'status' => $data['branch_access_status'] ?? 'active',
                    'is_default' => $branchId === $defaultBranchId,
                    'granted_by' => auth()->id(),
                    'granted_at' => now(),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    /**
     * Confirm the user is a Sub Admin.
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
     * Confirm the Sub Admin has a company assignment.
     */
    private function ensureCompanyAccess(
        User $subAdmin,
        Company $company
    ): void {
        $hasAccess = $subAdmin->companies()
            ->where('companies.id', $company->id)
            ->wherePivot('status', 'active')
            ->exists();

        abort_unless(
            $hasAccess,
            403,
            'The Sub Admin does not have active access to this company.'
        );
    }
}
