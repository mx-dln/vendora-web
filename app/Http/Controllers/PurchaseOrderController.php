<?php

namespace App\Http\Controllers;

use App\Models\AssistantLog;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $query = PurchaseOrder::with('supplier:id,name', 'user:id,name', 'items');

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('reference_number', 'like', "%{$s}%")
                    ->orWhereHas('supplier', fn ($q) => $q->where('name', 'like', "%{$s}%"));
            });
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }
        if ($request->date_from) {
            $query->whereDate('order_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('order_date', '<=', $request->date_to);
        }

        $sort = $request->sort ?? 'created_at';
        $order = $request->order ?? 'desc';
        $query->orderBy($sort, $order);

        $purchaseOrders = $query->paginate(15)->withQueryString();

        $stats = [
            'total' => PurchaseOrder::count(),
            'draft' => PurchaseOrder::where('status', 'draft')->count(),
            'sent' => PurchaseOrder::where('status', 'sent')->count(),
            'partial' => PurchaseOrder::where('status', 'partial')->count(),
            'received' => PurchaseOrder::where('status', 'received')->count(),
            'month_value' => PurchaseOrder::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('total'),
        ];

        return Inertia::render('purchase-orders/index', [
            'purchaseOrders' => $purchaseOrders,
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'supplier_id', 'date_from', 'date_to', 'sort', 'order']),
        ]);
    }

    public function show(PurchaseOrder $purchaseOrder): Response
    {
        $purchaseOrder->load([
            'supplier',
            'user:id,name',
            'items.product:id,name,stock_quantity,cost_price',
        ]);

        $activities = AssistantLog::where(function ($q) use ($purchaseOrder) {
            $q->where('response', 'like', "%PO-{$purchaseOrder->reference_number}%")
                ->orWhere('original_question', 'like', "%{$purchaseOrder->reference_number}%");
        })->latest()->take(10)->get();

        return Inertia::render('purchase-orders/show', [
            'purchaseOrder' => $purchaseOrder,
            'activities' => $activities,
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('purchase-orders/create', [
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function edit(PurchaseOrder $purchaseOrder): Response
    {
        $purchaseOrder->load('items');

        return Inertia::render('purchase-orders/edit', [
            'purchaseOrder' => $purchaseOrder,
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'order_date' => ['required', 'date'],
            'expected_date' => ['nullable', 'date', 'after_or_equal:order_date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'exists:products,id'],
            'items.*.product_name' => ['required', 'string'],
            'items.*.product_sku' => ['nullable', 'string'],
            'items.*.quantity_ordered' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
        ]);

        return DB::transaction(function () use ($validated) {
            $items = $validated['items'];
            unset($validated['items']);

            $subtotal = collect($items)->sum(fn ($i) => $i['quantity_ordered'] * $i['unit_cost']);
            $taxAmount = $validated['tax_amount'] ?? 0;
            $shippingCost = $validated['shipping_cost'] ?? 0;
            $total = $subtotal + $taxAmount + $shippingCost;

            $validated['user_id'] = Auth::id();
            $validated['status'] = 'draft';
            $validated['subtotal'] = $subtotal;
            $validated['tax_amount'] = $taxAmount;
            $validated['shipping_cost'] = $shippingCost;
            $validated['total'] = $total;

            $po = PurchaseOrder::create($validated);

            foreach ($items as $item) {
                $po->items()->create([
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['product_name'],
                    'product_sku' => $item['product_sku'] ?? null,
                    'quantity_ordered' => $item['quantity_ordered'],
                    'quantity_received' => 0,
                    'unit_cost' => $item['unit_cost'],
                    'subtotal' => $item['quantity_ordered'] * $item['unit_cost'],
                    'total' => $item['quantity_ordered'] * $item['unit_cost'],
                ]);
            }

            return redirect()->route('purchase-orders.show', $po)
                ->with('success', 'Purchase order created.');
        });
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        if ($purchaseOrder->status === 'received' || $purchaseOrder->status === 'cancelled') {
            return redirect()->back()->with('error', 'Cannot modify a received or cancelled order.');
        }

        $validated = $request->validate([
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'order_date' => ['required', 'date'],
            'expected_date' => ['nullable', 'date', 'after_or_equal:order_date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['nullable', 'exists:purchase_order_items,id'],
            'items.*.product_id' => ['nullable', 'exists:products,id'],
            'items.*.product_name' => ['required', 'string'],
            'items.*.product_sku' => ['nullable', 'string'],
            'items.*.quantity_ordered' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
        ]);

        return DB::transaction(function () use ($validated, $purchaseOrder) {
            $items = $validated['items'];
            unset($validated['items']);

            $subtotal = collect($items)->sum(fn ($i) => $i['quantity_ordered'] * $i['unit_cost']);
            $taxAmount = $validated['tax_amount'] ?? 0;
            $shippingCost = $validated['shipping_cost'] ?? 0;
            $total = $subtotal + $taxAmount + $shippingCost;

            $validated['subtotal'] = $subtotal;
            $validated['tax_amount'] = $taxAmount;
            $validated['shipping_cost'] = $shippingCost;
            $validated['total'] = $total;

            $purchaseOrder->update($validated);

            $existingIds = $purchaseOrder->items()->pluck('id')->toArray();
            $submittedIds = collect($items)->pluck('id')->filter()->toArray();
            $toDelete = array_diff($existingIds, $submittedIds);
            if (! empty($toDelete)) {
                $purchaseOrder->items()->whereIn('id', $toDelete)->delete();
            }

            foreach ($items as $item) {
                $itemData = [
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['product_name'],
                    'product_sku' => $item['product_sku'] ?? null,
                    'quantity_ordered' => $item['quantity_ordered'],
                    'unit_cost' => $item['unit_cost'],
                    'subtotal' => $item['quantity_ordered'] * $item['unit_cost'],
                    'total' => $item['quantity_ordered'] * $item['unit_cost'],
                ];

                if (! empty($item['id'])) {
                    $poItem = $purchaseOrder->items()->find($item['id']);
                    if ($poItem) {
                        $itemData['quantity_received'] = min($poItem->quantity_received, $item['quantity_ordered']);
                        $poItem->update($itemData);
                    }
                } else {
                    $itemData['quantity_received'] = 0;
                    $purchaseOrder->items()->create($itemData);
                }
            }

            return redirect()->route('purchase-orders.show', $purchaseOrder)
                ->with('success', 'Purchase order updated.');
        });
    }

    public function send(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        if ($purchaseOrder->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft orders can be sent.');
        }

        $purchaseOrder->update(['status' => 'sent']);

        return redirect()->route('purchase-orders.show', $purchaseOrder)
            ->with('success', 'Purchase order sent to supplier.');
    }

    public function cancel(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        if (in_array($purchaseOrder->status, ['received', 'cancelled'])) {
            return redirect()->back()->with('error', 'Cannot cancel a received or already cancelled order.');
        }

        $purchaseOrder->update(['status' => 'cancelled']);

        return redirect()->route('purchase-orders.show', $purchaseOrder)
            ->with('success', 'Purchase order cancelled.');
    }

    public function receive(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        if (! in_array($purchaseOrder->status, ['sent', 'partial'])) {
            return redirect()->back()->with('error', 'Only sent or partially received orders can receive goods.');
        }

        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'exists:purchase_order_items,id'],
            'items.*.quantity_received' => ['required', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($validated, $purchaseOrder) {
            $allFullyReceived = true;
            $anyReceived = false;

            foreach ($validated['items'] as $itemData) {
                $poItem = $purchaseOrder->items()->findOrFail($itemData['id']);
                $newQty = (float) $itemData['quantity_received'];
                $prevReceived = (float) $poItem->quantity_received;

                if ($newQty <= 0) {
                    continue;
                }

                $remaining = (float) $poItem->quantity_ordered - $prevReceived;
                $receiveQty = min($newQty, $remaining);

                if ($receiveQty <= 0) {
                    continue;
                }

                $poItem->increment('quantity_received', $receiveQty);
                $anyReceived = true;

                if ($poItem->quantity_received < $poItem->quantity_ordered) {
                    $allFullyReceived = false;
                }

                if ($poItem->product_id && $poItem->product) {
                    $product = $poItem->product;
                    $before = (float) $product->stock_quantity;

                    InventoryMovement::create([
                        'product_id' => $poItem->product_id,
                        'type' => 'stock_in',
                        'quantity' => $receiveQty,
                        'quantity_before' => $before,
                        'quantity_after' => $before + $receiveQty,
                        'unit_cost' => (float) $poItem->unit_cost,
                        'reference_type' => 'purchase_order',
                        'reference_id' => $purchaseOrder->id,
                        'user_id' => Auth::id(),
                        'notes' => "Purchase receipt: {$purchaseOrder->reference_number}",
                    ]);

                    $product->increment('stock_quantity', $receiveQty);
                }
            }

            if ($anyReceived) {
                $purchaseOrder->update(['status' => $allFullyReceived ? 'received' : 'partial']);
            }
        });

        return redirect()->route('purchase-orders.show', $purchaseOrder)
            ->with('success', 'Goods received successfully.');
    }

    public function print(PurchaseOrder $purchaseOrder): Response
    {
        $purchaseOrder->load('supplier', 'items.product', 'user:id,name');

        return Inertia::render('purchase-orders/print', [
            'purchaseOrder' => $purchaseOrder,
        ]);
    }

    public function destroy(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        if (! in_array($purchaseOrder->status, ['draft', 'cancelled'])) {
            return redirect()->back()->with('error', 'Only draft or cancelled orders can be deleted.');
        }

        $purchaseOrder->items()->delete();
        $purchaseOrder->delete();

        return redirect()->route('purchase-orders.index')
            ->with('success', 'Purchase order deleted.');
    }

    public function analytics(): JsonResponse
    {
        $month = now()->month;
        $year = now()->year;

        $stats = [
            'today' => PurchaseOrder::whereDate('created_at', now())->count(),
            'month' => PurchaseOrder::whereMonth('created_at', $month)->whereYear('created_at', $year)->count(),
            'month_value' => PurchaseOrder::whereMonth('created_at', $month)->whereYear('created_at', $year)->sum('total'),
            'year_value' => PurchaseOrder::whereYear('created_at', $year)->sum('total'),
            'avg_order' => PurchaseOrder::whereMonth('created_at', $month)->whereYear('created_at', $year)->avg('total') ?? 0,
            'top_supplier' => PurchaseOrder::select('supplier_id', DB::raw('COUNT(*) as total'), DB::raw('SUM(total) as value'))
                ->whereYear('created_at', $year)
                ->with('supplier:id,name')
                ->groupBy('supplier_id')
                ->orderByDesc('value')
                ->first(),
            'top_product' => PurchaseOrderItem::select('product_name', DB::raw('SUM(quantity_ordered) as total_qty'))
                ->whereYear('created_at', $year)
                ->groupBy('product_name')
                ->orderByDesc('total_qty')
                ->first(),
            'monthly_trend' => PurchaseOrder::select(
                DB::raw('MONTH(created_at) as month'),
                DB::raw('YEAR(created_at) as year'),
                DB::raw('SUM(total) as total')
            )->whereYear('created_at', $year)
                ->groupBy('year', 'month')
                ->orderBy('month')
                ->get(),
            'supplier_spending' => PurchaseOrder::select('supplier_id', DB::raw('SUM(total) as total'))
                ->whereYear('created_at', $year)
                ->with('supplier:id,name')
                ->groupBy('supplier_id')
                ->orderByDesc('total')
                ->limit(5)
                ->get(),
        ];

        return response()->json($stats);
    }

    public function productData(Request $request): JsonResponse
    {
        if ($request->id) {
            $product = Product::with('category:id,name')->find($request->id);
            if (! $product) {
                return response()->json(null);
            }

            return response()->json([
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'stock_quantity' => (float) $product->stock_quantity,
                'low_stock_threshold' => $product->low_stock_threshold,
                'cost_price' => (float) $product->cost_price,
                'selling_price' => (float) $product->selling_price,
                'category' => $product->category?->name,
            ]);
        }

        if ($request->search) {
            $products = Product::with('category:id,name')
                ->where('is_active', true)
                ->where(function ($q) use ($request) {
                    $s = $request->search;
                    $q->where('name', 'like', "%{$s}%")
                        ->orWhere('sku', 'like', "%{$s}%")
                        ->orWhere('barcode', 'like', "%{$s}%");
                })
                ->orderBy('name')
                ->limit(10)
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'sku' => $p->sku,
                    'stock_quantity' => (float) $p->stock_quantity,
                    'low_stock_threshold' => $p->low_stock_threshold,
                    'cost_price' => (float) $p->cost_price,
                    'selling_price' => (float) $p->selling_price,
                    'category' => $p->category?->name,
                ]);

            return response()->json($products);
        }

        return response()->json([]);
    }
}
