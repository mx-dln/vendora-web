import { Head, Link } from '@inertiajs/react';
import { Eye, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table/data-table';
import sales from '@/routes/sales';
import type { Transaction, PaginatedData } from '@/types';

interface Props {
    transactions: PaginatedData<Transaction>;
    filters: Record<string, string | undefined>;
}

export default function SalesIndex({ transactions, filters }: Props) {
    const columns: Column<Transaction>[] = [
        {
            key: 'reference_number',
            label: 'Reference',
            sortable: true,
            render: (t) => (
                <Link href={sales.show.url(t.id)} className="font-medium hover:underline">
                    {t.reference_number}
                </Link>
            ),
        },
        {
            key: 'user',
            label: 'Cashier',
            render: (t) => t.user?.name || 'N/A',
        },
        {
            key: 'customer',
            label: 'Customer',
            render: (t) => t.customer?.name || 'Walk-in',
        },
        {
            key: 'item_count',
            label: 'Items',
            sortable: true,
        },
        {
            key: 'total',
            label: 'Total',
            sortable: true,
            render: (t) => `\u20B1${Number(t.total).toFixed(2)}`,
        },
        {
            key: 'payment_method',
            label: 'Payment',
            render: (t) => (
                <Badge variant="outline" className="capitalize">
                    {t.payment_method}
                </Badge>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (t) => (
                <Badge variant={
                    t.status === 'completed' ? 'default' :
                    t.status === 'voided' ? 'destructive' : 'secondary'
                }>
                    {t.status}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            label: 'Date',
            sortable: true,
            render: (t) => new Date(t.created_at).toLocaleString(),
        },
    ];

    return (
        <>
            <Head title="Sales" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader
                    title="Sales"
                    description="View and manage all transactions"
                />
                <DataTable<Transaction>
                    data={transactions}
                    columns={columns}
                    filters={filters}
                    baseRoute={sales.index.url()}
                    searchPlaceholder="Search by reference number..."
                    actions={(t) => (
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={sales.show.url(t.id)}>
                                    <Eye className="size-4" />
                                </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={sales.receipt.url(t.id)}>
                                    <Printer className="size-4" />
                                </Link>
                            </Button>
                        </div>
                    )}
                />
            </div>
        </>
    );
}
