<?php

namespace App\Http\Controllers;

use App\Enums\TransactionStatus;
use App\Models\Customer;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdvancedAnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->date_from ?? now()->subMonth()->toDateString();
        $endDate = $request->date_to ?? now()->toDateString();

        $bestHours = Transaction::where('status', TransactionStatus::Completed->value)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(DB::raw('HOUR(created_at) as hour'), DB::raw('COUNT(*) as total'), DB::raw('SUM(total) as revenue'))
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        $bestDays = Transaction::where('status', TransactionStatus::Completed->value)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(DB::raw('DAYNAME(created_at) as day'), DB::raw('COUNT(*) as total'), DB::raw('SUM(total) as revenue'))
            ->groupBy('day')
            ->orderByDesc('total')
            ->get();

        $dailyRevenue = Transaction::where('status', TransactionStatus::Completed->value)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as revenue'), DB::raw('COUNT(*) as transactions'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $customerRetention = Customer::select(
            DB::raw("CASE WHEN visit_count = 1 THEN '1' WHEN visit_count <= 3 THEN '2-3' WHEN visit_count <= 10 THEN '4-10' ELSE '10+' END as frequency_group"),
            DB::raw('COUNT(*) as count')
        )->groupBy('frequency_group')->get();

        $ltv = Customer::select(
            DB::raw('AVG(total_purchases) as average_ltv'),
            DB::raw('AVG(visit_count) as average_visits'),
            DB::raw('AVG(total_purchases / NULLIF(visit_count, 0)) as average_order_value')
        )->first();

        return Inertia::render('reports/analytics', [
            'bestHours' => $bestHours,
            'bestDays' => $bestDays,
            'dailyRevenue' => $dailyRevenue,
            'customerRetention' => $customerRetention,
            'ltv' => $ltv,
            'filters' => $request->only(['date_from', 'date_to']),
        ]);
    }
}
