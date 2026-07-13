<?php

namespace Database\Seeders;

use App\Enums\InventoryMovementType;
use App\Enums\TransactionStatus;
use App\Models\Customer;
use App\Models\InventoryMovement;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $cashier = User::where('role', 'cashier')->first() ?? User::first();
        $products = Product::all();
        $customers = Customer::all();

        if ($products->isEmpty()) {
            $this->command->warn('No products found. Skipping transaction seeder.');

            return;
        }

        $paymentMethods = ['cash', 'cash', 'cash', 'gcash', 'maya'];

        for ($i = 0; $i < 50; $i++) {
            $date = now()->subDays(fake()->numberBetween(0, 30))->subHours(fake()->numberBetween(6, 20))->subMinutes(fake()->numberBetween(0, 59));
            $selectedProducts = $products->random(fake()->numberBetween(1, min(5, $products->count())));

            $subtotal = 0;
            $totalItems = 0;
            $items = [];

            foreach ($selectedProducts as $product) {
                $qty = fake()->randomFloat(0, 1, 5);
                $itemSubtotal = $product->selling_price * $qty;
                $subtotal += $itemSubtotal;
                $totalItems += $qty;

                $items[] = [
                    'product_id' => $product->id,
                    'product_variant_id' => null,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'product_barcode' => $product->barcode,
                    'unit_price' => $product->selling_price,
                    'cost_price' => $product->cost_price,
                    'quantity' => $qty,
                    'subtotal' => $itemSubtotal,
                    'discount_amount' => 0,
                    'discount_percentage' => 0,
                    'tax_amount' => 0,
                    'total' => $itemSubtotal,
                    'unit' => $product->unit,
                    'notes' => null,
                    'created_at' => $date,
                    'updated_at' => $date,
                ];
            }

            $discountAmount = 0;
            $discountPct = 0;
            if (fake()->boolean(20)) {
                $discountPct = fake()->randomElement([5, 10, 15, 20]);
                $discountAmount = $subtotal * $discountPct / 100;
            }

            $taxAmount = 0;
            $total = $subtotal - $discountAmount + $taxAmount;
            $tendered = $total + fake()->randomFloat(2, 0, $total > 50 ? 100 : 50);
            $change = max(0, $tendered - $total);
            $paymentMethod = fake()->randomElement($paymentMethods);
            $customer = fake()->boolean(60) ? $customers->random() : null;

            $refNum = 'INV-'.$date->format('Ymd').'-'.str_pad((string) ($i + 1), 6, '0', STR_PAD_LEFT);

            $transaction = Transaction::create([
                'reference_number' => $refNum,
                'user_id' => $cashier->id,
                'customer_id' => $customer?->id,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'tax_rate' => 0,
                'discount_amount' => $discountAmount,
                'discount_percentage' => $discountPct,
                'total' => $total,
                'tendered_amount' => $tendered,
                'change_amount' => $change,
                'status' => TransactionStatus::Completed->value,
                'payment_status' => 'paid',
                'payment_method' => $paymentMethod,
                'notes' => fake()->boolean(10) ? fake()->sentence() : null,
                'item_count' => $totalItems,
                'created_at' => $date,
                'updated_at' => $date,
            ]);

            foreach ($items as $item) {
                $item['transaction_id'] = $transaction->id;
                TransactionItem::create($item);

                $product = Product::find($item['product_id']);
                if ($product && $product->track_inventory) {
                    $before = $product->stock_quantity;
                    $product->decrement('stock_quantity', $item['quantity']);

                    InventoryMovement::create([
                        'product_id' => $product->id,
                        'type' => InventoryMovementType::Sale->value,
                        'quantity' => -$item['quantity'],
                        'quantity_before' => $before,
                        'quantity_after' => $product->fresh()->stock_quantity,
                        'unit_cost' => $product->cost_price,
                        'reference_type' => 'transaction',
                        'reference_id' => $transaction->id,
                        'user_id' => $cashier->id,
                        'notes' => "Sale: {$refNum}",
                        'created_at' => $date,
                        'updated_at' => $date,
                    ]);
                }
            }

            Payment::create([
                'transaction_id' => $transaction->id,
                'payment_method' => $paymentMethod,
                'amount' => $total,
                'reference_number' => $paymentMethod !== 'cash' ? 'REF'.strtoupper(fake()->bothify('??###???')) : null,
                'notes' => null,
                'created_at' => $date,
                'updated_at' => $date,
            ]);

            if ($customer) {
                $customer->increment('total_purchases', $total);
                $customer->increment('visit_count');
                $customer->update(['last_visit_at' => $date]);
            }
        }

        $this->command->info('Created 50 sample transactions.');
    }
}
