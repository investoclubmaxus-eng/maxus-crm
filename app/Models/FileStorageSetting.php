<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FileStorageSetting extends Model
{
    protected $table = 'file_storage_settings';

    protected $fillable = [
        'driver',
        'max_upload_size',
        'max_files',
        'allowed_file_types',
        'retention_days',
        'automatic_cleanup',
    ];

    protected $casts = [
        'max_upload_size' => 'integer',
        'max_files' => 'integer',
        'retention_days' => 'integer',
        'automatic_cleanup' => 'boolean',
    ];
}
