<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaintenanceSetting extends Model
{
    protected $table = 'maintenance_settings';

    protected $fillable = [
        'maintenance_mode',
        'maintenance_message',
        'allow_super_admin_access',
        'log_retention_days',
    ];

    protected $casts = [
        'maintenance_mode' => 'boolean',
        'allow_super_admin_access' => 'boolean',
        'log_retention_days' => 'integer',
    ];
}
