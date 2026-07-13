<?php

namespace App\Http\Controllers;

use App\Enums\InventoryMovementType;
use App\Models\InventoryMovement;
use App\Models\InventoryTransfer;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryTransferController extends Controller
{
    public function index(Request $request)
    {
        $transfers = InventoryTransfer::with('user', 'approvedBy', 'items.product')
            ->when($request->search, fn ($q, $v) => $q->where('reference_number', 'like', "%{$v}%"))
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')
            ->paginate(15)->withQueryString();

        return Inertia::render('inventory-transfers/index', [
            'transfers' => $transfers,
            'filters' => $request->only(['search', 'status', 'sort', 'order']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'from_location' => ['required', 'string', 'max:100'],
            'to_location' => ['required', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
        ]);

        return DB::transaction(function () use ($validated) {
            $transfer = InventoryTransfer::create([
                'from_location' => $validated['from_location'],
                'to_location' => $validated['to_location'],
                'user_id' => auth()->id(),
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $transfer->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_cost' => $product->cost_price,
                ]);
            }

            return redirect()->back()->with('success', 'Transfer request created.');
        });
    }

    public function approve(InventoryTransfer $inventoryTransfer)
    {
        return DB::transaction(function () use ($inventoryTransfer) {
            $inventoryTransfer->update([
                'status' => 'approved',
                'approved_by' => auth()->id(),
            ]);

            return redirect()->back()->with('success', 'Transfer approved.');
        });
    }

    public function complete(InventoryTransfer $inventoryTransfer)
    {
        return DB::transaction(function () use ($inventoryTransfer) {
            foreach ($inventoryTransfer->items as $item) {
                $product = $item->product;
                $before = $product->stock_quantity;

                InventoryMovement::create([
                    'product_id' => $product->id,
                    'type' => InventoryMovementType::StockOut->value,
                    'quantity' => -$item->quantity,
                    'quantity_before' => $before,
                    'quantity_after' => $before,
                    'reference_type' => 'inventory_transfer',
                    'reference_id' => $inventoryTransfer->id,
                    'user_id' => auth()->id(),
                    'notes' => "Transferred to {$inventoryTransfer->to_location}",
                ]);
            }

            $inventoryTransfer->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            return redirect()->back()->with('success', 'Transfer completed.');
        });
    }
}
