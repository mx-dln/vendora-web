<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    private array $brandMap = [
        'Coca-Cola' => 'Coca-Cola', 'Royal' => 'Coca-Cola', 'Sprite' => 'Coca-Cola',
        'Mountain Dew' => 'PepsiCo', 'Sting' => 'PepsiCo', 'Gatorade' => 'PepsiCo',
        'Piattos' => 'Universal Robina', 'Nova' => 'Universal Robina', 'Oishi' => 'Liwayway',
        'Chippy' => 'Universal Robina', 'Doritos' => 'PepsiCo', 'Moby' => 'Universal Robina',
        'Clover' => 'Universal Robina', 'V-Cut' => 'Universal Robina', 'Tortillos' => 'PepsiCo',
        'Corned Beef' => 'Purefoods', 'Sardines' => '555', 'Tuna' => 'Century',
        'Spam' => 'Hormel', 'Nissin' => 'Nissin', 'Lucky Me' => 'Monde Nissin',
        'Mama Sita' => 'Mama Sita', 'Silver Swan' => 'Silver Swan', 'Datu Puti' => 'NutriAsia',
        'Magnolia' => 'San Miguel', 'Cheez Whiz' => 'Kraft Heinz', 'Eden' => 'Kraft Heinz',
        'Yakult' => 'Yakult', 'Surf' => 'Unilever', 'Tide' => 'P&G', 'Downy' => 'P&G',
        'Zonrox' => 'Zonrox', 'Joy' => 'P&G', 'Mr Muscle' => 'SC Johnson',
        'Colgate' => 'Colgate-Palmolive', 'Safeguard' => 'P&G', 'Head & Shoulders' => 'P&G',
        'Palmolive' => 'Colgate-Palmolive', 'Whisper' => 'P&G', 'Pampers' => 'P&G',
        'Johnson' => 'Johnson & Johnson', 'Fortune' => 'PMFTC', 'Marlboro' => 'Philip Morris',
        'Bioflu' => 'United Lab', 'Neozep' => 'United Lab', 'Alaxan' => 'Multicare',
        'Kremil S' => 'United Lab', 'Crayola' => 'Binney & Smith',
        'Monde' => 'Mondelez', 'SkyFlakes' => 'Monde Nissin', 'Fita' => 'Monde Nissin',
        'Fudgee' => 'Mondelez',
    ];

    public function definition(): array
    {
        $products = [
            ['Coca-Cola 1.5L', 'Beverages', 55.00, 65.00, 100, 'bottle'],
            ['Coca-Cola 500ml', 'Beverages', 18.00, 22.00, 150, 'bottle'],
            ['Royal 1L', 'Beverages', 28.00, 35.00, 80, 'bottle'],
            ['Sprite 500ml', 'Beverages', 17.00, 22.00, 120, 'bottle'],
            ['Mountain Dew 500ml', 'Beverages', 17.00, 22.00, 100, 'bottle'],
            ['Sting Red 330ml', 'Beverages', 15.00, 20.00, 90, 'bottle'],
            ['Cobra Energy Drink', 'Beverages', 18.00, 25.00, 75, 'can'],
            ['Gatorade Blue 500ml', 'Beverages', 25.00, 32.00, 60, 'bottle'],
            ['Mineral Water 500ml', 'Beverages', 8.00, 12.00, 200, 'bottle'],
            ['Nestea Ice Tea 500ml', 'Beverages', 18.00, 22.00, 70, 'bottle'],
            ['Piattos Sour Cream', 'Snacks', 18.00, 25.00, 80, 'pack'],
            ['Nova Country Cheddar', 'Snacks', 18.00, 25.00, 75, 'pack'],
            ['Oishi Prawn Crackers', 'Snacks', 8.00, 12.00, 120, 'pack'],
            ['Chippy BBQ', 'Snacks', 8.00, 12.00, 100, 'pack'],
            ['Doritos Nacho Cheese', 'Snacks', 20.00, 28.00, 60, 'pack'],
            ['Cheez It', 'Snacks', 8.00, 12.00, 90, 'pack'],
            ['Moby Creamy Choco', 'Snacks', 10.00, 15.00, 50, 'pack'],
            ['Clover Chips Cheese', 'Snacks', 8.00, 12.00, 85, 'pack'],
            ['V-Cut Spicy BBQ', 'Snacks', 18.00, 25.00, 70, 'pack'],
            ['Tortillos Cheese', 'Snacks', 18.00, 25.00, 65, 'pack'],
            ['Corned Beef 380g', 'Canned Goods', 35.00, 45.00, 50, 'can'],
            ['Sardines Tomate 155g', 'Canned Goods', 12.00, 18.00, 80, 'can'],
            ['Tuna Flakes 180g', 'Canned Goods', 20.00, 28.00, 60, 'can'],
            ['Beef Loaf 340g', 'Canned Goods', 25.00, 35.00, 45, 'can'],
            ['Pork & Beans 155g', 'Canned Goods', 15.00, 20.00, 70, 'can'],
            ['Fruit Cocktail 432g', 'Canned Goods', 28.00, 38.00, 40, 'can'],
            ['Evap Milk 370ml', 'Canned Goods', 22.00, 30.00, 55, 'can'],
            ['Condensed Milk 300ml', 'Canned Goods', 25.00, 33.00, 50, 'can'],
            ['Corned Tuna 150g', 'Canned Goods', 18.00, 25.00, 65, 'can'],
            ['Spam Lite 340g', 'Canned Goods', 85.00, 110.00, 30, 'can'],
            ['Nissin Cup Noodles Beef', 'Rice & Noodles', 15.00, 22.00, 60, 'cup'],
            ['Lucky Me Pancit Canton', 'Rice & Noodles', 8.00, 12.00, 100, 'pack'],
            ['Lucky Me Beef Noodles', 'Rice & Noodles', 7.00, 10.00, 120, 'pack'],
            ['Mama Sita Oyster Sauce', 'Condiments', 15.00, 22.00, 40, 'pack'],
            ['Silver Swan Soy Sauce', 'Condiments', 12.00, 18.00, 50, 'bottle'],
            ['Datu Puti Vinegar', 'Condiments', 10.00, 15.00, 50, 'bottle'],
            ['Cooking Oil 1L', 'Condiments', 35.00, 48.00, 45, 'bottle'],
            ['Magnolia Buttercup 225g', 'Dairy Products', 28.00, 38.00, 35, 'pack'],
            ['Cheez Whiz 220g', 'Dairy Products', 35.00, 48.00, 30, 'jar'],
            ['Eden Cheese 160g', 'Dairy Products', 30.00, 42.00, 30, 'pack'],
            ['Yakult 5-Pack', 'Dairy Products', 25.00, 33.00, 40, 'pack'],
            ['Surf Laundry Powder 40g', 'Household', 6.00, 10.00, 80, 'sachet'],
            ['Tide Laundry Powder 40g', 'Household', 7.00, 10.00, 80, 'sachet'],
            ['Downy Fabric Conditioner 30ml', 'Household', 5.00, 8.00, 90, 'sachet'],
            ['Zonrox Bleach 250ml', 'Cleaning Supplies', 12.00, 18.00, 40, 'bottle'],
            ['Joy Dishwashing Liquid 20ml', 'Cleaning Supplies', 5.00, 8.00, 100, 'sachet'],
            ['Mr Muscle Cleaner 500ml', 'Cleaning Supplies', 35.00, 48.00, 25, 'bottle'],
            ['Colgate Toothpaste 50g', 'Personal Care', 15.00, 22.00, 60, 'tube'],
            ['Safeguard Soap 60g', 'Personal Care', 12.00, 18.00, 70, 'bar'],
            ['Head & Shoulders 10ml', 'Personal Care', 5.00, 8.00, 100, 'sachet'],
            ['Palmolive Shampoo 10ml', 'Personal Care', 5.00, 8.00, 100, 'sachet'],
            ['Whisper Sanitary Pad 10s', 'Personal Care', 25.00, 35.00, 40, 'pack'],
            ['Pampers Diaper S', 'Baby Products', 45.00, 60.00, 25, 'pack'],
            ['Johnson Baby Powder', 'Baby Products', 30.00, 42.00, 30, 'bottle'],
            ['Fortune Menthol 20s', 'Cigarettes', 55.00, 70.00, 50, 'pack'],
            ['Marlboro Red 20s', 'Cigarettes', 65.00, 85.00, 40, 'pack'],
            ['Paracetamol 500mg', 'Medicine', 3.00, 5.00, 100, 'tablet'],
            ['Bioflu Paracetamol', 'Medicine', 5.00, 8.00, 80, 'pack'],
            ['Neozep Forte', 'Medicine', 5.00, 8.00, 75, 'pack'],
            ['Alaxan FR', 'Medicine', 7.00, 12.00, 60, 'pack'],
            ['Kremil S Advance', 'Medicine', 6.00, 10.00, 65, 'pack'],
            ['Paper 80 sheets', 'School Supplies', 10.00, 15.00, 50, 'pad'],
            ['Ballpen Black', 'School Supplies', 5.00, 8.00, 100, 'piece'],
            ['Pencil', 'School Supplies', 4.00, 6.00, 100, 'piece'],
            ['Crayola 8 colors', 'School Supplies', 35.00, 48.00, 30, 'box'],
            ['Notebook 80 leaves', 'School Supplies', 15.00, 22.00, 40, 'piece'],
            ['Pan de Sal (5 pcs)', 'Bread & Bakery', 10.00, 15.00, 30, 'pack'],
            ['Monde Mamon', 'Bread & Bakery', 8.00, 12.00, 40, 'pack'],
            ['SkyFlakes Crackers', 'Bread & Bakery', 8.00, 12.00, 80, 'pack'],
            ['Fita Crackers', 'Bread & Bakery', 8.00, 12.00, 70, 'pack'],
            ['Fudgee Bar', 'Bread & Bakery', 10.00, 15.00, 50, 'pack'],
        ];

        $product = fake()->unique()->randomElement($products);
        $name = $product[0];
        $brandKey = explode(' ', $name)[0];

        return [
            'name' => $name,
            'brand' => $this->brandMap[$brandKey] ?? null,
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'sku' => 'SKU-'.str_pad((string) fake()->unique()->randomNumber(5), 5, '0', STR_PAD_LEFT),
            'barcode' => fake()->ean13(),
            'barcode_type' => 'code128',
            'category_id' => Category::where('name', $product[1])->first()?->id ?? Category::inRandomOrder()->first()->id,
            'cost_price' => $product[2],
            'selling_price' => $product[3],
            'wholesale_price' => $product[3] * 0.9,
            'stock_quantity' => $product[4],
            'low_stock_threshold' => 10,
            'reorder_quantity' => $product[4] * 2,
            'unit' => $product[5],
            'track_inventory' => true,
            'has_variants' => false,
            'status' => 'active',
            'is_active' => true,
            'image' => null,
            'notes' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
            'is_active' => false,
        ]);
    }

    public function discontinued(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'discontinued',
            'is_active' => false,
        ]);
    }

    public function noInventory(): static
    {
        return $this->state(fn (array $attributes) => [
            'track_inventory' => false,
            'stock_quantity' => 0,
        ]);
    }
}
