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
        Schema::create('email_smtp_settings', function (Blueprint $table) {
            $table->id();
            $table->string('mail_driver')->default('smtp');
            $table->string('smtp_host');
            $table->unsignedInteger('smtp_port')->default(587);
            $table->string('username');
            $table->text('password');
            $table->string('encryption')->nullable()->default('tls');
            $table->string('from_address');
            $table->string('from_name');
            $table->string('reply_to')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_smtp_settings');
    }
};
