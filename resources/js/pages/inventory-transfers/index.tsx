import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, CheckCircle, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import inventoryTransfers from '@/routes/inventory-transfers';
import type { InventoryTransfer, Product, PaginatedData } from '@/types';

interface TransferItem {
    product_id: number;
    product_name: string;
    quantity: number;
}

interface Props {
    inventoryTransfers: PaginatedData<InventoryTransfer>;
    products: Product[];
    locations: { id: number; name: string }[];
    filters: Record<string, string | undefined>;
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    approved: 'default',
    completed: 'default',
    cancelled: 'destructive',
};

export default function InventoryTransfersIndex({ inventoryTransfers: itData, products, locations, filters }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState({ from_location_id: '', to_location_id: '', notes: '' });
    const [items, setItems] = useState<TransferItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    function openCreate() {
        setForm({ from_location_id: '', to_location_id: '', notes: '' });
        setItems([]);
        setShowDialog(true);
    }

    function addItem(product: Product) {
        setItems(prev => {
            const existing = prev.find(i => i.product_id === product.id);
            if (existing) {
                return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { product_id: product.id, product_name: product.name, quantity: 1 }];
        });
        setSearchTerm('');
    }

    function removeItem(productId: number) {
        setItems(prev => prev.filter(i => i.product_id !== productId));
    }

    function updateQty(productId: number, qty: number) {
        setItems(prev => prev.map(i => i.product_id === productId ? { ...i, quantity: Math.max(1, qty) } : i));
    }

    const filteredProducts = searchTerm
        ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    function handleApprove(id: number) {
        router.post(inventoryTransfers.approve.url(id), {}, {
            onSuccess: () => toast.success('Transfer approved'),
            onError: () => toast.error('Failed to approve transfer'),
        });
    }

    function handleComplete(id: number) {
        router.post(inventoryTransfers.complete.url(id), {}, {
            onSuccess: () => toast.success('Transfer completed'),
            onError: () => toast.error('Failed to complete transfer'),
        });
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (items.length === 0) { toast.error('Add at least one item'); return; }
        if (form.from_location_id === form.to_location_id) { toast.error('Locations must be different'); return; }
        setProcessing(true);
        router.post(inventoryTransfers.store.url(), {
            from_location_id: parseInt(form.from_location_id),
            to_location_id: parseInt(form.to_location_id),
            notes: form.notes,
            items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        }, {
            onSuccess: () => { toast.success('Transfer created'); setShowDialog(false); },
            onError: () => toast.error('Failed to create transfer'),
            onFinish: () => setProcessing(false),
        });
    }

    const columns: Column<InventoryTransfer>[] = [
        { key: 'reference_number', label: 'Reference', sortable: true },
        { key: 'from_location', label: 'From', render: (t) => t.from_location?.name || '-' },
        { key: 'to_location', label: 'To', render: (t) => t.to_location?.name || '-' },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (t) => <Badge variant={statusVariants[t.status] || 'outline'} className="capitalize">{t.status}</Badge>,
        },
        { key: 'item_count', label: 'Items', render: (t) => t.item_count || 0 },
        { key: 'user', label: 'Created By', render: (t) => t.user?.name || '-' },
    ];

    return (
        <>
            <Head title="Inventory Transfers" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Inventory Transfers" description="Transfer stock between locations" actions={
                    <Button onClick={openCreate}><Plus className="mr-1 size-4" />New Transfer</Button>
                } />
                <DataTable<InventoryTransfer>
                    data={itData}
                    columns={columns}
                    filters={filters}
                    baseRoute={inventoryTransfers.index.url()}
                    searchPlaceholder="Search by reference..."
                    actions={(t) => (
                        <div className="flex justify-end gap-1">
                            {t.status === 'pending' && (
                                <Button variant="ghost" size="sm" onClick={() => handleApprove(t.id)}>
                                    <CheckCircle className="size-3 mr-1" />Approve
                                </Button>
                            )}
                            {t.status === 'approved' && (
                                <Button variant="ghost" size="sm" onClick={() => handleComplete(t.id)}>
                                    <Circle className="size-3 mr-1" />Complete
                                </Button>
                            )}
                        </div>
                    )}
                />
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader><DialogTitle>New Inventory Transfer</DialogTitle></DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>From Location</Label>
                                <Select value={form.from_location_id} onValueChange={v => setForm({ ...form, from_location_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                                    <SelectContent>
                                        {locations.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>To Location</Label>
                                <Select value={form.to_location_id} onValueChange={v => setForm({ ...form, to_location_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                                    <SelectContent>
                                        {locations.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Items</Label>
                            <div className="relative">
                                <Input placeholder="Search product to add..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                {filteredProducts.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                                        {filteredProducts.slice(0, 10).map(p => (
                                            <button key={p.id} type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent" onClick={() => addItem(p)}>
                                                {p.name} <span className="text-xs text-muted-foreground">({p.sku})</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {items.length > 0 && (
                                <div className="overflow-x-auto rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead><tr className="border-b bg-muted/50">
                                            <th className="p-2 text-left font-medium">Product</th>
                                            <th className="p-2 text-right font-medium">Quantity</th>
                                            <th className="p-2"></th>
                                        </tr></thead>
                                        <tbody>
                                            {items.map(item => (
                                                <tr key={item.product_id} className="border-b last:border-0">
                                                    <td className="p-2">{item.product_name}</td>
                                                    <td className="p-2"><Input type="number" min="1" value={item.quantity} onChange={e => updateQty(item.product_id, parseInt(e.target.value) || 1)} className="h-8 w-20 ml-auto text-right" required /></td>
                                                    <td className="p-2"><Button variant="ghost" size="sm" type="button" onClick={() => removeItem(item.product_id)} className="text-destructive h-8">Remove</Button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{processing ? 'Creating...' : 'Create Transfer'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

InventoryTransfersIndex.layout = {
    breadcrumbs: [{ title: 'Inventory Transfers', href: inventoryTransfers.index.url() }],
};
