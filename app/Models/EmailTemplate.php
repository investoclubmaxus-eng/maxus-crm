<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
     protected $table = 'email_templates';

    protected $fillable = [
        'slug',
        'name',
        'description',
        'trigger',
        'template_type',
        'is_default',
        'is_active',
        'subject',
        'from_name',
        'body',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];
}
