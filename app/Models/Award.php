<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Award extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'title',
        'description',
        'category',
        'recipients',
        'date_awarded',
        'main_image',
        'gallery',
        'year',
        'status',
        'sk_station',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'date_awarded' => 'date',
        'gallery' => 'array',
        'year' => 'integer',
    ];

    /**
     * Get the creator of the award.
     */
    public function creator()
    {
        return $this->belongsTo(Skaccount::class, 'created_by');
    }
}