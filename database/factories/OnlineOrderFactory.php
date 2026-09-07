<?php

namespace Database\Factories;

use App\Models\OnlineOrder;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OnlineOrder>
 */
class OnlineOrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'reference_number' => 'WEB-'.$this->faker->unique()->numerify('########'),
            'customer_name' => $this->faker->name(),
            'customer_phone' => $this->faker->phoneNumber(),
            'customer_email' => $this->faker->safeEmail(),
            'delivery_address' => $this->faker->address(),
            'order_type' => $this->faker->randomElement(['delivery', 'pickup']),
            'status' => $this->faker->randomElement(['pending', 'preparing', 'ready', 'completed']),
            'payment_status' => $this->faker->randomElement(['unpaid', 'paid']),
            'total' => $this->faker->randomFloat(2, 50, 2500),
            'item_count' => $this->faker->numberBetween(1, 12),
            'notes' => $this->faker->optional()->sentence(),
            'requested_at' => now(),
        ];
    }
}
