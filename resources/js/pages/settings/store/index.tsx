import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Save, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import store from '@/routes/settings/store';

interface Props {
    settings: Record<string, string>;
}

export default function SettingsStoreIndex({ settings }: Props) {
    const [form, setForm] = useState({
        store_name: settings.store_name || 'Vendora Store',
        store_address: settings.store_address || '',
        store_city: settings.store_city || '',
        store_province: settings.store_province || '',
        store_zip: settings.store_zip || '',
        store_phone: settings.store_phone || '',
        store_email: settings.store_email || '',
        store_tin: settings.store_tin || '',
        receipt_footer: settings.receipt_footer || 'Thank you for your purchase!',
        receipt_width: settings.receipt_width || '80',
        receipt_show_logo: settings.receipt_show_logo === '1',
        receipt_show_tax: settings.receipt_show_tax === '1',
        receipt_show_discount: settings.receipt_show_discount === '1',
        tax_rate: settings.tax_rate || '0',
        currency_symbol: settings.currency_symbol || '₱',
        currency_code: settings.currency_code || 'PHP',
    });
    const [saving, setSaving] = useState(false);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        router.post(store.update.url(), form, {
            onSuccess: () => {
                toast.success('Settings saved successfully');
            },
            onError: () => toast.error('Failed to save settings'),
            onFinish: () => setSaving(false),
        });
    }

    return (
        <>
            <Head title="Store Settings" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Store Settings" description="Configure your business information" />
                <form onSubmit={submit} className="space-y-4 max-w-2xl">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Store className="size-4" /> Store Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Store Name</Label><Input value={form.store_name} onChange={e => setForm({ ...form, store_name: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.store_email} onChange={e => setForm({ ...form, store_email: e.target.value })} /></div>
                            </div>
                            <div className="space-y-2"><Label>Address</Label><Input value={form.store_address} onChange={e => setForm({ ...form, store_address: e.target.value })} /></div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2"><Label>City</Label><Input value={form.store_city} onChange={e => setForm({ ...form, store_city: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Province</Label><Input value={form.store_province} onChange={e => setForm({ ...form, store_province: e.target.value })} /></div>
                                <div className="space-y-2"><Label>ZIP</Label><Input value={form.store_zip} onChange={e => setForm({ ...form, store_zip: e.target.value })} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Phone</Label><Input value={form.store_phone} onChange={e => setForm({ ...form, store_phone: e.target.value })} /></div>
                                <div className="space-y-2"><Label>TIN</Label><Input value={form.store_tin} onChange={e => setForm({ ...form, store_tin: e.target.value })} /></div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Tax & Currency</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2"><Label>Tax Rate (%)</Label><Input type="number" step="0.01" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Currency Symbol</Label><Input value={form.currency_symbol} onChange={e => setForm({ ...form, currency_symbol: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Currency Code</Label><Input value={form.currency_code} onChange={e => setForm({ ...form, currency_code: e.target.value })} /></div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Receipt Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Receipt Width</Label>
                                    <Select value={form.receipt_width} onValueChange={v => setForm({ ...form, receipt_width: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="80">80mm (Standard)</SelectItem>
                                            <SelectItem value="58">58mm (Small)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2"><Label>Receipt Footer Message</Label><Input value={form.receipt_footer} onChange={e => setForm({ ...form, receipt_footer: e.target.value })} /></div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="show_logo" checked={form.receipt_show_logo} onChange={e => setForm({ ...form, receipt_show_logo: e.target.checked })} className="rounded border-gray-300" />
                                    <Label htmlFor="show_logo">Show Logo</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="show_tax" checked={form.receipt_show_tax} onChange={e => setForm({ ...form, receipt_show_tax: e.target.checked })} className="rounded border-gray-300" />
                                    <Label htmlFor="show_tax">Show Tax</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="show_discount" checked={form.receipt_show_discount} onChange={e => setForm({ ...form, receipt_show_discount: e.target.checked })} className="rounded border-gray-300" />
                                    <Label htmlFor="show_discount">Show Discount</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Button type="submit" disabled={saving}>
                        <Save className="mr-1 size-4" />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </form>
            </div>
        </>
    );
}

SettingsStoreIndex.layout = {
    breadcrumbs: [{ title: 'Store Settings', href: store.index.url() }],
};
