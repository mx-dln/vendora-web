import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { ArrowLeft, Send, Printer, XCircle, Truck, Pencil, CheckCircle, Clock, User, Building2, FileText, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import purchaseOrders from '@/routes/purchase-orders';
import type { PurchaseOrder } from '@/types';

interface Props {
    purchaseOrder: PurchaseOrder;
    activities: any[];
    suppliers: { id: number; name: string }[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: FileText },
    sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Send },
    partial: { label: 'Partial Received', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: Truck },
    received: { label: 'Received', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
};

const statusFlow = ['draft', 'sent', 'partial', 'received'];

function getCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

export default function PurchaseOrderShow({ purchaseOrder: po, activities, suppliers }: Props) {
    const [showReceive, setShowReceive] = useState(window.location.hash === '#receive');
    const [receiveItems, setReceiveItems] = useState<Record<number, number>>({});
    const [receiving, setReceiving] = useState(false);

    async function handleReceive() {
        setReceiving(true);
        const items = po.items?.map(item => {
            const ordered = Number(item.quantity_ordered);
            const received = Number((item as any).quantity_received || 0);
            const remaining = ordered - received;
            const qty = Math.min(receiveItems[item.id] || 0, remaining);
            return { id: item.id, quantity_received: qty };
        }).filter(i => i.quantity_received > 0) || [];

        if (items.length === 0) {
            toast.error('Enter at least one item quantity to receive');
            setReceiving(false);
            return;
        }

        try {
            const res = await fetch(`/purchase-orders/${po.id}/receive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
                body: JSON.stringify({ items }),
            });
            if (res.ok) {
                toast.success('Goods received');
                setShowReceive(false);
                router.reload({ preserveScroll: true });
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to receive goods');
            }
        } catch { toast.error('Failed to receive goods'); }
        setReceiving(false);
    }

    async function handleAction(action: string) {
        const res = await fetch(`/purchase-orders/${po.id}/${action}`, {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': getCsrfToken() },
        });
        if (res.ok) {
            toast.success(`Order ${action}ed`);
            router.reload({ preserveScroll: true });
        } else {
            const data = await res.json();
            toast.error(data.message || `Failed to ${action}`);
        }
    }

    const cfg = statusConfig[po.status] || statusConfig.draft;
    const StatusIcon = cfg.icon;

    return (
        <>
            <Head title={`PO ${po.reference_number}`} />
            <div className="flex flex-col gap-4 p-6">
                <PageHeader title={`PO: ${po.reference_number}`}
                    description={`Created ${new Date(po.created_at).toLocaleDateString()}`}
                    actions={
                        <div className="flex items-center gap-1.5">
                            <Button variant="outline" size="sm" asChild><Link href={purchaseOrders.index.url()}><ArrowLeft className="mr-1 size-3.5" /> Back</Link></Button>
                            {po.status === 'draft' && (
                                <Button variant="outline" size="sm" asChild><Link href={purchaseOrders.edit.url(po.id)}><Pencil className="mr-1 size-3.5" /> Edit</Link></Button>
                            )}
                            {po.status === 'draft' && (
                                <Button size="sm" onClick={() => handleAction('send')}><Send className="mr-1 size-3.5" /> Send</Button>
                            )}
                            {['sent', 'partial'].includes(po.status) && (
                                <Button size="sm" onClick={() => setShowReceive(true)}><Truck className="mr-1 size-3.5" /> Receive</Button>
                            )}
                            <Button variant="outline" size="sm" asChild><Link href={purchaseOrders.print.url(po.id)}><Printer className="mr-1 size-3.5" /> Print</Link></Button>
                            {['draft', 'sent', 'partial'].includes(po.status) && (
                                <Button variant="destructive" size="sm" onClick={() => handleAction('cancel')}><XCircle className="mr-1 size-3.5" /> Cancel</Button>
                            )}
                        </div>
                    } />

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Status timeline */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    {statusFlow.map((s, i) => {
                                        const sc = statusConfig[s];
                                        const currentIdx = statusFlow.indexOf(po.status);
                                        const isActive = i <= currentIdx && po.status !== 'cancelled';
                                        const isCancelled = po.status === 'cancelled';
                                        return (
                                            <div key={s} className="flex items-center gap-2">
                                                <div className={`flex size-8 items-center justify-center rounded-full ${isActive ? 'bg-primary text-primary-foreground' : isCancelled ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                                                    {React.createElement(sc.icon, { className: 'size-4' })}
                                                </div>
                                                <span className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{sc.label}</span>
                                                {i < statusFlow.length - 1 && <div className={`h-px w-8 ${isActive && i < currentIdx ? 'bg-primary' : 'bg-border'}`} />}
                                            </div>
                                        );
                                    })}
                                    {po.status === 'cancelled' && (
                                        <Badge variant="destructive" className="text-xs">Cancelled</Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Items */}
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-semibold">Ordered Products</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                                                <th className="px-3 py-2 font-medium">Product</th>
                                                <th className="px-3 py-2 font-medium">SKU</th>
                                                <th className="px-3 py-2 font-medium text-right">Ordered</th>
                                                <th className="px-3 py-2 font-medium text-right">Received</th>
                                                <th className="px-3 py-2 font-medium text-right">Remaining</th>
                                                <th className="px-3 py-2 font-medium text-right">Unit Cost</th>
                                                <th className="px-3 py-2 font-medium text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(po.items || []).map(item => {
                                                const ordered = Number(item.quantity_ordered);
                                                const received = Number((item as any).quantity_received || 0);
                                                const remaining = ordered - received;
                                                return (
                                                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                                                        <td className="px-3 py-2 font-medium">{item.product_name}</td>
                                                        <td className="px-3 py-2 text-muted-foreground">{item.product_sku || '—'}</td>
                                                        <td className="px-3 py-2 text-right">{ordered}</td>
                                                        <td className="px-3 py-2 text-right text-green-600 font-medium">{received}</td>
                                                        <td className="px-3 py-2 text-right text-muted-foreground">{remaining}</td>
                                                        <td className="px-3 py-2 text-right">₱{Number(item.unit_cost).toFixed(2)}</td>
                                                        <td className="px-3 py-2 text-right font-medium">₱{Number(item.total).toLocaleString()}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Supplier */}
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-semibold"><Building2 className="size-3.5 inline mr-1" /> Supplier</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {po.supplier ? (
                                    <>
                                        <p className="font-medium">{po.supplier.name}</p>
                                        {po.supplier.contact_person && <p className="text-muted-foreground">Contact: {po.supplier.contact_person}</p>}
                                        {po.supplier.email && <p className="text-muted-foreground">{po.supplier.email}</p>}
                                        {po.supplier.phone && <p className="text-muted-foreground">{po.supplier.phone}</p>}
                                    </>
                                ) : <p className="text-muted-foreground">No supplier assigned</p>}
                            </CardContent>
                        </Card>

                        {/* Summary */}
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-semibold">Summary</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Order Date</span><span>{po.order_date ? new Date(po.order_date).toLocaleDateString() : '—'}</span></div>
                                {po.expected_date && <div className="flex justify-between"><span className="text-muted-foreground">Expected</span><span>{new Date(po.expected_date).toLocaleDateString()}</span></div>}
                                <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>{po.items?.length || 0}</span></div>
                                <div className="border-t pt-2 space-y-1">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₱{Number(po.subtotal).toFixed(2)}</span></div>
                                    {Number(po.tax_amount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>₱{Number(po.tax_amount).toFixed(2)}</span></div>}
                                    {Number(po.shipping_cost) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>₱{Number(po.shipping_cost).toFixed(2)}</span></div>}
                                    <div className="flex justify-between font-semibold border-t pt-1"><span>Total</span><span>₱{Number(po.total).toLocaleString()}</span></div>
                                </div>
                                {po.notes && <div className="border-t pt-2"><p className="text-xs text-muted-foreground">{po.notes}</p></div>}
                                <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
                                    <span><User className="size-3 inline mr-1" />{(po as any).user?.name || '—'}</span>
                                    <span><Clock className="size-3 inline mr-1" />{new Date(po.created_at).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Receive Goods Modal */}
            <Dialog open={showReceive} onOpenChange={setShowReceive}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Receive Goods — {po.reference_number}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                                        <th className="px-2 py-1.5 font-medium">Product</th>
                                        <th className="px-2 py-1.5 font-medium text-right">Ordered</th>
                                        <th className="px-2 py-1.5 font-medium text-right">Received</th>
                                        <th className="px-2 py-1.5 font-medium text-right">Remaining</th>
                                        <th className="px-2 py-1.5 font-medium text-right">Receive Now</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(po.items || []).map(item => {
                                        const ordered = Number(item.quantity_ordered);
                                        const received = Number((item as any).quantity_received || 0);
                                        const remaining = ordered - received;
                                        return (
                                            <tr key={item.id} className="border-b last:border-0">
                                                <td className="px-2 py-1.5 font-medium">{item.product_name}</td>
                                                <td className="px-2 py-1.5 text-right">{ordered}</td>
                                                <td className="px-2 py-1.5 text-right text-green-600">{received}</td>
                                                <td className="px-2 py-1.5 text-right text-muted-foreground">{remaining}</td>
                                                <td className="px-2 py-1.5 text-right">
                                                    <Input type="number" min="0" max={remaining} step="1" className="h-8 w-20 text-xs text-right"
                                                        value={receiveItems[item.id] ?? ''}
                                                        onChange={e => setReceiveItems(prev => ({ ...prev, [item.id]: parseFloat(e.target.value) || 0 }))} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setShowReceive(false)}>Cancel</Button>
                            <Button onClick={handleReceive} disabled={receiving}>
                                <Truck className="mr-1 size-4" /> {receiving ? 'Receiving...' : 'Receive Goods'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

PurchaseOrderShow.layout = {
    breadcrumbs: [
        { title: 'Purchase Orders', href: purchaseOrders.index.url() },
        { title: 'Detail', href: '' },
    ],
};
