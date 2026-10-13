<?php

namespace App\Http\Requests\Superadmin\Admin;

use App\Models\User;
use App\Services\Superadmin\Settings\FileStorageSettingService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class AdminRequest extends FormRequest
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
        $admin = $this->route('admin');

        $adminId = is_object($admin)
            ? $admin->id
            : $admin;
        $existingCompanyIds = $admin instanceof User
            ? $admin->companies()->pluck('companies.id')->all()
            : [];
        $fileStorageSettingService = app(FileStorageSettingService::class);
        $fileStorageSettings = $fileStorageSettingService->getFileStorageSettings();
        $allowedFileTypes = $fileStorageSettingService->getAllowedFileTypes(
            $fileStorageSettings
        );
        $avatarRules = [
            'nullable',
            'image',
            'max:'.($fileStorageSettings->max_upload_size * 1024),
        ];

        if ($allowedFileTypes === []) {
            $avatarRules[] = 'prohibited';
        } else {
            $extensions = implode(',', $allowedFileTypes);
            $avatarRules[] = 'mimes:'.$extensions;
            $avatarRules[] = 'extensions:'.$extensions;
        }

        return [
            /*
            |--------------------------------------------------------------------------
            | Personal Information
            |--------------------------------------------------------------------------
            */

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->ignore($adminId),
            ],

            'phone' => [
                'nullable',
                'string',
                'regex:/^[0-9]{10}$/',
            ],

            'location' => [
                'nullable',
                'string',
                'max:255',
            ],

            'avatar' => $avatarRules,

            /*
            |--------------------------------------------------------------------------
            | Account
            |--------------------------------------------------------------------------
            */

            'status' => [
                'nullable',
                Rule::in([
                    'active',
                    'inactive',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | Company Access
            |--------------------------------------------------------------------------
            */

            'companies' => [
                $this->isMethod('post') ? 'required' : 'nullable',
                'array',
                'min:1',
                'max:2',
            ],

            'companies.*.company_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('companies', 'id')
                    ->where(fn ($query) => $query
                        ->where('status', 'active')
                        ->orWhereIn('id', $existingCompanyIds))
                    ->whereNull('deleted_at'),
            ],

            'companies.*.role' => [
                'nullable',
                'string',
                'max:50',
            ],

            'companies.*.status' => [
                'nullable',
                Rule::in([
                    'pending',
                    'active',
                    'inactive',
                    'revoked',
                ]),
            ],

            'companies.*.is_default' => [
                'nullable',
                'boolean',
            ],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Admin name is required.',

            'email.required' => 'Admin email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email address is already registered.',

            'phone.regex' => 'Phone number must contain exactly 10 digits.',

            'avatar.image' => 'Profile photo must be a valid image.',
            'avatar.mimes' => 'Profile photo type must be allowed by File Storage settings.',
            'avatar.extensions' => 'Profile photo extension must be allowed by File Storage settings.',
            'avatar.max' => 'Profile photo exceeds the maximum size configured in File Storage settings.',
            'avatar.prohibited' => 'No valid file types are configured for profile photos in File Storage settings.',

            'status.in' => 'The selected admin status is invalid.',

            'companies.array' => 'Company access must be a valid list.',
            'companies.max' => 'An admin can access a maximum of 2 companies.',

            'companies.*.company_id.required' => 'Company ID is required.',

            'companies.*.company_id.exists' => 'Select an active company.',
            'companies.*.company_id.distinct' => 'A company may only be selected once.',

            'companies.*.role.max' => 'Company role may not exceed 50 characters.',

            'companies.*.status.in' => 'The selected company access status is invalid.',

            'companies.*.is_default.boolean' => 'Default company value must be true or false.',
        ];
    }

    /**
     * Validate that no more than one company is marked as default.
     *
     * @return array<int, \Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                foreach ($validator->errors()->keys() as $key) {
                    if ($key === 'companies' || str_starts_with($key, 'companies.')) {
                        return;
                    }
                }

                $defaultCount = collect($this->input('companies', []))
                    ->filter(fn (array $company): bool => filter_var(
                        $company['is_default'] ?? false,
                        FILTER_VALIDATE_BOOLEAN
                    ))
                    ->count();

                if ($defaultCount > 1) {
                    $validator->errors()->add(
                        'companies',
                        'Only one company can be selected as the default.'
                    );
                }
            },
        ];
    }

    /**
     * Prepare input before validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => $this->name
                ? trim($this->name)
                : null,

            'email' => $this->email
                ? strtolower(trim($this->email))
                : null,

            'phone' => is_string($this->phone)
                ? (trim($this->phone) !== '' ? trim($this->phone) : null)
                : $this->phone,

            'location' => $this->location
                ? trim($this->location)
                : null,
        ]);
    }
}
