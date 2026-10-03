<?php

namespace App\Services\Superadmin\Settings;

use App\Models\EmailSmtpSetting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Throwable;

class EmailSmtpSettingService
{
    /**
     * Get current SMTP settings.
     *
     * This module is a singleton/current configuration,
     * so only the first record is used.
     */
    public function getEmailSmtpSettings(): EmailSmtpSetting
    {
        $settings = EmailSmtpSetting::first();

        if (!$settings) {
            $settings = EmailSmtpSetting::create([
                'mail_driver' => 'smtp',
                'smtp_host' => '',
                'smtp_port' => 587,
                'username' => '',
                'password' => '',
                'encryption' => 'tls',
                'from_address' => '',
                'from_name' => 'Maxus CRM',
                'reply_to' => null,
            ]);
        }

        return $settings;
    }


    /**
     * Update SMTP settings.
     */
    public function update(array $data): EmailSmtpSetting
    {
        $settings = $this->getEmailSmtpSettings();

        $updateData = [
            'mail_driver' => $data['mail_driver'],
            'smtp_host' => $data['smtp_host'],
            'smtp_port' => $data['smtp_port'],
            'username' => $data['username'],
            'encryption' => $data['encryption'] ?? null,
            'from_address' => $data['from_address'],
            'from_name' => $data['from_name'],
            'reply_to' => $data['reply_to'] ?? null,
        ];

        /*
         * Only update the password when a new password
         * is actually provided.
         *
         * This allows the frontend to keep the existing
         * SMTP password when editing other settings.
         */
        if (
            isset($data['password']) &&
            $data['password'] !== ''
        ) {
            $updateData['password'] = $data['password'];
        }

        $settings->update($updateData);

        return $settings->fresh();
    }


    /**
     * Apply database SMTP configuration to Laravel Mail.
     */
    private function configureMailer(
        EmailSmtpSetting $settings
    ): void {
        Config::set('mail.default', $settings->mail_driver);

        Config::set(
            'mail.mailers.' . $settings->mail_driver,
            [
                'transport' => 'smtp',
                'host' => $settings->smtp_host,
                'port' => $settings->smtp_port,
                'encryption' => $settings->encryption,
                'username' => $settings->username,
                'password' => $settings->password,
                'timeout' => null,
                'local_domain' => null,
            ]
        );

        Config::set('mail.from', [
            'address' => $settings->from_address,
            'name' => $settings->from_name,
        ]);

        Config::set('mail.reply_to', [
            'address' => $settings->reply_to
                ?: $settings->from_address,
            'name' => $settings->from_name,
        ]);

        /*
         * Remove the previously resolved mailer so Laravel
         * creates it again using the new configuration.
         */
        Mail::purge($settings->mail_driver);
    }


    /**
     * Test SMTP configuration by sending a test email.
     */
    public function testConnection(
        string $recipient
    ): array {
        $settings = $this->getEmailSmtpSettings();

        try {
            /*
             * Make sure Laravel uses the SMTP settings
             * stored in the database.
             */
            $this->configureMailer($settings);

            Mail::mailer($settings->mail_driver)
                ->raw(
                    'This is a test email from Maxus CRM. '
                    . 'Your SMTP configuration is working correctly.',
                    function ($message) use (
                        $settings,
                        $recipient
                    ) {
                        $message->to($recipient)
                            ->subject(
                                'Maxus CRM - SMTP Test Email'
                            );

                        $message->from(
                            $settings->from_address,
                            $settings->from_name
                        );

                        if ($settings->reply_to) {
                            $message->replyTo(
                                $settings->reply_to,
                                $settings->from_name
                            );
                        }
                    }
                );

            return [
                'status' => 'connected',
                'message' =>
                    'SMTP connection is working and the test email was sent successfully.',
            ];

        } catch (Throwable $e) {

            report($e);

            return [
                'status' => 'unavailable',
                'message' =>
                    'Unable to connect to the configured SMTP server.',
            ];
        }
    }
}