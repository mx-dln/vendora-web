import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, Eye, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { PageHeader } from '@/components/page-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { StockCount } from '@/types';

interface Props {
    counts: { data: StockCount[]; current_page: number; last_page: number; total: number; from: number; to: number };
    filters: Record<string, string | undefined>;
}

export default function StockCountsIndex({ counts: countsData, filters }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [form, setForm] = useState({ type: 'full' as 'full' | 'spot', notes: '' });

    function create() {
        router.post('/stock-counts', form, {
            onSuccess: () => { setShowDialog(false); setForm({ type: 'full', notes: '' }); },
            onError: () => toast.error('Failed to create'),
        });
    }

    return (
        <>
            <Head title="Stock Counts" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Stock Counts" description="Physical inventory audit and reconciliation"
                    actions={<Button onClick={() => setShowDialog(true)}><Plus className="mr-1 size-4" /> New Count</Button>} />

                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3 font-medium">Reference</th>
                                    <th className="px-4 py-3 font-medium">Type</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Counted By</th>
                                    <th className="px-4 py-3 font-medium">Counted At</th>
                                    <th className="px-4 py-3 font-medium">Reconciled At</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {countsData.data.map(c => (
                                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-2.5 font-medium">{c.reference_number}</td>
                                        <td className="px-4 py-2.5"><Badge variant="outline" className="text-xs capitalize">{c.type}</Badge></td>
                                        <td className="px-4 py-2.5">
                                            <Badge variant={c.status === 'reconciled' ? 'default' : c.status === 'counting' ? 'secondary' : 'outline'} className="text-xs capitalize">{c.status}</Badge>
                                        </td>
                                        <td className="px-4 py-2.5">{c.user?.name || '-'}</td>
                                        <td className="px-4 py-2.5 text-muted-foreground">{c.counted_at ? new Date(c.counted_at).toLocaleString() : '-'}</td>
                                        <td className="px-4 py-2.5 text-muted-foreground">{c.reconciled_at ? new Date(c.reconciled_at).toLocaleString() : '-'}</td>
                                        <td className="px-4 py-2.5 text-right">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/stock-counts/${c.id}`}><Eye className="size-4" /></Link>
                                            </Button>
                                            {c.status === 'draft' && (
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}>
                                                    <Trash2 className="size-4 text-destructive" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {countsData.data.length === 0 && (
                                    <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No stock counts yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {countsData.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Page {countsData.current_page} of {countsData.last_page}</p>
                        <div className="flex gap-1">
                            {countsData.current_page > 1 && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/stock-counts?page=${countsData.current_page - 1}`}>Previous</Link>
                                </Button>
                            )}
                            {countsData.current_page < countsData.last_page && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/stock-counts?page=${countsData.current_page + 1}`}>Next</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <Sheet open={showDialog} onOpenChange={setShowDialog}>
                <SheetContent className="w-full sm:max-w-md">
                    <SheetHeader className="mb-6 px-6 pt-6">
                        <SheetTitle>New Stock Count</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-5 px-6 pb-6">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'full' | 'spot' })}>
                                <option value="full">Full Count (All Products)</option>
                                <option value="spot">Spot Count (Select Products)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
                        </div>
                        <SheetFooter className="grid grid-cols-2 gap-2 pt-2">
                            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                            <Button onClick={create}>Create Count</Button>
                        </SheetFooter>
                    </div>
                </SheetContent>
            </Sheet>

            <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}
                title="Delete Stock Count" description="This will permanently delete this draft count."
                onConfirm={() => { if (deleteId) { setDeleting(true); router.delete(`/stock-counts/${deleteId}`, { onSuccess: () => { toast.success('Deleted'); setDeleteId(null); }, onFinish: () => setDeleting(false) }); } }}
                loading={deleting} />
        </>
    );
}

StockCountsIndex.layout = {
    breadcrumbs: [{ title: 'Stock Counts', href: '/stock-counts' }],
};
