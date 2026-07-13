<?php

namespace App\Services\Assistant;

class IntentEngine
{
    private array $stopWords = [
        'what', 'are', 'my', 'can', 'you', 'please', 'show', 'tell', 'me',
        'the', 'a', 'an', 'is', 'it', 'of', 'to', 'do', 'does', 'did',
        'how', 'much', 'many', 'i', 'we', 'they', 'he', 'she', 'this',
        'that', 'these', 'those', 'some', 'any', 'all', 'your', 'our',
        'there', 'their', 'them', 'with', 'for', 'from', 'has', 'have',
        'had', 'been', 'being', 'will', 'would', 'could', 'should', 'may',
        'might', 'shall', 'about', 'into', 'over', 'such', 'than', 'then',
        'also', 'just', 'very', 'too', 'not', 'no', 'nor', 'but', 'or',
        'and', 'if', 'so', 'up', 'out', 'on', 'off', 'in', 'at', 'by',
        'be', 'was', 'were', 'am', 'been',
    ];

    private array $intents = [];

    public function __construct()
    {
        $this->intents = [
            'GREETING' => [
                'patterns' => ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'howdy'],
                'priority' => 90,
            ],
            'SMALL_TALK' => [
                'patterns' => [
                    'how are you', 'how\'s it going', 'what\'s up', 'nice to meet',
                    'thank you', 'thanks', 'who are you', 'what can you do',
                    'how are you doing', 'good to see you',
                ],
                'priority' => 80,
            ],
            'SALES_TODAY' => [
                'patterns' => [
                    'sales today', 'today sales', 'revenue today', 'today revenue',
                    'sold today', 'earnings today', 'income today',
                    'how many sales today', 'sales for today',
                ],
                'priority' => 95,
            ],
            'SALES_WEEK' => [
                'patterns' => [
                    'sales this week', 'this week sales', 'weekly sales',
                    'revenue this week', 'week revenue', 'earnings this week',
                ],
                'priority' => 95,
            ],
            'SALES_MONTH' => [
                'patterns' => [
                    'sales this month', 'this month sales', 'monthly sales',
                    'monthly revenue', 'revenue this month', 'earnings this month',
                    'sales for this month',
                ],
                'priority' => 95,
            ],
            'TOP_PRODUCTS' => [
                'patterns' => [
                    'top products', 'best selling', 'top selling', 'popular products',
                    'best products', 'top items', 'most sold', 'fastest moving',
                    'product ranking', 'top sellers', 'best seller',
                    'best selling products', 'top selling items',
                ],
                'priority' => 90,
            ],
            'AVERAGE_TRANSACTION' => [
                'patterns' => [
                    'average transaction', 'average sale', 'average order',
                    'average order value', 'average basket', 'avg transaction',
                    'average sale value', 'avg sale', 'typical order',
                    'average receipt', 'average ticket',
                ],
                'priority' => 90,
            ],
            'LOW_STOCK' => [
                'patterns' => [
                    'low stock', 'low inventory', 'stock alert', 'reorder',
                    'running low', 'almost out', 'need restock', 'low on stock',
                    'stock running low', 'inventory low',
                ],
                'priority' => 95,
            ],
            'OUT_OF_STOCK' => [
                'patterns' => [
                    'out of stock', 'no stock', 'zero stock', 'stockout',
                    'stock out', 'sold out', 'unavailable', 'out stock',
                ],
                'priority' => 95,
            ],
            'INVENTORY_VALUE' => [
                'patterns' => [
                    'inventory value', 'stock value', 'total inventory', 'inventory worth',
                    'value of inventory', 'stock worth', 'inventory cost',
                    'how much inventory', 'total stock value',
                ],
                'priority' => 90,
            ],
            'TOP_CUSTOMERS' => [
                'patterns' => [
                    'top customers', 'best customers', 'biggest customers',
                    'top clients', 'most valuable', 'best clients',
                    'highest spending customers',
                ],
                'priority' => 90,
            ],
            'CUSTOMER_LIST' => [
                'patterns' => [
                    'show customers', 'customer list', 'list customers',
                    'show all customers', 'all customers', 'customer records',
                    'customer directory', 'view customers',
                ],
                'priority' => 90,
            ],
            'CUSTOMER_COUNT' => [
                'patterns' => [
                    'how many customers', 'customer count', 'total customers',
                    'number of customers', 'customers total',
                ],
                'priority' => 90,
            ],
            'EXPENSES_TODAY' => [
                'patterns' => [
                    'expenses today', 'today expenses', 'spent today',
                    'today spending', 'costs today', 'expenses for today',
                ],
                'priority' => 95,
            ],
            'EXPENSES_MONTH' => [
                'patterns' => [
                    'expenses this month', 'monthly expenses', 'this month spending',
                    'spending this month', 'monthly spending',
                    'expenses for this month', 'how much spent this month',
                ],
                'priority' => 95,
            ],
            'LARGEST_EXPENSE' => [
                'patterns' => [
                    'largest expense', 'biggest expense', 'highest expense',
                    'most expensive', 'top expense', 'biggest cost',
                ],
                'priority' => 90,
            ],
            'EXPENSE_BREAKDOWN' => [
                'patterns' => [
                    'expense breakdown', 'expense categories', 'spending by category',
                    'expense distribution', 'category spending',
                ],
                'priority' => 90,
            ],
            'KNOWLEDGE_STOCK' => [
                'patterns' => [
                    'what is stock count', 'explain stock count', 'how stock count works',
                    'inventory count help', 'physical inventory', 'stock count help',
                ],
                'priority' => 85,
            ],
            'KNOWLEDGE_PO' => [
                'patterns' => [
                    'purchase order', 'how to order', 'create purchase order',
                    'what is purchase order', 'po process', 'ordering help',
                ],
                'priority' => 85,
            ],
            'KNOWLEDGE_SALE' => [
                'patterns' => [
                    'how to create a sale', 'make a sale', 'process sale',
                    'how to sell', 'create transaction', 'how to make a sale',
                ],
                'priority' => 85,
            ],
            'KNOWLEDGE_REPORT' => [
                'patterns' => [
                    'how reports work', 'explain reports', 'what are reports',
                    'view reports', 'analytics help', 'report help',
                ],
                'priority' => 85,
            ],
            'KNOWLEDGE_EXPENSE' => [
                'patterns' => [
                    'how expenses work', 'record expense', 'add expense',
                    'what are expenses', 'expense help',
                ],
                'priority' => 85,
            ],
            'HELP' => [
                'patterns' => [
                    'help', 'what can you do', 'how to use', 'assistant help',
                    'capabilities', 'commands', 'features', 'guide',
                    'what do you do', 'help me',
                ],
                'priority' => 80,
            ],
            'EXPLAIN_PAGE' => [
                'patterns' => [
                    'explain this page', 'what is this page', 'page overview',
                    'what does this page do', 'explain dashboard',
                ],
                'priority' => 85,
            ],
        ];
    }

    public function detect(string $message): array
    {
        $original = $message;
        $normalized = $this->normalize($message);

        $results = [];

        foreach ($this->intents as $intent => $config) {
            $score = $this->calculateScore($normalized, $config['patterns']);
            if ($score > 0) {
                $results[] = [
                    'intent' => $intent,
                    'score' => round($score * $config['priority'] / 100, 4),
                    'priority' => $config['priority'],
                ];
            }
        }

        usort($results, fn ($a, $b) => $b['score'] <=> $a['score']);

        $top = $results[0] ?? null;
        $confidence = $top ? round(min($top['score'] * 100, 99)) : 0;

        $entities = $this->extractEntities($normalized);

        return [
            'original' => $original,
            'normalized' => $normalized,
            'intent' => $top ? $this->mapIntent($top['intent']) : 'UNKNOWN',
            'raw_intent' => $top['intent'] ?? 'UNKNOWN',
            'confidence' => $confidence,
            'entities' => $entities,
            'alternatives' => array_slice(array_map(fn ($r) => $r['intent'], $results), 1, 3),
        ];
    }

    private function normalize(string $message): string
    {
        // Convert to lowercase
        $msg = strtolower(trim($message));

        // Remove punctuation
        $msg = preg_replace('/[^\w\s@]/u', '', $msg);

        // Remove stop words
        $words = explode(' ', $msg);
        $filtered = array_filter($words, fn ($word) => ! in_array($word, $this->stopWords) && strlen(trim($word)) > 0);
        $msg = implode(' ', $filtered);

        // Trim multiple spaces
        $msg = preg_replace('/\s+/', ' ', $msg);

        return trim($msg);
    }

    private function calculateScore(string $normalized, array $patterns): float
    {
        $best = 0;

        foreach ($patterns as $pattern) {
            // Exact normalized match
            if ($normalized === $pattern) {
                return 1.0;
            }

            // Contains match (pattern is a substring of normalized)
            if (str_contains($normalized, $pattern)) {
                $score = strlen($pattern) / max(strlen($normalized), 1);
                $best = max($best, $score);
            }

            // Word overlap scoring
            $normWords = explode(' ', $normalized);
            $patWords = explode(' ', $pattern);
            $matches = 0;

            foreach ($patWords as $pw) {
                if (in_array($pw, $normWords)) {
                    $matches++;
                }
            }

            if (count($patWords) > 0) {
                $wordScore = $matches / count($patWords);

                // Bonus for matching all significant words
                if ($matches === count($patWords) && count($patWords) >= 2) {
                    $wordScore *= 1.2;
                }

                $best = max($best, $wordScore);
            }
        }

        return min($best, 1.0);
    }

    private function extractEntities(string $message): array
    {
        $entities = [];

        if (preg_match('/top\s+(\d+)/i', $message, $m)) {
            $entities['limit'] = (int) $m[1];
        }

        if (str_contains($message, 'today')) {
            $entities['period'] = 'today';
        }
        if (str_contains($message, 'this week') || str_contains($message, 'weekly')) {
            $entities['period'] = 'week';
        }
        if (str_contains($message, 'this month') || str_contains($message, 'monthly')) {
            $entities['period'] = 'month';
        }
        if (str_contains($message, 'this year') || str_contains($message, 'yearly')) {
            $entities['period'] = 'year';
        }

        return $entities;
    }

    private function mapIntent(string $raw): string
    {
        $map = [
            'GREETING' => 'GREETING', 'SMALL_TALK' => 'SMALL_TALK',
            'SALES_TODAY' => 'SALES_TODAY', 'SALES_WEEK' => 'SALES_WEEK', 'SALES_MONTH' => 'SALES_MONTH',
            'TOP_PRODUCTS' => 'TOP_PRODUCTS', 'AVERAGE_TRANSACTION' => 'AVERAGE_TRANSACTION',
            'LOW_STOCK' => 'LOW_STOCK', 'OUT_OF_STOCK' => 'OUT_OF_STOCK', 'INVENTORY_VALUE' => 'INVENTORY_VALUE',
            'TOP_CUSTOMERS' => 'TOP_CUSTOMERS', 'CUSTOMER_LIST' => 'CUSTOMER_LIST', 'CUSTOMER_COUNT' => 'CUSTOMER_COUNT',
            'EXPENSES_TODAY' => 'EXPENSES_TODAY', 'EXPENSES_MONTH' => 'EXPENSES_MONTH',
            'LARGEST_EXPENSE' => 'LARGEST_EXPENSE', 'EXPENSE_BREAKDOWN' => 'EXPENSE_BREAKDOWN',
            'KNOWLEDGE_STOCK' => 'KNOWLEDGE_STOCK', 'KNOWLEDGE_PO' => 'KNOWLEDGE_PO',
            'KNOWLEDGE_SALE' => 'KNOWLEDGE_SALE', 'KNOWLEDGE_REPORT' => 'KNOWLEDGE_REPORT',
            'KNOWLEDGE_EXPENSE' => 'KNOWLEDGE_EXPENSE',
            'HELP' => 'HELP', 'EXPLAIN_PAGE' => 'EXPLAIN_PAGE',
        ];

        return $map[$raw] ?? 'UNKNOWN';
    }
}
