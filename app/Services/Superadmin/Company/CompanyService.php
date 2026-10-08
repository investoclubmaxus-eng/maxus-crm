<?php

namespace App\Services\Superadmin\Company;

use App\Models\Company;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CompanyService
{
    /**
     * Get all companies.
     */
    public function getAllCompanies()
    {
        //dd("hello");
        return Company::with('creator')
            ->latest()
            ->get();
            
    }

    /**
     * Get a single company.
     */
    public function getCompany(int $id): Company
    {
        return Company::with('creator')
            ->findOrFail($id);
    }

    /**
     * Create a new company.
     */
    public function create(array $data, ?UploadedFile $logo = null): Company
    {
        return DB::transaction(function () use ($data, $logo) {

            $company = new Company();

            $company->name = $data['name'];
            $company->code = $data['code'];
            $company->email = $data['email'] ?? null;
            $company->phone = $this->formatPhoneForStorage($data['phone'] ?? null);
            $company->website = $data['website'] ?? null;
            $company->industry = $data['industry'] ?? null;

            $company->address = $data['address'] ?? null;
            $company->city = $data['city'] ?? null;
            $company->state = $data['state'] ?? null;
            $company->country = $data['country'] ?? 'India';
            $company->postal_code = $data['postal_code'] ?? null;

            /*
             * New companies should normally start as pending.
             * Super Admin can activate them later.
             */
            $company->status = $data['status'] ?? 'pending';

            /*
             * Store the Super Admin who created the company.
             */
            $company->created_by = auth()->id();

            /*
             * Company logo.
             *
             * We will connect this with your centralized
             * File / Storage Settings service.
             */
            if ($logo) {
                $company->logo_path = $this->storeLogo($logo);
            }

            $company->save();

            return $company->fresh('creator');
        });
    }

    /**
     * Update an existing company.
     */
    public function update(
        Company $company,
        array $data,
        ?UploadedFile $logo = null
    ): Company {
        return DB::transaction(function () use ($company, $data, $logo) {

            $company->name = $data['name'];
            $company->code = $data['code'];
            $company->email = $data['email'] ?? null;
            $company->phone = $this->formatPhoneForStorage($data['phone'] ?? null);
            $company->website = $data['website'] ?? null;
            $company->industry = $data['industry'] ?? null;

            $company->address = $data['address'] ?? null;
            $company->city = $data['city'] ?? null;
            $company->state = $data['state'] ?? null;
            $company->country = $data['country'] ?? 'India';
            $company->postal_code = $data['postal_code'] ?? null;

            if (isset($data['status'])) {
                $company->status = $data['status'];
            }

            $removeLogo = (bool) ($data['remove_logo'] ?? false);

            if ($removeLogo) {
                $this->deleteLogo($company->logo_path);
                $company->logo_path = null;
            }

            if ($logo) {
                if (!$removeLogo) {
                    $this->deleteLogo($company->logo_path);
                }

                $company->logo_path = $this->storeLogo($logo);
            }

            $company->save();

            return $company->fresh('creator');
        });
    }

    /**
     * Change company status.
     */
    public function updateStatus(
        Company $company,
        string $status
    ): Company {
        $company->status = $status;
        $company->save();

        return $company->fresh();
    }

    /**
     * Delete a company.
     *
     * Uses SoftDeletes from the Company model.
     */
    public function delete(Company $company): bool
    {
        return DB::transaction(function () use ($company) {

            $this->deleteLogo($company->logo_path);

            return (bool) $company->delete();
        });
    }

    /**
     * Store company logo.
     *
     * Temporary implementation.
     *
     * We will replace this with the centralized
     * File / Storage service once that service is connected.
     */
    private function storeLogo(UploadedFile $logo): string
    {
        return $logo->store(
            'settings/companies',
            'public'
        );
    }

    /**
     * Delete company logo.
     */
    private function deleteLogo(?string $path): void
    {
        if (!$path) {
            return;
        }

        Storage::disk('public')->delete($path);
    }

    private function formatPhoneForStorage(?string $phone): ?string
    {
        return $phone === null ? null : '+91'.$phone;
    }
}