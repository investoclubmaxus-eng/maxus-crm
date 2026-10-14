<?php

namespace App\Services\Superadmin\Admin;

use App\Models\Company;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminService
{
    /**
     * Get all admins.
     */
    public function getAllAdmins()
    {
        return User::query()
            ->whereRaw('LOWER(user_type) = ?', ['admin'])
            ->with([
                'companies' => function ($query) {
                    $query->select(
                        'companies.id',
                        'companies.name',
                        'companies.code',
                        'companies.status'
                    );
                },
            ])
            ->withExists([
                'adminInvitations as has_accepted_invitation' => fn ($query) => $query
                    ->whereNotNull('accepted_at'),
                'adminInvitations as has_revoked_invitation' => fn ($query) => $query
                    ->whereNotNull('revoked_at'),
                'adminInvitations as has_pending_invitation' => fn ($query) => $query
                    ->whereNull('accepted_at')
                    ->whereNull('revoked_at')
                    ->where('expires_at', '>', now()),
            ])
            ->latest()
            ->get();
    }

    /**
     * Get single admin.
     */
    public function getAdmin(int $id): User
    {
        return User::query()
            ->whereRaw('LOWER(user_type) = ?', ['admin'])
            ->with([
                'companies' => function ($query) {
                    $query->select(
                        'companies.id',
                        'companies.name',
                        'companies.code',
                        'companies.status'
                    );
                },
            ])
            ->findOrFail($id);
    }

    /**
     * Create admin.
     */
    public function createAdmin(array $data): User
    {

        $admin = DB::transaction(function () use ($data) {
            $requestedCompanyIds = collect($data['companies'] ?? [])
                ->pluck('company_id')
                ->map(fn ($companyId): int => (int) $companyId);
            $activeCompanies = Company::query()
                ->whereIn('id', $requestedCompanyIds)
                ->where('status', 'active')
                ->get()
                ->keyBy('id');

            if ($activeCompanies->count() !== $requestedCompanyIds->unique()->count()) {
                abort(422, 'Select active companies only.');
            }

            /*
             * We are not asking the Super Admin to create
             * a permanent password here.
             *
             * A random password is stored temporarily.
             * The invitation / set-password flow can be
             * connected next.
             */
            $temporaryPassword = Str::random(40);

            $admin = User::create([
                'name' => $data['name'],
                'email' => strtolower(trim($data['email'])),
                'user_type' => 'admin',
                'status' => $data['status'] ?? 'inactive',
                'phone' => isset($data['phone'])
                    ? '+91'.$data['phone']
                    : null,
                'location' => $data['location'] ?? null,
                'password' => Hash::make($temporaryPassword),
            ]);

            if (($data['avatar'] ?? null) instanceof UploadedFile) {
                $admin->avatar = $this->storeAvatar(
                    $data['avatar'],
                    $admin->id
                );
                $admin->save();
            }

            /*
             * Company access
             */
            if (! empty($data['companies'])) {

                foreach ($data['companies'] as $index => $companyData) {

                    $company = $activeCompanies->get(
                        (int) $companyData['company_id']
                    );

                    $isDefault = isset($companyData['is_default'])
                        ? filter_var(
                            $companyData['is_default'],
                            FILTER_VALIDATE_BOOLEAN
                        )
                        : $index === 0;

                    DB::table('company_user_access')->insert([
                        'user_id' => $admin->id,
                        'company_id' => $company->id,
                        'role' => $companyData['role'] ?? 'admin',
                        'status' => $companyData['status'] ?? 'active',
                        'is_default' => $isDefault,
                        'granted_by' => auth()->id(),
                        'granted_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            return $admin;
        });

        return $admin->fresh([
            'companies',
        ]);
    }

    /**
     * Update admin.
     */
    public function updateAdmin(User $admin, array $data): User
    {
        $previousAvatar = $admin->avatar;
        $updatedAdmin = DB::transaction(function () use ($admin, $data) {
            if (array_key_exists('companies', $data)) {
                $existingCompanyAccess = $admin->companies()
                    ->get()
                    ->keyBy('id');
                $requestedCompanyIds = collect($data['companies'])
                    ->pluck('company_id')
                    ->map(fn ($companyId): int => (int) $companyId);
                $availableCompanies = Company::query()
                    ->whereIn('id', $requestedCompanyIds)
                    ->where(function ($query) use ($existingCompanyAccess) {
                        $query
                            ->where('status', 'active')
                            ->orWhereIn('id', $existingCompanyAccess->keys());
                    })
                    ->get()
                    ->keyBy('id');

                if (
                    $availableCompanies->count() !==
                    $requestedCompanyIds->unique()->count()
                ) {
                    abort(
                        422,
                        'Select active companies only, except for existing company access.'
                    );
                }

                $companyAccess = collect($data['companies'])
                    ->mapWithKeys(function (array $companyData) use (
                        $existingCompanyAccess
                    ): array {
                        $companyId = (int) $companyData['company_id'];
                        $existingPivot = $existingCompanyAccess
                            ->get($companyId)
                            ?->pivot;

                        return [
                            $companyId => [
                                'role' => $companyData['role']
                                    ?? $existingPivot?->role
                                    ?? 'admin',
                                'status' => $companyData['status']
                                    ?? $existingPivot?->status
                                    ?? 'active',
                                'is_default' => filter_var(
                                    $companyData['is_default'] ?? false,
                                    FILTER_VALIDATE_BOOLEAN
                                ),
                                'granted_by' => $existingPivot?->granted_by
                                    ?? auth()->id(),
                                'granted_at' => $existingPivot?->granted_at
                                    ?? now(),
                            ],
                        ];
                    });

                $admin->companies()->sync($companyAccess->all());
            }

            $admin->name = $data['name'];
            $admin->email = strtolower(trim($data['email']));
            $admin->phone = isset($data['phone'])
                ? '+91'.$data['phone']
                : null;
            $admin->location = $data['location'] ?? null;

            if (isset($data['status'])) {
                $admin->status = $data['status'];
            }

            if (($data['avatar'] ?? null) instanceof UploadedFile) {
                $admin->avatar = $this->storeAvatar(
                    $data['avatar'],
                    $admin->id
                );
            }

            $admin->save();

            return $admin->fresh([
                'companies',
            ]);
        });

        if (($data['avatar'] ?? null) instanceof UploadedFile) {
            $this->deleteAvatar($previousAvatar);
        }

        return $updatedAdmin;
    }

    private function storeAvatar(UploadedFile $avatar, int $userId): string
    {
        $directory = public_path('profile-images');
        File::ensureDirectoryExists($directory);

        $filename = 'user_'.$userId.'_'.Str::uuid().'.'.$avatar->extension();
        $avatar->move($directory, $filename);

        return '/profile-images/'.$filename;
    }

    private function deleteAvatar(?string $avatarPath): void
    {
        if (! $avatarPath || ! str_starts_with($avatarPath, '/profile-images/')) {
            return;
        }

        File::delete(
            public_path('profile-images/'.basename($avatarPath))
        );
    }

    /**
     * Update admin status.
     */
    public function updateStatus(User $admin, string $status): User
    {
        $admin->status = $status;
        $admin->save();

        return $admin->fresh([
            'companies',
        ]);
    }

    /**
     * Delete admin.
     */
    public function deleteAdmin(User $admin): bool
    {
        return DB::transaction(function () use ($admin) {

            /*
             * Remove company access first.
             */
            $admin->companies()->detach();

            /*
             * Delete user.
             */
            return (bool) $admin->delete();
        });
    }

    /**
     * Get admin company access.
     */
    public function getCompanyAccess(User $admin)
    {
        return $admin->companies()
            ->withPivot([
                'role',
                'status',
                'is_default',
                'granted_by',
                'granted_at',
            ])
            ->get();
    }

    /**
     * Grant company access to admin.
     */
    public function grantCompanyAccess(
        User $admin,
        array $data
    ): User {
        return DB::transaction(function () use ($admin, $data) {

            User::query()
                ->whereKey($admin->id)
                ->lockForUpdate()
                ->firstOrFail();

            $company = Company::findOrFail($data['company_id']);

            /*
             * Prevent duplicate access.
             */
            $alreadyExists = $admin->companies()
                ->where('companies.id', $company->id)
                ->exists();

            if ($alreadyExists) {
                abort(422, 'This admin already has access to this company.');
            }

            if ($admin->companies()->count() >= 2) {
                abort(422, 'An admin can access a maximum of 2 companies.');
            }

            /*
             * If this is the first company,
             * automatically make it default.
             */
            $hasExistingAccess = $admin->companies()->exists();

            $isDefault = $data['is_default'] ?? ! $hasExistingAccess;

            /*
             * If setting this company as default,
             * remove default from other companies.
             */
            if ($isDefault) {
                DB::table('company_user_access')
                    ->where('user_id', $admin->id)
                    ->update([
                        'is_default' => false,
                    ]);
            }

            $admin->companies()->attach($company->id, [
                'role' => $data['role'] ?? 'admin',
                'status' => $data['status'] ?? 'active',
                'is_default' => $isDefault,
                'granted_by' => auth()->id(),
                'granted_at' => now(),
            ]);

            return $admin->fresh([
                'companies',
            ]);
        });
    }

    /**
     * Update company access.
     */
    public function updateCompanyAccess(
        User $admin,
        Company $company,
        array $data
    ): User {
        return DB::transaction(function () use ($admin, $company, $data) {

            $accessExists = $admin->companies()
                ->where('companies.id', $company->id)
                ->exists();

            if (! $accessExists) {
                abort(404, 'Company access not found.');
            }

            if (($data['is_default'] ?? false) === true) {
                DB::table('company_user_access')
                    ->where('user_id', $admin->id)
                    ->update([
                        'is_default' => false,
                    ]);
            }

            $admin->companies()->updateExistingPivot(
                $company->id,
                [
                    'role' => $data['role'] ?? 'admin',
                    'status' => $data['status'] ?? 'active',
                    'is_default' => $data['is_default'] ?? false,
                ]
            );

            return $admin->fresh([
                'companies',
            ]);
        });
    }

    /**
     * Revoke/remove company access.
     */
    public function revokeCompanyAccess(
        User $admin,
        Company $company
    ): User {
        DB::transaction(function () use ($admin, $company) {

            $access = DB::table('company_user_access')
                ->where('user_id', $admin->id)
                ->where('company_id', $company->id)
                ->first();

            if (! $access) {
                abort(404, 'Company access not found.');
            }

            /*
             * Instead of deleting the record,
             * mark it revoked.
             */
            DB::table('company_user_access')
                ->where('user_id', $admin->id)
                ->where('company_id', $company->id)
                ->update([
                    'status' => 'revoked',
                    'is_default' => false,
                ]);
        });

        return $admin->fresh([
            'companies',
        ]);
    }

    /**
     * Set default company.
     */
    public function setDefaultCompany(
        User $admin,
        Company $company
    ): User {
        return DB::transaction(function () use ($admin, $company) {

            $access = DB::table('company_user_access')
                ->where('user_id', $admin->id)
                ->where('company_id', $company->id)
                ->where('status', 'active')
                ->exists();

            if (! $access) {
                abort(
                    422,
                    'Admin does not have active access to this company.'
                );
            }

            DB::table('company_user_access')
                ->where('user_id', $admin->id)
                ->update([
                    'is_default' => false,
                ]);

            DB::table('company_user_access')
                ->where('user_id', $admin->id)
                ->where('company_id', $company->id)
                ->update([
                    'is_default' => true,
                ]);

            return $admin->fresh([
                'companies',
            ]);
        });
    }
}
