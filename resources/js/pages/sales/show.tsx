import { useState } from 'react';

function fmtQty(qty: number | string): string {
    return parseFloat(String(qty)).toString();
}
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Printer, Ban, User, ShoppingBag, CreditCard, XCircle, Clock, CheckCircle, Package, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import sales from '@/routes/sales';
import type { Transaction, TransactionItem } from '@/types';

interface Props {
    transaction: Transaction;
}

const methodBadge: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; logo?: string }> = {
    cash: { variant: 'secondary' },
    gcash: { variant: 'default', logo: '/assets/Gcash.png' },
    maya: { variant: 'default', logo: '/assets/Maya.png' },
    mixed: { variant: 'outline' },
};

export default function SalesShow({ transaction }: Props) {
    const [showVoidDialog, setShowVoidDialog] = useState(false);
    const [voidReason, setVoidReason] = useState('');
    const [voiding, setVoiding] = useState(false);
    const [voidItemId, setVoidItemId] = useState<number | null>(null);
    const [showItemVoidDialog, setShowItemVoidDialog] = useState(false);
    const [itemVoidReason, setItemVoidReason] = useState('');
    const [itemVoiding, setItemVoiding] = useState(false);

    function handleVoid() {
        if (!voidReason.trim()) { toast.error('Please provide a reason for voiding'); return; }
        setVoiding(true);
        router.post(sales.void.url(transaction.id), { reason: voidReason }, {
            onSuccess: () => { toast.success('Transaction voided successfully'); setShowVoidDialog(false); },
            onError: () => toast.error('Failed to void transaction'),
            onFinish: () => setVoiding(false),
        });
    }

    const statusConfig = {
        completed: { label: 'Completed', variant: 'default' as const },
        voided: { label: 'Voided', variant: 'destructive' as const },
        refunded: { label: 'Refunded', variant: 'secondary' as const },
    };
    const status = statusConfig[transaction.status as keyof typeof statusConfig] || statusConfig.completed;
    const pmBadge = methodBadge[transaction.payment_method as keyof typeof methodBadge] || methodBadge.cash;
    const uniqueProducts = new Set(transaction.items?.map(i => i.product_id)).size;

    return (
        <>
            <Head title={`Sale ${transaction.reference_number}`} />

            {/* Top Section */}
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{transaction.reference_number}</h1>
                            <Badge variant={status.variant} className="text-xs capitalize">{status.label}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            {new Date(transaction.created_at).toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="default" asChild>
                            <Link href={sales.receipt.url(transaction.id)}>
                                <Printer className="mr-1 size-4" />
                                Print Receipt
                            </Link>
                        </Button>
                        {transaction.status === 'completed' && (
                            <Button variant="destructive" onClick={() => setShowVoidDialog(true)}>
                                <Ban className="mr-1 size-4" />
                                Void
                            </Button>
                        )}
                    </div>
                </div>

                {/* 2-Column Layout */}
                <div className="flex gap-4 items-start">
                    {/* Left Column — Items + Timeline */}
                    <div className="flex-1 min-w-0 space-y-4">
                        {/* Items Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">Purchased Items</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-card">
                                            <tr className="border-b text-muted-foreground text-xs uppercase tracking-wider">
                                                <th className="px-4 py-3 font-medium text-left">Product</th>
                                                <th className="px-4 py-3 font-medium text-center w-16">Qty</th>
                                                <th className="px-4 py-3 font-medium text-right w-24">Price</th>
                                                <th className="px-4 py-3 font-medium text-right w-24">Amount</th>
                                                {transaction.status === 'completed' && <th className="px-4 py-3 w-10" />}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transaction.items?.map((item, idx) => {
                                                const voided = Number(item.voided_quantity || 0);
                                                const remaining = Number(item.quantity) - voided;
                                                const qty = fmtQty(item.quantity);
                                                return (
                                                    <tr key={item.id} className={`${idx % 2 === 0 ? 'bg-muted/20' : ''} border-b last:border-0 hover:bg-muted/40 transition-colors ${voided > 0 ? 'opacity-50' : ''}`}>
                                                        <td className="px-4 py-3">
                                                            <p className="font-medium text-sm">{item.product_name}</p>
                                                            <p className="text-xs text-muted-foreground">{item.product_sku || ''}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Badge variant="secondary" className="text-xs font-mono">
                                                                {remaining > 0 ? remaining : <span className="line-through">{qty}</span>}
                                                            </Badge>
                                                            {voided > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">{fmtQty(voided)} voided</p>}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-muted-foreground">₱{Number(item.unit_price).toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-right font-medium">₱{(Number(item.total) / Number(item.quantity) * remaining).toFixed(2)}</td>
                                                        {transaction.status === 'completed' && remaining > 0 && (
                                                            <td className="px-4 py-3 text-right">
                                                                <Button variant="ghost" size="icon" className="size-7 text-destructive"
                                                                    onClick={() => { setVoidItemId(item.id); setShowItemVoidDialog(true); }}>
                                                                    <XCircle className="size-3.5" />
                                                                </Button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {(!transaction.items || transaction.items.length === 0) && (
                                    <p className="py-8 text-center text-sm text-muted-foreground">No items in this transaction.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Transaction Timeline */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold">Transaction Timeline</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center mt-0.5">
                                        <CheckCircle className="size-4 text-green-600" />
                                        <div className="w-px h-4 bg-border mt-1" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Transaction Created</p>
                                        <p className="text-xs text-muted-foreground">{new Date(transaction.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center mt-0.5">
                                        <CheckCircle className="size-4 text-green-600" />
                                        <div className="w-px h-4 bg-border mt-1" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Payment Received</p>
                                        <p className="text-xs text-muted-foreground capitalize">{transaction.payment_method} · ₱{Number(transaction.total).toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center mt-0.5">
                                        <CheckCircle className="size-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Receipt Generated</p>
                                        <p className="text-xs text-muted-foreground">{new Date(transaction.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes / Void Reason */}
                        {transaction.notes && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold">Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{transaction.notes}</p>
                                </CardContent>
                            </Card>
                        )}
                        {transaction.status === 'voided' && transaction.void_reason && (
                            <Card className="border-destructive/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-destructive">
                                        <Ban className="size-4" />
                                        Void Reason
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{transaction.void_reason}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Voided by {transaction.voidedBy?.name || 'Unknown'} · {transaction.voided_at ? new Date(transaction.voided_at).toLocaleString() : ''}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column — Summary */}
                    <div className="w-[340px] shrink-0 space-y-4">
                        {/* Order Summary */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold">Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>₱{Number(transaction.subtotal).toFixed(2)}</span></div>
                                {Number(transaction.discount_amount) > 0 && (
                                    <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-₱{Number(transaction.discount_amount).toFixed(2)}</span></div>
                                )}
                                {Number(transaction.tax_amount) > 0 && (
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({transaction.tax_rate}%)</span><span>₱{Number(transaction.tax_amount).toFixed(2)}</span></div>
                                )}
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>₱{Number(transaction.total).toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customer */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <User className="size-3.5 text-muted-foreground" />
                                    Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                                        <User className="size-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{transaction.customer?.name || 'Walk-in Customer'}</p>
                                        <p className="text-xs text-muted-foreground">{transaction.customer ? 'Registered' : 'No account'}</p>
                                    </div>
                                </div>
                                {transaction.customer?.phone && (
                                    <p className="text-sm text-muted-foreground mt-2">{transaction.customer.phone}</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <CreditCard className="size-3.5 text-muted-foreground" />
                                    Payment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2">
                                    {pmBadge.logo && <img src={pmBadge.logo} alt={transaction.payment_method || ''} className="h-5" />}
                                    <Badge variant={pmBadge.variant} className="capitalize text-xs">{transaction.payment_method}</Badge>
                                </div>
                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tendered</span><span>₱{Number(transaction.tendered_amount).toFixed(2)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Change</span><span>₱{Number(transaction.change_amount).toFixed(2)}</span></div>
                            </CardContent>
                        </Card>

                        {/* Transaction Stats */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold">Transaction Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><ShoppingBag className="size-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Items</span></div>
                                    <span className="text-sm font-medium">{transaction.item_count}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><Package className="size-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Products</span></div>
                                    <span className="text-sm font-medium">{uniqueProducts}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><User className="size-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Cashier</span></div>
                                    <span className="text-sm font-medium">{transaction.user?.name || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><Clock className="size-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Time</span></div>
                                    <span className="text-sm font-medium">{new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Item Void Dialog */}
            <Dialog open={showItemVoidDialog} onOpenChange={setShowItemVoidDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Void Item</DialogTitle><DialogDescription>Void this item and return to inventory.</DialogDescription></DialogHeader>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Reason</label>
                        <textarea className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Enter reason..." value={itemVoidReason} onChange={e => setItemVoidReason(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowItemVoidDialog(false)} disabled={itemVoiding}>Cancel</Button>
                        <Button variant="destructive" onClick={() => {
                            if (!itemVoidReason.trim()) { toast.error('Please provide a reason'); return; }
                            if (!voidItemId) return;
                            setItemVoiding(true);
                            router.post('/sales/items/' + voidItemId + '/void', { reason: itemVoidReason }, {
                                onSuccess: () => { toast.success('Item voided'); setShowItemVoidDialog(false); setItemVoidReason(''); setVoidItemId(null); },
                                onError: () => toast.error('Failed to void item'),
                                onFinish: () => setItemVoiding(false),
                            });
                        }} disabled={itemVoiding}>{itemVoiding ? 'Voiding...' : 'Void Item'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transaction Void Dialog */}
            <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Void Transaction</DialogTitle><DialogDescription>This will void the transaction and return items to inventory.</DialogDescription></DialogHeader>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Reason</label>
                        <textarea className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Enter reason..." value={voidReason} onChange={e => setVoidReason(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowVoidDialog(false)} disabled={voiding}>Cancel</Button>
                        <Button variant="destructive" onClick={handleVoid} disabled={voiding}>{voiding ? 'Voiding...' : 'Void Transaction'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
