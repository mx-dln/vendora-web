<?php

namespace App\Http\Controllers;

use App\Enums\TransactionStatus;
use App\Models\Customer;
use App\Models\PurchaseOrder;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Services\InventoryService;
use App\Services\ReportService;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected ReportService $reportService,
        protected InventoryService $inventoryService,
    ) {}

    public function index(): Response
    {
        $todaySales = $this->reportService->dailySales(now()->toDateString());

        $todayProfit = TransactionItem::whereHas('transaction', fn ($q) => $q->where('status', TransactionStatus::Completed->value)->whereDate('created_at', now()))
            ->select(DB::raw('SUM((unit_price - cost_price) * quantity) as profit'))
            ->value('profit') ?? 0;

        $recentTransactions = Transaction::with('user', 'customer')
            ->where('status', TransactionStatus::Completed->value)
            ->latest()
            ->take(10)
            ->get();

        $lowStock = $this->inventoryService->getLowStockProducts();

        $topProductsToday = TransactionItem::whereHas('transaction', fn ($q) => $q->where('status', TransactionStatus::Completed->value)->whereDate('created_at', now()))
            ->select('product_name', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(total) as total_revenue'))
            ->groupBy('product_name')
            ->orderByDesc('total_qty')
            ->take(5)
            ->get();

        $currentShift = Shift::where('user_id', auth()->id())->where('status', 'open')->latest()->first();

        $activeCustomersToday = Customer::whereHas('transactions', fn ($q) => $q->whereDate('created_at', now()))->count();

        // 7-day sparkline data
        $sparklineData = collect(range(6, 0))->map(function ($daysAgo) {
            $date = now()->subDays($daysAgo);
            $report = $this->reportService->dailySales($date->toDateString());

            return [
                'date' => $date->format('D'),
                'revenue' => $report['total_sales'],
            ];
        });

        $pendingPOs = PurchaseOrder::with('supplier')
            ->whereIn('status', ['draft', 'sent', 'partial'])
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('dashboard', [
            'stats' => [
                'today_sales' => $todaySales['total_sales'],
                'today_profit' => $todayProfit,
                'today_transactions' => $todaySales['total_transactions'],
                'today_items' => $todaySales['total_items'],
                'average_sale' => $todaySales['total_transactions'] > 0 ? round($todaySales['total_sales'] / $todaySales['total_transactions'], 2) : 0,
                'low_stock_count' => $lowStock->count(),
                'active_customers_today' => $activeCustomersToday,
            ],
            'sparkline_data' => $sparklineData,
            'top_products_today' => $topProductsToday,
            'recent_transactions' => $recentTransactions,
            'low_stock_products' => $lowStock,
            'current_shift' => $currentShift,
            'pending_purchase_orders' => $pendingPOs,
        ]);
    }
}
