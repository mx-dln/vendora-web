<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Services\AuditService;
use App\Services\BarcodeGenerationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::with('category')
            ->when($request->search, fn ($q, $v) => $q->where(function ($q) use ($v) {
                $q->where('name', 'like', "%{$v}%")
                    ->orWhere('sku', 'like', "%{$v}%")
                    ->orWhere('barcode', 'like', "%{$v}%");
            }))
            ->when($request->category_id, fn ($q, $v) => $q->where('category_id', $v))
            ->when($request->status === 'active', fn ($q) => $q->active())
            ->when($request->status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->when($request->status === 'low_stock', fn ($q) => $q->lowStock())
            ->when($request->status === 'out_of_stock', fn ($q) => $q->outOfStock())
            ->orderBy($request->sort ?? 'name', $request->order ?? 'asc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('products/index', [
            'products' => $products,
            'categories' => Category::active()->orderBy('name')->get(),
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'category_id', 'status', 'sort', 'order']),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('products', 'public');
        } elseif ($request->filled('image_url')) {
            $data['image'] = $this->downloadImage($request->input('image_url'), 'products');
        }

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        // Auto-generate barcode if empty
        if (empty($data['barcode'])) {
            $data['barcode'] = app(BarcodeGenerationService::class)->generateBarcode();
            session()->flash('barcode_auto_generated', true);
        }

        if (! isset($data['status'])) {
            $data['status'] = 'active';
        }

        $product = Product::create($data);

        AuditService::log('created', 'product', $product, null, $data, "Created product: {$product->name}");

        return redirect()->route('products.index')
            ->with('success', 'Product created successfully.');
    }

    public function update(StoreProductRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('products', 'public');
        } elseif ($request->filled('image_url')) {
            $data['image'] = $this->downloadImage($request->input('image_url'), 'products');
        }

        // Regenerate barcode only if explicitly requested
        if (! empty($data['regenerate_barcode'])) {
            $data['barcode'] = app(BarcodeGenerationService::class)->generateBarcode();
        }

        $oldData = $product->toArray();
        $product->update($data);
        AuditService::log('updated', 'product', $product, $oldData, $product->fresh()->toArray(), "Updated product: {$product->name}");

        return redirect()->route('products.index')
            ->with('success', 'Product updated successfully.');
    }

    private function downloadImage(string $url, string $path): ?string
    {
        try {
            $contents = @file_get_contents($url);
            if ($contents === false) {
                return null;
            }
            $ext = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION);
            $ext = in_array(strtolower($ext), ['jpg', 'jpeg', 'png', 'gif', 'webp']) ? $ext : 'jpg';
            $filename = 'product_'.time().'_'.uniqid().'.'.$ext;
            Storage::disk('public')->put($path.'/'.$filename, $contents);

            return $path.'/'.$filename;
        } catch (\Exception $e) {
            Log::warning('Failed to download image: '.$e->getMessage());

            return null;
        }
    }

    public function destroy(Product $product): RedirectResponse
    {
        AuditService::log('deleted', 'product', $product, $product->toArray(), null, "Deleted product: {$product->name}");
        $product->delete();

        return redirect()->route('products.index')
            ->with('success', 'Product deleted successfully.');
    }

    public function exportCsv(Request $request)
    {
        $products = Product::with('category')
            ->when($request->search, fn ($q, $v) => $q->where(function ($q) use ($v) {
                $q->where('name', 'like', "%{$v}%")->orWhere('sku', 'like', "%{$v}%");
            }))
            ->orderBy('name')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="products-'.now()->format('Y-m-d').'.csv"',
        ];

        $callback = function () use ($products) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Name', 'SKU', 'Barcode', 'Category', 'Cost Price', 'Selling Price', 'Stock', 'Low Stock Threshold', 'Unit', 'Active']);

            foreach ($products as $product) {
                fputcsv($handle, [
                    $product->name,
                    $product->sku,
                    $product->barcode,
                    $product->category?->name ?? '',
                    $product->cost_price,
                    $product->selling_price,
                    $product->stock_quantity,
                    $product->low_stock_threshold,
                    $product->unit,
                    $product->is_active ? 'Yes' : 'No',
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function importCsv(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        $header = fgetcsv($handle);
        $header = array_map('trim', $header);

        $imported = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($header, $row);

            if (empty($data['Name'])) {
                $skipped++;

                continue;
            }

            $category = null;
            if (! empty($data['Category'])) {
                $category = Category::firstOrCreate(
                    ['name' => $data['Category']],
                    ['slug' => Str::slug($data['Category'])]
                );
            }

            $name = trim($data['Name']);
            $sku = ! empty($data['SKU']) ? trim($data['SKU']) : null;
            $barcode = ! empty($data['Barcode']) ? trim($data['Barcode']) : null;

            if ($sku && Product::where('sku', $sku)->exists()) {
                $skipped++;

                continue;
            }

            if ($barcode && Product::where('barcode', $barcode)->exists()) {
                $skipped++;

                continue;
            }

            Product::create([
                'name' => $name,
                'slug' => Str::slug($name).'-'.Str::random(4),
                'sku' => $sku,
                'barcode' => $barcode,
                'category_id' => $category?->id,
                'cost_price' => (float) ($data['Cost Price'] ?? 0),
                'selling_price' => (float) ($data['Selling Price'] ?? 0),
                'stock_quantity' => (int) ($data['Stock'] ?? 0),
                'low_stock_threshold' => (int) ($data['Low Stock Threshold'] ?? 5),
                'unit' => $data['Unit'] ?? 'piece',
                'is_active' => ($data['Active'] ?? 'Yes') === 'Yes',
            ]);

            $imported++;
        }

        fclose($handle);

        return redirect()->route('products.index')
            ->with('success', "Imported {$imported} products. Skipped {$skipped} rows.");
    }

    public function printPdf(Request $request): Response
    {
        $products = Product::with('category')
            ->when($request->search, fn ($q, $v) => $q->where(function ($q) use ($v) {
                $q->where('name', 'like', "%{$v}%")
                    ->orWhere('sku', 'like', "%{$v}%")
                    ->orWhere('barcode', 'like', "%{$v}%");
            }))
            ->when($request->category_id, fn ($q, $v) => $q->where('category_id', $v))
            ->when($request->status === 'active', fn ($q) => $q->active())
            ->when($request->status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->when($request->status === 'low_stock', fn ($q) => $q->lowStock())
            ->when($request->status === 'out_of_stock', fn ($q) => $q->outOfStock())
            ->orderBy($request->sort ?? 'name', $request->order ?? 'asc')
            ->get();

        return Inertia::render('products/print', [
            'products' => $products,
            'filters' => $request->only(['search', 'category_id', 'status', 'sort', 'order']),
        ]);
    }
}
