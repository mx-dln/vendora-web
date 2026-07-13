<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockCountItem extends Model
{
    use HasFactory;

    protected $fillable = ['stock_count_id', 'product_id', 'expected_qty', 'counted_qty', 'difference_qty', 'notes'];

    protected function casts(): array
    {
        return [
            'expected_qty' => 'decimal:2',
            'counted_qty' => 'decimal:2',
            'difference_qty' => 'decimal:2',
        ];
    }

    protected $attributes = [
        'counted_qty' => null,
    ];

    public function stockCount(): BelongsTo
    {
        return $this->belongsTo(StockCount::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
