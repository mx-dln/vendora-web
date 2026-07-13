<?php

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => '09'.fake()->numerify('#########'),
            'address' => fake()->streetAddress(),
            'city' => fake()->randomElement(['Manila', 'Quezon City', 'Makati', 'Pasig', 'Mandaluyong', 'Cebu City', 'Davao City', 'Cavite', 'Laguna', 'Batangas']),
            'province' => fake()->randomElement(['Metro Manila', 'Cebu', 'Davao del Sur', 'Cavite', 'Laguna', 'Batangas']),
            'zip_code' => fake()->postcode(),
            'total_purchases' => 0,
            'visit_count' => 0,
            'last_visit_at' => null,
            'notes' => fake()->optional()->sentence(),
            'is_active' => true,
        ];
    }
}
