<?php

namespace App\Http\Requests\Superadmin\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => [
                'required',
                'string',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/[A-Z]/',
                'regex:/[a-z]/',
                'regex:/[0-9]/',
                'confirmed',
            ],

            'password_confirmation' => [
                'required',
                'string',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'token.required' =>
                'The password reset token is required.',

            'email.required' =>
                'Please provide your email address.',

            'email.email' =>
                'Please provide a valid email address.',

            'password.required' =>
                'Please enter your new password.',

            'password.min' =>
                'Password must be at least 8 characters.',

            'password.regex' =>
                'Password must contain uppercase, lowercase, and a number.',

            'password.confirmed' =>
                'The passwords do not match.',

            'password_confirmation.required' =>
                'Please confirm your new password.',
        ];
    }
}