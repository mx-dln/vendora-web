import { useState, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ReceiptPrint from '@/components/receipt-print';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import sales from '@/routes/sales';
import type { Transaction } from '@/types';

interface Props {
    transaction: Transaction;
    storeSettings?: Record<string, string>;
}

export default function SalesReceipt({ transaction, storeSettings }: Props) {
    const receiptPrintRef = useRef<{ print: () => void }>(null);
    const [showReceipt, setShowReceipt] = useState(true);

    return (
        <>
            <Head title={`Receipt - ${transaction.reference_number}`} />

            <div className="no-print fixed right-4 top-4 z-50 flex gap-2">
                <Button variant="outline" onClick={() => receiptPrintRef.current?.print()}>
                    <Printer className="mr-1 size-4" />
                    Print
                </Button>
                <Button variant="outline" asChild>
                    <Link href={sales.show.url(transaction.id)}>
                        <ArrowLeft className="mr-1 size-4" />
                        Back
                    </Link>
                </Button>
            </div>

            <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Receipt</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 text-sm">
                        <div className="text-center">
                            <img src="/brand/logo-dark.png" alt="Vendora" className="mx-auto mb-2 h-8 w-auto" />
                            <p className="text-muted-foreground text-xs">Thank you for your purchase!</p>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{transaction.reference_number}</span>
                            <span>{new Date(transaction.created_at).toLocaleString()}</span>
                        </div>
                        <Separator />
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b font-medium">
                                    <td className="pb-1">Item</td>
                                    <td className="pb-1 text-right">Price</td>
                                    <td className="pb-1 text-right">Qty</td>
                                    <td className="pb-1 text-right">Total</td>
                                </tr>
                            </thead>
                            <tbody>
                                {transaction.items?.map(item => (
                                    <tr key={item.id}>
                                        <td className="py-0.5">{item.product_name}</td>
                                        <td className="py-0.5 text-right">₱{Number(item.unit_price).toFixed(2)}</td>
                                        <td className="py-0.5 text-right">{parseFloat(String(item.quantity)).toString()}</td>
                                        <td className="py-0.5 text-right">₱{Number(item.total).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Separator />
                        <div className="space-y-0.5">
                            <div className="flex justify-between text-xs">
                                <span>Subtotal</span>
                                <span>₱{Number(transaction.subtotal).toFixed(2)}</span>
                            </div>
                            {Number(transaction.discount_amount) > 0 && (
                                <div className="flex justify-between text-xs text-green-600">
                                    <span>Discount</span>
                                    <span>-₱{Number(transaction.discount_amount).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-bold">
                                <span>Total</span>
                                <span>₱{Number(transaction.total).toFixed(2)}</span>
                            </div>
                        </div>
                        <Separator />
                        <div className="text-xs text-muted-foreground">
                            <p>Paid via: {transaction.payment_method?.toUpperCase()}</p>
                            <p>Tendered: ₱{Number(transaction.tendered_amount).toFixed(2)}</p>
                            <p>Change: ₱{Number(transaction.change_amount).toFixed(2)}</p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 no-print">
                        <Button variant="outline" onClick={() => receiptPrintRef.current?.print()}>
                            <Printer className="mr-1 size-4" />
                            Print Receipt
                        </Button>
                        <Button variant="ghost" onClick={() => setShowReceipt(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ReceiptPrint ref={receiptPrintRef} transaction={transaction} settings={storeSettings} />
        </>
    );
}
