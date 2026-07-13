import { Head, Link, usePage } from '@inertiajs/react';
import { Percent, Gift, Calendar } from 'lucide-react';

export default function PublicPromotions() {
    const props = usePage().props as any;
    const promotions = props.promotions || { data: [], current_page: 1, last_page: 1 };
    const store = props.store || { name: 'Store' };

    return (
        <div className="min-h-screen bg-[#F5F3EE] dark:bg-[#121212]">
            <Head title={`Promotions — ${store.name}`} />
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
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[#1A1A1A] dark:text-[#EDEDED]">Promotions</h1>
                    <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">Current active offers and discounts</p>
                </div>
                {promotions.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Gift className="size-12 text-[#9CA3AF]/40 mb-3" />
                        <p className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF]">No active promotions right now</p>
                        <p className="text-xs text-[#9CA3AF] mt-1">Check back later for new offers</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {promotions.data.map((promo: any) => (
                            <div key={promo.id} className="rounded-xl border bg-white overflow-hidden dark:bg-[#1E1E1E] dark:border-[#333]">
                                <div className="bg-gradient-to-r from-[#243F14] to-[#1A330E] px-5 py-4">
                                    <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
                                        <Percent className="size-3" />
                                        {promo.type === 'percentage' ? `${promo.discount_value}% OFF` : promo.type === 'fixed' ? `₱${promo.discount_value} OFF` : promo.type === 'buy_x_get_y' ? `Buy ${promo.buy_quantity} Get ${promo.get_quantity}` : promo.type}
                                    </div>
                                    <h3 className="text-lg font-bold text-white mt-2">{promo.name}</h3>
                                </div>
                                <div className="p-4">
                                    {promo.description && <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mb-3">{promo.description}</p>}
                                    <div className="space-y-1.5 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                        {promo.category && <p className="flex items-center gap-1.5"><Percent className="size-3" /> Category: {promo.category.name}</p>}
                                        {promo.product && <p className="flex items-center gap-1.5"><Percent className="size-3" /> Product: {promo.product.name}</p>}
                                        {promo.end_date && <p className="flex items-center gap-1.5"><Calendar className="size-3" /> Until {new Date(promo.end_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
