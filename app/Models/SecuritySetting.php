<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SecuritySetting extends Model
{
    protected $table = 'security_settings';

    protected $fillable = [
        'login_attempt_protection',
        'max_failed_attempts',
        'lockout_duration',
        'session_timeout',
        'remember_me',
        'logout_sessions_after_password_change',
        'require_two_factor',
        'allow_user_two_factor',
    ];

    protected $casts = [
        'login_attempt_protection' => 'boolean',
        'max_failed_attempts' => 'integer',
        'lockout_duration' => 'integer',
        'session_timeout' => 'integer',
        'remember_me' => 'boolean',
        'logout_sessions_after_password_change' => 'boolean',
        'require_two_factor' => 'boolean',
        'allow_user_two_factor' => 'boolean',
    ];
}
