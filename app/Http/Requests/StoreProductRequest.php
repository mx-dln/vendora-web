<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $productId = $this->route('product');
        if ($productId instanceof Product) {
            $productId = $productId->id;
        }

        return [
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:products,slug,'.$productId],
            'description' => ['nullable', 'string'],
            'sku' => ['nullable', 'string', 'max:100', 'unique:products,sku,'.$productId],
            'barcode' => ['nullable', 'string', 'max:100', 'unique:products,barcode,'.$productId],
            'barcode_type' => ['nullable', 'string', 'in:code128,ean13,upca,qr'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'wholesale_price' => ['nullable', 'numeric', 'min:0'],
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
            'reorder_quantity' => ['nullable', 'numeric', 'min:0'],
            'preferred_supplier_id' => ['nullable', 'exists:suppliers,id'],
            'unit' => ['nullable', 'string', 'max:50'],
            'track_inventory' => ['boolean'],
            'has_variants' => ['boolean'],
            'status' => ['nullable', 'string', 'in:active,inactive,discontinued'],
            'is_active' => ['boolean'],
            'image' => ['nullable'],
            'notes' => ['nullable', 'string'],
            'regenerate_barcode' => ['nullable', 'boolean'],
        ];
    }
}
