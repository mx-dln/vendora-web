import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/page-header';
import goodsReceivings from '@/routes/goods-receivings';
import type { GoodsReceiving, InventoryMovement } from '@/types';

interface GoodsReceivingItem {
    id: number;
    product_id: number;
    product_name: string;
    qty_ordered: number;
    qty_received: number;
    qty_damaged: number;
    unit_cost: number;
    subtotal: number;
}

interface Props {
    goodsReceiving: GoodsReceiving & {
        items: GoodsReceivingItem[];
        movements: InventoryMovement[];
    };
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
    received: 'default',
    partial: 'secondary',
    cancelled: 'destructive',
};

export default function GoodsReceivingsShow({ goodsReceiving: gr }: Props) {
    const itemsTotal = gr.items?.reduce((sum, i) => sum + i.subtotal, 0) || 0;

    return (
        <>
            <Head title={`GR-${gr.reference_number}`} />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader
                    title={`Goods Receiving - ${gr.reference_number}`}
                    description={`Received on ${gr.received_date}`}
                    actions={
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href={goodsReceivings.index.url()}><ArrowLeft className="mr-1 size-4" />Back</Link>
                            </Button>
                            <Button variant="outline" onClick={() => window.print()}>
                                <Printer className="mr-1 size-4" />Print
                            </Button>
                        </div>
                    }
                />

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Supplier</CardTitle></CardHeader>
                        <CardContent>
                            <p className="font-medium">{gr.supplier?.name || 'N/A'}</p>
                            {gr.supplier?.phone && <p className="text-sm text-muted-foreground">{gr.supplier.phone}</p>}
                            {gr.supplier?.email && <p className="text-sm text-muted-foreground">{gr.supplier.email}</p>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Details</CardTitle></CardHeader>
                        <CardContent className="space-y-1">
                            <p className="text-sm">Reference: <strong>{gr.reference_number}</strong></p>
                            <p className="text-sm">Delivery Note: <strong>{gr.delivery_note || '-'}</strong></p>
                            <p className="text-sm">Received By: <strong>{gr.user?.name || '-'}</strong></p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Status</CardTitle></CardHeader>
                        <CardContent>
                            <Badge variant={statusVariants[gr.status] || 'outline'} className="capitalize text-sm">{gr.status}</Badge>
                            <p className="text-sm text-muted-foreground mt-1">{gr.items?.length || 0} items</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Items Received</CardTitle></CardHeader>
                    <CardContent>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="pb-2 font-medium">Product</th>
                                    <th className="pb-2 text-right font-medium">Qty Ordered</th>
                                    <th className="pb-2 text-right font-medium">Qty Received</th>
                                    <th className="pb-2 text-right font-medium">Damaged</th>
                                    <th className="pb-2 text-right font-medium">Unit Cost</th>
                                    <th className="pb-2 text-right font-medium">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gr.items?.map(item => (
                                    <tr key={item.id} className="border-b last:border-0">
                                        <td className="py-2">{item.product_name}</td>
                                        <td className="py-2 text-right">{item.qty_ordered}</td>
                                        <td className="py-2 text-right font-medium">{item.qty_received}</td>
                                        <td className="py-2 text-right">{item.qty_damaged > 0 ? item.qty_damaged : '-'}</td>
                                        <td className="py-2 text-right">₱{Number(item.unit_cost).toFixed(2)}</td>
                                        <td className="py-2 text-right font-medium">₱{Number(item.subtotal).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {(!gr.items || gr.items.length === 0) && (
                                    <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No items recorded</td></tr>
                                )}
                            </tbody>
                        </table>
                        <Separator className="my-3" />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>₱{itemsTotal.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>

                {gr.notes && (
                    <Card>
                        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground">{gr.notes}</p></CardContent>
                    </Card>
                )}

                {gr.movements && gr.movements.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>Inventory Movement Log</CardTitle></CardHeader>
                        <CardContent>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-2 font-medium">Date</th>
                                        <th className="pb-2 font-medium">Product</th>
                                        <th className="pb-2 text-right font-medium">Qty</th>
                                        <th className="pb-2 text-right font-medium">Before</th>
                                        <th className="pb-2 text-right font-medium">After</th>
                                        <th className="pb-2 font-medium">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gr.movements.map(m => (
                                        <tr key={m.id} className="border-b last:border-0">
                                            <td className="py-2">{new Date(m.created_at).toLocaleString()}</td>
                                            <td className="py-2">{m.product?.name || '-'}</td>
                                            <td className="py-2 text-right font-medium">{m.quantity}</td>
                                            <td className="py-2 text-right">{m.quantity_before}</td>
                                            <td className="py-2 text-right">{m.quantity_after}</td>
                                            <td className="py-2 text-muted-foreground">{m.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

GoodsReceivingsShow.layout = {
    breadcrumbs: [
        { title: 'Goods Receiving', href: goodsReceivings.index.url() },
        { title: gr => `GR-${gr.reference_number}`, href: goodsReceivings.show.url(gr.id) },
    ],
};
