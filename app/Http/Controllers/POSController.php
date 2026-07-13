<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProcessTransactionRequest;
use App\Models\CashTransaction;
use App\Models\Category;
use App\Models\Customer;
use App\Models\HeldTransaction;
use App\Models\Product;
use App\Models\Shift;
use App\Models\StoreSetting;
use App\Models\Transaction;
use App\Services\AuditService;
use App\Services\PosService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class POSController extends Controller
{
    public function __construct(
        protected PosService $posService,
    ) {}

    public function index(): Response
    {
        $completedTransactionId = session('completed_transaction');
        $completedTransaction = null;
        if ($completedTransactionId) {
            $completedTransaction = Transaction::with(['items', 'payments', 'user', 'customer'])->find($completedTransactionId);
        }

        $resumeCart = session('resume_cart');
        $resumeCustomer = session('resume_customer');
        $resumeNotes = session('resume_notes');

        $products = Product::with('category', 'variants')
            ->active()
            ->orderBy('name')
            ->paginate(50);

        $categories = Category::active()
            ->withCount('products')
            ->orderBy('name')
            ->get();

        $customers = Customer::active()
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'email']);

        $heldTransactions = HeldTransaction::where('user_id', auth()->id())
            ->latest()
            ->get();

        $currentShift = Shift::where('user_id', auth()->id())->where('status', 'open')->latest()->first();

        if ($currentShift) {
            $heldTransactions = $heldTransactions->filter(fn ($h) => $h->created_at >= $currentShift->opened_at);

            $todaySales = Transaction::where('user_id', auth()->id())
                ->where('created_at', '>=', $currentShift->opened_at)
                ->where('status', 'completed')
                ->sum('total');

            $recentTransactions = Transaction::with('items', 'customer')
                ->where('user_id', auth()->id())
                ->where('created_at', '>=', $currentShift->opened_at)
                ->where('status', 'completed')
                ->latest()
                ->take(20)
                ->get();

            $cashIn = CashTransaction::where('user_id', auth()->id())
                ->where('created_at', '>=', $currentShift->opened_at)
                ->where('type', 'cash_in')
                ->sum('amount');

            $cashOut = CashTransaction::where('user_id', auth()->id())
                ->where('created_at', '>=', $currentShift->opened_at)
                ->where('type', 'cash_out')
                ->sum('amount');
        } else {
            $todaySales = 0;
            $heldTransactions = collect();
            $recentTransactions = collect();
            $cashIn = 0;
            $cashOut = 0;
        }

        return Inertia::render('pos/index', [
            'products' => $products,
            'categories' => $categories,
            'customers' => $customers,
            'heldTransactions' => $heldTransactions,
            'completedTransaction' => $completedTransaction,
            'storeSettings' => StoreSetting::all()->pluck('value', 'key')->toArray(),
            'resumeCart' => $resumeCart,
            'resumeCustomer' => $resumeCustomer,
            'resumeNotes' => $resumeNotes,
            'currentShift' => $currentShift,
            'todaySales' => $todaySales,
            'recentTransactions' => $recentTransactions,
            'cashIn' => $cashIn,
            'cashOut' => $cashOut,
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $products = $this->posService->searchProducts(
            $request->query('query', ''),
            $request->query('category_id'),
        );

        return response()->json($products);
    }

    public function processTransaction(ProcessTransactionRequest $request): RedirectResponse
    {
        try {
            $transaction = $this->posService->processTransaction($request->validated());
            AuditService::log('completed', 'pos', $transaction, null, ['total' => $transaction->total, 'items' => $transaction->item_count], "Sale completed: {$transaction->reference_number}");

            return redirect()->route('pos.index')
                ->with('success', 'Transaction completed successfully.')
                ->with('completed_transaction', $transaction->id);
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to process transaction: '.$e->getMessage());
        }
    }

    public function hold(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'cart_data' => ['required', 'array'],
            'customer_data' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
        ]);

        $this->posService->holdTransaction($data);
        AuditService::log('held', 'pos', null, null, null, 'Transaction held');

        return redirect()->back()->with('success', 'Transaction held successfully.');
    }

    public function resume(int $id): RedirectResponse
    {
        $heldTransaction = HeldTransaction::find($id);

        if (! $heldTransaction || $heldTransaction->user_id !== auth()->id()) {
            return redirect()->route('pos.index')
                ->with('error', 'Held transaction not found or already resumed.');
        }

        $cartData = $heldTransaction->cart_data;
        $customerData = $heldTransaction->customer_data;
        $notes = $heldTransaction->notes;

        $heldTransaction->delete();

        return redirect()->route('pos.index')
            ->with('resume_cart', $cartData)
            ->with('resume_customer', $customerData)
            ->with('resume_notes', $notes)
            ->with('success', 'Transaction resumed.');
    }

    public function destroyHeld(HeldTransaction $heldTransaction): RedirectResponse
    {
        if ($heldTransaction->user_id !== auth()->id()) {
            abort(403);
        }

        $heldTransaction->delete();

        return redirect()->back()
            ->with('success', 'Held transaction removed.');
    }
}
