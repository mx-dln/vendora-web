import { useState, useEffect, useCallback, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Search, Plus, X, Printer, Download, Barcode, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/page-header';
import JsBarcode from 'jsbarcode';
import type { Product } from '@/types';

interface Props {
    products: { data: Product[]; current_page: number; last_page: number; total: number };
    stats: { total: number; with_barcode: number; missing_barcode: number };
    filters: Record<string, string | undefined>;
}

interface SelectedProduct {
    id: number;
    name: string;
    sku: string;
    barcode: string;
    barcode_type: string;
    selling_price: number;
    quantity: number;
}

const barcodeTypeLabels: Record<string, string> = { code128: 'CODE128', ean13: 'EAN-13', upca: 'UPC-A', qr: 'QR' };
const barcodeTypeBadge: Record<string, string> = {
    code128: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ean13: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    upca: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    qr: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const jsBarcodeFormatMap: Record<string, string> = { code128: 'CODE128', ean13: 'EAN13', upca: 'UPC-A', qr: 'QR' };

const templates = [
    { value: '40x30', label: 'Standard (40 × 30 mm)' },
    { value: 'price_tag', label: 'Small Price Tag' },
    { value: 'shelf_label', label: 'Shelf Label' },
    { value: 'thermal_58', label: 'Thermal 58mm' },
    { value: 'thermal_80', label: 'Thermal 80mm' },
];

function getCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

function BarcodeSvg({ barcode, format, width = 200, height = 50 }: { barcode: string; format: string; width?: number; height?: number }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    useEffect(() => {
        if (svgRef.current && barcode) {
            try {
                svgRef.current.innerHTML = '';
                JsBarcode(svgRef.current, barcode, {
                    format: jsBarcodeFormatMap[format] || 'CODE128',
                    width: format === 'qr' ? 0 : 1.5,
                    height: format === 'qr' ? 50 : height,
                    displayValue: false,
                    background: isDark ? '#1e1e1e' : '#ffffff',
                    lineColor: isDark ? '#ffffff' : '#000000',
                    margin: 2,
                });
            } catch { }
        }
    }, [barcode, format, height, isDark]);

    return <svg ref={svgRef} className="max-w-full rounded" style={{ width, height: format === 'qr' ? 60 : height }} />;
}

export default function BarcodeIndex({ products: prods, stats, filters }: Props) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<Product[]>(prods.data);
    const [selected, setSelected] = useState<SelectedProduct[]>([]);
    const [template, setTemplate] = useState('40x30');
    const [showName, setShowName] = useState(true);
    const [showSku, setShowSku] = useState(true);
    const [showPrice, setShowPrice] = useState(true);
    const [generating, setGenerating] = useState(false);

    const searchProducts = useCallback(async (term: string) => {
        if (!term.trim()) { setResults(prods.data); return; }
        try {
            const res = await fetch(`/products?search=${encodeURIComponent(term)}&per_page=30`);
            const data = await res.json();
            setResults(data.data || []);
        } catch { setResults(prods.data); }
    }, [prods.data]);

    useEffect(() => {
        const timer = setTimeout(() => searchProducts(search), 300);
        return () => clearTimeout(timer);
    }, [search, searchProducts]);

    function toggleProduct(p: Product) {
        setSelected(prev => {
            const exists = prev.find(s => s.id === p.id);
            if (exists) return prev.filter(s => s.id !== p.id);
            return [...prev, {
                id: p.id, name: p.name, sku: p.sku || '',
                barcode: String(p.barcode || ''),
                barcode_type: p.barcode_type || 'code128',
                selling_price: Number(p.selling_price), quantity: 1,
            }];
        });
    }

    function updateQty(id: number, qty: number) {
        setSelected(prev => prev.map(s => s.id === id ? { ...s, quantity: Math.max(1, qty) } : s));
    }

    function removeSelected(id: number) {
        setSelected(prev => prev.filter(s => s.id !== id));
    }

    const totalLabels = selected.reduce((sum, s) => sum + s.quantity, 0);

    async function handlePrint() {
        if (selected.length === 0) { toast.error('Select at least one product'); return; }
        renderPrintWindow(false);
    }

    async function handleExportPdf() {
        if (selected.length === 0) { toast.error('Select at least one product'); return; }
        renderPrintWindow(true);
    }

    function renderPrintWindow(autoPrint: boolean) {
        const w = window.open('', '_blank');
        if (!w) { toast.error('Popup blocked'); return; }

        let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Barcode Labels</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js"><\/script>
        <style>
        @page { margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Courier New', monospace; -webkit-print-color-adjust: exact; }
        .labels { display: flex; flex-wrap: wrap; gap: 2px; padding: 4px; }
        .label { display: flex; flex-direction: column; align-items: center; text-align: center; page-break-inside: avoid; border: 0.5px dashed #ccc; padding: 3px; }
        .label .name { font-size: 8px; font-weight: bold; }
        .label .sku { font-size: 7px; color: #666; }
        .label .price { font-size: 12px; font-weight: bold; margin: 1px 0; }
        .label .barcode-num { font-size: 6px; letter-spacing: 0.5px; margin-top: 1px; }
        .label svg { display: block; max-width: 100%; }`;

        let labelW = '2.25in';
        if (template === '40x30') { labelW = '40mm'; html += `.label { width: 40mm; min-height: 30mm; } .label .name { font-size: 6px; } .label .price { font-size: 9px; } .label svg { max-width: 95%; height: 14px; }`; }
        else if (template === 'price_tag') { labelW = '50mm'; html += `.label { width: 50mm; min-height: 30mm; } .label .name { font-size: 8px; } .label .price { font-size: 18px; } .label svg { max-width: 90%; height: 16px; }`; }
        else if (template === 'shelf_label') { labelW = '100mm'; html += `.label { width: 100mm; min-height: 40mm; } .label .name { font-size: 14px; } .label .price { font-size: 20px; } .label svg { max-width: 85%; height: 24px; }`; }
        else if (template === 'thermal_58') { labelW = '58mm'; html += `.label { width: 58mm; border-bottom: 1px dashed #ccc; } .label .name { font-size: 9px; } .label .price { font-size: 14px; } .label svg { max-width: 100%; height: 20px; }`; }
        else if (template === 'thermal_80') { labelW = '80mm'; html += `.label { width: 80mm; border-bottom: 1px dashed #ccc; } .label .name { font-size: 11px; } .label .price { font-size: 16px; } .label svg { max-width: 100%; height: 24px; }`; }
        else { html += `.label { width: ${labelW}; }`; }

        html += `</style></head><body><div class="labels">`;

        selected.forEach(s => {
            const fmt = jsBarcodeFormatMap[s.barcode_type] || 'CODE128';
            const count = Math.max(1, s.quantity || 1);
            for (let i = 0; i < count; i++) {
                html += `<div class="label">`;
                if (showName) html += `<div class="name">${escHtml(s.name)}</div>`;
                if (showSku && s.sku) html += `<div class="sku">${escHtml(s.sku)}</div>`;
                if (showPrice) html += `<div class="price">₱${Number(s.selling_price).toFixed(2)}</div>`;
                if (s.barcode) {
                    html += `<svg id="b-${s.id}-${i}" class="barcode-svg"></svg>`;
                    html += `<div class="barcode-num">${String(s.barcode)}</div>`;
                }
                html += `</div>`;
            }
        });

        html += `</div><script>
        ${selected.map(s => {
            const fmt = jsBarcodeFormatMap[s.barcode_type] || 'CODE128';
            const count = Math.max(1, s.quantity || 1);
            return Array.from({ length: count }, (_, i) =>
                `try{JsBarcode("#b-${s.id}-${i}", "${escJs(String(s.barcode))}", {format:"${fmt}",width:${template.includes('thermal') ? 2 : 1.5},height:${template.includes('thermal') ? 30 : 25},displayValue:false,background:"#ffffff",lineColor:"#000000",margin:2});}catch(e){}`
            ).join('');
        }).join('')}
        ${autoPrint ? 'setTimeout(function(){window.print();},500);' : ''}
        <\/script></body></html>`;

        w.document.write(html);
        w.document.close();
    }

    function escHtml(s: string): string {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function escJs(s: string): string {
        return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    async function generateBarcode(productId: number) {
        try {
            const res = await fetch(`/barcodes/products/${productId}/generate`, { method: 'POST', headers: { 'X-CSRF-TOKEN': getCsrfToken() } });
            const data = await res.json();
            setSelected(prev => prev.map(s => s.id === productId ? { ...s, barcode: String(data.barcode) } : s));
            toast.success('Barcode generated');
            router.reload({ preserveScroll: true });
        } catch { toast.error('Failed to generate'); }
    }

    return (
        <>
            <Head title="Barcode Labels" />
            <div className="flex flex-col gap-4 p-6">
                <PageHeader title="Barcode Printing Center" description="Select products, configure labels, and print" />

                <div className="flex flex-col lg:flex-row gap-4 items-start">
                    {/* Left panel — Product Selection */}
                    <Card className="w-full lg:w-1/2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Barcode className="size-4" /> Product Selection
                            </CardTitle>
                            <div className="relative mt-2">
                                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input className="h-8 pl-8 text-xs" placeholder="Search by name, SKU, or barcode..." value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                            {results.length === 0 ? (
                                <p className="p-6 text-center text-sm text-muted-foreground">No products found.</p>
                            ) : (
                                <div className="divide-y">
                                    {results.map(p => {
                                        const isSelected = selected.some(s => s.id === p.id);
                                        return (
                                            <div key={p.id} className={`flex items-center gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : ''}`} onClick={() => toggleProduct(p)}>
                                                <input type="checkbox" checked={isSelected} onChange={() => toggleProduct(p)} className="rounded border-input accent-primary shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{p.name}</p>
                                                    <p className="text-xs text-muted-foreground">{p.sku || '—'}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    {p.barcode ? (
                                                        <Badge className={`text-[9px] font-mono ${barcodeTypeBadge[p.barcode_type || 'code128'] || 'bg-muted'}`}>
                                                            {barcodeTypeLabels[p.barcode_type || 'code128']}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[9px]">Missing</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right panel — Label Setup */}
                    <Card className="w-full lg:w-1/2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Label Setup</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Template</Label>
                                <Select value={template} onValueChange={setTemplate}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {templates.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            {selected.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">Select products from the left panel to start building your label batch.</p>
                            ) : (
                                <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                                    {selected.map(s => (
                                        <div key={s.id} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{s.name}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono">{s.barcode || 'No barcode'}</p>
                                            </div>
                                            <Input type="number" min="1" className="h-7 w-16 text-xs text-center" value={s.quantity} onChange={e => updateQty(s.id, parseInt(e.target.value) || 1)} />
                                            <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => removeSelected(s.id)}><X className="size-3" /></Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                                <span>Selected: {selected.length} products</span>
                                <span>Total labels: <strong>{totalLabels}</strong></span>
                            </div>

                            <Separator />

                            <div className="flex items-center gap-3 text-sm">
                                <label className="flex items-center gap-1.5"><Checkbox checked={showName} onCheckedChange={v => setShowName(!!v)} /><span className="text-xs">Name</span></label>
                                <label className="flex items-center gap-1.5"><Checkbox checked={showSku} onCheckedChange={v => setShowSku(!!v)} /><span className="text-xs">SKU</span></label>
                                <label className="flex items-center gap-1.5"><Checkbox checked={showPrice} onCheckedChange={v => setShowPrice(!!v)} /><span className="text-xs">Price</span></label>
                            </div>

                            <div className="flex gap-2">
                                <Button className="flex-1" onClick={handlePrint} disabled={selected.length === 0}>
                                    <Printer className="mr-1 size-4" /> Print
                                </Button>
                                <Button variant="outline" className="flex-1" onClick={handleExportPdf} disabled={selected.length === 0}>
                                    <Download className="mr-1 size-4" /> Export PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Live Preview */}
                <Card>
                    <CardHeader className="pb-2 flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold">Live Preview</CardTitle>
                        <span className="text-xs text-muted-foreground">
                            {templates.find(t => t.value === template)?.label || template}
                        </span>
                    </CardHeader>
                    <CardContent>
                        {selected.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">Select products to preview labels.</p>
                        ) : (
                            <div className={`flex flex-wrap gap-3 p-4 bg-muted/20 rounded-lg justify-center ${template === 'thermal_58' ? 'max-w-[58mm] mx-auto' : template === 'thermal_80' ? 'max-w-[80mm] mx-auto' : ''}`}>
                                {selected.flatMap(s => Array.from({ length: Math.min(s.quantity, 2) }).map((_, i) => (
                                    <div key={`${s.id}-${i}`}
                                        className="bg-white dark:bg-black rounded border p-2 flex flex-col items-center gap-1"
                                        style={template === '40x30' ? { width: '110px' } : template === 'price_tag' ? { width: '130px' } : template === 'shelf_label' ? { width: '220px' } : template === 'thermal_58' ? { width: '100%' } : { width: '150px' }}>
                                        {showName && <p className="text-[9px] font-bold text-center leading-tight w-full truncate">{s.name}</p>}
                                        {showSku && s.sku && <p className="text-[7px] text-muted-foreground w-full truncate text-center">{s.sku}</p>}
                                        {showPrice && <p className="text-sm font-bold">₱{Number(s.selling_price).toFixed(2)}</p>}
                                        {s.barcode ? (
                                            <div className="flex flex-col items-center gap-0.5 w-full">
                                                <BarcodeSvg barcode={String(s.barcode)} format={s.barcode_type} width={template.includes('thermal') ? 180 : 160} height={template.includes('thermal') ? 30 : 22} />
                                                <span className="text-[6px] font-mono text-muted-foreground tracking-wider">{String(s.barcode)}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 py-2">
                                                <p className="text-[8px] text-muted-foreground">No barcode</p>
                                                <Button variant="outline" size="sm" className="h-6 text-[9px]" onClick={() => generateBarcode(s.id)}>
                                                    <Barcode className="mr-1 size-2.5" /> Generate
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )))}
                                {totalLabels > 2 && <p className="w-full text-center text-[10px] text-muted-foreground pt-1">+{totalLabels - 2} more labels</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

BarcodeIndex.layout = {
    breadcrumbs: [{ title: 'Barcode Labels', href: '/barcodes' }],
};
