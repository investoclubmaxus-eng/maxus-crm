<?php

namespace App\Notifications;

use App\Services\Superadmin\Settings\EmailSmtpSettingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\SentMessage;
use Illuminate\Queue\SerializesModels;
use Spatie\Multitenancy\Jobs\NotTenantAware;

class TemplateEmail extends Mailable implements NotTenantAware, ShouldQueue
{
    use Queueable, SerializesModels;

    public string $emailSubject;

    public string $fromName;

    public string $bodyHtml;

    public function __construct(
        string $emailSubject,
        string $fromName,
        string $bodyHtml
    ) {
        $this->emailSubject = $emailSubject;
        $this->fromName = $fromName;
        $this->bodyHtml = $bodyHtml;
        $this->onQueue('emails')->afterCommit();
    }

    public function send($mailer): ?SentMessage
    {
        app(EmailSmtpSettingService::class)->configureMailer();

        return parent::send($mailer);
    }

    public function build()
    {
        return $this
            ->subject($this->emailSubject)
            ->view('emails.superadmin.templates.base')
            ->with([
                'subject' => $this->emailSubject,
                'fromName' => $this->fromName,
                'bodyHtml' => $this->bodyHtml,
            ]);
    }
}
