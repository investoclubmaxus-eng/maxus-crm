<?php

namespace App\Http\Requests\CompanyRealEstate\Department;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDepartmentRequest extends FormRequest
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
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $companyId = $this->header('X-Company-Id')
            ?? $this->input('company_id')
            ?? $this->user()?->companies()->first()?->id;

        return [
            'company_id' => [
                'nullable',
                'integer',
                'exists:companies,id',
            ],
            'industry' => [
                'nullable',
                'string',
                'max:150',
            ],
            'department_code' => [
                'nullable',
                'string',
                'max:30',
                Rule::unique('departments', 'department_code')->where(function ($q) use ($companyId) {
                    if ($companyId) {
                        $q->where('company_id', $companyId);
                    }
                    return $q;
                }),
            ],
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('departments', 'name')->where(function ($q) use ($companyId) {
                    if ($companyId) {
                        $q->where('company_id', $companyId);
                    }
                    return $q;
                }),
            ],
            'slug' => [
                'nullable',
                'string',
                'max:120',
                Rule::unique('departments', 'slug')->where(function ($q) use ($companyId) {
                    if ($companyId) {
                        $q->where('company_id', $companyId);
                    }
                    return $q;
                }),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'status'      => ['required', Rule::in(['active', 'inactive'])],
        ];
    }

    public function messages(): array
    {
        return [
            'department_code.unique' => 'This department code already exists in your company.',
            'department_code.max'    => 'Department code must not exceed 30 characters.',
            'name.required'          => 'Department name is required.',
            'name.unique'            => 'This department name already exists in your company.',
            'name.max'               => 'Department name must not exceed 100 characters.',
            'slug.unique'            => 'This department slug already exists in your company.',
            'slug.max'               => 'Department slug must not exceed 120 characters.',
            'description.max'        => 'Description must not exceed 500 characters.',
            'status.required'        => 'Department status is required.',
            'status.in'              => 'Status must be active or inactive.',
        ];
    }
}
