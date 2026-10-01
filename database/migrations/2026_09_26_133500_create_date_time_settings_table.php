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
       Schema::create('date_time_settings', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Application Timezone
            |--------------------------------------------------------------------------
            | Example: Asia/Kolkata
            */
            $table->string('timezone')
                ->default('Asia/Kolkata');

            /*
            |--------------------------------------------------------------------------
            | Date Format
            |--------------------------------------------------------------------------
            | Example: d M Y
            */
            $table->string('date_format')
                ->default('d M Y');

            /*
            |--------------------------------------------------------------------------
            | Time Format
            |--------------------------------------------------------------------------
            | 12 = 12-hour format
            | 24 = 24-hour format
            */
            $table->string('time_format')
                ->default('12');

            /*
            |--------------------------------------------------------------------------
            | Week Starts On
            |--------------------------------------------------------------------------
            | Example: monday
            */
            $table->enum('week_starts_on', [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday',
            ])->default('Tuesday');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('date_time_settings');
    }
};
