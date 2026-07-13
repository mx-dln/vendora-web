import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/page-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import suppliers from '@/routes/suppliers';
import type { Supplier } from '@/types';

interface Props {
    suppliers: { data: Supplier[]; current_page: number; last_page: number; total: number; from: number; to: number };
    filters: Record<string, string | undefined>;
}

export default function SuppliersIndex({ suppliers: supData, filters }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [editingSup, setEditingSup] = useState<Supplier | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '', address: '', city: '', province: '', tax_id: '', notes: '' });

    function openCreate() {
        setEditingSup(null);
        setForm({ name: '', contact_person: '', email: '', phone: '', address: '', city: '', province: '', tax_id: '', notes: '' });
        setShowDialog(true);
    }
    function openEdit(s: Supplier) {
        setEditingSup(s);
        setForm({ name: s.name, contact_person: s.contact_person || '', email: s.email || '', phone: s.phone || '', address: s.address || '', city: s.city || '', province: s.province || '', tax_id: s.tax_id || '', notes: s.notes || '' });
        setShowDialog(true);
    }
    function submit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        const url = editingSup ? suppliers.update.url(editingSup.id) : suppliers.store.url();
        const method = editingSup ? 'patch' as const : 'post' as const;
        router[method](url, form, {
            onSuccess: () => { toast.success(editingSup ? 'Supplier updated' : 'Supplier created'); setShowDialog(false); },
            onError: () => toast.error('Failed to save supplier'),
            onFinish: () => setProcessing(false),
        });
    }
    function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        router.delete(suppliers.destroy.url(deleteId), {
            onSuccess: () => { toast.success('Supplier deleted'); setDeleteId(null); },
            onError: () => toast.error('Failed to delete supplier'),
            onFinish: () => setDeleting(false),
        });
    }

    const columns: Column<Supplier>[] = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'contact_person', label: 'Contact Person' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'city', label: 'City' },
        { key: 'is_active', label: 'Status', render: (s) => <Badge variant={s.is_active ? 'default' : 'secondary'}>{s.is_active ? 'Active' : 'Inactive'}</Badge> },
    ];

    return (
        <>
            <Head title="Suppliers" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Suppliers" description="Manage your suppliers" actions={
                    <Button onClick={openCreate}><Plus className="mr-1 size-4" />Add Supplier</Button>
                } />
                <DataTable<Supplier>
                    data={supData}
                    columns={columns}
                    filters={filters}
                    baseRoute={suppliers.index.url()}
                    searchPlaceholder="Search suppliers..."
                    actions={(s) => (
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="size-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}><Trash2 className="size-4 text-destructive" /></Button>
                        </div>
                    )}
                />
            </div>

            <Sheet open={showDialog} onOpenChange={setShowDialog}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader className="mb-6 px-6 pt-6">
                        <SheetTitle>{editingSup ? 'Edit Supplier' : 'Create Supplier'}</SheetTitle>
                    </SheetHeader>
                    <form onSubmit={submit} className="space-y-5 px-6 pb-6">
                        <div className="space-y-2"><Label>Company Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>Contact Person</Label><Input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                        <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Province</Label><Input value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Tax ID</Label><Input value={form.tax_id} onChange={e => setForm({ ...form, tax_id: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                        <SheetFooter className="grid grid-cols-2 gap-2 pt-2">
                            <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save'}</Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} title="Delete Supplier" description="Are you sure you want to delete this supplier?" onConfirm={handleDelete} loading={deleting} />
        </>
    );
}

SuppliersIndex.layout = {
    breadcrumbs: [{ title: 'Suppliers', href: suppliers.index.url() }],
};
