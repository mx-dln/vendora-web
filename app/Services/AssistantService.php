<?php

namespace App\Services;

use App\Models\AssistantConversation;
use App\Models\AssistantLog;
use App\Models\AssistantMessage;
use App\Services\Assistant\ConversationContext;
use App\Services\Assistant\CustomerAssistantService;
use App\Services\Assistant\ExpenseAssistantService;
use App\Services\Assistant\IntentEngine;
use App\Services\Assistant\InventoryAssistantService;
use App\Services\Assistant\KnowledgeService;
use App\Services\Assistant\SalesAssistantService;
use App\Services\Assistant\SmartResponseGenerator;
use Illuminate\Support\Facades\Auth;

class AssistantService
{
    public function __construct(
        protected IntentEngine $intentEngine,
        protected KnowledgeService $knowledgeService,
        protected SalesAssistantService $salesService,
        protected InventoryAssistantService $inventoryService,
        protected ExpenseAssistantService $expenseService,
        protected CustomerAssistantService $customerService,
        protected SmartResponseGenerator $responseGenerator,
        protected ConversationContext $context,
    ) {}

    public function process(string $message, ?int $conversationId = null, ?string $currentPage = null): array
    {
        $conversation = $conversationId
            ? AssistantConversation::findOrFail($conversationId)
            : AssistantConversation::create(['user_id' => Auth::id(), 'title' => substr($message, 0, 50)]);

        if ($conversation->user_id !== Auth::id()) {
            abort(403);
        }

        AssistantMessage::create(['conversation_id' => $conversation->id, 'role' => 'user', 'content' => $message]);

        $detection = $this->intentEngine->detect($message);
        $intent = $detection['intent'];
        $confidence = $detection['confidence'];
        $entities = $detection['entities'];

        $this->context->updateFromIntent($intent, $entities, $currentPage);

        $suggestions = [];
        $answer = '';

        if ($confidence < 50 && $intent !== 'GREETING' && $intent !== 'SMALL_TALK' && $intent !== 'HELP') {
            $alternatives = $detection['alternatives'] ?? [];
            $suggestions = ! empty($alternatives)
                ? array_map(fn ($a) => $this->intentToQuestion($a), $alternatives)
                : ['Sales Today', 'Low Stock Items', 'Show Customers', 'Help'];
            $answer = "I couldn't fully understand that request.\n\nYou can ask things like:\n• What are my sales today?\n• Show low stock products.\n• Show customer list.\n• Explain stock count.";
        } else {
            $dataIntents = ['SALES_TODAY', 'SALES_WEEK', 'SALES_MONTH', 'SALES_YEAR',
                'TOP_PRODUCTS', 'AVERAGE_TRANSACTION', 'LOW_STOCK', 'OUT_OF_STOCK', 'INVENTORY_VALUE',
                'TOP_CUSTOMERS', 'CUSTOMER_LIST', 'CUSTOMER_COUNT',
                'EXPENSES_TODAY', 'EXPENSES_MONTH', 'LARGEST_EXPENSE', 'EXPENSE_BREAKDOWN'];

            if (in_array($intent, $dataIntents)) {
                $answer = $this->getBusinessData($intent);
                $suggestions = $this->getSuggestionsForIntent($intent);
            } else {
                $knowledge = $this->knowledgeService->search($message);
                if ($knowledge) {
                    $answer = $knowledge['content'];
                    $suggestions = ['Sales today', 'Low stock items', 'Help'];
                } else {
                    $result = $this->responseGenerator->generate($intent, $message, $entities, null, null);
                    $answer = $result['response'];
                    $suggestions = $result['suggestions'];
                }
            }
        }

        AssistantMessage::create(['conversation_id' => $conversation->id, 'role' => 'assistant', 'content' => $answer]);

        // Log intent
        try {
            AssistantLog::create([
                'user_id' => Auth::id(),
                'original_question' => $detection['original'],
                'normalized_question' => $detection['normalized'],
                'detected_intent' => $detection['intent'],
                'confidence' => $detection['confidence'],
                'response' => $answer,
            ]);
        } catch (\Exception $e) {
            // Silent fail on logging
        }

        return [
            'message' => $answer,
            'conversation_id' => $conversation->id,
            'conversation_title' => $conversation->title,
            'confidence' => $confidence,
            'suggestions' => $suggestions,
        ];
    }

