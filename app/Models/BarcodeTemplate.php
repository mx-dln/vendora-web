<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BarcodeTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'type', 'page_width', 'page_height', 'label_width', 'label_height',
        'columns', 'rows', 'barcode_type', 'show_price', 'show_product_name',
        'show_barcode', 'show_brand', 'font_size', 'margins', 'is_default', 'is_active',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    protected function casts(): array
    {
        return [
            'show_price' => 'bool',
            'show_product_name' => 'bool',
            'show_barcode' => 'bool',
            'show_brand' => 'bool',
            'is_default' => 'bool',
            'is_active' => 'bool',
            'margins' => 'array',
        ];
    }
}
