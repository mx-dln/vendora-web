import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, Eye, Pencil, Send, Truck, Printer, XCircle, Trash2, Download, Search, FileText, CheckCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { StatCard } from '@/components/stat-card';
import purchaseOrders from '@/routes/purchase-orders';
import type { PurchaseOrder, Supplier } from '@/types';

interface Props {
    purchaseOrders: { data: PurchaseOrder[]; current_page: number; last_page: number; total: number; from: number; to: number };
    suppliers: Supplier[];
    stats: { total: number; draft: number; sent: number; partial: number; received: number; month_value: number };
    filters: Record<string, string | undefined>;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
    draft: { label: 'Draft', variant: 'outline', color: 'text-gray-500 border-gray-300' },
    sent: { label: 'Sent', variant: 'default', color: 'text-blue-600 border-blue-200 bg-blue-50' },
    partial: { label: 'Partial Received', variant: 'secondary', color: 'text-orange-600 border-orange-200 bg-orange-50' },
    received: { label: 'Received', variant: 'default', color: 'text-green-600 border-green-200 bg-green-50' },
    cancelled: { label: 'Cancelled', variant: 'destructive', color: 'text-red-600 border-red-200 bg-red-50' },
};

function getCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

export default function PurchaseOrdersIndex({ purchaseOrders: poData, suppliers, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [supplierFilter, setSupplierFilter] = useState(filters.supplier_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);

    function applyFilters() {
        router.get(purchaseOrders.index.url(), {
            search, status: statusFilter, supplier_id: supplierFilter, date_from: dateFrom, date_to: dateTo,
        }, { preserveState: true, replace: true });
    }

    function clearFilters() {
        setSearch(''); setStatusFilter(''); setSupplierFilter(''); setDateFrom(''); setDateTo('');
        router.get(purchaseOrders.index.url(), {}, { preserveState: true, replace: true });
    }

    async function handleAction(action: string, po: PurchaseOrder) {
        setProcessing(`${action}-${po.id}`);
        try {
            const res = await fetch(`/purchase-orders/${po.id}/${action}`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': getCsrfToken() },
            });
            if (res.ok) {
                toast.success(`Order ${action}ed successfully`);
                router.reload({ preserveScroll: true });
            } else {
                const data = await res.json();
                toast.error(data.message || `Failed to ${action}`);
            }
        } catch { toast.error(`Failed to ${action}`); }
        setProcessing(null);
    }

    return (
        <>
            <Head title="Purchase Orders" />
            <div className="flex flex-col gap-4 p-6">
                <PageHeader title="Purchase Orders" description="Manage procurement and supplier orders"
                    actions={
                        <Button asChild><Link href={purchaseOrders.create.url()}><Plus className="mr-1 size-4" /> Create PO</Link></Button>
                    } />

                {/* Stats */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <StatCard label="Total Orders" value={stats.total} />
                    <StatCard label="Draft" value={stats.draft} icon={<FileText className="size-8" />} />
                    <StatCard label="Sent" value={stats.sent} icon={<Send className="size-8" />} />
                    <StatCard label="Partial Received" value={stats.partial} icon={<Truck className="size-8" />} />
                    <StatCard label="Received" value={stats.received} icon={<CheckCircle className="size-8" />} />
                    <StatCard label="Month Value" value={`₱${stats.month_value.toLocaleString()}`} icon={<DollarSign className="size-8" />} />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-end gap-2">
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search PO or supplier..." className="pl-8 h-9 text-xs" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} />
                    </div>
                    <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setTimeout(applyFilters, 0); }}>
                        <SelectTrigger className="h-9 w-[150px] text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Status</SelectItem>
                            {Object.keys(statusConfig).map(s => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={supplierFilter} onValueChange={v => { setSupplierFilter(v); setTimeout(applyFilters, 0); }}>
                        <SelectTrigger className="h-9 w-[180px] text-xs"><SelectValue placeholder="All Suppliers" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Suppliers</SelectItem>
                            {suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Input type="date" className="h-9 w-[140px] text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From" />
                    <Input type="date" className="h-9 w-[140px] text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To" />
                    <Button variant="outline" size="sm" className="h-9 text-xs" onClick={applyFilters}>Filter</Button>
                    <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={clearFilters}>Clear</Button>
                    <Button variant="outline" size="sm" className="h-9 text-xs ml-auto">
                        <Download className="mr-1 size-3" /> Export
                    </Button>
                </div>

                {/* Table */}
                <div className="rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                                    <th className="px-3 py-2.5 font-medium">PO Number</th>
                                    <th className="px-3 py-2.5 font-medium">Supplier</th>
                                    <th className="px-3 py-2.5 font-medium">Order Date</th>
                                    <th className="px-3 py-2.5 font-medium">Expected</th>
                                    <th className="px-3 py-2.5 font-medium text-right">Total</th>
                                    <th className="px-3 py-2.5 font-medium">Status</th>
                                    <th className="px-3 py-2.5 font-medium">Created By</th>
                                    <th className="px-3 py-2.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {poData.data.length === 0 ? (
                                    <tr><td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">No purchase orders found.</td></tr>
                                ) : poData.data.map(po => {
                                    const cfg = statusConfig[po.status] || statusConfig.draft;
                                    return (
                                        <tr key={po.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                            <td className="px-3 py-2.5">
                                                <Link href={purchaseOrders.show.url(po.id)} className="font-medium text-primary hover:underline">{po.reference_number}</Link>
                                            </td>
                                            <td className="px-3 py-2.5">{po.supplier?.name || '—'}</td>
                                            <td className="px-3 py-2.5 text-muted-foreground">{po.order_date ? new Date(po.order_date).toLocaleDateString() : '—'}</td>
                                            <td className="px-3 py-2.5 text-muted-foreground">{po.expected_date ? new Date(po.expected_date).toLocaleDateString() : '—'}</td>
                                            <td className="px-3 py-2.5 text-right font-medium">₱{Number(po.total).toLocaleString()}</td>
                                            <td className="px-3 py-2.5">
                                                <Badge variant={cfg.variant} className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</Badge>
                                            </td>
                                            <td className="px-3 py-2.5 text-muted-foreground">{(po as any).user?.name || '—'}</td>
                                            <td className="px-3 py-2.5 text-right">
                                                <div className="flex items-center justify-end gap-0.5">
                                                    <ActionButton icon={Eye} label="View" href={purchaseOrders.show.url(po.id)} />
                                                    {po.status === 'draft' && <ActionButton icon={Pencil} label="Edit" href={purchaseOrders.edit.url(po.id)} />}
                                                    {po.status === 'draft' && <ActionButton icon={Send} label="Send" onClick={() => handleAction('send', po)} />}
                                                    {['sent', 'partial'].includes(po.status) && <ActionButton icon={Truck} label="Receive" href={`/purchase-orders/${po.id}#receive`} />}
                                                    <ActionButton icon={Printer} label="Print" href={purchaseOrders.print.url(po.id)} />
                                                    {['draft', 'sent', 'partial'].includes(po.status) && <ActionButton icon={XCircle} label="Cancel" onClick={() => handleAction('cancel', po)} />}
                                                    {['draft', 'cancelled'].includes(po.status) && <ActionButton icon={Trash2} label="Delete" onClick={() => setDeleteId(po.id)} />}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {poData.last_page > 1 && (
                        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                            <span>Showing {poData.from}–{poData.to} of {poData.total}</span>
                            <div className="flex gap-1">
                                {Array.from({ length: poData.last_page }, (_, i) => i + 1).map(p => (
                                    <Button key={p} variant={p === poData.current_page ? 'default' : 'outline'} size="sm" className="h-7 w-7 p-0 text-xs" asChild>
                                        <Link href={purchaseOrders.index.url({ page: p })} preserveState>{p}</Link>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} title="Delete Purchase Order" description="Are you sure? This cannot be undone." onConfirm={() => { if (deleteId) router.delete(purchaseOrders.destroy.url(deleteId), { onSuccess: () => { toast.success('Deleted'); setDeleteId(null); } }); }} />
        </>
    );
}

function ActionButton({ icon: Icon, label, onClick, href }: { icon: any; label: string; onClick?: () => void; href?: string }) {
    const btn = (
        <Button variant="ghost" size="icon" className="size-7" title={label} onClick={onClick}>
            <Icon className="size-3.5" />
        </Button>
    );
    if (href) return <Link href={href}>{btn}</Link>;
    return btn;
}

PurchaseOrdersIndex.layout = {
    breadcrumbs: [{ title: 'Purchase Orders', href: purchaseOrders.index.url() }],
};
