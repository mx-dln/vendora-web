<?php

namespace App\Http\Controllers;

use App\Enums\InventoryMovementType;
use App\Http\Requests\VoidTransactionRequest;
use App\Models\InventoryMovement;
use App\Models\StoreSetting;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Services\AuditService;
use App\Services\PosService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function __construct(
        protected PosService $posService,
    ) {}

    public function index(Request $request): Response
    {
        $transactions = Transaction::with('user', 'customer', 'items')
            ->when($request->search, fn ($q, $v) => $q->where('reference_number', 'like', "%{$v}%"))
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->payment_method, fn ($q, $v) => $q->where('payment_method', $v))
            ->when($request->date_from, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($request->date_to, fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('sales/index', [
            'transactions' => $transactions,
            'filters' => $request->only(['search', 'status', 'payment_method', 'date_from', 'date_to', 'sort', 'order']),
        ]);
    }

    public function show(Transaction $transaction): Response
    {
        $transaction->load(['user', 'customer', 'items.voidedBy', 'payments', 'voidedBy', 'refundedBy']);

        return Inertia::render('sales/show', [
            'transaction' => $transaction,
        ]);
    }

    public function voidItem(Request $request, TransactionItem $transactionItem): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3'],
        ]);

        $password = (string) $request->input('password', '');
        if (! Hash::check($password, auth()->user()->password)) {
            return redirect()->back()->with('error', 'Invalid manager password. Void cancelled.');
        }

        $transaction = $transactionItem->transaction;

        if ($transaction->status !== 'completed') {
            return redirect()->back()->with('error', 'Can only void items from completed transactions.');
        }

        $alreadyVoided = (float) $transactionItem->voided_quantity;
        $remaining = (float) $transactionItem->quantity - $alreadyVoided;

        if ($remaining <= 0) {
            return redirect()->back()->with('error', 'Item already fully voided.');
        }

        DB::transaction(function () use ($transactionItem, $remaining, $validated, $transaction) {
            $transactionItem->update([
                'voided_quantity' => $transactionItem->voided_quantity + $remaining,
                'void_reason' => $validated['reason'],
                'voided_at' => now(),
                'voided_by' => auth()->id(),
            ]);

            $product = $transactionItem->product;
            if ($product && $product->track_inventory) {
                $product->increment('stock_quantity', $remaining);
            }

            InventoryMovement::create([
                'product_id' => $transactionItem->product_id,
                'type' => InventoryMovementType::Return->value,
                'quantity' => $remaining,
                'quantity_before' => $product?->stock_quantity ?? 0,
                'quantity_after' => $product ? ($product->fresh()->stock_quantity) : 0,
                'reference_type' => 'transaction_item',
                'reference_id' => $transactionItem->id,
                'user_id' => auth()->id(),
                'notes' => "Voided item: {$transactionItem->product_name} from {$transaction->reference_number}",
            ]);

            $itemVoidedTotal = ($transactionItem->unit_price * $remaining) - ($transactionItem->discount_amount / $transactionItem->quantity * $remaining);

            $transaction->decrement('total', $itemVoidedTotal);
            $transaction->decrement('item_count', $remaining);
        });

        AuditService::log('voided', 'sale_item', $transactionItem, null, null, "Item voided: {$transactionItem->product_name} from {$transaction->reference_number}");

        return redirect()->route('sales.show', $transaction->id)
            ->with('success', "{$transactionItem->product_name} voided successfully. Stock returned.");
    }

    public function void(VoidTransactionRequest $request, Transaction $transaction): RedirectResponse
    {
        $this->authorize('void', $transaction);

        $password = (string) $request->input('password', '');
        if (! Hash::check($password, auth()->user()->password)) {
            return redirect()->back()->with('error', 'Invalid manager password. Void cancelled.');
        }

        $transaction = $this->posService->voidTransaction($transaction, $request->validated()['reason']);
        AuditService::log('voided', 'sale', $transaction, null, null, "Transaction voided: {$transaction->reference_number}");

        return redirect()->route('sales.show', $transaction->id)
            ->with('success', 'Transaction voided successfully.');
    }

    public function receipt(Transaction $transaction): Response
    {
        $transaction->load(['user', 'customer', 'items.voidedBy', 'payments']);

        return Inertia::render('sales/receipt', [
            'transaction' => $transaction,
            'storeSettings' => StoreSetting::all()->pluck('value', 'key')->toArray(),
        ]);
    }
}
