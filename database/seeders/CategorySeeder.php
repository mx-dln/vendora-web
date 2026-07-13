<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['Beverages', '#3B82F6', 0],
            ['Snacks', '#F59E0B', 1],
            ['Canned Goods', '#EF4444', 2],
            ['Rice & Noodles', '#10B981', 3],
            ['Frozen Food', '#6366F1', 4],
            ['Personal Care', '#EC4899', 5],
            ['Household', '#8B5CF6', 6],
            ['Cigarettes', '#6B7280', 7],
            ['Candy & Chocolates', '#F97316', 8],
            ['School Supplies', '#14B8A6', 9],
            ['Medicine', '#DC2626', 10],
            ['Cleaning Supplies', '#0284C7', 11],
            ['Bread & Bakery', '#D97706', 12],
            ['Condiments', '#65A30D', 13],
            ['Dairy Products', '#7C3AED', 14],
            ['Baby Products', '#F472B6', 15],
        ];

        foreach ($categories as $cat) {
            Category::create([
                'name' => $cat[0],
                'slug' => Str::slug($cat[0]),
                'description' => "All {$cat[0]} products",
                'parent_id' => null,
                'is_active' => true,
                'color' => $cat[1],
                'sort_order' => $cat[2],
            ]);
        }
    }
}
