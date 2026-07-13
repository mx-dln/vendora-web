import { Head, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import reports from '@/routes/reports';
import type { PaginatedData } from '@/types';

interface CashierPerformanceItem {
    user_id: number;
    user_name: string;
    transactions_count: number;
    total_sales: number;
    average_sale: number;
    items_sold: number;
}

interface Props {
    cashiers: CashierPerformanceItem[];
    filters: Record<string, string | undefined>;
}

export default function CashierPerformance({ cashiers, filters }: Props) {
    function applyFilter(key: string, value: string) {
        router.get(reports.cashierPerformance.url(), { ...filters, [key]: value });
    }

    return (
        <>
            <Head title="Cashier Performance" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Cashier Performance" description="Compare cashier sales performance" />

                <div className="flex gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">From</span>
                        <Input type="date" value={filters.start_date || ''} onChange={e => applyFilter('start_date', e.target.value)} className="w-40" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">To</span>
                        <Input type="date" value={filters.end_date || ''} onChange={e => applyFilter('end_date', e.target.value)} className="w-40" />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50 text-left">
                                <th className="p-3 font-medium">Cashier</th>
                                <th className="p-3 text-right font-medium">Transactions</th>
                                <th className="p-3 text-right font-medium">Total Sales</th>
                                <th className="p-3 text-right font-medium">Avg Sale</th>
                                <th className="p-3 text-right font-medium">Items Sold</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cashiers.length === 0 ? (
                                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No data available for this period</td></tr>
                            ) : cashiers.map((c, i) => (
                                <tr key={c.user_id || i} className="border-b last:border-0 hover:bg-muted/30">
                                    <td className="p-3 font-medium">{c.user_name}</td>
                                    <td className="p-3 text-right">{c.transactions_count}</td>
                                    <td className="p-3 text-right font-medium">₱{Number(c.total_sales).toFixed(2)}</td>
                                    <td className="p-3 text-right">₱{Number(c.average_sale).toFixed(2)}</td>
                                    <td className="p-3 text-right">{c.items_sold}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {cashiers.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-4">
                        {(() => {
                            const totalSales = cashiers.reduce((s, c) => s + c.total_sales, 0);
                            const totalTxns = cashiers.reduce((s, c) => s + c.transactions_count, 0);
                            const topCashier = cashiers.reduce((best, c) => c.total_sales > best.total_sales ? c : best, cashiers[0]);
                            return (
                                <>
                                    <div className="rounded-lg border bg-card p-3">
                                        <p className="text-xs text-muted-foreground">Total Sales (All)</p>
                                        <p className="text-lg font-bold">₱{totalSales.toFixed(2)}</p>
                                    </div>
                                    <div className="rounded-lg border bg-card p-3">
                                        <p className="text-xs text-muted-foreground">Total Transactions</p>
                                        <p className="text-lg font-bold">{totalTxns}</p>
                                    </div>
                                    <div className="rounded-lg border bg-card p-3">
                                        <p className="text-xs text-muted-foreground">Overall Avg Sale</p>
                                        <p className="text-lg font-bold">₱{(totalTxns > 0 ? totalSales / totalTxns : 0).toFixed(2)}</p>
                                    </div>
                                    <div className="rounded-lg border bg-card p-3">
                                        <p className="text-xs text-muted-foreground">Top Performer</p>
                                        <p className="text-lg font-bold truncate">{topCashier.user_name}</p>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
        </>
    );
}

CashierPerformance.layout = {
    breadcrumbs: [
        { title: 'Reports', href: reports.sales.url() },
        { title: 'Cashier Performance', href: reports.cashierPerformance.url() },
    ],
};