    private function getSuggestionsForIntent(string $intent): array
    {
        return match ($intent) {
            'SALES_TODAY' => ['Sales This Week', 'Sales This Month', 'Top Products', 'Average Transaction'],
            'SALES_WEEK' => ['Sales Today', 'Sales This Month', 'Top Products'],
            'SALES_MONTH' => ['Sales Today', 'Top Products', 'Expenses This Month'],
            'TOP_PRODUCTS' => ['Sales Today', 'Low Stock Items', 'Inventory Value'],
            'AVERAGE_TRANSACTION' => ['Sales Today', 'Top Products', 'Expenses Today'],
            'LOW_STOCK' => ['Out of Stock Items', 'Inventory Value', 'Stock Count'],
            'OUT_OF_STOCK' => ['Low Stock Items', 'Inventory Value', 'Stock Count'],
            'INVENTORY_VALUE' => ['Low Stock Items', 'Top Products', 'Sales Today'],
            'TOP_CUSTOMERS' => ['Customer Count', 'Customer List', 'Sales Today'],
            'CUSTOMER_LIST' => ['Top Customers', 'Customer Count', 'Sales Today'],
            'CUSTOMER_COUNT' => ['Top Customers', 'Customer List', 'Sales Today'],
            'EXPENSES_TODAY' => ['Expenses This Month', 'Largest Expense', 'Expense Breakdown'],
            'EXPENSES_MONTH' => ['Expenses Today', 'Largest Expense', 'Sales This Month'],
            'LARGEST_EXPENSE' => ['Expenses This Month', 'Expense Breakdown', 'Sales Today'],
            'EXPENSE_BREAKDOWN' => ['Expenses Today', 'Expenses This Month', 'Largest Expense'],
            'GREETING' => ['Sales Today', 'Low Stock Items', 'Help'],
            'HELP' => ['Sales Today', 'Low Stock Items', 'Explain Stock Count'],
            default => ['Sales Today', 'Low Stock Items', 'Help'],
        };
    }

    private function getBusinessData(string $intent): string
    {
        return match ($intent) {
            'SALES_TODAY' => $this->formatSalesToday(),
            'SALES_WEEK' => $this->formatSalesWeek(),
            'SALES_MONTH' => $this->formatSalesMonth(),
            'SALES_YEAR' => $this->formatSalesYear(),
            'TOP_PRODUCTS' => $this->formatTopProducts(),
            'AVERAGE_TRANSACTION' => $this->formatAverageTransaction(),
            'LOW_STOCK' => $this->formatLowStock(),
            'OUT_OF_STOCK' => $this->formatOutOfStock(),
            'INVENTORY_VALUE' => $this->formatInventoryValue(),
            'TOP_CUSTOMERS' => $this->formatTopCustomers(),
            'CUSTOMER_LIST' => $this->formatCustomerList(),
            'CUSTOMER_COUNT' => $this->formatCustomerCount(),
            'EXPENSES_TODAY' => $this->formatExpensesToday(),
            'EXPENSES_MONTH' => $this->formatExpensesMonth(),
            'LARGEST_EXPENSE' => $this->formatLargestExpense(),
            'EXPENSE_BREAKDOWN' => $this->formatExpenseBreakdown(),
            default => '',
        };
    }

    private function formatSalesToday(): string
    {
        $data = $this->salesService->getSalesOverview('today');

        $avgText = $data['average_sale'] !== null ? '₱'.number_format($data['average_sale'], 2) : 'N/A';
        $bestText = $data['best_seller'] ?? 'None';

        return "📊 **Today's Sales Summary**\n\nTotal sales: ₱".number_format($data['total_sales'], 2)."\nTransactions: {$data['transaction_count']}\nAverage sale: {$avgText}\nBest seller: {$bestText}";
    }

    private function formatSalesWeek(): string
    {
        $data = $this->salesService->getSalesOverview('week');

        $avgText = $data['average_sale'] !== null ? '₱'.number_format($data['average_sale'], 2) : 'N/A';

        return "📈 **This Week's Sales**\n\nTotal revenue: ₱".number_format($data['total_sales'], 2)."\nTransactions: {$data['transaction_count']}\nAverage sale: {$avgText}";
    }

    private function formatSalesMonth(): string
    {
        $data = $this->salesService->getSalesOverview('month');

        $avgText = $data['average_sale'] !== null ? '₱'.number_format($data['average_sale'], 2) : 'N/A';

        return "📈 **This Month's Sales**\n\nTotal revenue: ₱".number_format($data['total_sales'], 2)."\nTotal transactions: {$data['transaction_count']}\nAverage sale: {$avgText}\n\nMonth: ".now()->format('F Y');
    }

    private function formatSalesYear(): string
    {
        return "📅 **Year to Date Revenue**\n\nUse the Vendora Analytics dashboard for yearly revenue reports.\n\nMonth: ".now()->format('F Y');
    }

    private function formatTopProducts(): string
    {
        $products = $this->salesService->getTopProducts(5);
        if ($products->isEmpty()) {
            return 'No product sales data available yet.';
        }
        $lines = $products->values()->map(fn ($p, $i) => ($i + 1).". {$p->product_name} — ".(int) $p->total_qty.' sold (₱'.number_format($p->total_revenue, 2).')');

        return "🏆 **Top Selling Products**\n\n".$lines->implode("\n");
    }

