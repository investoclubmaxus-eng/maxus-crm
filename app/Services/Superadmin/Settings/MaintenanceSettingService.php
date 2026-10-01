<?php

namespace App\Services\Superadmin\Settings;

use App\Models\MaintenanceSetting;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Throwable;

class MaintenanceSettingService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

      /**
     * Get maintenance settings.
     *
     * Creates the default settings row if it does not exist.
     */
    public function getMaintenanceSettings(): MaintenanceSetting
    {
        $settings = MaintenanceSetting::first();

        if (!$settings) {
            $settings = MaintenanceSetting::create([
                'maintenance_mode' => false,
                'maintenance_message' =>
                    'We are currently performing system maintenance. Please try again later.',
                'allow_super_admin_access' => true,
                'log_retention_days' => 30,
            ]);
        }

        return $settings;
    }

     /**
     * Update maintenance settings.
     */
    public function update(array $data): MaintenanceSetting
    {
        $settings = $this->getMaintenanceSettings();

        $settings->update([
            'maintenance_mode' =>
                $data['maintenance_mode'] ?? false,

            'maintenance_message' =>
                $data['maintenance_message'] ?? null,

            'allow_super_admin_access' =>
                $data['allow_super_admin_access'] ?? true,

            'log_retention_days' =>
                $data['log_retention_days'] ?? 30,
        ]);

        return $settings->fresh();
    }


    /**
     * Enable maintenance mode.
     */
    public function enableMaintenance(): MaintenanceSetting
    {
        $settings = $this->getMaintenanceSettings();

        $settings->update([
            'maintenance_mode' => true,
        ]);

        return $settings->fresh();
    }

    /**
     * Disable maintenance mode.
     */
    public function disableMaintenance(): MaintenanceSetting
    {
        $settings = $this->getMaintenanceSettings();

        $settings->update([
            'maintenance_mode' => false,
        ]);

        return $settings->fresh();
    }

    /**
     * Clear application cache.
     */
    public function clearApplicationCache(): array
    {
        Artisan::call('cache:clear');

        return [
            'success' => true,
            'message' => 'Application cache cleared successfully.',
        ];
    }

    /**
     * Clear configuration cache.
     */
    public function clearConfigurationCache(): array
    {
        Artisan::call('config:clear');

        return [
            'success' => true,
            'message' => 'Configuration cache cleared successfully.',
        ];
    }

    /**
     * Clear route and view cache.
     */
    public function clearRouteViewCache(): array
    {
        Artisan::call('route:clear');
        Artisan::call('view:clear');

        return [
            'success' => true,
            'message' => 'Route and view cache cleared successfully.',
        ];
    }

    /**
     * Clear all Laravel caches.
     */
    public function clearAllCache(): array
    {
        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');

        return [
            'success' => true,
            'message' => 'All application caches cleared successfully.',
        ];
    }

    /**
     * Remove old application log files.
     */
    public function cleanupOldLogs(): array
    {
        $settings = $this->getMaintenanceSettings();

        $retentionDays = (int) $settings->log_retention_days;

        $logsPath = storage_path('logs');

        if (!File::isDirectory($logsPath)) {
            return [
                'success' => true,
                'deleted_count' => 0,
                'message' => 'Log directory does not exist.',
            ];
        }

        $cutoffTime = now()->subDays($retentionDays)->timestamp;

        $deletedCount = 0;

        foreach (File::files($logsPath) as $file) {
            if ($file->getMTime() < $cutoffTime) {
                File::delete($file->getPathname());

                $deletedCount++;
            }
        }

        return [
            'success' => true,
            'deleted_count' => $deletedCount,
            'message' =>
                "{$deletedCount} old log file(s) removed successfully.",
        ];
    }

    /**
     * Clear failed queue jobs.
     */
    public function clearFailedJobs(): array
    {
        try {
            $deletedCount = DB::table('failed_jobs')->delete();

            return [
                'success' => true,
                'deleted_count' => $deletedCount,
                'message' =>
                    "{$deletedCount} failed job(s) removed successfully.",
            ];
        } catch (Throwable $e) {
            return [
                'success' => false,
                'deleted_count' => 0,
                'message' =>
                    'Unable to clear failed jobs.',
            ];
        }
    }

    /**
     * Check database health.
     */
    public function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();

            return [
                'status' => 'connected',
                'label' => 'Connected',
            ];
        } catch (Throwable $e) {
            return [
                'status' => 'error',
                'label' => 'Unavailable',
            ];
        }
    }

    /**
     * Check storage health.
     */
    public function checkStorage(): array
    {
        $storagePath = storage_path();

        if (
            File::isDirectory($storagePath) &&
            File::isWritable($storagePath)
        ) {
            return [
                'status' => 'available',
                'label' => 'Available',
            ];
        }

        return [
            'status' => 'error',
            'label' => 'Unavailable',
        ];
    }

    /**
     * Check application health.
     */
    public function checkApplication(): array
    {
        return [
            'status' => 'operational',
            'label' => 'Operational',
        ];
    }

    /**
     * Get system health information.
     */
    public function getSystemHealth(): array
    {
        return [
            'application' =>
                $this->checkApplication(),

            'database' =>
                $this->checkDatabase(),

            'storage' =>
                $this->checkStorage(),

            'queue' => [
                'status' => config('queue.default'),
                'label' => ucfirst(
                    config('queue.default', 'Unknown')
                ),
            ],

            'scheduler' => [
                'status' => 'configured',
                'label' => 'Configured',
            ],

            'checked_at' =>
                now()->toIso8601String(),
        ];
    }
}


