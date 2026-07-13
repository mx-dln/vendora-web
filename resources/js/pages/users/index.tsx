import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/page-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import users from '@/routes/users';
import type { User } from '@/types/auth';

interface Props {
    users: { data: User[]; current_page: number; last_page: number; per_page: number; total: number; from: number; to: number };
    filters: Record<string, string | undefined>;
}

export default function UsersIndex({ users: usersData, filters }: Props) {
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [processing, setProcessing] = useState(false);
    const [form, setForm] = useState({
        name: '', email: '', password: '', password_confirmation: '', role: 'cashier', phone: '', is_active: true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    function openCreate() {
        setEditingUser(null);
        setForm({ name: '', email: '', password: '', password_confirmation: '', role: 'cashier', phone: '', is_active: true });
        setErrors({});
        setShowDialog(true);
    }

    function openEdit(user: User) {
        setEditingUser(user);
        setForm({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            role: (user as Record<string, unknown>).role as string || 'cashier',
            phone: (user as Record<string, unknown>).phone as string || '',
            is_active: (user as Record<string, unknown>).is_active as boolean ?? true,
        });
        setErrors({});
        setShowDialog(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        const data = { ...form };
        if (editingUser && !data.password) {
            delete data.password;
            delete (data as any).password_confirmation;
        }
        const method = editingUser ? 'PATCH' as const : 'POST' as const;
        const url = editingUser ? users.update.url(editingUser.id) : users.store.url();
        router[method](url, data, {
            onSuccess: () => {
                toast.success(editingUser ? 'User updated' : 'User created');
                setShowDialog(false);
                if (editingUser) {
                    setForm({ ...form, password: '', password_confirmation: '' });
                }
            },
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                toast.error('Failed to save user');
            },
            onFinish: () => setProcessing(false),
        });
    }

    function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        router.delete(users.destroy.url(deleteId), {
            onSuccess: () => { toast.success('User deleted'); setDeleteId(null); },
            onError: () => toast.error('Failed to delete user'),
            onFinish: () => setDeleting(false),
        });
    }

    const columns: Column<User>[] = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        {
            key: 'role', label: 'Role', sortable: true,
            render: (u) => {
                const roles: Record<string, string> = { admin: 'Owner', manager: 'Manager', cashier: 'Cashier' };
                const roleName = roles[(u as Record<string, unknown>).role as string] || (u as Record<string, unknown>).role as string;
                return <RoleBadge role={roleName} />;
            },
        },
        {
            key: 'is_active', label: 'Status',
            render: (u) => <Badge variant={(u as Record<string, unknown>).is_active ? 'default' : 'secondary'}>{(u as Record<string, unknown>).is_active ? 'Active' : 'Inactive'}</Badge>,
        },
        { key: 'phone', label: 'Phone' },
    ];

    return (
        <>
            <Head title="Users" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Users" description="Manage system users and cashiers"
                    actions={<Button onClick={openCreate}><Plus className="mr-1 size-4" /> Add User</Button>} />
                <DataTable<User>
                    data={usersData} columns={columns} filters={filters}
                    baseRoute={users.index.url()} searchPlaceholder="Search users..."
                    actions={(u) => (
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="size-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(u.id)}><Trash2 className="size-4 text-destructive" /></Button>
                        </div>
                    )}
                />
            </div>

            <Sheet open={showDialog} onOpenChange={setShowDialog}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader className="mb-6 px-6 pt-6">
                        <SheetTitle>{editingUser ? 'Edit User' : 'Create User'}</SheetTitle>
                    </SheetHeader>
                    <form onSubmit={submit} className="space-y-5 px-6 pb-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{editingUser ? 'New Password (leave blank to keep current)' : 'Password'}</Label>
                            <Input id="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editingUser} />
                            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">{editingUser ? 'Confirm New Password' : 'Confirm Password'}</Label>
                            <Input id="password_confirmation" type="password" value={form.password_confirmation} onChange={e => setForm({ ...form, password_confirmation: e.target.value })} required={!editingUser} />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Owner</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="cashier">Cashier</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded border-gray-300" />
                            <Label htmlFor="is_active">Active</Label>
                        </div>
                        <SheetFooter className="grid grid-cols-2 gap-2 pt-2">
                            <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{processing ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}</Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} title="Delete User" description="This cannot be undone." onConfirm={handleDelete} loading={deleting} />
        </>
    );
}

function RoleBadge({ role }: { role: string }) {
    const colors: Record<string, string> = {
        Owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        Manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        Cashier: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return <Badge className={`text-xs font-medium ${colors[role] || 'bg-muted text-muted-foreground'}`}>{role}</Badge>;
}

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Users', href: users.index.url() }],
};
