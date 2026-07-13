import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Package, DollarSign, TrendingUp, AlertTriangle, XCircle, Search, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import reports from '@/routes/reports';
import inventory from '@/routes/inventory';
import type { InventoryReport } from '@/types';

interface Props {
    report: InventoryReport;
    lowStockProducts: { id: number; name: string; stock_quantity: number; low_stock_threshold: number }[];
    outOfStockProducts: { id: number; name: string; stock_quantity: number }[];
    categoryBreakdown: { id: number; name: string; products_count: number; stock_value: number }[];
    overstockProducts: { id: number; name: string; stock_quantity: number }[];
}

const SEVERITY_COLORS = ['#243F14', '#16A34A', '#F59E0B', '#DC2626', '#6B7280'];
const PIE_COLORS = ['#243F14', '#16A34A', '#F59E0B', '#DC2626'];

export default function ReportsInventory({ report, lowStockProducts, outOfStockProducts, categoryBreakdown, overstockProducts }: Props) {
    const [search, setSearch] = useState('');

    const totalValue = report.total_stock_value + report.total_retail_value;
    const potentialProfit = report.total_retail_value - report.total_stock_value;
    const healthData = [
        { name: 'Healthy', value: report.active_products - report.low_stock - report.out_of_stock },
        { name: 'Low Stock', value: report.low_stock },
        { name: 'Out of Stock', value: report.out_of_stock },
    ];
    const maxStockValue = Math.max(...categoryBreakdown.map(c => c.stock_value), 1);

    const lowStockFiltered = lowStockProducts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Head title="Inventory Report" />
            <div className="flex flex-col gap-4 p-6">
                <PageHeader title="Inventory Report" description="Stock levels, valuation, and health overview" />

                {/* KPI Cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Products</p>
                                    <p className="text-2xl font-bold">{report.total_products}</p>
                                    <p className="text-xs text-muted-foreground">{report.active_products} active</p>
                                </div>
                                <div className="rounded-lg bg-primary/10 p-2"><Package className="size-4 text-primary" /></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock Value (Cost)</p>
                                    <p className="text-2xl font-bold">₱{Number(report.total_stock_value).toLocaleString()}</p>
                                </div>
                                <div className="rounded-lg bg-blue-50 p-2"><DollarSign className="size-4 text-blue-600" /></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Retail Value</p>
                                    <p className="text-2xl font-bold">₱{Number(report.total_retail_value).toLocaleString()}</p>
                                </div>
                                <div className="rounded-lg bg-green-50 p-2"><ShoppingCart className="size-4 text-green-600" /></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Potential Profit</p>
                                    <p className="text-2xl font-bold">₱{Number(potentialProfit).toLocaleString()}</p>
                                </div>
                                <div className="rounded-lg bg-amber-50 p-2"><TrendingUp className="size-4 text-amber-600" /></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Low Stock</p>
                                    <p className="text-2xl font-bold text-amber-500">{report.low_stock}</p>
                                    <p className="text-xs text-muted-foreground">Items below threshold</p>
                                </div>
                                <div className="rounded-lg bg-amber-50 p-2"><AlertTriangle className="size-4 text-amber-600" /></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Out of Stock</p>
                                    <p className="text-2xl font-bold text-red-500">{report.out_of_stock}</p>
                                    <p className="text-xs text-muted-foreground">Items with 0 stock</p>
                                </div>
                                <div className="rounded-lg bg-red-50 p-2"><XCircle className="size-4 text-red-600" /></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Inventory Health + Category Breakdown */}
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="w-full lg:w-[25%] min-w-0">
                    <Card className="h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Inventory Health</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <div className="h-28 w-28 shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={healthData} innerRadius={30} outerRadius={45} dataKey="value" paddingAngle={2}>
                                                {healthData.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i]} />))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex-1 space-y-2">
                                    {healthData.map((h, i) => (
                                        <div key={h.name} className="flex items-center gap-2 text-sm">
                                            <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                                            <span className="flex-1">{h.name}</span>
                                            <span className="font-medium">{h.value}</span>
                                            <span className="text-xs text-muted-foreground">{report.active_products > 0 ? Math.round((h.value / report.active_products) * 100) : 0}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    </div>

                    <div className="flex-1 min-w-0">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Category Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {categoryBreakdown.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">No categories</p>
                            ) : (
                                <div className="space-y-2">
                                    {categoryBreakdown.slice(0, 8).map((c, i) => (
                                        <div key={c.id} className="flex items-center gap-2 text-sm">
                                            <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: SEVERITY_COLORS[i % SEVERITY_COLORS.length] }} />
                                            <span className="w-24 truncate text-xs text-muted-foreground">{c.name}</span>
                                            <div className="flex-1 h-2 rounded-full bg-muted">
                                                <div className="h-2 rounded-full bg-primary/60" style={{ width: `${(c.stock_value / maxStockValue) * 100}%` }} />
                                            </div>
                                            <span className="w-20 text-right text-xs font-medium">₱{Number(c.stock_value).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    </div>
                </div>

                {/* Low Stock Table */}
                <Card>
                    <CardHeader className="flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold">Low Stock Items</CardTitle>
                        <div className="relative w-48">
                            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Search..." className="h-8 pl-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {lowStockFiltered.length === 0 ? (
                            <p className="p-6 text-center text-sm text-muted-foreground">No low stock items found</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="p-3 font-medium">Product</th>
                                            <th className="p-3 font-medium text-right">Current Stock</th>
                                            <th className="p-3 font-medium text-right">Reorder Level</th>
                                            <th className="p-3 font-medium text-right">Suggested Order</th>
                                            <th className="p-3 font-medium text-center">Status</th>
                                            <th className="p-3 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lowStockFiltered.slice(0, 15).map(p => {
                                            const suggestedOrder = p.low_stock_threshold * 3 - p.stock_quantity;
                                            return (
                                                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                                                    <td className="p-3 font-medium">{p.name}</td>
                                                    <td className="p-3 text-right">{p.stock_quantity}</td>
                                                    <td className="p-3 text-right">{p.low_stock_threshold}</td>
                                                    <td className="p-3 text-right font-medium">{Math.max(0, suggestedOrder)}</td>
                                                    <td className="p-3 text-center">
                                                        <Badge variant={p.stock_quantity === 0 ? 'destructive' : 'secondary'} className="text-[10px]">
                                                            {p.stock_quantity === 0 ? 'Out' : 'Low'}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                                            <Link href={inventory.index.url({ search: p.name })}>Restock</Link>
                                                        </Button>
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

                {/* Overstock Analysis */}
                {overstockProducts.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Package className="size-3.5 text-blue-500" />
                                Overstock Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="p-3 font-medium">Product</th>
                                            <th className="p-3 font-medium text-right">Current Stock</th>
                                            <th className="p-3 font-medium text-right">Stock Value</th>
                                            <th className="p-3 font-medium text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {overstockProducts.slice(0, 10).map(p => (
                                            <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="p-3 font-medium">{p.name}</td>
                                                <td className="p-3 text-right text-amber-600 font-medium">{p.stock_quantity}</td>
                                                <td className="p-3 text-right">₱{Number(p.stock_quantity * 0).toLocaleString()}</td>
                                                <td className="p-3 text-center"><Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">Overstocked</Badge></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

ReportsInventory.layout = {
    breadcrumbs: [{ title: 'Inventory Report', href: reports.inventory.url() }],
};
