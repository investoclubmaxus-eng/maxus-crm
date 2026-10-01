<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {

            $table->enum('user_type', [
                'super_admin',
                'admin',
            ])
            ->default('admin')
            ->after('email');

            $table->enum('status', [
                'active',
                'inactive',
            ])
            ->default('active')
            ->after('user_type');

            $table->string('phone', 30)
                ->nullable()
                ->after('status');

            $table->string('location')
                ->nullable()
                ->after('phone');

            $table->string('avatar')
                ->nullable()
                ->after('location');

            $table->timestamp('last_login_at')
                ->nullable()
                ->after('avatar');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {

            $table->dropColumn([
                'user_type',
                'status',
                'phone',
                'location',
                'avatar',
                'last_login_at',
            ]);

        });
    }
};