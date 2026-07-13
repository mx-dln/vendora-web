import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/page-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import categories from '@/routes/categories';
import type { Category } from '@/types';

interface Props {
    categories: { data: Category[]; current_page: number; last_page: number; total: number; from: number; to: number };
    filters: Record<string, string | undefined>;
}

export default function CategoriesIndex({ categories: catsData, filters }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [form, setForm] = useState({ name: '', slug: '', description: '', color: '#6366f1', sort_order: 0 });
    const [processing, setProcessing] = useState(false);

    function openCreate() {
        setEditingCat(null);
        setForm({ name: '', slug: '', description: '', color: '#6366f1', sort_order: 0 });
        setShowDialog(true);
    }

    function openEdit(cat: Category) {
        setEditingCat(cat);
        setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', color: cat.color || '#6366f1', sort_order: cat.sort_order });
        setShowDialog(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        const url = editingCat ? categories.update.url(editingCat.id) : categories.store.url();
        const method = editingCat ? 'patch' as const : 'post' as const;

        router[method](url, form, {
            onSuccess: () => {
                toast.success(editingCat ? 'Category updated' : 'Category created');
                setShowDialog(false);
            },
            onError: () => toast.error('Failed to save category'),
            onFinish: () => setProcessing(false),
        });
    }

    function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        router.delete(categories.destroy.url(deleteId), {
            onSuccess: () => {
                toast.success('Category deleted');
                setDeleteId(null);
            },
            onError: (errs) => {
                const err = errs as Record<string, string>;
                toast.error(err.error || 'Failed to delete category');
            },
            onFinish: () => setDeleting(false),
        });
    }

    const columns: Column<Category>[] = [
        {
            key: 'color',
            label: '',
            render: (c) => <div className="size-4 rounded-full" style={{ backgroundColor: c.color || '#6366f1' }} />,
        },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'slug', label: 'Slug' },
        {
            key: 'products_count',
            label: 'Products',
            sortable: true,
            render: (c) => <Badge variant="secondary">{c.products_count || 0}</Badge>,
        },
        {
            key: 'is_active',
            label: 'Active',
            render: (c) => <Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Yes' : 'No'}</Badge>,
        },
    ];

    return (
        <>
            <Head title="Categories" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader
                    title="Categories"
                    description="Organize your products into categories"
                    actions={
                        <Button onClick={openCreate}>
                            <Plus className="mr-1 size-4" />
                            Add Category
                        </Button>
                    }
                />
                <DataTable<Category>
                    data={catsData}
                    columns={columns}
                    filters={filters}
                    baseRoute={categories.index.url()}
                    searchPlaceholder="Search categories..."
                    actions={(c) => (
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                                <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}>
                                <Trash2 className="size-4 text-destructive" />
                            </Button>
                        </div>
                    )}
                />
            </div>

            <Sheet open={showDialog} onOpenChange={setShowDialog}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader className="mb-6 px-6 pt-6">
                        <SheetTitle>{editingCat ? 'Edit Category' : 'Create Category'}</SheetTitle>
                    </SheetHeader>
                    <form onSubmit={submit} className="space-y-5 px-6 pb-6">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: editingCat ? form.slug : e.target.value.toLowerCase().replace(/\s+/g, '-') })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                        </div>
                        <div className="flex gap-4">
                            <div className="space-y-2">
                                <Label>Color</Label>
                                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="h-9 w-16 rounded border" />
                            </div>
                            <div className="space-y-2 flex-1">
                                <Label>Sort Order</Label>
                                <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} />
                            </div>
                        </div>
                        <SheetFooter className="grid grid-cols-2 gap-2 pt-2">
                            <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save'}</Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={() => setDeleteId(null)}
                title="Delete Category"
                description="Are you sure? Categories with products cannot be deleted."
                onConfirm={handleDelete}
                loading={deleting}
            />
        </>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [
        { title: 'Categories', href: categories.index.url() },
    ],
};
