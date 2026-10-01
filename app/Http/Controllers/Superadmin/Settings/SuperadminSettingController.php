<?php

namespace App\Http\Controllers\Superadmin\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Superadmin\Settings\GeneralSettingRequest;
use App\Services\Superadmin\Settings\GeneralSettingService;
use Illuminate\Http\JsonResponse;
use Throwable;
use App\Http\Requests\Superadmin\Settings\DateTimeSettingRequest;
use App\Services\Superadmin\Settings\DateTimeSettingService;
use App\Http\Requests\Superadmin\Settings\MaintenanceSettingRequest;
use App\Services\Superadmin\Settings\MaintenanceSettingService;
use App\Http\Requests\Superadmin\Settings\SecuritySettingRequest;
use App\Services\Superadmin\Settings\SecuritySettingService;

class SuperadminSettingController extends Controller
{
    public function __construct(
        private GeneralSettingService $generalSettingService,
        private DateTimeSettingService $dateTimeSettingService,
        private MaintenanceSettingService $maintenanceSettingService,
        private SecuritySettingService $securitySettingService
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | GENERAL SETTINGS
    |--------------------------------------------------------------------------
    */

    /**
     * Get General Settings.
     */
    public function generalShow(): JsonResponse
    {
       
        try {

            $settings =
                $this->generalSettingService
                    ->getSettings();

            return response()->json([
                'success' => true,

                'message' =>
                    'General settings retrieved successfully.',

                'data' =>
                    $this->formatGeneralSettings(
                        $settings
                    ),
            ], 200);

        } catch (Throwable $e) {

            return response()->json([
                'success' => false,

                'message' =>
                    'Unable to retrieve general settings.',
            ], 500);
        }
    }

    /**
     * Update General Settings.
     */
    public function generalUpdate(
        GeneralSettingRequest $request
    ): JsonResponse {
    
        try {

            $settings =
                $this->generalSettingService->update(
                    $request->validated(),

                    $request->file('logo'),

                    $request->file('login_logo'),

                    $request->file('favicon')
                );

            return response()->json([
                'success' => true,

                'message' =>
                    'General settings updated successfully.',

                'data' =>
                    $this->formatGeneralSettings(
                        $settings
                    ),
            ], 200);

        } catch (Throwable $e) {

            return response()->json([
                'success' => false,

                'message' =>
                    'Unable to save general settings.',
            ], 500);
        }
        
    }

    /**
     * Delete Application Logo.
     */
    public function generalDeleteLogo(): JsonResponse
    {
       
        try {

            $settings =
                $this->generalSettingService
                    ->deleteLogo();

            return response()->json([
                'success' => true,

                'message' =>
                    'Application logo removed successfully.',

                'data' =>
                    $this->formatGeneralSettings(
                        $settings
                    ),
            ], 200);

        } catch (Throwable $e) {

            return response()->json([
                'success' => false,

                'message' =>
                    'Unable to remove application logo.',
            ], 500);
        }
    }

    /**
     * Delete Login Logo.
     */
    public function generalDeleteLoginLogo(): JsonResponse
    {
        try {

            $settings =
                $this->generalSettingService
                    ->deleteLoginLogo();

            return response()->json([
                'success' => true,

                'message' =>
                    'Login logo removed successfully.',

                'data' =>
                    $this->formatGeneralSettings(
                        $settings
                    ),
            ], 200);

        } catch (Throwable $e) {

            return response()->json([
                'success' => false,

                'message' =>
                    'Unable to remove login logo.',
            ], 500);
        }
    }

    /**
     * Delete Favicon.
     */
    public function generalDeleteFavicon(): JsonResponse
    {
        try {

            $settings =
                $this->generalSettingService
                    ->deleteFavicon();

            return response()->json([
                'success' => true,

                'message' =>
                    'Favicon removed successfully.',

                'data' =>
                    $this->formatGeneralSettings(
                        $settings
                    ),
            ], 200);

        } catch (Throwable $e) {

            return response()->json([
                'success' => false,

                'message' =>
                    'Unable to remove favicon.',
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE FORMAT
    |--------------------------------------------------------------------------
    */

    private function formatGeneralSettings(
        $settings
    ): array {

        return [

            'id' =>
                $settings->id,

            'application_name' =>
                $settings->application_name,

            'application_url' =>
                $settings->application_url,

            'logo_path' =>
                $settings->logo_path,

            'login_logo_path' =>
                $settings->login_logo_path,

            'favicon_path' =>
                $settings->favicon_path,

            'logo_url' => $settings->logo_path
                ? asset($settings->logo_path)
                : null,

            'login_logo_url' =>
                $settings->login_logo_path
                    ? asset($settings->login_logo_path)
                    : null,

            'favicon_url' =>
                $settings->favicon_path
                    ? asset($settings->favicon_path)
                    : null,

            'created_at' =>
                $settings->created_at,

            'updated_at' =>
                $settings->updated_at,

            /*
            |--------------------------------------------------------------------------
            | Runtime Information
            |--------------------------------------------------------------------------
            */

            'environment' =>
                app()->environment(),

            'application_status' =>
                app()->isDownForMaintenance()
                    ? 'maintenance'
                    : 'active',    
        ];
    }

    /**
     * Get Date & Time settings.
     */
    public function dateTimeShow(): JsonResponse
    {
        try {
            $settings = $this->dateTimeSettingService
                ->getDateTimeSettings();

            $currentSystemTime = $this->dateTimeSettingService
                ->getCurrentSystemTime();

            return response()->json([
                'success' => true,
                'message' => 'Date & Time settings retrieved successfully.',

                'data' => [
                    'id' => $settings->id,

                    'timezone' => $settings->timezone,

                    'date_format' => $settings->date_format,

                    'time_format' => $settings->time_format,

                    'week_starts_on' => $settings->week_starts_on,

                    'current_system_time' => $currentSystemTime,
                ],
            ], 200);

        } catch (\Throwable $e) {

            return response()->json([
                'success' => false,
                'message' => 'Unable to retrieve Date & Time settings.',
            ], 500);
        }
    }


    public function dateTimeUpdate(
        DateTimeSettingRequest $request
    ): JsonResponse {
        try {

            $settings = $this->dateTimeSettingService
                ->update($request->validated());

            $currentSystemTime = $this->dateTimeSettingService
                ->getCurrentSystemTime();

            return response()->json([
                'success' => true,
                'message' => 'Date & Time settings updated successfully.',

                'data' => [
                    'id' => $settings->id,

                    'timezone' => $settings->timezone,

                    'date_format' => $settings->date_format,

                    'time_format' => $settings->time_format,

                    'week_starts_on' => $settings->week_starts_on,

                    'current_system_time' => $currentSystemTime,
                ],
            ], 200);

        } catch (\Throwable $e) {

            return response()->json([
                'success' => false,
                'message' => 'Unable to save Date & Time settings.',
            ], 500);
        }
    }

    //maintenance settings code 
    //Get Maintenance Settings
    public function maintenanceShow(): JsonResponse
    {
        try {
            $settings =
                $this->maintenanceSettingService
                    ->getMaintenanceSettings();

            return response()->json([
                'success' => true,  
                'message' =>
                    'Maintenance settings retrieved successfully.',
                'data' => [
                    'id' =>
                        $settings->id,

                    'maintenance_mode' =>
                        $settings->maintenance_mode,

                    'maintenance_message' =>
                        $settings->maintenance_message,

                    'allow_super_admin_access' =>
                        $settings->allow_super_admin_access,

                    'log_retention_days' =>
                        $settings->log_retention_days,

                    'created_at' =>
                        $settings->created_at,

                    'updated_at' =>
                        $settings->updated_at,
                ],
            ], 200);

        } catch (Throwable $e) {

            return response()->json([
                'success' => false,
                'message' =>
                    'Unable to retrieve maintenance settings.',
            ], 500);
        }
    }
        // update maintenance 
        public function maintenanceUpdate(
            MaintenanceSettingRequest $request
        ): JsonResponse {
            try {
                $settings =
                    $this->maintenanceSettingService
                        ->update(
                            $request->validated()
                        );

                return response()->json([
                    'success' => true,
                    'message' =>
                        'Maintenance settings saved successfully.',
                    'data' => [
                        'id' =>
                            $settings->id,

                        'maintenance_mode' =>
                            $settings->maintenance_mode,

                        'maintenance_message' =>
                            $settings->maintenance_message,

                        'allow_super_admin_access' =>
                            $settings->allow_super_admin_access,

                        'log_retention_days' =>
                            $settings->log_retention_days,

                        'created_at' =>
                            $settings->created_at,

                        'updated_at' =>
                            $settings->updated_at,
                    ],
                ], 200);

            } catch (Throwable $e) {

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Unable to save maintenance settings.',
                ], 500);
            }
        }

        // enable maintenance mode
        public function maintenanceEnable(): JsonResponse
        {
            try {
                $settings =
                    $this->maintenanceSettingService
                        ->enableMaintenance();

                return response()->json([
                    'success' => true,
                    'message' =>
                        'Maintenance mode enabled successfully.',
                    'data' => [
                        'maintenance_mode' =>
                            $settings->maintenance_mode,
                    ],
                ], 200);

            } catch (Throwable $e) {

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Unable to enable maintenance mode.',
                ], 500);
            }
        }

        //. Disable Maintenance Mode
        public function maintenanceDisable(): JsonResponse
        {
            try {
                $settings =
                    $this->maintenanceSettingService
                        ->disableMaintenance();

                return response()->json([
                    'success' => true,
                    'message' =>
                        'Maintenance mode disabled successfully.',
                    'data' => [
                        'maintenance_mode' =>
                            $settings->maintenance_mode,
                    ],
                ], 200);

            } catch (Throwable $e) {

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Unable to disable maintenance mode.',
                ], 500);
            }
        }

        //Clear Application Cache
        public function maintenanceClearApplicationCache(): JsonResponse
        {
            try {
                $result =
                    $this->maintenanceSettingService
                        ->clearApplicationCache();

                return response()->json([
                    'success' =>
                        $result['success'],

                    'message' =>
                        $result['message'],
                ], 200);

            } catch (Throwable $e) {

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Unable to clear application cache.',
                ], 500);
            }
        }

        //Clear Configuration Cache
        public function maintenanceClearConfigurationCache(): JsonResponse
        {
            try {
                $result =
                    $this->maintenanceSettingService
                        ->clearConfigurationCache();

                return response()->json([
                    'success' =>
                        $result['success'],

                    'message' =>
                        $result['message'],
                ], 200);

            } catch (Throwable $e) {

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Unable to clear configuration cache.',
                ], 500);
            }
        }

        //Clear Route / View Cache
        public function maintenanceClearRouteViewCache(): JsonResponse
        {
            try {
                $result =
                    $this->maintenanceSettingService
                        ->clearRouteViewCache();

                return response()->json([
                    'success' =>
                        $result['success'],

                    'message' =>
                        $result['message'],
                ], 200);

            } catch (Throwable $e) {

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Unable to clear route/view cache.',
                ], 500);
            }
        }

        //Clear All Cache
        public function maintenanceClearAllCache(): JsonResponse
        {
            try {
                $result =
                    $this->maintenanceSettingService
                        ->clearAllCache();

                return response()->json([
                    'success' =>
                        $result['success'],

                    'message' =>
                        $result['message'],
                ], 200);

            } catch (Throwable $e) {

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Unable to clear application caches.',
                ], 500);
            }
        }

        //Cleanup Old Logs
        public function maintenanceCleanupOldLogs(): JsonResponse
        {
            try {
                $result =
                    $this->maintenanceSettingService
                        ->cleanupOldLogs();

                return response()->json([
                    'success' =>
                        $result['success'],

                    'message' =>
                        $result['message'],

                    'deleted_count' =>
                        $result['deleted_count'],
                ], 200);

            } catch (Throwable $e) {

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Unable to clean up old application logs.',
                ], 500);
            }
        }

        //Clear Failed Jobs
        public function maintenanceClearFailedJobs(): JsonResponse
        {
            try {
                $result =
                    $this->maintenanceSettingService
                        ->clearFailedJobs();

                return response()->json([
                    'success' =>
                        $result['success'],

                    'message' =>
                        $result['message'],

                    'deleted_count' =>
                        $result['deleted_count'],
                ], $result['success'] ? 200 : 500);

            } catch (Throwable $e) {

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Unable to clear failed jobs.',
                ], 500);
            }
        }

        //System Health
        public function maintenanceHealth(): JsonResponse
        {
            try {
                $health =
                    $this->maintenanceSettingService
                        ->getSystemHealth();

                return response()->json([
                    'success' => true,
                    'message' =>
                        'System health retrieved successfully.',
                    'data' => $health,
                ], 200);

            } catch (Throwable $e) {

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Unable to retrieve system health.',
                ], 500);
            }
        }

        //security setting mode
        public function securityShow(): JsonResponse
        {
            try {
                return response()->json([
                    'success' => true,
                    'message' =>
                        'Security settings retrieved successfully.',
                    'data' =>
                        $this->securitySettingService
                            ->getFormattedSettings(),
                ], 200);

            } catch (Throwable $e) {

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Unable to retrieve security settings.',
                ], 500);
            }
        }

        //update the security method
        public function securityUpdate(
            SecuritySettingRequest $request
        ): JsonResponse {
            try {

                $settings =
                    $this->securitySettingService->update(
                        $request->validated()
                    );

                return response()->json([
                    'success' => true,
                    'message' =>
                        'Security settings saved successfully.',
                    'data' =>
                        $this->securitySettingService
                            ->getFormattedSettings(),
                ], 200);

            } catch (Throwable $e) {

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Unable to save security settings.',
                ], 500);
            }
        }
    }