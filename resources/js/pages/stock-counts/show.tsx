import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { ArrowLeft, Play, Save, CheckCircle, Trash2, Search, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/page-header';
import type { StockCount } from '@/types';

interface Props {
    count: StockCount;
    reconcilerName?: string;
}

export default function StockCountsShow({ count, reconcilerName }: Props) {
    const [items, setItems] = useState(count.items || []);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);

    const filtered = items.filter((item: any) =>
        item.product?.name?.toLowerCase().includes(search.toLowerCase())
    );

    function updateCounted(itemId: number, value: string) {
        setItems((prev: any[]) => prev.map(item => {
            if (item.id !== itemId) return item;
            const counted = value === '' ? null : parseFloat(value);
            const expected = parseFloat(item.expected_qty || 0);
            const diff = counted !== null ? counted - expected : 0;
            return { ...item, counted_qty: counted, difference_qty: diff };
        }));
    }

    function saveProgress() {
        setSaving(true);
        router.post(`/stock-counts/${count.id}/save`, {
            items: items.map((item: any) => ({
                id: item.id,
                counted_qty: item.counted_qty,
            })),
        }, {
            onSuccess: () => { toast.success('Progress saved'); setSaving(false); },
            onError: () => { toast.error('Failed to save'); setSaving(false); },
            onFinish: () => setSaving(false),
        });
    }

    const canCount = count.status === 'draft' || count.status === 'counting';
    const canReconcile = count.status === 'counting';
    const isReconciled = count.status === 'reconciled';

    return (
        <>
            <Head title={`Stock Count ${count.reference_number}`} />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{count.reference_number}</h1>
                            <Badge className="capitalize text-xs" variant={
                                count.status === 'draft' ? 'secondary' :
                                count.status === 'counting' ? 'default' :
                                count.status === 'reconciled' ? 'default' : 'outline'
                            }>{count.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Created by {count.user?.name} · {new Date(count.created_at).toLocaleString()}
                            {count.type === 'full' ? ' · Full Count' : ' · Spot Count'}
                        </p>
                        {count.notes && <p className="text-sm mt-1">{count.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/stock-counts"><ArrowLeft className="mr-1 size-3" /> Back</Link>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {count.status === 'draft' && (
                        <Button onClick={() => router.post(`/stock-counts/${count.id}/start`)}>
                            <Play className="mr-1 size-4" /> Start Counting
                        </Button>
                    )}
                    {canCount && (
                        <Button variant="outline" onClick={saveProgress} disabled={saving}>
                            <Save className="mr-1 size-4" /> {saving ? 'Saving...' : 'Save Progress'}
                        </Button>
                    )}
                    {canReconcile && (
                        <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => {
                            if (confirm('Reconcile inventory? This will update stock levels based on counted quantities.')) {
                                router.post(`/stock-counts/${count.id}/reconcile`);
                            }
                        }}>
                            <CheckCircle className="mr-1 size-4" /> Reconcile Inventory
                        </Button>
                    )}
                    {count.status === 'draft' && (
                        <Button variant="destructive" onClick={() => {
                            if (confirm('Delete this stock count?')) {
                                router.delete(`/stock-counts/${count.id}`);
                            }
                        }}>
                            <Trash2 className="mr-1 size-4" /> Delete
                        </Button>
                    )}
                </div>

                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Items</p><p className="text-lg font-bold">{items.length}</p></CardContent></Card>
                    <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Counted</p><p className="text-lg font-bold">{items.filter((i: any) => i.counted_qty !== null && i.counted_qty !== undefined).length}</p></CardContent></Card>
                    <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Differences</p><p className="text-lg font-bold">{items.filter((i: any) => parseFloat(i.difference_qty || 0) !== 0).length}</p></CardContent></Card>
                    <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Status</p><p className="text-lg font-bold capitalize">{count.status}</p></CardContent></Card>
                </div>

                {canCount && (
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search products..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                )}

                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3 font-medium">Product</th>
                                    <th className="px-4 py-3 font-medium">SKU</th>
                                    <th className="px-4 py-3 text-right font-medium">Current Stock</th>
                                    <th className="px-4 py-3 text-right font-medium">Counted Qty</th>
                                    <th className="px-4 py-3 text-right font-medium">Difference</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item: any) => {
                                    const diff = parseFloat(item.difference_qty || 0);
                                    return (
                                        <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-2.5 font-medium">{item.product?.name || 'Unknown'}</td>
                                            <td className="px-4 py-2.5 text-muted-foreground">{item.product?.sku || '-'}</td>
                                            <td className="px-4 py-2.5 text-right">{Number(item.expected_qty)}</td>
                                            <td className="px-4 py-2.5 text-right">
                                                {canCount ? (
                                                    <Input
                                                        type="number"
                                                        className="h-8 w-24 text-right ml-auto text-xs"
                                                        value={item.counted_qty ?? ''}
                                                        onChange={e => updateCounted(item.id, e.target.value)}
                                                    />
                                                ) : (
                                                    <span>{item.counted_qty ?? '-'}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-right">
                                                {item.counted_qty !== null && item.counted_qty !== undefined ? (
                                                    <Badge variant={diff < 0 ? 'destructive' : diff > 0 ? 'default' : 'secondary'} className="text-xs">
                                                        {diff > 0 ? '+' : ''}{diff}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No products found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {isReconciled && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="size-5" />
                                <span className="font-medium">Reconciled at {count.reconciled_at ? new Date(count.reconciled_at).toLocaleString() : 'N/A'} by {reconcilerName || count.reconciled_by || count.user?.name}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
