<?php

namespace Database\Seeders;

use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::firstOrCreate(
            ['email' => 'owner@vendora.test'],
            [
                'name' => 'Owner',
                'password' => bcrypt('password'),
                'role' => 'admin',
                'is_active' => true,
            ]
        );
        $owner->assignRole('Owner');

        $manager = User::firstOrCreate(
            ['email' => 'manager@vendora.test'],
            [
                'name' => 'Manager',
                'password' => bcrypt('password'),
                'role' => 'manager',
                'is_active' => true,
            ]
        );
        $manager->assignRole('Manager');

        $cashier = User::firstOrCreate(
            ['email' => 'cashier@vendora.test'],
            [
                'name' => 'Cashier',
                'password' => bcrypt('password'),
                'role' => 'cashier',
                'is_active' => true,
            ]
        );
        $cashier->assignRole('Cashier');

        StoreSetting::firstOrCreate(
            ['key' => 'store_name'],
            ['value' => 'Vendora Store']
        );

        $this->command->info('Demo users created: owner@vendora.test, manager@vendora.test, cashier@vendora.test');
    }
}
