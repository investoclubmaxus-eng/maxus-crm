<?php

namespace App\Http\Requests\Superadmin\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePasswordRequest extends FormRequest
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
        return [
            'current_password' => [
                'required',
                'current_password:sanctum',
            ],
            'new_password' => [
                'required',
                'string',
                'min:8',
                'different:current_password',
                'regex:/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/',
                'confirmed',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'current_password.required' => 'Current password is required.',
            'current_password.current_password' => 'Current password is incorrect.',
            'new_password.required' => 'New password is required.',
            'new_password.min' => 'New password must be at least 8 characters.',
            'new_password.different' => 'New password must be different from the current password.',
            'new_password.regex' => 'New password must include a letter, number, and special character.',
            'new_password.confirmed' => 'Password confirmation does not match.',
        ];
    }
}
