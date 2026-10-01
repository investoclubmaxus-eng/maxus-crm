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
     Schema::table('date_time_settings', function (Blueprint $table) {
            $table->enum('time_format', [
                '12',
                '24',
            ])
            ->default('12')
            ->change();

            $table->enum('week_starts_on', [
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
                'sunday',
            ])
            ->default('tuesday')
            ->change();
        });
    }

    public function down(): void
    {
        Schema::table('date_time_settings', function (Blueprint $table) {
            $table->string('time_format')
                ->default('12')
                ->change();

            $table->enum('week_starts_on', [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday',
            ])
            ->default('Tuesday')
            ->change();
        });
    }
};
