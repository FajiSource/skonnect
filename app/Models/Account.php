<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Account extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'accounts';
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'dob',
        'age',
        'email',
        'address',
        'phone_number',
        'baranggay',
        'profile_status',
        'verification_status', // Added new fillable field
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Check if the account is verified
     *
     * @return bool
     */
    public function isVerified()
    {
        return $this->verification_status === 'verified';
    }

    /**
     * Mark the account as verified
     *
     * @return void
     */
    public function markAsVerified()
    {
        $this->verification_status = 'verified';
        $this->save();
    }

    /**
     * Mark the account as not verified
     *
     * @return void
     */
    public function markAsNotVerified()
    {
        $this->verification_status = 'not_verified';
        $this->save();
    }

    // In Account.php
public function volunteerProfile()
{
    return $this->hasOne(ProfileVolunteer::class, 'account_id');
}
}