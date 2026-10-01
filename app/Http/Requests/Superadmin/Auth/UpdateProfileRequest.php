<?php

namespace App\Http\Requests\Superadmin\Auth;

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

            'avatar' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,gif,webp',
                'max:2048',
            ],
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
            'avatar.mimes' => 'Profile photo must be JPG, PNG, GIF, or WEBP.',
            'avatar.max' => 'Profile photo must not exceed 2MB.',
        ];
    }
}
