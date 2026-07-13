import { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Package, Download, Upload, Printer, FileSpreadsheet, Barcode, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/page-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import products from '@/routes/products';
import type { Product, Category, Supplier } from '@/types';

interface Props {
    products: { data: Product[]; current_page: number; last_page: number; total: number; from: number; to: number };
    categories: Category[];
    suppliers: Supplier[];
    filters: Record<string, string | undefined>;
}

export default function ProductsIndex({ products: prodsData, categories: cats, suppliers, filters }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [editingProd, setEditingProd] = useState<Product | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageMode, setImageMode] = useState<'file' | 'url'>('file');
    const [form, setForm] = useState({
        name: '', brand: '', sku: '', barcode: '', barcode_type: 'code128',
        category_id: '', cost_price: '0', selling_price: '0', wholesale_price: '0',
        stock_quantity: '0', low_stock_threshold: '5', reorder_quantity: '0',
        unit: 'piece', is_active: true, status: 'active',
        track_inventory: true, notes: '', preferred_supplier_id: '',
    });

    function generateBarcode() {
        fetch('/barcodes/products/generate-new', { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' } })
            .then(r => r.json())
            .then(d => setForm({ ...form, barcode: d.barcode }))
            .catch(() => {
                const barcode = 'VDR' + String(Date.now()).slice(-8);
                setForm({ ...form, barcode });
            });
    }

    function openCreate() {
        setEditingProd(null);
        setForm({ name: '', brand: '', sku: '', barcode: '', barcode_type: 'code128', category_id: '', cost_price: '0', selling_price: '0', wholesale_price: '0', stock_quantity: '0', low_stock_threshold: '5', reorder_quantity: '0', unit: 'piece', is_active: true, status: 'active', track_inventory: true, notes: '', preferred_supplier_id: '' });
        setImageFile(null);
        setImageUrl('');
        setImagePreview(null);
        setImageMode('file');
        setShowDialog(true);
    }

    function openEdit(p: Product) {
        setEditingProd(p);
        setForm({
            name: p.name, brand: p.brand || '', sku: p.sku || '', barcode: p.barcode || '',
            barcode_type: p.barcode_type || 'code128',
            category_id: p.category_id?.toString() || '', cost_price: p.cost_price.toString(),
            selling_price: p.selling_price.toString(), wholesale_price: p.wholesale_price?.toString() || '0',
            stock_quantity: p.stock_quantity.toString(), low_stock_threshold: p.low_stock_threshold.toString(),
            reorder_quantity: p.reorder_quantity?.toString() || '0', unit: p.unit || 'piece',
            is_active: p.is_active, status: p.status || 'active',
            track_inventory: p.track_inventory, notes: p.notes || '',
            preferred_supplier_id: p.preferred_supplier_id?.toString() || '',
        });
        setImageFile(null);
        setImagePreview(p.image ? `/storage/${p.image}` : null);
        setShowDialog(true);
    }

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);

        const data: Record<string, unknown> = {
            name: form.name, brand: form.brand || null, sku: form.sku || null,
            barcode: form.barcode || null, barcode_type: form.barcode_type || null,
            category_id: form.category_id ? parseInt(form.category_id) : null,
            cost_price: parseFloat(form.cost_price), selling_price: parseFloat(form.selling_price),
            wholesale_price: form.wholesale_price ? parseFloat(form.wholesale_price) : null,
            stock_quantity: parseInt(form.stock_quantity), low_stock_threshold: parseInt(form.low_stock_threshold),
            reorder_quantity: form.reorder_quantity ? parseFloat(form.reorder_quantity) : null,
            unit: form.unit, track_inventory: form.track_inventory,
            is_active: form.status === 'active', status: form.status,
            preferred_supplier_id: form.preferred_supplier_id ? parseInt(form.preferred_supplier_id) : null,
            notes: form.notes || null,
        };

        const url = editingProd ? products.update.url(editingProd.id) : products.store.url();

        if (imageFile || imageUrl) {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
                }
            });
            if (imageFile) formData.append('image', imageFile);
            if (imageUrl && imageMode === 'url') formData.append('image_url', imageUrl);
            if (editingProd) formData.append('_method', 'PATCH');

            router.post(url, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onSuccess: () => {
                    toast.success(editingProd ? 'Product updated' : 'Product created');
                    setShowDialog(false);
                },
                onError: (errors) => {
                    const errMsg = typeof errors === 'string' ? errors : Object.values(errors).flat().join(', ');
                    toast.error(errMsg || 'Failed to save product');
                },
                onFinish: () => setProcessing(false),
            });
        } else {
            const method = editingProd ? 'patch' as const : 'post' as const;
            router[method](url, data, {
                onSuccess: () => {
                    toast.success(editingProd ? 'Product updated' : 'Product created');
                    setShowDialog(false);
                },
                onError: (errors) => {
                    const errMsg = typeof errors === 'string' ? errors : Object.values(errors).flat().join(', ');
                    toast.error(errMsg || 'Failed to save product');
                },
                onFinish: () => setProcessing(false),
            });
        }
    }

    function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        router.delete(products.destroy.url(deleteId), {
            onSuccess: () => { toast.success('Product deleted'); setDeleteId(null); },
            onError: () => toast.error('Failed to delete product'),
            onFinish: () => setDeleting(false),
        });
    }

    const statusColor: Record<string, string> = {
        active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        discontinued: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };

    const uniqueBrands = [...new Set(prodsData.data.map(p => p.brand).filter(Boolean))] as string[];

    const columns: Column<Product>[] = [
        {
            key: 'image',
            label: '',
            render: (p) => p.image ? <img src={`/storage/${p.image}`} className="size-8 rounded-full object-cover" /> : <Package className="size-8 text-muted-foreground/50" />,
        },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'brand', label: 'Brand' },
        {
            key: 'status',
            label: 'Status',
            render: (p) => (
                <Badge variant="outline" className={statusColor[p.status] || ''}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                </Badge>
            ),
        },
        { key: 'sku', label: 'SKU' },
        {
            key: 'category',
            label: 'Category',
            render: (p) => p.category?.name || '-',
        },
        {
            key: 'selling_price',
            label: 'Price',
            sortable: true,
            render: (p) => `₱${Number(p.selling_price).toFixed(2)}`,
        },
        {
            key: 'stock_quantity',
            label: 'Stock',
            sortable: true,
            render: (p) => (
                <Badge variant={p.stock_quantity <= p.low_stock_threshold ? 'destructive' : p.stock_quantity === 0 ? 'destructive' : 'secondary'}>
                    {p.stock_quantity}
                </Badge>
            ),
        },
    ];

    return (
        <>
            <Head title="Products" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader
                    title="Products"
                    description="Manage your product catalog"
                    actions={
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                                const params = new URLSearchParams();
                                Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
                                window.open(`/products/print?${params.toString()}`, '_blank');
                            }}>
                                <Printer className="mr-1 size-3" />
                                Print
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => router.get(products.export.csv.url())}>
                                <Download className="mr-1 size-3" />
                                Export
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => window.open('/template/template.csv', '_blank')}>
                                <FileSpreadsheet className="mr-1 size-3" />
                                Template
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => router.post('/barcodes/generate-missing')}>
                                <Barcode className="mr-1 size-3" />
                                Generate Missing Barcodes
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-1 size-3" />
                                Import
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.txt"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setImporting(true);
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    router.post(products.import.csv.url(), formData, {
                                        onSuccess: () => {
                                            toast.success('Products imported successfully');
                                            setImporting(false);
                                        },
                                        onError: () => {
                                            toast.error('Failed to import products');
                                            setImporting(false);
                                        },
                                        onFinish: () => {
                                            setImporting(false);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        },
                                    });
                                }}
                            />
                            <Button onClick={openCreate}><Plus className="mr-1 size-4" />Add Product</Button>
                        </div>
                    }
                />
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={filters.status || ''} onValueChange={v => {
                        const params = new URLSearchParams();
                        Object.entries({ ...filters, status: v, page: '' }).forEach(([k, val]) => { if (val) params.set(k, val); });
                        router.get(`${products.index.url()}?${params.toString()}`);
                    }}>
                        <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="discontinued">Discontinued</SelectItem>
                        </SelectContent>
                    </Select>
                    {uniqueBrands.length > 0 && (
                        <Select value={filters.brand || ''} onValueChange={v => {
                            const params = new URLSearchParams();
                            Object.entries({ ...filters, brand: v, page: '' }).forEach(([k, val]) => { if (val) params.set(k, val); });
                            router.get(`${products.index.url()}?${params.toString()}`);
                        }}>
                            <SelectTrigger className="w-36"><SelectValue placeholder="All Brands" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Brands</SelectItem>
                                {uniqueBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <DataTable<Product>
                    data={prodsData}
                    columns={columns}
                    filters={filters}
                    baseRoute={products.index.url()}
                    searchPlaceholder="Search by name, SKU, barcode, or brand..."
                    actions={(p) => (
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="size-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}><Trash2 className="size-4 text-destructive" /></Button>
                        </div>
                    )}
                />
            </div>

            <Sheet open={showDialog} onOpenChange={setShowDialog}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader className="mb-6 px-6 pt-6">
                        <SheetTitle>{editingProd ? 'Edit Product' : 'Create Product'}</SheetTitle>
                    </SheetHeader>
                    <form onSubmit={submit} className="space-y-6 px-6 pb-6">
                        <div>
                            <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Name <span className="text-destructive">*</span></Label>
                                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Brand</Label>
                                    <Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Optional" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                                            <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                                            <SelectContent>
                                                {cats.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Unit</Label>
                                        <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="piece">Piece</SelectItem>
                                                <SelectItem value="kilo">Kilo</SelectItem>
                                                <SelectItem value="liter">Liter</SelectItem>
                                                <SelectItem value="meter">Meter</SelectItem>
                                                <SelectItem value="box">Box</SelectItem>
                                                <SelectItem value="pack">Pack</SelectItem>
                                                <SelectItem value="sack">Sack</SelectItem>
                                                <SelectItem value="bottle">Bottle</SelectItem>
                                                <SelectItem value="can">Can</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Image</Label>
                                    <div className="flex items-center gap-2 mb-2">
                                        <button type="button" onClick={() => setImageMode('file')} className={`text-xs px-2 py-1 rounded transition-colors ${imageMode === 'file' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>Upload</button>
                                        <button type="button" onClick={() => setImageMode('url')} className={`text-xs px-2 py-1 rounded transition-colors ${imageMode === 'url' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>From URL</button>
                                        <button type="button" onClick={() => { const q = form.name || form.brand || ''; if (q) window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`, '_blank'); else toast.error('Enter a product name first'); }} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"><SearchIcon className="size-3 inline mr-1" />Search Google</button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {imagePreview && <img src={imagePreview} alt="Preview" className="size-16 rounded object-cover border shrink-0" />}
                                        {imageMode === 'file' ? (
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:text-primary-foreground" />
                                        ) : (
                                            <div className="flex-1 flex gap-2">
                                                <input type="text" value={imageUrl} onChange={e => { setImageUrl(e.target.value); setImagePreview(e.target.value || null); }} placeholder="https://example.com/product.jpg" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs" />
                                                {imageUrl && <button type="button" onClick={() => setImagePreview(imageUrl)} className="text-xs text-primary hover:underline shrink-0 self-center">Preview</button>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identification</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>SKU</Label>
                                    <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Barcode</Label>
                                    <div className="flex gap-2">
                                        <Input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} className="flex-1" />
                                        <Button type="button" variant="outline" size="sm" onClick={generateBarcode} className="shrink-0">
                                            Generate
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Barcode Type</Label>
                                    <Select value={form.barcode_type} onValueChange={v => setForm({ ...form, barcode_type: v })}>
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="code128">Code128</SelectItem>
                                            <SelectItem value="ean13">EAN-13</SelectItem>
                                            <SelectItem value="upca">UPC-A</SelectItem>
                                            <SelectItem value="qr">QR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pricing</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Cost Price</Label>
                                    <Input type="number" step="0.01" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Selling Price</Label>
                                    <Input type="number" step="0.01" value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Wholesale Price</Label>
                                    <Input type="number" step="0.01" value={form.wholesale_price} onChange={e => setForm({ ...form, wholesale_price: e.target.value })} placeholder="Optional" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inventory</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Stock Quantity</Label>
                                    <Input type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Low Stock Threshold</Label>
                                    <Input type="number" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Reorder Quantity</Label>
                                    <Input type="number" step="0.01" value={form.reorder_quantity} onChange={e => setForm({ ...form, reorder_quantity: e.target.value })} placeholder="Optional" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="track_inventory" checked={form.track_inventory} onChange={e => setForm({ ...form, track_inventory: e.target.checked })} className="rounded border-gray-300" />
                                    <Label htmlFor="track_inventory">Track Inventory</Label>
                                </div>
                                <div className="space-y-2">
                                    <Label>Preferred Supplier</Label>
                                    <Select value={form.preferred_supplier_id} onValueChange={v => setForm({ ...form, preferred_supplier_id: v })}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Additional</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v, is_active: v === 'active' })}>
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                            <SelectItem value="discontinued">Discontinued</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <textarea
                                        value={form.notes}
                                        onChange={e => setForm({ ...form, notes: e.target.value })}
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Optional notes..."
                                    />
                                </div>
                            </div>
                        </div>

                        <SheetFooter className="grid grid-cols-2 gap-2 pt-2">
                            <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save'}</Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <ConfirmDialog open={deleteId !== null} onOpenChange={() => deleteId(null)} title="Delete Product" description="Are you sure you want to delete this product?" onConfirm={handleDelete} loading={deleting} />
        </>
    );
}

ProductsIndex.layout = {
    breadcrumbs: [{ title: 'Products', href: products.index.url() }],
};
