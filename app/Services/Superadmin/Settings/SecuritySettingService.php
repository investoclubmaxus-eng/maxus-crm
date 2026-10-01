<?php

namespace App\Services\Superadmin\Settings;

use App\Models\SecuritySetting;


class SecuritySettingService
{
    /**
     * Get current security settings.
     */
    public function getSecuritySettings(): SecuritySetting
    {
        $settings = SecuritySetting::first();

        if (!$settings) {
            $settings = SecuritySetting::create([
                'login_attempt_protection' => true,
                'max_failed_attempts' => 5,
                'lockout_duration' => 15,

                'session_timeout' => 30,
                'remember_me' => true,
                'logout_sessions_after_password_change' => true,

                'require_two_factor' => false,
                'allow_user_two_factor' => true,
            ]);
        }

        return $settings;
    }

    /**
     * Update security settings.
     */
    public function update(array $data): SecuritySetting
    {
        $settings = $this->getSecuritySettings();

        $settings->update([
            'login_attempt_protection' =>
                $data['login_attempt_protection'],

            'max_failed_attempts' =>
                $data['max_failed_attempts'],

            'lockout_duration' =>
                $data['lockout_duration'],

            'session_timeout' =>
                $data['session_timeout'],

            'remember_me' =>
                $data['remember_me'],

            'logout_sessions_after_password_change' =>
                $data['logout_sessions_after_password_change'],

            'require_two_factor' =>
                $data['require_two_factor'],

            'allow_user_two_factor' =>
                $data['allow_user_two_factor'],
        ]);

        return $settings->fresh();
    }

    /**
     * Return settings formatted for frontend.
     */
    public function getFormattedSettings(): array
    {
        $settings = $this->getSecuritySettings();

        return [
            'id' =>
                $settings->id,

            'login_attempt_protection' =>
                $settings->login_attempt_protection,

            'max_failed_attempts' =>
                $settings->max_failed_attempts,

            'lockout_duration' =>
                $settings->lockout_duration,

            'session_timeout' =>
                $settings->session_timeout,

            'remember_me' =>
                $settings->remember_me,

            'logout_sessions_after_password_change' =>
                $settings->logout_sessions_after_password_change,

            'require_two_factor' =>
                $settings->require_two_factor,

            'allow_user_two_factor' =>
                $settings->allow_user_two_factor,

            'security_status' => [
                'login_protection' =>
                    $settings->login_attempt_protection,

                'session_protection' =>
                    true,

                'two_factor' =>
                    $settings->require_two_factor,
            ],

            'updated_at' =>
                $settings->updated_at,
        ];
    }
}