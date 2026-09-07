import { Link, usePage } from '@inertiajs/react';
import {
    Clock,
    Menu,
    Moon,
    PackageSearch,
    Phone,
    Sun,
    Truck,
    X,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { useAppearance } from '@/hooks/use-appearance';

type StoreInfo = {
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    tagline?: string;
    hours?: string;
    online_ordering_enabled?: boolean;
};

const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/shop/products' },
    { label: 'Promotions', href: '/shop/promotions' },
];

export function ShopShell({ children }: { children: ReactNode }) {
    const { store } = usePage().props as { store?: StoreInfo };
    const shop = store || {
        name: 'Vendora Store',
        tagline: 'Your Neighborhood Store',
    };
    const [mobileOpen, setMobileOpen] = useState(false);
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';
    const onlineOrderingEnabled = Boolean(shop.online_ordering_enabled);

    return (
        <div className="flex min-h-screen flex-col bg-stone-50 text-stone-950 antialiased dark:bg-neutral-950 dark:text-stone-50">
            <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-neutral-950/95">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="flex min-w-0 items-center">
                        <img
                            src="/brand/logo-light.png"
                            alt={shop.name}
                            className="h-9 w-auto dark:hidden"
                        />
                        <img
                            src="/brand/logo-dark.png"
                            alt={shop.name}
                            className="hidden h-9 w-auto dark:block"
                        />
                    </Link>

                    <nav className="hidden items-center gap-1 md:flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch
                                className="rounded-md px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-[#243F14] dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                updateAppearance(isDark ? 'light' : 'dark')
                            }
                            aria-label={
                                isDark
                                    ? 'Switch to light mode'
                                    : 'Switch to dark mode'
                            }
                            className="inline-flex size-10 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 transition hover:border-[#243F14]/30 hover:text-[#243F14] dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:border-white/30 dark:hover:text-white"
                        >
                            {isDark ? (
                                <Sun className="size-4" />
                            ) : (
                                <Moon className="size-4" />
                            )}
                        </button>
                        <Link
                            href="/shop/products"
                            className="hidden items-center gap-2 rounded-md bg-[#243F14] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a330e] sm:inline-flex dark:bg-white dark:text-neutral-950 dark:hover:bg-stone-200"
                        >
                            <PackageSearch className="size-4" />
                            {onlineOrderingEnabled
                                ? 'Order now'
                                : 'Browse products'}
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMobileOpen((open) => !open)}
                            className="inline-flex size-10 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 md:hidden dark:border-white/10 dark:bg-white/5 dark:text-stone-200"
                        >
                            {mobileOpen ? (
                                <X className="size-5" />
                            ) : (
                                <Menu className="size-5" />
                            )}
                        </button>
                    </div>
                </div>

                {mobileOpen && (
                    <div className="border-t border-stone-200 bg-white px-4 py-4 md:hidden dark:border-white/10 dark:bg-neutral-950">
                        <nav className="grid gap-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="rounded-md px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/10"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                )}
            </header>

            <main className="flex-1">{children}</main>

            <footer className="mt-auto border-t border-stone-200 bg-white dark:border-white/10 dark:bg-neutral-950">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
                    <div>
                        <img
                            src="/brand/logo-light.png"
                            alt={shop.name}
                            className="h-9 w-auto dark:hidden"
                        />
                        <img
                            src="/brand/logo-dark.png"
                            alt={shop.name}
                            className="hidden h-9 w-auto dark:block"
                        />
                        <p className="mt-3 max-w-sm text-sm leading-6 text-stone-500 dark:text-stone-400">
                            {shop.tagline ||
                                (onlineOrderingEnabled
                                    ? 'Your neighborhood shop for essentials, quick pickup, and local delivery.'
                                    : 'Your neighborhood shop for browsing current products and promotions.')}
                        </p>
                    </div>
                    <div className="space-y-3 text-sm text-stone-500 dark:text-stone-400">
                        <p className="font-semibold text-stone-900 dark:text-stone-100">
                            {onlineOrderingEnabled
                                ? 'Shop options'
                                : 'Storefront'}
                        </p>
                        {onlineOrderingEnabled ? (
                            <p className="flex items-center gap-2">
                                <Truck className="size-4 text-[#243F14] dark:text-stone-300" />
                                Delivery and pickup available
                            </p>
                        ) : (
                            <p className="flex items-center gap-2">
                                <Truck className="size-4 text-[#243F14] dark:text-stone-300" />
                                Online ordering is currently closed
                            </p>
                        )}
                        {shop.hours && (
                            <p className="flex items-center gap-2">
                                <Clock className="size-4 text-[#243F14] dark:text-stone-300" />
                                {shop.hours}
                            </p>
                        )}
                    </div>
                    <div className="space-y-3 text-sm text-stone-500 dark:text-stone-400">
                        <p className="font-semibold text-stone-900 dark:text-stone-100">
                            Contact
                        </p>
                        {shop.phone && (
                            <p className="flex items-center gap-2">
                                <Phone className="size-4 text-[#243F14] dark:text-stone-300" />
                                {shop.phone}
                            </p>
                        )}
                        <div className="flex gap-3">
                            <Link
                                href="/shop/products"
                                className="font-semibold text-[#243F14] hover:underline dark:text-white"
                            >
                                Products
                            </Link>
                            <Link
                                href="/shop/promotions"
                                className="font-semibold text-[#243F14] hover:underline dark:text-white"
                            >
                                Promotions
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
