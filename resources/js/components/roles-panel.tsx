import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Check, X, Copy, UserPlus, ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Role = {
    id: number;
    name: string;
    permissions: string[];
    users_count: number;
};

type User = {
    id: number;
    name: string;
    email: string;
    role: string;
};

const permissionGroups = ['Sales', 'Products', 'Inventory', 'Customers', 'Expenses', 'Purchase Orders', 'Reports', 'Users', 'Roles & Permissions', 'Settings', 'AI Assistant'];

function getGroup(perm: string): string {
    if (perm.startsWith('sales')) return 'Sales';
    if (perm.startsWith('products')) return 'Products';
    if (perm.startsWith('inventory')) return 'Inventory';
    if (perm.startsWith('customer')) return 'Customers';
    if (perm.startsWith('expense')) return 'Expenses';
    if (perm.startsWith('purchase')) return 'Purchase Orders';
    if (perm.startsWith('report')) return 'Reports';
    if (perm.startsWith('user')) return 'Users';
    if (perm.startsWith('role')) return 'Roles & Permissions';
    if (perm.startsWith('setting')) return 'Settings';
    if (perm.startsWith('assistant')) return 'AI Assistant';
    return 'Other';
}

function formatLabel(perm: string): string {
    return perm.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').replace(/\./g, ' — ');
}

function getCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

const allPermissions = [
    'sales.view', 'sales.create', 'sales.void', 'sales.refund',
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'inventory.view', 'inventory.adjust', 'inventory.stock_count', 'inventory.transfer',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.approve', 'expenses.delete',
    'purchase_orders.view', 'purchase_orders.create', 'purchase_orders.edit', 'purchase_orders.approve', 'purchase_orders.delete',
    'reports.view', 'reports.export',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'roles.view', 'roles.manage',
    'settings.view', 'settings.manage',
    'assistant.use', 'assistant.admin',
];

const groupedPermissions = permissionGroups.map(group => ({
    group,
    perms: allPermissions.filter(p => getGroup(p) === group),
}));

