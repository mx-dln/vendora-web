<?php

namespace App\Http\Controllers;

use App\Http\Requests\InventoryMovementRequest;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService,
    ) {}

    public function index(Request $request): Response
    {
        $products = Product::with('category')
            ->when($request->search, fn ($q, $v) => $q->where(function ($q) use ($v) {
                $q->where('name', 'like', "%{$v}%")
                    ->orWhere('sku', 'like', "%{$v}%");
            }))
            ->when($request->status === 'low_stock', fn ($q) => $q->lowStock())
            ->when($request->status === 'out_of_stock', fn ($q) => $q->outOfStock())
            ->orderBy('stock_quantity', 'asc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('inventory/index', [
            'products' => $products,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function stockIn(InventoryMovementRequest $request, Product $product): RedirectResponse
    {
        $movement = $this->inventoryService->stockIn(
            $product,
            $request->validated()['quantity'],
            $request->validated()['unit_cost'] ?? null,
            $request->validated()['notes'] ?? null,
        );

        return redirect()->route('inventory.index')
            ->with('success', "Stock added: {$movement->quantity} units of {$product->name}");
    }

    public function stockOut(InventoryMovementRequest $request, Product $product): RedirectResponse
    {
        $movement = $this->inventoryService->stockOut(
            $product,
            $request->validated()['quantity'],
            $request->validated()['notes'] ?? null,
        );

        return redirect()->route('inventory.index')
            ->with('success', "Stock removed: {$movement->quantity} units of {$product->name}");
    }

    public function adjust(Request $request, Product $product): RedirectResponse
    {
        $data = $request->validate([
            'new_quantity' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $movement = $this->inventoryService->adjustStock(
            $product,
            $data['new_quantity'],
            $data['notes'] ?? null,
        );

        return redirect()->route('inventory.index')
            ->with('success', "Stock adjusted for {$product->name}: {$movement->quantity_before} → {$movement->quantity_after}");
    }

    public function history(Request $request, Product $product): Response
    {
        $movements = InventoryMovement::where('product_id', $product->id)
            ->with('user')
            ->latest()
            ->paginate(20);

        return Inertia::render('inventory/history', [
            'product' => $product,
            'movements' => $movements,
        ]);
    }

    public function printHistory(Request $request, Product $product): Response
    {
        $movements = InventoryMovement::where('product_id', $product->id)
            ->with('user')
            ->latest()
            ->get();

        return Inertia::render('inventory/print-history', [
            'product' => $product,
            'movements' => $movements,
        ]);
    }
}
