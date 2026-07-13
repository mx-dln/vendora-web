import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import type { Product, InventoryMovement } from '@/types';

interface Props {
    product: Product;
    movements: InventoryMovement[];
}

export default function InventoryPrintHistory({ product, movements }: Props) {
    useEffect(() => {
        setTimeout(() => window.print(), 500);
    }, []);

    return (
        <>
            <Head title={`${product.name} - Stock History`} />
            <div className="p-6 print:p-0" style={{ color: '#000' }}>
                <div className="text-center mb-6" style={{ color: '#000' }}>
                    <img src="/brand/logo-light.png" alt="Vendora" className="mx-auto mb-2 h-8 w-auto" />
                    <h1 className="text-xl font-bold" style={{ color: '#000' }}>Stock History</h1>
                    <p className="text-sm font-medium" style={{ color: '#000' }}>{product.name}</p>
                    <p className="text-xs" style={{ color: '#000' }}>SKU: {product.sku || 'N/A'} · Current Stock: {product.stock_quantity}</p>
                    <p className="text-xs" style={{ color: '#000' }}>{new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })}</p>
                </div>

                <table className="w-full text-sm border-collapse" style={{ color: '#000' }}>
                    <thead>
                        <tr className="border-b-2 border-black" style={{ color: '#000' }}>
                            <th className="py-2 text-left font-bold" style={{ color: '#000' }}>Date</th>
                            <th className="py-2 text-left font-bold" style={{ color: '#000' }}>Type</th>
                            <th className="py-2 text-right font-bold" style={{ color: '#000' }}>Qty</th>
                            <th className="py-2 text-right font-bold" style={{ color: '#000' }}>Before</th>
                            <th className="py-2 text-right font-bold" style={{ color: '#000' }}>After</th>
                            <th className="py-2 text-left font-bold" style={{ color: '#000' }}>User</th>
                            <th className="py-2 text-left font-bold" style={{ color: '#000' }}>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movements.map(m => (
                            <tr key={m.id} className="border-b border-gray-300" style={{ color: '#000' }}>
                                <td className="py-1.5" style={{ color: '#000' }}>{new Date(m.created_at).toLocaleString()}</td>
                                <td className="py-1.5 capitalize" style={{ color: '#000' }}>{m.type.replace('_', ' ')}</td>
                                <td className="py-1.5 text-right font-medium" style={{ color: '#000' }}>{m.quantity}</td>
                                <td className="py-1.5 text-right" style={{ color: '#000' }}>{m.quantity_before}</td>
                                <td className="py-1.5 text-right" style={{ color: '#000' }}>{m.quantity_after}</td>
                                <td className="py-1.5" style={{ color: '#000' }}>{m.user?.name || 'System'}</td>
                                <td className="py-1.5" style={{ color: '#000' }}>{m.notes || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {movements.length === 0 && (
                    <p className="py-8 text-center" style={{ color: '#000' }}>No stock movements recorded.</p>
                )}

                <div className="mt-6 text-center text-xs" style={{ color: '#000' }}>
                    <p style={{ color: '#000' }}>Vendora POS System · Generated {new Date().toLocaleString('en-PH')}</p>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 10mm; size: A4 portrait; }
                    body, * { background: white !important; color: black !important; }
                }
            `}</style>
        </>
    );
}
