import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import customers from '@/routes/customers';
import sales from '@/routes/sales';
import type { Customer, Transaction } from '@/types';

interface Props {
    customer: Customer & { transactions: Transaction[] };
}

export default function CustomersShow({ customer }: Props) {
    return (
        <>
            <Head title={customer.name} />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader
                    title={customer.name}
                    description="Customer profile and purchase history"
                    actions={
                        <Button variant="outline" asChild>
                            <Link href={customers.index.url()}><ArrowLeft className="mr-1 size-4" />Back</Link>
                        </Button>
                    }
                />
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {customer.email && <p className="flex items-center gap-2 text-sm"><Mail className="size-4 text-muted-foreground" />{customer.email}</p>}
                            {customer.phone && <p className="flex items-center gap-2 text-sm"><Phone className="size-4 text-muted-foreground" />{customer.phone}</p>}
                            {customer.address && <p className="flex items-center gap-2 text-sm"><MapPin className="size-4 text-muted-foreground" />{customer.address}</p>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Statistics</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-sm">Total Purchases: <strong>₱{Number(customer.total_purchases).toFixed(2)}</strong></p>
                            <p className="text-sm">Visit Count: <strong>{customer.visit_count}</strong></p>
                            <p className="text-sm">Last Visit: <strong>{customer.last_visit_at ? new Date(customer.last_visit_at).toLocaleDateString() : 'Never'}</strong></p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Status</CardTitle></CardHeader>
                        <CardContent>
                            <Badge variant={customer.is_active ? 'default' : 'secondary'}>{customer.is_active ? 'Active' : 'Inactive'}</Badge>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Purchase History</CardTitle></CardHeader>
                    <CardContent>
                        {customer.transactions?.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No purchases yet</p>}
                        {customer.transactions?.map(t => (
                            <div key={t.id} className="flex items-center justify-between border-b py-2 last:border-0">
                                <div>
                                    <Link href={sales.show.url(t.id)} className="text-sm font-medium hover:underline">{t.reference_number}</Link>
                                    <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className="text-sm font-bold">₱{Number(t.total).toFixed(2)}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CustomersShow.layout = {
    breadcrumbs: [
        { title: 'Customers', href: customers.index.url() },
        { title: customer.name, href: customers.show.url(customer.id) },
    ],
};
