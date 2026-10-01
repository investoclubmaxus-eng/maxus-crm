<?php

namespace App\Http\Requests\Superadmin\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DateTimeSettingRequest extends FormRequest
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
            /*
            |--------------------------------------------------------------------------
            | Timezone
            |--------------------------------------------------------------------------
            */
            'timezone' => [
                'required',
                'string',
                Rule::in(timezone_identifiers_list()),
            ],

            /*
            |--------------------------------------------------------------------------
            | Date Format
            |--------------------------------------------------------------------------
            */
            'date_format' => [
                'required',
                'string',
                Rule::in([
                    'd M Y',
                    'd/m/Y',
                    'm/d/Y',
                    'Y-m-d',
                    'd-m-Y',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | Time Format
            |--------------------------------------------------------------------------
            */
            'time_format' => [
                'required',
                Rule::in([
                    '12',
                    '24',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | Week Starts On
            |--------------------------------------------------------------------------
            */
            'week_starts_on' => [
                'required',
                Rule::in([
                    'monday',
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                    'saturday',
                    'sunday',
                ]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'timezone.required' =>
                'Timezone is required.',

            'timezone.in' =>
                'Please select a valid timezone.',

            'date_format.required' =>
                'Date format is required.',

            'date_format.in' =>
                'Please select a valid date format.',

            'time_format.required' =>
                'Time format is required.',

            'time_format.in' =>
                'Please select either 12-hour or 24-hour time format.',

            'week_starts_on.required' =>
                'Week start day is required.',

            'week_starts_on.in' =>
                'Please select a valid week start day.',
        ];
    }
}
