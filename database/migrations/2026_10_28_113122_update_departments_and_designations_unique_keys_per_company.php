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
            $table->dropUnique('departments_department_code_unique');
            $table->dropUnique('departments_name_unique');
            $table->dropUnique('departments_slug_unique');

            $table->unique(['company_id', 'department_code'], 'departments_company_dept_code_unique');
            $table->unique(['company_id', 'slug'], 'departments_company_slug_unique');
            $table->unique(['company_id', 'name'], 'departments_company_name_unique');
        });

        Schema::table('designations', function (Blueprint $table) {
            $table->dropUnique('designations_designation_code_unique');
            $table->dropUnique('designations_slug_unique');

            $table->unique(['company_id', 'designation_code'], 'designations_company_desig_code_unique');
            $table->unique(['company_id', 'slug'], 'designations_company_slug_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropUnique('departments_company_dept_code_unique');
            $table->dropUnique('departments_company_slug_unique');
            $table->dropUnique('departments_company_name_unique');

            $table->unique('department_code', 'departments_department_code_unique');
            $table->unique('name', 'departments_name_unique');
            $table->unique('slug', 'departments_slug_unique');
        });

        Schema::table('designations', function (Blueprint $table) {
            $table->dropUnique('designations_company_desig_code_unique');
            $table->dropUnique('designations_company_slug_unique');

            $table->unique('designation_code', 'designations_designation_code_unique');
            $table->unique('slug', 'designations_slug_unique');
        });
    }
};
