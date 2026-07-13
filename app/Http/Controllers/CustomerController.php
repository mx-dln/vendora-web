<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerRequest;
use App\Models\Customer;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $customers = Customer::when($request->search, fn ($q, $v) => $q->where(function ($q) use ($v) {
            $q->where('name', 'like', "%{$v}%")
                ->orWhere('email', 'like', "%{$v}%")
                ->orWhere('phone', 'like', "%{$v}%");
        }))
            ->orderBy($request->sort ?? 'name', $request->order ?? 'asc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('customers/index', [
            'customers' => $customers,
            'filters' => $request->only(['search', 'sort', 'order']),
        ]);
    }

    public function store(StoreCustomerRequest $request): RedirectResponse
    {
        $customer = Customer::create($request->validated());
        AuditService::log('created', 'customer', $customer, null, $customer->toArray(), "Created customer: {$customer->name}");

        return redirect()->route('customers.index')
            ->with('success', 'Customer created successfully.');
    }

    public function show(Customer $customer): Response
    {
        $customer->load(['transactions' => function ($q) {
            $q->latest()->limit(20);
        }]);

        return Inertia::render('customers/show', [
            'customer' => $customer,
        ]);
    }

    public function update(StoreCustomerRequest $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->validated());
        AuditService::log('updated', 'customer', $customer, null, $customer->fresh()->toArray(), "Updated customer: {$customer->name}");

        return redirect()->route('customers.index')
            ->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        if ($customer->transactions()->count() > 0) {
            return redirect()->route('customers.index')
                ->with('error', 'Cannot delete customer with transaction history.');
        }

        AuditService::log('deleted', 'customer', $customer, $customer->toArray(), null, "Deleted customer: {$customer->name}");
        $customer->delete();

        return redirect()->route('customers.index')
            ->with('success', 'Customer deleted successfully.');
    }
}
