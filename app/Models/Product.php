<?php

namespace App\Models;

use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string|null $brand
 * @property string $slug
 * @property string|null $description
 * @property string|null $sku
 * @property string|null $barcode
 * @property string|null $barcode_type
 * @property int|null $category_id
 * @property float $cost_price
 * @property float $selling_price
 * @property float|null $wholesale_price
 * @property int $stock_quantity
 * @property int $low_stock_threshold
 * @property float|null $reorder_quantity
 * @property int|null $preferred_supplier_id
 * @property string|null $unit
 * @property bool $track_inventory
 * @property bool $has_variants
 * @property string $status
 * @property bool $is_active
 * @property string|null $image
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read Category|null $category
 * @property-read Supplier|null $preferredSupplier
 * @property-read ProductVariant[] $variants
 * @property-read TransactionItem[] $transactionItems
 */
#[Fillable(['name', 'brand', 'slug', 'description', 'sku', 'barcode', 'barcode_type', 'category_id', 'cost_price', 'selling_price', 'wholesale_price', 'stock_quantity', 'low_stock_threshold', 'reorder_quantity', 'preferred_supplier_id', 'unit', 'track_inventory', 'has_variants', 'status', 'is_active', 'image', 'notes'])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'selling_price' => 'decimal:2',
            'wholesale_price' => 'decimal:2',
            'reorder_quantity' => 'decimal:2',
            'stock_quantity' => 'integer',
            'low_stock_threshold' => 'integer',
            'track_inventory' => 'boolean',
            'has_variants' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function preferredSupplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'preferred_supplier_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function transactionItems(): HasMany
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeLowStock($query)
    {
        return $query->where('track_inventory', true)
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->where('stock_quantity', '>', 0);
    }

    public function scopeOutOfStock($query)
    {
        return $query->where('track_inventory', true)
            ->where('stock_quantity', '<=', 0);
    }

    public function scopeReorderNeeded($query)
    {
        return $query->where('track_inventory', true)
            ->whereNotNull('reorder_quantity')
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold');
    }
}
