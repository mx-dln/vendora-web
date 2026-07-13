<?php

namespace App\Services\Assistant;

use App\Models\Product;

class InventoryAssistantService
{
    public function getLowStockProducts(): mixed
    {
        return Product::active()->where('track_inventory', true)->whereColumn('stock_quantity', '<=', 'low_stock_threshold')->where('stock_quantity', '>', 0)->orderBy('stock_quantity')->limit(10)->get();
    }

    public function getOutOfStockProducts(): mixed
    {
        return Product::active()->where('track_inventory', true)->where('stock_quantity', '<=', 0)->limit(10)->get();
    }

    public function getInventoryValue(): array
    {
        $cost = Product::active()->select(\DB::raw('SUM(stock_quantity * cost_price) as total_cost'))->value('total_cost') ?? 0;
        $retail = Product::active()->select(\DB::raw('SUM(stock_quantity * selling_price) as total_retail'))->value('total_retail') ?? 0;

        return ['cost' => $cost, 'retail' => $retail];
    }
}
