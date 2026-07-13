<?php

namespace App\Services\Assistant;

class SmartResponseGenerator
{
    private array $greetings = [
        'hello' => ['Hello! How can I help you with Vendora today?', 'Hi there! What would you like to know?', 'Hey! I\'m your Vendora assistant. Ask me anything!'],
        'morning' => ['Good morning! Ready to help with your business data.', 'Good morning! What can I assist you with today?'],
        'afternoon' => ['Good afternoon! Need any business insights?', 'Good afternoon! How can I help you run your store better?'],
        'evening' => ['Good evening! Let me know if you need any reports.', 'Good evening! Still working? Need any help with data?'],
    ];

    private array $smallTalk = [
        'how are you' => "I'm doing great! I'm here to help you with Vendora. Ask me about sales, inventory, expenses, or how things work.",
        'who are you' => "I'm the Vendora Business Assistant! I can help you understand your business data, explain features, and guide you through the system.",
        'what can you do' => "I can:\n• Answer sales, inventory, and expense questions\n• Explain how Vendora features work\n• Show real-time business data\n• Guide you through the system\n\nTry asking: 'What are my sales today?' or 'Explain stock count'",
        'thank you' => "You're welcome! Let me know if you need anything else.",
        'thanks' => "Happy to help! Anything else you'd like to know?",
        'default' => "I'm doing well, thanks! How can I assist you with Vendora today?",
    ];

    private array $followUps = [
        'SALES_TODAY' => ['Top products today', 'Sales this week', 'Average transaction value'],
        'SALES_WEEK' => ['Sales today', 'Sales this month', 'Top products'],
        'SALES_MONTH' => ['Sales today', 'Top products', 'Expenses this month'],
        'TOP_PRODUCTS' => ['Sales today', 'Low stock items', 'Inventory value'],
        'LOW_STOCK' => ['Out of stock items', 'Inventory value', 'Create purchase order'],
        'OUT_OF_STOCK' => ['Low stock items', 'Inventory value', 'Stock count'],
        'INVENTORY_VALUE' => ['Low stock items', 'Top products', 'Sales today'],
        'TOP_CUSTOMERS' => ['Customer count', 'Sales today', 'Top products'],
        'EXPENSES_TODAY' => ['Expenses this month', 'Largest expense', 'Expense breakdown'],
        'EXPENSES_MONTH' => ['Expenses today', 'Largest expense', 'Sales this month'],
        'LARGEST_EXPENSE' => ['Expenses this month', 'Expense breakdown', 'Sales today'],
        'EXPENSE_BREAKDOWN' => ['Expenses today', 'Expenses this month', 'Largest expense'],
        'HELP' => ['Sales today', 'Low stock items', 'Explain stock count'],
        'GREETING' => ['Sales today', 'Low stock items', 'Help'],
    ];

    public function generate(string $intent, string $message, array $entities, ?array $knowledge, ?callable $dataHandler): array
    {
        $response = '';

        if ($intent === 'GREETING') {
            $response = $this->greeting($message);
        } elseif ($intent === 'SMALL_TALK') {
            $response = $this->smallTalk($message);
        } elseif ($knowledge) {
            $response = $knowledge['content'];
        } elseif ($dataHandler) {
            $response = $dataHandler();
        } elseif ($intent === 'HELP') {
            $response = $this->help();
        } elseif ($intent === 'EXPLAIN_PAGE') {
            $response = $this->explainPage($entities['page'] ?? null);
        } elseif ($intent === 'UNKNOWN') {
            $response = $this->unknown($message);
        } else {
            $response = $this->unknown($message);
        }

        $suggestions = $this->followUps[$intent] ?? $this->followUps['HELP'];

        return [
            'response' => $response,
            'suggestions' => $suggestions,
        ];
    }

