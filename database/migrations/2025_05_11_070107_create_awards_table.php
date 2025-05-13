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
        Schema::create('awards', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('category');
            $table->string('recipients');
            $table->date('date_awarded');
            $table->string('main_image');
            $table->json('gallery')->nullable(); // Store JSON for multiple images with captions
            $table->integer('year');
            $table->enum('status', ['published', 'archived'])->default('published');
            $table->enum('sk_station', [
                'Federation', 
                'Dela Paz', 
                'Manggahan', 
                'Maybunga', 
                'Pinagbuhatan', 
                'Rosario', 
                'San Miguel',
                'Santa Lucia', 
                'Santolan'
            ]);
            $table->unsignedBigInteger('created_by');
            $table->foreign('created_by')->references('id')->on('skaccounts');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('awards');
    }
};