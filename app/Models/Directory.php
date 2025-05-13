<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Directory extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'name',
        'role',
        'email',
        'phone',
        'location',
        'category',
        'created_by',
        'sk_station',
        'status',
        'position_order',
        'reports_to'
    ];
    
    public function creator()
    {
        return $this->belongsTo(Skaccount::class, 'created_by');
    }
    
    public function supervisor()
    {
        return $this->belongsTo(Directory::class, 'reports_to');
    }
    
    public function subordinates()
    {
        return $this->hasMany(Directory::class, 'reports_to');
    }
}