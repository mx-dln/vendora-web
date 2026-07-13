<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        $name = fake()->unique()->randomElement([
            'Beverages', 'Snacks', 'Canned Goods', 'Rice & Noodles',
            'Frozen Food', 'Personal Care', 'Household', 'Cigarettes',
            'Candy & Chocolates', 'School Supplies', 'Medicine', 'Cleaning Supplies',
            'Bread & Bakery', 'Condiments', 'Dairy Products', 'Baby Products',
        ]);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'parent_id' => null,
            'is_active' => true,
            'color' => fake()->hexColor(),
            'sort_order' => fake()->numberBetween(0, 20),
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
