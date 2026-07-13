import { Head, Link, usePage } from '@inertiajs/react';
import { Package, ChevronRight, Tag, ShoppingBag } from 'lucide-react';

export default function PublicProduct() {
    const props = usePage().props as any;
    const product = props.product as any;
    const related = Array.isArray(props.related) ? props.related : [];
    const store = props.store || { name: 'Store' };
    if (!product) return <div className="min-h-screen bg-[#F5F3EE] flex items-center justify-center"><p className="text-[#6B7280]">Product not found</p></div>;

    const isOutOfStock = product.track_inventory && product.stock_quantity <= 0;
    const isLowStock = product.track_inventory && product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold;

    return (
        <div className="min-h-screen bg-[#F5F3EE] dark:bg-[#121212]">
            <Head title={`${product.name} — ${store.name}`} />
            <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md dark:bg-[#1A1A1A]/90 dark:border-[#333]">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <img src="/brand/logo-dark.png" alt={store.name} className="h-8 w-auto dark:hidden" />
                        <img src="/brand/logo-light.png" alt={store.name} className="hidden h-8 w-auto dark:block" />
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/" className="text-sm font-medium text-[#1A1A1A] hover:text-[#243F14] transition-colors dark:text-[#EDEDED]">Home</Link>
                        <Link href="/shop/products" className="text-sm font-medium text-[#1A1A1A] hover:text-[#243F14] transition-colors dark:text-[#EDEDED]">Products</Link>
                        <Link href="/shop/promotions" className="text-sm font-medium text-[#1A1A1A] hover:text-[#243F14] transition-colors dark:text-[#EDEDED]">Promotions</Link>
                    </nav>
                </div>
            </header>
            <div className="mx-auto max-w-7xl px-4 py-8">
                <nav className="mb-6 flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                    <Link href="/" className="hover:text-[#243F14]">Home</Link>
                    <ChevronRight className="size-3" />
                    <Link href="/shop/products" className="hover:text-[#243F14]">Products</Link>
                    {product.category && <><ChevronRight className="size-3" /><Link href={`/shop/categories/${product.category.slug}`} className="hover:text-[#243F14]">{product.category.name}</Link></>}
                    <ChevronRight className="size-3" />
                    <span className="text-[#6B7280]">{product.name}</span>
                </nav>
                <div className="grid gap-8 md:grid-cols-2">
                    <div className="aspect-square flex items-center justify-center rounded-2xl border bg-white p-8 dark:bg-[#1E1E1E] dark:border-[#333]">
                        {product.image ? <img src={`/storage/${product.image}`} alt={product.name} className="max-h-full max-w-full object-contain" /> : <Package className="size-20 text-[#243F14]/15 dark:text-white/15" />}
                    </div>
                    <div>
                        <div className="flex items-start gap-2 mb-1">
                            {product.category && (
                                <Link href={`/shop/categories/${product.category.slug}`} className="inline-flex items-center gap-1 rounded-full bg-[#243F14]/10 px-2.5 py-0.5 text-xs font-medium text-[#243F14] dark:bg-[#3A6B2A]/20 dark:text-[#3A6B2A]">
                                    <Tag className="size-3" /> {product.category.name}
                                </Link>
                            )}
                            {product.track_inventory && (
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${isOutOfStock ? 'text-red-600 bg-red-500/10' : isLowStock ? 'text-amber-600 bg-amber-500/10' : 'text-emerald-600 bg-emerald-500/10'}`}>
                                    <ShoppingBag className="size-3" />
                                    {isOutOfStock ? 'Out of Stock' : isLowStock ? `${product.stock_quantity} left` : 'In Stock'}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-[#EDEDED]">{product.name}</h1>
                        {product.brand && <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">{product.brand}</p>}
                        <p className="mt-4 text-3xl font-bold text-[#243F14] dark:text-[#3A6B2A]">₱{Number(product.selling_price).toFixed(2)}</p>
                        {product.wholesale_price && <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">Wholesale: ₱{Number(product.wholesale_price).toFixed(2)}</p>}
                        {product.description && (
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-[#1A1A1A] dark:text-[#EDEDED] mb-1">Description</h3>
                                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed whitespace-pre-wrap">{product.description}</p>
                            </div>
                        )}
                        <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border bg-[#F5F3EE] p-4 dark:bg-[#1E1E1E] dark:border-[#333]">
                            <div><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">SKU</p><p className="text-sm font-medium text-[#1A1A1A] dark:text-[#EDEDED]">{product.sku || '—'}</p></div>
                            <div><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Barcode</p><p className="text-sm font-medium text-[#1A1A1A] dark:text-[#EDEDED]">{product.barcode || '—'}</p></div>
                            <div><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Unit</p><p className="text-sm font-medium text-[#1A1A1A] dark:text-[#EDEDED]">{product.unit || '—'}</p></div>
                            <div><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Category</p><p className="text-sm font-medium text-[#1A1A1A] dark:text-[#EDEDED]">{product.category?.name || '—'}</p></div>
                        </div>
                    </div>
                </div>
                {related.length > 0 && (
                    <section className="mt-12">
                        <h2 className="text-lg font-bold text-[#1A1A1A] dark:text-[#EDEDED] mb-4">Related Products</h2>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {related.map((p: any) => (
                                <Link key={p.id} href={`/shop/products/${p.slug}`} className="group rounded-xl border bg-white overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 dark:bg-[#1E1E1E] dark:border-[#333]">
                                    <div className="aspect-[4/3] flex items-center justify-center bg-white dark:bg-[#1E1E1E] p-3">
                                        {p.image ? <img src={`/storage/${p.image}`} alt={p.name} className="max-h-full max-w-full object-contain" /> : <Package className="size-8 text-[#243F14]/15" />}
                                    </div>
                                    <div className="p-3 pt-2">
                                        <p className="text-xs font-semibold leading-tight text-[#1A1A1A] dark:text-[#EDEDED] line-clamp-2 group-hover:text-[#243F14] transition-colors">{p.name}</p>
                                        <p className="text-sm font-bold text-[#243F14] dark:text-[#3A6B2A] mt-1">₱{Number(p.selling_price).toFixed(2)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
