import { Head, Link } from '@inertiajs/react';
import {
    ShoppingCart, TrendingUp, DollarSign, Package, AlertTriangle,
    ArrowRight, Users, Receipt, Plus, FileBarChart, Clock,
    BarChart3, ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/stat-card';
import { PageHeader } from '@/components/page-header';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import { dashboard } from '@/routes';
import pos from '@/routes/pos';
import products from '@/routes/products';
import sales from '@/routes/sales';
import inventory from '@/routes/inventory';
import type { Transaction } from '@/types';

interface Props {
    stats: {
        today_sales: number;
        today_profit: number;
        today_transactions: number;
        today_items: number;
        average_sale: number;
        low_stock_count: number;
        active_customers_today: number;
    };
    sparkline_data: { date: string; revenue: number }[];
    top_products_today: { product_name: string; total_qty: number; total_revenue: number }[];
    recent_transactions: Transaction[];
    low_stock_products: { id: number; name: string; stock_quantity: number; low_stock_threshold: number }[];
    current_shift: { id: number; status: string; opened_at: string; opening_balance: number } | null;
    pending_purchase_orders: { id: number; reference_number: string; supplier: { name: string } | null; status: string; total: number }[];
}

export default function Dashboard({
    stats, sparkline_data, top_products_today, recent_transactions,
    low_stock_products, current_shift: currentShift, pending_purchase_orders,
}: Props) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-4 p-6">
                <PageHeader
                    title="Operations Center"
                    description={new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    actions={
                        <Button asChild size="sm">
                            <Link href={pos.index.url()}><ShoppingCart className="mr-1 size-4" />Open POS</Link>
                        </Button>
                    }
                />

                {/* KPI Cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <StatCard title="Today's Sales" value={`₱${Number(stats.today_sales).toLocaleString()}`}
                        description={`${stats.today_transactions} transactions`} icon={<TrendingUp className="size-5" />} />
                    <StatCard title="Today's Profit" value={`₱${Number(stats.today_profit).toLocaleString()}`}
                        description="Estimated gross profit" icon={<TrendingUp className="size-5" />} />
                    <StatCard title="Transactions" value={stats.today_transactions}
                        description={`${stats.today_items} items sold`} icon={<Receipt className="size-5" />} />
                    <StatCard title="Avg Sale" value={`₱${Number(stats.average_sale).toFixed(2)}`}
                        description="Per transaction today" icon={<BarChart3 className="size-5" />} />
                    <StatCard title="Low Stock" value={stats.low_stock_count}
                        description="Items needing reorder" icon={<AlertTriangle className="size-5" />} />
                    <StatCard title="Active Customers" value={stats.active_customers_today}
                        description="Shopped today" icon={<Users className="size-5" />} />
                </div>

                {/* Main Layout: Left 70% + Right 30% */}
                <div className="flex flex-col lg:flex-row gap-4 items-start">
                    {/* LEFT COLUMN */}
                    <div className="flex flex-col gap-4 w-full lg:w-[70%] min-w-0">
                        {/* Recent Transactions — fixed height, scrollable */}
                        <Card className="overflow-hidden">
                            <CardHeader className="flex-row items-center justify-between py-3 px-4">
                                <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
                                <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                    <Link href={sales.index.url()}>View All <ArrowRight className="ml-1 size-3" /></Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0 max-h-[380px] overflow-y-auto">
                                {recent_transactions.length === 0 ? (
                                    <p className="p-6 text-center text-sm text-muted-foreground">No transactions today</p>
                                ) : (
                                    <div className="divide-y">
                                        {recent_transactions.map(t => (
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

                        {/* Quick Actions — directly below transactions */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 pt-0">
                                <div className="flex flex-wrap gap-1.5">
                                    <Button size="sm" asChild><Link href={pos.index.url()}><ShoppingCart className="mr-1 size-3" /> Open POS</Link></Button>
                                    <Button size="sm" variant="outline" asChild><Link href={products.index.url()}><Plus className="mr-1 size-3" /> Add Product</Link></Button>
                                    <Button size="sm" variant="outline" asChild><Link href="/purchase-orders"><Package className="mr-1 size-3" /> Purchase Order</Link></Button>
                                    <Button size="sm" variant="outline" asChild><Link href="/stock-counts"><ClipboardList className="mr-1 size-3" /> Stock Count</Link></Button>
                                    <Button size="sm" variant="outline" asChild><Link href="/expenses"><Receipt className="mr-1 size-3" /> Add Expense</Link></Button>
                                    <Button size="sm" variant="outline" asChild><Link href="/reports/sales"><FileBarChart className="mr-1 size-3" /> View Reports</Link></Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN — widgets stacked naturally */}
                    <div className="flex flex-col gap-4 w-full lg:w-[30%] min-w-0">
                        {/* Shift Summary */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <Clock className="size-3.5 text-muted-foreground" /> Shift Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 pt-0">
                                {currentShift ? (
                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="default" className="text-[10px]">Open</Badge></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">Opened</span><span className="font-medium">{new Date(currentShift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">Opening Bal</span><span className="font-medium">₱{Number(currentShift.opening_balance).toFixed(2)}</span></div>
                                        <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1"><span>Sales This Shift</span><span>₱{Number(stats.today_sales).toFixed(2)}</span></div>
                                    </div>
                                ) : (
                                    <p className="py-3 text-center text-sm text-muted-foreground">No open shift</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* 7-Day Sparkline */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <BarChart3 className="size-3.5 text-muted-foreground" /> Last 7 Days
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 pt-0">
                                <div className="h-14">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={sparkline_data}>
                                            <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, 'Revenue']} />
                                            <Bar dataKey="revenue" fill="#243F14" radius={[2, 2, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Low Stock Alerts */}
                        <Card>
                            <CardHeader className="flex-row items-center justify-between py-3 px-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <AlertTriangle className="size-3.5 text-amber-500" /> Low Stock
                                </CardTitle>
                                <Button variant="ghost" size="sm" className="h-6 text-xs px-1" asChild>
                                    <Link href={inventory.index.url()}><ArrowRight className="size-3" /></Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 pt-0">
                                {low_stock_products.length === 0 ? (
                                    <p className="py-3 text-center text-sm text-muted-foreground">All stocked up</p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {low_stock_products.slice(0, 4).map(p => (
                                            <div key={p.id} className="flex items-center justify-between">
                                                <span className="text-sm truncate">{p.name}</span>
                                                <Badge variant={p.stock_quantity === 0 ? 'destructive' : 'secondary'} className="text-[10px] shrink-0 ml-2">{p.stock_quantity > 0 ? `${p.stock_quantity} left` : 'Out'}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Products Today */}
                        <Card>
                            <CardHeader className="py-3 px-4">
                                <CardTitle className="text-sm font-semibold">Top Products Today</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 pt-0">
                                {top_products_today.length === 0 ? (
                                    <p className="py-3 text-center text-sm text-muted-foreground">No sales today</p>
                                ) : (
                                    <div className="space-y-2">
                                        {top_products_today.slice(0, 4).map((p, i) => (
                                            <div key={p.product_name} className="flex items-center gap-2">
                                                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">{i + 1}</span>
                                                <span className="text-sm truncate flex-1">{p.product_name}</span>
                                                <span className="text-xs font-medium shrink-0">{p.total_qty}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Pending Orders */}
                        {pending_purchase_orders.length > 0 && (
                            <Card>
                                <CardHeader className="flex-row items-center justify-between py-3 px-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                        <ClipboardList className="size-3.5 text-muted-foreground" /> Pending Orders
                                    </CardTitle>
                                    <Button variant="ghost" size="sm" className="h-6 text-xs px-1" asChild>
                                        <Link href="/purchase-orders"><ArrowRight className="size-3" /></Link>
                                    </Button>
                                </CardHeader>
                                <CardContent className="px-4 pb-4 pt-0">
                                    <div className="space-y-1.5">
                                        {pending_purchase_orders.slice(0, 3).map(po => (
                                            <div key={po.id} className="flex items-center justify-between text-sm">
                                                <span className="truncate">{po.reference_number}</span>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <Badge variant="default" className="text-[10px]">{po.status}</Badge>
                                                    <span className="font-medium">₱{Number(po.total || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard.url() }],
};
