<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoyaltyReward extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'tier', 'points_required', 'reward_type', 'discount_value',
        'discount_type', 'free_product_id', 'description', 'is_active',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'is_active' => 'bool',
        ];
    }
}
