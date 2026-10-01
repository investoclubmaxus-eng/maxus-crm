<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeneralSetting extends Model
{
     protected $table = 'general_settings';

    protected $fillable = [
        'application_name',
        'application_url',
        'logo_path',
        'login_logo_path',
        'favicon_path',
    ];
}
