<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Promotion extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'type', 'discount_value', 'min_purchase',
        'buy_quantity', 'get_quantity', 'get_discount_percent',
        'category_id', 'product_id', 'start_date', 'end_date',
        'happy_hour_start', 'happy_hour_end', 'days_of_week',
        'usage_limit', 'usage_count', 'coupon_code', 'is_active', 'description',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'min_purchase' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
            'days_of_week' => 'array',
            'is_active' => 'bool',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
