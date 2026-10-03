<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailSmtpSetting extends Model
{
    protected $table = 'email_smtp_settings';

    protected $fillable = [
        'mail_driver',
        'smtp_host',
        'smtp_port',
        'username',
        'password',
        'encryption',
        'from_address',
        'from_name',
        'reply_to',
    ];

    protected $casts = [
        'smtp_port' => 'integer',
        'password' => 'encrypted',
    ];
}