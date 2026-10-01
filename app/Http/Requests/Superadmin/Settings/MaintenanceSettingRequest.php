<?php

namespace App\Http\Requests\Superadmin\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MaintenanceSettingRequest extends FormRequest
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
            'maintenance_mode' => [
                'required',
                'boolean',
            ],

            'maintenance_message' => [
                'required',
                'string',
                'max:1000',
            ],

            'allow_super_admin_access' => [
                'required',
                'boolean',
            ],

            'log_retention_days' => [
                'required',
                'integer',
                'min:1',
                'max:3650',
            ],
        ];
    }

      public function messages(): array
    {
        return [
            'maintenance_mode.required' =>
                'Maintenance mode status is required.',

            'maintenance_mode.boolean' =>
                'Maintenance mode must be enabled or disabled.',

            'maintenance_message.required' =>
                'Maintenance message is required.',

            'maintenance_message.string' =>
                'Maintenance message must be valid text.',

            'maintenance_message.max' =>
                'Maintenance message must not exceed 1000 characters.',

            'allow_super_admin_access.required' =>
                'Super Admin access setting is required.',

            'allow_super_admin_access.boolean' =>
                'Super Admin access must be enabled or disabled.',

            'log_retention_days.required' =>
                'Log retention days are required.',

            'log_retention_days.integer' =>
                'Log retention days must be a valid number.',

            'log_retention_days.min' =>
                'Log retention must be at least 1 day.',

            'log_retention_days.max' =>
                'Log retention cannot exceed 3650 days.',
        ];
    }
}
