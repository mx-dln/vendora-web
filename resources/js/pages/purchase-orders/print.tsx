import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import purchaseOrders from '@/routes/purchase-orders';
import type { PurchaseOrder } from '@/types';

interface Props { purchaseOrder: PurchaseOrder; }

export default function PurchaseOrderPrint({ purchaseOrder: po }: Props) {
    return (
        <>
            <Head title={`Print PO ${po.reference_number}`} />
            <div className="max-w-2xl mx-auto p-8 print:p-4">
                <div className="text-center mb-6 print:hidden">
                    <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                        <Printer className="size-4" /> Print
                    </button>
                </div>

                <div className="border rounded-lg p-6 bg-card">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-lg font-bold">Purchase Order</h1>
                            <p className="text-sm text-muted-foreground">{po.reference_number}</p>
                        </div>
                        <div className="text-right text-sm">
                            <p>Date: {po.order_date ? new Date(po.order_date).toLocaleDateString() : '—'}</p>
                            {po.expected_date && <p className="text-muted-foreground">Expected: {new Date(po.expected_date).toLocaleDateString()}</p>}
                        </div>
                    </div>

                    {po.supplier && (
                        <div className="mb-6 p-3 bg-muted/30 rounded-lg text-sm">
                            <p className="font-semibold mb-1">Supplier</p>
                            <p>{po.supplier.name}</p>
                            {po.supplier.address && <p className="text-muted-foreground">{po.supplier.address}</p>}
                            {po.supplier.email && <p className="text-muted-foreground">{po.supplier.email}</p>}
                            {po.supplier.phone && <p className="text-muted-foreground">{po.supplier.phone}</p>}
                        </div>
                    )}

                    <table className="w-full text-sm mb-4">
                        <thead>
                            <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                                <th className="pb-2 font-medium">Item</th>
                                <th className="pb-2 font-medium text-right">Qty</th>
                                <th className="pb-2 font-medium text-right">Unit Cost</th>
                                <th className="pb-2 font-medium text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(po.items || []).map(item => (
                                <tr key={item.id} className="border-b last:border-0">
                                    <td className="py-2">{item.product_name}{item.product_sku ? ` (${item.product_sku})` : ''}</td>
                                    <td className="py-2 text-right">{Number(item.quantity_ordered)}</td>
                                    <td className="py-2 text-right">₱{Number(item.unit_cost).toFixed(2)}</td>
                                    <td className="py-2 text-right font-medium">₱{Number(item.total).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="text-right space-y-1 text-sm border-t pt-3">
                        <div className="flex justify-end gap-8"><span className="text-muted-foreground">Subtotal:</span><span className="w-24 text-right">₱{Number(po.subtotal).toFixed(2)}</span></div>
                        {Number(po.tax_amount) > 0 && <div className="flex justify-end gap-8"><span className="text-muted-foreground">Tax:</span><span className="w-24 text-right">₱{Number(po.tax_amount).toFixed(2)}</span></div>}
                        {Number(po.shipping_cost) > 0 && <div className="flex justify-end gap-8"><span className="text-muted-foreground">Shipping:</span><span className="w-24 text-right">₱{Number(po.shipping_cost).toFixed(2)}</span></div>}
                        <div className="flex justify-end gap-8 font-bold text-base"><span>Total:</span><span className="w-24 text-right">₱{Number(po.total).toLocaleString()}</span></div>
                    </div>

                    {po.notes && <div className="mt-4 text-sm text-muted-foreground border-t pt-3"><p className="font-medium mb-1">Notes</p><p>{po.notes}</p></div>}
                </div>
            </div>
        </>
    );
}

PurchaseOrderPrint.layout = {
    breadcrumbs: [
        { title: 'Purchase Orders', href: purchaseOrders.index.url() },
        { title: 'Print', href: '' },
    ],
};
