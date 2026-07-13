import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import reports from '@/routes/reports';
import type { ProfitLossReport } from '@/types';

interface Props {
    report: ProfitLossReport;
    filters: Record<string, string | undefined>;
}

export default function ProfitLoss({ report, filters }: Props) {
    function applyFilter(key: string, value: string) {
        router.get(reports['profit-loss'].url(), { ...filters, [key]: value });
    }

    return (
        <>
            <Head title="Profit & Loss" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Profit & Loss" description="Revenue, costs, and profitability analysis" />

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

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Sales</p><p className="text-2xl font-bold text-green-600">₱{Number(report.total_sales).toFixed(2)}</p></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Cost of Goods Sold</p><p className="text-2xl font-bold text-red-600">₱{Number(report.cost_of_goods_sold).toFixed(2)}</p></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Gross Profit</p><p className="text-2xl font-bold">₱{Number(report.gross_profit).toFixed(2)}</p><p className="text-xs text-muted-foreground">{report.gross_margin}% margin</p></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Gross Margin</p><p className="text-2xl font-bold">{report.gross_margin}%</p></CardContent></Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Expenses</p><p className="text-2xl font-bold text-red-600">₱{Number(report.total_expenses).toFixed(2)}</p></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Net Profit</p><p className="text-2xl font-bold">₱{Number(report.net_profit).toFixed(2)}</p><p className="text-xs text-muted-foreground">{report.net_margin}% margin</p></CardContent></Card>
                </div>
            </div>
        </>
    );
}

ProfitLoss.layout = {
    breadcrumbs: [
        { title: 'Reports', href: reports.sales.url() },
        { title: 'Profit & Loss', href: reports['profit-loss'].url() },
    ],
};
