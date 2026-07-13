<?php

use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use App\Services\Assistant\SalesAssistantService;

beforeEach(function () {
    $this->service = app(SalesAssistantService::class);
    $this->user = User::factory()->create();
});

it('returns zero sales and null averages when no sales today', function () {
    $result = $this->service->getSalesOverview('today');

    expect($result['total_sales'])->toBe(0.0);
    expect($result['transaction_count'])->toBe(0);
    expect($result['average_sale'])->toBeNull();
    expect($result['best_seller'])->toBeNull();
    expect($result['period'])->toBe('today');
});

it('returns consistent metrics for a single sale today', function () {
    $transaction = Transaction::factory()->create([
        'user_id' => $this->user->id,
        'total' => 500.00,
        'status' => 'completed',
        'created_at' => now(),
    ]);

    TransactionItem::factory()->create([
        'transaction_id' => $transaction->id,
        'product_name' => 'Coke 1.5L',
        'quantity' => 2,
        'unit_price' => 250.00,
        'total' => 500.00,
    ]);

    $result = $this->service->getSalesOverview('today');

    expect($result['total_sales'])->toBe(500.00);
    expect($result['transaction_count'])->toBe(1);
    expect($result['average_sale'])->toBe(500.00);
    expect($result['best_seller'])->toBe('Coke 1.5L');
    expect($result['total_sales'] / $result['transaction_count'])->toBe($result['average_sale']);
});

it('returns consistent metrics for multiple sales today', function () {
    $t1 = Transaction::factory()->create([
        'user_id' => $this->user->id,
        'total' => 300.00,
        'status' => 'completed',
        'created_at' => now(),
    ]);
    TransactionItem::factory()->create([
        'transaction_id' => $t1->id,
        'product_name' => 'Marlboro Red',
        'quantity' => 3,
        'unit_price' => 100.00,
        'total' => 300.00,
    ]);

    $t2 = Transaction::factory()->create([
        'user_id' => $this->user->id,
        'total' => 700.00,
        'status' => 'completed',
        'created_at' => now(),
    ]);
    TransactionItem::factory()->create([
        'transaction_id' => $t2->id,
        'product_name' => 'Coke 1.5L',
        'quantity' => 5,
        'unit_price' => 140.00,
        'total' => 700.00,
    ]);

    $result = $this->service->getSalesOverview('today');

    expect($result['transaction_count'])->toBe(2);
    expect($result['total_sales'])->toBe(1000.00);
    expect($result['average_sale'])->toBe(500.00);
    expect($result['total_sales'] / $result['transaction_count'])->toBe($result['average_sale']);
});

it('returns consistent metrics for this week', function () {
    Transaction::factory()->create([
        'user_id' => $this->user->id,
        'total' => 250.00,
        'status' => 'completed',
        'created_at' => now()->startOfWeek(),
    ]);
    Transaction::factory()->create([
        'user_id' => $this->user->id,
        'total' => 350.00,
        'status' => 'completed',
        'created_at' => now(),
    ]);

    $result = $this->service->getSalesOverview('week');

    expect($result['transaction_count'])->toBe(2);
    expect($result['total_sales'])->toBe(600.00);
    expect($result['average_sale'])->toBe(300.00);
    expect($result['total_sales'] / $result['transaction_count'])->toBe($result['average_sale']);
    expect($result['period'])->toBe('week');
});

it('returns consistent metrics for this month', function () {
    Transaction::factory()->create([
        'user_id' => $this->user->id,
        'total' => 1000.00,
        'status' => 'completed',
        'created_at' => now()->startOfMonth(),
    ]);
    Transaction::factory()->create([
        'user_id' => $this->user->id,
        'total' => 2000.00,
        'status' => 'completed',
        'created_at' => now(),
    ]);

    $result = $this->service->getSalesOverview('month');

    expect($result['transaction_count'])->toBe(2);
    expect($result['total_sales'])->toBe(3000.00);
    expect($result['average_sale'])->toBe(1500.00);
    expect($result['total_sales'] / $result['transaction_count'])->toBe($result['average_sale']);
    expect($result['period'])->toBe('month');
});

it('excludes voided transactions', function () {
    Transaction::factory()->create([
        'user_id' => $this->user->id,
        'total' => 500.00,
        'status' => 'completed',
        'created_at' => now(),
    ]);
    Transaction::factory()->voided()->create([
        'user_id' => $this->user->id,
        'total' => 1000.00,
        'status' => 'voided',
        'created_at' => now(),
    ]);

    $result = $this->service->getSalesOverview('today');

    expect($result['transaction_count'])->toBe(1);
    expect($result['total_sales'])->toBe(500.00);
    expect($result['average_sale'])->toBe(500.00);
});
