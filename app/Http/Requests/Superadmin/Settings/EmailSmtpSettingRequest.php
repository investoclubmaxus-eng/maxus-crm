<?php

namespace App\Http\Requests\Superadmin\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmailSmtpSettingRequest extends FormRequest
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
     */
    public function rules(): array
    {
        return [
            'mail_driver' => [
                'required',
                'string',
                Rule::in([
                    'smtp',
                ]),
            ],

            'smtp_host' => [
                'required',
                'string',
                'max:255',
            ],

            'smtp_port' => [
                'required',
                'integer',
                'min:1',
                'max:65535',
            ],

            'username' => [
                'required',
                'string',
                'max:255',
            ],

            /*
             * Password is nullable because when editing
             * existing SMTP settings, the frontend may
             * leave the password empty to keep the
             * existing password.
             */
            'password' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'encryption' => [
                'nullable',
                'string',
                Rule::in([
                    'tls',
                    'ssl',
                ]),
            ],

            'from_address' => [
                'required',
                'email',
                'max:255',
            ],

            'from_name' => [
                'required',
                'string',
                'max:255',
            ],

            'reply_to' => [
                'nullable',
                'email',
                'max:255',
            ],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'mail_driver.required' =>
                'Please select a mail driver.',

            'mail_driver.in' =>
                'The selected mail driver is invalid.',

            'smtp_host.required' =>
                'SMTP host is required.',

            'smtp_host.max' =>
                'SMTP host cannot exceed 255 characters.',

            'smtp_port.required' =>
                'SMTP port is required.',

            'smtp_port.integer' =>
                'SMTP port must be a valid number.',

            'smtp_port.min' =>
                'SMTP port must be greater than 0.',

            'smtp_port.max' =>
                'SMTP port cannot exceed 65535.',

            'username.required' =>
                'SMTP username is required.',

            'username.max' =>
                'SMTP username cannot exceed 255 characters.',

            'password.max' =>
                'SMTP password cannot exceed 1000 characters.',

            'encryption.in' =>
                'The selected encryption type is invalid.',

            'from_address.required' =>
                'From email address is required.',

            'from_address.email' =>
                'Please enter a valid From email address.',

            'from_address.max' =>
                'From email address cannot exceed 255 characters.',

            'from_name.required' =>
                'From name is required.',

            'from_name.max' =>
                'From name cannot exceed 255 characters.',

            'reply_to.email' =>
                'Please enter a valid Reply-To email address.',

            'reply_to.max' =>
                'Reply-To email address cannot exceed 255 characters.',
        ];
    }
}