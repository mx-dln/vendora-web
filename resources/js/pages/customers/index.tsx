import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/page-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import customers from '@/routes/customers';
import type { Customer } from '@/types';

interface Props {
    customers: { data: Customer[]; current_page: number; last_page: number; total: number; from: number; to: number };
    filters: Record<string, string | undefined>;
}

export default function CustomersIndex({ customers: custData, filters }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [editingCust, setEditingCust] = useState<Customer | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', province: '', notes: '' });

    function openCreate() {
        setEditingCust(null);
        setForm({ name: '', email: '', phone: '', address: '', city: '', province: '', notes: '' });
        setShowDialog(true);
    }
    function openEdit(c: Customer) {
        setEditingCust(c);
        setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '', city: c.city || '', province: c.province || '', notes: c.notes || '' });
        setShowDialog(true);
    }
    function submit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        const url = editingCust ? customers.update.url(editingCust.id) : customers.store.url();
        const method = editingCust ? 'patch' as const : 'post' as const;
        router[method](url, form, {
            onSuccess: () => { toast.success(editingCust ? 'Customer updated' : 'Customer created'); setShowDialog(false); },
            onError: () => toast.error('Failed to save customer'),
            onFinish: () => setProcessing(false),
        });
    }
    function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        router.delete(customers.destroy.url(deleteId), {
            onSuccess: () => { toast.success('Customer deleted'); setDeleteId(null); },
            onError: (errs) => { const e = errs as Record<string, string>; toast.error(e.error || 'Failed to delete'); },
            onFinish: () => setDeleting(false),
        });
    }

    const columns: Column<Customer>[] = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        {
            key: 'total_purchases',
            label: 'Total Purchases',
            sortable: true,
            render: (c) => `₱${Number(c.total_purchases).toFixed(2)}`,
        },
        {
            key: 'visit_count',
            label: 'Visits',
            sortable: true,
        },
        {
            key: 'last_visit_at',
            label: 'Last Visit',
            render: (c) => c.last_visit_at ? new Date(c.last_visit_at).toLocaleDateString() : 'Never',
        },
    ];

    return (
        <>
            <Head title="Customers" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Customers" description="Manage your customer relationships" actions={
                    <Button onClick={openCreate}><Plus className="mr-1 size-4" />Add Customer</Button>
                } />
                <DataTable<Customer>
                    data={custData}
                    columns={columns}
                    filters={filters}
                    baseRoute={customers.index.url()}
                    searchPlaceholder="Search customers..."
                    actions={(c) => (
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={customers.show.url(c.id)}><Eye className="size-4" /></Link>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="size-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}><Trash2 className="size-4 text-destructive" /></Button>
                        </div>
                    )}
                />
            </div>

            <Sheet open={showDialog} onOpenChange={setShowDialog}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader className="mb-6 px-6 pt-6">
                        <SheetTitle>{editingCust ? 'Edit Customer' : 'Create Customer'}</SheetTitle>
                    </SheetHeader>
                    <form onSubmit={submit} className="space-y-5 px-6 pb-6">
                        <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                        <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Province</Label><Input value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                        <SheetFooter className="grid grid-cols-2 gap-2 pt-2">
                            <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save'}</Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} title="Delete Customer" description="Customers with transactions cannot be deleted." onConfirm={handleDelete} loading={deleting} />
        </>
    );
}

CustomersIndex.layout = {
    breadcrumbs: [{ title: 'Customers', href: customers.index.url() }],
};
