import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, DollarSign, TrendingDown, Calendar, Percent, BarChart3, PieChart, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartPie, Pie, Cell, LineChart, Line } from 'recharts';
import expenses from '@/routes/expenses';
import type { Expense, ExpenseCategory } from '@/types';

interface Props {
    expenses: { data: Expense[]; current_page: number; last_page: number; total: number; from: number; to: number };
    categories: ExpenseCategory[];
    filters: Record<string, string | undefined>;
    stats: { total_expenses: number; this_month: number; today: number; avg_daily: number; total_count: number };
    categoryBreakdown: { name: string; total: number; count: number; percentage: number }[];
    monthlyTrend: { month: string; total: number }[];
    paymentMethodBreakdown: { payment_method: string; count: number; total: number }[];
    topCategories: { name: string; total: number; percentage: number }[];
    insights: { top_category: string; largest_expense: number; largest_desc: string; this_month_count: number; avg_per_transaction: number };
}

const COLORS = ['#243F14', '#16A34A', '#F59E0B', '#6B7280', '#DC2626', '#8B5CF6', '#06B6D4'];

export default function ExpensesIndex({ expenses: expData, categories, filters, stats, categoryBreakdown, monthlyTrend, paymentMethodBreakdown, topCategories, insights }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState({
        description: '', amount: '', expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash', expense_category_id: '', reference_number: '', notes: '',
    });

    function openCreate() {
        setEditingExpense(null);
        setForm({ description: '', amount: '', expense_date: new Date().toISOString().split('T')[0], payment_method: 'cash', expense_category_id: '', reference_number: '', notes: '' });
        setShowDialog(true);
    }

    function openEdit(e: Expense) {
        setEditingExpense(e);
        setForm({
            description: e.description, amount: e.amount.toString(),
            expense_date: e.expense_date, payment_method: e.payment_method,
            expense_category_id: e.expense_category_id?.toString() || '',
            reference_number: e.reference_number || '', notes: e.notes || '',
        });
        setShowDialog(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        const data = { ...form, amount: parseFloat(form.amount), expense_category_id: form.expense_category_id ? parseInt(form.expense_category_id) : null };
        const url = editingExpense ? expenses.update.url(editingExpense.id) : expenses.store.url();
        const method = editingExpense ? 'patch' as const : 'post' as const;
        router[method](url, data, {
            onSuccess: () => { toast.success(editingExpense ? 'Expense updated' : 'Expense created'); setShowDialog(false); },
            onError: () => toast.error('Failed to save expense'),
            onFinish: () => setProcessing(false),
        });
    }

    function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        router.delete(expenses.destroy.url(deleteId), {
            onSuccess: () => { toast.success('Expense deleted'); setDeleteId(null); },
            onError: () => toast.error('Failed to delete expense'),
            onFinish: () => setDeleting(false),
        });
    }

    const columns: Column<Expense>[] = [
        { key: 'description', label: 'Description', sortable: true },
        { key: 'category', label: 'Category', render: (e) => e.category?.name || '-' },
        { key: 'amount', label: 'Amount', sortable: true, render: (e) => `₱${Number(e.amount).toFixed(2)}` },
        { key: 'expense_date', label: 'Date', sortable: true, render: (e) => e.expense_date },
        { key: 'payment_method', label: 'Payment', render: (e) => <Badge variant="secondary">{e.payment_method}</Badge> },
        { key: 'user', label: 'Recorded By', render: (e) => e.user?.name || '-' },
    ];

    const maxMonthly = Math.max(...monthlyTrend.map(m => m.total), 1);
    const maxPayment = Math.max(...paymentMethodBreakdown.map(p => p.total), 1);
    const totalAllPayments = paymentMethodBreakdown.reduce((s, p) => s + p.total, 0);
    const maxTopCategory = topCategories.length > 0 ? Math.max(...topCategories.map(c => c.total), 1) : 1;

    return (
        <>
            <Head title="Expenses" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Expenses" description="Track your business expenses" actions={
                    <Button onClick={openCreate}><Plus className="mr-1 size-4" />Add Expense</Button>
                } />

                {/* KPI Cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total Expenses" value={`₱${Number(stats.total_expenses).toLocaleString()}`} icon={<DollarSign className="size-5" />} description="All time" />
                    <StatCard title="This Month" value={`₱${Number(stats.this_month).toLocaleString()}`} icon={<Calendar className="size-5" />} description={`${insights.this_month_count} transactions`} />
                    <StatCard title="Today" value={`₱${Number(stats.today).toLocaleString()}`} icon={<TrendingDown className="size-5" />} description="Expenses today" />
                    <StatCard title="Avg Daily" value={`₱${Number(stats.avg_daily).toFixed(2)}`} icon={<BarChart3 className="size-5" />} description="Per transaction avg" />
                </div>

                {/* Charts Row */}
                <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                    {/* Category Breakdown */}
                    <Card className="flex-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Expense by Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {categoryBreakdown.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">No expenses yet</p>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="h-28 w-28 shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartPie>
                                                <Pie data={categoryBreakdown} innerRadius={25} outerRadius={40} dataKey="total" paddingAngle={2}>
                                                    {categoryBreakdown.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                                                </Pie>
                                                <Tooltip />
                                            </RechartPie>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex-1 space-y-1 min-w-0">
                                        {categoryBreakdown.slice(0, 5).map((c, i) => (
                                            <div key={c.name} className="flex items-center gap-2 text-xs">
                                                <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                                                <span className="flex-1 truncate">{c.name}</span>
                                                <span className="font-medium">₱{Number(c.total).toLocaleString()}</span>
                                                <span className="text-muted-foreground">({c.percentage}%)</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Monthly Trend */}
                    <Card className="flex-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Monthly Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-28">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                        <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, 'Total']} />
                                        <Bar dataKey="total" fill="#243F14" radius={[2, 2, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Analytics Row */}
                <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                    {/* Payment Methods */}
                    <Card className="flex-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Payment Methods</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {paymentMethodBreakdown.length === 0 ? (
                                <p className="py-4 text-center text-sm text-muted-foreground">No data</p>
                            ) : (
                                <div className="space-y-2">
                                    {paymentMethodBreakdown.map((p, i) => (
                                        <div key={p.payment_method} className="flex items-center gap-2">
                                            <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            <span className="w-16 text-sm capitalize">{p.payment_method}</span>
                                            <div className="flex-1 h-2 rounded-full bg-muted">
                                                <div className="h-2 rounded-full bg-primary/60" style={{ width: `${(p.total / maxPayment) * 100}%` }} />
                                            </div>
                                            <span className="w-20 text-right text-xs font-medium">₱{Number(p.total).toLocaleString()}</span>
                                            <span className="w-12 text-right text-xs text-muted-foreground">({p.count})</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Categories + Insights */}
                    <Card className="flex-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Top Categories</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {topCategories.length === 0 ? (
                                <p className="py-4 text-center text-sm text-muted-foreground">No data</p>
                            ) : (
                                <div className="space-y-2">
                                    {topCategories.map((c, i) => (
                                        <div key={c.name} className="flex items-center gap-2">
                                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">{i + 1}</span>
                                            <span className="flex-1 text-sm truncate">{c.name}</span>
                                            <span className="text-xs font-medium">₱{Number(c.total).toLocaleString()}</span>
                                            <span className="text-xs text-muted-foreground">{c.percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="border-t pt-3 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Insights</p>
                                <div className="flex items-center gap-2 text-xs">
                                    <AlertTriangle className="size-3 text-amber-500" />
                                    <span>Top category this month: <strong>{insights.top_category}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <TrendingUp className="size-3 text-green-600" />
                                    <span>Largest expense: <strong>₱{Number(insights.largest_expense).toLocaleString()}</strong> ({insights.largest_desc})</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <BarChart3 className="size-3 text-muted-foreground" />
                                    <span>Avg per transaction: <strong>₱{Number(insights.avg_per_transaction).toFixed(2)}</strong></span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Existing Table — unchanged */}
                <DataTable<Expense>
                    data={expData}
                    columns={columns}
                    filters={filters}
                    baseRoute={expenses.index.url()}
                    searchPlaceholder="Search expenses..."
                    actions={(e) => (
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="size-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(e.id)}><Trash2 className="size-4 text-destructive" /></Button>
                        </div>
                    )}
                />
            </div>

            {/* Sheet + Confirm — unchanged */}
            <Sheet open={showDialog} onOpenChange={setShowDialog}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader className="mb-6 px-6 pt-6">
                        <SheetTitle>{editingExpense ? 'Edit Expense' : 'Record Expense'}</SheetTitle>
                    </SheetHeader>
                    <form onSubmit={submit} className="space-y-5 px-6 pb-6">
                        <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Amount</Label><Input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
                            <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} required /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={form.expense_category_id} onValueChange={v => setForm({ ...form, expense_category_id: v })}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        {categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Payment Method</Label>
                                <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bank">Bank Transfer</SelectItem>
                                        <SelectItem value="card">Card</SelectItem>
                                        <SelectItem value="gcash">GCash</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2"><Label>Reference Number</Label><Input value={form.reference_number} onChange={e => setForm({ ...form, reference_number: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                        <SheetFooter className="grid grid-cols-2 gap-2 pt-2">
                            <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save'}</Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} title="Delete Expense" description="Are you sure you want to delete this expense?" onConfirm={handleDelete} loading={deleting} />
        </>
    );
}

ExpensesIndex.layout = {
    breadcrumbs: [{ title: 'Expenses', href: expenses.index.url() }],
};
