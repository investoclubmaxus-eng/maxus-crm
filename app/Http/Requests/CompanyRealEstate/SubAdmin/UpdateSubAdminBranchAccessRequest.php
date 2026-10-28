<?php

namespace App\Http\Requests\CompanyRealEstate\SubAdmin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubAdminBranchAccessRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'company_id' => ['required', 'integer', 'exists:companies,id'],
            'branches' => ['required', 'array', 'min:1'],
            'branches.*' => ['required', 'integer', 'distinct', 'min:1'],
            'default_branch_id' => ['required', 'integer', 'min:1'],
            'branch_access_status' => [
                'sometimes',
                Rule::in(['active', 'pending', 'inactive']),
            ],
        ];
    }
}
