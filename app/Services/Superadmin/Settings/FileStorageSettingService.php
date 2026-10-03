<?php

namespace App\Services\Superadmin\Settings;

use App\Models\FileStorageSetting;
use Illuminate\Support\Facades\Storage;

class FileStorageSettingService
{
    /**
     * Get file storage settings.
     */
    public function getFileStorageSettings(): FileStorageSetting
    {
        $settings = FileStorageSetting::first();

        if (!$settings) {
            $settings = FileStorageSetting::create([
                'driver' => 'local',
                'max_upload_size' => 10,
                'max_files' => 10,
                'allowed_file_types' => 'jpg, jpeg, png, gif, webp, pdf, doc, docx, xls, xlsx, csv',
                'retention_days' => 30,
                'automatic_cleanup' => true,
            ]);
        }

        return $settings;
    }

    /**
     * Update file storage settings.
     */
    public function update(array $data): FileStorageSetting
    {
        $settings = $this->getFileStorageSettings();

        $settings->update([
            'driver' => $data['driver'],
            'max_upload_size' => $data['max_upload_size'],
            'max_files' => $data['max_files'],
            'allowed_file_types' => $data['allowed_file_types'],
            'retention_days' => $data['retention_days'],
            'automatic_cleanup' => $data['automatic_cleanup'],
        ]);

        return $settings->fresh();
    }

    /**
     * Test the configured storage.
     */
    // public function testStorage(): array
    // {
    //     $settings = $this->getFileStorageSettings();
       

    //     try {
    //         $disk = Storage::disk($settings->driver);

    //         $testFile = 'settings/storage-test-' . uniqid() . '.txt';
    //           dd($testFile);

    //         $disk->put(
    //             $testFile,
    //             'Maxus CRM storage connection test.'
    //         );

    //         $exists = $disk->exists($testFile);

    //         if ($exists) {
    //             $disk->delete($testFile);
    //         }

    //         return [
    //             'status' => $exists ? 'connected' : 'unavailable',
    //             'message' => $exists
    //                 ? 'Storage connection is working successfully.'
    //                 : 'Storage connection test failed.',
    //         ];
    //     } catch (\Throwable $e) {
    //         return [
    //             'status' => 'unavailable',
    //             'message' => 'Unable to connect to the configured storage.',
    //         ];
    //     }
    // }

    public function testStorage(): array
{
    $settings = $this->getFileStorageSettings();

    $testFile = 'settings/storage-test-' . uniqid() . '.txt';

    try {
        $disk = Storage::disk($settings->driver);

        $disk->put(
            $testFile,
            'Maxus CRM storage connection test.'
        );

        if (!$disk->exists($testFile)) {
            return [
                'status' => 'unavailable',
                'message' => 'Storage connection test failed.',
            ];
        }

        return [
            'status' => 'connected',
            'message' => 'Storage connection is working successfully.',
        ];

    } catch (\Throwable $e) {
        return [
            'status' => 'unavailable',
            'message' => 'Unable to connect to the configured storage.',
        ];

    } finally {
        // Remove the temporary test file.
        try {
            if (isset($disk) && $disk->exists($testFile)) {
                $disk->delete($testFile);
            }
        } catch (\Throwable $e) {
            // Do not let cleanup failure change the test result.
        }
    }
}

    /**
     * Get storage usage information.
     */
   public function getStorageUsage(): array
    {
        $settings = $this->getFileStorageSettings();

        try {
            $disk = Storage::disk($settings->driver);

            /*
            * =====================================================
            * CRM STORAGE USAGE
            * =====================================================
            */

            $files = $disk->allFiles();

            $crmUsedBytes = 0;

            foreach ($files as $file) {
                try {
                    $crmUsedBytes += $disk->size($file);
                } catch (\Throwable $e) {
                    continue;
                }
            }

            /*
            * =====================================================
            * SERVER / LAPTOP DISK
            * =====================================================
            */

            $totalBytes = disk_total_space(base_path());
            $freeBytes = disk_free_space(base_path());

            if (
                $totalBytes === false ||
                $freeBytes === false
            ) {
                return [
                    'crm_used' => $this->formatBytes($crmUsedBytes),

                    'server_total' => 'N/A',
                    'server_used' => 'N/A',
                    'server_available' => 'N/A',
                    'server_percentage' => 0,
                ];
            }

            $serverUsedBytes = $totalBytes - $freeBytes;

            $serverPercentage = $totalBytes > 0
                ? round(
                    ($serverUsedBytes / $totalBytes) * 100,
                    2
                )
                : 0;

            return [
                /*
                * Maxus CRM files
                */
                'crm_used' => $this->formatBytes(
                    $crmUsedBytes
                ),

                /*
                * Whole server/laptop disk
                */
                'server_total' => $this->formatBytes(
                    $totalBytes
                ),

                'server_used' => $this->formatBytes(
                    $serverUsedBytes
                ),

                'server_available' => $this->formatBytes(
                    $freeBytes
                ),

                'server_percentage' => $serverPercentage,
            ];

        } catch (\Throwable $e) {

            return [
                'crm_used' => 'N/A',
                'server_total' => 'N/A',
                'server_used' => 'N/A',
                'server_available' => 'N/A',
                'server_percentage' => 0,
            ];
        }
    }

    /**
     * Get the configured storage path.
    */
    public function getStoragePath(): string
    {
        $settings = $this->getFileStorageSettings();
         
        return match ($settings->driver) {
            'local' => storage_path(''),
            'public' => public_path(),
            's3' => 'Amazon S3',
            default => 'Configured storage',
        };
    }

    /**
     * Format bytes into readable format.
    */
    private function formatBytes(int|float $bytes): string
    {
        if ($bytes <= 0) {
            return '0 B';
        }

        $units = [
            'B',
            'KB',
            'MB',
            'GB',
            'TB',
        ];

        $power = floor(
            log($bytes, 1024)
        );

        $power = min(
            $power,
            count($units) - 1
        );

        return round(
            $bytes / pow(1024, $power),
            1
        ) . ' ' . $units[$power];
    }
}