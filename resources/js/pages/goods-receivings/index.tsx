import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/page-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import goodsReceivings from '@/routes/goods-receivings';
import type { GoodsReceiving, PurchaseOrder, Supplier, Product, PaginatedData } from '@/types';

interface GoodsReceivingItem {
    product_id: number;
    product_name: string;
    qty_ordered: number;
    qty_received: number;
    qty_damaged: number;
    unit_cost: number;
}

interface Props {
    goodsReceivings: PaginatedData<GoodsReceiving>;
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    products: Product[];
    filters: Record<string, string | undefined>;
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    received: 'default',
    partial: 'secondary',
    cancelled: 'destructive',
};

export default function GoodsReceivingsIndex({ goodsReceivings: grData, purchaseOrders, suppliers, products, filters }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState({
        purchase_order_id: '', supplier_id: '', received_date: new Date().toISOString().split('T')[0],
        delivery_note: '', notes: '',
    });
    const [items, setItems] = useState<GoodsReceivingItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    function openCreate() {
        setForm({ purchase_order_id: '', supplier_id: '', received_date: new Date().toISOString().split('T')[0], delivery_note: '', notes: '' });
        setItems([]);
        setShowDialog(true);
    }

    function addItem(product: Product) {
        setItems(prev => {
            if (prev.find(i => i.product_id === product.id)) return prev;
            return [...prev, {
                product_id: product.id,
                product_name: product.name,
                qty_ordered: 0,
                qty_received: 1,
                qty_damaged: 0,
                unit_cost: product.cost_price,
            }];
        });
        setSearchTerm('');
    }

    function removeItem(productId: number) {
        setItems(prev => prev.filter(i => i.product_id !== productId));
    }

    function updateItem(productId: number, field: keyof GoodsReceivingItem, value: number) {
        setItems(prev => prev.map(i => i.product_id === productId ? { ...i, [field]: value } : i));
    }

    const filteredProducts = searchTerm
        ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (items.length === 0) { toast.error('Add at least one item'); return; }
        setProcessing(true);
        router.post(goodsReceivings.store.url(), {
            ...form,
            purchase_order_id: form.purchase_order_id ? parseInt(form.purchase_order_id) : null,
            supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
            items: items.map(i => ({
                product_id: i.product_id,
                qty_received: i.qty_received,
                qty_damaged: i.qty_damaged,
                unit_cost: i.unit_cost,
            })),
        }, {
            onSuccess: () => { toast.success('Goods received recorded'); setShowDialog(false); },
            onError: () => toast.error('Failed to record goods receiving'),
            onFinish: () => setProcessing(false),
        });
    }

    function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        router.delete(goodsReceivings.destroy.url(deleteId), {
            onSuccess: () => { toast.success('Deleted'); setDeleteId(null); },
            onError: () => toast.error('Failed to delete'),
            onFinish: () => setDeleting(false),
        });
    }

    const columns: Column<GoodsReceiving>[] = [
        {
            key: 'reference_number',
            label: 'Reference',
            sortable: true,
            render: (gr) => <Link href={goodsReceivings.show.url(gr.id)} className="font-medium hover:underline">{gr.reference_number}</Link>,
        },
        { key: 'supplier', label: 'Supplier', render: (gr) => gr.supplier?.name || '-' },
        { key: 'received_date', label: 'Date', sortable: true },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (gr) => <Badge variant={statusVariants[gr.status] || 'outline'} className="capitalize">{gr.status}</Badge>,
        },
        { key: 'item_count', label: 'Items', render: (gr) => gr.item_count || 0 },
        { key: 'user', label: 'Received By', render: (gr) => gr.user?.name || '-' },
    ];

    return (
        <>
            <Head title="Goods Receiving" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Goods Receiving" description="Record incoming inventory from suppliers" actions={
                    <Button onClick={openCreate}><Plus className="mr-1 size-4" />New Receiving</Button>
                } />
                <DataTable<GoodsReceiving>
                    data={grData}
                    columns={columns}
                    filters={filters}
                    baseRoute={goodsReceivings.index.url()}
                    searchPlaceholder="Search by reference..."
                    actions={(gr) => (
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={goodsReceivings.show.url(gr.id)}><Eye className="size-4" /></Link>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(gr.id)}><Trash2 className="size-4 text-destructive" /></Button>
                        </div>
                    )}
                />
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader><DialogTitle>Record Goods Receiving</DialogTitle></DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Purchase Order (optional)</Label>
                                <Select value={form.purchase_order_id} onValueChange={v => setForm({ ...form, purchase_order_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select PO" /></SelectTrigger>
                                    <SelectContent>
                                        {purchaseOrders.filter(po => po.status !== 'received').map(po => (
                                            <SelectItem key={po.id} value={po.id.toString()}>{po.reference_number}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Supplier</Label>
                                <Select value={form.supplier_id} onValueChange={v => setForm({ ...form, supplier_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Received Date</Label><Input type="date" value={form.received_date} onChange={e => setForm({ ...form, received_date: e.target.value })} required /></div>
                            <div className="space-y-2"><Label>Delivery Note #</Label><Input value={form.delivery_note} onChange={e => setForm({ ...form, delivery_note: e.target.value })} /></div>
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
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="p-2 text-left font-medium">Product</th>
                                                <th className="p-2 text-right font-medium">Qty Ordered</th>
                                                <th className="p-2 text-right font-medium">Qty Received</th>
                                                <th className="p-2 text-right font-medium">Qty Damaged</th>
                                                <th className="p-2 text-right font-medium">Unit Cost</th>
                                                <th className="p-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map(item => (
                                                <tr key={item.product_id} className="border-b last:border-0">
                                                    <td className="p-2">{item.product_name}</td>
                                                    <td className="p-2"><Input type="number" min="0" value={item.qty_ordered} onChange={e => updateItem(item.product_id, 'qty_ordered', parseInt(e.target.value) || 0)} className="h-8 w-20 ml-auto text-right" /></td>
                                                    <td className="p-2"><Input type="number" min="0" value={item.qty_received} onChange={e => updateItem(item.product_id, 'qty_received', parseInt(e.target.value) || 0)} className="h-8 w-20 ml-auto text-right" required /></td>
                                                    <td className="p-2"><Input type="number" min="0" value={item.qty_damaged} onChange={e => updateItem(item.product_id, 'qty_damaged', parseInt(e.target.value) || 0)} className="h-8 w-20 ml-auto text-right" /></td>
                                                    <td className="p-2"><Input type="number" step="0.01" min="0" value={item.unit_cost} onChange={e => updateItem(item.product_id, 'unit_cost', parseFloat(e.target.value) || 0)} className="h-8 w-24 ml-auto text-right" required /></td>
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
                            <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} title="Delete Record" description="Are you sure?" onConfirm={handleDelete} loading={deleting} />
        </>
    );
}

GoodsReceivingsIndex.layout = {
    breadcrumbs: [{ title: 'Goods Receiving', href: goodsReceivings.index.url() }],
};
