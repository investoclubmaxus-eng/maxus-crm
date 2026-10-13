<?php

namespace App\Http\Requests\Superadmin\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminCompanyAccessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'company_id' => [
                'required',
                'integer',
                'exists:companies,id',
            ],

            'role' => [
                'nullable',
                'string',
                'max:50',
            ],

            'status' => [
                'nullable',
                Rule::in([
                    'pending',
                    'active',
                    'inactive',
                    'revoked',
                ]),
            ],

            'is_default' => [
                'nullable',
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'company_id.required' => 'Company is required.',
            'company_id.exists' => 'The selected company does not exist.',
            'role.max' => 'Role may not exceed 50 characters.',
            'status.in' => 'The selected company access status is invalid.',
            'is_default.boolean' => 'Default company value must be true or false.',
        ];
    }
}
