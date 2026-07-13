<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\AuditService;
use App\Services\BarcodeGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Picqer\Barcode\BarcodeGeneratorSVG;

class BarcodeController extends Controller
{
    public function __construct(
        protected BarcodeGenerationService $barcodeService,
    ) {}

    public function index(Request $request): Response
    {
        $products = Product::select('id', 'name', 'sku', 'barcode', 'barcode_type', 'selling_price', 'is_active')
            ->when($request->search, fn ($q, $v) => $q->where(function ($q) use ($v) {
                $q->where('name', 'like', "%{$v}%")
                    ->orWhere('sku', 'like', "%{$v}%")
                    ->orWhere('barcode', 'like', "%{$v}%");
            }))
            ->when($request->barcode_status === 'missing', fn ($q) => $q->whereNull('barcode')->orWhere('barcode', ''))
            ->when($request->barcode_status === 'has', fn ($q) => $q->whereNotNull('barcode')->where('barcode', '!=', ''))
            ->when($request->barcode_type, fn ($q, $v) => $q->where('barcode_type', $v))
            ->orderBy($request->sort ?? 'name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('barcodes/index', [
            'products' => $products,
            'stats' => $this->barcodeService->getStats(),
            'filters' => $request->only(['search', 'barcode_status', 'barcode_type', 'sort']),
        ]);
    }

    public function generateForProduct(Request $request, Product $product): JsonResponse
    {
        $barcode = $this->barcodeService->generateForProduct($product, true);

        AuditService::log('barcode_generated', 'product', $product, null, ['barcode' => $barcode], "Barcode generated for {$product->name}: {$barcode}");

        return response()->json(['barcode' => $barcode]);
    }

    public function generateMissing(Request $request): JsonResponse
    {
        $result = $this->barcodeService->generateMissing();

        if ($result['generated'] > 0) {
            AuditService::log('bulk_barcode_generation', 'product', null, null, $result, "Bulk barcode generation: {$result['generated']} generated, {$result['failed']} failed");
        }

        return response()->json($result);
    }

    public function generateSelected(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_ids' => ['required', 'array'],
            'product_ids.*' => ['exists:products,id'],
            'overwrite' => ['boolean'],
        ]);

        $result = $this->barcodeService->generateForProductIds($validated['product_ids'], $validated['overwrite'] ?? false);

        return response()->json($result);
    }

    public function preview(Product $product): JsonResponse
    {
        return response()->json([
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'barcode_type' => $product->barcode_type,
            'selling_price' => (float) $product->selling_price,
        ]);
    }

    public function print(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_ids' => ['required', 'array', 'min:1'],
            'product_ids.*' => ['exists:products,id'],
            'copies' => ['integer', 'min:1', 'max:100'],
            'template' => ['string', 'in:small_label,price_tag,shelf_tag'],
            'show_name' => ['boolean'],
            'show_sku' => ['boolean'],
            'show_price' => ['boolean'],
            'show_barcode_number' => ['boolean'],
        ]);

        $products = Product::whereIn('id', $validated['product_ids'])->get();
        $copies = $validated['copies'] ?? 1;

        $barcodeGenerator = new BarcodeGeneratorSVG;

        $html = view('barcodes.print', [
            'products' => $products,
            'copies' => $copies,
            'template' => $validated['template'] ?? 'small_label',
            'showName' => $validated['show_name'] ?? true,
            'showSku' => $validated['show_sku'] ?? true,
            'showPrice' => $validated['show_price'] ?? true,
            'showBarcodeNumber' => $validated['show_barcode_number'] ?? true,
            'barcodeGenerator' => $barcodeGenerator,
        ])->render();

        AuditService::log('labels_printed', 'product', null, null, [
            'product_ids' => $validated['product_ids'],
            'copies' => $copies,
            'template' => $validated['template'] ?? 'small_label',
        ], 'Labels printed for '.count($products).' products');

        return response()->json(['html' => $html]);
    }

    public function updateType(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'barcode_type' => ['required', 'string', 'in:code128,ean13,upca,qr'],
        ]);

        $product->update(['barcode_type' => $validated['barcode_type']]);

        return response()->json(['barcode_type' => $product->barcode_type]);
    }

    public function duplicates(): JsonResponse
    {
        $duplicates = $this->barcodeService->findDuplicates();

        return response()->json(['duplicates' => $duplicates]);
    }
}
