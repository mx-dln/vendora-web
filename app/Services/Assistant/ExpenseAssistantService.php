<?php

namespace App\Services\Assistant;

use App\Models\Expense;

class ExpenseAssistantService
{
    public function getExpensesToday(): float
    {
        return Expense::whereDate('expense_date', now())->sum('amount');
    }

    public function getExpensesThisMonth(): array
    {
        $total = Expense::whereMonth('expense_date', now()->month)->whereYear('expense_date', now()->year)->sum('amount');
        $count = Expense::whereMonth('expense_date', now()->month)->whereYear('expense_date', now()->year)->count();

        return ['total' => $total, 'count' => $count];
    }

    public function getLargestExpense(): mixed
    {
        return Expense::orderByDesc('amount')->first();
    }

    public function getExpenseBreakdown(): mixed
    {
        return \DB::table('expenses')
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->select('expense_categories.name', \DB::raw('SUM(expenses.amount) as total'), \DB::raw('COUNT(*) as count'))
            ->groupBy('expense_categories.name')
            ->orderByDesc('total')
            ->get();
    }
}
