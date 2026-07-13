import { useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';

interface LabelProduct extends Product {
    barcode_data?: string;
    qr_data?: string;
}

interface Props {
    products: LabelProduct[];
    copies: number;
    barcode_type: string;
    template?: { width: string; height: string; font_size: string };
}

export default function BarcodesPrint({ products, copies, barcode_type, template }: Props) {
    const printRef = useRef<HTMLDivElement>(null);
    const hasTriggered = useRef(false);

    useEffect(() => {
        if (!hasTriggered.current) {
            hasTriggered.current = true;
            setTimeout(() => window.print(), 500);
        }
    }, []);

    const labelWidth = template?.width || '2';
    const labelHeight = template?.height || '1';
    const fontSize = template?.font_size || '8';

    function generateBarcodeSvg(code: string): string {
        const chars = code.split('');
        const barWidth = 1.5;
        const height = 40;
        let bars = '';
        let isBar = true;
        for (const c of chars) {
            const width = (c.charCodeAt(0) % 3 + 1) * barWidth;
            if (isBar) {
                bars += `<rect x="0" y="0" width="${width}" height="${height}" fill="black" />`;
            }
            bars += `<rect x="0" y="0" width="0" />`;
            isBar = !isBar;
        }
        return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${chars.length * barWidth * 2}" height="${height}">${bars}</svg>`)}`;
    }

    function generateQrSvg(data: string): string {
        return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" fill="white"/><text x="12" y="30" font-size="8" fill="black">${data}</text></svg>`)}`;
    }

    const allLabels: LabelProduct[] = [];
    for (let i = 0; i < copies; i++) {
        for (const p of products) {
            allLabels.push({
                ...p,
                barcode_data: generateBarcodeSvg(p.barcode || p.sku || p.id.toString()),
                qr_data: generateQrSvg(p.barcode || p.sku || p.id.toString()),
            });
        }
    }

    return (
        <>
            <Head title="Print Barcodes" />
            <div className="no-print fixed right-4 top-4 z-50 flex gap-2">
                <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="mr-1 size-4" />
                    Print
                </Button>
            </div>

            <div ref={printRef} className="barcode-print-area p-4">
                <style>{`
                    @page {
                        size: ${labelWidth}in ${labelHeight}in;
                        margin: 0.1in;
                    }
                    @media print {
                        body { margin: 0; padding: 0; }
                        .no-print { display: none !important; }
                        .barcode-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(${labelWidth}in, 1fr)); gap: 0.05in; }
                        .barcode-label { width: ${labelWidth}in; height: ${labelHeight}in; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; page-break-inside: avoid; padding: 2px; box-sizing: border-box; }
                    }
                    .barcode-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 4px; }
                    .barcode-label { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border: 1px dashed #ddd; padding: 4px; }
                `}</style>
                <div className="barcode-grid">
                    {allLabels.length === 0 && (
                        <p className="col-span-full py-16 text-center text-muted-foreground">No labels to print</p>
                    )}
                    {allLabels.map((label, idx) => (
                        <div key={`${label.id}-${idx}`} className="barcode-label" style={{ fontSize: `${fontSize}pt` }}>
                            <p className="font-semibold truncate w-full" style={{ fontSize: `${parseInt(fontSize) + 2}pt` }}>
                                {label.name}
                            </p>
                            <p className="text-muted-foreground" style={{ fontSize: `${fontSize}pt` }}>
                                ₱{Number(label.selling_price).toFixed(2)}
                            </p>
                            {barcode_type === 'qr' ? (
                                <img src={label.qr_data} alt="QR" className="my-1" style={{ width: '50px', height: '50px' }} />
                            ) : (
                                <img src={label.barcode_data} alt="Barcode" className="my-1" style={{ maxWidth: '90%', height: 'auto' }} />
                            )}
                            <p style={{ fontSize: `${parseInt(fontSize) - 1}pt` }} className="text-muted-foreground">
                                {label.barcode || label.sku || ''}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

BarcodesPrint.layout = {
    breadcrumbs: [
        { title: 'Barcode & Labels', href: '' },
        { title: 'Print', href: '' },
    ],
};
