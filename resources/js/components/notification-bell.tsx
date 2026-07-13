import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';

interface NotificationItem {
    id: number;
    type: string;
    title: string;
    body: string | null;
    link: string | null;
    read: boolean;
    created_at: string;
    created_at_raw: string;
}

export function NotificationBell() {
    const { unreadNotifications } = usePage().props as { unreadNotifications: number };
    const [open, setOpen] = useState(false);
    const [list, setList] = useState<NotificationItem[]>([]);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    async function toggle() {
        if (!open) {
            try {
                const res = await fetch('/notifications');
                const data = await res.json();
                setList(data);
            } catch {
                setList([]);
            }
        }
        setOpen(!open);
    }

    async function handleMarkRead(id: number, e: React.MouseEvent) {
        e.stopPropagation();
        try {
            await fetch(`/notifications/${id}/read`, { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]')?.getAttribute('content') ?? '' } });
            setList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch {
            // ignore
        }
    }

    async function handleMarkAllRead() {
        try {
            await fetch('/notifications/read-all', { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]')?.getAttribute('content') ?? '' } });
            setList(prev => prev.map(n => ({ ...n, read: true })));
        } catch {
            // ignore
        }
    }

    return (
        <div ref={ref} className="relative">
            <Button variant="ghost" size="icon" className="relative" onClick={toggle}>
                <Bell className="size-4" />
                {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                )}
            </Button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-80 rounded-xl border bg-card shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between border-b px-3 py-2">
                        <span className="text-sm font-semibold">Notifications</span>
                        {list.some(n => !n.read) && (
                            <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={handleMarkAllRead}>
                                Mark all read
                            </Button>
                        )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {list.length === 0 ? (
                            <p className="py-8 text-center text-xs text-muted-foreground">No notifications</p>
                        ) : (
                            <div className="divide-y">
                                {list.map(n => (
                                    <div
                                        key={n.id}
                                        className={cn(
                                            "flex items-start gap-2 px-3 py-2.5 transition-colors hover:bg-muted/50 cursor-pointer",
                                            !n.read && "bg-muted/30"
                                        )}
                                        onClick={() => {
                                            if (!n.read) handleMarkRead(n.id, {} as React.MouseEvent);
                                            if (n.link) router.visit(n.link);
                                        }}
                                    >
                                        <span className={cn(
                                            "size-2 rounded-full mt-1.5 shrink-0",
                                            n.read ? "bg-transparent" : "bg-primary"
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium leading-tight">{n.title}</p>
                                            {n.body && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{n.created_at}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
