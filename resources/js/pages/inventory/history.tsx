import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import inventory from '@/routes/inventory';
import type { Product, InventoryMovement } from '@/types';

interface Props {
    product: Product;
    movements: { data: InventoryMovement[]; current_page: number; last_page: number; total: number; from: number; to: number };
}

export default function InventoryHistory({ product, movements }: Props) {
    return (
        <>
            <Head title={`${product.name} - History`} />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader
                    title={`${product.name} - Stock History`}
                    description={`Current stock: ${product.stock_quantity}`}
                    actions={
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => window.open(`/inventory/${product.id}/print-history`, '_blank')}>
                                <Printer className="mr-1 size-3" />
                                Print
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={inventory.index.url()}><ArrowLeft className="mr-1 size-4" />Back</Link>
                            </Button>
                        </div>
                    }
                />
                <Card>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="p-3 font-medium">Date</th>
                                    <th className="p-3 font-medium">Type</th>
                                    <th className="p-3 font-medium">Qty</th>
                                    <th className="p-3 font-medium">Before</th>
                                    <th className="p-3 font-medium">After</th>
                                    <th className="p-3 font-medium">User</th>
                                    <th className="p-3 font-medium">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.data.map(m => (
                                    <tr key={m.id} className="border-b last:border-0">
                                        <td className="p-3">{new Date(m.created_at).toLocaleString()}</td>
                                        <td className="p-3">
                                            <Badge variant={m.type === 'stock_in' ? 'default' : m.type === 'stock_out' || m.type === 'sale' ? 'destructive' : 'secondary'}>
                                                {m.type.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="p-3 font-medium">{m.quantity}</td>
                                        <td className="p-3">{m.quantity_before}</td>
                                        <td className="p-3">{m.quantity_after}</td>
                                        <td className="p-3">{m.user?.name || 'System'}</td>
                                        <td className="p-3 text-muted-foreground">{m.notes || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {movements.data.length === 0 && <p className="p-8 text-center text-muted-foreground">No stock movements recorded.</p>}
                    </CardContent>
                </Card>

                {movements.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {movements.from} to {movements.to} of {movements.total}
                        </p>
                        <div className="flex gap-1">
                            {movements.current_page > 1 && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={inventory.history.url(product.id, { page: movements.current_page - 1 })}>Previous</Link>
                                </Button>
                            )}
                            {movements.current_page < movements.last_page && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={inventory.history.url(product.id, { page: movements.current_page + 1 })}>Next</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

InventoryHistory.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: inventory.index.url() },
        { title: 'History', href: inventory.index.url() },
    ],
};
