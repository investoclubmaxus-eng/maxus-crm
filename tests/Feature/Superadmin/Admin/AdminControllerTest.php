<?php

namespace Tests\Feature\Superadmin\Admin;

use App\Http\Middleware\CheckSuperAdmin;
use App\Models\AdminInvitation;
use App\Models\Company;
use App\Models\EmailSmtpSetting;
use App\Models\EmailTemplate;
use App\Models\User;
use App\Notifications\TemplateEmail;
use App\Services\Superadmin\Settings\EmailTemplateService;
use App\Services\Superadmin\Settings\FileStorageSettingService;
use Illuminate\Contracts\Mail\Factory as MailFactory;
use Illuminate\Contracts\Mail\Mailer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Spatie\Multitenancy\Jobs\NotTenantAware;
use Tests\TestCase;

class AdminControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_requests_cannot_list_companies_or_create_admins(): void
    {
        $this->getJson('/api/superadmin/admins/available-companies')
            ->assertUnauthorized();

        $this->postJson('/api/superadmin/admins', [])
            ->assertUnauthorized();

        $this->assertDatabaseCount('users', 0);
    }

    public function test_non_super_admin_cannot_access_admin_company_options(): void
    {
        $admin = User::factory()->create([
            'user_type' => 'admin',
        ]);
        $this->withToken(
            $admin->createToken('feature-test')->plainTextToken
        );

        $this->getJson('/api/superadmin/admins/available-companies')
            ->assertForbidden()
            ->assertJsonFragment([
                'message' => 'This module is restricted to the super admin account. Please sign in with the super admin user.',
            ]);
    }

    public function test_forgot_password_queues_the_password_reset_email_using_the_configured_template(): void
    {
        Mail::fake();
        $user = User::factory()->create([
            'name' => 'CRM Super Admin',
            'email' => 'superadmin@example.test',
            'user_type' => 'super_admin',
            'status' => 'active',
        ]);

        $this->postJson('/api/forgot-password', [
            'email' => $user->email,
        ])
            ->assertOk()
            ->assertJsonPath(
                'message',
                'If an account exists with this email address, a password reset link has been sent.'
            );

        Mail::assertQueued(TemplateEmail::class);

        $queuedEmail = Mail::queued(TemplateEmail::class)->first();
        $this->assertTrue($queuedEmail->hasTo($user->email));
        $this->assertSame('emails', $queuedEmail->queue);
        $this->assertTrue($queuedEmail->afterCommit);
        $this->assertSame(
            'Reset Your '.config('app.name').' Password',
            $queuedEmail->emailSubject
        );
        $this->assertStringContainsString(
            'CRM Super Admin',
            $queuedEmail->bodyHtml
        );
        $this->assertStringContainsString(
            '/reset-password?token=',
            $queuedEmail->bodyHtml
        );
    }

    public function test_activating_an_admin_queues_the_admin_account_activated_template(): void
    {
        Mail::fake();
        $this->authenticateAsSuperAdmin();
        $admin = User::factory()->create([
            'user_type' => 'admin',
            'status' => 'inactive',
        ]);

        $this->patchJson(
            "/api/superadmin/admins-status/{$admin->id}/status",
            ['status' => 'active']
        )
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('email_queued', true)
            ->assertJsonPath('email_template', 'admin-account-activated')
            ->assertJsonPath(
                'message',
                "Admin status updated and account activated email queued for {$admin->email}."
            )
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseCount('admin_invitations', 0);
        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'status' => 'active',
        ]);

        Mail::assertQueued(
            TemplateEmail::class,
            fn (TemplateEmail $mail): bool => $mail->hasTo($admin->email)
                && $mail->queue === 'emails'
                && $mail->afterCommit
        );
    }

    public function test_activation_invitation_is_queued_and_can_be_validated(): void
    {
        Mail::fake();
        $this->authenticateAsSuperAdmin();
        $admin = User::factory()->create([
            'user_type' => 'admin',
            'status' => 'inactive',
        ]);

        $this->postJson("/api/superadmin/admins/{$admin->id}/invitation")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('email_template', 'new-admin-invitation')
            ->assertJsonPath('data.has_pending_invitation', true);

        $invitation = AdminInvitation::query()
            ->where('user_id', $admin->id)
            ->firstOrFail();
        $this->assertNotNull($invitation->sent_at);
        $this->assertNull($invitation->accepted_at);
        $this->assertNull($invitation->revoked_at);
        $this->assertSame('inactive', $admin->fresh()->status);

        Mail::assertQueued(
            TemplateEmail::class,
            fn (TemplateEmail $mail): bool => $mail->hasTo($admin->email)
                && $mail->queue === 'emails'
        );

        $queuedEmail = Mail::queued(TemplateEmail::class)->first();
        $this->assertInstanceOf(NotTenantAware::class, $queuedEmail);

        preg_match('/token=([A-Za-z0-9]+)/', $queuedEmail->bodyHtml, $tokenMatch);
        $this->assertSame(64, strlen($tokenMatch[1] ?? ''));

        $this->postJson('/api/admin-invitations/validate', [
            'token' => $tokenMatch[1],
            'email' => 'different-admin@example.test',
        ])->assertUnprocessable();

        $this->postJson('/api/admin-invitations/validate', [
            'token' => $tokenMatch[1],
            'email' => $admin->email,
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', $admin->email);
    }

    public function test_template_email_uses_saved_smtp_settings_when_sent_by_a_queue_worker(): void
    {
        EmailSmtpSetting::query()->create([
            'mail_driver' => 'smtp',
            'smtp_host' => 'smtp.example.test',
            'smtp_port' => 587,
            'username' => 'mailer@example.test',
            'password' => 'smtp-secret',
            'encryption' => 'tls',
            'from_address' => 'noreply@example.test',
            'from_name' => 'Maxus CRM',
            'reply_to' => 'support@example.test',
        ]);
        $mailer = \Mockery::mock(Mailer::class);
        $mailer->shouldReceive('send')->once()->andReturn(null);
        $factory = \Mockery::mock(MailFactory::class);
        $factory->shouldReceive('mailer')
            ->once()
            ->with(null)
            ->andReturnUsing(function () use ($mailer): Mailer {
                $this->assertSame('smtp', config('mail.default'));
                $this->assertSame(
                    'smtp.example.test',
                    config('mail.mailers.smtp.host')
                );

                return $mailer;
            });

        $email = new TemplateEmail(
            'Admin invitation',
            'Maxus CRM',
            'Set your password.'
        );
        $email->to('admin@example.test')->send($factory);
    }

    public function test_admin_invitation_cannot_be_sent_after_intentional_deactivation(): void
    {
        Mail::fake();
        $this->authenticateAsSuperAdmin();
        $admin = User::factory()->create([
            'user_type' => 'admin',
            'status' => 'inactive',
        ]);
        AdminInvitation::query()->create([
            'user_id' => $admin->id,
            'token_hash' => hash('sha256', 'revoked-invitation-token'),
            'expires_at' => now()->addDay(),
            'revoked_at' => now(),
        ]);

        $this->postJson("/api/superadmin/admins/{$admin->id}/invitation")
            ->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath(
                'message',
                'This administrator was intentionally deactivated. Set the account active before sending a new invitation.'
            );

        Mail::assertNothingOutgoing();
    }

    public function test_admin_can_set_a_password_with_the_invitation_link(): void
    {
        $admin = User::factory()->create([
            'user_type' => 'admin',
            'status' => 'inactive',
        ]);
        $invitation = AdminInvitation::query()->create([
            'user_id' => $admin->id,
            'token_hash' => hash('sha256', 'valid-invitation-token'),
            'expires_at' => now()->addDay(),
        ]);

        $this->postJson('/api/admin-invitations/validate', [
            'token' => 'valid-invitation-token',
            'email' => $admin->email,
        ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->postJson('/api/reset-password', [
            'token' => 'valid-invitation-token',
            'email' => $admin->email,
            'invitation' => true,
            'password' => 'StrongerPassword123',
            'password_confirmation' => 'StrongerPassword123',
        ])
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Your administrator account is ready. You can now sign in.'
            );

        $this->assertTrue(Hash::check(
            'StrongerPassword123',
            $admin->fresh()->password
        ));
        $this->assertSame('active', $admin->fresh()->status);
        $this->assertNotNull($invitation->fresh()->accepted_at);

        $this->postJson('/api/admin-invitations/validate', [
            'token' => 'valid-invitation-token',
            'email' => $admin->email,
        ])->assertUnprocessable();
    }

    public function test_admin_with_active_status_can_set_a_password_with_the_invitation_link(): void
    {
        $admin = User::factory()->create([
            'user_type' => 'admin',
            'status' => 'active',
        ]);
        $invitation = AdminInvitation::query()->create([
            'user_id' => $admin->id,
            'token_hash' => hash('sha256', 'active-admin-token'),
            'expires_at' => now()->addDay(),
        ]);

        $this->postJson('/api/admin-invitations/validate', [
            'token' => 'active-admin-token',
            'email' => $admin->email,
        ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->postJson('/api/reset-password', [
            'token' => 'active-admin-token',
            'email' => $admin->email,
            'invitation' => true,
            'password' => 'StrongerPassword123',
            'password_confirmation' => 'StrongerPassword123',
        ])
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Your administrator account is ready. You can now sign in.'
            );

        $this->assertTrue(Hash::check(
            'StrongerPassword123',
            $admin->fresh()->password
        ));
        $this->assertSame('active', $admin->fresh()->status);
        $this->assertNotNull($invitation->fresh()->accepted_at);
    }

    public function test_reactivating_an_admin_with_an_accepted_invitation_queues_the_activated_template(): void
    {
        Mail::fake();
        $this->authenticateAsSuperAdmin();
        $admin = User::factory()->create([
            'user_type' => 'admin',
            'status' => 'inactive',
        ]);
        AdminInvitation::query()->create([
            'user_id' => $admin->id,
            'token_hash' => hash('sha256', 'accepted-token'),
            'expires_at' => now()->addDay(),
            'accepted_at' => now(),
        ]);

        $this->patchJson(
            "/api/superadmin/admins-status/{$admin->id}/status",
            ['status' => 'active']
        )
            ->assertOk()
            ->assertJsonPath('email_template', 'admin-account-activated')
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'status' => 'active',
        ]);

        Mail::assertQueued(
            TemplateEmail::class,
            fn (TemplateEmail $mail): bool => $mail->hasTo($admin->email)
                && $mail->queue === 'emails'
                && $mail->afterCommit
        );
    }

    public function test_deactivating_an_admin_queues_the_disabled_template(): void
    {
        Mail::fake();
        $this->authenticateAsSuperAdmin();
        $admin = User::factory()->create([
            'user_type' => 'admin',
            'status' => 'active',
        ]);
        $invitation = AdminInvitation::query()->create([
            'user_id' => $admin->id,
            'token_hash' => hash('sha256', 'pending-invitation-token'),
            'expires_at' => now()->addDay(),
        ]);

        $this->patchJson(
            "/api/superadmin/admins-status/{$admin->id}/status",
            ['status' => 'inactive']
        )
            ->assertOk()
            ->assertJsonPath('email_template', 'account-disabled')
            ->assertJsonPath('data.status', 'inactive');

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'status' => 'inactive',
        ]);
        $this->assertNotNull($invitation->fresh()->revoked_at);
        $this->postJson('/api/admin-invitations/validate', [
            'token' => 'pending-invitation-token',
            'email' => $admin->email,
        ])->assertUnprocessable();

        Mail::assertQueued(
            TemplateEmail::class,
            fn (TemplateEmail $mail): bool => $mail->hasTo($admin->email)
                && $mail->queue === 'emails'
                && $mail->afterCommit
        );
    }

    public function test_status_is_not_changed_and_error_is_reported_when_template_is_inactive(): void
    {
        Mail::fake();
        $this->authenticateAsSuperAdmin();
        app(EmailTemplateService::class)->ensureDefaultTemplates();
        EmailTemplate::query()
            ->where('slug', 'account-disabled')
            ->update(['is_active' => false]);
        $admin = User::factory()->create([
            'user_type' => 'admin',
            'status' => 'active',
        ]);

        $this->patchJson(
            "/api/superadmin/admins-status/{$admin->id}/status",
            ['status' => 'inactive']
        )
            ->assertStatus(502)
            ->assertJsonPath('success', false)
            ->assertJsonPath(
                'message',
                'Unable to complete the admin status update and queue its email. Check the administrator status before retrying, and verify the SMTP settings and email template.'
            );

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'status' => 'active',
        ]);
        Mail::assertNothingOutgoing();
    }

    public function test_company_options_contain_only_active_companies(): void
    {
        $this->authenticateAsSuperAdmin();
        $activeCompany = $this->createCompany('ACTIVE');

        $this->createCompany('INACTIVE', 'inactive');
        $deletedCompany = $this->createCompany('DELETED');
        $deletedCompany->delete();

        $this->getJson('/api/superadmin/admins/available-companies')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $activeCompany->id)
            ->assertJsonPath('data.0.code', 'ACTIVE');
    }

    public function test_admin_details_are_returned_for_an_admin_user(): void
    {
        $this->withoutMiddleware(CheckSuperAdmin::class);
        $this->actingAs(User::factory()->create([
            'user_type' => 'admin',
        ]), 'sanctum');

        $admin = User::factory()->create([
            'user_type' => 'admin',
        ]);

        $this->getJson("/api/superadmin/admins-details/{$admin->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $admin->id)
            ->assertJsonPath('data.user_type', 'admin');
    }

    public function test_admin_creation_grants_access_to_multiple_companies_with_one_default(): void
    {
        $superAdmin = $this->authenticateAsSuperAdmin();
        $firstCompany = $this->createCompany('FIRST');
        $defaultCompany = $this->createCompany('DEFAULT');

        $this->postJson('/api/superadmin/admins', [
            'name' => 'New Administrator',
            'email' => 'new-admin@example.test',
            'status' => 'active',
            'companies' => [
                [
                    'company_id' => $firstCompany->id,
                    'role' => 'admin',
                    'status' => 'active',
                    'is_default' => false,
                ],
                [
                    'company_id' => $defaultCompany->id,
                    'role' => 'admin',
                    'status' => 'active',
                    'is_default' => true,
                ],
            ],
            'phone' => '9876543210',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user_type', 'admin')
            ->assertJsonPath('data.phone', '+919876543210')
            ->assertJsonCount(2, 'data.companies');

        $admin = User::query()
            ->where('email', 'new-admin@example.test')
            ->firstOrFail();

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'name' => 'New Administrator',
            'user_type' => 'admin',
            'status' => 'active',
            'phone' => '+919876543210',
        ]);
        $this->assertDatabaseHas('company_user_access', [
            'user_id' => $admin->id,
            'company_id' => $firstCompany->id,
            'granted_by' => $superAdmin->id,
            'is_default' => false,
        ]);
        $this->assertDatabaseHas('company_user_access', [
            'user_id' => $admin->id,
            'company_id' => $defaultCompany->id,
            'granted_by' => $superAdmin->id,
            'is_default' => true,
        ]);
        $this->assertDatabaseCount('company_user_access', 2);
    }

    public function test_admin_creation_rejects_access_to_more_than_two_companies(): void
    {
        $this->authenticateAsSuperAdmin();
        $companies = [
            $this->createCompany('MAX-ONE'),
            $this->createCompany('MAX-TWO'),
            $this->createCompany('MAX-THREE'),
        ];

        $this->postJson('/api/superadmin/admins', [
            'name' => 'Too Many Companies',
            'email' => 'too-many-companies@example.test',
            'companies' => collect($companies)
                ->map(fn (Company $company): array => [
                    'company_id' => $company->id,
                    'is_default' => false,
                ])
                ->all(),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('companies')
            ->assertJsonPath(
                'errors.companies.0',
                'An admin can access a maximum of 2 companies.'
            );

        $this->assertDatabaseMissing('users', [
            'email' => 'too-many-companies@example.test',
        ]);
        $this->assertDatabaseCount('company_user_access', 0);
    }

    public function test_admin_creation_stores_an_uploaded_profile_picture(): void
    {
        $this->authenticateAsSuperAdmin();
        $company = $this->createCompany('AVATAR');
        $email = 'admin-avatar@example.test';

        try {
            $response = $this->post('/api/superadmin/admins', [
                'name' => 'Admin With Photo',
                'email' => $email,
                'status' => 'active',
                'companies' => [
                    [
                        'company_id' => $company->id,
                        'is_default' => true,
                    ],
                ],
                'avatar' => UploadedFile::fake()->createWithContent(
                    'avatar.png',
                    base64_decode(
                        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/F1sAAAAASUVORK5CYII='
                    )
                ),
            ], [
                'Accept' => 'application/json',
            ]);

            $response->assertCreated()
                ->assertJsonPath('success', true);

            $avatarPath = $response->json('data.avatar');
            $this->assertStringStartsWith('/profile-images/', $avatarPath);
            $this->assertFileExists(
                public_path(ltrim($avatarPath, '/'))
            );
            $this->assertDatabaseHas('users', [
                'email' => $email,
                'avatar' => $avatarPath,
            ]);
        } finally {
            $avatarPath = User::query()
                ->where('email', $email)
                ->value('avatar');

            if ($avatarPath) {
                File::delete(public_path(ltrim($avatarPath, '/')));
            }
        }
    }

    public function test_admin_creation_rejects_non_image_profile_pictures(): void
    {
        $this->authenticateAsSuperAdmin();
        $company = $this->createCompany('INVALID-AVATAR');

        $this->post('/api/superadmin/admins', [
            'name' => 'Admin With Invalid Photo',
            'email' => 'invalid-avatar@example.test',
            'companies' => [
                [
                    'company_id' => $company->id,
                    'is_default' => true,
                ],
            ],
            'avatar' => UploadedFile::fake()->create(
                'avatar.txt',
                1,
                'text/plain'
            ),
        ], [
            'Accept' => 'application/json',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('avatar')
            ->assertJsonPath(
                'errors.avatar.0',
                'Profile photo must be a valid image.'
            );

        $this->assertDatabaseMissing('users', [
            'email' => 'invalid-avatar@example.test',
        ]);
    }

    public function test_admin_creation_rejects_profile_picture_types_not_allowed_by_storage_settings(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->configureAvatarStorageSettings('jpg', 10);
        $company = $this->createCompany('DISALLOWED-AVATAR');

        $this->post('/api/superadmin/admins', [
            'name' => 'Admin With Disallowed Photo',
            'email' => 'disallowed-avatar@example.test',
            'companies' => [
                [
                    'company_id' => $company->id,
                    'is_default' => true,
                ],
            ],
            'avatar' => UploadedFile::fake()->createWithContent(
                'avatar.png',
                $this->pngContents()
            ),
        ], [
            'Accept' => 'application/json',
        ])
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.avatar.0',
                'Profile photo type must be allowed by File Storage settings.'
            );

        $this->assertDatabaseMissing('users', [
            'email' => 'disallowed-avatar@example.test',
        ]);
    }

    public function test_admin_creation_rejects_profile_pictures_above_the_configured_size(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->configureAvatarStorageSettings('png', 1);
        $company = $this->createCompany('LARGE-AVATAR');

        $this->post('/api/superadmin/admins', [
            'name' => 'Admin With Large Photo',
            'email' => 'large-avatar@example.test',
            'companies' => [
                [
                    'company_id' => $company->id,
                    'is_default' => true,
                ],
            ],
            'avatar' => UploadedFile::fake()
                ->createWithContent(
                    'large-avatar.png',
                    $this->pngContents(1024 * 1024)
                ),
        ], [
            'Accept' => 'application/json',
        ])
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.avatar.0',
                'Profile photo exceeds the maximum size configured in File Storage settings.'
            );

        $this->assertDatabaseMissing('users', [
            'email' => 'large-avatar@example.test',
        ]);
    }

    public function test_admin_creation_rejects_inactive_company_access(): void
    {
        $this->authenticateAsSuperAdmin();
        $inactiveCompany = $this->createCompany('INACTIVE', 'inactive');

        $this->postJson('/api/superadmin/admins', [
            'name' => 'New Administrator',
            'email' => 'new-admin@example.test',
            'companies' => [
                [
                    'company_id' => $inactiveCompany->id,
                    'role' => 'admin',
                    'status' => 'active',
                    'is_default' => true,
                ],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['companies.0.company_id'])
            ->assertJsonFragment([
                'companies.0.company_id' => ['Select an active company.'],
            ]);

        $this->assertDatabaseMissing('users', [
            'email' => 'new-admin@example.test',
        ]);
        $this->assertDatabaseCount('company_user_access', 0);
    }

    public function test_admin_creation_rejects_phone_values_that_are_not_ten_digits(): void
    {
        $this->authenticateAsSuperAdmin();
        $company = $this->createCompany('PHONE');

        $this->postJson('/api/superadmin/admins', [
            'name' => 'New Administrator',
            'email' => 'new-admin@example.test',
            'phone' => '98765abc',
            'companies' => [
                [
                    'company_id' => $company->id,
                    'is_default' => true,
                ],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['phone'])
            ->assertJsonPath(
                'errors.phone.0',
                'Phone number must contain exactly 10 digits.'
            );

        $this->assertDatabaseMissing('users', [
            'email' => 'new-admin@example.test',
        ]);
    }

    public function test_admin_creation_rejects_multiple_default_companies(): void
    {
        $this->authenticateAsSuperAdmin();
        $firstCompany = $this->createCompany('FIRST');
        $secondCompany = $this->createCompany('SECOND');

        $this->postJson('/api/superadmin/admins', [
            'name' => 'New Administrator',
            'email' => 'new-admin@example.test',
            'companies' => [
                [
                    'company_id' => $firstCompany->id,
                    'is_default' => true,
                ],
                [
                    'company_id' => $secondCompany->id,
                    'is_default' => true,
                ],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['companies'])
            ->assertJsonFragment([
                'companies' => [
                    'Only one company can be selected as the default.',
                ],
            ]);

        $this->assertDatabaseMissing('users', [
            'email' => 'new-admin@example.test',
        ]);
        $this->assertDatabaseCount('company_user_access', 0);
    }

    public function test_admin_update_saves_profile_and_company_access_changes(): void
    {
        $superAdmin = $this->authenticateAsSuperAdmin();
        $admin = User::factory()->create([
            'user_type' => 'admin',
        ]);
        $existingCompany = $this->createCompany('EXISTING');
        $newCompany = $this->createCompany('NEW');

        $admin->companies()->attach($existingCompany->id, [
            'role' => 'admin',
            'status' => 'active',
            'is_default' => true,
            'granted_by' => $superAdmin->id,
            'granted_at' => now(),
        ]);

        $existingCompany->update([
            'status' => 'inactive',
        ]);

        $this->putJson("/api/superadmin/admins-update/{$admin->id}", [
            'name' => 'Updated Administrator',
            'email' => $admin->email,
            'phone' => '9876543210',
            'location' => 'Gurugram',
            'status' => 'active',
            'companies' => [
                [
                    'company_id' => $existingCompany->id,
                    'role' => 'admin',
                    'status' => 'active',
                    'is_default' => false,
                ],
                [
                    'company_id' => $newCompany->id,
                    'role' => 'admin',
                    'status' => 'active',
                    'is_default' => true,
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Updated Administrator')
            ->assertJsonPath('data.phone', '+919876543210')
            ->assertJsonCount(2, 'data.companies');

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'name' => 'Updated Administrator',
            'location' => 'Gurugram',
        ]);
        $this->assertDatabaseHas('company_user_access', [
            'user_id' => $admin->id,
            'company_id' => $existingCompany->id,
            'granted_by' => $superAdmin->id,
            'is_default' => false,
        ]);
        $this->assertDatabaseHas('company_user_access', [
            'user_id' => $admin->id,
            'company_id' => $newCompany->id,
            'granted_by' => $superAdmin->id,
            'is_default' => true,
        ]);
        $this->assertDatabaseCount('company_user_access', 2);
    }

    public function test_admin_update_rejects_access_to_more_than_two_companies(): void
    {
        $superAdmin = $this->authenticateAsSuperAdmin();
        $admin = User::factory()->create([
            'user_type' => 'admin',
        ]);
        $companies = [
            $this->createCompany('UPDATE-MAX-ONE'),
            $this->createCompany('UPDATE-MAX-TWO'),
            $this->createCompany('UPDATE-MAX-THREE'),
        ];

        foreach (array_slice($companies, 0, 2) as $company) {
            $admin->companies()->attach($company->id, [
                'role' => 'admin',
                'status' => 'active',
                'is_default' => false,
                'granted_by' => $superAdmin->id,
                'granted_at' => now(),
            ]);
        }

        $this->putJson("/api/superadmin/admins-update/{$admin->id}", [
            'name' => $admin->name,
            'email' => $admin->email,
            'companies' => collect($companies)
                ->map(fn (Company $company): array => [
                    'company_id' => $company->id,
                    'is_default' => false,
                ])
                ->all(),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('companies')
            ->assertJsonPath(
                'errors.companies.0',
                'An admin can access a maximum of 2 companies.'
            );

        $this->assertDatabaseCount('company_user_access', 2);
        $this->assertDatabaseMissing('company_user_access', [
            'user_id' => $admin->id,
            'company_id' => $companies[2]->id,
        ]);
    }

    public function test_granting_access_rejects_a_third_company_for_an_admin(): void
    {
        $superAdmin = $this->authenticateAsSuperAdmin();
        $admin = User::factory()->create([
            'user_type' => 'admin',
        ]);
        $companies = [
            $this->createCompany('GRANT-MAX-ONE'),
            $this->createCompany('GRANT-MAX-TWO'),
            $this->createCompany('GRANT-MAX-THREE'),
        ];

        foreach (array_slice($companies, 0, 2) as $company) {
            $admin->companies()->attach($company->id, [
                'role' => 'admin',
                'status' => 'active',
                'is_default' => false,
                'granted_by' => $superAdmin->id,
                'granted_at' => now(),
            ]);
        }

        $this->postJson(
            "/api/superadmin/admins-grant-access/{$admin->id}/companies",
            [
                'company_id' => $companies[2]->id,
            ]
        )
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'An admin can access a maximum of 2 companies.'
            );

        $this->assertDatabaseCount('company_user_access', 2);
        $this->assertDatabaseMissing('company_user_access', [
            'user_id' => $admin->id,
            'company_id' => $companies[2]->id,
        ]);
    }

    public function test_admin_update_accepts_default_company_flags_from_multipart_form_data(): void
    {
        $superAdmin = $this->authenticateAsSuperAdmin();
        $admin = User::factory()->create([
            'user_type' => 'admin',
        ]);
        $company = $this->createCompany('MULTIPART-DEFAULT');

        $this->post("/api/superadmin/admins-update/{$admin->id}", [
            '_method' => 'PUT',
            'name' => $admin->name,
            'email' => $admin->email,
            'status' => 'active',
            'companies' => [
                [
                    'company_id' => (string) $company->id,
                    'role' => 'admin',
                    'status' => 'active',
                    'is_default' => '1',
                ],
            ],
        ], [
            'Accept' => 'application/json',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.companies.0.pivot.is_default', 1);

        $this->assertDatabaseHas('company_user_access', [
            'user_id' => $admin->id,
            'company_id' => $company->id,
            'granted_by' => $superAdmin->id,
            'is_default' => true,
        ]);
    }

    public function test_admin_update_replaces_an_existing_profile_picture(): void
    {
        $this->authenticateAsSuperAdmin();
        $admin = User::factory()->create([
            'user_type' => 'admin',
            'avatar' => '/profile-images/old-admin-avatar.png',
        ]);
        $oldAvatarPath = public_path('profile-images/old-admin-avatar.png');
        File::ensureDirectoryExists(dirname($oldAvatarPath));
        File::put($oldAvatarPath, 'old profile picture');

        try {
            $response = $this->post(
                "/api/superadmin/admins-update/{$admin->id}",
                [
                    '_method' => 'PUT',
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'status' => 'active',
                    'avatar' => UploadedFile::fake()->createWithContent(
                        'updated-avatar.png',
                        base64_decode(
                            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/F1sAAAAASUVORK5CYII='
                        )
                    ),
                ],
                [
                    'Accept' => 'application/json',
                ]
            );

            $response->assertOk()
                ->assertJsonPath('success', true);

            $avatarPath = $response->json('data.avatar');
            $this->assertNotSame('/profile-images/old-admin-avatar.png', $avatarPath);
            $this->assertFileExists(
                public_path(ltrim($avatarPath, '/'))
            );
            $this->assertFileDoesNotExist($oldAvatarPath);
            $this->assertDatabaseHas('users', [
                'id' => $admin->id,
                'avatar' => $avatarPath,
            ]);
        } finally {
            File::delete($oldAvatarPath);
            $avatarPath = User::query()
                ->whereKey($admin->id)
                ->value('avatar');

            if ($avatarPath && $avatarPath !== '/profile-images/old-admin-avatar.png') {
                File::delete(public_path(ltrim($avatarPath, '/')));
            }
        }
    }

    public function test_admin_update_cannot_grant_new_access_to_an_inactive_company(): void
    {
        $this->authenticateAsSuperAdmin();
        $admin = User::factory()->create([
            'user_type' => 'admin',
        ]);
        $inactiveCompany = $this->createCompany('INACTIVE', 'inactive');

        $this->putJson("/api/superadmin/admins-update/{$admin->id}", [
            'name' => $admin->name,
            'email' => $admin->email,
            'status' => 'active',
            'companies' => [
                [
                    'company_id' => $inactiveCompany->id,
                    'role' => 'admin',
                    'status' => 'active',
                    'is_default' => true,
                ],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['companies.0.company_id']);

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'name' => $admin->name,
        ]);
        $this->assertDatabaseCount('company_user_access', 0);
    }

    private function authenticateAsSuperAdmin(): User
    {
        $superAdmin = User::factory()->create([
            'user_type' => 'super_admin',
        ]);
        $this->withToken(
            $superAdmin->createToken('feature-test')->plainTextToken
        );

        return $superAdmin;
    }

    private function createCompany(
        string $code,
        string $status = 'active'
    ): Company {
        return Company::query()->create([
            'name' => "Company {$code}",
            'code' => $code,
            'status' => $status,
        ]);
    }

    private function configureAvatarStorageSettings(
        string $allowedFileTypes,
        int $maxUploadSize
    ): void {
        app(FileStorageSettingService::class)->update([
            'driver' => 'local',
            'max_upload_size' => $maxUploadSize,
            'max_files' => 10,
            'allowed_file_types' => $allowedFileTypes,
            'retention_days' => 30,
            'automatic_cleanup' => true,
        ]);
    }

    private function pngContents(int $paddingBytes = 0): string
    {
        $imageContents = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/F1sAAAAASUVORK5CYII='
        );

        return $imageContents.str_repeat(' ', $paddingBytes);
    }
}
