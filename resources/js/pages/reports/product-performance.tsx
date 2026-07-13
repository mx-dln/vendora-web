import { Head, router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import reports from '@/routes/reports';
import type { ProductPerformanceItem } from '@/types';

interface Props {
    products: ProductPerformanceItem[];
    filters: Record<string, string | undefined>;
}

export default function ProductPerformance({ products, filters }: Props) {
    function applyFilter(key: string, value: string) {
        router.get(reports['product-performance'].url(), { ...filters, [key]: value });
    }

    return (
        <>
            <Head title="Product Performance" />
            <div className="flex flex-col gap-4 p-4">
                <PageHeader title="Product Performance" description="Top-selling products by revenue and profit" />

                <div className="flex gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">From</span>
                        <Input type="date" value={filters.start_date || ''} onChange={e => applyFilter('start_date', e.target.value)} className="w-40" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">To</span>
                        <Input type="date" value={filters.end_date || ''} onChange={e => applyFilter('end_date', e.target.value)} className="w-40" />
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left text-sm text-muted-foreground">
                                        <th className="p-3 font-medium">Product</th>
                                        <th className="p-3 font-medium text-right">Quantity</th>
                                        <th className="p-3 font-medium text-right">Revenue</th>
                                        <th className="p-3 font-medium text-right">Cost</th>
                                        <th className="p-3 font-medium text-right">Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.length === 0 ? (
                                        <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No data available for this period.</td></tr>
                                    ) : products.map((p, i) => (
                                        <tr key={p.product_id || i} className="border-b last:border-0">
                                            <td className="p-3 font-medium">{p.product_name}</td>
                                            <td className="p-3 text-right">{Number(p.total_quantity).toFixed(2)}</td>
                                            <td className="p-3 text-right">₱{Number(p.total_revenue).toFixed(2)}</td>
                                            <td className="p-3 text-right">₱{Number(p.total_cost).toFixed(2)}</td>
                                            <td className="p-3 text-right font-medium">₱{Number(p.total_profit).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ProductPerformance.layout = {
    breadcrumbs: [
        { title: 'Reports', href: reports.sales.url() },
        { title: 'Product Performance', href: reports['product-performance'].url() },
    ],
};
