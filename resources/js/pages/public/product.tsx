import { Head, Link, usePage } from '@inertiajs/react';
import {
    Package,
    ChevronRight,
    Tag,
    ShoppingBag,
    ShoppingCart,
    Zap,
    Minus,
    Plus,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ShopShell } from '@/components/public/shop-shell';

export default function PublicProduct() {
    const props = usePage().props as any;
    const product = props.product as any;
    const related = Array.isArray(props.related) ? props.related : [];
    const store = props.store || { name: 'Store' };
    const onlineOrderingEnabled = Boolean(store.online_ordering_enabled);
    const [quantity, setQuantity] = useState(1);

    if (!product)
        return (
            <ShopShell>
                <div className="flex min-h-80 items-center justify-center">
                    <p className="text-[#6B7280]">Product not found</p>
                </div>
            </ShopShell>
        );

    const isOutOfStock = product.track_inventory && product.stock_quantity <= 0;
    const isLowStock =
        product.track_inventory &&
        product.stock_quantity > 0 &&
        product.stock_quantity <= product.low_stock_threshold;
    const stockAvailable = product.track_inventory
        ? Number(product.stock_quantity)
        : null;
    const maxOrderQuantity = stockAvailable ?? 99;
    const stockLabel =
        stockAvailable === null
            ? 'Available'
            : stockAvailable === 1
              ? '1 item left'
              : `${stockAvailable} items left`;

    function clampQuantity(nextQuantity: number) {
        return Math.max(1, Math.min(nextQuantity, maxOrderQuantity));
    }

    function addToCart(shouldCheckout = false) {
        if (isOutOfStock) {
            toast.error('This product is out of stock');

            return;
        }

        const cartKey = 'vendora-storefront-cart';
        const currentCart = JSON.parse(
            window.localStorage.getItem(cartKey) || '[]',
        );
        const existingItem = currentCart.find(
            (item: { product_id: number }) => item.product_id === product.id,
        );

        if (existingItem) {
            existingItem.quantity = clampQuantity(
                Number(existingItem.quantity || 0) + quantity,
            );
        } else {
            currentCart.push({
                product_id: product.id,
                slug: product.slug,
                name: product.name,
                price: Number(product.selling_price),
                quantity,
                image: product.image,
                stock_quantity: stockAvailable,
            });
        }

        window.localStorage.setItem(cartKey, JSON.stringify(currentCart));

        toast.success(
            shouldCheckout
                ? `${product.name} is ready for checkout`
                : `${product.name} added to cart`,
        );
    }

    return (
        <ShopShell>
            <Head title={`${product.name} — ${store.name}`} />
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
                    {product.category && (
                        <>
                            <ChevronRight className="size-3" />
                            <Link
                                href={`/shop/categories/${product.category.slug}`}
                                className="hover:text-[#243F14]"
                            >
                                {product.category.name}
                            </Link>
                        </>
                    )}
                    <ChevronRight className="size-3" />
                    <span className="text-[#6B7280]">{product.name}</span>
                </nav>
                <div className="grid gap-8 md:grid-cols-2">
                    <div className="flex aspect-square items-center justify-center rounded-2xl border bg-white p-8 dark:border-[#333] dark:bg-white">
                        {product.image ? (
                            <img
                                src={`/storage/${product.image}`}
                                alt={product.name}
                                className="max-h-full max-w-full object-contain"
                            />
                        ) : (
                            <Package className="size-20 text-[#243F14]/15" />
                        )}
                    </div>
                    <div>
                        <div className="mb-1 flex items-start gap-2">
                            {product.category && (
                                <Link
                                    href={`/shop/categories/${product.category.slug}`}
                                    className="inline-flex items-center gap-1 rounded-full bg-[#243F14]/10 px-2.5 py-0.5 text-xs font-medium text-[#243F14] dark:bg-[#3A6B2A]/20 dark:text-[#3A6B2A]"
                                >
                                    <Tag className="size-3" />{' '}
                                    {product.category.name}
                                </Link>
                            )}
                            {product.track_inventory && (
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${isOutOfStock ? 'bg-red-500/10 text-red-600' : isLowStock ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}
                                >
                                    <ShoppingBag className="size-3" />
                                    {isOutOfStock
                                        ? 'Out of Stock'
                                        : isLowStock
                                          ? `${product.stock_quantity} left`
                                          : 'In Stock'}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-[#EDEDED]">
                            {product.name}
                        </h1>
                        {product.brand && (
                            <p className="mt-0.5 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                                {product.brand}
                            </p>
                        )}
                        <p className="mt-4 text-3xl font-bold text-[#243F14] dark:text-[#3A6B2A]">
                            ₱{Number(product.selling_price).toFixed(2)}
                        </p>
                        {product.wholesale_price && (
                            <p className="mt-1 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                                Wholesale: ₱
                                {Number(product.wholesale_price).toFixed(2)}
                            </p>
                        )}
                        <div className="mt-5 rounded-xl border bg-white p-4 dark:border-[#333] dark:bg-[#1E1E1E]">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-[#9CA3AF] uppercase">
                                        Stock available
                                    </p>
                                    <p
                                        className={`mt-1 text-lg font-bold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-[#243F14] dark:text-[#8BC34A]'}`}
                                    >
                                        {isOutOfStock
                                            ? 'Out of stock'
                                            : stockLabel}
                                    </p>
                                </div>
                                {onlineOrderingEnabled && !isOutOfStock && (
                                    <div className="flex items-center rounded-md border bg-[#F5F3EE] dark:border-[#333] dark:bg-neutral-900">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setQuantity((current) =>
                                                    clampQuantity(current - 1),
                                                )
                                            }
                                            className="flex size-10 items-center justify-center text-[#243F14] disabled:opacity-40 dark:text-[#EDEDED]"
                                            disabled={quantity <= 1}
                                            aria-label="Decrease quantity"
                                        >
                                            <Minus className="size-4" />
                                        </button>
                                        <span className="w-10 text-center text-sm font-bold">
                                            {quantity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setQuantity((current) =>
                                                    clampQuantity(current + 1),
                                                )
                                            }
                                            className="flex size-10 items-center justify-center text-[#243F14] disabled:opacity-40 dark:text-[#EDEDED]"
                                            disabled={
                                                quantity >= maxOrderQuantity
                                            }
                                            aria-label="Increase quantity"
                                        >
                                            <Plus className="size-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {onlineOrderingEnabled ? (
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => addToCart()}
                                        disabled={isOutOfStock}
                                        className="inline-flex items-center justify-center gap-2 rounded-md border border-[#243F14]/25 bg-white px-4 py-3 text-sm font-bold text-[#243F14] transition hover:bg-[#243F14]/5 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                    >
                                        <ShoppingCart className="size-4" />
                                        Add to cart
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => addToCart(true)}
                                        disabled={isOutOfStock}
                                        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#243F14] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1a330e] disabled:cursor-not-allowed disabled:bg-stone-300 dark:bg-white dark:text-neutral-950 dark:hover:bg-stone-200 dark:disabled:bg-stone-700 dark:disabled:text-stone-400"
                                    >
                                        <Zap className="size-4" />
                                        Buy now
                                    </button>
                                </div>
                            ) : (
                                <p className="mt-4 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                                    Online ordering is currently closed. You can
                                    still use this page to check availability
                                    before visiting the store.
                                </p>
                            )}
                        </div>
                        {product.description && (
                            <div className="mt-6">
                                <h3 className="mb-1 text-sm font-semibold text-[#1A1A1A] dark:text-[#EDEDED]">
                                    Description
                                </h3>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#6B7280] dark:text-[#9CA3AF]">
                                    {product.description}
                                </p>
                            </div>
                        )}
                        <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border bg-[#F5F3EE] p-4 dark:border-[#333] dark:bg-[#1E1E1E]">
                            <div>
                                <p className="text-[10px] tracking-wider text-[#9CA3AF] uppercase">
                                    SKU
                                </p>
                                <p className="text-sm font-medium text-[#1A1A1A] dark:text-[#EDEDED]">
                                    {product.sku || '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] tracking-wider text-[#9CA3AF] uppercase">
                                    Barcode
                                </p>
                                <p className="text-sm font-medium text-[#1A1A1A] dark:text-[#EDEDED]">
                                    {product.barcode || '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] tracking-wider text-[#9CA3AF] uppercase">
                                    Unit
                                </p>
                                <p className="text-sm font-medium text-[#1A1A1A] dark:text-[#EDEDED]">
                                    {product.unit || '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] tracking-wider text-[#9CA3AF] uppercase">
                                    Category
                                </p>
                                <p className="text-sm font-medium text-[#1A1A1A] dark:text-[#EDEDED]">
                                    {product.category?.name || '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                {related.length > 0 && (
                    <section className="mt-12">
                        <h2 className="mb-4 text-lg font-bold text-[#1A1A1A] dark:text-[#EDEDED]">
                            Related Products
                        </h2>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {related.map((p: any) => (
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
                                        <p className="mt-1 text-sm font-bold text-[#243F14] dark:text-[#3A6B2A]">
                                            ₱
                                            {Number(p.selling_price).toFixed(2)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </ShopShell>
    );
}
