<?php

namespace App\Services;

use App\Enums\InventoryMovementType;
use App\Models\InventoryMovement;
use App\Models\Notification;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public function stockIn(Product $product, float $quantity, ?float $unitCost = null, ?string $notes = null): InventoryMovement
    {
        return DB::transaction(function () use ($product, $quantity, $unitCost, $notes) {
            $before = $product->stock_quantity;
            $product->increment('stock_quantity', $quantity);
            $product->update(['cost_price' => $unitCost ?? $product->cost_price]);

            return InventoryMovement::create([
                'product_id' => $product->id,
                'type' => InventoryMovementType::StockIn->value,
                'quantity' => $quantity,
                'quantity_before' => $before,
                'quantity_after' => $product->fresh()->stock_quantity,
                'unit_cost' => $unitCost,
                'user_id' => Auth::id(),
                'notes' => $notes,
            ]);
        });
    }

    public function stockOut(Product $product, float $quantity, ?string $notes = null): InventoryMovement
    {
        return DB::transaction(function () use ($product, $quantity, $notes) {
            $before = $product->stock_quantity;
            $product->decrement('stock_quantity', $quantity);

            $movement = InventoryMovement::create([
                'product_id' => $product->id,
                'type' => InventoryMovementType::StockOut->value,
                'quantity' => -$quantity,
                'quantity_before' => $before,
                'quantity_after' => $product->fresh()->stock_quantity,
                'user_id' => Auth::id(),
                'notes' => $notes,
            ]);

            $this->checkLowStockNotification($product);

            return $movement;
        });
    }

    public function adjustStock(Product $product, float $newQuantity, ?string $notes = null): InventoryMovement
    {
        return DB::transaction(function () use ($product, $newQuantity, $notes) {
            $before = $product->stock_quantity;
            $difference = $newQuantity - $before;
            $product->update(['stock_quantity' => $newQuantity]);

            $movement = InventoryMovement::create([
                'product_id' => $product->id,
                'type' => InventoryMovementType::Adjustment->value,
                'quantity' => $difference,
                'quantity_before' => $before,
                'quantity_after' => $newQuantity,
                'user_id' => Auth::id(),
                'notes' => $notes,
            ]);

            $this->checkLowStockNotification($product);

            return $movement;
        });
    }

    public function getLowStockProducts(): mixed
    {
        return Product::active()
            ->where('track_inventory', true)
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->where('stock_quantity', '>', 0)
            ->orderBy('stock_quantity')
            ->get();
    }

    public function getOutOfStockProducts(): mixed
    {
        return Product::active()
            ->where('track_inventory', true)
            ->where('stock_quantity', '=', 0)
            ->get();
    }

    private function checkLowStockNotification(Product $product): void
    {
        if (! $product->track_inventory || $product->stock_quantity > $product->low_stock_threshold) {
            return;
        }

        $type = $product->stock_quantity <= 0 ? 'out_of_stock' : 'low_stock';
        $title = $product->stock_quantity <= 0
            ? "{$product->name} is out of stock"
            : "{$product->name} is running low";
        $body = $product->stock_quantity <= 0
            ? "{$product->name} has 0 stock. Restock immediately."
            : "Only {$product->stock_quantity} left (threshold: {$product->low_stock_threshold}).";

        $owners = User::role('Owner')->get();

        foreach ($owners as $owner) {
            $existing = Notification::forUser($owner->id)
                ->where('type', $type)
                ->where('title', $title)
                ->whereNull('read_at')
                ->exists();

            if (! $existing) {
                Notification::create([
                    'user_id' => $owner->id,
                    'type' => $type,
                    'title' => $title,
                    'body' => $body,
                    'link' => route('products.index', ['status' => $type === 'out_of_stock' ? 'out_of_stock' : 'low_stock']),
                ]);
            }
        }
    }
}
