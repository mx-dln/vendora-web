<?php

namespace App\Http\Controllers;

use App\Enums\TransactionStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(
        protected ReportService $reportService,
    ) {}

    public function profitLoss(Request $request): Response
    {
        $startDate = $request->start_date ?: now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?: now()->toDateString();
        $report = $this->reportService->profitAndLoss($startDate, $endDate);

        return Inertia::render('reports/profit-loss', [
            'report' => $report,
            'filters' => $request->only(['start_date', 'end_date']),
        ]);
    }

    public function productPerformance(Request $request): Response
    {
        $startDate = $request->start_date ?: now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?: now()->toDateString();
        $products = $this->reportService->productPerformance($startDate, $endDate);

        return Inertia::render('reports/product-performance', [
            'products' => $products,
            'filters' => $request->only(['start_date', 'end_date']),
        ]);
    }

    public function categoryPerformance(Request $request): Response
    {
        $startDate = $request->start_date ?: now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?: now()->toDateString();
        $categories = $this->reportService->categoryPerformance($startDate, $endDate);

        return Inertia::render('reports/category-performance', [
            'categories' => $categories,
            'filters' => $request->only(['start_date', 'end_date']),
        ]);
    }

    public function cashierPerformance(Request $request): Response
    {
        $startDate = $request->start_date ?: now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?: now()->toDateString();
        $cashiers = $this->reportService->cashierPerformance($startDate, $endDate);

        return Inertia::render('reports/cashier-performance', [
            'cashiers' => $cashiers,
            'filters' => $request->only(['start_date', 'end_date']),
        ]);
    }

    public function sales(Request $request): Response
    {
        $date = $request->date ?: now()->toDateString();
        $daily = $this->reportService->dailySales($date);

        $month = $request->month ?: now()->month;
        $year = $request->year ?: now()->year;
        $monthly = $this->reportService->monthlySales($year, $month);

        $prevMonth = $this->reportService->monthlySales($month === 1 ? 12 : $month - 1, $month === 1 ? $year - 1 : $year);

        $growthRate = $prevMonth['total_sales'] > 0
            ? round((($monthly['total_sales'] - $prevMonth['total_sales']) / $prevMonth['total_sales']) * 100, 1)
            : 0;

        $todayProfit = TransactionItem::whereHas('transaction', fn ($q) => $q->where('status', TransactionStatus::Completed->value)->whereDate('created_at', now()))
            ->select(DB::raw('SUM((unit_price - cost_price) * quantity) as profit'))
            ->value('profit') ?? 0;

        $recentTransactions = Transaction::with('user', 'customer', 'items')
            ->where('status', TransactionStatus::Completed->value)
            ->latest()
            ->take(8)
            ->get();

        $bestHour = Transaction::where('status', TransactionStatus::Completed->value)
            ->whereDate('created_at', $date)
            ->select(DB::raw('HOUR(created_at) as hour'), DB::raw('COUNT(*) as total'), DB::raw('SUM(total) as revenue'))
            ->groupBy('hour')
            ->orderByDesc('total')
            ->first();

        $bestDay = Transaction::where('status', TransactionStatus::Completed->value)
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->select(DB::raw('DAYNAME(created_at) as day'), DB::raw('SUM(total) as revenue'), DB::raw('COUNT(*) as transactions'))
            ->groupBy('day')
            ->orderByDesc('revenue')
            ->first();

        $topCashiers = Transaction::select(
            'user_id',
            DB::raw('COUNT(*) as total_transactions'),
            DB::raw('SUM(total) as total_sales'),
            DB::raw('AVG(total) as average_sale')
        )
            ->where('status', TransactionStatus::Completed->value)
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->with('user:id,name,avatar')
            ->groupBy('user_id')
            ->orderByDesc('total_sales')
            ->take(5)
            ->get();

        return Inertia::render('reports/sales', [
            'daily' => $daily,
            'monthly' => $monthly,
            'prevMonthly' => $prevMonth,
            'growthRate' => $growthRate,
            'todayProfit' => $todayProfit,
            'recentTransactions' => $recentTransactions,
            'bestHour' => $bestHour,
            'bestDay' => $bestDay,
            'topCashiers' => $topCashiers,
            'filters' => $request->only(['date', 'month', 'year']),
        ]);
    }

    public function products(Request $request): Response
    {
        $topProducts = $this->reportService->topSellingProducts(50);

        $startDate = $request->start_date ?: now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?: now()->toDateString();

        $totalSold = (int) TransactionItem::whereHas('transaction', fn ($q) => $q->where('status', TransactionStatus::Completed->value)
            ->whereBetween('created_at', [$startDate, $endDate]))
            ->sum('quantity');

        $totalRevenue = TransactionItem::whereHas('transaction', fn ($q) => $q->where('status', TransactionStatus::Completed->value)
            ->whereBetween('created_at', [$startDate, $endDate]))
            ->sum('total');

        $totalCost = TransactionItem::whereHas('transaction', fn ($q) => $q->where('status', TransactionStatus::Completed->value)
            ->whereBetween('created_at', [$startDate, $endDate]))
            ->select(DB::raw('SUM(quantity * cost_price) as total_cost'))
            ->value('total_cost') ?? 0;

        $categoryPerformance = TransactionItem::join('products', 'transaction_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->whereHas('transaction', fn ($q) => $q->where('status', TransactionStatus::Completed->value)
                ->whereBetween('created_at', [$startDate, $endDate]))
            ->select('categories.name', DB::raw('ROUND(SUM(transaction_items.quantity)) as total_qty'), DB::raw('SUM(transaction_items.total) as total_revenue'))
            ->groupBy('categories.name')
            ->orderByDesc('total_revenue')
            ->get();

        return Inertia::render('reports/products', [
            'topProducts' => $topProducts,
            'totalSold' => $totalSold,
            'totalRevenue' => $totalRevenue,
            'totalProfit' => $totalRevenue - $totalCost,
            'categoryPerformance' => $categoryPerformance,
            'filters' => $request->only(['start_date', 'end_date']),
        ]);
    }

    public function inventory(): Response
    {
        $report = $this->reportService->inventoryReport();

        $lowStockProducts = Product::active()->where('track_inventory', true)
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->where('stock_quantity', '>', 0)
            ->orderBy('stock_quantity')
            ->take(20)
            ->get();

        $outOfStockProducts = Product::active()->where('track_inventory', true)
            ->where('stock_quantity', '<=', 0)
            ->orderBy('name')
            ->take(20)
            ->get();

        $categoryBreakdown = Category::withCount(['products' => fn ($q) => $q->active()])
            ->withCount(['products as stock_value' => fn ($q) => $q->select(DB::raw('COALESCE(SUM(stock_quantity * cost_price), 0)'))])
            ->active()
            ->orderBy('name')
            ->get();

        $overstockProducts = Product::active()->where('track_inventory', true)
            ->where('stock_quantity', '>', 100)
            ->whereColumn('stock_quantity', '>', DB::raw('low_stock_threshold * 10'))
            ->orderByDesc('stock_quantity')
            ->take(10)
            ->get();

        return Inertia::render('reports/inventory', [
            'report' => $report,
            'lowStockProducts' => $lowStockProducts,
            'outOfStockProducts' => $outOfStockProducts,
            'categoryBreakdown' => $categoryBreakdown,
            'overstockProducts' => $overstockProducts,
        ]);
    }
}
