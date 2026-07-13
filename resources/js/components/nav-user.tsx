import { useState, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { ChevronsUpDown, User as UserIcon, Key as KeyIcon, Store, Save, BookOpen, Camera, Shield } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useIsMobile } from '@/hooks/use-mobile';
import { router } from '@inertiajs/react';
import { KnowledgeBasePanel } from '@/components/knowledge-base-panel';
import { RolesPanel } from '@/components/roles-panel';

type SettingsTab = 'profile' | 'password' | 'store' | 'knowledge' | 'roles';

const tabs: { id: SettingsTab; label: string; icon: typeof UserIcon }[] = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'password', label: 'Password', icon: KeyIcon },
    { id: 'store', label: 'Store', icon: Store },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
    { id: 'roles', label: 'Roles', icon: Shield },
];

export function NavUser() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const { state } = useSidebar();
    const isMobile = useIsMobile();
    const pageProps = usePage().props as Record<string, unknown>;
    const settings = pageProps.storeSettings as Record<string, string> | undefined;

    const [showSettings, setShowSettings] = useState(false);
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    // Profile state
    const [profileName, setProfileName] = useState(user?.name || '');
    const [profileEmail, setProfileEmail] = useState(user?.email || '');
    const [profileAvatar, setProfileAvatar] = useState<File | null>(null);
    const [profileAvatarPreview, setProfileAvatarPreview] = useState<string | null>(null);
    const [profileAvatarPreset, setProfileAvatarPreset] = useState<string | null>(null);
    const [profileProcessing, setProfileProcessing] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const currentAvatar = user?.avatar || '/assets/avatar/default.png';

    const preBuiltAvatars = Array.from({ length: 30 }, (_, i) => {
        const n = [1,2,3,4,5,6,7,8,9,10,12,13,14,15,16,17,18,22,23,24,25,30,35][i];
        return n ? `memo_${n}.png` : null;
    }).filter(Boolean) as string[];

    // Password state
    const [curPw, setCurPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwProcessing, setPwProcessing] = useState(false);
    const [pwError, setPwError] = useState('');

    // Store state
    const [storeForm, setStoreForm] = useState({
        store_name: settings?.store_name || 'Vendora Store',
        store_address: settings?.store_address || '',
        store_city: settings?.store_city || '',
        store_province: settings?.store_province || '',
        store_zip: settings?.store_zip || '',
        store_phone: settings?.store_phone || '',
        store_email: settings?.store_email || '',
        store_tin: settings?.store_tin || '',
        receipt_footer: settings?.receipt_footer || 'Thank you for your purchase!',
        receipt_width: settings?.receipt_width || '80',
        tax_rate: settings?.tax_rate || '0',
        currency_symbol: settings?.currency_symbol || '₱',
        currency_code: settings?.currency_code || 'PHP',
        receipt_show_logo: settings?.receipt_show_logo === '1',
        receipt_show_tax: settings?.receipt_show_tax === '1',
        receipt_show_discount: settings?.receipt_show_discount === '1',
    });
    const [storeSaving, setStoreSaving] = useState(false);

    if (!user) return null;

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="group text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent"
                                data-test="sidebar-menu-button"
                            >
                                <UserInfo user={user} />
                                <ChevronsUpDown className="ml-auto size-4" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                            align="end"
                            side={isMobile ? 'bottom' : state === 'collapsed' ? 'left' : 'bottom'}
                        >
                            <UserMenuContent user={user} onOpenSettings={() => { setShowSettings(true); setActiveTab('profile'); }} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>

            {/* Settings Modal — rendered OUTSIDE DropdownMenu */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className={`${activeTab === 'roles' ? 'sm:max-w-4xl' : 'sm:max-w-2xl'} max-h-[80vh] flex flex-col p-0 gap-0`}>
                    <DialogHeader className="px-6 pt-6 pb-0">
                        <DialogTitle>Settings</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-1 overflow-hidden min-h-0">
                        <div className={`${activeTab === 'roles' ? 'hidden' : 'w-44'} border-r shrink-0 p-3 space-y-1 overflow-y-auto`}>
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}>
                                    <tab.icon className="size-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {activeTab === 'profile' && (
                                <div className="space-y-4">
                                    <div><h3 className="text-lg font-semibold">Profile</h3><p className="text-sm text-muted-foreground">Update your name, email, and photo</p></div>
                                    <form onSubmit={(e) => { e.preventDefault(); setProfileProcessing(true); const formData = new FormData(); formData.append('name', profileName); formData.append('email', profileEmail); if (profileAvatar) { formData.append('avatar', profileAvatar); } if (profileAvatarPreset) { formData.append('avatar_preset', profileAvatarPreset); } formData.append('_method', 'PATCH'); fetch('/settings/profile', { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' }, body: formData }).then(async (res) => { if (res.ok) { toast.success('Profile updated'); window.location.reload(); } else { const data = await res.json(); toast.error(data.message || 'Failed to update'); } }).catch(() => toast.error('Failed to update')).finally(() => setProfileProcessing(false)); }} className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative group">
                                                <div className="size-16 rounded-full overflow-hidden bg-muted">
                                                    <img src={profileAvatarPreview || currentAvatar} alt="Avatar" className="size-full object-cover" />
                                                </div>
                                                <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Camera className="size-5 text-white" />
                                                </button>
                                                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { setProfileAvatar(file); setProfileAvatarPreview(URL.createObjectURL(file)); setProfileAvatarPreset(null); } }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{profileName}</p>
                                                <p className="text-xs text-muted-foreground truncate">{profileEmail}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-2">Choose an avatar</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {preBuiltAvatars.map(name => {
                                                    const isSelected = profileAvatarPreset === name;
                                                    const isCurrent = !profileAvatarPreset && !profileAvatar && currentAvatar.includes(name);
                                                    return (
                                                        <button key={name} type="button" onClick={() => { setProfileAvatarPreset(name); setProfileAvatar(null); setProfileAvatarPreview(null); }}
                                                            className={`size-9 rounded-full overflow-hidden ring-2 transition-all ${isSelected || isCurrent ? 'ring-primary' : 'ring-transparent hover:ring-muted-foreground/30'}`}>
                                                            <img src={`/assets/avatar/pre-built-avatars/${name}`} alt="" className="size-full object-cover" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="space-y-2"><Label>Name</Label><Input value={profileName} onChange={e => setProfileName(e.target.value)} required /></div>
                                        <div className="space-y-2"><Label>Email</Label><Input type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} required /></div>
                                        <Button type="submit" disabled={profileProcessing}>{profileProcessing ? 'Saving...' : 'Save'}</Button>
                                    </form>
                                </div>
                            )}
                            {activeTab === 'password' && (
                                <div className="space-y-4">
                                    <div><h3 className="text-lg font-semibold">Change Password</h3><p className="text-sm text-muted-foreground">Use a strong password</p></div>
                                    <form onSubmit={(e) => { e.preventDefault(); if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; } setPwProcessing(true); setPwError(''); router.put('/settings/password', { current_password: curPw, password: newPw, password_confirmation: confirmPw }, { preserveScroll: true, onSuccess: () => { toast.success('Password updated'); setCurPw(''); setNewPw(''); setConfirmPw(''); setPwProcessing(false); }, onError: (err) => { setPwError(Object.values(err as Record<string, string>).join(', ')); setPwProcessing(false); } }); }} className="space-y-4">
                                        <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} required /></div>
                                        <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required /></div>
                                        <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required /></div>
                                        {pwError && <p className="text-sm text-destructive">{pwError}</p>}
                                        <Button type="submit" disabled={pwProcessing}>{pwProcessing ? 'Updating...' : 'Update Password'}</Button>
                                    </form>
                                </div>
                            )}
                            {activeTab === 'store' && (
                                <div className="space-y-4">
                                    <div><h3 className="text-lg font-semibold">Store Settings</h3><p className="text-sm text-muted-foreground">Configure your business</p></div>
                                    <form onSubmit={(e) => { e.preventDefault(); setStoreSaving(true); router.post('/settings/store', storeForm, { preserveScroll: true, onSuccess: () => toast.success('Settings saved'), onError: () => toast.error('Failed to save'), onFinish: () => setStoreSaving(false) }); }} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Store Name</Label><Input value={storeForm.store_name} onChange={e => setStoreForm({ ...storeForm, store_name: e.target.value })} /></div><div className="space-y-2"><Label>Email</Label><Input type="email" value={storeForm.store_email} onChange={e => setStoreForm({ ...storeForm, store_email: e.target.value })} /></div></div>
                                        <div className="space-y-2"><Label>Address</Label><Input value={storeForm.store_address} onChange={e => setStoreForm({ ...storeForm, store_address: e.target.value })} /></div>
                                        <div className="grid grid-cols-3 gap-4"><div className="space-y-2"><Label>City</Label><Input value={storeForm.store_city} onChange={e => setStoreForm({ ...storeForm, store_city: e.target.value })} /></div><div className="space-y-2"><Label>Province</Label><Input value={storeForm.store_province} onChange={e => setStoreForm({ ...storeForm, store_province: e.target.value })} /></div><div className="space-y-2"><Label>ZIP</Label><Input value={storeForm.store_zip} onChange={e => setStoreForm({ ...storeForm, store_zip: e.target.value })} /></div></div>
                                        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Phone</Label><Input value={storeForm.store_phone} onChange={e => setStoreForm({ ...storeForm, store_phone: e.target.value })} /></div><div className="space-y-2"><Label>TIN</Label><Input value={storeForm.store_tin} onChange={e => setStoreForm({ ...storeForm, store_tin: e.target.value })} /></div></div>
                                        <Separator />
                                        <div className="grid grid-cols-3 gap-4"><div className="space-y-2"><Label>Tax Rate (%)</Label><Input type="number" step="0.01" value={storeForm.tax_rate} onChange={e => setStoreForm({ ...storeForm, tax_rate: e.target.value })} /></div><div className="space-y-2"><Label>Currency Symbol</Label><Input value={storeForm.currency_symbol} onChange={e => setStoreForm({ ...storeForm, currency_symbol: e.target.value })} /></div><div className="space-y-2"><Label>Currency Code</Label><Input value={storeForm.currency_code} onChange={e => setStoreForm({ ...storeForm, currency_code: e.target.value })} /></div></div>
                                        <div className="space-y-2"><Label>Receipt Width</Label><Select value={storeForm.receipt_width} onValueChange={v => setStoreForm({ ...storeForm, receipt_width: v })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="80">80mm</SelectItem><SelectItem value="58">58mm</SelectItem></SelectContent></Select></div>
                                        <div className="space-y-2"><Label>Receipt Footer</Label><Input value={storeForm.receipt_footer} onChange={e => setStoreForm({ ...storeForm, receipt_footer: e.target.value })} /></div>
                                        <div className="flex items-center gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={storeForm.receipt_show_logo} onChange={e => setStoreForm({ ...storeForm, receipt_show_logo: e.target.checked })} className="rounded border-gray-300" /> Show Logo</label><label className="flex items-center gap-2"><input type="checkbox" checked={storeForm.receipt_show_tax} onChange={e => setStoreForm({ ...storeForm, receipt_show_tax: e.target.checked })} className="rounded border-gray-300" /> Show Tax</label><label className="flex items-center gap-2"><input type="checkbox" checked={storeForm.receipt_show_discount} onChange={e => setStoreForm({ ...storeForm, receipt_show_discount: e.target.checked })} className="rounded border-gray-300" /> Show Discount</label></div>
                                        <Button type="submit" disabled={storeSaving}><Save className="mr-1 size-4" />{storeSaving ? 'Saving...' : 'Save Settings'}</Button>
                                    </form>
                                </div>
                            )}
                            {activeTab === 'knowledge' && (
                                <div className="space-y-4">
                                    <div><h3 className="text-lg font-semibold">AI Knowledge Base</h3><p className="text-sm text-muted-foreground">Manage assistant knowledge articles</p></div>
                                    <KnowledgeBasePanel />
                                </div>
                            )}
                            {activeTab === 'roles' && (
                                <div className="space-y-4">
                                    <div><h3 className="text-lg font-semibold">Roles & Permissions</h3><p className="text-sm text-muted-foreground">Manage user roles and their permissions</p></div>
                                    <RolesPanel />
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