export function RolesPanel() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [search, setSearch] = useState('');
    const [showAssign, setShowAssign] = useState(false);
    const [assignUserId, setAssignUserId] = useState('');
    const [assignRole, setAssignRole] = useState('');
    const [cloneName, setCloneName] = useState('');
    const [cloneRole, setCloneRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetch('/settings/roles/data')
            .then(r => r.json())
            .then(data => { setRoles(data.roles); setUsers(data.users); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    function toggleGroup(group: string) {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    }

    async function togglePermission(role: Role, permission: string) {
        const current = role.permissions;
        const updated = current.includes(permission)
            ? current.filter(p => p !== permission)
            : [...current, permission];

        try {
            const res = await fetch(`/settings/roles/${role.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrfToken(), 'X-HTTP-Method-Override': 'PATCH' },
                body: JSON.stringify({ permissions: updated }),
            });
            if (res.ok) {
                setRoles(prev => prev.map(r => r.id === role.id ? { ...r, permissions: updated } : r));
                if (selectedRole?.id === role.id) setSelectedRole({ ...selectedRole, permissions: updated });
                toast.success('Permission updated');
            } else {
                toast.error('Failed to update');
            }
        } catch {
            toast.error('Failed to update');
        }
    }

    async function handleAssign() {
        try {
            const res = await fetch('/settings/roles/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
                body: JSON.stringify({ user_id: parseInt(assignUserId), role: assignRole }),
            });
            if (res.ok) {
                toast.success('User role updated');
                setShowAssign(false);
                const data = await (await fetch('/settings/roles/data')).json();
                setRoles(data.roles);
                setUsers(data.users);
            } else {
                toast.error('Failed to assign');
            }
        } catch {
            toast.error('Failed to assign');
        }
    }

    async function handleClone() {
        if (!cloneRole || !cloneName.trim()) return;
        try {
            const res = await fetch(`/settings/roles/${cloneRole.id}/clone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
                body: JSON.stringify({ name: cloneName.trim() }),
            });
            if (res.ok) {
                toast.success('Role cloned');
                setCloneRole(null);
                setCloneName('');
                const data = await (await fetch('/settings/roles/data')).json();
                setRoles(data.roles);
            } else {
                toast.error('Failed to clone');
            }
        } catch {
            toast.error('Failed to clone');
        }
    }

    const filteredGroups = groupedPermissions
        .map(g => ({ ...g, perms: g.perms.filter(p => p.toLowerCase().includes(search.toLowerCase())) }))
        .filter(g => g.perms.length > 0);

    if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>;

    return (
        <div className="space-y-4">
            {/* Role cards */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                {roles.map(role => (
                    <button key={role.id} onClick={() => setSelectedRole(role)}
                        className={`rounded-lg border p-3 text-left text-sm transition-all hover:ring-2 hover:ring-primary/30 ${selectedRole?.id === role.id ? 'ring-2 ring-primary bg-primary/5' : 'bg-card'}`}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{role.name}</span>
                            <Badge variant="outline" className="text-[10px]">{role.users_count}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-0.5">
                            {role.permissions.slice(0, 3).map(p => (
                                <Badge key={p} variant="secondary" className="text-[8px] px-1">{p.split('.').pop()}</Badge>
                            ))}
                            {role.permissions.length > 3 && (
                                <Badge variant="outline" className="text-[8px] px-1">+{role.permissions.length - 3}</Badge>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Permission editor */}
            {selectedRole && (
                <div className="rounded-lg border overflow-hidden">
                    <div className="flex items-center justify-between gap-2 p-3 border-b bg-muted/20">
                        <p className="text-sm font-semibold">{selectedRole.name} Permissions</p>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
                                <Input className="h-7 w-36 pl-6 text-xs" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setCloneRole(selectedRole); setCloneName(''); }}>
                                <Copy className="mr-1 size-3" /> Clone
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowAssign(true)}>
                                <UserPlus className="mr-1 size-3" /> Assign
                            </Button>
                        </div>
                    </div>
                    <div className="divide-y max-h-[400px] overflow-y-auto">
                        {filteredGroups.map(({ group, perms }) => (
                            <div key={group}>
                                <button onClick={() => toggleGroup(group)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors">
                                    {expandedGroups[group] !== false ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                                    {group}
                                </button>
                                {expandedGroups[group] !== false && (
                                    <div className="grid grid-cols-2 gap-0.5 px-3 pb-2">
                                        {perms.map(perm => {
                                            const enabled = selectedRole.permissions.includes(perm);
                                            return (
                                                <button key={perm} onClick={() => togglePermission(selectedRole, perm)}
                                                    className={`flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-left transition-all ${enabled ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}`}>
                                                    {enabled ? <Check className="size-2.5 shrink-0" /> : <X className="size-2.5 shrink-0" />}
                                                    <span className="truncate">{formatLabel(perm)}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Users table */}
            <div className="rounded-lg border overflow-hidden">
                <div className="p-3 border-b bg-muted/20">
                    <p className="text-xs font-semibold">Users</p>
                </div>
                <div className="max-h-[250px] overflow-y-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground uppercase tracking-wider">
                                <th className="px-3 py-2 font-medium">Name</th>
                                <th className="px-3 py-2 font-medium">Email</th>
                                <th className="px-3 py-2 font-medium">Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                                    <td className="px-3 py-1.5 font-medium">{u.name}</td>
                                    <td className="px-3 py-1.5 text-muted-foreground">{u.email}</td>
                                    <td className="px-3 py-1.5"><RoleBadge role={u.role} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assign dialog */}
            <Dialog open={showAssign} onOpenChange={setShowAssign}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="pb-2"><DialogTitle>Assign User Role</DialogTitle></DialogHeader>
                    <form onSubmit={e => { e.preventDefault(); handleAssign(); }} className="space-y-5 px-1">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">User</Label>
                            <Select value={assignUserId} onValueChange={setAssignUserId}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select a user..." /></SelectTrigger>
                                <SelectContent>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={String(u.id)}>
                                            <div className="flex items-center gap-2">
                                                <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold shrink-0">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{u.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Role</Label>
                            <Select value={assignRole} onValueChange={setAssignRole}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select a role..." /></SelectTrigger>
                                <SelectContent>
                                    {roles.map(r => (
                                        <SelectItem key={r.id} value={r.name}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{r.name}</span>
                                                <span className="text-xs text-muted-foreground">({r.permissions.length} permissions)</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button variant="outline" type="button" onClick={() => setShowAssign(false)}>Cancel</Button>
                            <Button type="submit" disabled={!assignUserId || !assignRole}>Assign</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Clone dialog */}
            <Dialog open={cloneRole !== null} onOpenChange={() => setCloneRole(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Clone Role: {cloneRole?.name}</DialogTitle></DialogHeader>
                    <form onSubmit={e => { e.preventDefault(); handleClone(); }} className="space-y-4">
                        <Label>New Role Name</Label>
                        <Input value={cloneName} onChange={e => setCloneName(e.target.value)} placeholder="e.g. Senior Cashier" autoFocus />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" type="button" onClick={() => setCloneRole(null)}>Cancel</Button>
                            <Button type="submit" disabled={!cloneName.trim()}>Clone</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function RoleBadge({ role }: { role: string }) {
    const colors: Record<string, string> = {
        Owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        Manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        Cashier: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return (
        <Badge className={`text-[10px] font-medium ${colors[role] || 'bg-muted text-muted-foreground'}`} variant="secondary">
            {role}
        </Badge>
    );
}
