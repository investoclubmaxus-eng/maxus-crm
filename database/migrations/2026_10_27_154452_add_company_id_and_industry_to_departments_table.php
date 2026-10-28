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
        Schema::table('departments', function (Blueprint $table) {
            $table->unsignedBigInteger('company_id')
                ->nullable()
                ->after('id');

            $table->string('industry', 100)
                ->nullable()
                ->after('company_id');

            $table->index(
                ['company_id', 'industry', 'status'],
                'departments_company_industry_status_index'
            );
        });
       
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
             $table->dropIndex(
                'departments_company_industry_status_index'
            );

            $table->dropColumn(['company_id', 'industry']);
        });
    }
};
