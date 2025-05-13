<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Skaccount extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'birthdate',
        'age',
        'email',
        'phone_number',
        'address',
        'sk_station',
        'sk_role',
        'verification_status',
        'valid_id',
        'password',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'birthdate' => 'date',
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];
    
    /**
     * Get the full name of the SK member.
     *
     * @return string
     */
    public function getFullNameAttribute()
    {
        return "{$this->first_name} " . ($this->middle_name ? $this->middle_name . ' ' : '') . $this->last_name;
    }
}