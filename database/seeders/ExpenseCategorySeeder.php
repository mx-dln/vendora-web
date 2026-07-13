<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'Utilities', 'Rent', 'Salaries', 'Supplies', 'Maintenance',
            'Transportation', 'Marketing', 'Food & Meals', 'Miscellaneous',
        ];

        foreach ($categories as $name) {
            ExpenseCategory::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'description' => "{$name} expenses", 'is_active' => true]
            );
        }

        $this->command->info('Expense categories seeded successfully.');
    }
}
