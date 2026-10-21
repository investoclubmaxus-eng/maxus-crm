<?php

use App\Http\Controllers\Superadmin\Admin\AdminController;
use App\Http\Controllers\Superadmin\Auth\AuthController;
use App\Http\Controllers\Superadmin\Auth\PasswordController;
use App\Http\Controllers\Superadmin\Company\CompanyController;
use App\Http\Controllers\Superadmin\Settings\SuperadminSettingController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CompanyRealEstate\BranchController;
use App\Http\Controllers\CompanyRealEstate\SubAdminController;

Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
Route::get('/login-settings', [AuthController::class, 'loginSettings'])->name('auth.login-settings');
Route::post('/login/2fa', [AuthController::class, 'verifyLoginTwoFactor'])->name('auth.login.2fa');
Route::post('/select-company', [AuthController::class, 'selectCompany'])->name('auth.select-company');
Route::middleware('throttle:forgot-password')->post('/forgot-password', [PasswordController::class, 'forgot'])->name('auth.forgot-password');
Route::post('/admin-invitations/validate', [PasswordController::class, 'validateInvitation'])->middleware('throttle:10,1');
Route::post('/reset-password', [PasswordController::class, 'reset'])->name('auth.reset-password');

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class,  'logout'])->name('auth.logout');
    Route::get('/user', [AuthController::class, 'user'])->name('auth.user');
    Route::get('/profile/activity-logs', [AuthController::class, 'activities'])->name('auth.activities');
    Route::match(['put', 'post'], '/superadmin/profile', [AuthController::class, 'update'])->name('auth.profile.update');
    Route::put('/superadmin/password', [AuthController::class, 'updatePassword'])->name('auth.password.update');

    // =====================================================
    // Company Management
    // =====================================================

    Route::get('/superadmin/companies-details', [CompanyController::class, 'index'])->name('superadmin.companies.details');
    Route::post('/superadmin/companies-create', [CompanyController::class, 'store'])->name('superadmin.companies.create');
    Route::get('/superadmin/companies/{company}', [CompanyController::class, 'show'])->name('superadmin.companies.show');
    Route::put('/superadmin/companies-update/{company}', [CompanyController::class, 'update'])->name('superadmin.companies.update');
    Route::patch('/superadmin/companies-status/{company}', [CompanyController::class, 'updateStatus'])->name('superadmin.companies.status');
    Route::delete('/superadmin/companies-delete/{company}', [CompanyController::class, 'destroy'])->name('superadmin.companies.delete');
});

// setting module
Route::get('/superadmin/settings/general', [SuperadminSettingController::class, 'generalShow']);
Route::middleware('auth:sanctum', 'security.session')
    ->prefix('superadmin/settings')
    ->group(function () {

        /*
        |--------------------------------------------------------------------------
        | General Settings
        |--------------------------------------------------------------------------
        */

        Route::post('/general', [SuperadminSettingController::class, 'generalUpdate']);

        Route::delete('/general/logo', [SuperadminSettingController::class, 'generalDeleteLogo']);

        Route::delete('/general/login-logo', [SuperadminSettingController::class, 'generalDeleteLoginLogo']);

        Route::delete('/general/favicon', [SuperadminSettingController::class, 'generalDeleteFavicon']);

        // date & time settings
        Route::get('/date-time', [SuperadminSettingController::class, 'dateTimeShow']);
        Route::put('/date-time-update', [SuperadminSettingController::class, 'dateTimeUpdate']);

        // =====================================================
        // Maintenance Settings
        // =====================================================

        // Get maintenance settings
        Route::get('/maintenance', [SuperadminSettingController::class, 'maintenanceShow']);
        // Update maintenance settings
        Route::put('/maintenance-update', [SuperadminSettingController::class, 'maintenanceUpdate']);
        // Enable maintenance mode
        Route::post('/maintenance/enable', [SuperadminSettingController::class, 'maintenanceEnable']);
        // Disable maintenance mode
        Route::post('/maintenance/disable', [SuperadminSettingController::class, 'maintenanceDisable']);

        // =====================================================
        // Cache Management
        // =====================================================

        // Clear application cache
        Route::post('/maintenance/cache/application', [SuperadminSettingController::class, 'maintenanceClearApplicationCache']);

        // Clear configuration cache
        Route::post('/maintenance/cache/configuration', [SuperadminSettingController::class, 'maintenanceClearConfigurationCache']);

        // Clear route and view cache
        Route::post('/maintenance/cache/route-view', [SuperadminSettingController::class, 'maintenanceClearRouteViewCache']);

        // Clear all cache
        Route::post('/maintenance/cache/all', [SuperadminSettingController::class, 'maintenanceClearAllCache']);

        // =====================================================
        // System Cleanup
        // =====================================================

        // Remove old application logs
        Route::post('/maintenance/cleanup/logs', [SuperadminSettingController::class, 'maintenanceCleanupOldLogs']);

        // Clear failed queue jobs
        Route::post('/maintenance/cleanup/failed-jobs', [SuperadminSettingController::class, 'maintenanceClearFailedJobs']);

        // =====================================================
        // System Health
        // =====================================================

        Route::get('/maintenance/health', [SuperadminSettingController::class, 'maintenanceHealth']);

        // =====================================================
        // Security Settings
        // =====================================================

        Route::get('/security', [SuperadminSettingController::class, 'securityShow']);

        Route::put('/security-update', [SuperadminSettingController::class, 'securityUpdate']);

        // 2FA auth
        Route::post('/2fa/setup', [AuthController::class, 'setupTwoFactor'])->name('auth.2fa.setup');
        Route::post('/2fa/confirm', [AuthController::class, 'confirmTwoFactor'])->name('auth.2fa.confirm');

        // file storage settings

        Route::get('/file-storage', [SuperadminSettingController::class, 'fileStorage']);

        Route::put('/file-storage-update', [SuperadminSettingController::class, 'updateFileStorage']);

        Route::post('/file-storage/test', [SuperadminSettingController::class, 'testFileStorage']);

        // email smtp settings

        Route::get('/email-smtp', [SuperadminSettingController::class, 'emailSmtp']);

        Route::put('/email-smtp-update', [SuperadminSettingController::class, 'updateEmailSmtp']);

        Route::post('/email-smtp/test', [SuperadminSettingController::class, 'testEmailSmtp']);

        // Email Draft Format

        Route::get('/email-templates', [SuperadminSettingController::class, 'emailTemplates']);

        Route::get('/email-templates/{id}', [SuperadminSettingController::class, 'showEmailTemplate']);

        Route::post('/email-templates', [SuperadminSettingController::class, 'createEmailTemplate']);

        Route::put('/email-templates/{id}', [SuperadminSettingController::class, 'updateEmailTemplate']);

        Route::patch('/email-templates/{id}/toggle', [SuperadminSettingController::class, 'toggleEmailTemplate']);

        Route::delete('/email-templates/{id}', [SuperadminSettingController::class, 'deleteEmailTemplate']);

        Route::post('/email-templates/{id}/test', [SuperadminSettingController::class, 'testEmailTemplate']);

    });

