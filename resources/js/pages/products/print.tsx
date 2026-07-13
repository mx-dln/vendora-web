import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import type { Product } from '@/types';

interface Props {
    products: Product[];
    filters: Record<string, string | undefined>;
}

export default function ProductsPrint({ products }: Props) {
    useEffect(() => {
        setTimeout(() => window.print(), 500);
    }, []);

    const formatCurrency = (amount: number | string) => `₱${Number(amount).toFixed(2)}`;

    return (
        <>
            <Head title="Product List" />
            <div className="p-6 print:p-0" style={{ color: '#000' }}>
                <div className="text-center mb-6" style={{ color: '#000' }}>
                    <img src="/brand/logo-light.png" alt="Vendora" className="mx-auto mb-2 h-8 w-auto" />
                    <h1 className="text-xl font-bold" style={{ color: '#000' }}>Product List</h1>
                    <p className="text-sm" style={{ color: '#000' }}>{new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })}</p>
                </div>

                <table className="w-full text-sm border-collapse" style={{ color: '#000' }}>
                    <thead>
                        <tr className="border-b-2 border-black" style={{ color: '#000' }}>
                            <th className="py-2 text-left font-bold w-10" style={{ color: '#000' }}>#</th>
                            <th className="py-2 text-left font-bold" style={{ color: '#000' }}>Name</th>
                            <th className="py-2 text-left font-bold" style={{ color: '#000' }}>SKU</th>
                            <th className="py-2 text-left font-bold" style={{ color: '#000' }}>Category</th>
                            <th className="py-2 text-right font-bold" style={{ color: '#000' }}>Price</th>
                            <th className="py-2 text-right font-bold" style={{ color: '#000' }}>Stock</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product, i) => (
                            <tr key={product.id} className="border-b border-gray-300" style={{ color: '#000' }}>
                                <td className="py-1.5" style={{ color: '#000' }}>{i + 1}.</td>
                                <td className="py-1.5" style={{ color: '#000' }}>{product.name}</td>
                                <td className="py-1.5" style={{ color: '#000' }}>{product.sku || '-'}</td>
                                <td className="py-1.5" style={{ color: '#000' }}>{product.category?.name || '-'}</td>
                                <td className="py-1.5 text-right" style={{ color: '#000' }}>{formatCurrency(product.selling_price)}</td>
                                <td className="py-1.5 text-right" style={{ color: '#000' }}>{product.stock_quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {products.length === 0 && (
                    <p className="py-8 text-center" style={{ color: '#000' }}>No products found.</p>
                )}

                <div className="mt-6 text-center text-xs" style={{ color: '#000' }}>
                    <p style={{ color: '#000' }}>Vendora POS System · Generated {new Date().toLocaleString('en-PH')}</p>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 10mm; size: A4 portrait; }
                    body, .p-6, * { background: white !important; color: black !important; }
                    .text-muted-foreground { color: black !important; }
                }
            `}</style>
        </>
    );
}
