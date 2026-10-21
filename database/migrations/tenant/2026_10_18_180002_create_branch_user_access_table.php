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
        Schema::connection('tenant')->create(
            'branch_user_access',
            function (Blueprint $table) {
                $table->id();

                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('branch_id');

                $table->string('role', 50)->default('sub_admin');

                $table->enum('status', [
                    'pending',
                    'active',
                    'inactive',
                    'revoked',
                ])->default('pending');

                $table->boolean('is_default')->default(false);

                $table->unsignedBigInteger('granted_by')->nullable();
                $table->timestamp('granted_at')->nullable();

                $table->timestamps();

                $table->unique(
                    ['company_id', 'user_id', 'branch_id'],
                    'branch_user_access_unique'
                );

                $table->index(['user_id', 'status']);
                $table->index(['branch_id', 'status']);
            }
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
         Schema::connection('tenant')->dropIfExists('branch_user_access');
    }
};
