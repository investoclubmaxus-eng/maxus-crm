<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DateTimeSetting extends Model
{
   protected $table = 'date_time_settings';

    protected $fillable = [
        'timezone',
        'date_format',
        'time_format',
        'week_starts_on',
    ];
}
