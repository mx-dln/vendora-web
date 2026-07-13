<?php

namespace Database\Factories;

use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionItemFactory extends Factory
{
    protected $model = TransactionItem::class;

    public function definition(): array
    {
        $unitPrice = fake()->randomFloat(2, 10, 500);
        $quantity = fake()->randomFloat(0, 1, 10);
        $subtotal = $unitPrice * $quantity;

        return [
            'transaction_id' => Transaction::factory(),
            'product_id' => null,
            'product_variant_id' => null,
            'product_name' => fake()->word(),
            'product_sku' => fake()->ean8(),
            'product_barcode' => null,
            'unit_price' => $unitPrice,
            'cost_price' => $unitPrice * 0.7,
            'quantity' => $quantity,
            'voided_quantity' => 0,
            'void_reason' => null,
            'voided_at' => null,
            'voided_by' => null,
            'subtotal' => $subtotal,
            'discount_amount' => 0,
            'discount_percentage' => 0,
            'tax_amount' => 0,
            'total' => $subtotal,
            'unit' => 'piece',
            'notes' => null,
        ];
    }
}
