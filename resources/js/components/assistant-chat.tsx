import {
    MessageCircle,
    X,
    Send,
    Bot,
    User,
    Sparkles,
    Loader2,
    Plus,
    Trash2,
    Pencil,
    History,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { RichResponse } from '@/components/assistant/rich-response';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    id?: number;
    streaming?: boolean;
    toolStatus?: string;
}

interface Conversation {
    id: number;
    title: string;
    created_at: string;
}

const initialSuggestions = [
    'How is my store doing?',
    'Analyze my finances this month',
    'What is my ROI?',
    'What should I improve first?',
];

const toolLabels: Record<string, string> = {
    getSalesOverview: 'Analyzing sales',
    getTopProducts: 'Finding top products',
    getLowStockProducts: 'Checking inventory',
    getOutOfStockProducts: 'Checking inventory',
    getInventoryValue: 'Calculating inventory value',
    getExpensesToday: 'Reviewing expenses',
    getExpensesThisMonth: 'Reviewing expenses',
    getExpenseBreakdown: 'Analyzing expenses',
    getTopCustomers: 'Finding top customers',
    getCustomerCount: 'Counting customers',
    getInvoiceByNumber: 'Searching invoice',
    getTransactionDetails: 'Loading transaction',
    getCustomerDetails: 'Loading customer',
    getProductDetails: 'Loading product',
    getBusinessOverview: 'Analyzing business health',
    getFinancialHealth: 'Reviewing finances',
    getRoiAnalysis: 'Calculating ROI signals',
    getDatabaseOverview: 'Reading system knowledge',
    searchKnowledgeBase: 'Searching knowledge base',
};

function getCsrfToken(): string {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || ''
    );
}

function formatMessage(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/₱([\d,]+\.\d{2})/g, '₱$1')
        .replace(/\n/g, '<br/>');
}

function parseRichContent(
    content: string,
): (string | { type: 'rich'; data: any })[] {
    const parts: (string | { type: 'rich'; data: any })[] = [];
    const regex = /<vendora-json>([\s\S]*?)<\/vendora-json>/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            parts.push(content.slice(lastIndex, match.index));
        }

        try {
            const data = JSON.parse(match[1].trim());
            parts.push({ type: 'rich', data });
        } catch {
            parts.push(match[0]);
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [content];
}

function groupConversations(conversations: Conversation[]) {
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const older: Conversation[] = [];
    const now = new Date();
    const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
    );
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);

    for (const c of conversations) {
        const d = new Date(c.created_at);

        if (d >= todayStart) {
            today.push(c);
        } else if (d >= yesterdayStart) {
            yesterday.push(c);
        } else {
            older.push(c);
        }
    }

    return { today, yesterday, older };
}

const STORAGE_KEY = 'vendora_assistant_conversation_id';

