import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, Trash2, Star, Gift, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import loyalty from '@/routes/loyalty';
import customersRoute from '@/routes/customers';
import type { Customer } from '@/types';

interface LoyaltyStats {
    total_members: number;
    total_points_earned: number;
    total_points_redeemed: number;
    active_rewards: number;
    tier_breakdown: Record<string, number>;
}

interface LoyaltyReward {
    id: number;
    name: string;
    tier: string;
    points_required: number;
    reward_type: string;
    discount_value: number;
    discount_type: string | null;
    is_active: boolean;
}

interface Props {
    stats: LoyaltyStats;
    rewards: LoyaltyReward[];
    top_customers: Customer[];
    filters: Record<string, string | undefined>;
}

const TIERS = ['Regular', 'Silver', 'Gold', 'Platinum'];
const TIER_COLORS: Record<string, string> = {
    Regular: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    Silver: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    Gold: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    Platinum: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

export default function LoyaltyIndex({ stats, rewards, top_customers, filters }: Props) {
    const [showRewardDialog, setShowRewardDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [deleteRewardId, setDeleteRewardId] = useState<number | null>(null);
    const [form, setForm] = useState({
        name: '', tier: 'Regular', points_required: '100',
        reward_type: 'discount', discount_value: '0', discount_type: 'percentage',
    });

    function openCreateReward() {
        setForm({ name: '', tier: 'Regular', points_required: '100', reward_type: 'discount', discount_value: '0', discount_type: 'percentage' });
        setShowRewardDialog(true);
    }

    function submitReward(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        router.post(loyalty.rewards.store.url(), {
            ...form,
            points_required: parseInt(form.points_required),
            discount_value: parseFloat(form.discount_value),
        }, {
            onSuccess: () => { toast.success('Reward created'); setShowRewardDialog(false); },
            onError: () => toast.error('Failed to create reward'),
            onFinish: () => setProcessing(false),
        });
    }

    const columns: Column<Customer>[] = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email' },
        {
            key: 'loyalty_points',
            label: 'Points',
            sortable: true,
            render: (c) => <Badge variant="secondary">{((c as Record<string, unknown>).loyalty_points as number) || 0}</Badge>,
        },
        {
            key: 'tier',
            label: 'Tier',
            render: (c) => {
                const tier = ((c as Record<string, unknown>).tier as string) || 'Regular';
                return <Badge variant="outline" className={TIER_COLORS[tier] || ''}>{tier}</Badge>;
            },
        },
        {
            key: 'total_purchases',
            label: 'Total Purchases',
            sortable: true,
            render: (c) => `₱${Number(c.total_purchases).toFixed(2)}`,
        },
        { key: 'visit_count', label: 'Visits', sortable: true },
    ];

    return (
        <>
            <Head title="Customer Loyalty" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Customer Loyalty" description="Manage rewards and loyalty program" />

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Total Members" value={stats.total_members} description="Registered loyalty members" icon={<Users className="size-6" />} />
                    <StatCard title="Points Earned" value={stats.total_points_earned.toLocaleString()} description="All time" icon={<Star className="size-6" />} />
                    <StatCard title="Points Redeemed" value={stats.total_points_redeemed.toLocaleString()} description="Redeemed rewards" icon={<Gift className="size-6" />} />
                    <StatCard title="Active Rewards" value={stats.active_rewards} description="Available rewards" icon={<Award className="size-6" />} />
                </div>

                <Card>
                    <CardHeader><CardTitle>Tier Breakdown</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {TIERS.map(tier => (
                                <div key={tier} className={`rounded-lg border p-4 ${TIER_COLORS[tier]}`}>
                                    <p className="text-sm font-medium">{tier}</p>
                                    <p className="text-2xl font-bold">{stats.tier_breakdown?.[tier] || 0}</p>
                                    <p className="text-xs text-muted-foreground">members</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle>Top Customers</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable<Customer>
                            data={{ data: top_customers, current_page: 1, last_page: 1, total: top_customers.length, from: 1, to: top_customers.length, links: [] }}
                            columns={columns}
                            filters={{}}
                            baseRoute={loyalty.index.url()}
                            searchPlaceholder="Search customers..."
                            actions={(c) => (
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={loyalty.customers.history.url(c.id)}>View</Link>
                                </Button>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle>Rewards</CardTitle>
                        <Button size="sm" onClick={openCreateReward}><Plus className="mr-1 size-3" />Add Reward</Button>
                    </CardHeader>
                    <CardContent>
                        {rewards.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">No rewards configured yet</p>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {rewards.map(r => (
                                    <div key={r.id} className="flex items-start justify-between rounded-lg border p-4">
                                        <div>
                                            <p className="font-medium">{r.name}</p>
                                            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                                <Badge variant="outline" className={TIER_COLORS[r.tier] || ''}>{r.tier}</Badge>
                                                <span>{r.points_required} pts</span>
                                                <Badge variant="secondary">{r.reward_type}</Badge>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={() => setDeleteRewardId(r.id)}>
                                            <Trash2 className="size-3 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create Reward</DialogTitle></DialogHeader>
                    <form onSubmit={submitReward} className="space-y-4">
                        <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tier</Label>
                                <Select value={form.tier} onValueChange={v => setForm({ ...form, tier: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2"><Label>Points Required</Label><Input type="number" min="1" value={form.points_required} onChange={e => setForm({ ...form, points_required: e.target.value })} required /></div>
                        </div>
                        <div className="space-y-2">
                            <Label>Reward Type</Label>
                            <Select value={form.reward_type} onValueChange={v => setForm({ ...form, reward_type: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="discount">Discount</SelectItem>
                                    <SelectItem value="free_item">Free Item</SelectItem>
                                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Discount Value</Label><Input type="number" step="0.01" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} /></div>
                            <div className="space-y-2">
                                <Label>Discount Type</Label>
                                <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="fixed">Fixed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setShowRewardDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={deleteRewardId !== null} onOpenChange={() => setDeleteRewardId(null)} title="Delete Reward" description="Are you sure?" onConfirm={() => { }} />
        </>
    );
}

LoyaltyIndex.layout = {
    breadcrumbs: [{ title: 'Customer Loyalty', href: loyalty.index.url() }],
};
