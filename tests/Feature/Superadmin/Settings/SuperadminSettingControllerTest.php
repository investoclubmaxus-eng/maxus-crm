<?php

namespace Tests\Feature\Superadmin\Settings;

use App\Models\EmailSmtpSetting;
use App\Models\EmailTemplate;
use App\Models\SecuritySetting;
use App\Models\User;
use App\Notifications\TemplateEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SuperadminSettingControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_general_settings_can_be_read_and_create_default_values(): void
    {
        $this->getJson('/api/superadmin/settings/general')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.application_name', 'Maxus CRM');

        $this->assertDatabaseHas('general_settings', [
            'application_name' => 'Maxus CRM',
        ]);
    }

    public function test_authenticated_request_updates_general_settings(): void
    {
        $this->authenticate();

        $this->postJson('/api/superadmin/settings/general', [
            'application_name' => 'Northstar CRM',
            'application_url' => 'https://crm.example.test',
        ])
            ->assertOk()
            ->assertJsonPath('data.application_name', 'Northstar CRM')
            ->assertJsonPath('data.application_url', 'https://crm.example.test');

        $this->assertDatabaseHas('general_settings', [
            'application_name' => 'Northstar CRM',
            'application_url' => 'https://crm.example.test',
        ]);
    }

    public function test_unauthenticated_request_cannot_update_general_settings(): void
    {
        $this->postJson('/api/superadmin/settings/general', [
            'application_name' => 'Northstar CRM',
            'application_url' => 'https://crm.example.test',
        ])->assertUnauthorized();

        $this->assertDatabaseCount('general_settings', 0);
    }

    public function test_date_time_settings_are_updated_and_persisted(): void
    {
        $this->authenticate();

        $this->putJson('/api/superadmin/settings/date-time-update', [
            'timezone' => 'Asia/Kolkata',
            'date_format' => 'Y-m-d',
            'time_format' => '24',
            'week_starts_on' => 'monday',
        ])
            ->assertOk()
            ->assertJsonPath('data.timezone', 'Asia/Kolkata')
            ->assertJsonPath('data.date_format', 'Y-m-d')
            ->assertJsonPath('data.time_format', '24')
            ->assertJsonPath('data.week_starts_on', 'monday');

        $this->assertDatabaseHas('date_time_settings', [
            'timezone' => 'Asia/Kolkata',
            'date_format' => 'Y-m-d',
            'time_format' => '24',
            'week_starts_on' => 'monday',
        ]);
    }

    public function test_invalid_date_time_timezone_returns_validation_message(): void
    {
        $this->authenticate();

        $this->putJson('/api/superadmin/settings/date-time-update', [
            'timezone' => 'Not/A_Timezone',
            'date_format' => 'Y-m-d',
            'time_format' => '24',
            'week_starts_on' => 'monday',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.timezone.0', 'Please select a valid timezone.');

        $this->assertDatabaseCount('date_time_settings', 0);
    }

    public function test_maintenance_settings_update_and_mode_controls_persist(): void
    {
        $this->authenticate();

        $this->putJson('/api/superadmin/settings/maintenance-update', [
            'maintenance_mode' => false,
            'maintenance_message' => 'Scheduled maintenance.',
            'allow_super_admin_access' => true,
            'log_retention_days' => 60,
        ])
            ->assertOk()
            ->assertJsonPath('data.log_retention_days', 60);

        $this->postJson('/api/superadmin/settings/maintenance/enable')
            ->assertOk()
            ->assertJsonPath('data.maintenance_mode', true);

        $this->postJson('/api/superadmin/settings/maintenance/disable')
            ->assertOk()
            ->assertJsonPath('data.maintenance_mode', false);

        $this->assertDatabaseHas('maintenance_settings', [
            'maintenance_mode' => false,
            'maintenance_message' => 'Scheduled maintenance.',
            'allow_super_admin_access' => true,
            'log_retention_days' => 60,
        ]);
    }

    public function test_invalid_maintenance_retention_days_are_rejected(): void
    {
        $this->authenticate();

        $this->putJson('/api/superadmin/settings/maintenance-update', [
            'maintenance_mode' => false,
            'maintenance_message' => 'Scheduled maintenance.',
            'allow_super_admin_access' => true,
            'log_retention_days' => 0,
        ])
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.log_retention_days.0',
                'Log retention must be at least 1 day.'
            );

        $this->assertDatabaseCount('maintenance_settings', 0);
    }

    public function test_maintenance_health_endpoint_returns_health_sections(): void
    {
        $this->authenticate();

        $this->getJson('/api/superadmin/settings/maintenance/health')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.application.status', 'operational')
            ->assertJsonPath('data.database.status', 'connected')
            ->assertJsonPath('data.storage.status', 'available');
    }

    public function test_security_settings_update_and_persist(): void
    {
        $this->authenticate();

        $this->putJson('/api/superadmin/settings/security-update', [
            'login_attempt_protection' => false,
            'max_failed_attempts' => 7,
            'lockout_duration' => 30,
            'session_timeout' => 60,
            'remember_me' => false,
            'logout_sessions_after_password_change' => true,
            'require_two_factor' => true,
            'allow_user_two_factor' => true,
        ])
            ->assertOk()
            ->assertJsonPath('data.login_attempt_protection', false)
            ->assertJsonPath('data.max_failed_attempts', 7)
            ->assertJsonPath('data.security_status.two_factor', true);

        $this->assertDatabaseHas('security_settings', [
            'login_attempt_protection' => false,
            'max_failed_attempts' => 7,
            'lockout_duration' => 30,
            'session_timeout' => 60,
            'remember_me' => false,
            'logout_sessions_after_password_change' => true,
            'require_two_factor' => true,
            'allow_user_two_factor' => true,
        ]);
    }

    public function test_invalid_security_attempt_limit_is_rejected(): void
    {
        $this->authenticate();

        $this->putJson('/api/superadmin/settings/security-update', [
            'login_attempt_protection' => true,
            'max_failed_attempts' => 4,
            'lockout_duration' => 15,
            'session_timeout' => 30,
            'remember_me' => true,
            'logout_sessions_after_password_change' => true,
            'require_two_factor' => false,
            'allow_user_two_factor' => true,
        ])
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.max_failed_attempts.0',
                'Please select a valid maximum failed attempt value.'
            );

        $this->assertDatabaseCount('security_settings', 0);
    }

    public function test_file_storage_settings_update_and_persist(): void
    {
        $this->authenticate();

        $this->putJson('/api/superadmin/settings/file-storage-update', [
            'driver' => 'local',
            'max_upload_size' => 25,
            'max_files' => 20,
            'allowed_file_types' => 'jpg,png,pdf',
            'retention_days' => 45,
            'automatic_cleanup' => false,
        ])
            ->assertOk()
            ->assertJsonPath('settings.driver', 'local')
            ->assertJsonPath('settings.max_upload_size', 25)
            ->assertJsonPath('settings.automatic_cleanup', false);

        $this->assertDatabaseHas('file_storage_settings', [
            'driver' => 'local',
            'max_upload_size' => 25,
            'max_files' => 20,
            'allowed_file_types' => 'jpg,png,pdf',
            'retention_days' => 45,
            'automatic_cleanup' => false,
        ]);
    }

    public function test_file_storage_connection_test_cleans_up_its_temporary_file(): void
    {
        Storage::fake('local');
        $this->authenticate();

        $this->postJson('/api/superadmin/settings/file-storage/test')
            ->assertOk()
            ->assertJsonPath('status', 'connected');

        $this->assertSame([], Storage::disk('local')->allFiles());
    }

    public function test_smtp_settings_hide_password_and_blank_update_preserves_it(): void
    {
        $this->authenticate();
        $smtpData = $this->validSmtpData();

        $this->putJson('/api/superadmin/settings/email-smtp-update', $smtpData)
            ->assertOk()
            ->assertJsonPath('settings.has_password', true)
            ->assertDontSee('smtp-secret');

        $this->putJson(
            '/api/superadmin/settings/email-smtp-update',
            array_replace($smtpData, ['password' => ''])
        )
            ->assertOk()
            ->assertJsonPath('settings.has_password', true)
            ->assertDontSee('smtp-secret');

        $this->assertSame('smtp-secret', EmailSmtpSetting::firstOrFail()->password);
        $this->assertDatabaseHas('email_smtp_settings', [
            'smtp_host' => 'smtp.example.test',
            'smtp_port' => 587,
            'from_address' => 'noreply@example.test',
        ]);
    }

    public function test_email_templates_can_be_created_and_toggled(): void
    {
        $this->authenticate();
        $templateData = [
            'name' => 'Quarterly Update',
            'description' => 'Quarterly account update.',
            'trigger' => 'Quarter End',
            'subject' => 'Your quarterly update',
            'from_name' => 'Maxus CRM',
            'body' => 'Hello {{admin_name}}',
        ];

        $response = $this->postJson(
            '/api/superadmin/settings/email-templates',
            $templateData
        )
            ->assertCreated()
            ->assertJsonPath('template.slug', 'quarterly-update')
            ->assertJsonPath('template.template_type', 'custom');

        $templateId = $response->json('template.id');

        $this->assertDatabaseHas('email_templates', [
            'id' => $templateId,
            'slug' => 'quarterly-update',
            'is_default' => false,
            'is_active' => true,
        ]);

        $this->patchJson(
            "/api/superadmin/settings/email-templates/{$templateId}/toggle"
        )
            ->assertOk()
            ->assertJsonPath('template.is_active', false);

        $this->assertDatabaseHas('email_templates', [
            'id' => $templateId,
            'is_active' => false,
        ]);
    }

    public function test_system_email_template_cannot_be_deleted(): void
    {
        $this->authenticate();

        $template = EmailTemplate::create([
            'slug' => 'protected-system-template',
            'name' => 'Protected System Template',
            'template_type' => 'system',
            'is_default' => true,
            'is_active' => true,
            'subject' => 'Protected',
            'from_name' => 'Maxus CRM',
            'body' => 'Protected body',
        ]);

        $this->deleteJson(
            "/api/superadmin/settings/email-templates/{$template->id}"
        )
            ->assertUnprocessable()
            ->assertJsonPath('message', 'System email templates cannot be deleted.');

        $this->assertModelExists($template);
    }

    public function test_test_email_endpoint_queues_the_selected_template(): void
    {
        Mail::fake();
        $this->authenticate();

        $template = EmailTemplate::create([
            'slug' => 'test-preview-template',
            'name' => 'Test Preview Template',
            'template_type' => 'custom',
            'is_default' => false,
            'is_active' => true,
            'subject' => 'Preview {{app_name}}',
            'from_name' => '{{app_name}}',
            'body' => 'Hello {{admin_name}}',
        ]);

        $this->postJson(
            "/api/superadmin/settings/email-templates/{$template->id}/test",
            ['test_email' => 'preview@example.test']
        )
            ->assertOk()
            ->assertJsonPath('message', 'Test email sent successfully.');

        Mail::assertQueued(TemplateEmail::class);
    }

    public function test_expired_personal_access_token_is_rejected_and_deleted(): void
    {
        $user = User::factory()->create();
        SecuritySetting::create(['session_timeout' => 30]);
        $token = $user->createToken('expired-test-token');
        $accessToken = $token->accessToken;
        $accessToken->forceFill([
            'last_activity_at' => now()->subMinutes(31),
        ])->save();
        $this->withToken($token->plainTextToken);

        $this->getJson('/api/superadmin/settings/maintenance')
            ->assertUnauthorized()
            ->assertJsonPath('error', 'session_timeout');

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $accessToken->id,
        ]);
    }

    private function authenticate(): User
    {
        $user = User::factory()->create();
        $this->withToken($user->createToken('feature-test')->plainTextToken);

        return $user;
    }

    /**
     * @return array<string, mixed>
     */
    private function validSmtpData(): array
    {
        return [
            'mail_driver' => 'smtp',
            'smtp_host' => 'smtp.example.test',
            'smtp_port' => 587,
            'username' => 'mailer@example.test',
            'password' => 'smtp-secret',
            'encryption' => 'tls',
            'from_address' => 'noreply@example.test',
            'from_name' => 'Maxus CRM',
            'reply_to' => 'support@example.test',
        ];
    }
}