export default function AssistantChat({ hide }: { hide?: boolean }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [showSidebar, setShowSidebar] = useState(true);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [renameId, setRenameId] = useState<number | null>(null);
    const [renameTitle, setRenameTitle] = useState('');
    const [initialLoading, setInitialLoading] = useState(false);
    const [toolStatus, setToolStatus] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const initialLoadDone = useRef(false);
    const streamingContent = useRef('');
    const messageId = useRef(0);

    function scrollToBottom() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop =
                        scrollRef.current.scrollHeight;
                }
            });
        });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages, toolStatus]);

    const loadConversations = useCallback(async () => {
        const res = await fetch('/assistant/conversations');
        const data = await res.json();
        setConversations(data);

        return data;
    }, []);

    const loadConversation = useCallback(async (id: number) => {
        const res = await fetch(`/assistant/conversations/${id}`);
        const data = await res.json();
        setMessages(
            data.messages.map((m: any) => ({
                role: m.role,
                content: m.content,
                id: m.id,
            })),
        );
    }, []);

    useEffect(() => {
        if (!open || initialLoadDone.current) {
            return;
        }

        initialLoadDone.current = true;
        (async () => {
            setInitialLoading(true);
            const list = await loadConversations();
            const storedId = localStorage.getItem(STORAGE_KEY);
            const storedNum = storedId ? parseInt(storedId, 10) : null;

            if (storedNum && list.some((c: any) => c.id === storedNum)) {
                setConversationId(storedNum);
                await loadConversation(storedNum);
            } else if (list.length > 0) {
                const latest = list[0];
                setConversationId(latest.id);
                localStorage.setItem(STORAGE_KEY, String(latest.id));
                await loadConversation(latest.id);
            } else {
                const res = await fetch('/assistant/conversations', {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': getCsrfToken() },
                });
                const data = await res.json();
                setConversationId(data.id);
                localStorage.setItem(STORAGE_KEY, String(data.id));
                setConversations([data, ...list]);
            }

            setInitialLoading(false);
            scrollToBottom();
        })();
    }, [open, loadConversations, loadConversation]);

    useEffect(() => {
        if (!open) {
            initialLoadDone.current = false;
        }
    }, [open]);

    if (hide) {
        return null;
    }

    async function newChat() {
        setMessages([]);
        setConversationId(null);
        setToolStatus(null);
        localStorage.removeItem(STORAGE_KEY);
        const res = await fetch('/assistant/conversations', {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': getCsrfToken() },
        });
        const data = await res.json();
        setConversationId(data.id);
        localStorage.setItem(STORAGE_KEY, String(data.id));
        setConversations((prev) => [data, ...prev]);
    }

    async function switchConversation(id: number) {
        if (id === conversationId) {
            return;
        }

        setConversationId(id);
        setToolStatus(null);
        localStorage.setItem(STORAGE_KEY, String(id));
        await loadConversation(id);
        scrollToBottom();
    }

    async function sendMessage(msg: string) {
        if (!msg.trim() || loading) {
            return;
        }

        setInput('');
        setToolStatus(null);

        setMessages((prev) => [...prev, { role: 'user', content: msg }]);
        setLoading(true);

        streamingContent.current = '';
        let hasStreamedContent = false;
        let streamCompleted = false;
        const msgId = --messageId.current;

        try {
            const res = await fetch('/assistant/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    message: msg,
                    conversation_id: conversationId,
                    current_page: window.location.pathname,
                }),
            });

            const reader = res.body?.getReader();

            if (!reader) {
                throw new Error('No reader');
            }

            const decoder = new TextDecoder();
            let buffer = '';
            let currentEvent = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split('\n\n');
                buffer = parts.pop() || '';

                for (const block of parts) {
                    const lines = block.split('\n');
                    currentEvent = '';

                    for (const line of lines) {
                        if (line.startsWith('event: ')) {
                            currentEvent = line.slice(7).trim();
                        }
                    }

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) {
                            continue;
                        }

                        const jsonStr = line.slice(6);

                        try {
                            const payload = JSON.parse(jsonStr);

                            if (currentEvent === 'text') {
                                streamingContent.current += payload.content;
                                hasStreamedContent = true;
                                setMessages((prev) => {
                                    const copy = [...prev];
                                    const idx = copy.findIndex(
                                        (m) => m.id === msgId,
                                    );

                                    if (idx >= 0) {
                                        copy[idx] = {
                                            ...copy[idx],
                                            content: streamingContent.current,
                                        };
                                    } else {
                                        copy.push({
                                            role: 'assistant',
                                            content: streamingContent.current,
                                            streaming: true,
                                            id: msgId,
                                        });
                                    }

                                    return copy;
                                });
                            } else if (currentEvent === 'tool_start') {
                                setToolStatus(
                                    toolLabels[payload.name] || 'Processing...',
                                );
                            } else if (currentEvent === 'tool_end') {
                                setToolStatus(null);
                            } else if (currentEvent === 'done') {
                                streamCompleted = true;
                                setConversationId(payload.conversation_id);
                                localStorage.setItem(
                                    STORAGE_KEY,
                                    String(payload.conversation_id),
                                );
                                const finalContent =
                                    streamingContent.current ||
                                    "I couldn't generate a response. Please try again.";
                                setMessages((prev) => {
                                    const copy = [...prev];
                                    const idx = copy.findIndex(
                                        (m) => m.id === msgId,
                                    );

                                    if (idx >= 0) {
                                        copy[idx] = {
                                            role: 'assistant',
                                            content: finalContent,
                                            streaming: false,
                                        };
                                    } else {
                                        copy.push({
                                            role: 'assistant',
                                            content: finalContent,
                                        });
                                    }

                                    return copy;
                                });
                            }
                        } catch {
                            // Ignore malformed SSE chunks and keep streaming.
                        }
                    }
                }
            }
        } catch {
            if (!hasStreamedContent) {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content:
                            'Sorry, I encountered an error. Please try again.',
                    },
                ]);
            }
        }

        // Finalize any still-streaming message if stream ended without done event
        if (!streamCompleted) {
            setMessages((prev) => {
                const finalContent =
                    streamingContent.current ||
                    'Sorry, I encountered an error. Please try again.';
                const copy = [...prev];
                const idx = copy.findIndex((m) => m.id === msgId);

                if (idx >= 0) {
                    copy[idx] = {
                        role: 'assistant',
                        content: finalContent,
                        streaming: false,
                    };
                }

                return copy;
            });
        }

        setLoading(false);
        setToolStatus(null);
        scrollToBottom();

        // Refresh conversation list after message completes
        const list = await loadConversations();
        setConversations(list);
    }

    async function confirmDelete() {
        if (!deleteId) {
            return;
        }

        await fetch(`/assistant/conversations/${deleteId}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': getCsrfToken() },
        });
        const list = conversations.filter((c) => c.id !== deleteId);
        setConversations(list);

        if (deleteId === conversationId) {
            if (list.length > 0) {
                await switchConversation(list[0].id);
            } else {
                setMessages([]);
                setConversationId(null);
                localStorage.removeItem(STORAGE_KEY);
                const res = await fetch('/assistant/conversations', {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': getCsrfToken() },
                });
                const data = await res.json();
                setConversationId(data.id);
                localStorage.setItem(STORAGE_KEY, String(data.id));
                setConversations([data]);
            }
        }

        setDeleteId(null);
    }

    async function confirmRename() {
        if (!renameId || !renameTitle.trim()) {
            return;
        }

        await fetch(`/assistant/conversations/${renameId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
            },
            body: JSON.stringify({ title: renameTitle.trim() }),
        });
        setConversations((prev) =>
            prev.map((c) =>
                c.id === renameId ? { ...c, title: renameTitle.trim() } : c,
            ),
        );
        setRenameId(null);
        setRenameTitle('');
    }

    const grouped = groupConversations(conversations);

    return (
        <>
            {!open && (
                <Button
                    onClick={() => setOpen(true)}
                    className="fixed right-6 bottom-6 z-50 size-14 rounded-full bg-primary shadow-lg hover:bg-primary/90"
                    size="icon"
                >
                    <MessageCircle className="size-6 text-primary-foreground" />
                </Button>
            )}
            {open && (
                <div className="fixed right-6 bottom-6 z-50 flex h-[600px] max-h-[calc(100vh-8rem)] w-[720px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-card shadow-xl">
                    <div
                        className={cn(
                            'flex w-56 shrink-0 flex-col border-r bg-muted/20 transition-all',
                            showSidebar ? 'block' : 'hidden',
                        )}
                    >
                        <div className="border-b p-2">
                            <Button
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={newChat}
                            >
                                <Plus className="size-3.5" /> New chat
                            </Button>
                        </div>
                        <div className="flex-1 space-y-0.5 overflow-y-auto p-1.5">
                            {grouped.today.length > 0 && (
                                <div>
                                    <p className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        Today
                                    </p>
                                    {grouped.today.map((c) => (
                                        <ConversationItem
                                            key={c.id}
                                            conversation={c}
                                            active={c.id === conversationId}
                                            onSelect={() =>
                                                switchConversation(c.id)
                                            }
                                            onDelete={() => setDeleteId(c.id)}
                                            onRename={() => {
                                                setRenameId(c.id);
                                                setRenameTitle(c.title);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                            {grouped.yesterday.length > 0 && (
                                <div>
                                    <p className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        Yesterday
                                    </p>
                                    {grouped.yesterday.map((c) => (
                                        <ConversationItem
                                            key={c.id}
                                            conversation={c}
                                            active={c.id === conversationId}
                                            onSelect={() =>
                                                switchConversation(c.id)
                                            }
                                            onDelete={() => setDeleteId(c.id)}
                                            onRename={() => {
                                                setRenameId(c.id);
                                                setRenameTitle(c.title);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                            {grouped.older.length > 0 && (
                                <div>
                                    <p className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                        Older
                                    </p>
                                    {grouped.older.map((c) => (
                                        <ConversationItem
                                            key={c.id}
                                            conversation={c}
                                            active={c.id === conversationId}
                                            onSelect={() =>
                                                switchConversation(c.id)
                                            }
                                            onDelete={() => setDeleteId(c.id)}
                                            onRename={() => {
                                                setRenameId(c.id);
                                                setRenameTitle(c.title);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 shrink-0"
                                    onClick={() => setShowSidebar(!showSidebar)}
                                >
                                    <History className="size-3.5" />
                                </Button>
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary">
                                    <Bot className="size-3.5 text-primary-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">
                                        Vendora Assistant
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Ask me anything
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0"
                                onClick={() => setOpen(false)}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>

                        <div
                            ref={scrollRef}
                            className="flex-1 space-y-3 overflow-y-auto p-4"
                        >
                            {!initialLoading && messages.length === 0 && (
                                <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                                        <Sparkles className="size-6 text-primary" />
                                    </div>
                                    <p className="text-sm font-medium">
                                        Hi! I'm your Vendora assistant.
                                    </p>
                                    <p className="max-w-xs text-xs text-muted-foreground">
                                        Ask me about sales, inventory, expenses,
                                        ROI, finances, or how to improve the
                                        store.
                                    </p>
                                </div>
                            )}
                            {messages.map((m, i) => (
                                <div key={m.id || i}>
                                    <div
                                        className={cn(
                                            'mb-1 flex gap-2',
                                            m.role === 'user'
                                                ? 'justify-end'
                                                : 'justify-start',
                                        )}
                                    >
                                        {m.role === 'assistant' && (
                                            <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                                <Bot className="size-3.5 text-primary" />
                                            </div>
                                        )}
                                        <div
                                            className={cn(
                                                'max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed',
                                                m.role === 'user'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'border bg-card shadow-sm',
                                            )}
                                        >
                                            {m.role === 'assistant' ? (
                                                <>
                                                    {parseRichContent(
                                                        m.content,
                                                    ).map((part, idx) =>
                                                        typeof part ===
                                                        'string' ? (
                                                            <div
                                                                key={idx}
                                                                dangerouslySetInnerHTML={{
                                                                    __html: formatMessage(
                                                                        part,
                                                                    ),
                                                                }}
                                                            />
                                                        ) : (
                                                            <div
                                                                key={idx}
                                                                className="my-1"
                                                            >
                                                                <RichResponse
                                                                    data={
                                                                        part.data
                                                                    }
                                                                />
                                                            </div>
                                                        ),
                                                    )}
                                                    {m.streaming && (
                                                        <span
                                                            className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-foreground/60"
                                                            style={{
                                                                animationDuration:
                                                                    '0.8s',
                                                            }}
                                                        />
                                                    )}
                                                </>
                                            ) : (
                                                <div
                                                    dangerouslySetInnerHTML={{
                                                        __html: formatMessage(
                                                            m.content,
                                                        ),
                                                    }}
                                                />
                                            )}
                                        </div>
                                        {m.role === 'user' && (
                                            <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary">
                                                <User className="size-3.5 text-primary-foreground" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {toolStatus && (
                                <div className="ml-9 flex animate-pulse items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="size-3 animate-spin" />
                                    {toolStatus}...
                                </div>
                            )}
                            {!loading && messages.length === 0 && (
                                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                                    {initialSuggestions.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => sendMessage(s)}
                                            className="inline-flex items-center rounded-md border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-foreground/30 hover:bg-muted"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="shrink-0 border-t p-3">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    sendMessage(input);
                                }}
                                className="flex gap-2"
                            >
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your question..."
                                    className="flex-1"
                                    disabled={loading}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={loading || !input.trim()}
                                >
                                    {loading ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Send className="size-4" />
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={() => setDeleteId(null)}
                title="Delete Conversation"
                description="Are you sure?"
                onConfirm={confirmDelete}
            />

            {renameId !== null && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
                    onClick={() => setRenameId(null)}
                >
                    <div
                        className="w-80 rounded-lg border bg-card p-4 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="mb-3 text-sm font-semibold">
                            Rename conversation
                        </p>
                        <Input
                            value={renameTitle}
                            onChange={(e) => setRenameTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    confirmRename();
                                }

                                if (e.key === 'Escape') {
                                    setRenameId(null);
                                }
                            }}
                            autoFocus
                        />
                        <div className="mt-3 flex justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRenameId(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={confirmRename}
                                disabled={!renameTitle.trim()}
                            >
                                Rename
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function ConversationItem({
    conversation,
    active,
    onSelect,
    onDelete,
    onRename,
}: {
    conversation: Conversation;
    active: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onRename: () => void;
}) {
    return (
        <div
            className={cn(
                'group flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
                active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-muted',
            )}
            onClick={onSelect}
        >
            <span className="flex-1 truncate text-xs">
                {conversation.title}
            </span>
            <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRename();
                    }}
                    className="flex size-5 items-center justify-center rounded hover:bg-muted-foreground/20"
                >
                    <Pencil className="size-3" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="flex size-5 items-center justify-center rounded hover:bg-destructive/20"
                >
                    <Trash2 className="size-3 text-destructive" />
                </button>
            </div>
        </div>
    );
}
