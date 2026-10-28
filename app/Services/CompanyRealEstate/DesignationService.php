<?php

namespace App\Services\CompanyRealEstate;

use App\Models\Designation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class DesignationService
{
    public function getAll(array $filters = []): LengthAwarePaginator
    {
        $query = Designation::query()
            ->with([
                'company:id,name,code',
                'department:id,name,department_code',
            ]);

        if (!empty($filters['company_id'])) {
            $query->where('company_id', $filters['company_id']);
        }

        if (!empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        if (!empty($filters['industry'])) {
            $query->where('industry', $filters['industry']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('designation_code', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        return $query->latest('id')
            ->paginate((int) ($filters['per_page'] ?? 10));
    }

    public function getById(int $id): Designation
    {
        return Designation::with([
            'company:id,name,code',
            'department:id,name,department_code',
        ])->findOrFail($id);
    }

    public function create(array $data): Designation
    {
        $data['name'] = trim($data['name']);
        $data['designation_code'] = strtoupper(
            trim($data['designation_code'])
        );
        $data['slug'] = Str::slug($data['slug']);
        $data['industry'] = trim($data['industry']);

        return Designation::create($data)->load([
            'company:id,name,code',
            'department:id,name,department_code',
        ]);
    }

    public function update(int $id, array $data): Designation
    {
        $designation = Designation::findOrFail($id);

        $data['name'] = trim($data['name']);
        $data['designation_code'] = strtoupper(
            trim($data['designation_code'])
        );
        $data['slug'] = Str::slug($data['slug']);
        $data['industry'] = trim($data['industry']);

        $designation->update($data);

        return $designation->fresh()->load([
            'company:id,name,code',
            'department:id,name,department_code',
        ]);
    }

    public function delete(int $id): bool
    {
        $designation = Designation::findOrFail($id);

        return (bool) $designation->delete();
    }
}