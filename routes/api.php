<?php

use App\Http\Controllers\Superadmin\Auth\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Superadmin\Auth\PasswordController;
use App\Http\Controllers\Superadmin\Settings\SuperadminSettingController;



Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
Route::get('/login-settings', [AuthController::class, 'loginSettings'])->name('auth.login-settings');
Route::post('/login/2fa', [AuthController::class, 'verifyLoginTwoFactor'])->name('auth.login.2fa');
Route::middleware('throttle:forgot-password')->post('/forgot-password', [PasswordController::class, 'forgot'])->name('auth.forgot-password');
Route::post('/reset-password', [PasswordController::class, 'reset'])->name('auth.reset-password');

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class,  'logout'])->name('auth.logout');
    Route::get('/user', [AuthController::class, 'user'])->name('auth.user');
    Route::get('/profile/activity-logs', [AuthController::class, 'activities'])->name('auth.activities');
    Route::put('/superadmin/profile', [AuthController::class, 'update'])->name('auth.profile.update');
    Route::put('/superadmin/password', [AuthController::class, 'updatePassword'])->name('auth.password.update');

});

//setting module
Route::get('/superadmin/settings/general',[SuperadminSettingController::class, 'generalShow']);
Route::middleware('auth:sanctum','security.session',)
    ->prefix('superadmin/settings')
    ->group(function () {

        /*
        |--------------------------------------------------------------------------
        | General Settings
        |--------------------------------------------------------------------------
        */

       

        Route::post(
            '/general',
            [
                SuperadminSettingController::class,
                'generalUpdate'
            ]
        );

        Route::delete(
            '/general/logo',
            [
                SuperadminSettingController::class,
                'generalDeleteLogo'
            ]
        );

        Route::delete(
            '/general/login-logo',
            [
                SuperadminSettingController::class,
                'generalDeleteLoginLogo'
            ]
        );

        Route::delete(
            '/general/favicon',
            [
                SuperadminSettingController::class,
                'generalDeleteFavicon'
            ]
        );


        //date & time settings
        Route::get('/date-time',[SuperadminSettingController::class, 'dateTimeShow']);
        Route::put('/date-time-update',[SuperadminSettingController::class, 'dateTimeUpdate']);


        
        // =====================================================
        // Maintenance Settings
        // =====================================================

         // Get maintenance settings
        Route::get('/maintenance',[SuperadminSettingController::class, 'maintenanceShow']);
         // Update maintenance settings
        Route::put('/maintenance-update',[SuperadminSettingController::class, 'maintenanceUpdate']);
         // Enable maintenance mode
        Route::post('/maintenance/enable',[SuperadminSettingController::class, 'maintenanceEnable']);
        // Disable maintenance mode
        Route::post('/maintenance/disable',[SuperadminSettingController::class, 'maintenanceDisable']);


        // =====================================================
        // Cache Management
        // =====================================================

        // Clear application cache
        Route::post('/maintenance/cache/application',[SuperadminSettingController::class, 'maintenanceClearApplicationCache']);

        // Clear configuration cache
        Route::post('/maintenance/cache/configuration',[SuperadminSettingController::class, 'maintenanceClearConfigurationCache']);

        // Clear route and view cache
        Route::post('/maintenance/cache/route-view',[SuperadminSettingController::class, 'maintenanceClearRouteViewCache']);

        // Clear all cache
        Route::post('/maintenance/cache/all',[SuperadminSettingController::class, 'maintenanceClearAllCache']);


        // =====================================================
        // System Cleanup
        // =====================================================

        // Remove old application logs
        Route::post('/maintenance/cleanup/logs',[SuperadminSettingController::class, 'maintenanceCleanupOldLogs']);

        // Clear failed queue jobs
        Route::post('/maintenance/cleanup/failed-jobs',[SuperadminSettingController::class, 'maintenanceClearFailedJobs']);


        // =====================================================
        // System Health
        // =====================================================

        Route::get('/maintenance/health',[SuperadminSettingController::class, 'maintenanceHealth']);

        // =====================================================
        // Security Settings
        // =====================================================

        Route::get('/security',[SuperadminSettingController::class,'securityShow']);

        Route::put('/security-update',[SuperadminSettingController::class,'securityUpdate']);

        //2FA auth
        Route::post('/2fa/setup', [AuthController::class, 'setupTwoFactor'])->name('auth.2fa.setup');
        Route::post('/2fa/confirm',[AuthController::class, 'confirmTwoFactor'])->name('auth.2fa.confirm');

        //file storage settings

        Route::get('/file-storage',[SuperadminSettingController::class, 'fileStorage']);

        Route::put('/file-storage-update',[SuperadminSettingController::class, 'updateFileStorage']);

        Route::post('/file-storage/test',[SuperadminSettingController::class, 'testFileStorage']);

        //email smtp settings

        Route::get('/email-smtp',[SuperadminSettingController::class, 'emailSmtp']);

        Route::put('/email-smtp-update',[SuperadminSettingController::class, 'updateEmailSmtp']);

        Route::post('/email-smtp/test',[SuperadminSettingController::class, 'testEmailSmtp']);

        //Email Draft Format

        Route::get('/email-templates',[SuperadminSettingController::class, 'emailTemplates']);

        Route::get('/email-templates/{id}',[SuperadminSettingController::class, 'showEmailTemplate']);

        Route::post('/email-templates',[SuperadminSettingController::class, 'createEmailTemplate']);

        Route::put('/email-templates/{id}',[SuperadminSettingController::class, 'updateEmailTemplate']);

        Route::patch('/email-templates/{id}/toggle',[SuperadminSettingController::class, 'toggleEmailTemplate']);

        Route::delete('/email-templates/{id}',[SuperadminSettingController::class, 'deleteEmailTemplate']);

        Route::post('/email-templates/{id}/test',[SuperadminSettingController::class, 'testEmailTemplate']);


                

    });
