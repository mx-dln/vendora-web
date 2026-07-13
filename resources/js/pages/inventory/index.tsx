import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, Minus, History, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import inventory from '@/routes/inventory';
import type { Product } from '@/types';

interface Props {
    products: { data: Product[]; current_page: number; last_page: number; total: number; from: number; to: number };
    filters: Record<string, string | undefined>;
}

export default function InventoryIndex({ products: prodsData, filters }: Props) {
    const [stockAction, setStockAction] = useState<{ product: Product; type: 'in' | 'out' | 'adjust' } | null>(null);
    const [form, setForm] = useState({ quantity: '1', unit_cost: '0', new_quantity: '0', notes: '' });
    const [processing, setProcessing] = useState(false);

    function submitStock(e: React.FormEvent) {
        e.preventDefault();
        if (!stockAction) return;
        setProcessing(true);

        let url: string;
        let data: Record<string, unknown>;

        if (stockAction.type === 'in') {
            url = inventory.stockIn.url(stockAction.product.id);
            data = { quantity: parseFloat(form.quantity), unit_cost: form.unit_cost ? parseFloat(form.unit_cost) : null, notes: form.notes };
        } else if (stockAction.type === 'out') {
            url = inventory.stockOut.url(stockAction.product.id);
            data = { quantity: parseFloat(form.quantity), notes: form.notes };
        } else {
            url = inventory.adjust.url(stockAction.product.id);
            data = { new_quantity: parseInt(form.new_quantity), notes: form.notes };
        }

        router.post(url, data, {
            onSuccess: () => {
                toast.success('Stock updated successfully');
                setStockAction(null);
                setForm({ quantity: '1', unit_cost: '0', new_quantity: '0', notes: '' });
            },
            onError: () => toast.error('Failed to update stock'),
            onFinish: () => setProcessing(false),
        });
    }

    const columns: Column<Product>[] = [
        { key: 'name', label: 'Product', sortable: true },
        { key: 'sku', label: 'SKU' },
        {
            key: 'stock_quantity',
            label: 'On Hand',
            sortable: true,
            render: (p) => (
                <span className={p.stock_quantity <= p.low_stock_threshold ? 'text-destructive font-bold' : ''}>
                    {p.stock_quantity}
                </span>
            ),
        },
        {
            key: 'low_stock_threshold',
            label: 'Threshold',
        },
        {
            key: 'status',
            label: 'Status',
            render: (p) => {
                if (p.stock_quantity <= 0) return <Badge variant="destructive">Out of Stock</Badge>;
                if (p.stock_quantity <= p.low_stock_threshold) return <Badge variant="secondary">Low Stock</Badge>;
                return <Badge variant="default">In Stock</Badge>;
            },
        },
    ];

    return (
        <>
            <Head title="Inventory" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Inventory" description="Manage product stock levels" />
                <DataTable<Product>
                    data={prodsData}
                    columns={columns}
                    filters={filters}
                    baseRoute={inventory.index.url()}
                    searchPlaceholder="Search inventory..."
                    actions={(p) => (
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setStockAction({ product: p, type: 'in' }); setForm({ ...form, quantity: '1', unit_cost: p.cost_price.toString() }); }}>
                                <Plus className="size-3 mr-1" />In
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setStockAction({ product: p, type: 'out' }); setForm({ ...form, quantity: '1' }); }}>
                                <Minus className="size-3 mr-1" />Out
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setStockAction({ product: p, type: 'adjust' }); setForm({ ...form, new_quantity: p.stock_quantity.toString() }); }}>
                                <TrendingUp className="size-3 mr-1" />Adj
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={inventory.history.url(p.id)}><History className="size-4" /></Link>
                            </Button>
                        </div>
                    )}
                />
            </div>

            <Dialog open={stockAction !== null} onOpenChange={() => setStockAction(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {stockAction?.type === 'in' ? 'Stock In' : stockAction?.type === 'out' ? 'Stock Out' : 'Adjust Stock'}
                            : {stockAction?.product.name}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitStock} className="space-y-4">
                        {stockAction?.type === 'in' && (
                            <>
                                <div className="space-y-2"><Label>Quantity to Add</Label><Input type="number" step="0.01" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required /></div>
                                <div className="space-y-2"><Label>Unit Cost (optional)</Label><Input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} /></div>
                            </>
                        )}
                        {stockAction?.type === 'out' && (
                            <div className="space-y-2"><Label>Quantity to Remove</Label><Input type="number" step="0.01" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required /></div>
                        )}
                        {stockAction?.type === 'adjust' && (
                            <div className="space-y-2"><Label>New Quantity</Label><Input type="number" value={form.new_quantity} onChange={e => setForm({ ...form, new_quantity: e.target.value })} required /></div>
                        )}
                        <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setStockAction(null)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{processing ? 'Processing...' : 'Confirm'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

InventoryIndex.layout = {
    breadcrumbs: [{ title: 'Inventory', href: inventory.index.url() }],
};
