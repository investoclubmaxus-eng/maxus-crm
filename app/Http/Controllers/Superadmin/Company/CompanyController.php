<?php

namespace App\Http\Controllers\Superadmin\Company;

use App\Http\Controllers\Controller;
use App\Http\Requests\Superadmin\Company\CompanyRequest;
use App\Models\Company;
use App\Services\Superadmin\Company\CompanyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function __construct(
        private CompanyService $companyService
    ) {
    }

    /**
     * Get all companies.
     */
    public function index(): JsonResponse
    {
        $companies = $this->companyService->getAllCompanies();

        if($companies->isEmpty()){
            return response()->json([
                'success' => true,
                'message' => 'No companies found.',
                
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Companies retrieved successfully.',
            'data' => $companies,
        ]);
    }

    /**
     * Create a new company.
     */
    public function store(CompanyRequest $request): JsonResponse
    {
        $company = $this->companyService->create(
            $request->validated(),
            $request->file('logo')
        );

        return response()->json([
            'success' => true,
            'message' => 'Company created successfully.',
            'data' => $company,
        ], 201);
    }

    /**
     * Get a single company.
     */
    public function show(Company $company): JsonResponse
    {
        $company = $this->companyService->getCompany($company->id);

        

        return response()->json([
            'success' => true,
            'message' => 'Company retrieved successfully.',
            'data' => $company,
        ]);
    }

    /**
     * Update company.
     */
    public function update(
        CompanyRequest $request,
        Company $company
    ): JsonResponse {
        $company = $this->companyService->update(
            $company,
            $request->validated(),
            $request->file('logo')
        );

        return response()->json([
            'success' => true,
            'message' => 'Company updated successfully.',
            'data' => $company,
        ]);
    }

    /**
     * Update company status.
     */
    public function updateStatus(
        Request $request,
        Company $company
    ): JsonResponse {
        $validated = $request->validate([
            'status' => [
                'required',
                'in:pending,active,inactive,suspended',
            ],
        ]);

        $company = $this->companyService->updateStatus(
            $company,
            $validated['status']
        );

        return response()->json([
            'success' => true,
            'message' => 'Company status updated successfully.',
            'data' => $company,
        ]);
    }

    /**
     * Delete company.
     */
    public function destroy(Company $company): JsonResponse
    {
        $this->companyService->delete($company);

        return response()->json([
            'success' => true,
            'message' => 'Company deleted successfully.',
        ]);
    }
}