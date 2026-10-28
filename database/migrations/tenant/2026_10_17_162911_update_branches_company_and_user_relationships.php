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
         Schema::connection('tenant')->table('branches', function (Blueprint $table) {
            $table->unsignedBigInteger('company_id')->after('id');
            $table->renameColumn('manager_id', 'user_id');
        });

        Schema::connection('tenant')->table('branches', function (Blueprint $table) {
            $table->unique(['company_id', 'code']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('tenant')->table('branches', function (Blueprint $table) {
            $table->dropUnique(['company_id', 'code']);
            $table->dropIndex(['user_id']);
            $table->renameColumn('user_id', 'manager_id');
            $table->dropColumn('company_id');
        });
    }
};
