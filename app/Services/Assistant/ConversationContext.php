<?php

namespace App\Services\Assistant;

use Illuminate\Support\Facades\Session;

class ConversationContext
{
    public function set(string $key, mixed $value): void
    {
        $context = Session::get('assistant_context', []);
        $context[$key] = $value;
        Session::put('assistant_context', $context);
    }

    public function get(string $key, mixed $default = null): mixed
    {
        $context = Session::get('assistant_context', []);

        return $context[$key] ?? $default;
    }

    public function all(): array
    {
        return Session::get('assistant_context', []);
    }

    public function clear(): void
    {
        Session::forget('assistant_context');
    }

    public function updateFromIntent(string $intent, array $entities, ?string $page = null): void
    {
        $this->set('last_intent', $intent);
        $this->set('last_entities', $entities);
        if ($page) {
            $this->set('last_page', $page);
        }
        $history = $this->get('recent_intents', []);
        array_unshift($history, $intent);
        $this->set('recent_intents', array_slice($history, 0, 5));
    }
}
