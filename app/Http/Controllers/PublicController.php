<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\StoreSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicController extends Controller
{
    public function index(): Response
    {
        $stats = $this->getCached('public.stats', function () {
            return [
                'total_products' => Product::where('status', 'active')->count(),
                'total_categories' => Category::where('is_active', true)->count(),
                'available_products' => Product::where('status', 'active')->where('stock_quantity', '>', 0)->count(),
                'active_promotions' => Promotion::where('is_active', true)
                    ->where(function ($q) {
                        $q->whereNull('end_date')->orWhere('end_date', '>=', now());
                    })
                    ->where(function ($q) {
                        $q->whereNull('start_date')->orWhere('start_date', '<=', now());
                    })
                    ->count(),
            ];
        });

        $newest = $this->getCached('public.newest', function () {
            return Product::with('category')->where('status', 'active')->latest()->take(8)->get();
        }, 300);

        $bestsellers = $this->getCached('public.bestsellers', function () {
            return Product::with('category')->where('status', 'active')
                ->whereHas('transactionItems', fn ($q) => $q->selectRaw('sum(quantity) as total_qty')->groupBy('product_id'))
                ->withCount(['transactionItems as total_sold' => fn ($q) => $q->selectRaw('coalesce(sum(quantity), 0)')])
                ->orderByDesc('total_sold')
                ->take(8)
                ->get();
        }, 300);

        $categories = $this->getCached('public.categories', function () {
            return Category::where('is_active', true)
                ->withCount(['products' => fn ($q) => $q->where('status', 'active')])
                ->orderBy('sort_order')
                ->get();
        }, 300);

        $promotions = $this->getCached('public.promotions', function () {
            return Promotion::with('category', 'product')
                ->where('is_active', true)
                ->where(function ($q) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', now());
                })
                ->where(function ($q) {
                    $q->whereNull('start_date')->orWhere('start_date', '<=', now());
                })
                ->latest()
                ->get();
        }, 300);

        $store = $this->getStoreInfo();

        return Inertia::render('public/index', compact('stats', 'newest', 'bestsellers', 'categories', 'promotions', 'store'));
    }

    public function products(Request $request): Response
    {
        $query = Product::with('category')
            ->where('status', 'active');

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%");
            });
        }

        if ($category = $request->category) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $category));
        }

        if ($request->min_price) {
            $query->where('selling_price', '>=', $request->min_price);
        }

        if ($request->max_price) {
            $query->where('selling_price', '<=', $request->max_price);
        }

        if ($request->availability === 'in_stock') {
            $query->where(function ($q) {
                $q->where('track_inventory', false)->orWhere('stock_quantity', '>', 0);
            });
        } elseif ($request->availability === 'out_of_stock') {
            $query->where('track_inventory', true)->where('stock_quantity', '<=', 0);
        }

        if ($request->promotions) {
            $query->whereHas('promotions', fn ($q) => $q->where('is_active', true)
                ->where(function ($q2) {
                    $q2->whereNull('end_date')->orWhere('end_date', '>=', now());
                }));
        }

        $sort = match ($request->sort) {
            'price_asc' => ['selling_price', 'asc'],
            'price_desc' => ['selling_price', 'desc'],
            'name_asc' => ['name', 'asc'],
            'name_desc' => ['name', 'desc'],
            'oldest' => ['created_at', 'asc'],
            default => ['created_at', 'desc'],
        };
        $query->orderBy($sort[0], $sort[1]);

        $products = $query->paginate(12)->withQueryString();
        $categories = Category::where('is_active', true)
            ->withCount(['products' => fn ($q) => $q->where('status', 'active')])
            ->orderBy('sort_order')
            ->get();
        $store = $this->getStoreInfo();

        return Inertia::render('public/products', compact('products', 'categories', 'store'));
    }

    public function product(string $slug): Response
    {
        $product = Product::with('category')
            ->where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        $related = Product::with('category')
            ->where('status', 'active')
            ->where('id', '!=', $product->id)
            ->where(fn ($q) => $q->where('category_id', $product->category_id)->orWhere('brand', $product->brand))
            ->inRandomOrder()
            ->take(4)
            ->get();

        $store = $this->getStoreInfo();

        return Inertia::render('public/product', compact('product', 'related', 'store'));
    }

    public function category(string $slug, Request $request): Response
    {
        $category = Category::where('slug', $slug)->where('is_active', true)->firstOrFail();

        $query = Product::with('category')
            ->where('status', 'active')
            ->where('category_id', $category->id);

        $sort = match ($request->sort) {
            'price_asc' => ['selling_price', 'asc'],
            'price_desc' => ['selling_price', 'desc'],
            'name_asc' => ['name', 'asc'],
            'name_desc' => ['name', 'desc'],
            'oldest' => ['created_at', 'asc'],
            default => ['created_at', 'desc'],
        };
        $query->orderBy($sort[0], $sort[1]);

        $products = $query->paginate(12)->withQueryString();
        $store = $this->getStoreInfo();

        return Inertia::render('public/category', compact('category', 'products', 'store'));
    }

    public function promotions(): Response
    {
        $promotions = Promotion::with('category', 'product')
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', now());
            })
            ->where(function ($q) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', now());
            })
            ->latest()
            ->paginate(12);

        $store = $this->getStoreInfo();

        return Inertia::render('public/promotions', compact('promotions', 'store'));
    }

    private function getStoreInfo(): array
    {
        return $this->getCached('public.store', function () {
            return [
                'name' => StoreSetting::getValue('store_name', 'Vendora Store'),
                'address' => StoreSetting::getValue('store_address', ''),
                'city' => StoreSetting::getValue('store_city', ''),
                'phone' => StoreSetting::getValue('store_phone', ''),
                'email' => StoreSetting::getValue('store_email', ''),
                'tagline' => StoreSetting::getValue('store_tagline', 'Your Neighborhood Store'),
                'hours' => StoreSetting::getValue('store_hours', ''),
            ];
        }, 3600);
    }

    private function getCached(string $key, callable $callback, int $ttl = 600): mixed
    {
        return cache()->remember($key, $ttl, $callback);
    }
}
