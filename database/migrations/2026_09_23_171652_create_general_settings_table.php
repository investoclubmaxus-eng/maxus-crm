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
       Schema::create('general_settings', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Application Information
            |--------------------------------------------------------------------------
            */

            $table->string('application_name')
                ->default('Maxus CRM');

            $table->string('application_url')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Application Branding
            |--------------------------------------------------------------------------
            */

            $table->string('logo_path')
                ->nullable();

            $table->string('login_logo_path')
                ->nullable();

            $table->string('favicon_path')
                ->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('general_settings');
    }
};