// Admin Management Routes
Route::middleware(['auth:sanctum', 'super.admin'])->prefix('superadmin')->group(function () {

    // Admin Management
    Route::get('/admins', [AdminController::class, 'index']);

    Route::get('/admins/available-companies', [AdminController::class, 'availableCompanies']);

    Route::post('/admins', [AdminController::class, 'store']);

    Route::post('/admins-store', [AdminController::class, 'store']);

    Route::get('/admins-details/{admin}', [AdminController::class, 'show']);

    Route::put('/admins-update/{admin}', [AdminController::class, 'update']);

    Route::post('/admins/{admin}/invitation', [AdminController::class, 'sendInvitation']);

    Route::patch('/admins-status/{admin}/status', [AdminController::class, 'updateStatus']);

    Route::delete('/admins-destroy/{admin}', [AdminController::class, 'destroy']);

    // Admin Company Access

    Route::get('/admins-find/{admin}/companies', [AdminController::class, 'companies']);

    Route::post('/admins-grant-access/{admin}/companies', [AdminController::class, 'grantCompanyAccess']);

    Route::put('/admins-update-access/{admin}/companies/{company}', [AdminController::class, 'updateCompanyAccess']);

    Route::delete('/admins-revoke-access/{admin}/companies/{company}', [AdminController::class, 'revokeCompanyAccess']);

    Route::patch('/admins-set-default/{admin}/companies/{company}/default', [AdminController::class, 'setDefaultCompany']);

});

// Company Real Estate / Tenant Branches Routes
Route::middleware('auth:sanctum')->prefix('company')->group(function () {
    // Branches APIs
    Route::get('/branches', [BranchController::class, 'index'])->name('company.branches.index');
    Route::post('/branches-store', [BranchController::class, 'store'])->name('company.branches.store');
    Route::get('/branches-show/{id}', [BranchController::class, 'show'])->name('company.branches.show');
    Route::put('/branches-update/{id}', [BranchController::class, 'update'])->name('company.branches.update');
    Route::patch('/branches-status/{id}', [BranchController::class, 'updateStatus'])->name('company.branches.status');
    Route::delete('/branches-destroy/{id}', [BranchController::class, 'destroy'])->name('company.branches.destroy');

    // Sub Admin APIs
    Route::get('/sub-admins', [SubAdminController::class, 'index'])->name('company.sub-admins.index');
    Route::get('/sub-admins-companies/available-companies', [SubAdminController::class, 'availableCompanies'])->name('company.sub-admins.available-companies');
    Route::post('/sub-admins-store', [SubAdminController::class, 'store'])->name('company.sub-admins.store');
    Route::get('/sub-admins-show/{subAdmin}', [SubAdminController::class, 'show'])->name('company.sub-admins.show');
    Route::get('/sub-admins/{subAdmin}', [SubAdminController::class, 'show']);
    Route::put('/sub-admins-update/{subAdmin}', [SubAdminController::class, 'update'])->name('company.sub-admins.update');
    Route::put('/sub-admins/{subAdmin}', [SubAdminController::class, 'update']);
    Route::patch('/sub-admins-status/{subAdmin}', [SubAdminController::class, 'updateStatus'])->name('company.sub-admins.status');
    Route::get('/sub-admins/{subAdmin}/branch-access', [SubAdminController::class, 'branchAccess'])->name('company.sub-admins.branch-access');
    Route::put('/sub-admins-access-update/{subAdmin}/branch-access', [SubAdminController::class, 'updateBranchAccess'])->name('company.sub-admins.branch-access.update');
    Route::delete('/sub-admins-destroy/{subAdmin}', [SubAdminController::class, 'destroy'])->name('company.sub-admins.destroy');
    Route::delete('/sub-admins/{subAdmin}', [SubAdminController::class, 'destroy']);
    Route::post('/sub-admins/{subAdmin}/send-invitation',[SubAdminController::class, 'sendInvitation'])->name('company.sub-admins.send-invitation');
});

