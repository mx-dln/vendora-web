import { Head, Link } from '@inertiajs/react';
import { login, dashboard } from '@/routes';
import { usePage } from '@inertiajs/react';
import { ShoppingCart, Package, BarChart3, Users, Shield, Barcode, Store, Receipt, Warehouse, ClipboardList, ArrowRight, CheckCircle } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage().props;
    const isLoggedIn = !!auth?.user;

    return (
        <>
            <Head title="Vendora — Retail POS System" />
            <div className="flex min-h-screen flex-col bg-[#F5F3EE] dark:bg-[#121212]">
                {/* Nav */}
                <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md dark:bg-[#1A1A1A]/80 dark:border-[#333]">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/brand/logo-dark.png" alt="Vendora" className="h-8 w-auto dark:hidden" />
                            <img src="/brand/logo-light.png" alt="Vendora" className="hidden h-8 w-auto dark:block" />
                        </Link>
                        <nav className="flex items-center gap-4">
                            {isLoggedIn ? (
                                <Link href={dashboard()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#243F14] px-4 py-2 text-sm font-medium text-white hover:bg-[#1A330E] transition-colors">
                                    Dashboard <ArrowRight className="size-3.5" />
                                </Link>
                            ) : (
                                <>
                                    <Link href={login()} className="text-sm font-medium text-[#1A1A1A] hover:text-[#243F14] transition-colors dark:text-[#EDEDED]">Log in</Link>
                                    <Link href={login()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#243F14] px-4 py-2 text-sm font-medium text-white hover:bg-[#1A330E] transition-colors">
                                        Get Started <ArrowRight className="size-3.5" />
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative overflow-hidden border-b border-[#E5E4E0] dark:border-[#333]">
                    <div className="mx-auto max-w-6xl px-4 py-20 lg:py-28">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-xs font-medium text-[#243F14] mb-6 dark:bg-[#1E1E1E] dark:border-[#333]">
                                <Store className="size-3" /> Complete Retail Management
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight text-[#1A1A1A] lg:text-5xl dark:text-[#EDEDED]">
                                Point of Sale &amp; Inventory{' '}
                                <span className="text-[#243F14] dark:text-[#3A6B2A]">Made Simple</span>
                            </h1>
                            <p className="mt-4 text-lg text-[#6B7280] max-w-lg dark:text-[#9CA3AF]">
                                A modern POS system for Filipino convenience stores, mini marts, and retail businesses. Manage sales, inventory, purchasing, and customers from one place.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link href={login()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#243F14] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1A330E] transition-colors">
                                    Start Free Trial <ArrowRight className="size-3.5" />
                                </Link>
                                <a href="#features" className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#F5F3EE] transition-colors dark:bg-[#1E1E1E] dark:border-[#333] dark:text-[#EDEDED]">
                                    See Features
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -right-20 top-1/2 hidden -translate-y-1/2 lg:block">
                        <div className="size-96 rounded-full bg-[#243F14]/5 dark:bg-[#3A6B2A]/10" />
                    </div>
                </section>

                {/* Stats */}
                <section className="border-b border-[#E5E4E0] bg-white py-12 dark:bg-[#1A1A1A] dark:border-[#333]">
                    <div className="mx-auto max-w-6xl px-4">
                        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                            {[
                                { value: '75+', label: 'Product Categories' },
                                { value: '15+', label: 'Business Modules' },
                                { value: '99.9%', label: 'Uptime' },
                                { value: '24/7', label: 'AI Assistant' },
                            ].map((s, i) => (
                                <div key={i} className="text-center">
                                    <p className="text-3xl font-bold text-[#243F14] dark:text-[#3A6B2A]">{s.value}</p>
                                    <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="border-b border-[#E5E4E0] py-20 dark:border-[#333]">
                    <div className="mx-auto max-w-6xl px-4">
                        <div className="mb-12 text-center">
                            <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-[#EDEDED]">Everything you need to run your store</h2>
                            <p className="mt-2 text-[#6B7280] dark:text-[#9CA3AF]">Complete retail management system built for Filipino businesses</p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                { icon: ShoppingCart, title: 'Point of Sale', desc: 'Fast checkout with barcode scanning, product search, and multiple payment methods including GCash and Maya.' },
                                { icon: Package, title: 'Products & Inventory', desc: 'Manage products with SKU, barcodes, variants, categories, and real-time stock tracking across locations.' },
                                { icon: Receipt, title: 'Sales & Transactions', desc: 'View sales history, print thermal receipts, process returns, and void transactions with full audit trails.' },
                                { icon: Warehouse, title: 'Inventory Management', desc: 'Stock in/out/adjust, stock counts with reconciliation, and inventory transfers between locations.' },
                                { icon: ClipboardList, title: 'Purchase Orders', desc: 'Create POs with items, partial receiving, goods receiving with auto stock updates, and supplier management.' },
                                { icon: Users, title: 'Customers & Loyalty', desc: 'Customer profiles with purchase history, loyalty points, tier system, and rewards management.' },
                                { icon: BarChart3, title: 'Reports & Analytics', desc: 'Sales reports, product performance, profit & loss, cashier performance, and inventory health dashboards.' },
                                { icon: Shield, title: 'Role-Based Access', desc: 'Owner, Manager, and Cashier roles with granular permissions. Full audit logging of all system actions.' },
                                { icon: Barcode, title: 'Barcode Labels', desc: 'Generate barcodes, print labels in multiple formats (Code128, EAN-13, QR), and support for thermal printers.' },
                            ].map((f, i) => (
                                <div key={i} className="rounded-xl border bg-white p-6 hover:shadow-md transition-shadow dark:bg-[#1E1E1E] dark:border-[#333]">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-[#243F14]/10 text-[#243F14] mb-3 dark:bg-[#3A6B2A]/20 dark:text-[#3A6B2A]">
                                        <f.icon className="size-5" />
                                    </div>
                                    <h3 className="font-semibold text-[#1A1A1A] dark:text-[#EDEDED]">{f.title}</h3>
                                    <p className="mt-1 text-sm text-[#6B7280] dark:text-[#9CA3AF]">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* AI Assistant */}
                <section className="border-b border-[#E5E4E0] bg-white py-20 dark:bg-[#1A1A1A] dark:border-[#333]">
                    <div className="mx-auto max-w-6xl px-4">
                        <div className="flex flex-col items-center gap-8 lg:flex-row">
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-1.5 rounded-full border bg-[#243F14]/5 px-3 py-1 text-xs font-medium text-[#243F14] mb-4 dark:bg-[#3A6B2A]/10 dark:text-[#3A6B2A]">
                                    AI-Powered
                                </div>
                                <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-[#EDEDED]">Built-in AI Business Assistant</h2>
                                <p className="mt-2 text-[#6B7280] dark:text-[#9CA3AF]">Ask questions in plain English — get instant answers, reports, and insights about your business.</p>
                                <ul className="mt-6 space-y-2">
                                    {[
                                        'What are my sales today?',
                                        'Show low stock items',
                                        'Compare sales this month to last month',
                                        'Review invoice INV-20260711-763037',
                                    ].map((q, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                                            <CheckCircle className="size-4 text-[#243F14] dark:text-[#3A6B2A]" />
                                            <span className="font-mono text-xs">"{q}"</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex-1 rounded-xl border bg-[#F5F3EE] p-6 dark:bg-[#121212] dark:border-[#333]">
                                <div className="space-y-3">
                                    <div className="flex items-start gap-2">
                                        <div className="flex size-6 items-center justify-center rounded-full bg-[#243F14] text-[10px] font-bold text-white shrink-0 mt-0.5">V</div>
                                        <div className="rounded-xl rounded-tl-sm bg-white px-3 py-2 text-sm shadow-sm dark:bg-[#1E1E1E]">
                                            Your sales today: <strong>₱15,420</strong> with <strong>42 transactions</strong>. Average sale is ₱367. Best seller is <strong>Coke 1.5L</strong>. Low stock alert: 5 products need reordering.
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 justify-end">
                                        <div className="rounded-xl rounded-tr-sm bg-[#243F14] px-3 py-2 text-sm text-white shadow-sm">
                                            Show low stock items
                                        </div>
                                        <div className="flex size-6 items-center justify-center rounded-full bg-[#243F14]/10 text-[10px] font-bold shrink-0 mt-0.5 text-[#243F14]">M</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20">
                    <div className="mx-auto max-w-6xl px-4 text-center">
                        <h2 className="text-2xl font-bold text-[#1A1A1A] dark:text-[#EDEDED]">Ready to digitize your store?</h2>
                        <p className="mt-2 text-[#6B7280] dark:text-[#9CA3AF]">Get started in minutes. No credit card required.</p>
                        <div className="mt-6 flex items-center justify-center gap-3">
                            <Link href={login()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#243F14] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1A330E] transition-colors">
                                Get Started <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-[#E5E4E0] py-8 dark:border-[#333]">
                    <div className="mx-auto max-w-6xl px-4 text-center text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                        <p>&copy; {new Date().getFullYear()} Vendora POS. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
