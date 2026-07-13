import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Star, Award, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import loyalty from '@/routes/loyalty';
import type { Customer } from '@/types';

interface PointsTransaction {
    id: number;
    points: number;
    type: 'earned' | 'redeemed' | 'expired' | 'adjustment';
    reference_type: string | null;
    reference_id: number | null;
    amount: number | null;
    notes: string | null;
    created_at: string;
}

interface Props {
    customer: Customer & { loyalty_points: number; tier: string };
    pointsHistory: PointsTransaction[];
}

const TIER_COLORS: Record<string, string> = {
    Regular: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    Silver: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    Gold: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    Platinum: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

export default function LoyaltyCustomer({ customer, pointsHistory }: Props) {
    return (
        <>
            <Head title={`${customer.name} - Loyalty`} />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader
                    title={customer.name}
                    description="Loyalty points and rewards history"
                    actions={
                        <Button variant="outline" asChild>
                            <Link href={loyalty.index.url()}><ArrowLeft className="mr-1 size-4" />Back</Link>
                        </Button>
                    }
                />

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Star className="size-4 text-amber-500" />Points Balance</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{customer.loyalty_points || 0}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Award className="size-4" />Tier</CardTitle></CardHeader>
                        <CardContent>
                            <Badge variant="outline" className={`text-sm px-3 py-1 ${TIER_COLORS[customer.tier] || ''}`}>{customer.tier || 'Regular'}</Badge>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Gift className="size-4" />Total Purchases</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">₱{Number(customer.total_purchases).toFixed(2)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Star className="size-4" />Visits</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{customer.visit_count}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Points Transaction History</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="p-3 font-medium">Date</th>
                                    <th className="p-3 font-medium">Type</th>
                                    <th className="p-3 text-right font-medium">Points</th>
                                    <th className="p-3 text-right font-medium">Amount</th>
                                    <th className="p-3 font-medium">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pointsHistory.length === 0 ? (
                                    <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No points history yet</td></tr>
                                ) : pointsHistory.map(pt => (
                                    <tr key={pt.id} className="border-b last:border-0">
                                        <td className="p-3">{new Date(pt.created_at).toLocaleString()}</td>
                                        <td className="p-3">
                                            <Badge variant={pt.type === 'earned' ? 'default' : pt.type === 'redeemed' ? 'secondary' : 'outline'} className="capitalize">
                                                {pt.type}
                                            </Badge>
                                        </td>
                                        <td className={`p-3 text-right font-bold ${pt.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                                            {pt.type === 'earned' ? '+' : '-'}{pt.points}
                                        </td>
                                        <td className="p-3 text-right">{pt.amount ? `₱${Number(pt.amount).toFixed(2)}` : '-'}</td>
                                        <td className="p-3 text-muted-foreground">{pt.notes || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

LoyaltyCustomer.layout = {
    breadcrumbs: [
        { title: 'Customer Loyalty', href: loyalty.index.url() },
        { title: customer.name, href: loyalty.customers.history.url(customer.id) },
    ],
};
