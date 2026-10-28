<?php

namespace App\Services\Superadmin\Settings;

use App\Models\EmailTemplate;
use App\Models\GeneralSetting;
use App\Models\User;
use App\Notifications\TemplateEmail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use RuntimeException;

class EmailTemplateService
{
    /*
    |--------------------------------------------------------------------------
    | CONSTRUCTOR
    |--------------------------------------------------------------------------
    */

    public function __construct(
        private EmailTemplateRenderer $renderer
    ) {}

    /*
    |--------------------------------------------------------------------------
    | GET ALL TEMPLATES
    |--------------------------------------------------------------------------
    */

    public function getTemplates()
    {
        $this->ensureDefaultTemplates();

        return EmailTemplate::query()
            ->orderByDesc('is_default')
            ->orderBy('id')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | GET SINGLE TEMPLATE
    |--------------------------------------------------------------------------
    */

    public function getTemplate(int $id): EmailTemplate
    {
        $this->ensureDefaultTemplates();

        return EmailTemplate::findOrFail($id);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE CUSTOM TEMPLATE
    |--------------------------------------------------------------------------
    */

    public function create(array $data): EmailTemplate
    {
        $slug = $this->generateUniqueSlug($data['name']);

        return EmailTemplate::create([
            'slug' => $slug,

            'name' => $data['name'],

            'description' => $data['description'] ?? null,

            'trigger' => $data['trigger'] ?? 'Custom Notification',

            'template_type' => 'custom',

            'is_default' => false,

            'is_active' => true,

            'subject' => $data['subject']
                ?? 'Notification from {{app_name}}',

            'from_name' => $data['from_name']
                ?? '{{app_name}}',

            'body' => $data['body']
                ?? "Hello {{admin_name}},\n\nThis is a new email notification from {{app_name}}.\n\nRegards,\n{{app_name}} Team",
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE TEMPLATE
    |--------------------------------------------------------------------------
    */

    public function update(
        EmailTemplate $template,
        array $data
    ): EmailTemplate {

        $template->update([
            'name' => $data['name'],

            'description' => $data['description'] ?? null,

            'trigger' => $data['trigger'] ?? $template->trigger,

            'subject' => $data['subject'],

            'from_name' => $data['from_name'],

            'body' => $data['body'],
        ]);

        return $template->fresh();
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE TEMPLATE
    |--------------------------------------------------------------------------
    */

    public function toggle(EmailTemplate $template): EmailTemplate
    {
        $template->update([
            'is_active' => ! $template->is_active,
        ]);

        return $template->fresh();
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE TEMPLATE
    |--------------------------------------------------------------------------
    */

    public function delete(EmailTemplate $template): void
    {
        if ($template->is_default) {
            throw new RuntimeException(
                'System email templates cannot be deleted.'
            );
        }

        $template->delete();
    }

    /*
    |--------------------------------------------------------------------------
    | GENERATE UNIQUE SLUG
    |--------------------------------------------------------------------------
    */

    private function generateUniqueSlug(string $name): string
    {
        $baseSlug = Str::slug($name);

        if (! $baseSlug) {
            $baseSlug = 'custom-template';
        }

        $slug = $baseSlug;

        $counter = 1;

        while (
            EmailTemplate::where('slug', $slug)->exists()
        ) {
            $slug = $baseSlug.'-'.$counter;

            $counter++;
        }

        return $slug;
    }

    /*
    |--------------------------------------------------------------------------
    | DEFAULT TEMPLATES
    |--------------------------------------------------------------------------
    */

    public function ensureDefaultTemplates(): void
    {
        $templates = [

            [
                'slug' => 'new-admin-invitation',

                'name' => 'New Admin Invitation',

                'description' => 'Sent when the Super Admin sends an account activation invitation.',

                'trigger' => 'Admin Invitation Sent',

                'subject' => 'Activate Your {{app_name}} Admin Account',

                'from_name' => '{{app_name}}',

                'body' => <<<'TEXT'
                Hello {{admin_name}},

                Welcome to {{app_name}} CRM!

                Your administrator account has been created successfully.

                To get started, activate your account and create your own password using the secure link below.

                Email: {{admin_email}}

                Assigned companies: {{company_name}}

                {{activation_url}}

                Important security information:
                - This invitation expires after 2 hours.
                - The invitation link can only be used once.
                - Never share this link with anyone.

                If you were not expecting this invitation, please contact your system administrator.

                Regards,
                {{app_name}} Team
                TEXT,
            ],

            [
                'slug' => 'admin-account-activated',

                'name' => 'Admin Account Activated',

                'description' => 'Sent when an Admin activates their account.',

                'trigger' => 'Account Activated',

                'subject' => 'Your {{app_name}} Admin Account is Activated',

                'from_name' => '{{app_name}}',

                'body' => <<<'TEXT'
                Hello {{admin_name}},

                Your Admin account has been successfully activated.

                You can now login to your CRM account.

                [LOGIN_BUTTON]

                Regards,
                {{app_name}} Team
                TEXT,
            ],

            [
                'slug' => 'password-reset',

                'name' => 'Password Reset',

                'description' => 'Sent when an Admin requests a password reset.',

                'trigger' => 'Password Reset Requested',

                'subject' => 'Reset Your {{app_name}} Password',

                'from_name' => '{{app_name}}',

                'body' => <<<'TEXT'
                Hello {{admin_name}},

                We received a request to reset your password.

                Please use the button below to reset your password.

                [RESET_PASSWORD_BUTTON]

                If you did not request a password reset, please ignore this email.

                If you're having trouble clicking the button, copy and paste the URL below into your web browser:
                {{activation_url}}

                Regards,
                {{app_name}} Team
                TEXT,
            ],

            [
                'slug' => 'account-disabled',

                'name' => 'Account Disabled',

                'description' => 'Sent when an Admin account is disabled by Super Admin.',

                'trigger' => 'Account Disabled',

                'subject' => 'Your {{app_name}} Account Has Been Disabled',

                'from_name' => '{{app_name}}',

                'body' => <<<'TEXT'
                Hello {{admin_name}},

                Your Admin account has been disabled by the system administrator.

                If you believe this was done by mistake, please contact your system administrator.

                Regards,
                {{app_name}} Team
                TEXT,
            ],

            [
                'slug' => 'company-access-granted',

                'name' => 'Company Access Granted',

                'description' => 'Sent when an Admin is granted access to a company.',

                'trigger' => 'Company Access Granted',

                'subject' => 'Company Access Granted – {{company_name}}',

                'from_name' => '{{app_name}}',

                'body' => <<<'TEXT'
                Hello {{admin_name}},

                You have been granted access to {{company_name}}.

                You can login to your CRM account using the button below.

                [LOGIN_BUTTON]

                Regards,
                {{app_name}} Team
                TEXT,
            ],
        ];

        foreach ($templates as $template) {

            EmailTemplate::firstOrCreate(
                [
                    'slug' => $template['slug'],
                ],
                [
                    'name' => $template['name'],

                    'description' => $template['description'],

                    'trigger' => $template['trigger'],

                    'template_type' => 'system',

                    'is_default' => true,

                    'is_active' => true,

                    'subject' => $template['subject'],

                    'from_name' => $template['from_name'],

                    'body' => $template['body'],
                ]
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET GENERAL APPLICATION SETTINGS
    |--------------------------------------------------------------------------
    |
    | These values come from the general_settings table.
    |
    */

    private function getApplicationSettings(): array
    {
        $settings = GeneralSetting::first();

        $appName = $settings?->application_name
            ?: config('app.name', 'Maxus CRM');

        $applicationUrl = $settings?->application_url
            ?: config('app.url');

        /*
        |--------------------------------------------------------------------------
        | Remove trailing slash
        |--------------------------------------------------------------------------
        */

        $applicationUrl = rtrim(
            $applicationUrl ?: '',
            '/'
        );

        /*
        |--------------------------------------------------------------------------
        | Build CRM login URL
        |--------------------------------------------------------------------------
        */

        $loginUrl = $applicationUrl
            ? $applicationUrl.'/'
            : url('/');

        return [
            'app_name' => $appName,

            'application_url' => $applicationUrl,

            'login_url' => $loginUrl,

            /*
            |--------------------------------------------------------------------------
            | Keep activation URL available for existing templates
            |--------------------------------------------------------------------------
            |
            | Later, when you create a real activation/password setup route,
            | you can replace this with the actual activation URL.
            |
            */

            'activation_url' => $loginUrl,

            /*
            |--------------------------------------------------------------------------
            | Email support fallback
            |--------------------------------------------------------------------------
            |
            | Your current general_settings table does not contain a
            | support_email field, so use the configured mail address.
            |
            */

            'support_email' => config(
                'mail.from.address'
            ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | BUILD TEMPLATE VARIABLES
    |--------------------------------------------------------------------------
    */

    private function buildTemplateVariables(
        array $variables = []
    ): array {

        $applicationSettings = $this->getApplicationSettings();

        return array_merge(
            $applicationSettings,
            $variables
        );
    }

    /*
    |--------------------------------------------------------------------------
    | REPLACE VARIABLES
    |--------------------------------------------------------------------------
    */

    public function replaceVariables(
        string $content,
        array $variables = []
    ): string {

        /*
        |--------------------------------------------------------------------------
        | Get global application variables
        |--------------------------------------------------------------------------
        */

        $variables = $this->buildTemplateVariables(
            $variables
        );

        /*
        |--------------------------------------------------------------------------
        | Replace {{variable}}
        |--------------------------------------------------------------------------
        */

        foreach ($variables as $key => $value) {

            if ($value === null) {
                $value = '';
            }

            $content = str_replace(
                '{{'.$key.'}}',
                (string) $value,
                $content
            );
        }

        return $content;
    }

    /*
    |--------------------------------------------------------------------------
    | RENDER TEMPLATE CONTENT
    |--------------------------------------------------------------------------
    |
    | This method sends all variables to EmailTemplateRenderer.
    |
    */

    private function renderTemplate(
        string $content,
        array $variables = []
    ): string {

        $variables = $this->buildTemplateVariables(
            $variables
        );

        return $this->renderer->render(
            $content,
            $variables
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST EMAIL
    |--------------------------------------------------------------------------
    */

    public function sendTestEmail(
        EmailTemplate $template,
        string $testEmail
    ): void {

        /*
        |--------------------------------------------------------------------------
        | Get dynamic application settings
        |--------------------------------------------------------------------------
        |
        | Values such as:
        |
        | {{app_name}}
        | {{application_url}}
        | {{login_url}}
        |
        | come from general_settings.
        |
        */

        $variables = $this->buildTemplateVariables([
            /*
            |--------------------------------------------------------------------------
            | Test user
            |--------------------------------------------------------------------------
            */

            'admin_name' => 'John Smith',

            'admin_email' => $testEmail,

            /*
            |--------------------------------------------------------------------------
            | Test company
            |--------------------------------------------------------------------------
            */

            'company_name' => 'ABC Realty',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Render email body
        |--------------------------------------------------------------------------
        |
        | EmailTemplateRenderer is responsible for rendering the template
        | body and special placeholders such as [LOGIN_BUTTON].
        |
        */

        $bodyHtml = $this->renderer->render(
            $template->body,
            $variables
        );

        /*
        |--------------------------------------------------------------------------
        | Render subject
        |--------------------------------------------------------------------------
        |
        | Example:
        |
        | Welcome to {{app_name}}
        |
        | becomes:
        |
        | Welcome to Maxus CRM
        |
        */

        $subject = $this->replaceVariables(
            $template->subject,
            $variables
        );

        /*
        |--------------------------------------------------------------------------
        | Render From Name
        |--------------------------------------------------------------------------
        |
        | Example:
        |
        | {{app_name}}
        |
        | becomes:
        |
        | Maxus CRM
        |
        */

        $fromName = $this->replaceVariables(
            $template->from_name
                ?: '{{app_name}}',
            $variables
        );

        /*
        |--------------------------------------------------------------------------
        | Send Email
        |--------------------------------------------------------------------------
        */

        Mail::to($testEmail)->queue(
            new TemplateEmail(
                $subject,
                $fromName,
                $bodyHtml
            )
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TEST EMAIL HTML WRAPPER
    |--------------------------------------------------------------------------
    |
    | This method is kept from your original service.
    |
    | If EmailTemplateRenderer is already responsible for the complete
    | email layout, this method does not need to be called.
    |
    */

    private function wrapTestEmail(
        string $body,
        string $appName
    ): string {

        return '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >
            <title>'.e($appName).'</title>
        </head>

        <body style="
            margin:0;
            padding:0;
            background:#f4f7fb;
            font-family:Arial,Helvetica,sans-serif;
        ">

            <div style="
                width:100%;
                padding:30px 15px;
                box-sizing:border-box;
            ">

                <div style="
                    max-width:600px;
                    margin:0 auto;
                    background:#ffffff;
                    border-radius:10px;
                    overflow:hidden;
                    box-shadow:0 4px 20px rgba(0,0,0,0.06);
                ">

                    <div style="
                        padding:22px;
                        text-align:center;
                        background:#4f46e5;
                        color:#ffffff;
                    ">
                        <strong style="
                            font-size:20px;
                        ">
                            '.e($appName).'
                        </strong>
                    </div>

                    <div style="
                        padding:30px;
                        color:#293548;
                        font-size:14px;
                        line-height:1.7;
                    ">
                        '.$body.'
                    </div>

                    <div style="
                        padding:18px 25px;
                        background:#f8fafc;
                        text-align:center;
                        color:#7b879a;
                        font-size:12px;
                    ">
                        © '.date('Y').' '.e($appName).'
                    </div>

                </div>

            </div>

        </body>
        </html>';
    }

    /**
     * Build the email for a new Admin invitation.
     */
    public function buildAdminInvitationEmail(User $admin, string $activationUrl, ?string $companyName = null): TemplateEmail
    {
        $this->ensureDefaultTemplates();

        $template = EmailTemplate::query()
            ->where('slug', 'new-admin-invitation')
            ->where('is_active', true)
            ->first();

        if (! $template) {
            throw new RuntimeException(
                'The New Admin Invitaation email template is inactive or unavailable.'
            );
        }

        $variables = $this->buildTemplateVariables([
            'admin_name' => $admin->name,
            'admin_email' => $admin->email,
            'company_name' => $companyName ?? '',
            'activation_url' => $activationUrl,
        ]);

        $bodyHtml = $this->renderer->render(
            $template->body,
            $variables
        );

        $subject = $this->replaceVariables(
            $template->subject,
            $variables
        );

        $fromName = $this->replaceVariables(
            $template->from_name ?: '{{app_name}}',
            $variables
        );

        return new TemplateEmail(
            $subject,
            $fromName,
            $bodyHtml
        );
    }

    /**
     * Build an administrator status email from a system template.
     */
    public function buildAdminStatusEmail(
        User $admin,
        string $templateSlug
    ): TemplateEmail {
        $templateNames = [
            'admin-account-activated' => 'Admin Account Activated',
            'account-disabled' => 'Account Disabled',
        ];

        if (! array_key_exists($templateSlug, $templateNames)) {
            throw new RuntimeException('The administrator status template is invalid.');
        }

        $this->ensureDefaultTemplates();

        $template = EmailTemplate::query()
            ->where('slug', $templateSlug)
            ->where('is_active', true)
            ->first();

        if (! $template) {
            throw new RuntimeException(
                "The {$templateNames[$templateSlug]} email template is inactive or unavailable."
            );
        }

        $variables = $this->buildTemplateVariables([
            'admin_name' => $admin->name,
            'admin_email' => $admin->email,
        ]);
        $bodyHtml = $this->renderer->render($template->body, $variables);
        $subject = $this->replaceVariables($template->subject, $variables);
        $fromName = $this->replaceVariables(
            $template->from_name ?: '{{app_name}}',
            $variables
        );

        return new TemplateEmail($subject, $fromName, $bodyHtml);
    }

    /**
     * Build a password-reset email from the system template.
     */
    public function buildPasswordResetEmail(
        User $user,
        string $resetUrl
    ): TemplateEmail {
        $this->ensureDefaultTemplates();

        $template = EmailTemplate::query()
            ->where('slug', 'password-reset')
            ->where('is_active', true)
            ->first();

        if (! $template) {
            throw new RuntimeException(
                'The Password Reset email template is inactive or unavailable.'
            );
        }

        $variables = $this->buildTemplateVariables([
            'admin_name' => $user->name,
            'admin_email' => $user->email,
            'activation_url' => $resetUrl,
            'button_label' => 'Reset Password',
            'template_slug' => 'password-reset',
        ]);
        $bodyHtml = $this->renderer->render($template->body, $variables);
        $subject = $this->replaceVariables($template->subject, $variables);
        $fromName = $this->replaceVariables(
            $template->from_name ?: '{{app_name}}',
            $variables
        );

        return new TemplateEmail($subject, $fromName, $bodyHtml);
    }

    /**
     * Build the email for a new Sub Admin invitation.
     * Reuses the same invitation template variables as admin (admin_name / admin_email).
    */
    public function buildSubAdminInvitationEmail(
        User $subAdmin,
        string $activationUrl,
        ?string $companyName = null,
        ?string $branchNames = null
    ): TemplateEmail {
        // Reuse the working admin invitation flow
        return $this->buildAdminInvitationEmail(
            $subAdmin,
            $activationUrl,
            $companyName
        );
    }
}
