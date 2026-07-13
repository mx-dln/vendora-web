<?php

namespace App\Http\Controllers;

use App\Models\AssistantConversation;
use App\Models\KnowledgeArticle;
use App\Services\Assistant\OpenAIAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AssistantController extends Controller
{
    public function __construct(
        protected OpenAIAssistantService $assistantService,
    ) {}

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'conversation_id' => ['nullable', 'exists:assistant_conversations,id'],
            'current_page' => ['nullable', 'string', 'max:255'],
        ]);

        $result = $this->assistantService->chat(
            $validated['message'],
            $validated['conversation_id'] ?? null,
            $validated['current_page'] ?? null,
        );

        return response()->json($result);
    }

    public function chatStream(Request $request): StreamedResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'conversation_id' => ['nullable', 'exists:assistant_conversations,id'],
            'current_page' => ['nullable', 'string', 'max:255'],
        ]);

        return $this->assistantService->chatStream(
            $validated['message'],
            $validated['conversation_id'] ?? null,
            $validated['current_page'] ?? null,
        );
    }

    public function conversations(): JsonResponse
    {
        $conversations = AssistantConversation::where('user_id', Auth::id())
            ->latest()
            ->get(['id', 'title', 'created_at']);

        return response()->json($conversations);
    }

    public function storeConversation(): JsonResponse
    {
        $conversation = AssistantConversation::create([
            'user_id' => Auth::id(),
            'title' => 'New chat',
        ]);

        return response()->json([
            'id' => $conversation->id,
            'title' => $conversation->title,
            'created_at' => $conversation->created_at,
        ]);
    }

    public function showConversation(AssistantConversation $assistantConversation): JsonResponse
    {
        if ($assistantConversation->user_id !== Auth::id()) {
            abort(403);
        }

        $messages = $assistantConversation->messages()
            ->get(['id', 'role', 'content', 'created_at']);

        return response()->json([
            'conversation' => $assistantConversation,
            'messages' => $messages,
        ]);
    }

    public function updateConversation(Request $request, AssistantConversation $assistantConversation): JsonResponse
    {
        if ($assistantConversation->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        $assistantConversation->update($validated);

        return response()->json($assistantConversation);
    }

    public function destroyConversation(AssistantConversation $assistantConversation): JsonResponse
    {
        if ($assistantConversation->user_id !== Auth::id()) {
            abort(403);
        }

        $assistantConversation->delete();

        return response()->json(['success' => true]);
    }

    public function knowledgeData(): JsonResponse
    {
        $articles = KnowledgeArticle::orderBy('category')->orderBy('title')->get([
            'id', 'title', 'category', 'keywords', 'content', 'is_active', 'updated_at',
        ]);

        return response()->json($articles);
    }

    public function knowledgeStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'keywords' => ['nullable', 'string', 'max:500'],
            'content' => ['required', 'string'],
        ]);

        $validated['slug'] = Str::slug($validated['title']).'-'.Str::random(4);

        $article = KnowledgeArticle::create($validated);

        return response()->json($article);
    }

    public function knowledgeUpdate(Request $request, KnowledgeArticle $knowledgeArticle): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'keywords' => ['nullable', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'is_active' => ['boolean'],
        ]);

        $knowledgeArticle->update($validated);

        return response()->json($knowledgeArticle);
    }

    public function knowledgeDestroy(KnowledgeArticle $knowledgeArticle): JsonResponse
    {
        $knowledgeArticle->delete();

        return response()->json(['success' => true]);
    }
}
