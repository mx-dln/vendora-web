<?php

namespace Database\Factories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Supplier>
 */
class SupplierFactory extends Factory
{
    protected $model = Supplier::class;

    public function definition(): array
    {
        $companies = [
            'Pepsi-Cola Products Philippines', 'Nestlé Philippines', 'Unilever Philippines',
            'Procter & Gamble Philippines', 'San Miguel Corporation', 'Universal Robina Corporation',
            'Monde Nissin Corporation', 'Liwayway Marketing Corporation', 'NutriAsia',
            'Johnson & Johnson Philippines', 'Colgate-Palmolive Philippines', 'Globe Telecom',
            'Philippine Seven Corporation', 'RFM Corporation', 'Century Pacific Food',
        ];

        return [
            'name' => fake()->unique()->randomElement($companies),
            'contact_person' => fake()->name(),
            'email' => fake()->companyEmail(),
            'phone' => '02'.fake()->numerify('#######'),
            'address' => fake()->streetAddress(),
            'city' => fake()->randomElement(['Makati', 'Pasig', 'Mandaluyong', 'Taguig', 'Parañaque', 'Manila']),
            'province' => 'Metro Manila',
            'zip_code' => fake()->postcode(),
            'tax_id' => fake()->numerify('###-###-###-###'),
            'notes' => fake()->optional()->sentence(),
            'is_active' => true,
        ];
    }
}
