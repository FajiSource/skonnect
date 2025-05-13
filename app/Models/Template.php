<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'category',
        'file_type',
        'file_path',
        'file_size',
        'download_count',
        'status'
    ];

    protected $casts = [
        'download_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function incrementDownloadCount()
    {
        $this->increment('download_count');
    }
}