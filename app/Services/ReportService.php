<?php

namespace App\Services;

use App\Enums\TransactionStatus;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function profitAndLoss(string $startDate, string $endDate): array
    {
        $sales = Transaction::where('status', TransactionStatus::Completed->value)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('total');

        $costOfGoods = TransactionItem::whereHas('transaction', fn ($q) => $q->where('status', TransactionStatus::Completed->value)
            ->whereBetween('created_at', [$startDate, $endDate]))
            ->select(DB::raw('SUM(quantity * cost_price) as total_cost'))
            ->value('total_cost') ?? 0;

        $expenses = Expense::whereBetween('expense_date', [$startDate, $endDate])->sum('amount');

        $grossProfit = $sales - $costOfGoods;
        $netProfit = $grossProfit - $expenses;

        return [
            'total_sales' => $sales,
            'cost_of_goods_sold' => $costOfGoods,
            'gross_profit' => $grossProfit,
            'gross_margin' => $sales > 0 ? round(($grossProfit / $sales) * 100, 2) : 0,
            'total_expenses' => $expenses,
            'net_profit' => $netProfit,
            'net_margin' => $sales > 0 ? round(($netProfit / $sales) * 100, 2) : 0,
        ];
    }

    public function productPerformance(string $startDate, string $endDate): mixed
    {
        return TransactionItem::select(
            'product_id', 'product_name',
            DB::raw('SUM(quantity) as total_quantity'),
            DB::raw('SUM(total) as total_revenue'),
            DB::raw('SUM(quantity * cost_price) as total_cost'),
            DB::raw('SUM(total) - SUM(quantity * cost_price) as total_profit')
        )
            ->whereHas('transaction', fn ($q) => $q->where('status', TransactionStatus::Completed->value)
                ->whereBetween('created_at', [$startDate, $endDate]))
            ->groupBy('product_id', 'product_name')
            ->orderByDesc('total_quantity')
            ->get();
    }

    public function categoryPerformance(string $startDate, string $endDate): mixed
    {
        return TransactionItem::select(
            'products.category_id',
            'categories.name as category_name',
            DB::raw('SUM(transaction_items.quantity) as total_quantity'),
            DB::raw('SUM(transaction_items.total) as total_revenue')
        )
            ->join('products', 'transaction_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->whereHas('transaction', fn ($q) => $q->where('status', TransactionStatus::Completed->value)
                ->whereBetween('created_at', [$startDate, $endDate]))
            ->groupBy('products.category_id', 'categories.name')
            ->orderByDesc('total_revenue')
            ->get();
    }

    public function cashierPerformance(string $startDate, string $endDate): mixed
    {
        return Transaction::select(
            'user_id',
            DB::raw('COUNT(*) as total_transactions'),
            DB::raw('SUM(total) as total_sales'),
            DB::raw('AVG(total) as average_sale'),
            DB::raw('SUM(item_count) as total_items')
        )
            ->where('status', TransactionStatus::Completed->value)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->with('user:id,name')
            ->groupBy('user_id')
            ->orderByDesc('total_sales')
            ->get();
    }

    public function dailySales(?string $date = null): array
    {
        $date = $date ?: now()->toDateString();

        $transactions = Transaction::whereDate('created_at', $date)
            ->where('status', TransactionStatus::Completed->value)
            ->get();

        return [
            'date' => $date,
            'total_sales' => $transactions->sum('total'),
            'total_transactions' => $transactions->count(),
            'average_sale' => $transactions->avg('total') ?: 0,
            'total_items' => $transactions->sum('item_count'),
            'total_discounts' => $transactions->sum('discount_amount'),
            'total_tax' => $transactions->sum('tax_amount'),
            'payment_breakdown' => $transactions->groupBy('payment_method')
                ->map(fn ($t) => [
                    'count' => $t->count(),
                    'total' => $t->sum('total'),
                ]),
            'hourly_breakdown' => $transactions->groupBy(fn ($t) => $t->created_at->format('H'))
                ->map(fn ($t) => [
                    'hour' => $t->first()->created_at->format('g A'),
                    'count' => $t->count(),
                    'total' => $t->sum('total'),
                ])->sortKeys()->values(),
        ];
    }

    public function monthlySales(int $year, int $month): array
    {
        $transactions = Transaction::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->where('status', TransactionStatus::Completed->value)
            ->get();

        return [
            'year' => $year,
            'month' => $month,
            'total_sales' => $transactions->sum('total'),
            'total_transactions' => $transactions->count(),
            'average_sale' => $transactions->avg('total') ?: 0,
            'total_items' => $transactions->sum('item_count'),
            'total_discounts' => $transactions->sum('discount_amount'),
            'total_tax' => $transactions->sum('tax_amount'),
            'daily_breakdown' => $transactions->groupBy(fn ($t) => $t->created_at->format('Y-m-d'))
                ->map(fn ($t) => [
                    'date' => $t->first()->created_at->format('M d'),
                    'count' => $t->count(),
                    'total' => $t->sum('total'),
                ])->sortKeys()->values(),
        ];
    }

    public function topSellingProducts(int $limit = 10): mixed
    {
        return TransactionItem::select(
            'product_id',
            'product_name',
            DB::raw('SUM(quantity) as total_quantity'),
            DB::raw('SUM(total) as total_revenue')
        )
            ->whereHas('transaction', fn ($q) => $q->where('status', TransactionStatus::Completed->value))
            ->groupBy('product_id', 'product_name')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get();
    }

    public function inventoryReport(): array
    {
        $totalProducts = Product::count();
        $activeProducts = Product::active()->count();
        $lowStock = Product::active()->whereColumn('stock_quantity', '<=', 'low_stock_threshold')->where('stock_quantity', '>', 0)->count();
        $outOfStock = Product::active()->where('stock_quantity', '<=', 0)->count();
        $totalStockValue = Product::active()->select(DB::raw('SUM(stock_quantity * cost_price) as total_value'))->value('total_value') ?? 0;
        $totalRetailValue = Product::active()->select(DB::raw('SUM(stock_quantity * selling_price) as total_value'))->value('total_value') ?? 0;

        return [
            'total_products' => $totalProducts,
            'active_products' => $activeProducts,
            'low_stock' => $lowStock,
            'out_of_stock' => $outOfStock,
            'total_stock_value' => $totalStockValue,
            'total_retail_value' => $totalRetailValue,
        ];
    }
}
