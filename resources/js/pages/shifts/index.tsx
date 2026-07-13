import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, CircleStop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import shifts from '@/routes/shifts';
import type { Shift } from '@/types';

interface Props {
    shifts: { data: Shift[]; current_page: number; last_page: number; total: number; from: number; to: number };
    filters: Record<string, string | undefined>;
}

export default function ShiftsIndex({ shifts: shiftsData, filters }: Props) {
    const [showOpenDialog, setShowOpenDialog] = useState(false);
    const [showCloseDialog, setShowCloseDialog] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState({ opening_balance: '0.00', closing_balance: '0.00', notes: '' });

    function openCreate() {
        setForm({ opening_balance: '0.00', closing_balance: '0.00', notes: '' });
        setShowOpenDialog(true);
    }

    function openClose(shift: Shift) {
        setForm({ opening_balance: shift.opening_balance.toString(), closing_balance: '0.00', notes: '' });
        setShowCloseDialog(shift.id);
    }

    function handleOpen(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        router.post(shifts.open.url(), { opening_balance: parseFloat(form.opening_balance), notes: form.notes }, {
            onSuccess: () => { toast.success('Shift opened'); setShowOpenDialog(false); },
            onError: () => toast.error('Failed to open shift'),
            onFinish: () => setProcessing(false),
        });
    }

    function handleClose(e: React.FormEvent) {
        e.preventDefault();
        if (!showCloseDialog) return;
        setProcessing(true);
        router.post(shifts.close.url(showCloseDialog), { closing_balance: parseFloat(form.closing_balance), notes: form.notes }, {
            onSuccess: () => { toast.success('Shift closed'); setShowCloseDialog(null); },
            onError: () => toast.error('Failed to close shift'),
            onFinish: () => setProcessing(false),
        });
    }

    const columns: Column<Shift>[] = [
        { key: 'user', label: 'Cashier', render: (s) => s.user?.name || '-' },
        { key: 'opened_at', label: 'Opened At', sortable: true, render: (s) => s.opened_at ? new Date(s.opened_at).toLocaleString() : '-' },
        { key: 'closed_at', label: 'Closed At', render: (s) => s.closed_at ? new Date(s.closed_at).toLocaleString() : '-' },
        { key: 'opening_balance', label: 'Opening Bal.', render: (s) => `₱${Number(s.opening_balance).toFixed(2)}` },
        { key: 'closing_balance', label: 'Closing Bal.', render: (s) => s.closing_balance !== null ? `₱${Number(s.closing_balance).toFixed(2)}` : '-' },
        { key: 'difference', label: 'Difference', render: (s) => s.difference !== null ? `₱${Number(s.difference).toFixed(2)}` : '-' },
        { key: 'status', label: 'Status', render: (s) => <Badge variant={s.status === 'open' ? 'default' : 'secondary'} className="capitalize">{s.status}</Badge> },
    ];

    const openShift = shiftsData.data.find(s => s.status === 'open');

    return (
        <>
            <Head title="Shifts" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Shifts" description="Manage cashier shifts" actions={
                    !openShift ? (
                        <Button onClick={openCreate}><Plus className="mr-1 size-4" />Open Shift</Button>
                    ) : null
                } />
                <DataTable<Shift>
                    data={shiftsData}
                    columns={columns}
                    filters={filters}
                    baseRoute={shifts.index.url()}
                    searchPlaceholder="Search by cashier..."
                    actions={(s) => s.status === 'open' ? (
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openClose(s)}><CircleStop className="size-4 text-destructive" /></Button>
                        </div>
                    ) : undefined}
                />
            </div>

            <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Open Shift</DialogTitle></DialogHeader>
                    <form onSubmit={handleOpen} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Opening Balance</Label>
                            <Input type="number" step="0.01" min="0" value={form.opening_balance} onChange={e => setForm({ ...form, opening_balance: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setShowOpenDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{processing ? 'Opening...' : 'Open Shift'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={showCloseDialog !== null} onOpenChange={() => setShowCloseDialog(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Close Shift</DialogTitle></DialogHeader>
                    <form onSubmit={handleClose} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Opening Balance</Label>
                            <Input type="number" step="0.01" value={form.opening_balance} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Closing Balance</Label>
                            <Input type="number" step="0.01" min="0" value={form.closing_balance} onChange={e => setForm({ ...form, closing_balance: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setShowCloseDialog(null)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{processing ? 'Closing...' : 'Close Shift'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

ShiftsIndex.layout = {
    breadcrumbs: [{ title: 'Shifts', href: shifts.index.url() }],
};
