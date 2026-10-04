<?php

namespace App\Http\Requests\Superadmin\Settings;

use Illuminate\Foundation\Http\FormRequest;

class EmailTemplateTestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'test_email' => [
                'required',
                'email',
                'max:255',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'test_email.required' => 'Please enter a test email address.',
            'test_email.email' => 'Please enter a valid email address.',
        ];
    }
}