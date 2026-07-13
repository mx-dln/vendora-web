<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\DB;

class BarcodeGenerationService
{
    public function generateBarcode(): string
    {
        $prefix = 'VDR';
        $lastBarcode = Product::where('barcode', 'like', "{$prefix}%")
            ->orderByDesc('barcode')
            ->value('barcode');

        $nextNumber = $lastBarcode ? (int) substr($lastBarcode, 3) + 1 : 1;

        return $prefix.str_pad((string) $nextNumber, 8, '0', STR_PAD_LEFT);
    }

    public function generateForProduct(Product $product, bool $overwrite = false): ?string
    {
        if (! $overwrite && ! empty($product->barcode)) {
            return $product->barcode;
        }

        $barcode = $this->generateBarcode();

        $product->update(['barcode' => $barcode]);

        return $barcode;
    }

    public function generateMissing(): array
    {
        $products = Product::whereNull('barcode')->orWhere('barcode', '')->get();
        $generated = 0;
        $skipped = 0;
        $failed = 0;
        $results = [];

        foreach ($products as $product) {
            try {
                $barcode = $this->generateForProduct($product);
                $results[] = ['product' => $product->name, 'barcode' => $barcode];
                $generated++;
            } catch (\Exception $e) {
                $failed++;
            }
        }

        return [
            'generated' => $generated,
            'skipped' => $skipped,
            'failed' => $failed,
            'results' => $results,
        ];
    }

    public function generateForProductIds(array $productIds, bool $overwrite = false): array
    {
        $products = Product::whereIn('id', $productIds)->get();
        $generated = 0;
        $results = [];

        foreach ($products as $product) {
            $barcode = $this->generateForProduct($product, $overwrite);
            if ($barcode) {
                $generated++;
                $results[] = ['product' => $product->name, 'barcode' => $barcode];
            }
        }

        return ['generated' => $generated, 'results' => $results];
    }

    public function validateUnique(string $barcode, ?int $excludeId = null): bool
    {
        $query = Product::where('barcode', $barcode);
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->doesntExist();
    }

    public function findDuplicates(): array
    {
        return Product::select('barcode', DB::raw('COUNT(*) as count'))
            ->whereNotNull('barcode')
            ->where('barcode', '!=', '')
            ->groupBy('barcode')
            ->having('count', '>', 1)
            ->get()
            ->toArray();
    }

    public function getStats(): array
    {
        return [
            'total' => Product::count(),
            'with_barcode' => Product::whereNotNull('barcode')->where('barcode', '!=', '')->count(),
            'missing_barcode' => Product::whereNull('barcode')->orWhere('barcode', '')->count(),
        ];
    }
}
