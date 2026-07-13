<?php

namespace Database\Factories;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 50, 5000);
        $discount = 0;
        $tax = 0;
        $total = $subtotal - $discount + $tax;

        return [
            'user_id' => User::factory(),
            'customer_id' => null,
            'reference_number' => 'INV-'.now()->format('Ymd').'-'.str_pad((string) fake()->unique()->randomNumber(6), 6, '0', STR_PAD_LEFT),
            'subtotal' => $subtotal,
            'tax_amount' => $tax,
            'tax_rate' => 0,
            'discount_amount' => $discount,
            'discount_percentage' => 0,
            'total' => $total,
            'tendered_amount' => $total,
            'change_amount' => 0,
            'status' => 'completed',
            'payment_status' => 'paid',
            'payment_method' => fake()->randomElement(['cash', 'gcash', 'maya']),
            'notes' => null,
            'item_count' => 0,
        ];
    }

    public function voided(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'voided',
            'voided_at' => now(),
            'void_reason' => 'Test void',
        ]);
    }
}
