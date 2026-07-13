<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoodsReceivingItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'goods_receiving_id', 'product_id', 'purchase_order_item_id', 'product_name',
        'product_sku', 'quantity_ordered', 'quantity_received', 'quantity_damaged',
        'unit_cost', 'subtotal', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity_ordered' => 'decimal:2',
            'quantity_received' => 'decimal:2',
            'quantity_damaged' => 'decimal:2',
            'unit_cost' => 'decimal:2',
            'subtotal' => 'decimal:2',
        ];
    }

    public function goodsReceiving(): BelongsTo
    {
        return $this->belongsTo(GoodsReceiving::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function purchaseOrderItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderItem::class);
    }
}
