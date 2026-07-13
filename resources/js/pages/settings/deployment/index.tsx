import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Save, Printer, Mail, MessageSquare, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import settings from '@/routes/settings';
import type { User } from '@/types/auth';

interface Session {
    id: number;
    user_id: number;
    ip_address: string;
    user_agent: string;
    last_activity: string;
    user?: User;
}

interface Props {
    settings: Record<string, string>;
    sessions: Session[];
}

export default function SettingsDeploymentIndex({ settings: currentSettings, sessions }: Props) {
    const [form, setForm] = useState({
        printer_name: currentSettings.printer_name || '',
        printer_interface: currentSettings.printer_interface || 'usb',
        printer_cash_drawer: currentSettings.printer_cash_drawer === '1',
        mail_driver: currentSettings.mail_driver || 'smtp',
        mail_host: currentSettings.mail_host || '',
        mail_port: currentSettings.mail_port || '587',
        mail_username: currentSettings.mail_username || '',
        mail_password: currentSettings.mail_password || '',
        mail_encryption: currentSettings.mail_encryption || 'tls',
        mail_from_address: currentSettings.mail_from_address || '',
        mail_from_name: currentSettings.mail_from_name || '',
        sms_provider: currentSettings.sms_provider || '',
        sms_api_key: currentSettings.sms_api_key || '',
        sms_from_number: currentSettings.sms_from_number || '',
        maintenance_mode: currentSettings.maintenance_mode === '1',
    });
    const [saving, setSaving] = useState(false);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        router.post(settings.deployment.update.url(), form, {
            onSuccess: () => toast.success('Settings saved'),
            onError: () => toast.error('Failed to save settings'),
            onFinish: () => setSaving(false),
        });
    }

    function toggleMaintenance() {
        router.post(settings.deployment.update.url(), { ...form, maintenance_mode: !form.maintenance_mode }, {
            onSuccess: () => { setForm(f => ({ ...f, maintenance_mode: !f.maintenance_mode })); toast.success('Maintenance mode toggled'); },
            onError: () => toast.error('Failed to toggle maintenance mode'),
        });
    }

    return (
        <>
            <Head title="Deployment Settings" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Deployment Settings" description="Configure system integrations and services" />

                <form onSubmit={submit} className="space-y-4 max-w-2xl">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Printer className="size-4" />Printer Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Printer Name</Label><Input value={form.printer_name} onChange={e => setForm({ ...form, printer_name: e.target.value })} placeholder="e.g., EPSON TM-T20" /></div>
                                <div className="space-y-2">
                                    <Label>Interface</Label>
                                    <Select value={form.printer_interface} onValueChange={v => setForm({ ...form, printer_interface: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="usb">USB</SelectItem>
                                            <SelectItem value="network">Network</SelectItem>
                                            <SelectItem value="bluetooth">Bluetooth</SelectItem>
                                            <SelectItem value="serial">Serial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="cash_drawer" checked={form.printer_cash_drawer} onChange={e => setForm({ ...form, printer_cash_drawer: e.target.checked })} className="rounded border-gray-300" />
                                <Label htmlFor="cash_drawer">Open Cash Drawer on Receipt</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="size-4" />Email Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Driver</Label>
                                    <Select value={form.mail_driver} onValueChange={v => setForm({ ...form, mail_driver: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="smtp">SMTP</SelectItem>
                                            <SelectItem value="sendmail">Sendmail</SelectItem>
                                            <SelectItem value="log">Log (Testing)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label>Host</Label><Input value={form.mail_host} onChange={e => setForm({ ...form, mail_host: e.target.value })} placeholder="smtp.gmail.com" /></div>
                                <div className="space-y-2"><Label>Port</Label><Input value={form.mail_port} onChange={e => setForm({ ...form, mail_port: e.target.value })} placeholder="587" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Username</Label><Input value={form.mail_username} onChange={e => setForm({ ...form, mail_username: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Password</Label><Input type="password" value={form.mail_password} onChange={e => setForm({ ...form, mail_password: e.target.value })} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Encryption</Label>
                                    <Select value={form.mail_encryption} onValueChange={v => setForm({ ...form, mail_encryption: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tls">TLS</SelectItem>
                                            <SelectItem value="ssl">SSL</SelectItem>
                                            <SelectItem value="">None</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label>From Address</Label><Input type="email" value={form.mail_from_address} onChange={e => setForm({ ...form, mail_from_address: e.target.value })} placeholder="noreply@vendora.com" /></div>
                            </div>
                            <div className="space-y-2"><Label>From Name</Label><Input value={form.mail_from_name} onChange={e => setForm({ ...form, mail_from_name: e.target.value })} placeholder="Vendora POS" /></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="size-4" />SMS Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Provider</Label>
                                    <Select value={form.sms_provider} onValueChange={v => setForm({ ...form, sms_provider: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="semaphore">Semaphore</SelectItem>
                                            <SelectItem value="twilio">Twilio</SelectItem>
                                            <SelectItem value="vonage">Vonage</SelectItem>
                                            <SelectItem value="custom">Custom API</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label>From Number</Label><Input value={form.sms_from_number} onChange={e => setForm({ ...form, sms_from_number: e.target.value })} /></div>
                            </div>
                            <div className="space-y-2"><Label>API Key</Label><Input type="password" value={form.sms_api_key} onChange={e => setForm({ ...form, sms_api_key: e.target.value })} /></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="size-4" />Maintenance Mode</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Maintenance Mode</p>
                                    <p className="text-sm text-muted-foreground">When enabled, only admin users can access the system</p>
                                </div>
                                <Button variant={form.maintenance_mode ? 'destructive' : 'default'} onClick={toggleMaintenance} type="button">
                                    {form.maintenance_mode ? 'Disable' : 'Enable'}
                                </Button>
                            </div>
                            <div className="mt-2">
                                <Badge variant={form.maintenance_mode ? 'destructive' : 'secondary'}>
                                    {form.maintenance_mode ? 'Maintenance Mode Active' : 'Application Live'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="size-4" />Active Sessions</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            {sessions.length === 0 ? (
                                <p className="p-4 text-sm text-muted-foreground">No active sessions</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="p-3 font-medium">User</th>
                                            <th className="p-3 font-medium">IP Address</th>
                                            <th className="p-3 font-medium">Last Activity</th>
                                            <th className="p-3 font-medium">User Agent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sessions.map(s => (
                                            <tr key={s.id} className="border-b last:border-0">
                                                <td className="p-3">{s.user?.name || 'Unknown'}</td>
                                                <td className="p-3 text-muted-foreground">{s.ip_address}</td>
                                                <td className="p-3 text-muted-foreground">{s.last_activity ? new Date(s.last_activity).toLocaleString() : '-'}</td>
                                                <td className="p-3 max-w-[200px] truncate text-muted-foreground" title={s.user_agent}>{s.user_agent || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
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

SettingsDeploymentIndex.layout = {
    breadcrumbs: [
        { title: 'Settings', href: '' },
        { title: 'Deployment', href: settings.deployment.url() },
    ],
};
