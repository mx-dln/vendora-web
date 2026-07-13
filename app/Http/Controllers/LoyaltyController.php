<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\LoyaltyReward;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LoyaltyController extends Controller
{
    public function index()
    {
        return Inertia::render('loyalty/index', [
            'rewards' => LoyaltyReward::active()->get(),
            'topCustomers' => Customer::orderBy('loyalty_points', 'desc')->take(20)->get(['id', 'name', 'email', 'loyalty_points', 'loyalty_tier', 'total_purchases', 'visit_count']),
            'tierStats' => [
                'regular' => Customer::where('loyalty_tier', 'regular')->count(),
                'silver' => Customer::where('loyalty_tier', 'silver')->count(),
                'gold' => Customer::where('loyalty_tier', 'gold')->count(),
                'platinum' => Customer::where('loyalty_tier', 'platinum')->count(),
            ],
        ]);
    }

    public function storeReward(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'tier' => ['required', 'string', 'in:regular,silver,gold,platinum'],
            'points_required' => ['required', 'integer', 'min:1'],
            'reward_type' => ['required', 'string'],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'discount_type' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
        ]);

        LoyaltyReward::create($validated);

        return redirect()->back()->with('success', 'Loyalty reward created.');
    }

    public function customerHistory(Customer $customer)
    {
        $customer->load(['loyaltyPointsTransactions' => fn ($q) => $q->latest()->take(50)]);

        return Inertia::render('loyalty/customer', [
            'customer' => $customer,
        ]);
    }
}
