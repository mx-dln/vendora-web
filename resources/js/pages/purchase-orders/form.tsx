import { useState, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, Trash2, Search, Save, Send, ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import purchaseOrders from '@/routes/purchase-orders';
import type { Supplier, PurchaseOrder } from '@/types';

interface Props {
    suppliers: Supplier[];
    purchaseOrder?: PurchaseOrder;
}

interface LineItem {
    id?: number;
    product_id: number | null;
    product_name: string;
    product_sku: string;
    quantity_ordered: number;
    unit_cost: number;
    stock_quantity?: number;
    low_stock_threshold?: number;
}

export default function PurchaseOrderForm({ suppliers, purchaseOrder }: Props) {
    const isEditing = !!purchaseOrder;
    const [form, setForm] = useState({
        supplier_id: purchaseOrder?.supplier_id ? String(purchaseOrder.supplier_id) : '',
        order_date: purchaseOrder?.order_date ? new Date(purchaseOrder.order_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expected_date: purchaseOrder?.expected_date ? new Date(purchaseOrder.expected_date).toISOString().split('T')[0] : '',
        notes: purchaseOrder?.notes || '',
        tax_amount: purchaseOrder?.tax_amount || 0,
        shipping_cost: purchaseOrder?.shipping_cost || 0,
    });
    const [items, setItems] = useState<LineItem[]>(
        (purchaseOrder?.items || []).map(i => ({
            id: i.id,
            product_id: (i as any).product_id || null,
            product_name: i.product_name,
            product_sku: i.product_sku || '',
            quantity_ordered: Number(i.quantity_ordered),
            unit_cost: Number(i.unit_cost),
        }))
    );
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showProductSearch, setShowProductSearch] = useState(false);
    const [productResults, setProductResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    const searchProducts = useCallback(async (term: string) => {
        setSearching(true);
        try {
            const params = term.length > 0 ? `?search=${encodeURIComponent(term)}` : '';
            const res = await fetch(`/purchase-orders-product-data${params}`);
            const data = await res.json();
            setProductResults(Array.isArray(data) ? data : []);
        } catch { setProductResults([]); }
        setSearching(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => searchProducts(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm, searchProducts]);

    // Load products immediately when popup opens
    useEffect(() => {
        if (showProductSearch) {
            setSearchTerm('');
            searchProducts('');
        }
    }, [showProductSearch, searchProducts]);

    async function loadProductData(productId: number): Promise<any> {
        try {
            const res = await fetch(`/purchase-orders-product-data?id=${productId}`);
            return await res.json();
        } catch { return null; }
    }

    function addItem(product?: any) {
        const newItem: LineItem = {
            product_id: product?.id || null,
            product_name: product?.name || '',
            product_sku: product?.sku || '',
            quantity_ordered: 1,
            unit_cost: product?.cost_price || 0,
            stock_quantity: product?.stock_quantity,
            low_stock_threshold: product?.low_stock_threshold,
        };
        setItems(current => [...current, newItem]);
        setShowProductSearch(false);
        setSearchTerm('');
    }

    function updateItem(idx: number, field: keyof LineItem, value: any) {
        setItems(current => current.map((item, pos) => pos === idx ? { ...item, [field]: value } : item));
    }

    function removeItem(idx: number) {
        setItems(current => current.filter((_, pos) => pos !== idx));
    }

    const subtotal = items.reduce((sum, i) => sum + (i.quantity_ordered || 0) * (i.unit_cost || 0), 0);
    const tax = Number(form.tax_amount) || 0;
    const shipping = Number(form.shipping_cost) || 0;
    const grandTotal = subtotal + tax + shipping;

    async function submit(status: 'draft' | 'sent') {
        if (!form.supplier_id) { toast.error('Select a supplier'); return; }
        if (items.length === 0) { toast.error('Add at least one product'); return; }
        setProcessing(true);

        const data = { ...form, items: items.map(i => ({ ...i, quantity_ordered: Number(i.quantity_ordered), unit_cost: Math.round(Number(i.unit_cost) * 100) / 100 })), status };
        const url = isEditing ? purchaseOrders.update.url(purchaseOrder!.id) : purchaseOrders.store.url();

        if (isEditing) {
            router.patch(url, data, {
                onSuccess: () => toast.success('Purchase order updated'),
                onError: (err) => {
                    const msgs = Object.values(err as Record<string, string>).join(', ');
                    toast.error(msgs || 'Failed to save');
                },
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post(url, data, {
                onSuccess: () => toast.success('Purchase order created'),
                onError: (err) => {
                    const msgs = Object.values(err as Record<string, string>).join(', ');
                    toast.error(msgs || 'Failed to save');
                },
                onFinish: () => setProcessing(false),
            });
        }
    }

    return (
        <>
            <Head title={isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'} />
            <div className="flex flex-col gap-4 p-6">
                <PageHeader title={isEditing ? `Edit PO: ${purchaseOrder!.reference_number}` : 'Create Purchase Order'}
                    description={isEditing ? 'Modify order details and items' : 'Create a new purchase order'}
                    actions={
                        <Button variant="outline" asChild>
                            <a href={purchaseOrders.index.url()}><ArrowLeft className="mr-1 size-4" /> Back</a>
                        </Button>
                    } />

                <div className="flex flex-col lg:flex-row gap-4 items-start">
                    {/* Main form */}
                    <div className="flex-1 min-w-0 space-y-4">
                        {/* Header */}
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-semibold">Order Information</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Supplier *</Label>
                                    <Select value={form.supplier_id} onValueChange={v => setForm({ ...form, supplier_id: v })} disabled={isEditing && purchaseOrder?.status !== 'draft'}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select supplier..." /></SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Order Date</Label>
                                    <Input type="date" value={form.order_date} onChange={e => setForm({ ...form, order_date: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Expected Delivery</Label>
                                    <Input type="date" value={form.expected_date} onChange={e => setForm({ ...form, expected_date: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Reference</Label>
                                    <Input value={purchaseOrder?.reference_number || 'Auto-generated'} disabled className="text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-semibold">Notes</CardTitle></CardHeader>
                            <CardContent>
                                <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes or supplier instructions..." />
                            </CardContent>
                        </Card>

                        {/* Items */}
                        <Card>
                            <CardHeader className="flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-semibold">Order Items</CardTitle>
                                <div className="relative">
                                    <Button size="sm" className="h-7 text-xs" onClick={() => setShowProductSearch(true)}>
                                        <Plus className="mr-1 size-3" /> Add Product
                                    </Button>
                                    {showProductSearch && (
                                        <div className="absolute right-0 top-full mt-1 z-50 w-80 rounded-lg border bg-card shadow-xl p-3">
                                            <div className="relative mb-2">
                                                <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                                <Input className="h-8 pl-8 text-xs" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto space-y-0.5">
                                                {searching && <p className="text-xs text-muted-foreground p-2">Searching...</p>}
                                                {!searching && productResults.length === 0 && searchTerm.length > 0 && (
                                                    <div>
                                                        <p className="text-xs text-muted-foreground p-2">No products found.</p>
                                                        <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={() => addItem()}>
                                                            <Plus className="mr-1 size-3" /> Add "{searchTerm}" as custom item
                                                        </Button>
                                                    </div>
                                                )}
                                                {productResults.map(p => (
                                                    <button key={p.id} onClick={() => addItem(p)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted text-left">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium truncate">{p.name}</p>
                                                            <p className="text-muted-foreground">{p.sku} · Stock: {p.stock_quantity} · Cost: ₱{Number(p.cost_price).toFixed(2)}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {items.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                                        <Package className="size-8" />
                                        <p className="text-sm">No items yet.</p>
                                        <p className="text-xs">Click "Add Product" to start building your order.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                                            <colgroup>
                                                <col className="w-[28%]" />
                                                <col className="w-[10%]" />
                                                <col className="w-[9%]" />
                                                <col className="w-[9%]" />
                                                <col className="w-[12%]" />
                                                <col className="w-[13%]" />
                                                <col className="w-[12%]" />
                                                <col className="w-[7%]" />
                                            </colgroup>
                                            <thead>
                                                <tr className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                                                    <th className="px-3 py-2.5 font-medium">Product</th>
                                                    <th className="px-3 py-2.5 font-medium">SKU</th>
                                                    <th className="px-3 py-2.5 font-medium text-right">Stock</th>
                                                    <th className="px-3 py-2.5 font-medium text-right">Reorder</th>
                                                    <th className="px-3 py-2.5 font-medium text-right">Qty Ordered</th>
                                                    <th className="px-3 py-2.5 font-medium text-right">Unit Cost</th>
                                                    <th className="px-3 py-2.5 font-medium text-right">Line Total</th>
                                                    <th className="px-3 py-2.5"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item, idx) => (
                                                    <tr key={idx} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                                                        <td className="px-3 py-1.5 align-middle">
                                                            <Input className="h-8 w-full text-xs border-0 bg-muted/30 focus-visible:bg-background px-2" value={item.product_name} onChange={e => updateItem(idx, 'product_name', e.target.value)} placeholder="Product name" />
                                                        </td>
                                                        <td className="px-3 py-1.5 align-middle">
                                                            <code className="inline-block text-[11px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded leading-normal">{item.product_sku || '—'}</code>
                                                        </td>
                                                        <td className="px-3 py-1.5 align-middle text-right text-xs">
                                                            <span className={`font-medium ${Number(item.stock_quantity) <= Number(item.low_stock_threshold) ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                                {item.stock_quantity !== undefined ? item.stock_quantity : '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-1.5 align-middle text-right text-xs text-muted-foreground">
                                                            {item.low_stock_threshold !== undefined ? item.low_stock_threshold : '—'}
                                                        </td>
                                                        <td className="px-3 py-1.5 align-middle">
                                                            <Input type="number" min="0.01" step="1" className="h-8 w-full text-xs text-right border-0 bg-muted/30 focus-visible:bg-background px-2" value={item.quantity_ordered} onChange={e => { const v = parseFloat(e.target.value); updateItem(idx, 'quantity_ordered', isNaN(v) ? 0 : v); }} />
                                                        </td>
                                                        <td className="px-3 py-1.5 align-middle">
                                                            <Input type="number" min="0" step="0.01" className="h-8 w-full text-xs text-right border-0 bg-muted/30 focus-visible:bg-background px-2" value={item.unit_cost} onChange={e => { const v = parseFloat(e.target.value); updateItem(idx, 'unit_cost', isNaN(v) ? 0 : v); }} />
                                                        </td>
                                                        <td className="px-3 py-1.5 align-middle text-right text-sm font-semibold">₱{(item.quantity_ordered * item.unit_cost).toFixed(2)}</td>
                                                        <td className="px-3 py-1.5 align-middle text-center">
                                                            <Button variant="ghost" size="icon" className="size-7 opacity-50 hover:opacity-100" onClick={() => removeItem(idx)}><Trash2 className="size-3.5 text-destructive" /></Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Summary sidebar */}
                    <div className="w-full lg:w-72 shrink-0">
                        <Card className="sticky top-4">
                            <CardHeader><CardTitle className="text-sm font-semibold">Order Summary</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Items</span><span className="font-medium">{items.length}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Qty</span><span className="font-medium">{items.reduce((s, i) => s + (i.quantity_ordered || 0), 0)}</span></div>
                                <div className="border-t pt-3 space-y-2">
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>₱{subtotal.toFixed(2)}</span></div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Tax</Label>
                                        <Input type="number" min="0" step="0.01" className="h-8 text-xs text-right" value={form.tax_amount} onChange={e => setForm({ ...form, tax_amount: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Shipping</Label>
                                        <Input type="number" min="0" step="0.01" className="h-8 text-xs text-right" value={form.shipping_cost} onChange={e => setForm({ ...form, shipping_cost: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                    <div className="flex justify-between text-sm font-semibold border-t pt-2">
                                        <span>Grand Total</span>
                                        <span>₱{grandTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2">
                                    {isEditing && purchaseOrder?.status === 'draft' ? (
                                        <>
                                            <Button className="w-full" onClick={() => submit('draft')} disabled={processing}><Save className="mr-1 size-4" /> {processing ? 'Saving...' : 'Update Draft'}</Button>
                                            <Button variant="outline" className="w-full" onClick={() => submit('sent')} disabled={processing}><Send className="mr-1 size-4" /> Update & Send</Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button className="w-full" onClick={() => submit('draft')} disabled={processing}><Save className="mr-1 size-4" /> {processing ? 'Saving...' : 'Save Draft'}</Button>
                                            <Button variant="outline" className="w-full" onClick={() => submit('sent')} disabled={processing}><Send className="mr-1 size-4" /> Save & Send</Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

PurchaseOrderForm.layout = {
    breadcrumbs: [{ title: 'Purchase Orders', href: purchaseOrders.index.url() }, { title: 'Create', href: '' }],
};
