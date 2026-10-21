<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection('landlord')->getDriverName() === 'mysql') {
            DB::connection('landlord')->statement("
                ALTER TABLE users
                MODIFY COLUMN user_type
                ENUM('Super Admin', 'Admin', 'Sub Admin')
                NOT NULL DEFAULT 'Admin'
            ");
        }
    }

    public function down(): void
    {
        // Convert Sub Admin accounts before removing the enum value.
        DB::connection('landlord')->table('users')
            ->where('user_type', 'Sub Admin')
            ->update(['user_type' => 'Admin']);

        DB::connection('landlord')->statement("
            ALTER TABLE users
            MODIFY COLUMN user_type
            ENUM('Super Admin', 'Admin')
            NOT NULL DEFAULT 'Admin'
        ");
    }
};