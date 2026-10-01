<?php

namespace App\Http\Requests\Superadmin\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SecuritySettingRequest extends FormRequest
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
            'login_attempt_protection' => [
                'required',
                'boolean',
            ],

            'max_failed_attempts' => [
                'required',
                'integer',
                Rule::in([
                    3,
                    5,
                    7,
                    10,
                ]),
            ],

            'lockout_duration' => [
                'required',
                'integer',
                Rule::in([
                    5,
                    15,
                    30,
                    60,
                    
                ]),
            ],

            'session_timeout' => [
                'required',
                'integer',
                Rule::in([
                    15,
                    30,
                    60,
                    120,
                    240,
                ]),
            ],

            'remember_me' => [
                'required',
                'boolean',
            ],

            'logout_sessions_after_password_change' => [
                'required',
                'boolean',
            ],

            'require_two_factor' => [
                'required',
                'boolean',
            ],

            'allow_user_two_factor' => [
                'required',
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'login_attempt_protection.required' =>
                'Login attempt protection is required.',

            'max_failed_attempts.required' =>
                'Maximum failed attempts is required.',

            'max_failed_attempts.in' =>
                'Please select a valid maximum failed attempt value.',

            'lockout_duration.required' =>
                'Lockout duration is required.',

            'lockout_duration.in' =>
                'Please select a valid lockout duration.',

            'session_timeout.required' =>
                'Session timeout is required.',

            'session_timeout.in' =>
                'Please select a valid session timeout.',

            'remember_me.required' =>
                'Remember Me setting is required.',

            'logout_sessions_after_password_change.required' =>
                'Logout sessions after password change setting is required.',

            'require_two_factor.required' =>
                'Two-factor authentication setting is required.',

            'allow_user_two_factor.required' =>
                'User two-factor authentication setting is required.',
        ];
    }
}
