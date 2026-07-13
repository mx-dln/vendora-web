<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(Request $request): Response
    {
        $expenses = Expense::with('category', 'user')
            ->when($request->search, fn ($q, $v) => $q->where('description', 'like', "%{$v}%"))
            ->when($request->category_id, fn ($q, $v) => $q->where('expense_category_id', $v))
            ->when($request->date_from, fn ($q, $v) => $q->whereDate('expense_date', '>=', $v))
            ->when($request->date_to, fn ($q, $v) => $q->whereDate('expense_date', '<=', $v))
            ->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')
            ->paginate(15)
            ->withQueryString();

        $totalExpenses = Expense::sum('amount');
        $thisMonth = Expense::whereMonth('expense_date', now()->month)
            ->whereYear('expense_date', now()->year)
            ->sum('amount');
        $todayExpenses = Expense::whereDate('expense_date', now())->sum('amount');
        $totalCount = Expense::count();
        $avgDaily = $totalCount > 0 ? round($totalExpenses / max($totalCount, 1), 2) : 0;

        $categoryBreakdown = ExpenseCategory::withCount(['expenses' => fn ($q) => $q->select(DB::raw('COALESCE(SUM(amount), 0)'))])
            ->withCount(['expenses as expense_count' => fn ($q) => $q->select(DB::raw('COUNT(*)'))])
            ->active()
            ->get()
            ->map(fn ($c) => [
                'name' => $c->name,
                'total' => (float) ($c->expenses_count ?? 0),
                'count' => $c->expense_count,
                'percentage' => $totalExpenses > 0 ? round(($c->expenses_count / $totalExpenses) * 100, 1) : 0,
            ]);

        $monthlyTrend = collect(range(1, 12))->map(function ($month) {
            $total = Expense::whereYear('expense_date', now()->year)
                ->whereMonth('expense_date', $month)
                ->sum('amount');

            return [
                'month' => now()->month($month)->format('M'),
                'total' => (float) $total,
            ];
        });

        $paymentMethodBreakdown = Expense::select('payment_method',
            DB::raw('COUNT(*) as count'),
            DB::raw('COALESCE(SUM(amount), 0) as total'))
            ->groupBy('payment_method')
            ->get();

        $topCategories = ExpenseCategory::withCount(['expenses as total' => fn ($q) => $q->select(DB::raw('COALESCE(SUM(amount), 0)'))])
            ->active()
            ->orderByDesc('total')
            ->take(5)
            ->get()
            ->map(fn ($c) => [
                'name' => $c->name,
                'total' => (float) ($c->total ?? 0),
                'percentage' => $totalExpenses > 0 ? round(($c->total / $totalExpenses) * 100, 1) : 0,
            ]);

        $thisMonthCount = Expense::whereMonth('expense_date', now()->month)
            ->whereYear('expense_date', now()->year)
            ->count();

        $largestExpense = Expense::orderByDesc('amount')->first();
        $avgPerTransaction = $thisMonthCount > 0 ? round($thisMonth / $thisMonthCount, 2) : 0;

        $topCategoryThisMonth = ExpenseCategory::withCount(['expenses as total' => fn ($q) => $q->whereMonth('expense_date', now()->month)
            ->whereYear('expense_date', now()->year)
            ->select(DB::raw('COALESCE(SUM(amount), 0)'))])
            ->active()
            ->orderByDesc('total')
            ->first();

        return Inertia::render('expenses/index', [
            'expenses' => $expenses,
            'categories' => ExpenseCategory::active()->orderBy('name')->get(),
            'filters' => $request->only(['search', 'category_id', 'date_from', 'date_to', 'sort', 'order']),
            'stats' => [
                'total_expenses' => $totalExpenses,
                'this_month' => $thisMonth,
                'today' => $todayExpenses,
                'avg_daily' => $avgDaily,
                'total_count' => $totalCount,
            ],
            'categoryBreakdown' => $categoryBreakdown,
            'monthlyTrend' => $monthlyTrend,
            'paymentMethodBreakdown' => $paymentMethodBreakdown,
            'topCategories' => $topCategories,
            'insights' => [
                'top_category' => $topCategoryThisMonth?->name ?? 'N/A',
                'largest_expense' => $largestExpense?->amount ?? 0,
                'largest_desc' => $largestExpense?->description ?? 'N/A',
                'this_month_count' => $thisMonthCount,
                'avg_per_transaction' => $avgPerTransaction,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'expense_category_id' => ['nullable', 'exists:expense_categories,id'],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date'],
            'payment_method' => ['required', 'string'],
            'reference_number' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['user_id'] = auth()->id();
        Expense::create($validated);

        return redirect()->back()->with('success', 'Expense recorded successfully.');
    }

    public function update(Request $request, Expense $expense): RedirectResponse
    {
        $validated = $request->validate([
            'expense_category_id' => ['nullable', 'exists:expense_categories,id'],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date'],
            'payment_method' => ['required', 'string'],
            'reference_number' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $expense->update($validated);

        return redirect()->back()->with('success', 'Expense updated successfully.');
    }

    public function destroy(Expense $expense): RedirectResponse
    {
        $expense->delete();

        return redirect()->back()->with('success', 'Expense deleted successfully.');
    }
}
