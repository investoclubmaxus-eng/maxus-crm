<?php

namespace Tests\Unit\Services\Superadmin\Settings;

use App\Services\Superadmin\Settings\EmailTemplateRenderer;
use Tests\TestCase;

class EmailTemplateRendererTest extends TestCase
{
    public function test_replaces_template_variables_in_rendered_body(): void
    {
        $renderer = new EmailTemplateRenderer;

        $html = $renderer->render(
            'Hello {{admin_name}}',
            ['admin_name' => 'Asha']
        );

        $this->assertStringContainsString('Hello Asha', $html);
    }

    public function test_escapes_untrusted_template_variables(): void
    {
        $renderer = new EmailTemplateRenderer;

        $html = $renderer->render(
            'Hello {{admin_name}}',
            ['admin_name' => '<script>alert(1)</script>']
        );

        $this->assertStringNotContainsString('<script>', $html);
    }

    public function test_renders_login_button_placeholder_as_a_link(): void
    {
        $renderer = new EmailTemplateRenderer;

        $html = $renderer->render(
            "Open your account:\n[LOGIN_BUTTON]",
            ['login_url' => 'https://crm.example.test/login']
        );

        $this->assertStringContainsString(
            '<a',
            $html
        );
        $this->assertStringContainsString(
            'href="https://crm.example.test/login"',
            $html
        );
        $this->assertStringNotContainsString('[LOGIN_BUTTON]', $html);
    }

    public function test_renders_reset_password_button_placeholder_as_a_link(): void
    {
        $renderer = new EmailTemplateRenderer;

        $html = $renderer->render(
            "Reset your credentials:\n[RESET_PASSWORD_BUTTON]",
            ['activation_url' => 'https://crm.example.test/reset-password?token=abc']
        );

        $this->assertStringContainsString('<a', $html);
        $this->assertStringContainsString('href="https://crm.example.test/reset-password?token=abc"', $html);
        $this->assertStringContainsString('Reset Password', $html);
        $this->assertStringNotContainsString('[RESET_PASSWORD_BUTTON]', $html);
    }
}
