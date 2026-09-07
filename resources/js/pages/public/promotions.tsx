import { Head, Link, usePage } from '@inertiajs/react';
import { Percent, Gift, Calendar } from 'lucide-react';

import { ShopShell } from '@/components/public/shop-shell';

export default function PublicPromotions() {
    const props = usePage().props as any;
    const promotions = props.promotions || {
        data: [],
        current_page: 1,
        last_page: 1,
    };
    const store = props.store || { name: 'Store' };
    const onlineOrderingEnabled = Boolean(store.online_ordering_enabled);

    return (
        <ShopShell>
            <Head title={`Promotions — ${store.name}`} />
            <div className="border-b border-stone-200 bg-white dark:border-white/10 dark:bg-neutral-950">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold tracking-wide text-[#243F14] uppercase dark:text-stone-300">
                        <Gift className="size-3.5" />
                        Store deals
                    </p>
                    <h1 className="text-3xl font-black text-stone-950 sm:text-4xl dark:text-white">
                        Promotions
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-stone-500 dark:text-stone-400">
                        Current active offers
                        {onlineOrderingEnabled
                            ? ' for online shoppers and in-store pickup.'
                            : ' available in store.'}
                    </p>
                </div>
            </div>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {promotions.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white py-20 text-center dark:border-white/15 dark:bg-neutral-900">
                        <Gift className="mb-3 size-12 text-stone-300 dark:text-stone-700" />
                        <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
                            No active promotions right now
                        </p>
                        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                            Check back later for new offers.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {promotions.data.map((promo: any) => (
                            <div
                                key={promo.id}
                                className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition hover:border-stone-300 dark:border-white/10 dark:bg-neutral-900 dark:hover:border-white/20"
                            >
                                <div className="border-b border-stone-200 px-5 py-5 dark:border-white/10">
                                    <div className="inline-flex items-center gap-1 rounded-full bg-[#243F14]/10 px-2.5 py-1 text-xs font-bold text-[#243F14] dark:bg-white/10 dark:text-stone-100">
                                        <Percent className="size-3" />
                                        {promo.type === 'percentage'
                                            ? `${promo.discount_value}% OFF`
                                            : promo.type === 'fixed'
                                              ? `₱${promo.discount_value} OFF`
                                              : promo.type === 'buy_x_get_y'
                                                ? `Buy ${promo.buy_quantity} Get ${promo.get_quantity}`
                                                : promo.type}
                                    </div>
                                    <h3 className="mt-3 text-lg font-black text-stone-950 dark:text-white">
                                        {promo.name}
                                    </h3>
                                </div>
                                <div className="p-5">
                                    {promo.description && (
                                        <p className="mb-4 text-sm leading-6 text-stone-600 dark:text-stone-300">
                                            {promo.description}
                                        </p>
                                    )}
                                    <div className="space-y-2 text-xs font-medium text-stone-500 dark:text-stone-400">
                                        {promo.category && (
                                            <p className="flex items-center gap-1.5">
                                                <Percent className="size-3" />{' '}
                                                Category: {promo.category.name}
                                            </p>
                                        )}
                                        {promo.product && (
                                            <p className="flex items-center gap-1.5">
                                                <Percent className="size-3" />{' '}
                                                Product: {promo.product.name}
                                            </p>
                                        )}
                                        {promo.end_date && (
                                            <p className="flex items-center gap-1.5">
                                                <Calendar className="size-3" />{' '}
                                                Until{' '}
                                                {new Date(
                                                    promo.end_date,
                                                ).toLocaleDateString('en-PH', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ShopShell>
    );
}
