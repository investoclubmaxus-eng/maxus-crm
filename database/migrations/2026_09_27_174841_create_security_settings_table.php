<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
         Schema::create('security_settings', function (Blueprint $table) {
            $table->id();

            // Login Security
            $table->boolean('login_attempt_protection')
                ->default(true);

            $table->unsignedInteger('max_failed_attempts')
                ->default(5);

            $table->unsignedInteger('lockout_duration')
                ->default(15);

            // Session Security
            $table->unsignedInteger('session_timeout')
                ->default(30);

            $table->boolean('remember_me')
                ->default(true);

            $table->boolean('logout_sessions_after_password_change')
                ->default(true);

            // Two-Factor Authentication
            $table->boolean('require_two_factor')
                ->default(false);

            $table->boolean('allow_user_two_factor')
                ->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('security_settings');
    }
};
