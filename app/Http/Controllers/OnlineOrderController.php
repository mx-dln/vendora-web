<?php

namespace App\Http\Controllers;

use App\Models\OnlineOrder;
use App\Models\StoreSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnlineOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $query = OnlineOrder::query();

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($orderType = $request->string('order_type')->toString()) {
            $query->where('order_type', $orderType);
        }

        $direction = $request->string('order')->toString() === 'asc' ? 'asc' : 'desc';
        $sort = match ($request->string('sort')->toString()) {
            'reference_number' => ['reference_number', $direction],
            'customer_name' => ['customer_name', $direction],
            'total' => ['total', $direction],
            'status' => ['status', $direction],
            default => ['created_at', 'desc'],
        };

        $orders = $query
            ->orderBy($sort[0], $sort[1])
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('online-orders/index', [
            'orders' => $orders,
            'filters' => $request->only(['search', 'status', 'order_type', 'sort', 'order']),
            'onlineOrderingEnabled' => $this->settingEnabled('online_ordering_enabled', false),
        ]);
    }

    public function update(Request $request, OnlineOrder $onlineOrder): RedirectResponse
    {
        $validated = $request->validate([
            'order_type' => ['required', 'string', 'in:delivery,pickup'],
            'status' => ['required', 'string', 'in:pending,confirmed,preparing,ready,out_for_delivery,completed,cancelled'],
            'payment_status' => ['required', 'string', 'in:unpaid,paid,refunded'],
        ]);

        $validated['fulfilled_at'] = in_array($validated['status'], ['completed', 'cancelled'], true)
            ? now()
            : null;

        $onlineOrder->update($validated);

        return redirect()->back()->with('success', 'Online order updated.');
    }

    private function settingEnabled(string $key, bool $default): bool
    {
        $value = StoreSetting::getValue($key, $default ? '1' : '0');

        return in_array($value, ['1', 1, true, 'true', 'on'], true);
    }
}
