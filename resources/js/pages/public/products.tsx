import { Head, Link, router, usePage } from '@inertiajs/react';
import { Package, Search, SlidersHorizontal, Truck } from 'lucide-react';
import { useState } from 'react';

import { ShopShell } from '@/components/public/shop-shell';

export default function PublicProducts() {
    const props = usePage().props as any;
    const products = props.products || {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
    };
    const categories = Array.isArray(props.categories) ? props.categories : [];
    const store = props.store || { name: 'Store' };
    const onlineOrderingEnabled = Boolean(store.online_ordering_enabled);
    const params = new URLSearchParams(window.location.search);
    const [search, setSearch] = useState(params.get('search') || '');

    function submitSearch(event: React.FormEvent) {
        event.preventDefault();

        const nextParams = new URLSearchParams(window.location.search);
        const trimmedSearch = search.trim();

        if (trimmedSearch) {
            nextParams.set('search', trimmedSearch);
        } else {
            nextParams.delete('search');
        }

        nextParams.delete('page');

        router.get(
            `/shop/products?${nextParams.toString()}`,
            {},
            { preserveState: true, preserveScroll: true },
        );
    }

    return (
        <ShopShell>
            <Head title={`Products — ${store.name}`} />
            <div className="border-b border-stone-200 bg-white dark:border-white/10 dark:bg-neutral-950">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold tracking-wide text-[#243F14] uppercase dark:text-stone-300">
                            <Truck className="size-3.5" />
                            {onlineOrderingEnabled
                                ? 'Delivery or pickup'
                                : 'Browse products'}
                        </p>
                        <h1 className="text-3xl font-black text-stone-950 sm:text-4xl dark:text-white">
                            Shop Products
                        </h1>
                        <p className="mt-3 text-sm leading-6 text-stone-500 dark:text-stone-400">
                            {products.total} products available from current
                            store inventory
                            {onlineOrderingEnabled
                                ? ' for delivery or pickup.'
                                : '.'}
                        </p>
                    </div>
                </div>
            </div>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-6 lg:flex-row">
                    <aside className="shrink-0 lg:w-64">
                        <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-neutral-900">
                            <p className="mb-4 flex items-center gap-2 text-xs font-bold text-stone-500 uppercase dark:text-stone-400">
                                <SlidersHorizontal className="size-3.5" />
                                Categories
                            </p>
                            <div className="space-y-1">
                                <Link
                                    href="/shop/products"
                                    className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-stone-700 transition hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/10"
                                >
                                    All Categories
                                </Link>
                                {categories.map((c: any) => {
                                    const params = new URLSearchParams(
                                        window.location.search,
                                    );
                                    params.set('category', c.slug);
                                    return (
                                        <Link
                                            key={c.id}
                                            href={`/shop/products?${params.toString()}`}
                                            className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-[#243F14] dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white"
                                        >
                                            <span className="truncate">
                                                {c.name}
                                            </span>
                                            <span className="text-xs text-stone-400">
                                                {c.products_count}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>
                    <div className="flex-1">
                        <form
                            onSubmit={submitSearch}
                            className="mb-5 flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-3 sm:flex-row dark:border-white/10 dark:bg-neutral-900"
                        >
                            <label className="relative flex-1">
                                <span className="sr-only">Search products</span>
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search by product name, SKU, barcode, or brand"
                                    className="h-11 w-full rounded-md border border-stone-200 bg-stone-50 pr-3 pl-9 text-sm text-stone-950 transition outline-none placeholder:text-stone-400 focus:border-[#243F14] focus:bg-white dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:focus:border-white/30"
                                />
                            </label>
                            <button
                                type="submit"
                                className="inline-flex h-11 items-center justify-center rounded-md bg-[#243F14] px-5 text-sm font-bold text-white transition hover:bg-[#1a330e] dark:bg-white dark:text-neutral-950 dark:hover:bg-stone-200"
                            >
                                Search
                            </button>
                            {params.get('search') && (
                                <Link
                                    href="/shop/products"
                                    className="inline-flex h-11 items-center justify-center rounded-md border border-stone-200 px-4 text-sm font-bold text-stone-600 transition hover:bg-stone-100 dark:border-white/10 dark:text-stone-300 dark:hover:bg-white/10"
                                >
                                    Clear
                                </Link>
                            )}
                        </form>
                        {products.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white py-20 text-center dark:border-white/15 dark:bg-neutral-900">
                                <Search className="mb-3 size-12 text-stone-300 dark:text-stone-700" />
                                <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
                                    No products found
                                </p>
                                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                                    Try another category or check back after
                                    restock.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                                {products.data.map((p: any) => (
                                    <Link
                                        key={p.id}
                                        href={`/shop/products/${p.slug}`}
                                        className="group overflow-hidden rounded-lg border border-stone-200 bg-white transition hover:border-stone-300 dark:border-white/10 dark:bg-neutral-900 dark:hover:border-white/20"
                                    >
                                        <div className="flex aspect-[4/3] items-center justify-center bg-white p-4 dark:bg-white">
                                            {p.image ? (
                                                <img
                                                    src={`/storage/${p.image}`}
                                                    alt={p.name}
                                                    className="max-h-full max-w-full object-contain transition group-hover:scale-105"
                                                />
                                            ) : (
                                                <Package className="size-10 text-[#243F14]/20" />
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <p className="line-clamp-2 text-sm leading-snug font-bold text-stone-950 transition group-hover:text-[#243F14] dark:text-white dark:group-hover:text-white">
                                                {p.name}
                                            </p>
                                            <p className="mt-1 truncate text-xs text-stone-500 dark:text-stone-400">
                                                {p.category?.name}
                                                {p.brand ? ` · ${p.brand}` : ''}
                                            </p>
                                            <div className="mt-3 flex items-center justify-between gap-2">
                                                <p className="text-base font-black text-[#243F14] dark:text-white">
                                                    ₱
                                                    {Number(
                                                        p.selling_price,
                                                    ).toFixed(2)}
                                                </p>
                                                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                                    Available
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                        {products.last_page > 1 && (
                            <div className="mt-8 flex items-center justify-center gap-2">
                                {Array.from(
                                    {
                                        length: Math.min(
                                            products.last_page,
                                            10,
                                        ),
                                    },
                                    (_, i) => i + 1,
                                ).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => {
                                            const p = new URLSearchParams(
                                                window.location.search,
                                            );
                                            p.set('page', String(page));
                                            router.get(
                                                `/shop/products?${p.toString()}`,
                                                {},
                                                { preserveState: true },
                                            );
                                        }}
                                        className={`flex size-9 items-center justify-center rounded-md text-sm font-bold transition ${page === products.current_page ? 'bg-[#243F14] text-white dark:bg-white dark:text-neutral-950' : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 dark:border-white/10 dark:bg-neutral-900 dark:text-stone-300 dark:hover:bg-white/10'}`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ShopShell>
    );
}
