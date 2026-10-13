<?php

namespace App\Http\Requests\Superadmin\Auth;

use App\Services\Superadmin\Settings\FileStorageSettingService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
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
            'name' => [
                'required',
                'string',
                'regex:/^[A-Za-z]+(?: [A-Za-z]+)*$/',
            ],

            'phone' => [
                'required',
                'digits:10',
            ],

            'location' => [
                'nullable',
                'string',
                'max:255',
            ],

            'avatar' => $avatarRules,
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Name is required.',
            'name.regex' => 'Name may contain letters and spaces only.',
            'phone.required' => 'Phone number is required.',
            'phone.digits' => 'Phone number must contain exactly 10 digits.',
            'location.max' => 'Location cannot exceed 255 characters.',
            'avatar.image' => 'Profile photo must be a valid image.',
            'avatar.mimes' => 'Profile photo type must be allowed by File Storage settings.',
            'avatar.extensions' => 'Profile photo extension must be allowed by File Storage settings.',
            'avatar.max' => 'Profile photo exceeds the maximum size configured in File Storage settings.',
            'avatar.prohibited' => 'No valid file types are configured for profile photos in File Storage settings.',
        ];
    }
}
