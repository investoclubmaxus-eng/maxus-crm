<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityLogsTest extends TestCase
{
    use RefreshDatabase;

    public function test_activity_logs_include_today_and_yesterday_only(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-20 12:00:00'));

        $user = User::factory()->create();

        $yesterdayActivity = ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'logout',
        ]);
        $yesterdayActivity->forceFill([
            'created_at' => Carbon::parse('2026-09-19 17:00:00'),
        ])->saveQuietly();

        $todayActivity = ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'login',
        ]);
        $todayActivity->forceFill([
            'created_at' => Carbon::parse('2026-09-20 09:00:00'),
        ])->saveQuietly();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/profile/activity-logs');

        $response->assertOk()
            ->assertJsonCount(2, 'activities')
            ->assertJsonPath('activities.0.id', $todayActivity->id)
            ->assertJsonPath('activities.1.id', $yesterdayActivity->id);
    }
}
