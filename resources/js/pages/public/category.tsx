import { Head, Link, router, usePage } from '@inertiajs/react';
import { Package, ChevronRight, Store } from 'lucide-react';

export default function PublicCategory() {
    const props = usePage().props as any;
    const category = props.category as any;
    const products = props.products || {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
    };
    const store = props.store || { name: 'Store' };
    if (!category)
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F5F3EE]">
                <p className="text-[#6B7280]">Category not found</p>
            </div>
        );

    return (
        <div className="min-h-screen bg-[#F5F3EE] dark:bg-[#121212]">
            <Head title={`${category.name} — ${store.name}`} />
            <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md dark:border-[#333] dark:bg-[#1A1A1A]/90">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                    <Link href="/" className="flex shrink-0 items-center gap-2">
                        <img
                            src="/brand/logo-dark.png"
                            alt={store.name}
                            className="h-8 w-auto dark:hidden"
                        />
                        <img
                            src="/brand/logo-light.png"
                            alt={store.name}
                            className="hidden h-8 w-auto dark:block"
                        />
                    </Link>
                    <nav className="hidden items-center gap-6 md:flex">
                        <Link
                            href="/"
                            className="text-sm font-medium text-[#1A1A1A] transition-colors hover:text-[#243F14] dark:text-[#EDEDED]"
                        >
                            Home
                        </Link>
                        <Link
                            href="/shop/products"
                            className="text-sm font-medium text-[#1A1A1A] transition-colors hover:text-[#243F14] dark:text-[#EDEDED]"
                        >
                            Products
                        </Link>
                        <Link
                            href="/shop/promotions"
                            className="text-sm font-medium text-[#1A1A1A] transition-colors hover:text-[#243F14] dark:text-[#EDEDED]"
                        >
                            Promotions
                        </Link>
                    </nav>
                </div>
            </header>
            <div className="mx-auto max-w-7xl px-4 py-8">
                <nav className="mb-6 flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                    <Link href="/" className="hover:text-[#243F14]">
                        Home
                    </Link>
                    <ChevronRight className="size-3" />
                    <Link
                        href="/shop/products"
                        className="hover:text-[#243F14]"
                    >
                        Products
                    </Link>
                    <ChevronRight className="size-3" />
                    <span className="text-[#6B7280]">{category.name}</span>
                </nav>
                <div
                    className="mb-8 rounded-2xl border bg-white p-8 dark:border-[#333] dark:bg-[#1E1E1E]"
                    style={{
                        borderLeftColor: category.color || '#243F14',
                        borderLeftWidth: 4,
                    }}
                >
                    <div className="mb-2 flex items-center gap-3">
                        <div
                            className="flex size-10 items-center justify-center rounded-full"
                            style={{
                                backgroundColor: category.color
                                    ? `${category.color}15`
                                    : '#243F1415',
                            }}
                        >
                            <Store
                                className="size-5"
                                style={{ color: category.color || '#243F14' }}
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-[#EDEDED]">
                                {category.name}
                            </h1>
                            {category.description && (
                                <p className="mt-0.5 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                                    {category.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-[#9CA3AF]">
                        {products.total} products
                    </p>
                </div>
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                        {products.from}–{products.to} of {products.total}
                    </p>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                            Sort:
                        </label>
                        <select
                            onChange={(e) => {
                                const p = new URLSearchParams();
                                if (e.target.value)
                                    p.set('sort', e.target.value);
                                router.get(
                                    `/shop/categories/${category.slug}?${p.toString()}`,
                                    {},
                                    { preserveState: true },
                                );
                            }}
                            className="rounded-lg border bg-white px-3 py-1.5 text-sm outline-none focus:border-[#243F14] dark:border-[#333] dark:bg-[#1E1E1E]"
                        >
                            <option value="">Newest</option>
                            <option value="price_asc">
                                Price: Low to High
                            </option>
                            <option value="price_desc">
                                Price: High to Low
                            </option>
                            <option value="name_asc">Name: A-Z</option>
                        </select>
                    </div>
                </div>
                {products.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Package className="mb-3 size-12 text-[#9CA3AF]/40" />
                        <p className="text-sm font-medium text-[#6B7280]">
                            No products in this category
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {products.data.map((p: any) => (
                            <Link
                                key={p.id}
                                href={`/shop/products/${p.slug}`}
                                className="group overflow-hidden rounded-xl border bg-white transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-[#333] dark:bg-[#1E1E1E]"
                            >
                                <div className="flex aspect-[4/3] items-center justify-center bg-white p-3 dark:bg-white">
                                    {p.image ? (
                                        <img
                                            src={`/storage/${p.image}`}
                                            alt={p.name}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    ) : (
                                        <Package className="size-8 text-[#243F14]/15" />
                                    )}
                                </div>
                                <div className="p-3 pt-2">
                                    <p className="line-clamp-2 text-xs leading-tight font-semibold text-[#1A1A1A] transition-colors group-hover:text-[#243F14] dark:text-[#EDEDED]">
                                        {p.name}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-[#9CA3AF]">
                                        {p.category?.name}
                                        {p.brand ? ` · ${p.brand}` : ''}
                                    </p>
                                    <p className="mt-1.5 text-sm font-bold text-[#243F14] dark:text-[#3A6B2A]">
                                        ₱{Number(p.selling_price).toFixed(2)}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                {products.last_page > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                        {Array.from(
                            { length: Math.min(products.last_page, 10) },
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
                                        `/shop/categories/${category.slug}?${p.toString()}`,
                                        {},
                                        { preserveState: true },
                                    );
                                }}
                                className={`flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === products.current_page ? 'bg-[#243F14] text-white' : 'border bg-white text-[#6B7280] hover:bg-[#F5F3EE] dark:border-[#333] dark:bg-[#1E1E1E]'}`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
