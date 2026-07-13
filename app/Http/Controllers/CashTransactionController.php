<?php

namespace App\Http\Controllers;

use App\Models\CashTransaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CashTransactionController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'shift_id' => ['nullable', 'exists:shifts,id'],
            'type' => ['required', 'string', 'in:cash_in,cash_out,petty_cash'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'category' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['user_id'] = auth()->id();

        CashTransaction::create($validated);

        return redirect()->back()
            ->with('success', 'Cash transaction recorded successfully.');
    }
}
