<?php

namespace App\Http\Requests\Superadmin\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;


class FileStorageSettingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
       return [
            'driver' => [
                'required',
                'string',
                Rule::in([
                    'local',
                    'public',
                    's3',
                ]),
            ],

            'max_upload_size' => [
                'required',
                'integer',
                'min:1',
                'max:10240',
            ],

            'max_files' => [
                'required',
                'integer',
                'min:1',
                'max:100',
            ],

            'allowed_file_types' => [
                'required',
                'string',
                'max:1000',
            ],

            'retention_days' => [
                'required',
                'integer',
                'min:1',
                'max:3650',
            ],

            'automatic_cleanup' => [
                'required',
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'driver.required' =>
                'Please select a storage driver.',

            'driver.in' =>
                'The selected storage driver is invalid.',

            'max_upload_size.required' =>
                'Maximum upload size is required.',

            'max_upload_size.integer' =>
                'Maximum upload size must be a number.',

            'max_upload_size.min' =>
                'Maximum upload size must be at least 1 MB.',

            'max_upload_size.max' =>
                'Maximum upload size cannot exceed 10240 MB.',

            'max_files.required' =>
                'Maximum files is required.',

            'max_files.integer' =>
                'Maximum files must be a number.',

            'max_files.min' =>
                'Maximum files must be at least 1.',

            'max_files.max' =>
                'Maximum files cannot exceed 100.',

            'allowed_file_types.required' =>
                'Allowed file types are required.',

            'allowed_file_types.string' =>
                'Allowed file types must be a valid text value.',

            'retention_days.required' =>
                'Retention days are required.',

            'retention_days.integer' =>
                'Retention days must be a number.',

            'retention_days.min' =>
                'Retention days must be at least 1 day.',

            'retention_days.max' =>
                'Retention days cannot exceed 3650 days.',

            'automatic_cleanup.required' =>
                'Automatic cleanup setting is required.',

            'automatic_cleanup.boolean' =>
                'Automatic cleanup must be enabled or disabled.',
        ];
    }
}
