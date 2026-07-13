import { TrendingUp, TrendingDown, Package, Users, DollarSign, ShoppingCart, AlertTriangle, Target, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { Separator } from '@/components/ui/separator';

/* ─── KPI / Sales Response ─── */
export function KpiCards({ items, columns = 4 }: { items: { label: string; value: string; icon?: string; trend?: string; color?: string }[]; columns?: number }) {
    const iconMap: Record<string, any> = { DollarSign, ShoppingCart, TrendingUp, Package, Users, AlertTriangle, Target, Clock };
    return (
        <div className="space-y-3 my-3">
            {items.map((item, i) => {
                const Icon = item.icon ? iconMap[item.icon] : null;
                return (
                    <div key={i} className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                            <p className="text-xl font-bold tracking-tight" style={item.color ? { color: item.color } : {}}>{item.value}</p>
                            {item.trend && (
                                <div className="flex items-center gap-1 mt-0.5">
                                    {item.trend.startsWith('+') ? <TrendingUp className="size-3 text-green-600" /> : <TrendingDown className="size-3 text-red-600" />}
                                    <span className={`text-xs font-medium ${item.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{item.trend}</span>
                                </div>
                            )}
                        </div>
                        {Icon && <div className="rounded-lg bg-muted p-2.5"><Icon className="size-5 text-muted-foreground/60" /></div>}
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Product Cards (Low Stock etc.) ─── */
export function ProductList({ items }: { items: { name: string; sku?: string; stock?: number; price?: number; status?: string }[] }) {
    return (
        <div className="space-y-2 my-3">
            {items.map((item, i) => (
                <div key={i} className="rounded-lg border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold">{item.name}</p>
                            {item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}
                        </div>
                        {item.price !== undefined && (
                            <span className="text-sm font-bold shrink-0">₱{Number(item.price).toFixed(2)}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        {item.stock !== undefined && (
                            <Badge variant={item.stock <= 0 ? 'destructive' : item.stock <= 10 ? 'secondary' : 'default'} className="text-xs px-2 py-0.5">
                                {item.stock} remaining
                            </Badge>
                        )}
                        {item.status && (
                            <Badge variant="outline" className="text-xs capitalize">{item.status}</Badge>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─── Customer List ─── */
export function CustomerList({ items }: { items: { name: string; email?: string; phone?: string; purchases?: number; visits?: number }[] }) {
    return (
        <div className="space-y-2 my-3">
            {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border bg-card p-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">{i + 1}</div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.email || item.phone || ''}</p>
                        </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                        {item.purchases !== undefined && <p className="text-sm font-bold">₱{Number(item.purchases).toLocaleString()}</p>}
                        {item.visits !== undefined && <p className="text-xs text-muted-foreground">{item.visits} visits</p>}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─── Alert / Low Stock Warning ─── */
export function AlertCard({ title, description, type = 'warning', actions }: { title: string; description: string; type?: 'warning' | 'danger' | 'success' | 'info'; actions?: { label: string; href: string }[] }) {
    const colors = {
        warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20',
        danger: 'bg-red-50 border-red-200 dark:bg-red-950/20',
        success: 'bg-green-50 border-green-200 dark:bg-green-950/20',
        info: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20',
    };
    return (
        <div className={`rounded-lg border p-3 my-3 ${colors[type]}`}>
            <div className="flex items-start gap-3">
                <AlertTriangle className={`size-5 mt-0.5 shrink-0 ${type === 'danger' ? 'text-red-500' : type === 'success' ? 'text-green-500' : 'text-amber-500'}`} />
                <div className="min-w-0">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs mt-1 text-muted-foreground">{description}</p>
                    {actions && actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {actions.map((a, i) => (
                                <Button key={i} size="sm" className="h-7 text-xs" asChild>
                                    <Link href={a.href}>{a.label}</Link>
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Action Buttons ─── */
export function ActionButtons({ items }: { items: { label: string; href: string; variant?: 'default' | 'outline' | 'destructive' }[] }) {
    return (
        <div className="flex flex-wrap gap-1.5 my-3">
            {items.map((item, i) => (
                <Button key={i} size="sm" variant={item.variant || 'default'} className="h-8 text-xs px-3" asChild>
                    <Link href={item.href}>{item.label}</Link>
                </Button>
            ))}
        </div>
    );
}

/* ─── Main Rich Response Renderer ─── */
export function RichResponse({ data }: { data: any }) {
    if (!data || typeof data === 'string') return null;
    return (
        <div className="space-y-1">
            {data.type === 'kpi' && <KpiCards items={data.items} columns={data.columns || 4} />}
            {data.type === 'products' && <ProductList items={data.items} />}
            {data.type === 'customers' && <CustomerList items={data.items} />}
            {data.type === 'alert' && <AlertCard title={data.title} description={data.description} type={data.alertType} actions={data.actions} />}
            {data.type === 'actions' && <ActionButtons items={data.items} />}
        </div>
    );
}
