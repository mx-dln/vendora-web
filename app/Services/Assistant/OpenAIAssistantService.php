<?php

namespace App\Services\Assistant;

use App\Enums\TransactionStatus;
use App\Models\AssistantConversation;
use App\Models\AssistantMessage;
use App\Models\Customer;
use App\Models\KnowledgeArticle;
use App\Models\Product;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OpenAIAssistantService
{
    private array $lastToolResults = [];

    public function __construct(
        protected SalesAssistantService $salesService,
        protected InventoryAssistantService $inventoryService,
        protected ExpenseAssistantService $expenseService,
        protected CustomerAssistantService $customerService,
    ) {}

    public function chat(string $message, ?int $conversationId = null, ?string $currentPage = null): array
    {
        if (! Auth::user()?->can('assistant.use')) {
            abort(403, 'You do not have permission to use the AI assistant.');
        }

        $conversation = $conversationId
            ? AssistantConversation::findOrFail($conversationId)
            : AssistantConversation::create(['user_id' => Auth::id(), 'title' => substr($message, 0, 50)]);

        if ($conversation->user_id !== Auth::id()) {
            abort(403);
        }

        AssistantMessage::create(['conversation_id' => $conversation->id, 'role' => 'user', 'content' => $message]);

        $messages = $this->buildMessages($conversation, $message, $currentPage);

        $result = $this->callOpenAI($messages);

        $responseContent = $result['response'];

        AssistantMessage::create(['conversation_id' => $conversation->id, 'role' => 'assistant', 'content' => $responseContent]);

        // Extract context from tool results and store in metadata
        try {
            $context = $this->extractContext($this->lastToolResults);
            if (! empty($context)) {
                AssistantMessage::where('conversation_id', $conversation->id)
                    ->where('role', 'assistant')
                    ->whereNotNull('metadata')
                    ->latest()
                    ->update(['metadata' => DB::raw('JSON_MERGE_PATCH(COALESCE(metadata, "{}"), \''.json_encode($context).'\')')]);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to save assistant context: '.$e->getMessage());
        }

        return [
            'message' => $responseContent,
            'conversation_id' => $conversation->id,
            'conversation_title' => $conversation->title,
            'suggestions' => $result['suggestions'],
        ];
    }

    public function chatStream(string $message, ?int $conversationId = null, ?string $currentPage = null): StreamedResponse
    {
        if (! Auth::user()?->can('assistant.use')) {
            abort(403, 'You do not have permission to use the AI assistant.');
        }

        $conversation = $conversationId
            ? AssistantConversation::findOrFail($conversationId)
            : AssistantConversation::create(['user_id' => Auth::id(), 'title' => substr($message, 0, 50)]);

        if ($conversation->user_id !== Auth::id()) {
            abort(403);
        }

        Log::info('[AI] User message received', ['conversation_id' => $conversation->id]);

        AssistantMessage::create(['conversation_id' => $conversation->id, 'role' => 'user', 'content' => $message]);

        $messages = $this->buildMessages($conversation, $message, $currentPage);

        $fullResponse = '';
        $finalToolResults = [];

        $response = new StreamedResponse(function () use ($messages, $conversation, &$fullResponse, &$finalToolResults) {
            try {
                // Flush all output buffers for streaming
                while (ob_get_level() > 0) {
                    ob_end_flush();
                }
                ob_implicit_flush(true);

                $client = \OpenAI::client(config('openai.api_key'));

                Log::info('[AI] Sending request to OpenAI', ['conversation_id' => $conversation->id]);

                for ($turn = 0; $turn < 10; $turn++) {
                    if ($turn === 9) {
                        Log::warning('[AI] Tool execution loop exceeded max iterations', ['conversation_id' => $conversation->id]);
                        $msg = 'The assistant entered a tool execution loop. Please try a different question.';
                        $this->sendSSE('text', ['content' => $msg]);
                        $fullResponse .= $msg;
                        break;
                    }

                    $stream = $client->chat()->createStreamed([
                        'model' => config('openai.model'),
                        'messages' => $messages,
                        'temperature' => 0.7,
                        'max_tokens' => 2000,
                        'tools' => $this->getTools(),
                        'tool_choice' => 'auto',
                    ]);

                    $accumulatedContent = '';
                    $toolCalls = [];

                    foreach ($stream as $chunk) {
                        foreach ($chunk->choices as $choice) {
                            $delta = $choice->delta ?? null;
                            if (! $delta) {
                                continue;
                            }

                            if (! empty($delta->content)) {
                                $accumulatedContent .= $delta->content;
                                $this->sendSSE('text', ['content' => $delta->content]);
                            }

                            if (! empty($delta->toolCalls)) {
                                foreach ($delta->toolCalls as $tc) {
                                    $index = $tc->index;
                                    if (! isset($toolCalls[$index])) {
                                        $toolCalls[$index] = ['name' => '', 'arguments' => '', 'id' => ''];
                                    }
                                    if (! empty($tc->function->name)) {
                                        $toolCalls[$index]['name'] .= $tc->function->name;
                                    }
                                    if (! empty($tc->function->arguments)) {
                                        $toolCalls[$index]['arguments'] .= $tc->function->arguments;
                                    }
                                    if (! empty($tc->id)) {
                                        $toolCalls[$index]['id'] = $tc->id;
                                    }
                                }
                            }
                        }
                    }

                    $fullResponse .= $accumulatedContent;

                    if (empty($toolCalls)) {
                        if (! empty($accumulatedContent)) {
                            Log::info('[AI] Final assistant response received', ['conversation_id' => $conversation->id, 'length' => strlen($accumulatedContent)]);
                        }
                        break;
                    }

                    Log::info('[AI] Tool call detected', ['conversation_id' => $conversation->id, 'tools' => array_column($toolCalls, 'name')]);

                    // Handle tool calls
                    // IMPORTANT: Add assistant message with tool_calls BEFORE tool results
                    $assistantMsg = ['role' => 'assistant', 'content' => null, 'tool_calls' => []];
                    foreach ($toolCalls as $tc) {
                        $tcId = $tc['id'] ?: 'call_'.uniqid();
                        $tcName = trim($tc['name']);
                        $tcArgs = $tc['arguments'];

                        $assistantMsg['tool_calls'][] = [
                            'id' => $tcId,
                            'type' => 'function',
                            'function' => ['name' => $tcName, 'arguments' => $tcArgs],
                        ];
                    }

                    $messages[] = $assistantMsg;

                    foreach ($toolCalls as $tc) {
                        $tcId = $tc['id'] ?: 'call_'.uniqid();
                        $tcName = trim($tc['name']);
                        $tcArgs = $tc['arguments'];

                        $this->sendSSE('tool_start', ['name' => $tcName]);

                        $arguments = json_decode($tcArgs, true) ?? [];
                        $resultData = $this->executeTool($tcName, $arguments);
                        $finalToolResults[$tcName] = $resultData;
                        $this->lastToolResults[$tcName] = $resultData;

                        Log::info('[AI] Tool executed', ['name' => $tcName, 'has_error' => isset($resultData['error'])]);

                        $messages[] = [
                            'role' => 'tool',
                            'tool_call_id' => $tcId,
                            'content' => json_encode($resultData),
                        ];

                        Log::info('[AI] Tool result returned', ['name' => $tcName]);

                        $this->sendSSE('tool_end', ['name' => $tcName]);
                    }
                }

                if (! empty($fullResponse)) {
                    AssistantMessage::create(['conversation_id' => $conversation->id, 'role' => 'assistant', 'content' => $fullResponse]);
                    Log::info('[AI] Message saved', ['conversation_id' => $conversation->id, 'length' => strlen($fullResponse)]);
                } else {
                    Log::warning('[AI] No content generated, fallback message saved', ['conversation_id' => $conversation->id]);
                    $fallbackText = 'I couldn\'t generate a response. Please try again.';
                    $this->sendSSE('text', ['content' => $fallbackText]);
                    AssistantMessage::create(['conversation_id' => $conversation->id, 'role' => 'assistant', 'content' => $fallbackText]);
                    $fullResponse = $fallbackText;
                }

                // Save context
                try {
                    $context = $this->extractContext($finalToolResults);
                    if (! empty($context)) {
                        AssistantMessage::where('conversation_id', $conversation->id)
                            ->where('role', 'assistant')
                            ->whereNotNull('metadata')
                            ->latest()
                            ->update(['metadata' => DB::raw('JSON_MERGE_PATCH(COALESCE(metadata, "{}"), \''.json_encode($context).'\')')]);
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to save context: '.$e->getMessage());
                }

                $this->sendSSE('done', ['conversation_id' => $conversation->id]);

            } catch (\Throwable $e) {
                logger()->error('[AI] Streaming error', [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]);
                $errorMsg = app()->environment('local')
                    ? '**Assistant Error:** '.$e->getMessage()
                    : 'I encountered an error processing your request. Please try again.';
                $this->sendSSE('text', ['content' => $errorMsg]);
                $this->sendSSE('done', ['conversation_id' => $conversation->id]);
            }
        });

        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate');
        $response->headers->set('X-Accel-Buffering', 'no');

        return $response;
    }

    private function sendSSE(string $event, array $data): void
    {
        echo "event: {$event}\n";
        echo 'data: '.json_encode($data)."\n\n";

        if (ob_get_level() > 0) {
            ob_flush();
        }
        flush();
    }

    private function extractContext(array $toolResults): array
    {
        $context = [];

        if (isset($toolResults['getInvoiceByNumber']) && ! isset($toolResults['getInvoiceByNumber']['error'])) {
            $context['last_invoice_number'] = $toolResults['getInvoiceByNumber']['reference_number'];
            $context['last_transaction_id'] = $toolResults['getInvoiceByNumber']['id'];
            if (isset($toolResults['getInvoiceByNumber']['customer']['id'])) {
                $context['last_customer_id'] = $toolResults['getInvoiceByNumber']['customer']['id'];
                $context['last_customer_name'] = $toolResults['getInvoiceByNumber']['customer']['name'];
            }
        }

        if (isset($toolResults['getTransactionDetails']) && ! isset($toolResults['getTransactionDetails']['error'])) {
            $context['last_transaction_id'] = $toolResults['getTransactionDetails']['id'];
            $context['last_invoice_number'] = $toolResults['getTransactionDetails']['reference_number'];
            if (isset($toolResults['getTransactionDetails']['customer']['id'])) {
                $context['last_customer_id'] = $toolResults['getTransactionDetails']['customer']['id'];
                $context['last_customer_name'] = $toolResults['getTransactionDetails']['customer']['name'];
            }
        }

        if (isset($toolResults['getCustomerDetails']) && ! isset($toolResults['getCustomerDetails']['error'])) {
            $context['last_customer_id'] = $toolResults['getCustomerDetails']['id'];
            $context['last_customer_name'] = $toolResults['getCustomerDetails']['name'];
        }

        if (isset($toolResults['getProductDetails']) && ! isset($toolResults['getProductDetails']['error'])) {
            $context['last_product_id'] = $toolResults['getProductDetails']['id'];
            $context['last_product_name'] = $toolResults['getProductDetails']['name'];
        }

        return $context;
    }

    private function buildMessages(AssistantConversation $conversation, string $newMessage, ?string $currentPage): array
    {
        $systemPrompt = $this->buildSystemPrompt($currentPage, $conversation->id);

        $historyMessages = [];
        $recentHistory = $conversation->messages()->latest()->take(10)->get()->reverse();

        foreach ($recentHistory as $msg) {
            $historyMessages[] = [
                'role' => $msg->role,
                'content' => $msg->content,
            ];
        }

        return array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $historyMessages
        );
    }

    private function buildSystemPrompt(?string $currentPage, ?int $conversationId = null): string
    {
        $user = Auth::user();

        // Load conversation context from the current conversation's metadata
        $context = [];
        if ($conversationId) {
            try {
                $lastMsg = AssistantMessage::where('conversation_id', $conversationId)
                    ->where('role', 'assistant')
                    ->whereNotNull('metadata')
                    ->latest()
                    ->first();
                if ($lastMsg && is_array($lastMsg->metadata)) {
                    $context = $lastMsg->metadata;
                }
            } catch (\Exception $e) {
                Log::warning('Failed to load conversation context: '.$e->getMessage());
            }
        }

        $date = now()->format('l, F j, Y');
        $time = now()->format('g:i A');

        $pageContext = '';
        if ($currentPage) {
            $pageContext = "\n\nThe user is currently on: {$currentPage}";
        }

        $contextStr = '';
        if (! empty($context)) {
            $pairs = [];
            if (! empty($context['last_invoice_number'])) {
                $pairs[] = "Last discussed invoice: {$context['last_invoice_number']} (transaction ID: {$context['last_transaction_id']})";
            }
            if (! empty($context['last_customer_id'])) {
                $pairs[] = "Last discussed customer: {$context['last_customer_name']} (ID: {$context['last_customer_id']})";
            }
            if (! empty($context['last_product_name'])) {
                $pairs[] = "Last discussed product: {$context['last_product_name']} (ID: {$context['last_product_id']})";
            }
            if (! empty($pairs)) {
                $contextStr = "\n\nConversation Context (use this for follow-up questions without asking the user to repeat themselves):\n".implode("\n", $pairs);
            }
        }

        return <<<PROMPT
You are Vendora Assistant, an AI business copilot integrated into Vendora POS and Inventory Management System.

Current Information:
- Date: {$date}
- Time: {$time}
- Cashier/User: {$user->name} ({$user->email}){$pageContext}{$contextStr}

YOUR CAPABILITIES:
- Answer business questions using live system data by calling the available tool functions.
- Analyze sales, inventory, customers, expenses, and reports.
- Review transactions, invoices, and customer details.
- Use sales.view permission tools to look up invoices and transactions.
- Provide actionable recommendations.
- Maintain professional, concise responses.

CRITICAL RULES — VIOLATION WILL CAUSE SYSTEM FAILURE:

1. You MUST NEVER claim to have viewed, analyzed, confirmed, reviewed, retrieved, or verified any business data unless a tool has SUCCESSFULLY returned that data. If you did not call a tool and get a valid result, you do not have the data.

2. If a tool returns an error or the data is unavailable:
   - State that the data could not be retrieved.
   - Explain the failure clearly.
   - Do NOT guess, estimate, or infer.
   - Do NOT say "No data found" and then make something up.
   - Do NOT say "I could not access the data" and then still describe it.

3. If you have not called getTransactionDetails, you MUST NOT describe any products, items, quantities, or prices in an invoice. Call the tool first. If it returns items, display them. If it fails, say "Transaction details could not be retrieved."

4. NEVER generate placeholder values. The following are FORBIDDEN:
   - "Product A", "Product B", "Product C", "Item 1", "Item 2"
   - "Sample Product", "Example Item", "Test Product"
   - Any made-up product name, customer name, quantity, or price
   - Fictional totals, subtotals, or discounts

5. Pronoun resolution: When the user says "that invoice", "this invoice", "it", "that customer", "this customer", "that product", "them" — use the conversation context to resolve what they mean. Do NOT ask them to repeat IDs or names.

6. When users ask about capabilities, features, or what you can do — call getSystemCapabilities to get the actual installed modules and tools. Never generate generic capability lists.

7. Keep responses concise and actionable.

8. When rendering business data, ALWAYS return a JSON object wrapped in <vendora-json> tags.

8. Format display values with ₱ and commas (e.g., "₱1,520.50").

SALES DATA RESPONSE FORMAT:
Use this exact format when displaying sales overview data.

If average_sale is null (no transactions):
<vendora-json>{"type":"kpi","columns":2,"items":[{"label":"Sales","value":"₱0","icon":"DollarSign"},{"label":"Transactions","value":"0","icon":"ShoppingCart"},{"label":"Average Sale","value":"N/A","icon":"Target"},{"label":"Best Seller","value":"None","icon":"TrendingUp"}]}</vendora-json>

If there are transactions:
<vendora-json>{"type":"kpi","columns":2,"items":[{"label":"Sales","value":"₱15,420","icon":"DollarSign"},{"label":"Transactions","value":"42","icon":"ShoppingCart"},{"label":"Average Sale","value":"₱367","icon":"Target"},{"label":"Best Seller","value":"Coke 1.5L","icon":"TrendingUp"}]}</vendora-json>

For product/inventory lists, use:
<vendora-json>{"type":"products","items":[{"name":"Marlboro Red 20s","sku":"SKU-CIG002","stock":10,"price":85,"status":"Active"},{"name":"Fortune Menthol","sku":"SKU-CIG001","stock":0,"price":70,"status":"Out"}]}</vendora-json>

For customer lists, use:
<vendora-json>{"type":"customers","items":[{"name":"Juan Dela Cruz","email":"juan@email.com","purchases":15000,"visits":25},{"name":"Maria Santos","email":"maria@email.com","purchases":12000,"visits":18}]}</vendora-json>

For alerts/warnings, use:
<vendora-json>{"type":"alert","alertType":"warning","title":"Low Stock Alert","description":"Marlboro Red 20s has only 10 units remaining. Consider creating a purchase order.","actions":[{"label":"Create PO","href":"/purchase-orders"}]}</vendora-json>

For transaction item tables, use:
<vendora-json>{"type":"table","headers":["Item","Qty","Price","Total"],"rows":[["Marlboro Red 20s","2","₱85.00","₱170.00"]]}</vendora-json>

Always include a brief text explanation before or after the JSON block. If you can't use JSON, just respond with plain text.
PROMPT;
    }

    private function callOpenAI(array $messages): array
    {
        try {
            $client = \OpenAI::client(config('openai.api_key'));

            $response = '';
            $suggestions = [];

            for ($loop = 0; $loop < 5; $loop++) {
                $result = $client->chat()->create([
                    'model' => config('openai.model'),
                    'messages' => $messages,
                    'temperature' => 0.7,
                    'max_tokens' => 2000,
                    'tools' => $this->getTools(),
                    'tool_choice' => 'auto',
                ]);

                $hasToolCalls = false;

                foreach ($result->choices as $choice) {
                    $content = $choice->message->content ?? '';
                    if (! empty($content)) {
                        $response .= $content;
                    }

                    if (! empty($choice->message->toolCalls)) {
                        $hasToolCalls = true;
                        foreach ($choice->message->toolCalls as $toolCall) {
                            $functionName = $toolCall->function->name;
                            $arguments = json_decode($toolCall->function->arguments, true) ?? [];
                            $resultData = $this->executeTool($functionName, $arguments);

                            $this->lastToolResults[$functionName] = $resultData;

                            $messages[] = [
                                'role' => 'assistant',
                                'content' => null,
                                'tool_calls' => [
                                    [
                                        'id' => $toolCall->id,
                                        'type' => 'function',
                                        'function' => [
                                            'name' => $functionName,
                                            'arguments' => $toolCall->function->arguments,
                                        ],
                                    ],
                                ],
                            ];

                            $messages[] = [
                                'role' => 'tool',
                                'tool_call_id' => $toolCall->id,
                                'content' => json_encode($resultData),
                            ];
                        }
                    }
                }

                if (! $hasToolCalls) {
                    break;
                }
            }

            if (! empty($response)) {
                $response = $this->validateResponse($response);
            }

            if (preg_match('/Suggested actions:\s*(.+)/', $response, $matches)) {
                $suggestions = array_map('trim', explode('|', $matches[1]));
                $response = trim(str_replace($matches[0], '', $response));
            }

            if (empty($suggestions)) {
                $suggestions = ['What are my sales today?', 'Show low stock items', 'Review an invoice', 'Explain stock count'];
            }

            return [
                'response' => $response ?: 'I apologize, but I encountered an error processing your request.',
                'suggestions' => $suggestions,
            ];

        } catch (\Throwable $e) {
            logger()->error('[AI] OpenAI API Error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            $errorMsg = app()->environment('local')
                ? '**Assistant Error:** '.$e->getMessage()
                : 'I apologize, but I encountered an error processing your request.';

            return [
                'response' => $errorMsg,
                'suggestions' => ['What are my sales today?', 'Show low stock items', 'Explain stock count', 'Show expenses this month'],
            ];
        }
    }

    private function validateResponse(string $response): string
    {
        $overviewResult = $this->lastToolResults['getSalesOverview'] ?? null;

        if ($overviewResult === null) {
            return $response;
        }

        preg_match_all('/<vendora-json>(.*?)<\/vendora-json>/s', $response, $matches);

        foreach ($matches[1] as $jsonStr) {
            $data = json_decode($jsonStr, true);

            if (! $data || ($data['type'] ?? '') !== 'kpi') {
                continue;
            }

            $items = $data['items'] ?? [];
            $hasSalesMetric = false;
            $hasTransactionsMetric = false;
            $hasAverageMetric = false;
            $hasBestSellerMetric = false;

            foreach ($items as $item) {
                $label = strtolower($item['label'] ?? '');
                $value = $item['value'] ?? '';

                if (in_array($label, ['sales', 'total sales', 'revenue'])) {
                    $hasSalesMetric = true;
                }
                if (in_array($label, ['transactions', 'count', 'orders'])) {
                    $hasTransactionsMetric = true;
                }
                if (in_array($label, ['average sale', 'avg sale', 'average'])) {
                    $hasAverageMetric = true;
                }
                if (in_array($label, ['best seller', 'top product', 'top seller'])) {
                    $hasBestSellerMetric = true;
                }
            }

            if ($hasSalesMetric || $hasTransactionsMetric || $hasAverageMetric || $hasBestSellerMetric) {
                return $this->rebuildKpiResponse($response, $overviewResult);
            }
        }

        return $response;
    }

    private function rebuildKpiResponse(string $response, array $data): string
    {
        $totalSales = $data['total_sales'];
        $transactionCount = $data['transaction_count'];
        $averageSale = $data['average_sale'];
        $bestSeller = $data['best_seller'];

        $periodLabel = match ($data['period'] ?? 'today') {
            'week' => 'This Week',
            'month' => 'This Month',
            default => 'Today',
        };

        $avgValue = $averageSale !== null ? '₱'.number_format($averageSale, 2) : 'N/A';
        $bestValue = $bestSeller ?? 'None';
        $salesValue = '₱'.number_format($totalSales, 2);
        $transValue = (string) $transactionCount;

        $correctJson = json_encode([
            'type' => 'kpi',
            'columns' => 2,
            'items' => [
                ['label' => 'Sales', 'value' => $salesValue, 'icon' => 'DollarSign'],
                ['label' => 'Transactions', 'value' => $transValue, 'icon' => 'ShoppingCart'],
                ['label' => 'Average Sale', 'value' => $avgValue, 'icon' => 'Target'],
                ['label' => 'Best Seller', 'value' => $bestValue, 'icon' => 'TrendingUp'],
            ],
        ]);

        $response = preg_replace(
            '/<vendora-json>.*?<\/vendora-json>/s',
            '<vendora-json>'.$correctJson.'</vendora-json>',
            $response
        );

        Log::info('Assistant response KPI data corrected to match tool results', [
            'period' => $data['period'],
            'total_sales' => $totalSales,
            'transaction_count' => $transactionCount,
            'average_sale' => $averageSale,
            'best_seller' => $bestSeller,
        ]);

        return $response;
    }

    private function getTools(): array
    {
        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'getSalesOverview',
                    'description' => 'Get sales overview for a period including total_sales, transaction_count, average_sale (null if no transactions), and best_seller (null if no transactions). All metrics are from the same query with consistent date ranges.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'period' => [
                                'type' => 'string',
                                'enum' => ['today', 'week', 'month'],
                                'description' => 'The period to get sales for. Use "today", "week", or "month".',
                            ],
                        ],
                        'required' => ['period'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'getTopProducts',
                    'description' => 'Get top selling products by quantity sold (all time)',
                    'parameters' => ['type' => 'object', 'properties' => ['limit' => ['type' => 'integer', 'description' => 'Number of products to return (default 5)']], 'required' => []],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'getLowStockProducts',
                    'description' => 'Get products that are low on stock and need reordering',
                    'parameters' => ['type' => 'object', 'properties' => (object) [], 'required' => []],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'getOutOfStockProducts',
                    'description' => 'Get products that are completely out of stock',
                    'parameters' => ['type' => 'object', 'properties' => (object) [], 'required' => []],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'getInventoryValue',
                    'description' => 'Get total inventory value at cost and retail prices',
                    'parameters' => ['type' => 'object', 'properties' => (object) [], 'required' => []],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'getExpensesToday',
                    'description' => "Get today's total expenses",
                    'parameters' => ['type' => 'object', 'properties' => (object) [], 'required' => []],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'getExpensesThisMonth',
                    'description' => "Get this month's total expenses and count",
                    'parameters' => ['type' => 'object', 'properties' => (object) [], 'required' => []],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'getExpenseBreakdown',
                    'description' => 'Get expense breakdown by category',
                    'parameters' => ['type' => 'object', 'properties' => (object) [], 'required' => []],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'getTopCustomers',
                    'description' => 'Get top customers by total purchases',
                    'parameters' => ['type' => 'object', 'properties' => ['limit' => ['type' => 'integer']], 'required' => []],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'getCustomerCount',
                    'description' => 'Get total number of active customers',
                    'parameters' => ['type' => 'object', 'properties' => (object) [], 'required' => []],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'searchKnowledgeBase',
                    'description' => 'Search the knowledge base for articles about Vendora features',
                    'parameters' => ['type' => 'object', 'properties' => ['query' => ['type' => 'string', 'description' => 'Search query']], 'required' => ['query']],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'getInvoiceByNumber',
                    'description' => 'Find a transaction by its invoice/reference number. Returns transaction ID, status, total, and basic customer info. IMPORTANT: This only returns HEADER data. To get items/products in the invoice, you MUST call getTransactionDetails with the returned id.',
                    'parameters' => ['type' => 'object', 'properties' => ['invoiceNumber' => ['type' => 'string', 'description' => 'The invoice or reference number to look up (e.g., INV-20260711-763037)']], 'required' => ['invoiceNumber']],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'getTransactionDetails',
                    'description' => 'Get FULL transaction details including all items purchased (product names, quantities, prices), payments, profit calculation, and anomaly detection. Use this when the user asks about products, items, or specifics of a transaction.',
                    'parameters' => ['type' => 'object', 'properties' => ['id' => ['type' => 'integer', 'description' => 'The transaction ID (obtained from getInvoiceByNumber result)']], 'required' => ['id']],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'getCustomerDetails',
                    'description' => 'Get a customer profile including contact info, total purchases, visit count, and loyalty tier.',
                    'parameters' => ['type' => 'object', 'properties' => ['id' => ['type' => 'integer', 'description' => 'The customer ID']], 'required' => ['id']],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'getProductDetails',
                    'description' => 'Get product details including current stock, prices, and category.',
                    'parameters' => ['type' => 'object', 'properties' => ['id' => ['type' => 'integer', 'description' => 'The product ID']], 'required' => ['id']],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'getSystemCapabilities',
                    'description' => 'Get a complete list of installed Vendora system modules, pages, reports, and available assistant tools. Use this when the user asks what you can do, what features exist, or what modules are available.',
                    'parameters' => ['type' => 'object', 'properties' => (object) [], 'required' => []],
                ],
            ],
        ];
    }

    private function executeTool(string $name, array $arguments): mixed
    {
        Log::info('[AI] Executing tool', ['name' => $name, 'arguments' => $arguments]);

        $user = Auth::user();

        if (! $user?->can('assistant.use')) {
            Log::warning('[AI] Permission denied: user lacks assistant.use', ['user_id' => $user?->id]);

            return ['error' => 'permission_denied', 'message' => 'You do not have permission to use the AI assistant.'];
        }

        $permissionMap = [
            'getSalesOverview' => 'sales.view',
            'getTopProducts' => 'products.view',
            'getLowStockProducts' => 'inventory.view',
            'getOutOfStockProducts' => 'inventory.view',
            'getInventoryValue' => 'inventory.view',
            'getExpensesToday' => 'expenses.view',
            'getExpensesThisMonth' => 'expenses.view',
            'getExpenseBreakdown' => 'expenses.view',
            'getTopCustomers' => 'customers.view',
            'getCustomerCount' => 'customers.view',
            'searchKnowledgeBase' => 'assistant.use',
            'getInvoiceByNumber' => 'sales.view',
            'getTransactionDetails' => 'sales.view',
            'getCustomerDetails' => 'customers.view',
            'getProductDetails' => 'products.view',
            'getSystemCapabilities' => null,
        ];

        $requiredPermission = $permissionMap[$name] ?? null;
        if ($requiredPermission && ! $user?->can($requiredPermission)) {
            Log::warning('[AI] Permission denied for tool', ['name' => $name, 'permission' => $requiredPermission]);

            return ['error' => 'permission_denied', 'message' => "You do not have permission to access this information. Required permission: {$requiredPermission}"];
        }

        $result = match ($name) {
            'getSalesOverview' => $this->salesService->getSalesOverview($arguments['period'] ?? 'today'),
            'getTopProducts' => $this->salesService->getTopProducts($arguments['limit'] ?? 5),
            'getLowStockProducts' => $this->inventoryService->getLowStockProducts(),
            'getOutOfStockProducts' => $this->inventoryService->getOutOfStockProducts(),
            'getInventoryValue' => $this->inventoryService->getInventoryValue(),
            'getExpensesToday' => ['total' => $this->expenseService->getExpensesToday()],
            'getExpensesThisMonth' => $this->expenseService->getExpensesThisMonth(),
            'getExpenseBreakdown' => $this->expenseService->getExpenseBreakdown(),
            'getTopCustomers' => $this->customerService->getTopCustomers($arguments['limit'] ?? 5),
            'getCustomerCount' => ['count' => $this->customerService->getCustomerCount()],
            'searchKnowledgeBase' => $this->searchKnowledge($arguments['query'] ?? ''),
            'getInvoiceByNumber' => $this->getInvoiceByNumber($arguments['invoiceNumber']),
            'getTransactionDetails' => $this->getTransactionDetails($arguments['id']),
            'getCustomerDetails' => $this->getCustomerDetails($arguments['id']),
            'getProductDetails' => $this->getProductDetails($arguments['id']),
            'getSystemCapabilities' => $this->getSystemCapabilities(),
            default => ['error' => 'Unknown tool', 'message' => "Tool {$name} is not registered."],
        };

        Log::info('[AI] Tool completed', ['name' => $name, 'has_error' => isset($result['error'])]);

        return $result;
    }

    private function getInvoiceByNumber(string $invoiceNumber): array
    {
        $transaction = Transaction::with('customer:id,name,email,phone', 'user:id,name')
            ->where('reference_number', $invoiceNumber)
            ->first();

        if (! $transaction) {
            return ['error' => 'not_found', 'message' => "No transaction found with reference number: {$invoiceNumber}"];
        }

        return [
            'id' => $transaction->id,
            'reference_number' => $transaction->reference_number,
            'status' => $transaction->status,
            'total' => (float) $transaction->total,
            'subtotal' => (float) $transaction->subtotal,
            'discount_amount' => (float) $transaction->discount_amount,
            'discount_percentage' => (float) $transaction->discount_percentage,
            'payment_method' => $transaction->payment_method,
            'created_at' => $transaction->created_at->toDateTimeString(),
            'customer' => $transaction->customer ? [
                'id' => $transaction->customer->id,
                'name' => $transaction->customer->name,
                'email' => $transaction->customer->email,
                'phone' => $transaction->customer->phone,
            ] : null,
            'cashier' => $transaction->user?->name,
        ];
    }

    private function getTransactionDetails(int $id): array
    {
        $transaction = Transaction::with([
            'items',
            'payments',
            'customer:id,name,email,phone,total_purchases,visit_count,loyalty_tier',
            'user:id,name',
        ])->find($id);

        if (! $transaction) {
            return ['error' => 'not_found', 'message' => "Transaction with ID {$id} not found."];
        }

        $items = $transaction->items->map(fn ($item) => [
            'product_name' => $item->product_name,
            'quantity' => (float) $item->quantity,
            'unit_price' => (float) $item->unit_price,
            'cost_price' => (float) $item->cost_price,
            'subtotal' => (float) $item->subtotal,
            'discount_amount' => (float) $item->discount_amount,
            'total' => (float) $item->total,
            'profit' => round(($item->unit_price - $item->cost_price) * (float) $item->quantity, 2),
        ]);

        $totalCost = $transaction->items->sum(fn ($item) => (float) $item->cost_price * (float) $item->quantity);
        $estimatedProfit = round((float) $transaction->total - $totalCost, 2);
        $profitMargin = $transaction->total > 0 ? round(($estimatedProfit / $transaction->total) * 100, 1) : 0;

        $anomalies = [];
        if ((float) $transaction->discount_amount > $transaction->total * 0.3) {
            $anomalies[] = 'Large discount applied: ₱'.number_format((float) $transaction->discount_amount, 2).' ('.(float) $transaction->discount_percentage.'%)';
        }
        foreach ($transaction->items as $item) {
            if ((float) $item->discount_amount > 0 && (float) $item->discount_amount > (float) $item->subtotal * 0.5) {
                $anomalies[] = "Item '{$item->product_name}' has a high discount of ₱".number_format((float) $item->discount_amount, 2);
            }
        }
        if ($transaction->status !== 'completed') {
            $anomalies[] = "Transaction status is '{$transaction->status}'";
        }

        $payments = $transaction->payments->map(fn ($p) => [
            'method' => $p->payment_method,
            'amount' => (float) $p->amount,
            'reference' => $p->reference_number,
        ]);

        return [
            'id' => $transaction->id,
            'reference_number' => $transaction->reference_number,
            'status' => $transaction->status,
            'created_at' => $transaction->created_at->toDateTimeString(),
            'subtotal' => (float) $transaction->subtotal,
            'discount_amount' => (float) $transaction->discount_amount,
            'discount_percentage' => (float) $transaction->discount_percentage,
            'tax_amount' => (float) $transaction->tax_amount,
            'total' => (float) $transaction->total,
            'tendered' => (float) $transaction->tendered_amount,
            'change' => (float) $transaction->change_amount,
            'payment_method' => $transaction->payment_method,
            'item_count' => $transaction->item_count,
            'estimated_profit' => $estimatedProfit,
            'profit_margin' => $profitMargin,
            'total_cost' => $totalCost,
            'anomalies' => $anomalies,
            'cashier' => $transaction->user?->name,
            'customer' => $transaction->customer ? [
                'id' => $transaction->customer->id,
                'name' => $transaction->customer->name,
                'email' => $transaction->customer->email,
                'phone' => $transaction->customer->phone,
                'total_purchases' => (float) $transaction->customer->total_purchases,
                'visit_count' => $transaction->customer->visit_count,
                'loyalty_tier' => $transaction->customer->loyalty_tier,
            ] : null,
            'items' => $items,
            'payments' => $payments,
        ];
    }

    private function getCustomerDetails(int $id): array
    {
        $customer = Customer::withCount('transactions as transaction_count')->find($id);

        if (! $customer) {
            return ['error' => 'not_found', 'message' => "Customer with ID {$id} not found."];
        }

        $recentTransactions = $customer->transactions()
            ->where('status', TransactionStatus::Completed->value)
            ->latest()
            ->take(5)
            ->get(['id', 'reference_number', 'total', 'created_at']);

        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
            'phone' => $customer->phone,
            'address' => $customer->address,
            'city' => $customer->city,
            'total_purchases' => (float) $customer->total_purchases,
            'visit_count' => $customer->visit_count,
            'transaction_count' => $customer->transaction_count,
            'loyalty_points' => $customer->loyalty_points,
            'loyalty_tier' => $customer->loyalty_tier,
            'last_visit' => $customer->last_visit?->toDateTimeString(),
            'created_at' => $customer->created_at->toDateTimeString(),
            'is_active' => $customer->is_active,
            'recent_transactions' => $recentTransactions->map(fn ($t) => [
                'id' => $t->id,
                'reference' => $t->reference_number,
                'total' => (float) $t->total,
                'date' => $t->created_at->toDateTimeString(),
            ]),
        ];
    }

    private function getProductDetails(int $id): array
    {
        $product = Product::with('category:id,name')->find($id);

        if (! $product) {
            return ['error' => 'not_found', 'message' => "Product with ID {$id} not found."];
        }

        return [
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'category' => $product->category?->name,
            'cost_price' => (float) $product->cost_price,
            'selling_price' => (float) $product->selling_price,
            'wholesale_price' => (float) $product->wholesale_price,
            'stock_quantity' => (float) $product->stock_quantity,
            'low_stock_threshold' => $product->low_stock_threshold,
            'unit' => $product->unit,
            'track_inventory' => $product->track_inventory,
            'has_variants' => $product->has_variants,
            'is_active' => $product->is_active,
            'created_at' => $product->created_at->toDateTimeString(),
        ];
    }

    private function getSystemCapabilities(): array
    {
        $modules = [
            [
                'name' => 'Dashboard',
                'icon' => '📊',
                'description' => 'Real-time business overview with KPI cards, sales trend charts, recent transactions, shift summary, low stock alerts, and quick actions.',
            ],
            [
                'name' => 'POS (Point of Sale)',
                'icon' => '🛒',
                'description' => 'Complete sales terminal with product search, barcode scanning, cart management, discount application, multiple payment methods (Cash, GCash, Maya), hold/resume transactions, and thermal receipt printing.',
            ],
            [
                'name' => 'Sales & Transactions',
                'icon' => '🧾',
                'description' => 'View sales history, transaction details, void transactions, per-item void, receipt reprinting, and payment tracking.',
            ],
            [
                'name' => 'Products',
                'icon' => '📦',
                'description' => 'Manage product catalog with SKU, barcode, pricing tiers (cost, selling, wholesale), categories, variants, stock tracking, CSV import/export, and label printing.',
            ],
            [
                'name' => 'Inventory',
                'icon' => '📋',
                'description' => 'Stock in/out/adjust movements, movement history, inventory transfers between locations, stock counts (full/partial/spot) with reconciliation, and low stock alerts.',
            ],
            [
                'name' => 'Purchase Orders',
                'icon' => '🚚',
                'description' => 'Create and manage purchase orders with line items, supplier selection, product search with current stock/cost, tax/shipping, draft/send workflow, partial goods receiving, and inventory auto-update on receive.',
            ],
            [
                'name' => 'Suppliers',
                'icon' => '🏭',
                'description' => 'Manage supplier information including contact details, tax IDs, and purchase history.',
            ],
            [
                'name' => 'Customers',
                'icon' => '👥',
                'description' => 'Customer profiles with purchase history, visit tracking, loyalty points, tier system (Regular/Silver/Gold/Platinum), and rewards management.',
            ],
            [
                'name' => 'Expenses',
                'icon' => '💸',
                'description' => 'Record and categorize business expenses with receipt image upload, expense categories, and expense analytics dashboard.',
            ],
            [
                'name' => 'Reports & Analytics',
                'icon' => '📈',
                'description' => 'Sales reports with revenue trends, payment breakdown, cashier performance, product/category performance, inventory health, profit & loss, and advanced analytics dashboard.',
            ],
            [
                'name' => 'Promotions',
                'icon' => '🏷️',
                'description' => 'Create percentage, fixed amount, BOGO, buy X get Y, category discount, and happy hour promotions with date ranges, usage limits, and coupon codes.',
            ],
            [
                'name' => 'Shift Management',
                'icon' => '🔄',
                'description' => 'Open/close cashier shifts with opening/closing balances, over/short reconciliation, and automatic held transaction cleanup on shift close.',
            ],
            [
                'name' => 'Barcode & Labels',
                'icon' => '🏷️',
                'description' => 'Design and print barcode labels, price tags, and shelf tags with Code128, EAN-13, or QR barcodes.',
            ],
            [
                'name' => 'Users & Roles',
                'icon' => '👤',
                'description' => 'User management with role-based access control (Owner, Manager, Cashier), configurable permissions per role, and role cloning.',
            ],
            [
                'name' => 'Activity Logs',
                'icon' => '📝',
                'description' => 'Full audit trail of all system actions including creates, updates, deletes with before/after values, IP tracking, and user attribution.',
            ],
            [
                'name' => 'Backups',
                'icon' => '💾',
                'description' => 'Manual and scheduled database backups with download and restore capabilities.',
            ],
            [
                'name' => 'Settings',
                'icon' => '⚙️',
                'description' => 'Store information, receipt configuration (width, logo, tax display), tax rates, currency, deployment settings, and knowledge base management.',
            ],
            [
                'name' => 'AI Assistant',
                'icon' => '🤖',
                'description' => 'AI-powered business copilot that can answer questions about sales, inventory, customers, expenses, review invoices, provide insights, and guide you through system features using natural language.',
            ],
        ];

        $toolList = [
            'getSalesOverview' => 'Retrieve sales metrics for today, this week, or this month including total revenue, transaction count, average sale, and best seller.',
            'getTopProducts' => 'View top selling products by quantity sold.',
            'getLowStockProducts' => 'List products that are low on stock and need reordering.',
            'getOutOfStockProducts' => 'List products that are completely out of stock.',
            'getInventoryValue' => 'Get total inventory value at cost and retail prices.',
            'getExpensesToday' => 'View today\'s total expenses.',
            'getExpensesThisMonth' => 'View this month\'s expenses and count.',
            'getExpenseBreakdown' => 'Get expense breakdown by category.',
            'getTopCustomers' => 'View top customers by total purchases.',
            'getCustomerCount' => 'Get total number of active customers.',
            'getInvoiceByNumber' => 'Look up a transaction by invoice/reference number.',
            'getTransactionDetails' => 'Get full transaction details including items, payments, profit, and anomaly detection.',
            'getCustomerDetails' => 'View customer profile with purchase history and loyalty info.',
            'getProductDetails' => 'Get product details including stock levels and pricing.',
            'searchKnowledgeBase' => 'Search the knowledge base for help articles about system features.',
        ];

        return [
            'modules' => $modules,
            'assistant_tools' => $toolList,
            'total_modules' => count($modules),
        ];
    }

    private function searchKnowledge(string $query): array
    {
        $articles = KnowledgeArticle::where('is_active', true)->get();
        $results = [];

        foreach ($articles as $article) {
            $score = 0;
            $q = strtolower($query);
            if (str_contains(strtolower($article->title), $q)) {
                $score += 2;
            }
            if ($article->keywords && str_contains(strtolower($article->keywords), $q)) {
                $score += 1;
            }
            if (str_contains(strtolower($article->content), $q)) {
                $score += 0.5;
            }

            if ($score > 0) {
                $results[] = ['title' => $article->title, 'content' => substr($article->content, 0, 500), 'relevance' => $score];
            }
        }

        usort($results, fn ($a, $b) => $b['relevance'] <=> $a['relevance']);

        return array_slice($results, 0, 3);
    }

    private function fallbackResponse(array $messages): array
    {
        return [
            'response' => "I'm having trouble connecting to my AI engine right now. You can try again in a moment, or check your internet connection. Your conversation has been saved.",
            'suggestions' => ['Sales Today', 'Low Stock Items', 'Help'],
        ];
    }
}
