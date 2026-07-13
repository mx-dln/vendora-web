import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, BarChart3, Target, Clock, Users, Receipt, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import reports from '@/routes/reports';
import sales from '@/routes/sales';
import type { DailySalesReport, MonthlySalesReport, Transaction } from '@/types';

interface Props {
    daily: DailySalesReport;
    monthly: MonthlySalesReport;
    prevMonthly: MonthlySalesReport;
    growthRate: number;
    todayProfit: number;
    recentTransactions: Transaction[];
    bestHour: { hour: number; total: number; revenue: number } | null;
    bestDay: { day: string; revenue: number; transactions: number } | null;
    topCashiers: { user_id: number; total_transactions: number; total_sales: number; average_sale: number; user: { id: number; name: string } }[];
    filters: Record<string, string | undefined>;
}

const COLORS = ['#243F14', '#16A34A', '#F59E0B', '#6B7280', '#DC2626', '#8B5CF6'];

export default function ReportsSales({ daily, monthly, prevMonthly, growthRate, todayProfit, recentTransactions, bestHour, bestDay, topCashiers }: Props) {
    const [period, setPeriod] = useState<'today' | '7' | '30' | '90' | '12'>('30');

    const hourlyData = daily.hourly_breakdown?.map(h => ({ hour: h.hour, revenue: h.total, transactions: h.count })) || [];
    const dailyData = monthly.daily_breakdown?.map(d => ({ date: d.date, revenue: d.total, transactions: d.count })) || [];
    const paymentData = daily.payment_breakdown
        ? Object.entries(daily.payment_breakdown).map(([name, value]) => ({ name, value: value.total }))
        : [];

    const todayVsYesterday = daily.total_sales && daily.total_sales > 0
        ? Math.round(((daily.total_sales - (prevMonthly.total_sales / 30)) / (prevMonthly.total_sales / 30)) * 100)
        : 0;

    return (
        <>
            <Head title="Sales Report" />
            <div className="flex flex-col gap-4 p-6">
                <PageHeader title="Sales Report" description="Real-time sales analytics and performance metrics" />

                {/* KPI Cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <Card className="relative overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue Today</p>
                                    <p className="text-2xl font-bold">₱{Number(daily.total_sales).toLocaleString()}</p>
                                    <div className="flex items-center gap-1 text-xs">
                                        {todayVsYesterday >= 0 ? <TrendingUp className="size-3 text-green-600" /> : <TrendingDown className="size-3 text-red-600" />}
                                        <span className={todayVsYesterday >= 0 ? 'text-green-600' : 'text-red-600'}>{Math.abs(todayVsYesterday)}%</span>
                                        <span className="text-muted-foreground">vs yesterday</span>
                                    </div>
                                </div>
                                <div className="rounded-lg bg-primary/10 p-2"><DollarSign className="size-4 text-primary" /></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Revenue</p>
                                    <p className="text-2xl font-bold">₱{Number(monthly.total_sales).toLocaleString()}</p>
                                    <div className="flex items-center gap-1 text-xs">
                                        {growthRate >= 0 ? <TrendingUp className="size-3 text-green-600" /> : <TrendingDown className="size-3 text-red-600" />}
                                        <span className={growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>{Math.abs(growthRate)}%</span>
                                        <span className="text-muted-foreground">vs last month</span>
                                    </div>
                                </div>
                                <div className="rounded-lg bg-primary/10 p-2"><BarChart3 className="size-4 text-primary" /></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transactions</p>
                                    <p className="text-2xl font-bold">{monthly.total_transactions}</p>
                                    <p className="text-xs text-muted-foreground">{daily.total_transactions} today</p>
                                </div>
                                <div className="rounded-lg bg-blue-50 p-2"><ShoppingCart className="size-4 text-blue-600" /></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Order Value</p>
                                    <p className="text-2xl font-bold">₱{Number(monthly.average_sale).toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">Per transaction</p>
                                </div>
                                <div className="rounded-lg bg-amber-50 p-2"><Target className="size-4 text-amber-600" /></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross Profit</p>
                                    <p className="text-2xl font-bold">₱{Number(todayProfit).toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Today's estimate</p>
                                </div>
                                <div className="rounded-lg bg-green-50 p-2"><TrendingUp className="size-4 text-green-600" /></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Growth Rate</p>
                                    <p className={`text-2xl font-bold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>{growthRate >= 0 ? '+' : ''}{growthRate}%</p>
                                    <p className="text-xs text-muted-foreground">Month over month</p>
                                </div>
                                <div className="rounded-lg bg-purple-50 p-2"><BarChart3 className="size-4 text-purple-600" /></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                    {/* Main Analytics */}
                <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
                    <div className="lg:col-span-2 xl:col-span-3">
                        <Card>
                            <CardHeader className="flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-semibold">Revenue Overview</CardTitle>
                            <div className="flex gap-1">
                                {(['7', '30', '90', '12'] as const).map(p => (
                                    <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm" className="h-7 px-2 text-xs" onClick={() => setPeriod(p)}>{p === '12' ? '12 Months' : `${p} Days`}</Button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyData.slice(0, period === '7' ? 7 : period === '30' ? 30 : 90)}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice?.(-5) || v} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Revenue']} />
                                        <Bar dataKey="revenue" fill="#243F14" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                    </div>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Sales Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {paymentData.length > 0 && (
                                <div className="flex items-center gap-4">
                                    <div className="h-24 w-24 shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={paymentData} innerRadius={25} outerRadius={40} dataKey="value" paddingAngle={2}>
                                                    {paymentData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        {paymentData.map((p, i) => (
                                            <div key={p.name} className="flex items-center gap-2 text-xs">
                                                <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                                                <span className="flex-1 capitalize">{p.name}</span>
                                                <span className="font-medium">₱{Number(p.value).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="border-t pt-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Best Hour</span>
                                    <span className="font-medium">{bestHour ? `${bestHour.hour}:00 (${bestHour.total} txns)` : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Best Day</span>
                                    <span className="font-medium">{bestDay?.day || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Items Sold</span>
                                    <span className="font-medium">{daily.total_items}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Transactions + Top Cashiers */}
                <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
                    <div className="lg:col-span-2 xl:col-span-3">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={sales.index.url()}><ArrowUpRight className="size-3" /></Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentTransactions.length === 0 ? (
                                <p className="p-6 text-center text-sm text-muted-foreground">No transactions today</p>
                            ) : (
                                <div className="divide-y">
                                    {recentTransactions.map(t => (
                                        <div key={t.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Receipt className="size-4 shrink-0 text-muted-foreground" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{t.reference_number}</p>
                                                    <p className="text-xs text-muted-foreground">{t.customer?.name || 'Walk-in'} · {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Badge variant="outline" className="text-[10px] capitalize">{t.payment_method}</Badge>
                                                <span className="text-sm font-bold">₱{Number(t.total).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    </div>

                    <div className="w-full shrink-0">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Top Cashiers</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {topCashiers.length === 0 ? (
                                <p className="p-6 text-center text-sm text-muted-foreground">No data this month</p>
                            ) : (
                                <div className="divide-y">
                                    {topCashiers.map((c, i) => (
                                        <div key={c.user_id} className="flex items-center justify-between px-4 py-2.5">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="size-7 rounded-full overflow-hidden shrink-0 bg-muted">
                                                    <img src={c.user?.avatar || '/assets/avatar/default.png'} alt="" className="size-full object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{c.user?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-muted-foreground">{c.total_transactions} transactions</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold">₱{Number(c.total_sales).toLocaleString()}</p>
                                                <p className="text-xs text-muted-foreground">₱{Number(c.average_sale).toFixed(2)} avg</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
        </>
    );
}

ReportsSales.layout = {
    breadcrumbs: [{ title: 'Sales Report', href: reports.sales.url() }],
};
