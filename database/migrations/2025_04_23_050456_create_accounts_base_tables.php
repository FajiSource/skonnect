<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * @return void
     */
    public function up()
    {
        // Create the youth accounts table
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->enum('gender', ['male', 'female', 'rather not say']); 
            $table->date('dob');
            $table->integer('age');
            $table->string('email')->unique();
            $table->string('address');
            $table->string('phone_number');
            $table->enum('baranggay', ['Dela Paz', 'Manggahan', 'Maybunga', 'Pinagbuhatan', 'Rosario', 'San Miguel', 'Santa Lucia', 'Santolan']);
            
            // Verification status column
            $table->enum('verification_status', ['not_verified', 'verified'])
                ->default('not_verified')
                ->comment('Account verification status');
            
            $table->timestamp('email_verified_at')->nullable();
            $table->enum('profile_status', ['not_profiled', 'profiled'])
                ->default('not_profiled')
                ->comment('Status of account profiling');
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        // Create the SK accounts table
        Schema::create('skaccounts', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->enum('gender', ['male', 'female']);
            $table->date('birthdate');
            $table->integer('age');
            $table->string('email')->unique();
            $table->string('phone_number')->nullable();
            $table->string('address');

            // SK-specific fields
            $table->enum('sk_station', [
                'Dela Paz', 
                'Manggahan', 
                'Maybunga', 
                'Pinagbuhatan', 
                'Rosario', 
                'San Miguel',
                'Santa Lucia', 
                'Santolan'
            ])->comment('Barangay where the SK officer is stationed');
            
            $table->enum('sk_role', [
                'Federasyon', 
                'Chairman', 
                'Kagawad'
            ])->comment('Role in the Sangguniang Kabataan');
            
            $table->enum('verification_status', ['not_verified', 'verified'])
                ->default('not_verified')
                ->comment('Account verification status');
            $table->timestamp('email_verified_at')->nullable();
            $table->enum('authentication_status', ['active', 'not_active'])                 
                ->default('not_active')
                ->comment('Account authentication status');
            $table->timestamp('authenticated_at')->nullable();
            $table->string('valid_id')->nullable(); // For image upload
            $table->string('password');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     * 
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('accounts');
        Schema::dropIfExists('skaccounts');
    }
};