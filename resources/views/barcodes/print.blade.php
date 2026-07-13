<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Barcode Labels</title>
    <style>
        @page { margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Courier New', monospace; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .page { padding: 6px; }
        .labels { display: flex; flex-wrap: wrap; gap: 2px; }
        @if ($template === '40x30')
        .label { width: 40mm; height: 30mm; border: 0.5px dashed #ccc; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2px; text-align: center; page-break-inside: avoid; }
        .label .name { font-size: 6px; font-weight: bold; line-height: 1.1; }
        .label .price { font-size: 9px; font-weight: bold; }
        .label svg { max-width: 90%; height: 14px; }
        .barcode-number { font-size: 5px; letter-spacing: 0.3px; }
        @elseif ($template === 'price_tag')
        .label { width: 50mm; height: 30mm; border: 0.5px dashed #ccc; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3px; text-align: center; page-break-inside: avoid; }
        .label .name { font-size: 8px; font-weight: bold; }
        .label .price { font-size: 18px; font-weight: bold; margin: 2px 0; }
        .label svg { max-width: 85%; height: 16px; }
        .barcode-number { font-size: 6px; }
        @elseif ($template === 'shelf_label')
        .label { width: 100mm; height: 40mm; border: 0.5px dashed #ccc; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px; text-align: center; page-break-inside: avoid; }
        .label .name { font-size: 14px; font-weight: bold; }
        .label .price { font-size: 20px; font-weight: bold; margin: 3px 0; }
        .label svg { max-width: 80%; height: 24px; }
        .barcode-number { font-size: 8px; }
        @elseif ($template === 'thermal_58')
        .label { width: 58mm; border-bottom: 1px dashed #ccc; padding: 4px 2px; text-align: center; page-break-inside: avoid; }
        .label .name { font-size: 9px; font-weight: bold; }
        .label .price { font-size: 14px; font-weight: bold; margin: 2px 0; }
        .label svg { max-width: 100%; height: 20px; }
        .barcode-number { font-size: 7px; }
        @elseif ($template === 'thermal_80')
        .label { width: 80mm; border-bottom: 1px dashed #ccc; padding: 6px 4px; text-align: center; page-break-inside: avoid; }
        .label .name { font-size: 11px; font-weight: bold; }
        .label .price { font-size: 16px; font-weight: bold; margin: 2px 0; }
        .label svg { max-width: 100%; height: 24px; }
        .barcode-number { font-size: 8px; }
        @else
        .label { width: 2.25in; border: 0.5px dashed #ccc; padding: 4px; text-align: center; page-break-inside: avoid; display: flex; flex-direction: column; align-items: center; }
        .label .name { font-size: 8px; font-weight: bold; }
        .label .price { font-size: 13px; font-weight: bold; margin: 1px 0; }
        .label svg { max-width: 100%; height: 16px; }
        .barcode-number { font-size: 6px; }
        @endif
        .label .sku { font-size: 7px; color: #666; }
    </style>
</head>
<body>
    <div class="page">
        <div class="labels">
            @foreach ($products as $product)
                @for ($i = 0; $i < $copies; $i++)
                    <div class="label">
                        @if ($showName ?? true)
                            <div class="name">{{ $product->name }}</div>
                        @endif
                        @if ($showSku ?? true && $product->sku)
                            <div class="sku">{{ $product->sku }}</div>
                        @endif
                        @if ($showPrice ?? true)
                            <div class="price">₱{{ number_format($product->selling_price, 2) }}</div>
                        @endif
                        @if ($product->barcode)
                            @php
                                $typeMap = ['code128' => 'C128', 'ean13' => 'EAN13', 'upca' => 'UPCA', 'qr' => 'QR'];
                                $barcodeType = $typeMap[$product->barcode_type ?? 'code128'] ?? 'C128';
                                $factor = str_contains($template, 'thermal') ? 2 : 1.5;
                                $height = str_contains($template, 'thermal') ? 30 : 25;
                                $svg = $barcodeGenerator->getBarcode($product->barcode, $barcodeType, $factor, $height);
                            @endphp
                            <div>{!! $svg !!}</div>
                            @if ($showBarcodeNumber ?? true)
                                <div class="barcode-number">{{ $product->barcode }}</div>
                            @endif
                        @endif
                    </div>
                @endfor
            @endforeach
        </div>
    </div>
</body>
</html>
