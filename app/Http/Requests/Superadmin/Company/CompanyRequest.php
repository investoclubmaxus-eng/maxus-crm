<?php

namespace App\Http\Requests\Superadmin\Company;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompanyRequest extends FormRequest
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
        $companyId = $this->route('company');

        return [
            /*
            |--------------------------------------------------------------------------
            | Company Information
            |--------------------------------------------------------------------------
            */

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'code' => [
                'required',
                'string',
                'max:100',
                'alpha_dash',
                Rule::unique('companies', 'code')->ignore($companyId),
            ],

            /*
            |--------------------------------------------------------------------------
            | Contact Information
            |--------------------------------------------------------------------------
            */

            'email' => [
                'nullable',
                'email',
                'max:255',
            ],

            'phone' => [
                'nullable',
                'string',
                'regex:/^[0-9]{10}$/',
            ],

            'website' => [
                'nullable',
                'url',
                'max:255',
            ],

            /*
            |--------------------------------------------------------------------------
            | Business Information
            |--------------------------------------------------------------------------
            */

            'industry' => [
                'nullable',
                'string',
                'max:150',
            ],

            /*
            |--------------------------------------------------------------------------
            | Address
            |--------------------------------------------------------------------------
            */

            'address' => [
                'nullable',
                'string',
            ],

            'city' => [
                'nullable',
                'string',
                'max:100',
            ],

            'state' => [
                'nullable',
                'string',
                'max:100',
            ],

            'country' => [
                'nullable',
                'string',
                'max:100',
            ],

            'postal_code' => [
                'nullable',
                'string',
                'regex:/^[0-9]{1,6}$/',
            ],

            /*
            |--------------------------------------------------------------------------
            | Company Branding
            |--------------------------------------------------------------------------
            */

            'logo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],

            'remove_logo' => [
                'sometimes',
                'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | Company Status
            |--------------------------------------------------------------------------
            */

            'status' => [
                'nullable',
                Rule::in([
                    'pending',
                    'active',
                    'inactive',
                    'suspended',
                ]),
            ],
        ];
    }


     /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Company name is required.',

            'code.required' => 'Company code is required.',
            'code.alpha_dash' => 'Company code may only contain letters, numbers, dashes and underscores.',
            'code.unique' => 'This company code is already in use.',

            'email.email' => 'Please enter a valid company email address.',

            'website.url' => 'Please enter a valid website URL.',

            'phone.regex' => 'Phone number must contain exactly 10 digits.',

            'postal_code.regex' => 'Postal code must contain a number with more than 6 digits.',

            'logo.image' => 'The company logo must be a valid image.',
            'logo.mimes' => 'The company logo must be JPG, JPEG, PNG or WEBP.',
            'logo.max' => 'The company logo may not be larger than 2 MB.',

            'status.in' => 'The selected company status is invalid.',
        ];
    }

    /**
     * Prepare input before validation.
     */
    protected function prepareForValidation(): void
    {
        $phone = $this->input('phone');

        $this->merge([
            'name' => $this->name
                ? trim($this->name)
                : null,

            'code' => $this->code
                ? strtoupper(trim($this->code))
                : null,

            'email' => $this->email
                ? strtolower(trim($this->email))
                : null,

            'website' => $this->website
                ? trim($this->website)
                : null,

            'phone' => is_string($phone)
                ? (trim($phone) !== '' ? trim($phone) : null)
                : $phone,

            'industry' => $this->industry
                ? trim($this->industry)
                : null,

            'city' => $this->city
                ? trim($this->city)
                : null,

            'state' => $this->state
                ? trim($this->state)
                : null,

            'country' => $this->country
                ? trim($this->country)
                : 'India',

            'postal_code' => $this->postal_code
                ? trim($this->postal_code)
                : null,
        ]);
    }
}
