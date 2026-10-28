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
            if (!Schema::connection('tenant')->hasColumn('branches', 'country')) {
                $table->string('country')->default('India')->after('state');
            }
            if (!Schema::connection('tenant')->hasColumn('branches', 'postal_code')) {
                $table->string('postal_code', 20)->nullable()->after('country');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('tenant')->table('branches', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::connection('tenant')->hasColumn('branches', 'country')) {
                $columnsToDrop[] = 'country';
            }
            if (Schema::connection('tenant')->hasColumn('branches', 'postal_code')) {
                $columnsToDrop[] = 'postal_code';
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
