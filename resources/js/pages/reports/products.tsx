import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Package, DollarSign, TrendingUp, Target, Zap, AlertTriangle, Search, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import reports from '@/routes/reports';
import type { TopProduct } from '@/types';

interface Props {
    topProducts: TopProduct[];
    totalSold: number;
    totalRevenue: number;
    totalProfit: number;
    categoryPerformance: { name: string; total_qty: number; total_revenue: number }[];
    filters: Record<string, string | undefined>;
}

const COLORS = ['#243F14', '#16A34A', '#F59E0B', '#6B7280', '#8B5CF6'];

export default function ReportsProducts({ topProducts, totalSold, totalRevenue, totalProfit, categoryPerformance }: Props) {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<'qty' | 'revenue' | 'profit' | 'margin'>('qty');
    const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

    const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    const sorted = [...topProducts]
        .filter(p => p.product_name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            const aProfit = a.total_revenue - (a.total_revenue * 0.6);
            const bProfit = b.total_revenue - (b.total_revenue * 0.6);
            const aMargin = a.total_revenue > 0 ? (aProfit / a.total_revenue) * 100 : 0;
            const bMargin = b.total_revenue > 0 ? (bProfit / b.total_revenue) * 100 : 0;
            const vals = { qty: a.total_quantity - b.total_quantity, revenue: a.total_revenue - b.total_revenue, profit: aProfit - bProfit, margin: aMargin - bMargin };
            return sortDir === 'desc' ? vals[sortKey] : -vals[sortKey];
        });

    const bestSeller = topProducts[0];
    const worstPerformer = topProducts[topProducts.length - 1];
    const fastMovers = topProducts.filter(p => p.total_quantity > 10).length;
    const slowMovers = topProducts.filter(p => p.total_quantity <= 2).length;
    const maxCatRevenue = Math.max(...categoryPerformance.map(c => c.total_revenue), 1);

    return (
        <>
            <Head title="Product Report" />
            <div className="flex flex-col gap-4 p-6">
                <PageHeader title="Product Intelligence" description="Product performance, profitability, and trends" />

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <Card><CardContent className="p-4">
                        <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Products Sold</p><p className="text-2xl font-bold">{totalSold}</p></div>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                        <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue</p><p className="text-2xl font-bold">₱{Number(totalRevenue).toLocaleString()}</p></div>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                        <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross Profit</p><p className="text-2xl font-bold">₱{Number(totalProfit).toLocaleString()}</p><p className="text-xs text-muted-foreground">{margin}% margin</p></div>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                        <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Best Seller</p><p className="text-sm font-bold truncate">{bestSeller?.product_name || 'N/A'}</p><p className="text-xs text-muted-foreground">{Number(bestSeller?.total_quantity || 0)} sold</p></div>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                        <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fast Movers</p><p className="text-2xl font-bold">{fastMovers}</p><p className="text-xs text-muted-foreground">Products with 10+ sales</p></div>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                        <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Slow Movers</p><p className="text-2xl font-bold">{slowMovers}</p><p className="text-xs text-muted-foreground">Products with ≤2 sales</p></div>
                    </CardContent></Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold">Top Products</CardTitle>
                            <div className="flex items-center gap-2">
                                <div className="relative w-44">
                                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input placeholder="Search..." className="h-8 pl-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
                                </div>
                                <div className="flex gap-1">
                                    {(['qty', 'revenue', 'margin'] as const).map(k => (
                                        <Button key={k} variant={sortKey === k ? 'default' : 'outline'} size="sm" className="h-7 px-2 text-xs"
                                            onClick={() => { if (sortKey === k) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortKey(k); setSortDir('desc'); } }}>
                                            {k === 'qty' ? 'Qty' : k === 'revenue' ? 'Rev' : 'Margin'} <ArrowUpDown className="size-2.5 ml-0.5" />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {sorted.length === 0 ? (
                                <p className="p-6 text-center text-sm text-muted-foreground">No products found</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead><tr className="border-b text-left">
                                            <th className="p-3 font-medium">Product</th>
                                            <th className="p-3 font-medium">Category</th>
                                            <th className="p-3 text-right font-medium">Sold</th>
                                            <th className="p-3 text-right font-medium">Revenue</th>
                                            <th className="p-3 text-right font-medium">Cost</th>
                                            <th className="p-3 text-right font-medium">Profit</th>
                                            <th className="p-3 text-right font-medium">Margin</th>
                                        </tr></thead>
                                        <tbody>
                                            {sorted.slice(0, 20).map((p, i) => {
                                                const estCost = p.total_revenue * 0.6;
                                                const estProfit = p.total_revenue - estCost;
                                                const pMargin = p.total_revenue > 0 ? (estProfit / p.total_revenue) * 100 : 0;
                                                return (
                                                    <tr key={p.product_id} className="border-b last:border-0 hover:bg-muted/30">
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                                                                <span className="font-medium">{p.product_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-muted-foreground">{p.category_id || '-'}</td>
                                                        <td className="p-3 text-right">{Number(p.total_quantity)}</td>
                                                        <td className="p-3 text-right font-medium">₱{Number(p.total_revenue).toFixed(2)}</td>
                                                        <td className="p-3 text-right text-muted-foreground">₱{Number(estCost).toFixed(2)}</td>
                                                        <td className="p-3 text-right font-medium">₱{Number(estProfit).toFixed(2)}</td>
                                                        <td className="p-3 text-right">
                                                            <Badge variant={pMargin >= 40 ? 'default' : pMargin >= 20 ? 'secondary' : 'destructive'} className="text-[10px]">
                                                                {pMargin.toFixed(0)}%
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <Card><CardContent className="p-3">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Best Seller</p>
                            <p className="mt-1 text-sm font-bold truncate">{bestSeller?.product_name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{Number(bestSeller?.total_quantity || 0)} units · ₱{Number(bestSeller?.total_revenue || 0).toLocaleString()}</p>
                        </CardContent></Card>
                        <Card><CardContent className="p-3">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Highest Margin</p>
                            <p className="mt-1 text-sm font-bold truncate">{topProducts.sort((a, b) => (b.total_revenue / b.total_quantity) - (a.total_revenue / a.total_quantity))[0]?.product_name || 'N/A'}</p>
                        </CardContent></Card>
                        <Card><CardContent className="p-3">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Worst Performer</p>
                            <p className="mt-1 text-sm font-bold truncate">{worstPerformer?.product_name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{Number(worstPerformer?.total_quantity || 0)} units sold</p>
                        </CardContent></Card>
                    </div>
                </div>

                {/* Category Performance */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Category Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {categoryPerformance.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">No category data</p>
                        ) : (
                            <div className="space-y-3">
                                {categoryPerformance.map((c, i) => (
                                    <div key={c.name} className="flex items-center gap-3">
                                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: COLORS[i % COLORS.length] }}>{i + 1}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between mb-1"><span className="text-sm font-medium truncate">{c.name}</span><span className="text-sm font-semibold shrink-0 ml-2">₱{Number(c.total_revenue).toLocaleString()}</span></div>
                                            <div className="h-2 w-full rounded-full bg-muted"><div className="h-2 rounded-full transition-all" style={{ width: `${(c.total_revenue / maxCatRevenue) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} /></div>
                                            <div className="flex justify-between mt-0.5"><span className="text-xs text-muted-foreground">{c.total_qty} sold</span><span className="text-xs text-muted-foreground">{maxCatRevenue > 0 ? Math.round((c.total_revenue / maxCatRevenue) * 100) : 0}%</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ReportsProducts.layout = {
    breadcrumbs: [{ title: 'Product Report', href: reports.products.url() }],
};
