<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

class TemplateEmail extends Mailable
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