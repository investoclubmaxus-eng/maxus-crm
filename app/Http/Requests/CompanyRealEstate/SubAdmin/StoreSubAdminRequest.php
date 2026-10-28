<?php

namespace App\Http\Requests\CompanyRealEstate\SubAdmin;

use App\Models\Company;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSubAdminRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Prepare data before validation.
     */
    protected function prepareForValidation(): void
    {
        // Support flat payload from company real estate UI:
        if (! $this->has('companies') || empty($this->input('companies'))) {
            $companyId = $this->input('company_id')
                ?? $this->header('X-Company-Id')
                ?? $this->query('company_id');

            // If not found in input/header, fall back to user's active company
            if (! $companyId && $this->user()) {
                $userCompany = $this->user()->companies()
                    ->where('companies.status', 'active')
                    ->wherePivot('status', 'active')
                    ->first();
                $companyId = $userCompany?->id;
            }

            $rawBranches = $this->input('branches')
                ?? $this->input('branch_ids')
                ?? [];

            $branchIds = collect($rawBranches)
                ->map(fn ($b) => (int) (is_array($b) ? ($b['branch_id'] ?? $b['id'] ?? 0) : $b))
                ->filter(fn ($id) => $id > 0)
                ->unique()
                ->values()
                ->all();

            $defaultBranchId = $this->input('default_branch_id')
                ?? $this->input('primary_branch_id')
                ?? ($branchIds[0] ?? null);

            $branchStatus = $this->input('branch_access_status') ?? 'active';

            if ($companyId) {
                $this->merge([
                    'companies' => [
                        [
                            'company_id' => (int) $companyId,
                            'role' => 'sub_admin',
                            'status' => 'active',
                            'is_default' => true,
                            'branches' => $branchIds,
                            'default_branch_id' => $defaultBranchId ? (int) $defaultBranchId : null,
                            'branch_access_status' => $branchStatus,
                        ],
                    ],
                ]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],
            'phone' => ['nullable', 'string', 'regex:/^[0-9]{10}$/'],
            'location' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'avatar' => [
                'nullable',
            ],

            'companies' => ['required', 'array', 'min:1'],
            'companies.*.company_id' => ['required', 'integer', 'exists:companies,id'],
            'companies.*.role' => ['nullable', 'string'],
            'companies.*.status' => ['nullable', Rule::in(['active', 'inactive'])],
            'companies.*.is_default' => ['nullable', 'boolean'],
            'companies.*.branches' => ['required', 'array', 'min:1'],
            'companies.*.branches.*' => ['required'],
            'companies.*.default_branch_id' => ['required', 'integer'],
            'companies.*.branch_access_status' => ['nullable', Rule::in(['active', 'pending', 'inactive'])],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Full name is required.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email address is already registered.',
            'phone.regex' => 'Phone number must be exactly 10 digits.',
            'companies.required' => 'Please assign a company and at least one branch.',
            'companies.*.branches.required' => 'Please assign at least one branch to this sub-admin.',
            'companies.*.default_branch_id.required' => 'Please choose a primary branch.',
        ];
    }
}
