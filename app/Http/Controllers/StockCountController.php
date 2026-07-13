<?php

namespace App\Http\Controllers;

use App\Enums\InventoryMovementType;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\StockCount;
use App\Models\StockCountItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockCountController extends Controller
{
    public function index(Request $request)
    {
        $counts = StockCount::with('user:id,name', 'reconciledBy:id,name')
            ->when($request->search, fn ($q, $v) => $q->where('reference_number', 'like', "%{$v}%"))
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')
            ->paginate(15)->withQueryString();

        return Inertia::render('stock-counts/index', [
            'counts' => $counts,
            'filters' => $request->only(['search', 'status', 'sort', 'order']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:full,spot'],
            'notes' => ['nullable', 'string'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['exists:products,id'],
        ]);

        return DB::transaction(function () use ($validated) {
            $count = StockCount::create([
                'user_id' => auth()->id(),
                'type' => $validated['type'],
                'status' => 'draft',
                'notes' => $validated['notes'] ?? null,
            ]);

            if ($validated['type'] === 'full') {
                $products = Product::active()->orderBy('name')->get();
                foreach ($products as $product) {
                    StockCountItem::create([
                        'stock_count_id' => $count->id,
                        'product_id' => $product->id,
                        'expected_qty' => $product->stock_quantity,
                        'counted_qty' => null,
                        'difference_qty' => 0,
                    ]);
                }
            } elseif ($validated['type'] === 'spot' && ! empty($validated['product_ids'])) {
                $products = Product::whereIn('id', $validated['product_ids'])->orderBy('name')->get();
                foreach ($products as $product) {
                    StockCountItem::create([
                        'stock_count_id' => $count->id,
                        'product_id' => $product->id,
                        'expected_qty' => $product->stock_quantity,
                        'counted_qty' => null,
                        'difference_qty' => 0,
                    ]);
                }
            }

            return redirect()->route('stock-counts.show', $count->id)
                ->with('success', 'Stock count created. Start counting!');
        });
    }

    public function show(StockCount $stockCount)
    {
        $stockCount->load(['user:id,name', 'reconciledBy:id,name', 'items.product' => function ($q) {
            $q->select('id', 'name', 'sku');
        }]);

        $reconcilerName = $stockCount->reconciledBy?->name;

        return Inertia::render('stock-counts/show', [
            'count' => $stockCount,
            'reconcilerName' => $reconcilerName,
        ]);
    }

    public function startCounting(Request $request, StockCount $stockCount)
    {
        if ($stockCount->status !== 'draft') {
            return redirect()->back()->with('error', 'Count can only be started from Draft status.');
        }

        $stockCount->update(['status' => 'counting']);

        return redirect()->route('stock-counts.show', $stockCount->id)
            ->with('success', 'Counting started. Enter quantities below.');
    }

    public function saveProgress(Request $request, StockCount $stockCount)
    {
        if (! in_array($stockCount->status, ['draft', 'counting'])) {
            return redirect()->back()->with('error', 'Cannot save progress at this stage.');
        }

        $items = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'exists:stock_count_items,id'],
            'items.*.counted_qty' => ['nullable', 'numeric', 'min:0'],
        ]);

        foreach ($items['items'] as $item) {
            $stockItem = StockCountItem::find($item['id']);
            $countedQty = $item['counted_qty'];
            $diff = $countedQty !== null ? $countedQty - $stockItem->expected_qty : 0;
            $stockItem->update([
                'counted_qty' => $countedQty,
                'difference_qty' => $diff,
            ]);
        }

        if ($stockCount->status === 'draft') {
            $stockCount->update([
                'status' => 'counting',
                'counted_at' => now(),
            ]);
        }

        return redirect()->back()->with('success', 'Progress saved.');
    }

    public function reconcile(StockCount $stockCount)
    {
        if ($stockCount->status !== 'counting') {
            return redirect()->back()->with('error', 'Only counts in Counting status can be reconciled.');
        }

        return DB::transaction(function () use ($stockCount) {
            $stockCount->load('items.product');
            $adjustments = 0;

            foreach ($stockCount->items as $item) {
                if ($item->counted_qty === null) {
                    continue;
                }

                $product = $item->product;
                $newQty = (float) $item->counted_qty;
                $oldQty = (float) $product->stock_quantity;
                $diff = $newQty - $oldQty;

                if ($diff != 0) {
                    $product->update(['stock_quantity' => $newQty]);

                    InventoryMovement::create([
                        'product_id' => $product->id,
                        'type' => InventoryMovementType::Adjustment->value,
                        'quantity' => $diff,
                        'quantity_before' => $oldQty,
                        'quantity_after' => $newQty,
                        'unit_cost' => $product->cost_price,
                        'reference_type' => 'stock_count',
                        'reference_id' => $stockCount->id,
                        'user_id' => auth()->id(),
                        'notes' => "Stock count {$stockCount->reference_number}: {$oldQty} -> {$newQty}",
                    ]);

                    $adjustments++;
                }
            }

            $stockCount->update([
                'status' => 'reconciled',
                'reconciled_at' => now(),
                'reconciled_by' => auth()->id(),
            ]);

            return redirect()->route('stock-counts.show', $stockCount->id)
                ->with('success', "Stock count reconciled. {$adjustments} products adjusted.");
        });
    }

    public function destroy(StockCount $stockCount)
    {
        if ($stockCount->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft counts can be deleted.');
        }

        $stockCount->delete();

        return redirect()->route('stock-counts.index')->with('success', 'Stock count deleted.');
    }
}
