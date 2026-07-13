import { Head, Link, usePage } from '@inertiajs/react';
import { ShoppingBag, Package, Tags, Percent, ArrowRight, Store, Menu, X, Phone, Mail, MapPin, Clock, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function PublicIndex() {
    const props = usePage().props as any;
    const stats = props.stats || { total_products: 0, total_categories: 0, available_products: 0, active_promotions: 0 };
    const store = props.store || { name: 'Store', tagline: '', address: '', city: '', phone: '', email: '', hours: '' };
    const newestList = Array.isArray(props.newest) ? props.newest : [];
    const bestsellersList = Array.isArray(props.bestsellers) ? props.bestsellers : [];
    const cats = Array.isArray(props.categories) ? props.categories : [];
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#F5F3EE] dark:bg-[#121212] flex flex-col">
            <Head title={`${store.name} — ${store.tagline}`} />
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
                    <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
                        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>
                </div>
                {mobileOpen && (
                    <div className="border-t bg-white px-4 py-3 md:hidden dark:bg-[#1A1A1A] dark:border-[#333]">
                        <nav className="flex flex-col gap-3">
                            <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
                            <Link href="/shop/products" onClick={() => setMobileOpen(false)}>Products</Link>
                            <Link href="/shop/promotions" onClick={() => setMobileOpen(false)}>Promotions</Link>
                        </nav>
                    </div>
                )}
            </header>
            <main className="flex-1">
                <section className="relative overflow-hidden bg-gradient-to-br from-[#243F14] to-[#1A330E]">
                    <div className="mx-auto max-w-7xl px-4 py-20 lg:py-28">
                        <div className="max-w-2xl">
                            <h1 className="text-4xl font-bold tracking-tight text-white lg:text-5xl">Everything You Need, All In One Store</h1>
                            <p className="mt-4 text-lg text-white/70">Browse our available products, promotions, and latest arrivals.</p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link href="/shop/products" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-[#243F14] hover:bg-white/90 transition-colors">
                                    Browse Products <ArrowRight className="size-3.5" />
                                </Link>
                                <Link href="/shop/promotions" className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors">
                                    View Promotions
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="border-b bg-white dark:bg-[#1A1A1A] dark:border-[#333]">
                    <div className="mx-auto max-w-7xl px-4 py-8">
                        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                            {[
                                { icon: Package, value: stats.total_products, label: 'Total Products' },
                                { icon: Tags, value: stats.total_categories, label: 'Categories' },
                                { icon: ShoppingBag, value: stats.available_products, label: 'In Stock' },
                                { icon: Percent, value: stats.active_promotions, label: 'Active Promotions' },
                            ].map((item, i) => (
                                <div key={i} className="text-center">
                                    <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-[#243F14]/10 text-[#243F14] dark:bg-[#3A6B2A]/20 dark:text-[#3A6B2A]">
                                        <item.icon className="size-5" />
                                    </div>
                                    <p className="text-2xl font-bold text-[#1A1A1A] dark:text-[#EDEDED]">{item.value}</p>
                                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                {newestList.length > 0 && (
                    <section className="py-16">
                        <div className="mx-auto max-w-7xl px-4">
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-[#EDEDED]">Newest Products</h2>
                                    <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Latest additions to our store</p>
                                </div>
                                <Link href="/shop/products" className="hidden sm:flex items-center gap-1 text-sm font-medium text-[#243F14] hover:underline dark:text-[#3A6B2A]">View All <ArrowRight className="size-3" /></Link>
                            </div>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {newestList.map((p: any) => <ProductCard key={p.id} product={p} />)}
                            </div>
                        </div>
                    </section>
                )}
                {cats.length > 0 && (
                    <section className="border-y bg-white py-16 dark:bg-[#1A1A1A] dark:border-[#333]">
                        <div className="mx-auto max-w-7xl px-4">
                            <div className="mb-8 text-center">
                                <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-[#EDEDED]">Shop by Category</h2>
                                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Find what you're looking for</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {cats.slice(0, 8).map((cat: any) => (
                                    <Link key={cat.id} href={`/shop/categories/${cat.slug}`}
                                        className="group rounded-xl border bg-white p-5 text-center transition-all hover:shadow-md hover:-translate-y-0.5 dark:bg-[#1E1E1E] dark:border-[#333]">
                                        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full" style={{ backgroundColor: cat.color ? `${cat.color}15` : '#243F1415' }}>
                                            <Store className="size-5" style={{ color: cat.color || '#243F14' }} />
                                        </div>
                                        <p className="text-sm font-semibold text-[#1A1A1A] dark:text-[#EDEDED]">{cat.name}</p>
                                        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">{cat.products_count} products</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
                {bestsellersList.length > 0 && (
                    <section className="py-16">
                        <div className="mx-auto max-w-7xl px-4">
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-[#1A1A1A] dark:text-[#EDEDED]">Best Sellers</h2>
                                    <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Most popular products</p>
                                </div>
                                <Link href="/shop/products" className="hidden sm:flex items-center gap-1 text-sm font-medium text-[#243F14] hover:underline dark:text-[#3A6B2A]">View All <ArrowRight className="size-3" /></Link>
                            </div>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {bestsellersList.map((p: any) => <ProductCard key={p.id} product={p} />)}
                            </div>
                        </div>
                    </section>
                )}
            </main>
            <footer className="border-t bg-white dark:bg-[#1A1A1A] dark:border-[#333]">
                <div className="mx-auto max-w-7xl px-4 py-12">
                    <div className="grid gap-8 md:grid-cols-3">
                        <div>
                            <img src="/brand/logo-dark.png" alt={store.name} className="h-8 w-auto mb-3 dark:hidden" />
                            <img src="/brand/logo-light.png" alt={store.name} className="hidden h-8 w-auto mb-3 dark:block" />
                            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">{store.tagline}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[#1A1A1A] dark:text-[#EDEDED] mb-3">Contact</h3>
                            <div className="space-y-2 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                                {store.address && <p className="flex items-center gap-2"><MapPin className="size-3.5 shrink-0" />{store.address}{store.city ? `, ${store.city}` : ''}</p>}
                                {store.phone && <p className="flex items-center gap-2"><Phone className="size-3.5 shrink-0" />{store.phone}</p>}
                                {store.email && <p className="flex items-center gap-2"><Mail className="size-3.5 shrink-0" />{store.email}</p>}
                                {store.hours && <p className="flex items-center gap-2"><Clock className="size-3.5 shrink-0" />{store.hours}</p>}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[#1A1A1A] dark:text-[#EDEDED] mb-3">Quick Links</h3>
                            <div className="space-y-2 text-sm">
                                <Link href="/shop/products" className="flex items-center gap-1 text-[#6B7280] hover:text-[#243F14] transition-colors dark:text-[#9CA3AF]"><ChevronRight className="size-3" /> Products</Link>
                                <Link href="/shop/promotions" className="flex items-center gap-1 text-[#6B7280] hover:text-[#243F14] transition-colors dark:text-[#9CA3AF]"><ChevronRight className="size-3" /> Promotions</Link>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 border-t pt-6 text-center text-xs text-[#6B7280] dark:text-[#9CA3AF] dark:border-[#333]">
                        &copy; {new Date().getFullYear()} {store.name}. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}

function ProductCard({ product }: { product: any }) {
    const isOos = product.track_inventory && product.stock_quantity <= 0;
    const isLow = product.track_inventory && product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold;
    return (
        <Link href={`/shop/products/${product.slug}`} className="group rounded-xl border bg-white overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 dark:bg-[#1E1E1E] dark:border-[#333]">
            <div className="aspect-[4/3] flex items-center justify-center bg-white dark:bg-[#1E1E1E] p-3">
                {product.image ? <img src={`/storage/${product.image}`} alt={product.name} className="max-h-full max-w-full object-contain" /> : <Package className="size-10 text-[#243F14]/15 dark:text-white/15" />}
            </div>
            <div className="p-3 pt-2">
                <p className="text-xs font-semibold leading-tight text-[#1A1A1A] dark:text-[#EDEDED] line-clamp-2 group-hover:text-[#243F14] dark:group-hover:text-[#3A6B2A] transition-colors">{product.name}</p>
                {product.category && <p className="text-[10px] text-[#9CA3AF] mt-0.5">{product.category.name}</p>}
                <div className="flex items-center justify-between mt-1.5">
                    <p className="text-sm font-bold text-[#243F14] dark:text-[#3A6B2A]">₱{Number(product.selling_price).toFixed(2)}</p>
                    {product.track_inventory && (
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium ${isOos ? 'text-red-600 bg-red-500/10' : isLow ? 'text-amber-600 bg-amber-500/10' : 'text-emerald-600 bg-emerald-500/10'}`}>
                            {isOos ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
