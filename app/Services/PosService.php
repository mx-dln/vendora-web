<?php

namespace App\Services;

use App\Enums\InventoryMovementType;
use App\Enums\TransactionStatus;
use App\Exceptions\InsufficientStockException;
use App\Models\Customer;
use App\Models\HeldTransaction;
use App\Models\InventoryMovement;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PosService
{
    public function searchProducts(string $query, ?int $categoryId = null, int $perPage = 20): mixed
    {
        return Product::with('category', 'variants')
            ->active()
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('sku', 'like', "%{$query}%")
                    ->orWhere('barcode', 'like', "%{$query}%");
            })
            ->when($categoryId, fn ($q) => $q->where('category_id', $categoryId))
            ->paginate($perPage);
    }

    public function processTransaction(array $data): Transaction
    {
        return DB::transaction(function () use ($data) {
            $items = $data['items'];
            $subtotal = collect($items)->sum(fn ($i) => $i['unit_price'] * $i['quantity']);
            $discountAmount = $data['discount_amount'] ?? 0;
            $taxRate = $data['tax_rate'] ?? 0;
            $taxAmount = ($subtotal - $discountAmount) * ($taxRate / 100);
            $total = $subtotal - $discountAmount + $taxAmount;
            $tendered = $data['tendered_amount'] ?? $total;
            $change = max(0, $tendered - $total);

            $transaction = Transaction::create([
                'reference_number' => $this->generateReferenceNumber(),
                'user_id' => Auth::id(),
                'customer_id' => $data['customer_id'] ?? null,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'tax_rate' => $taxRate,
                'discount_amount' => $discountAmount,
                'discount_percentage' => $data['discount_percentage'] ?? 0,
                'total' => $total,
                'tendered_amount' => $tendered,
                'change_amount' => $change,
                'status' => TransactionStatus::Completed->value,
                'payment_status' => 'paid',
                'payment_method' => $data['payment_method'] ?? 'cash',
                'notes' => $data['notes'] ?? null,
                'item_count' => count($items),
            ]);

            // Validate stock before processing
            foreach ($items as $item) {
                $product = Product::findOrFail($item['product_id']);
                if ($product->track_inventory && (float) $item['quantity'] > (float) $product->stock_quantity) {
                    throw new InsufficientStockException(
                        "Insufficient stock for {$product->name}. Available: {$product->stock_quantity}, requested: {$item['quantity']}."
                    );
                }
            }

            foreach ($items as $item) {
                $product = Product::findOrFail($item['product_id']);
                $itemSubtotal = $item['unit_price'] * $item['quantity'];
                $itemTotal = $itemSubtotal;
                $itemTax = 0;

                if ($taxRate > 0) {
                    $itemTax = $itemSubtotal * ($taxRate / 100);
                    $itemTotal = $itemSubtotal + $itemTax;
                }

                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $product->id,
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'product_barcode' => $product->barcode,
                    'unit_price' => $item['unit_price'],
                    'cost_price' => $product->cost_price,
                    'quantity' => $item['quantity'],
                    'subtotal' => $itemSubtotal,
                    'discount_amount' => 0,
                    'discount_percentage' => 0,
                    'tax_amount' => $itemTax,
                    'total' => $itemTotal,
                    'unit' => $product->unit,
                    'notes' => $item['notes'] ?? null,
                ]);

                if ($product->track_inventory) {
                    $before = $product->stock_quantity;
                    $product->decrement('stock_quantity', $item['quantity']);

                    InventoryMovement::create([
                        'product_id' => $product->id,
                        'type' => InventoryMovementType::Sale->value,
                        'quantity' => -$item['quantity'],
                        'quantity_before' => $before,
                        'quantity_after' => $product->fresh()->stock_quantity,
                        'reference_type' => 'transaction',
                        'reference_id' => $transaction->id,
                        'user_id' => Auth::id(),
                    ]);
                }
            }

            if ($data['customer_id'] ?? null) {
                $customer = Customer::find($data['customer_id']);
                if ($customer) {
                    $customer->increment('total_purchases', $total);
                    $customer->increment('visit_count');
                    $customer->update(['last_visit_at' => now()]);
                }
            }

            if (! empty($data['payments'])) {
                foreach ($data['payments'] as $payment) {
                    Payment::create([
                        'transaction_id' => $transaction->id,
                        'payment_method' => $payment['method'],
                        'amount' => $payment['amount'],
                        'reference_number' => $payment['reference_number'] ?? null,
                    ]);
                }
            } else {
                Payment::create([
                    'transaction_id' => $transaction->id,
                    'payment_method' => $data['payment_method'] ?? 'cash',
                    'amount' => $total,
                ]);
            }

            return $transaction->load(['items', 'payments', 'customer']);
        });
    }

    public function holdTransaction(array $data): HeldTransaction
    {
        return HeldTransaction::create([
            'user_id' => Auth::id(),
            'label' => $data['label'],
            'cart_data' => $data['cart_data'],
            'customer_data' => $data['customer_data'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);
    }

    public function voidTransaction(Transaction $transaction, string $reason): Transaction
    {
        return DB::transaction(function () use ($transaction, $reason) {
            $transaction->update([
                'status' => TransactionStatus::Voided->value,
                'voided_at' => now(),
                'voided_by' => Auth::id(),
                'void_reason' => $reason,
            ]);

            foreach ($transaction->items as $item) {
                if ($item->product && $item->product->track_inventory) {
                    $product = $item->product;
                    $before = $product->stock_quantity;
                    $product->increment('stock_quantity', $item->quantity);

                    InventoryMovement::create([
                        'product_id' => $product->id,
                        'type' => InventoryMovementType::Return->value,
                        'quantity' => $item->quantity,
                        'quantity_before' => $before,
                        'quantity_after' => $product->fresh()->stock_quantity,
                        'reference_type' => 'transaction',
                        'reference_id' => $transaction->id,
                        'user_id' => Auth::id(),
                        'notes' => "Voided transaction {$transaction->reference_number}",
                    ]);
                }
            }

            return $transaction->fresh();
        });
    }

    private function generateReferenceNumber(): string
    {
        $prefix = 'INV-';
        $date = now()->format('Ymd');
        $random = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        return $prefix.$date.'-'.$random;
    }
}
