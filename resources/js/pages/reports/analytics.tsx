import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import analytics from '@/routes/analytics';
import type { RevenueData } from '@/types';

interface HourlyData {
    hour: number;
    transactions: number;
    revenue: number;
}

interface DailyData {
    day: string;
    transactions: number;
    revenue: number;
}

interface CustomerAnalytics {
    retention_groups: { group: string; count: number; percentage: number }[];
    avg_lifetime_value: number;
    avg_visits: number;
    avg_order_value: number;
}

interface ReportData {
    hours: HourlyData[];
    days: DailyData[];
    revenue_trend: RevenueData[];
    customer: CustomerAnalytics;
}

interface Props {
    report: ReportData;
    filters: Record<string, string | undefined>;
}

export default function ReportsAnalytics({ report, filters }: Props) {
    function applyFilter(key: string, value: string) {
        router.get(analytics.index.url(), { ...filters, [key]: value });
    }

    const maxHourRevenue = Math.max(...report.hours.map(h => h.revenue), 1);
    const maxDayRevenue = Math.max(...report.days.map(d => d.revenue), 1);
    const maxTrendRevenue = Math.max(...report.revenue_trend.map(r => r.revenue), 1);

    return (
        <>
            <Head title="Advanced Analytics" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Advanced Analytics" description="Deep dive into your business data" />

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

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle>Best Selling Hours</CardTitle></CardHeader>
                        <CardContent>
                            <table className="w-full text-sm">
                                <thead><tr className="border-b text-left">
                                    <th className="pb-2 font-medium">Hour</th>
                                    <th className="pb-2 text-right font-medium">Transactions</th>
                                    <th className="pb-2 text-right font-medium">Revenue</th>
                                </tr></thead>
                                <tbody>
                                    {report.hours.length === 0 ? (
                                        <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">No data</td></tr>
                                    ) : report.hours.map(h => (
                                        <tr key={h.hour} className="border-b last:border-0">
                                            <td className="py-2">{h.hour}:00</td>
                                            <td className="py-2 text-right">{h.transactions}</td>
                                            <td className="py-2 text-right font-medium">₱{Number(h.revenue).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {report.hours.length > 0 && (
                                <div className="mt-3 flex items-end gap-1" style={{ height: '60px' }}>
                                    {report.hours.map(h => (
                                        <div key={h.hour} className="group relative flex flex-1 items-end justify-center">
                                            <div className="w-full rounded-sm bg-primary/60 transition-all hover:bg-primary/80"
                                                style={{ height: `${(h.revenue / maxHourRevenue) * 50}px` }}
                                                title={`${h.hour}:00 - ₱${Number(h.revenue).toFixed(2)}`} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Best Selling Days</CardTitle></CardHeader>
                        <CardContent>
                            <table className="w-full text-sm">
                                <thead><tr className="border-b text-left">
                                    <th className="pb-2 font-medium">Day</th>
                                    <th className="pb-2 text-right font-medium">Transactions</th>
                                    <th className="pb-2 text-right font-medium">Revenue</th>
                                </tr></thead>
                                <tbody>
                                    {report.days.length === 0 ? (
                                        <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">No data</td></tr>
                                    ) : report.days.map(d => (
                                        <tr key={d.day} className="border-b last:border-0">
                                            <td className="py-2 capitalize">{d.day}</td>
                                            <td className="py-2 text-right">{d.transactions}</td>
                                            <td className="py-2 text-right font-medium">₱{Number(d.revenue).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {report.days.length > 0 && (
                                <div className="mt-3 flex items-end gap-1" style={{ height: '60px' }}>
                                    {report.days.map(d => (
                                        <div key={d.day} className="group relative flex flex-1 items-end justify-center">
                                            <div className="w-full rounded-sm bg-green-600/60 transition-all hover:bg-green-600/80"
                                                style={{ height: `${(d.revenue / maxDayRevenue) * 50}px` }}
                                                title={`${d.day} - ₱${Number(d.revenue).toFixed(2)}`} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
                    <CardContent>
                        {report.revenue_trend.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">No revenue data for this period</p>
                        ) : (
                            <div className="flex items-end gap-2" style={{ height: '160px' }}>
                                {report.revenue_trend.map(r => (
                                    <div key={r.month || r.month} className="group relative flex flex-1 flex-col items-center justify-end h-full">
                                        <span className="mb-1 text-[10px] font-medium text-muted-foreground">
                                            ₱{(r.revenue / 1000).toFixed(0)}k
                                        </span>
                                        <div className="w-full rounded-sm transition-all hover:opacity-90 bg-primary"
                                            style={{ height: `${Math.max((r.revenue / maxTrendRevenue) * 130, 4)}px` }}>
                                            <div className="absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow group-hover:block">
                                                ₱{Number(r.revenue).toLocaleString()} · {r.transactions} txns
                                            </div>
                                        </div>
                                        <span className="mt-1 text-[10px] text-muted-foreground">
                                            {'short_month' in r ? (r as unknown as { short_month: string }).short_month : r.month}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle>Customer Retention</CardTitle></CardHeader>
                        <CardContent>
                            {report.customer?.retention_groups?.length > 0 ? (
                                <div className="space-y-2">
                                    {report.customer.retention_groups.map(g => (
                                        <div key={g.group} className="flex items-center justify-between text-sm">
                                            <span className="capitalize">{g.group.replace('_', ' ')}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-32 rounded-full bg-muted">
                                                    <div className="h-2 rounded-full bg-primary" style={{ width: `${g.percentage}%` }} />
                                                </div>
                                                <span className="w-12 text-right font-medium">{g.count}</span>
                                                <span className="w-12 text-right text-muted-foreground">{g.percentage}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="py-6 text-center text-sm text-muted-foreground">No customer retention data</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Lifetime Value Metrics</CardTitle></CardHeader>
                        <CardContent>
                            {report.customer ? (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="rounded-lg border p-3 text-center">
                                        <p className="text-xs text-muted-foreground">Avg LTV</p>
                                        <p className="text-xl font-bold">₱{Number(report.customer.avg_lifetime_value).toFixed(2)}</p>
                                    </div>
                                    <div className="rounded-lg border p-3 text-center">
                                        <p className="text-xs text-muted-foreground">Avg Visits</p>
                                        <p className="text-xl font-bold">{report.customer.avg_visits.toFixed(1)}</p>
                                    </div>
                                    <div className="rounded-lg border p-3 text-center">
                                        <p className="text-xs text-muted-foreground">Avg Order Value</p>
                                        <p className="text-xl font-bold">₱{Number(report.customer.avg_order_value).toFixed(2)}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="py-6 text-center text-sm text-muted-foreground">No LTV data available</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

ReportsAnalytics.layout = {
    breadcrumbs: [
        { title: 'Reports', href: '' },
        { title: 'Advanced Analytics', href: analytics.index.url() },
    ],
};
