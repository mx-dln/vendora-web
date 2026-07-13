import { Head, Link, router, usePage } from '@inertiajs/react';
import { Package } from 'lucide-react';

export default function PublicProducts() {
    const props = usePage().props as any;
    const products = props.products || { data: [], current_page: 1, last_page: 1, total: 0 };
    const categories = Array.isArray(props.categories) ? props.categories : [];
    const store = props.store || { name: 'Store' };

    return (
        <div className="min-h-screen bg-[#F5F3EE] dark:bg-[#121212]">
            <Head title={`Products — ${store.name}`} />
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
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-[#EDEDED]">Products</h1>
                    <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">{products.total} products found</p>
                </div>
                <div className="flex flex-col gap-6 lg:flex-row">
                    <aside className="lg:w-56 shrink-0">
                        <div className="space-y-4">
                            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider dark:text-[#9CA3AF]">Categories</p>
                            <div className="space-y-1">
                                <Link href="/shop/products" className="block w-full text-left rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-[#F5F3EE] dark:hover:bg-[#1E1E1E] text-[#6B7280] dark:text-[#9CA3AF]">
                                    All Categories
                                </Link>
                                {categories.map((c: any) => {
                                    const params = new URLSearchParams(window.location.search);
                                    params.set('category', c.slug);
                                    return (
                                        <Link key={c.id} href={`/shop/products?${params.toString()}`}
                                            className="block w-full text-left rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-[#F5F3EE] dark:hover:bg-[#1E1E1E] text-[#6B7280] dark:text-[#9CA3AF]">
                                            {c.name} <span className="text-[10px] text-[#9CA3AF]">({c.products_count})</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>
                    <div className="flex-1">
                        {products.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Package className="size-12 text-[#9CA3AF]/40 mb-3" />
                                <p className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF]">No products found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                                {products.data.map((p: any) => (
                                    <Link key={p.id} href={`/shop/products/${p.slug}`} className="group rounded-xl border bg-white overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 dark:bg-[#1E1E1E] dark:border-[#333]">
                                        <div className="aspect-[4/3] flex items-center justify-center bg-white dark:bg-[#1E1E1E] p-3">
                                            {p.image ? <img src={`/storage/${p.image}`} alt={p.name} className="max-h-full max-w-full object-contain" /> : <Package className="size-10 text-[#243F14]/15 dark:text-white/15" />}
                                        </div>
                                        <div className="p-3 pt-2">
                                            <p className="text-xs font-semibold leading-tight text-[#1A1A1A] dark:text-[#EDEDED] line-clamp-2 group-hover:text-[#243F14] transition-colors">{p.name}</p>
                                            <p className="text-[10px] text-[#9CA3AF] mt-0.5">{p.category?.name}{p.brand ? ` · ${p.brand}` : ''}</p>
                                            <p className="text-sm font-bold text-[#243F14] dark:text-[#3A6B2A] mt-1.5">₱{Number(p.selling_price).toFixed(2)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                        {products.last_page > 1 && (
                            <div className="mt-8 flex items-center justify-center gap-2">
                                {Array.from({ length: Math.min(products.last_page, 10) }, (_, i) => i + 1).map(page => (
                                    <button key={page} onClick={() => { const p = new URLSearchParams(window.location.search); p.set('page', String(page)); router.get(`/shop/products?${p.toString()}`, {}, { preserveState: true }); }}
                                        className={`flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === products.current_page ? 'bg-[#243F14] text-white' : 'bg-white border text-[#6B7280] hover:bg-[#F5F3EE] dark:bg-[#1E1E1E] dark:border-[#333]'}`}>
                                        {page}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
