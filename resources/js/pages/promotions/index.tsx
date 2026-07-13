import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/page-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import promotions from '@/routes/promotions';
import type { Product, Category, PaginatedData } from '@/types';

interface Promotion {
    id: number;
    name: string;
    type: string;
    discount_value: number;
    min_purchase: number | null;
    buy_quantity: number | null;
    get_quantity: number | null;
    get_discount_percent: number | null;
    category_id: number | null;
    category?: Category | null;
    product_id: number | null;
    product?: Product | null;
    start_date: string | null;
    end_date: string | null;
    happy_hour_start: string | null;
    happy_hour_end: string | null;
    days_of_week: string | null;
    coupon_code: string | null;
    usage_limit: number | null;
    usage_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    promotions: PaginatedData<Promotion>;
    categories: Category[];
    products: Product[];
    filters: Record<string, string | undefined>;
}

const typeBadges: Record<string, string> = {
    percentage: 'default',
    fixed: 'secondary',
    buy_x_get_y: 'outline',
    bogo: 'outline',
    category_discount: 'secondary',
    happy_hour: 'outline',
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function PromotionsIndex({ promotions: promData, categories, products, filters }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState({
        name: '', type: 'percentage', discount_value: '0', min_purchase: '',
        buy_quantity: '', get_quantity: '', get_discount_percent: '',
        category_id: '', product_id: '',
        start_date: '', end_date: '',
        happy_hour_start: '', happy_hour_end: '',
        days_of_week: [] as string[],
        coupon_code: '', usage_limit: '', is_active: true,
    });

    function openCreate() {
        setEditingPromo(null);
        setForm({ name: '', type: 'percentage', discount_value: '0', min_purchase: '', buy_quantity: '', get_quantity: '', get_discount_percent: '', category_id: '', product_id: '', start_date: '', end_date: '', happy_hour_start: '', happy_hour_end: '', days_of_week: [], coupon_code: '', usage_limit: '', is_active: true });
        setShowDialog(true);
    }

    function openEdit(p: Promotion) {
        setEditingPromo(p);
        setForm({
            name: p.name, type: p.type, discount_value: p.discount_value.toString(),
            min_purchase: p.min_purchase?.toString() || '',
            buy_quantity: p.buy_quantity?.toString() || '', get_quantity: p.get_quantity?.toString() || '',
            get_discount_percent: p.get_discount_percent?.toString() || '',
            category_id: p.category_id?.toString() || '', product_id: p.product_id?.toString() || '',
            start_date: p.start_date || '', end_date: p.end_date || '',
            happy_hour_start: p.happy_hour_start || '', happy_hour_end: p.happy_hour_end || '',
            days_of_week: p.days_of_week ? p.days_of_week.split(',') : [],
            coupon_code: p.coupon_code || '', usage_limit: p.usage_limit?.toString() || '',
            is_active: p.is_active,
        });
        setShowDialog(true);
    }

    function toggleDay(day: string) {
        setForm(prev => ({
            ...prev,
            days_of_week: prev.days_of_week.includes(day)
                ? prev.days_of_week.filter(d => d !== day)
                : [...prev.days_of_week, day],
        }));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        const data = {
            ...form,
            discount_value: parseFloat(form.discount_value),
            min_purchase: form.min_purchase ? parseFloat(form.min_purchase) : null,
            buy_quantity: form.buy_quantity ? parseInt(form.buy_quantity) : null,
            get_quantity: form.get_quantity ? parseInt(form.get_quantity) : null,
            get_discount_percent: form.get_discount_percent ? parseFloat(form.get_discount_percent) : null,
            category_id: form.category_id ? parseInt(form.category_id) : null,
            product_id: form.product_id ? parseInt(form.product_id) : null,
            usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
            days_of_week: form.days_of_week.join(','),
        };
        const url = editingPromo ? promotions.update.url(editingPromo.id) : promotions.store.url();
        const method = editingPromo ? 'patch' as const : 'post' as const;
        router[method](url, data, {
            onSuccess: () => {
                toast.success(editingPromo ? 'Promotion updated' : 'Promotion created');
                setShowDialog(false);
            },
            onError: () => toast.error('Failed to save promotion'),
            onFinish: () => setProcessing(false),
        });
    }

    function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        router.delete(promotions.destroy.url(deleteId), {
            onSuccess: () => { toast.success('Promotion deleted'); setDeleteId(null); },
            onError: () => toast.error('Failed to delete'),
            onFinish: () => setDeleting(false),
        });
    }

    const columns: Column<Promotion>[] = [
        { key: 'name', label: 'Name', sortable: true },
        {
            key: 'type',
            label: 'Type',
            render: (p) => <Badge variant={(typeBadges[p.type] || 'outline') as 'default' | 'secondary' | 'outline'} className="capitalize">{p.type.replace(/_/g, ' ')}</Badge>,
        },
        {
            key: 'discount_value',
            label: 'Value',
            render: (p) => p.type === 'percentage' ? `${p.discount_value}%` : `₱${Number(p.discount_value).toFixed(2)}`,
        },
        {
            key: 'start_date',
            label: 'Dates',
            render: (p) => p.start_date ? `${p.start_date}${p.end_date ? ` - ${p.end_date}` : ''}` : 'Always',
        },
        { key: 'coupon_code', label: 'Coupon Code', render: (p) => p.coupon_code || '-' },
        {
            key: 'usage',
            label: 'Usage',
            render: (p) => p.usage_limit ? `${p.usage_count}/${p.usage_limit}` : `${p.usage_count}`,
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (p) => <Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>,
        },
    ];

    return (
        <>
            <Head title="Promotions & Discounts" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Promotions & Discounts" description="Create and manage promotional offers" actions={
                    <Button onClick={openCreate}><Plus className="mr-1 size-4" />Add Promotion</Button>
                } />
                <DataTable<Promotion>
                    data={promData}
                    columns={columns}
                    filters={filters}
                    baseRoute={promotions.index.url()}
                    searchPlaceholder="Search promotions..."
                    actions={(p) => (
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="size-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}><Trash2 className="size-4 text-destructive" /></Button>
                        </div>
                    )}
                />
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
                    <DialogHeader><DialogTitle>{editingPromo ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle></DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                                        <SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem>
                                        <SelectItem value="bogo">BOGO</SelectItem>
                                        <SelectItem value="category_discount">Category Discount</SelectItem>
                                        <SelectItem value="happy_hour">Happy Hour</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Discount Value</Label>
                                <Input type="number" step="0.01" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} required />
                            </div>
                        </div>

                        <div className="space-y-2"><Label>Min. Purchase</Label><Input type="number" step="0.01" value={form.min_purchase} onChange={e => setForm({ ...form, min_purchase: e.target.value })} placeholder="0 = no minimum" /></div>

                        {(form.type === 'buy_x_get_y' || form.type === 'bogo') && (
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2"><Label>Buy Qty</Label><Input type="number" min="1" value={form.buy_quantity} onChange={e => setForm({ ...form, buy_quantity: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Get Qty</Label><Input type="number" min="1" value={form.get_quantity} onChange={e => setForm({ ...form, get_quantity: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Get Discount %</Label><Input type="number" step="0.01" value={form.get_discount_percent} onChange={e => setForm({ ...form, get_discount_percent: e.target.value })} /></div>
                            </div>
                        )}

                        {form.type === 'category_discount' && (
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Specific Product (optional)</Label>
                            <Select value={form.product_id} onValueChange={v => setForm({ ...form, product_id: v })}>
                                <SelectTrigger><SelectValue placeholder="All products" /></SelectTrigger>
                                <SelectContent>
                                    {products.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                            <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
                        </div>

                        {form.type === 'happy_hour' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Happy Hour Start</Label><Input type="time" value={form.happy_hour_start} onChange={e => setForm({ ...form, happy_hour_start: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Happy Hour End</Label><Input type="time" value={form.happy_hour_end} onChange={e => setForm({ ...form, happy_hour_end: e.target.value })} /></div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Days of Week</Label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS.map(day => (
                                    <button key={day} type="button" onClick={() => toggleDay(day)}
                                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${form.days_of_week.includes(day) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}>
                                        {day.slice(0, 3)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Coupon Code</Label><Input value={form.coupon_code} onChange={e => setForm({ ...form, coupon_code: e.target.value })} placeholder="Leave empty for auto" /></div>
                            <div className="space-y-2"><Label>Usage Limit</Label><Input type="number" value={form.usage_limit} onChange={e => setForm({ ...form, usage_limit: e.target.value })} placeholder="Unlimited" /></div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded border-gray-300" />
                            <Label htmlFor="is_active">Active</Label>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} title="Delete Promotion" description="Are you sure?" onConfirm={handleDelete} loading={deleting} />
        </>
    );
}

PromotionsIndex.layout = {
    breadcrumbs: [{ title: 'Promotions & Discounts', href: promotions.index.url() }],
};