    private function greeting(string $message): string
    {
        $msg = strtolower($message);
        if (str_contains($msg, 'morning')) {
            return $this->randomFrom($this->greetings['morning']);
        }
        if (str_contains($msg, 'afternoon')) {
            return $this->randomFrom($this->greetings['afternoon']);
        }
        if (str_contains($msg, 'evening')) {
            return $this->randomFrom($this->greetings['evening']);
        }

        return $this->randomFrom($this->greetings['hello']);
    }

    private function smallTalk(string $message): string
    {
        $msg = strtolower($message);
        foreach ($this->smallTalk as $key => $response) {
            if ($key === 'default') {
                continue;
            }
            if (str_contains($msg, $key)) {
                return $response;
            }
        }

        return $this->smallTalk['default'];
    }

    private function help(): string
    {
        return "🤖 **Vendora Assistant Help**\n\nI can help you with:\n\n**📊 Sales**\n• What are my sales today?\n• Show this month's revenue\n• What are my top products?\n\n**📦 Inventory**\n• Show low stock items\n• Explain stock count\n• Inventory value\n\n**💸 Expenses**\n• Expenses this month\n• Largest expense\n• Expense breakdown\n\n**👥 Customers**\n• Top customers\n• Customer count\n\n**💡 General**\n• Explain this page\n• How do reports work?\n• How to create a sale?\n\nTry asking me anything above!";
    }

    private function explainPage(?string $page): string
    {
        $explanations = [
            'dashboard' => "This is the **Operations Center** — your real-time business snapshot.\n\n**KPIs show:** Today's sales, profit, transactions, average sale, low stock count, and active customers.\n\n**Main sections:** Recent transactions, shift summary, 7-day revenue sparkline, low stock alerts, top products today, and pending purchase orders.\n\nUse the **Quick Actions** to jump to common tasks like POS, adding products, or viewing reports.",
            'sales' => "This is the **Sales page** — all your transactions in one place.\n\nYou can filter by date range, payment method, and status. Click any transaction to see full details, print a receipt, or void if needed.",
            'products' => "This is the **Products page** — your product catalog.\n\nYou can add, edit, and delete products. Use the search bar to find products by name, SKU, or barcode. The **Import** button lets you upload products via CSV.",
            'inventory' => "This is the **Inventory page** — stock levels at a glance.\n\nYou can record stock in/out, adjust quantities, and view movement history for each product. Products with low stock are highlighted.",
            'stock-counts' => "This is the **Stock Counts page** — physical inventory audit.\n\nCreate a full or spot count, enter counted quantities, and reconcile differences to keep inventory accurate.",
            'customers' => "This is the **Customers page** — manage your customer relationships.\n\nView purchase history, loyalty points, and tier status (Regular, Silver, Gold, Platinum).",
            'expenses' => "This is the **Expenses page** — track your business spending.\n\nThe dashboard shows total expenses, monthly trends, and category breakdown. Use the table below to view and manage individual expenses.",
            'reports' => "This is the **Reports section** — analytics for your business.\n\n**Sales Report:** Revenue trends, payment methods, cashier performance.\n**Product Report:** Best sellers, category performance, profitability.\n**Inventory Report:** Stock health, low stock alerts, inventory valuation.\n**Profit & Loss:** Overall business performance.",
        ];

        $matched = null;
        foreach ($explanations as $key => $text) {
            if ($page && str_contains($page, $key)) {
                $matched = $text;
                break;
            }
        }

        return $matched ? "📋 **Page Overview**\n\n".$matched : "I'm not sure which page you're on. Try navigating to a page first, then ask me to explain it.";
    }

    private function unknown(string $message): string
    {
        return "I'm not sure I understood that. Here are some things you can ask me:\n\n• Sales data (today, this week, this month)\n• Inventory status (low stock, out of stock, value)\n• Expenses (today, this month, breakdown)\n• How-to questions (stock count, reports, sales)\n\nOr type **help** to see everything I can do.";
    }

    private function randomFrom(array $items): string
    {
        return $items[array_rand($items)];
    }
}
