<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Multitenancy\Models\Tenant;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Tenant
{
    use HasFactory, SoftDeletes;

    protected $connection = 'landlord';
    protected $table = 'companies';

    protected $fillable = [
        'name',
        'code',
        'email',
        'phone',
        'website',
        'industry',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'logo_path',
        'status',
        'created_by',
        'database',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function getDatabaseName(): string
    {
        return (string) ($this->database ?: config('database.connections.landlord.database', 'maxus_crm'));
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Super Admin/User who created this company.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Users who have access to this company.
     */
    public function users()
    {
        return $this->belongsToMany(
            User::class,
            'company_user_access',
            'company_id',
            'user_id'
        )
            ->withPivot([
                'role',
                'status',
                'is_default',
                'granted_by',
                'granted_at',
            ])
            ->withTimestamps();
    }

    /**
     * Admins who have access to this company.
     */
    public function admins()
    {
        return $this->users()
            ->where('user_type', 'Admin');
    }
}
