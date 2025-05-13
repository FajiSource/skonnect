<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BarangayPolicy extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'category',
        'file_path',
        'year',
        'barangay',
        'archived',
        'archive_reason',
        'archived_at'
    ];

    protected $casts = [
        'archived' => 'boolean',
        'archived_at' => 'datetime',
    ];
}