<?php

namespace App\Services\Assistant;

use App\Models\Customer;

class CustomerAssistantService
{
    public function getTopCustomers(int $limit = 5): mixed
    {
        return Customer::orderByDesc('total_purchases')->limit($limit)->get(['name', 'total_purchases', 'visit_count']);
    }

    public function getCustomerCount(): int
    {
        return Customer::where('is_active', true)->count();
    }

    public function getRecentCustomers(int $limit = 5): mixed
    {
        return Customer::latest()->limit($limit)->get(['name', 'email', 'phone', 'created_at']);
    }
}
