<?php

namespace App\Services\Superadmin\Settings;

use App\Models\GeneralSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class GeneralSettingService
{
    /**
     * Get current general settings.
     */
    public function getSettings(): GeneralSetting
    {
        $settings = GeneralSetting::first();

        if (!$settings) {
            $settings = GeneralSetting::create([
                'application_name' => 'Maxus CRM',
                'application_url' => null,
            ]);
        }

        return $settings;
    }

    /**
     * Update general settings.
     */
    public function update(
        array $data,
        ?UploadedFile $logo = null,
        ?UploadedFile $loginLogo = null,
        ?UploadedFile $favicon = null
    ): GeneralSetting {

        $settings = $this->getSettings();

        /*
        |--------------------------------------------------------------------------
        | Basic Application Information
        |--------------------------------------------------------------------------
        */

        $settings->application_name =
            $data['application_name'];

        $settings->application_url =
           $data['application_url'] ?? config('app.url');

        /*

        |--------------------------------------------------------------------------
        | Remove Existing Logo
        |--------------------------------------------------------------------------
        */

        if (!empty($data['remove_logo'])) {

            $this->deleteFile(
                $settings->logo_path
            );

            $settings->logo_path = null;
        }

        /*
        |--------------------------------------------------------------------------
        | Remove Login Logo
        |--------------------------------------------------------------------------
        */

        if (!empty($data['remove_login_logo'])) {

            $this->deleteFile(
                $settings->login_logo_path
            );

            $settings->login_logo_path = null;
        }

        /*
        |--------------------------------------------------------------------------
        | Remove Favicon
        |--------------------------------------------------------------------------
        */

        if (!empty($data['remove_favicon'])) {

            $this->deleteFile(
                $settings->favicon_path
            );

            $settings->favicon_path = null;
        }

        /*
        |--------------------------------------------------------------------------
        | Upload Application Logo
        |--------------------------------------------------------------------------
        */

        if ($logo) {

            $this->deleteFile(
                $settings->logo_path
            );

            $settings->logo_path =
                $this->uploadFile($logo);
        }

        /*
        |--------------------------------------------------------------------------
        | Upload Login Logo
        |--------------------------------------------------------------------------
        */

        if ($loginLogo) {

            $this->deleteFile(
                $settings->login_logo_path
            );

            $settings->login_logo_path =
                $this->uploadFile($loginLogo);
        }

        /*
        |--------------------------------------------------------------------------
        | Upload Favicon
        |--------------------------------------------------------------------------
        */

        if ($favicon) {

            $this->deleteFile(
                $settings->favicon_path
            );

            $settings->favicon_path =
                $this->uploadFile($favicon);
        }

        $settings->save();

        return $settings->fresh();
    }

    /**
     * Delete application logo.
     */
    public function deleteLogo(): GeneralSetting
    {
        $settings = $this->getSettings();

        $this->deleteFile(
            $settings->logo_path
        );

        $settings->logo_path = null;

        $settings->save();

        return $settings->fresh();
    }

    /**
     * Delete login logo.
     */
    public function deleteLoginLogo(): GeneralSetting
    {
        $settings = $this->getSettings();

        $this->deleteFile(
            $settings->login_logo_path
        );

        $settings->login_logo_path = null;

        $settings->save();

        return $settings->fresh();
    }

    /**
     * Delete favicon.
     */
    public function deleteFavicon(): GeneralSetting
    {
        $settings = $this->getSettings();

        $this->deleteFile(
            $settings->favicon_path
        );

        $settings->favicon_path = null;

        $settings->save();

        return $settings->fresh();
    }

    /**
     * Upload file.
     */
    private function uploadFile(
        UploadedFile $file
    ): string {

    

        $directory = public_path('settings/general');

        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $filename = $file->hashName();

        $file->move($directory, $filename);

        return 'settings/general/' . $filename;
    }

    /**
     * Delete file from storage.
     */
    private function deleteFile(?string $path): void
    {
        if (!$path) {
            return;
        }

        $fullPath = public_path($path);

        if (file_exists($fullPath)) {
            unlink($fullPath);
        }
    }
}