    private function formatAverageTransaction(): string
    {
        $data = $this->salesService->getSalesOverview('today');

        if ($data['transaction_count'] === 0) {
            return "📊 **Average Transaction**\n\nNo transactions recorded yet today.";
        }

        return "📊 **Average Transaction**\n\nAverage: ₱".number_format($data['average_sale'], 2)."\nTotal transactions: {$data['transaction_count']}\nTotal revenue: ₱".number_format($data['total_sales'], 2);
    }

    private function formatLowStock(): string
    {
        $items = $this->inventoryService->getLowStockProducts();
        if ($items->isEmpty()) {
            return '✅ All products are well-stocked.';
        }
        $lines = $items->map(fn ($p) => "• {$p->name} — {$p->stock_quantity} left");

        return "⚠️ **Low Stock Alerts**\n\n".$lines->implode("\n")."\n\nConsider creating a purchase order to replenish these items.";
    }

    private function formatOutOfStock(): string
    {
        $items = $this->inventoryService->getOutOfStockProducts();
        if ($items->isEmpty()) {
            return '✅ No out-of-stock items currently.';
        }
        $lines = $items->map(fn ($p) => "• {$p->name}");

        return "🚫 **Out of Stock Items**\n\n".$lines->implode("\n")."\n\nThese items need immediate replenishment.";
    }

    private function formatInventoryValue(): string
    {
        $data = $this->inventoryService->getInventoryValue();

        return "💰 **Inventory Valuation**\n\nCost value: ₱".number_format($data['cost'], 2)."\nRetail value: ₱".number_format($data['retail'], 2)."\nPotential profit: ₱".number_format($data['retail'] - $data['cost'], 2);
    }

    private function formatTopCustomers(): string
    {
        $customers = $this->customerService->getTopCustomers();
        if ($customers->isEmpty()) {
            return 'No customer data available.';
        }
        $lines = $customers->values()->map(fn ($c, $i) => ($i + 1).". {$c->name} — ₱".number_format($c->total_purchases, 2)." ({$c->visit_count} visits)");

        return "👥 **Top Customers**\n\n".$lines->implode("\n");
    }

    private function formatCustomerCount(): string
    {
        return "👤 **Customer Overview**\n\nTotal active customers: ".$this->customerService->getCustomerCount();
    }

    private function formatCustomerList(): string
    {
        $customers = $this->customerService->getRecentCustomers(10);
        if ($customers->isEmpty()) {
            return 'No customers found.';
        }
        $lines = $customers->values()->map(fn ($c, $i) => ($i + 1).". {$c->name}".($c->email ? " ({$c->email})" : ''));

        return "👥 **Customer List**\n\n".$lines->implode("\n");
    }

    private function formatExpensesToday(): string
    {
        return "💸 **Today's Expenses**\n\nTotal: ₱".number_format($this->expenseService->getExpensesToday(), 2);
    }

    private function formatExpensesMonth(): string
    {
        $data = $this->expenseService->getExpensesThisMonth();

        return "💸 **This Month's Expenses**\n\nTotal: ₱".number_format($data['total'], 2)."\nTransactions: {$data['count']}";
    }

    private function formatLargestExpense(): string
    {
        $expense = $this->expenseService->getLargestExpense();
        if (! $expense) {
            return 'No expenses recorded yet.';
        }

        return "📌 **Largest Expense**\n\n{$expense->description}: ₱".number_format($expense->amount, 2)."\nDate: {$expense->expense_date}";
    }

    private function formatExpenseBreakdown(): string
    {
        $breakdown = $this->expenseService->getExpenseBreakdown();
        if ($breakdown->isEmpty()) {
            return 'No expense data available.';
        }
        $total = $breakdown->sum('total');
        $lines = $breakdown->map(fn ($c) => "• {$c->name}: ₱".number_format($c->total, 2).' ('.round(($c->total / $total) * 100, 1).'%)');

        return "📊 **Expense Breakdown**\n\n".$lines->implode("\n")."\n\nTotal: ₱".number_format($total, 2);
    }

    private function intentToQuestion(string $intent): string
    {
        $map = [
            'SALES_TODAY' => 'Sales today',
            'SALES_WEEK' => 'Sales this week',
            'SALES_MONTH' => 'Sales this month',
            'TOP_PRODUCTS' => 'Top products',
            'LOW_STOCK' => 'Low stock items',
            'OUT_OF_STOCK' => 'Out of stock items',
            'INVENTORY_VALUE' => 'Inventory value',
            'TOP_CUSTOMERS' => 'Top customers',
            'EXPENSES_TODAY' => 'Expenses today',
            'EXPENSES_MONTH' => 'Expenses this month',
            'LARGEST_EXPENSE' => 'Largest expense',
            'EXPENSE_BREAKDOWN' => 'Expense breakdown',
        ];

        return $map[$intent] ?? str_replace('_', ' ', strtolower($intent));
    }
}
