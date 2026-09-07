import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Clock,
    Package,
    Percent,
    Search,
    ShoppingBag,
    Store,
    Tags,
    Truck,
} from 'lucide-react';

import { ShopShell } from '@/components/public/shop-shell';

export default function PublicIndex() {
    const props = usePage().props as any;
    const stats = props.stats || {
        total_products: 0,
        total_categories: 0,
        available_products: 0,
        active_promotions: 0,
    };
    const store = props.store || {
        name: 'Store',
        tagline: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        hours: '',
    };
    const newestList = Array.isArray(props.newest) ? props.newest : [];
    const bestsellersList = Array.isArray(props.bestsellers)
        ? props.bestsellers
        : [];
    const cats = Array.isArray(props.categories) ? props.categories : [];
    const featuredProducts = (Array.isArray(props.newest) ? props.newest : [])
        .filter((product: any) => Boolean(product))
        .slice(0, 3);
    const onlineOrderingEnabled = Boolean(store.online_ordering_enabled);

    return (
        <ShopShell>
            <Head title={`${store.name} — ${store.tagline}`} />
            <section className="border-b border-stone-200 bg-white dark:border-white/10 dark:bg-neutral-950">
                <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8 lg:py-18">
                    <div className="flex flex-col justify-center">
                        <p className="mb-4 text-xs font-bold tracking-wide text-[#243F14] uppercase dark:text-stone-300">
                            {onlineOrderingEnabled
                                ? 'Online ordering for local inventory'
                                : 'Browse local inventory'}
                        </p>
                        <h1 className="max-w-3xl text-4xl leading-tight font-extrabold tracking-normal text-stone-950 sm:text-5xl dark:text-white">
                            Daily essentials from {store.name},{' '}
                            {onlineOrderingEnabled
                                ? 'ready for delivery or pickup.'
                                : 'available to browse online.'}
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg dark:text-stone-300">
                            Browse available products, compare prices, and
                            {onlineOrderingEnabled
                                ? ' reserve what you need before heading to the store.'
                                : ' check current stock before visiting the store.'}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href="/shop/products"
                                className="inline-flex items-center gap-2 rounded-md bg-[#243F14] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a330e] dark:bg-white dark:text-neutral-950 dark:hover:bg-stone-200"
                            >
                                Browse products{' '}
                                <ArrowRight className="size-4" />
                            </Link>
                            <Link
                                href="/shop/promotions"
                                className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-stone-800 transition hover:border-[#243F14]/30 hover:text-[#243F14] dark:border-white/15 dark:bg-white/5 dark:text-stone-100 dark:hover:border-white/30 dark:hover:text-white"
                            >
                                View deals
                            </Link>
                        </div>
                        <div className="mt-8 grid gap-3 text-sm text-stone-600 sm:grid-cols-3 dark:text-stone-300">
                            {[
                                { icon: Search, label: 'Browse live stock' },
                                {
                                    icon: Truck,
                                    label: onlineOrderingEnabled
                                        ? 'Delivery or pickup'
                                        : 'Browse before visiting',
                                },
                                {
                                    icon: Clock,
                                    label: store.hours || 'Fast local service',
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center gap-2"
                                >
                                    <item.icon className="size-4 text-[#243F14] dark:text-stone-300" />
                                    <span className="font-medium">
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="self-end rounded-lg border border-stone-200 bg-stone-50 p-5 dark:border-white/10 dark:bg-white/5">
                        <p className="text-xs font-bold tracking-wide text-stone-500 uppercase dark:text-stone-400">
                            Available today
                        </p>
                        <p className="mt-2 text-3xl font-extrabold text-stone-950 dark:text-white">
                            {stats.available_products}
                        </p>
                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                            {onlineOrderingEnabled
                                ? 'products in stock for pickup or local delivery.'
                                : 'products in stock for in-store shopping.'}
                        </p>
                        {featuredProducts.length > 0 && (
                            <div className="mt-5 divide-y divide-stone-200 border-t border-stone-200 dark:divide-white/10 dark:border-white/10">
                                {featuredProducts.map((product: any) => (
                                    <Link
                                        key={product.id}
                                        href={`/shop/products/${product.slug}`}
                                        className="flex items-center justify-between gap-4 py-3 text-sm"
                                    >
                                        <span className="line-clamp-1 font-semibold text-stone-800 dark:text-stone-100">
                                            {product.name}
                                        </span>
                                        <span className="shrink-0 font-bold text-[#243F14] dark:text-stone-100">
                                            ₱
                                            {Number(
                                                product.selling_price,
                                            ).toFixed(2)}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                        <div className="mt-5">
                            <Link
                                href="/shop/products"
                                className="text-sm font-bold text-[#243F14] hover:underline dark:text-white"
                            >
                                See all products
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
            <section className="border-b border-stone-200 bg-stone-50 dark:border-white/10 dark:bg-neutral-900">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {[
                            {
                                icon: Package,
                                value: stats.total_products,
                                label: 'Total Products',
                            },
                            {
                                icon: Tags,
                                value: stats.total_categories,
                                label: 'Categories',
                            },
                            {
                                icon: ShoppingBag,
                                value: stats.available_products,
                                label: 'In Stock',
                            },
                            {
                                icon: Percent,
                                value: stats.active_promotions,
                                label: 'Active Promotions',
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="rounded-lg border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-white/5"
                            >
                                <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-stone-100 text-[#243F14] dark:bg-white/10 dark:text-stone-200">
                                    <item.icon className="size-5" />
                                </div>
                                <p className="text-2xl font-black text-stone-950 dark:text-white">
                                    {item.value}
                                </p>
                                <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                                    {item.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {newestList.length > 0 && (
                <section className="py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-stone-950 dark:text-white">
                                    Newest Products
                                </h2>
                                <p className="text-sm text-stone-500 dark:text-stone-400">
                                    Fresh additions from the counter
                                </p>
                            </div>
                            <Link
                                href="/shop/products"
                                className="hidden items-center gap-1 text-sm font-bold text-[#243F14] hover:underline sm:flex dark:text-white"
                            >
                                View All <ArrowRight className="size-3" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {newestList.map((product: any) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}
            {cats.length > 0 && (
                <section className="border-y border-stone-200 bg-white py-16 dark:border-white/10 dark:bg-neutral-900">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-8 text-center">
                            <h2 className="text-2xl font-black text-stone-950 dark:text-white">
                                Shop by Category
                            </h2>
                            <p className="text-sm text-stone-500 dark:text-stone-400">
                                Find what you need quickly
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {cats.slice(0, 8).map((category: any) => (
                                <Link
                                    key={category.id}
                                    href={`/shop/categories/${category.slug}`}
                                    className="group rounded-lg border border-stone-200 bg-stone-50 p-5 text-center transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-200/60 dark:border-white/10 dark:bg-white/5 dark:hover:shadow-black/20"
                                >
                                    <div
                                        className="mx-auto mb-3 flex size-12 items-center justify-center rounded-md"
                                        style={{
                                            backgroundColor: category.color
                                                ? `${category.color}15`
                                                : '#243F1415',
                                        }}
                                    >
                                        <Store
                                            className="size-5"
                                            style={{
                                                color:
                                                    category.color || '#243F14',
                                            }}
                                        />
                                    </div>
                                    <p className="text-sm font-bold text-stone-950 dark:text-white">
                                        {category.name}
                                    </p>
                                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                        {category.products_count} products
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            {bestsellersList.length > 0 && (
                <section className="py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-stone-950 dark:text-white">
                                    Best Sellers
                                </h2>
                                <p className="text-sm text-stone-500 dark:text-stone-400">
                                    Popular picks from local shoppers
                                </p>
                            </div>
                            <Link
                                href="/shop/products"
                                className="hidden items-center gap-1 text-sm font-bold text-[#243F14] hover:underline sm:flex dark:text-white"
                            >
                                View All <ArrowRight className="size-3" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {bestsellersList.map((product: any) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </ShopShell>
    );
}

function ProductCard({ product }: { product: any }) {
    const isOutOfStock = product.track_inventory && product.stock_quantity <= 0;
    const isLowStock =
        product.track_inventory &&
        product.stock_quantity > 0 &&
        product.stock_quantity <= product.low_stock_threshold;

    return (
        <Link
            href={`/shop/products/${product.slug}`}
            className="group overflow-hidden rounded-lg border border-stone-200 bg-white transition hover:border-stone-300 dark:border-white/10 dark:bg-neutral-900 dark:hover:border-white/20"
        >
            <div className="flex aspect-[4/3] items-center justify-center bg-white p-4 dark:bg-white">
                {product.image ? (
                    <img
                        src={`/storage/${product.image}`}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain transition group-hover:scale-105"
                    />
                ) : (
                    <Package className="size-10 text-[#243F14]/20" />
                )}
            </div>
            <div className="p-4">
                <p className="line-clamp-2 text-sm leading-snug font-bold text-stone-950 transition group-hover:text-[#243F14] dark:text-white dark:group-hover:text-white">
                    {product.name}
                </p>
                {product.category && (
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                        {product.category.name}
                    </p>
                )}
                <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-base font-black text-[#243F14] dark:text-white">
                        ₱{Number(product.selling_price).toFixed(2)}
                    </p>
                    {product.track_inventory && (
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold ${isOutOfStock ? 'bg-red-500/10 text-red-600 dark:text-red-300' : isLowStock ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}
                        >
                            {isOutOfStock
                                ? 'Out of Stock'
                                : isLowStock
                                  ? 'Low Stock'
                                  : 'In Stock'}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
