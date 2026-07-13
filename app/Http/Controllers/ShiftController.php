<?php

namespace App\Http\Controllers;

use App\Models\HeldTransaction;
use App\Models\Shift;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function index(Request $request): Response
    {
        $shifts = Shift::with('user:id,name')
            ->when($request->search, fn ($q, $v) => $q->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$v}%")))
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('shifts/index', [
            'shifts' => $shifts,
            'filters' => $request->only(['search', 'status', 'sort', 'order']),
        ]);
    }

    public function open(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'opening_balance' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        Shift::create([
            'user_id' => auth()->id(),
            'opened_at' => now(),
            'opening_balance' => $validated['opening_balance'],
            'status' => 'open',
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->back()
            ->with('success', 'Shift opened successfully.');
    }

    public function close(Request $request, Shift $shift): RedirectResponse
    {
        $validated = $request->validate([
            'closing_balance' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $shift->update([
            'closed_at' => now(),
            'closing_balance' => $validated['closing_balance'],
            'notes' => $validated['notes'] ?? $shift->notes,
            'status' => 'closed',
        ]);

        HeldTransaction::where('user_id', $shift->user_id)
            ->where('created_at', '>=', $shift->opened_at)
            ->delete();

        return redirect()->back()
            ->with('success', 'Shift closed successfully.');
    }
}
