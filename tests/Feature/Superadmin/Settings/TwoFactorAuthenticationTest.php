<?php

namespace Tests\Feature\Superadmin\Settings;

use App\Models\SecuritySetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TwoFactorAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_start_two_factor_setup_when_admin_disables_it(): void
    {
        $user = $this->authenticate();
        SecuritySetting::create(['allow_user_two_factor' => false]);

        $this->postJson('/api/superadmin/settings/2fa/setup')
            ->assertForbidden()
            ->assertJsonPath(
                'message',
                'Two-factor authentication is currently disabled by the administrator.'
            );

        $this->assertNull($user->fresh()->two_factor_secret);
    }

    public function test_user_can_start_two_factor_setup_when_allowed(): void
    {
        $user = $this->authenticate();
        SecuritySetting::create(['allow_user_two_factor' => true]);

        $response = $this->postJson('/api/superadmin/settings/2fa/setup')
            ->assertOk()
            ->assertJsonPath('message', 'Two-factor authentication setup started.');

        $secret = $response->json('data.secret');
        $user->refresh();

        $this->assertNotEmpty($secret);
        $this->assertSame($secret, decrypt($user->two_factor_secret));
        $this->assertFalse($user->two_factor_enabled);
        $this->assertStringStartsWith(
            'otpauth://totp/',
            $response->json('data.qr_code_url')
        );
    }

    private function authenticate(): User
    {
        $user = User::factory()->create();
        $this->withToken($user->createToken('feature-test')->plainTextToken);

        return $user;
    }
}
