<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();

            /*
             * Internal identifier.
             * Example:
             * new-admin-invitation
             * password-reset
             */
            $table->string('slug')->unique();

            /*
             * Display name.
             */
            $table->string('name');

            /*
             * Description shown in Email Draft Format UI.
             */
            $table->text('description')->nullable();

            /*
             * Event which triggers this template.
             */
            $table->string('trigger')->nullable();

            /*
             * system = protected template
             * custom = user-created template
             */
            $table->string('template_type')->default('system');

            /*
             * System/default template cannot be deleted.
             */
            $table->boolean('is_default')->default(false);

            /*
             * Whether the template can currently be used.
             */
            $table->boolean('is_active')->default(true);

            /*
             * Email subject.
             */
            $table->string('subject');

            /*
             * Sender display name.
             */
            $table->string('from_name')->nullable();

            /*
             * Email content.
             */
            $table->longText('body');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};