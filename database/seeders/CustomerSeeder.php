<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            ['Juan Dela Cruz', 'juan@email.com', '09171234567', '123 Rizal St.', 'Manila', 'Metro Manila', '1000'],
            ['Maria Santos', 'maria@email.com', '09182345678', '456 Mabini St.', 'Quezon City', 'Metro Manila', '1100'],
            ['Pedro Gonzales', 'pedro@email.com', '09193456789', '789 Bonifacio St.', 'Makati', 'Metro Manila', '1200'],
            ['Ana Bautista', 'ana@email.com', '09154567890', '321 Luna St.', 'Pasig', 'Metro Manila', '1300'],
            ['Jose Rizal', 'jose@email.com', '09165678901', '654 Aguinaldo St.', 'Mandaluyong', 'Metro Manila', '1400'],
            ['Elena Cruz', 'elena@email.com', '09176789012', '987 Jacinto St.', 'Cebu City', 'Cebu', '6000'],
            ['Carlos Mendoza', 'carlos@email.com', '09187890123', '147 Del Pilar St.', 'Davao City', 'Davao del Sur', '8000'],
            ['Luisa Fernandez', 'luisa@email.com', '09198901234', '258 Mabuhay St.', 'Cavite', 'Cavite', '4100'],
            ['Antonio Villanueva', 'antonio@email.com', '09129012345', '369 Silang St.', 'Laguna', 'Laguna', '4026'],
            ['Sofia Ramirez', 'sofia@email.com', '09130123456', '159 Katipunan St.', 'Batangas', 'Batangas', '4200'],
        ];

        foreach ($customers as $c) {
            Customer::create([
                'name' => $c[0],
                'email' => $c[1],
                'phone' => $c[2],
                'address' => $c[3],
                'city' => $c[4],
                'province' => $c[5],
                'zip_code' => $c[6],
                'total_purchases' => fake()->randomFloat(2, 500, 15000),
                'visit_count' => fake()->numberBetween(1, 50),
                'last_visit_at' => fake()->dateTimeBetween('-3 months', 'now'),
                'notes' => null,
                'is_active' => true,
            ]);
        }
    }
}
