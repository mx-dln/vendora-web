<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSupplierRequest;
use App\Models\Supplier;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $suppliers = Supplier::when($request->search, fn ($q, $v) => $q->where(function ($q) use ($v) {
            $q->where('name', 'like', "%{$v}%")
                ->orWhere('email', 'like', "%{$v}%")
                ->orWhere('phone', 'like', "%{$v}%");
        }))
            ->orderBy($request->sort ?? 'name', $request->order ?? 'asc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('suppliers/index', [
            'suppliers' => $suppliers,
            'filters' => $request->only(['search', 'sort', 'order']),
        ]);
    }

    public function store(StoreSupplierRequest $request): RedirectResponse
    {
        $supplier = Supplier::create($request->validated());
        AuditService::log('created', 'supplier', $supplier, null, $supplier->toArray(), "Created supplier: {$supplier->name}");

        return redirect()->route('suppliers.index')
            ->with('success', 'Supplier created successfully.');
    }

    public function update(StoreSupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $supplier->update($request->validated());
        AuditService::log('updated', 'supplier', $supplier, null, $supplier->fresh()->toArray(), "Updated supplier: {$supplier->name}");

        return redirect()->route('suppliers.index')
            ->with('success', 'Supplier updated successfully.');
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        AuditService::log('deleted', 'supplier', $supplier, $supplier->toArray(), null, "Deleted supplier: {$supplier->name}");
        $supplier->delete();

        return redirect()->route('suppliers.index')
            ->with('success', 'Supplier deleted successfully.');
    }
}
