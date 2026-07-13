import { Link, usePage } from '@inertiajs/react';
import { ShoppingBag, Menu, X, Store, Package, Tags, Phone, Mail, MapPin, Clock, Facebook, Twitter, Instagram, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface StoreInfo {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    tagline: string;
    hours: string;
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    const { store } = usePage().props as { store: StoreInfo };
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#F5F3EE] dark:bg-[#121212] flex flex-col">
            <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md dark:bg-[#1A1A1A]/90 dark:border-[#333]">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <img src="/brand/logo-dark.png" alt={store.name} className="h-8 w-auto dark:hidden" />
                        <img src="/brand/logo-light.png" alt={store.name} className="hidden h-8 w-auto dark:block" />
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                            <Link href="/" className="text-sm font-medium text-[#1A1A1A] hover:text-[#243F14] transition-colors dark:text-[#EDEDED]">
                                Home
                            </Link>
                            <Link href="/shop/products" className="text-sm font-medium text-[#1A1A1A] hover:text-[#243F14] transition-colors dark:text-[#EDEDED]">
                                Products
                            </Link>
                            <Link href="/shop/promotions" className="text-sm font-medium text-[#1A1A1A] hover:text-[#243F14] transition-colors dark:text-[#EDEDED]">
                                Promotions
                            </Link>
                    </nav>
                    <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
                        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>
                </div>
                {mobileOpen && (
                    <div className="border-t bg-white px-4 py-3 md:hidden dark:bg-[#1A1A1A] dark:border-[#333]">
                        <nav className="flex flex-col gap-3">
                            <Link href="/" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#1A1A1A] dark:text-[#EDEDED]">Home</Link>
                            <Link href="/shop/products" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#1A1A1A] dark:text-[#EDEDED]">Products</Link>
                            <Link href="/shop/promotions" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#1A1A1A] dark:text-[#EDEDED]">Promotions</Link>
                        </nav>
                    </div>
                )}
            </header>

            <main className="flex-1">
                {children}
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
                                {store.address && (
                                    <p className="flex items-center gap-2"><MapPin className="size-3.5 shrink-0" />{store.address}{store.city ? `, ${store.city}` : ''}</p>
                                )}
                                {store.phone && <p className="flex items-center gap-2"><Phone className="size-3.5 shrink-0" />{store.phone}</p>}
                                {store.email && <p className="flex items-center gap-2"><Mail className="size-3.5 shrink-0" />{store.email}</p>}
                                {store.hours && <p className="flex items-center gap-2"><Clock className="size-3.5 shrink-0" />{store.hours}</p>}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[#1A1A1A] dark:text-[#EDEDED] mb-3">Quick Links</h3>
                            <div className="space-y-2 text-sm">
                                <Link href="/shop/products" className="flex items-center gap-1 text-[#6B7280] hover:text-[#243F14] transition-colors dark:text-[#9CA3AF]">
                                    <ChevronRight className="size-3" /> Products
                                </Link>
                                <Link href="/shop/promotions" className="flex items-center gap-1 text-[#6B7280] hover:text-[#243F14] transition-colors dark:text-[#9CA3AF]">
                                    <ChevronRight className="size-3" /> Promotions
                                </Link>
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
