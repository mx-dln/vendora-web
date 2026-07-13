import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { KnowledgeArticle } from '@/types';

function getCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

const categories = ['general', 'sales', 'inventory', 'expenses', 'customers', 'reports'];

export function KnowledgeBasePanel() {
    const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState<KnowledgeArticle | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ title: '', category: 'general', keywords: '', content: '' });

    useEffect(() => {
        fetch('/settings/knowledge-base/data')
            .then(r => r.json())
            .then(data => { setArticles(data); setLoading(false); })
            .catch(() => { setLoading(false); });
    }, []);

    function openCreate() {
        setEditing(null);
        setForm({ title: '', category: 'general', keywords: '', content: '' });
        setShowDialog(true);
    }

    function openEdit(a: KnowledgeArticle) {
        setEditing(a);
        setForm({ title: a.title, category: a.category, keywords: a.keywords || '', content: a.content });
        setShowDialog(true);
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const url = editing ? `/settings/knowledge-base/${editing.id}` : '/settings/knowledge-base';
        const method = editing ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (editing) {
                setArticles(prev => prev.map(a => a.id === data.id ? data : a));
                toast.success('Article updated');
            } else {
                setArticles(prev => [...prev, data]);
                toast.success('Article created');
            }
            setShowDialog(false);
        } catch {
            toast.error('Failed to save');
        }
        setSaving(false);
    }

    async function confirmDelete() {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await fetch(`/settings/knowledge-base/${deleteId}`, {
                method: 'DELETE',
                headers: { 'X-CSRF-TOKEN': getCsrfToken() },
            });
            setArticles(prev => prev.filter(a => a.id !== deleteId));
            toast.success('Deleted');
        } catch {
            toast.error('Failed to delete');
        }
        setDeleting(false);
        setDeleteId(null);
    }

    const filtered = articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Input placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Button size="sm" onClick={openCreate}><Plus className="mr-1 size-3.5" /> Add</Button>
            </div>

            {loading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <BookOpen className="size-8" />
                    <p className="text-sm">No articles yet.</p>
                </div>
            ) : (
                <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                                <th className="px-3 py-2 font-medium">Title</th>
                                <th className="px-3 py-2 font-medium">Category</th>
                                <th className="px-3 py-2 font-medium">Status</th>
                                <th className="px-3 py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(a => (
                                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                                    <td className="px-3 py-2 font-medium">{a.title}</td>
                                    <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{a.category}</Badge></td>
                                    <td className="px-3 py-2"><Badge variant={a.is_active ? 'default' : 'secondary'} className="text-xs">{a.is_active ? 'Active' : 'Inactive'}</Badge></td>
                                    <td className="px-3 py-2 text-right">
                                        <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(a)}><Pencil className="size-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteId(a.id)}><Trash2 className="size-3.5 text-destructive" /></Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Sheet open={showDialog} onOpenChange={setShowDialog}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader className="mb-6 px-6 pt-6">
                        <SheetTitle>{editing ? 'Edit Article' : 'Add Article'}</SheetTitle>
                    </SheetHeader>
                    <form onSubmit={submit} className="space-y-5 px-6 pb-6">
                        <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2"><Label>Keywords (comma separated)</Label><Input value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} placeholder="stock, inventory, count" /></div>
                        <div className="space-y-2"><Label>Content</Label><textarea className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required /></div>
                        <SheetFooter className="grid grid-cols-2 gap-2 pt-2">
                            <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Create')}</Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <ConfirmDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} title="Delete Article" description="Are you sure?" onConfirm={confirmDelete} loading={deleting} />
        </div>
    );
}
