<?php

namespace App\Services\Assistant;

use App\Enums\TransactionStatus;
use App\Models\Transaction;
use App\Models\TransactionItem;

class SalesAssistantService
{
    public function getSalesOverview(string $period = 'today'): array
    {
        $query = Transaction::where('status', TransactionStatus::Completed->value);
        $itemsQuery = TransactionItem::whereHas('transaction', fn ($q) => $q->where('status', TransactionStatus::Completed->value));

        if ($period === 'today') {
            $query->whereDate('created_at', now());
            $itemsQuery->whereHas('transaction', fn ($q) => $q->whereDate('created_at', now()));
        } elseif ($period === 'week') {
            $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
            $itemsQuery->whereHas('transaction', fn ($q) => $q->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]));
        } elseif ($period === 'month') {
            $query->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year);
            $itemsQuery->whereHas('transaction', fn ($q) => $q->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year));
        }

        $totalSales = (float) $query->sum('total');
        $transactionCount = $query->count();

        $averageSale = $transactionCount > 0 ? round($totalSales / $transactionCount, 2) : null;

        $bestSeller = null;
        if ($transactionCount > 0) {
            $top = $itemsQuery
                ->select('product_name', \DB::raw('SUM(quantity) as total_qty'))
                ->groupBy('product_name')
                ->orderByDesc('total_qty')
                ->limit(1)
                ->first();
            $bestSeller = $top?->product_name;
        }

        return [
            'period' => $period,
            'total_sales' => $totalSales,
            'transaction_count' => $transactionCount,
            'average_sale' => $averageSale,
            'best_seller' => $bestSeller,
        ];
    }

    public function getTopProducts(int $limit = 5): mixed
    {
        return TransactionItem::select('product_name',
            \DB::raw('SUM(quantity) as total_qty'),
            \DB::raw('SUM(total) as total_revenue'))
            ->whereHas('transaction', fn ($q) => $q->where('status', TransactionStatus::Completed->value))
            ->groupBy('product_name')->orderByDesc('total_qty')->limit($limit)->get();
    }

    public function getTopProductsToday(int $limit = 5): mixed
    {
        return TransactionItem::select('product_name',
            \DB::raw('SUM(quantity) as total_qty'),
            \DB::raw('SUM(total) as total_revenue'))
            ->whereHas('transaction', fn ($q) => $q->where('status', TransactionStatus::Completed->value)
            ->whereDate('created_at', now()))
            ->groupBy('product_name')->orderByDesc('total_qty')->limit($limit)->get();
    }
}
