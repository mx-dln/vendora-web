<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::all()->keyBy('name');
        $categoryId = fn (string $name) => $categories->get($name)?->id ?? 1;

        $products = [
            ['Coca-Cola 1.5L', 'Beverages', 55.00, 65.00, 100, 'bottle', 'SKU-BEV001', '4806514000010'],
            ['Coca-Cola 500ml', 'Beverages', 18.00, 22.00, 150, 'bottle', 'SKU-BEV002', '4806514000027'],
            ['Royal 1L', 'Beverages', 28.00, 35.00, 80, 'bottle', 'SKU-BEV003', '4806514000034'],
            ['Sprite 500ml', 'Beverages', 17.00, 22.00, 120, 'bottle', 'SKU-BEV004', '4806514000041'],
            ['Mountain Dew 500ml', 'Beverages', 17.00, 22.00, 100, 'bottle', 'SKU-BEV005', '4806514000058'],
            ['Sting Red 330ml', 'Beverages', 15.00, 20.00, 90, 'bottle', 'SKU-BEV006', '4806514000065'],
            ['Cobra Energy Drink', 'Beverages', 18.00, 25.00, 75, 'can', 'SKU-BEV007', '4806514000072'],
            ['Gatorade Blue 500ml', 'Beverages', 25.00, 32.00, 60, 'bottle', 'SKU-BEV008', '4806514000089'],
            ['Mineral Water 500ml', 'Beverages', 8.00, 12.00, 200, 'bottle', 'SKU-BEV009', '4806514000096'],
            ['Nestea Ice Tea 500ml', 'Beverages', 18.00, 22.00, 70, 'bottle', 'SKU-BEV010', '4806514000102'],
            ['Piattos Sour Cream', 'Snacks', 18.00, 25.00, 80, 'pack', 'SKU-SNK001', '4806514000119'],
            ['Nova Country Cheddar', 'Snacks', 18.00, 25.00, 75, 'pack', 'SKU-SNK002', '4806514000126'],
            ['Oishi Prawn Crackers', 'Snacks', 8.00, 12.00, 120, 'pack', 'SKU-SNK003', '4806514000133'],
            ['Chippy BBQ', 'Snacks', 8.00, 12.00, 100, 'pack', 'SKU-SNK004', '4806514000140'],
            ['Doritos Nacho Cheese', 'Snacks', 20.00, 28.00, 60, 'pack', 'SKU-SNK005', '4806514000157'],
            ['Cheez It', 'Snacks', 8.00, 12.00, 90, 'pack', 'SKU-SNK006', '4806514000164'],
            ['Clover Chips Cheese', 'Snacks', 8.00, 12.00, 85, 'pack', 'SKU-SNK007', '4806514000171'],
            ['V-Cut Spicy BBQ', 'Snacks', 18.00, 25.00, 70, 'pack', 'SKU-SNK008', '4806514000188'],
            ['Corned Beef 380g', 'Canned Goods', 35.00, 45.00, 50, 'can', 'SKU-CAN001', '4806514000195'],
            ['Sardines Tomate 155g', 'Canned Goods', 12.00, 18.00, 80, 'can', 'SKU-CAN002', '4806514000201'],
            ['Tuna Flakes 180g', 'Canned Goods', 20.00, 28.00, 60, 'can', 'SKU-CAN003', '4806514000218'],
            ['Beef Loaf 340g', 'Canned Goods', 25.00, 35.00, 45, 'can', 'SKU-CAN004', '4806514000225'],
            ['Pork & Beans 155g', 'Canned Goods', 15.00, 20.00, 70, 'can', 'SKU-CAN005', '4806514000232'],
            ['Evap Milk 370ml', 'Canned Goods', 22.00, 30.00, 55, 'can', 'SKU-CAN006', '4806514000249'],
            ['Condensed Milk 300ml', 'Canned Goods', 25.00, 33.00, 50, 'can', 'SKU-CAN007', '4806514000256'],
            ['Nissin Cup Noodles Beef', 'Rice & Noodles', 15.00, 22.00, 60, 'cup', 'SKU-RIC001', '4806514000263'],
            ['Lucky Me Pancit Canton', 'Rice & Noodles', 8.00, 12.00, 100, 'pack', 'SKU-RIC002', '4806514000270'],
            ['Lucky Me Beef Noodles', 'Rice & Noodles', 7.00, 10.00, 120, 'pack', 'SKU-RIC003', '4806514000287'],
            ['Silver Swan Soy Sauce', 'Condiments', 12.00, 18.00, 50, 'bottle', 'SKU-CON001', '4806514000294'],
            ['Datu Puti Vinegar', 'Condiments', 10.00, 15.00, 50, 'bottle', 'SKU-CON002', '4806514000300'],
            ['Cooking Oil 1L', 'Condiments', 35.00, 48.00, 45, 'bottle', 'SKU-CON003', '4806514000317'],
            ['Magnolia Buttercup 225g', 'Dairy Products', 28.00, 38.00, 35, 'pack', 'SKU-DAI001', '4806514000324'],
            ['Cheez Whiz 220g', 'Dairy Products', 35.00, 48.00, 30, 'jar', 'SKU-DAI002', '4806514000331'],
            ['Eden Cheese 160g', 'Dairy Products', 30.00, 42.00, 30, 'pack', 'SKU-DAI003', '4806514000348'],
            ['Yakult 5-Pack', 'Dairy Products', 25.00, 33.00, 40, 'pack', 'SKU-DAI004', '4806514000355'],
            ['Surf Laundry Powder 40g', 'Household', 6.00, 10.00, 80, 'sachet', 'SKU-HOU001', '4806514000362'],
            ['Tide Laundry Powder 40g', 'Household', 7.00, 10.00, 80, 'sachet', 'SKU-HOU002', '4806514000379'],
            ['Downy Fabric Conditioner 30ml', 'Household', 5.00, 8.00, 90, 'sachet', 'SKU-HOU003', '4806514000386'],
            ['Zonrox Bleach 250ml', 'Cleaning Supplies', 12.00, 18.00, 40, 'bottle', 'SKU-CLN001', '4806514000393'],
            ['Joy Dishwashing Liquid 20ml', 'Cleaning Supplies', 5.00, 8.00, 100, 'sachet', 'SKU-CLN002', '4806514000409'],
            ['Colgate Toothpaste 50g', 'Personal Care', 15.00, 22.00, 60, 'tube', 'SKU-PER001', '4806514000416'],
            ['Safeguard Soap 60g', 'Personal Care', 12.00, 18.00, 70, 'bar', 'SKU-PER002', '4806514000423'],
            ['Head & Shoulders 10ml', 'Personal Care', 5.00, 8.00, 100, 'sachet', 'SKU-PER003', '4806514000430'],
            ['Palmolive Shampoo 10ml', 'Personal Care', 5.00, 8.00, 100, 'sachet', 'SKU-PER004', '4806514000447'],
            ['Fortune Menthol 20s', 'Cigarettes', 55.00, 70.00, 50, 'pack', 'SKU-CIG001', '4806514000454'],
            ['Marlboro Red 20s', 'Cigarettes', 65.00, 85.00, 40, 'pack', 'SKU-CIG002', '4806514000461'],
            ['Paracetamol 500mg', 'Medicine', 3.00, 5.00, 100, 'tablet', 'SKU-MED001', '4806514000478'],
            ['Bioflu Paracetamol', 'Medicine', 5.00, 8.00, 80, 'pack', 'SKU-MED002', '4806514000485'],
            ['Neozep Forte', 'Medicine', 5.00, 8.00, 75, 'pack', 'SKU-MED003', '4806514000492'],
            ['Ballpen Black', 'School Supplies', 5.00, 8.00, 100, 'piece', 'SKU-SCH001', '4806514000508'],
            ['Pencil', 'School Supplies', 4.00, 6.00, 100, 'piece', 'SKU-SCH002', '4806514000515'],
            ['Notebook 80 leaves', 'School Supplies', 15.00, 22.00, 40, 'piece', 'SKU-SCH003', '4806514000522'],
            ['Pan de Sal (5 pcs)', 'Bread & Bakery', 10.00, 15.00, 30, 'pack', 'SKU-BRD001', '4806514000539'],
            ['SkyFlakes Crackers', 'Bread & Bakery', 8.00, 12.00, 80, 'pack', 'SKU-BRD002', '4806514000546'],
            ['Fudgee Bar', 'Bread & Bakery', 10.00, 15.00, 50, 'pack', 'SKU-BRD003', '4806514000553'],
        ];

        foreach ($products as $product) {
            Product::create([
                'name' => $product[0],
                'slug' => Str::slug($product[0]),
                'description' => "Fresh {$product[0]} available.",
                'sku' => $product[6],
                'barcode' => $product[7],
                'category_id' => $categoryId($product[1]),
                'cost_price' => $product[2],
                'selling_price' => $product[3],
                'wholesale_price' => round($product[3] * 0.9, 2),
                'stock_quantity' => $product[4],
                'low_stock_threshold' => 10,
                'unit' => $product[5],
                'track_inventory' => true,
                'has_variants' => false,
                'is_active' => true,
                'image' => null,
                'notes' => null,
            ]);
        }
    }
}
