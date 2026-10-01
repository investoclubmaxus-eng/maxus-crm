<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SuperadminResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public string $token,
        public string $resetUrl
    ) {
        $this->onConnection('redis');
        $this->onQueue('emails');
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Reset Your Maxus CRM Password')
            ->view(
                'emails.superadmin.forgot-password',
                [
                    'user' => $notifiable,
                    'resetUrl' => $this->resetUrl,
                ]
            );
    }
}