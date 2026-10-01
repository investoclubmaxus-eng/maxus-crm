<?php

namespace App\Services\Superadmin\Settings;

use App\Models\DateTimeSetting;
use Carbon\Carbon;


class DateTimeSettingService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        
    }

     /**
     * Get the current Date & Time settings.
     *
     * Creates the default configuration if no record exists.
     */
    public function getDateTimeSettings(): DateTimeSetting
    {
        $settings = DateTimeSetting::first();

        if (!$settings) {
            $settings = DateTimeSetting::create([
                'timezone' => 'Asia/Kolkata',
                'date_format' => 'd M Y',
                'time_format' => '12',
                'week_starts_on' => 'tuesday',
            ]);
        }

        return $settings;
    }

     /**
     * Update Date & Time settings.
     */
    public function update(array $data): DateTimeSetting
    {
        $settings = $this->getDateTimeSettings();

        $settings->update([
            'timezone' => $data['timezone'],
            'date_format' => $data['date_format'],
            'time_format' => $data['time_format'],
            'week_starts_on' => $data['week_starts_on'],
        ]);

        return $settings->fresh();
    }

     /**
     * Get current system time based on selected timezone.
     */
    public function getCurrentSystemTime(): array
    {
        $settings = $this->getDateTimeSettings();

        $timezone = $settings->timezone;

        $now = Carbon::now($timezone);

        $date = $now->format($settings->date_format);

        $time = $settings->time_format === '24'
            ? $now->format('H:i:s')
            : $now->format('h:i:s A');

        $offset = $now->format('P');

        return [
            'date' => $date,
            'time' => $time,
            'timezone' => $timezone,
            'utc_offset' => 'UTC ' . $offset,
            'iso' => $now->toIso8601String(),
        ];
    }

    /**
     * Get available timezones.
     */
    public function getTimezones(): array
    {
        return timezone_identifiers_list();
    }
}
