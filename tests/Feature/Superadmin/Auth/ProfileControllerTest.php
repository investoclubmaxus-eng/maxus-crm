<?php

namespace Tests\Feature\Superadmin\Auth;

use App\Models\User;
use App\Services\Superadmin\Settings\FileStorageSettingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class ProfileControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_upload_uses_the_configured_file_type_and_size(): void
    {
        $this->configureFileStorageSettings('png', 1);
        $user = User::factory()->create([
            'name' => 'Profile User',
            'user_type' => 'super_admin',
        ]);
        $this->actingAs($user, 'sanctum');

        try {
            $response = $this->put('/api/superadmin/profile', [
                'name' => $user->name,
                'phone' => '9876543210',
                'avatar' => UploadedFile::fake()->createWithContent(
                    'avatar.png',
                    base64_decode(
                        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/F1sAAAAASUVORK5CYII='
                    )
                ),
            ], [
                'Accept' => 'application/json',
            ]);

            $response->assertOk()
                ->assertJsonPath('user.name', 'Profile User');

            $avatarPath = $response->json('user.avatar');

            $this->assertStringStartsWith('/profile-images/', $avatarPath);
            $this->assertDatabaseHas('users', [
                'id' => $user->id,
                'avatar' => $avatarPath,
            ]);
        } finally {
            $avatarPath = $user->fresh()->avatar;

            if ($avatarPath) {
                File::delete(public_path(ltrim($avatarPath, '/')));
            }
        }
    }

    public function test_profile_upload_rejects_file_types_not_allowed_by_storage_settings(): void
    {
        $this->configureFileStorageSettings('jpg', 10);
        $user = User::factory()->create([
            'name' => 'Profile User',
            'user_type' => 'super_admin',
        ]);
        $this->actingAs($user, 'sanctum');

        $this->put('/api/superadmin/profile', [
            'name' => $user->name,
            'phone' => '9876543210',
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

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'avatar' => null,
        ]);
    }

    public function test_profile_upload_rejects_files_above_the_configured_size(): void
    {
        $this->configureFileStorageSettings('png', 1);
        $user = User::factory()->create([
            'name' => 'Profile User',
            'user_type' => 'super_admin',
        ]);
        $this->actingAs($user, 'sanctum');

        $this->put('/api/superadmin/profile', [
            'name' => $user->name,
            'phone' => '9876543210',
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

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'avatar' => null,
        ]);
    }

    public function test_user_profile_includes_avatar_upload_settings(): void
    {
        $this->configureFileStorageSettings('jpg,png', 4);
        $user = User::factory()->create([
            'user_type' => 'super_admin',
        ]);
        $this->actingAs($user, 'sanctum');

        $this->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath(
                'user.avatar_upload_settings.max_upload_size',
                4
            )
            ->assertJsonPath(
                'user.avatar_upload_settings.allowed_file_types',
                'jpg,png'
            );
    }

    private function configureFileStorageSettings(
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
