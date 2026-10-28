<?php

namespace App\Http\Requests\CompanyRealEstate\Designation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDesignationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

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

            'department_id' => [
                'required',
                'integer',
                'exists:departments,id',
            ],

            'designation_code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('designations', 'designation_code')->where(function ($q) use ($companyId) {
                    if ($companyId) {
                        $q->where('company_id', $companyId);
                    }
                    return $q;
                }),
            ],

            'name' => [
                'required',
                'string',
                'max:150',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:180',
                Rule::unique('designations', 'slug')->where(function ($q) use ($companyId) {
                    if ($companyId) {
                        $q->where('company_id', $companyId);
                    }
                    return $q;
                }),
            ],

            'industry' => [
                'nullable',
                'string',
                'max:100',
            ],

            'description' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'status' => [
                'required',
                Rule::in(['active', 'inactive']),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'             => 'Designation name is required.',
            'name.max'                  => 'Designation name must not exceed 150 characters.',
            'designation_code.unique'   => 'This designation code already exists in your company.',
            'slug.unique'               => 'This slug already exists in your company.',
            'department_id.required'    => 'Please select a department for this designation.',
            'department_id.exists'      => 'The selected department does not exist.',
            'status.required'           => 'Status is required.',
            'status.in'                 => 'Status must be active or inactive.',
        ];
    }
}
