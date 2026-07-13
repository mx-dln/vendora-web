<?php

namespace App\Models;

use Database\Factories\TransactionItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $transaction_id
 * @property int|null $product_id
 * @property int|null $product_variant_id
 * @property string $product_name
 * @property string|null $product_sku
 * @property string|null $product_barcode
 * @property float $unit_price
 * @property float $cost_price
 * @property float $quantity
 * @property float $voided_quantity
 * @property string|null $void_reason
 * @property Carbon|null $voided_at
 * @property int|null $voided_by
 * @property float $subtotal
 * @property float $discount_amount
 * @property float $discount_percentage
 * @property float $tax_amount
 * @property float $total
 * @property string|null $unit
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Transaction $transaction
 * @property-read Product|null $product
 * @property-read ProductVariant|null $variant
 */
#[Fillable(['transaction_id', 'product_id', 'product_variant_id', 'product_name', 'product_sku', 'product_barcode', 'unit_price', 'cost_price', 'quantity', 'voided_quantity', 'void_reason', 'voided_at', 'voided_by', 'subtotal', 'discount_amount', 'discount_percentage', 'tax_amount', 'total', 'unit', 'notes'])]
class TransactionItem extends Model
{
    /** @use HasFactory<TransactionItemFactory> */
    use HasFactory;

    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'quantity' => 'decimal:2',
            'voided_quantity' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'voided_at' => 'datetime',
        ];
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
