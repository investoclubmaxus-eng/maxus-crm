<?php

namespace App\Http\Requests\Superadmin\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class GeneralSettingRequest extends FormRequest
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
            'application_name' => [
                'required',
                'string',
                'max:255',
            ],

            'application_url' => [
                'required',
                'url',
                'max:500',
            ],

            'logo' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,svg',
                'max:2048',
            ],

            'login_logo' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,svg',
                'max:5120',
            ],

            'favicon' => [
                'nullable',
                'file',
                'mimes:png,jpg,jpeg,svg,ico',
                'max:1024',
            ],

            'remove_logo' => [
                'nullable',
                'boolean',
            ],

            'remove_login_logo' => [
                'nullable',
                'boolean',
            ],

            'remove_favicon' => [
                'nullable',
                'boolean',
            ],
        ];
    }

     public function messages(): array
    {
        return [
            'application_name.required' =>
                'Application name is required.',

            'application_url.required' =>
                'Application URL is required.',

            'application_url.url' =>
                'Please enter a valid application URL.',

            'logo.mimes' =>
                'Application logo must be JPG, JPEG, PNG or SVG.',

            'login_logo.mimes' =>
                'Login logo must be JPG, JPEG, PNG or SVG.',

            'favicon.mimes' =>
                'Favicon must be PNG, JPG, JPEG, SVG or ICO.',

            'logo.max' =>
                'Application logo must not exceed 2 MB.',

            'login_logo.max' =>
                'Login logo must not exceed 2 MB.',

            'favicon.max' =>
                'Favicon must not exceed 1 MB.',
        ];
    }
}
