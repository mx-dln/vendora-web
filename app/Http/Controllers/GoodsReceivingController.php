<?php

namespace App\Http\Controllers;

use App\Enums\InventoryMovementType;
use App\Models\GoodsReceiving;
use App\Models\GoodsReceivingItem;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GoodsReceivingController extends Controller
{
    public function index(Request $request)
    {
        $receivings = GoodsReceiving::with('supplier', 'user', 'items')
            ->when($request->search, fn ($q, $v) => $q->where('reference_number', 'like', "%{$v}%"))
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->date_from, fn ($q, $v) => $q->whereDate('received_date', '>=', $v))
            ->when($request->date_to, fn ($q, $v) => $q->whereDate('received_date', '<=', $v))
            ->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')
            ->paginate(15)->withQueryString();

        return Inertia::render('goods-receivings/index', [
            'receivings' => $receivings,
            'purchaseOrders' => PurchaseOrder::whereIn('status', ['sent', 'partial'])->get(['id', 'reference_number', 'supplier_id']),
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to', 'sort', 'order']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'purchase_order_id' => ['nullable', 'exists:purchase_orders,id'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'received_date' => ['required', 'date'],
            'delivery_note' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity_received' => ['required', 'numeric', 'min:0.01'],
            'items.*.quantity_damaged' => ['nullable', 'numeric', 'min:0'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($validated) {
            $receiving = GoodsReceiving::create([
                'purchase_order_id' => $validated['purchase_order_id'] ?? null,
                'supplier_id' => $validated['supplier_id'] ?? null,
                'user_id' => auth()->id(),
                'received_date' => $validated['received_date'],
                'delivery_note' => $validated['delivery_note'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'received',
            ]);

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $qtyReceived = $item['quantity_received'];
                $qtyDamaged = $item['quantity_damaged'] ?? 0;

                GoodsReceivingItem::create([
                    'goods_receiving_id' => $receiving->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity_received' => $qtyReceived,
                    'quantity_damaged' => $qtyDamaged,
                    'unit_cost' => $item['unit_cost'],
                    'subtotal' => $qtyReceived * $item['unit_cost'],
                    'notes' => $item['notes'] ?? null,
                ]);

                $before = $product->stock_quantity;
                $product->increment('stock_quantity', $qtyReceived);

                InventoryMovement::create([
                    'product_id' => $product->id,
                    'type' => InventoryMovementType::StockIn->value,
                    'quantity' => $qtyReceived,
                    'quantity_before' => $before,
                    'quantity_after' => $product->fresh()->stock_quantity,
                    'unit_cost' => $item['unit_cost'],
                    'reference_type' => 'goods_receiving',
                    'reference_id' => $receiving->id,
                    'user_id' => auth()->id(),
                    'notes' => "Received via {$receiving->reference_number}",
                ]);

                if ($qtyDamaged > 0) {
                    InventoryMovement::create([
                        'product_id' => $product->id,
                        'type' => InventoryMovementType::Adjustment->value,
                        'quantity' => -$qtyDamaged,
                        'quantity_before' => $product->fresh()->stock_quantity,
                        'quantity_after' => $product->fresh()->stock_quantity - $qtyDamaged,
                        'reference_type' => 'goods_receiving',
                        'reference_id' => $receiving->id,
                        'user_id' => auth()->id(),
                        'notes' => "Damaged items from {$receiving->reference_number}",
                    ]);
                    $product->decrement('stock_quantity', $qtyDamaged);
                }
            }

            if ($validated['purchase_order_id'] ?? null) {
                $po = PurchaseOrder::find($validated['purchase_order_id']);
                $allReceived = $po->items()->whereDoesntHave('goodsReceivingItems', fn ($q) => $q->whereColumn('quantity_received', '>=', 'purchase_order_items.quantity_ordered'))->count() === 0;
                $po->update(['status' => $allReceived ? 'received' : 'partial']);
            }

            return redirect()->route('goods-receivings.index')
                ->with('success', 'Goods received successfully. Stock updated.');
        });
    }

    public function show(GoodsReceiving $goodsReceiving)
    {
        $goodsReceiving->load(['supplier', 'user', 'items.product', 'purchaseOrder']);

        return Inertia::render('goods-receivings/show', ['receiving' => $goodsReceiving]);
    }
}
