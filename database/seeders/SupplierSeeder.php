<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            ['Pepsi-Cola Products Philippines', 'Mike Tan', 'pepsi@pepsi.com.ph', '0287654321', '44 Meralco Ave', 'Pasig', 'Metro Manila', '1600', '123-456-789-001'],
            ['Nestlé Philippines', 'Anna Reyes', 'anna@nestle.com.ph', '0290123456', '6/F NESTLÉ House, 52 EDSA', 'Mandaluyong', 'Metro Manila', '1550', '123-456-789-002'],
            ['Universal Robina Corporation', 'David Lim', 'david@urc.com.ph', '0288887777', '8 URC Building, 5 E. Rodriguez Ave', 'Quezon City', 'Metro Manila', '1102', '123-456-789-003'],
            ['Monde Nissin Corporation', 'Cathy Cruz', 'cathy@mondenissin.com', '0299998888', '5/F Monde Nissin Building', 'Makati', 'Metro Manila', '1226', '123-456-789-004'],
            ['NutriAsia', 'Ben Chan', 'ben@nutriasia.com', '0277776666', '3 NutriAsia Building', 'Parañaque', 'Metro Manila', '1700', '123-456-789-005'],
            ['Century Pacific Food', 'Grace Santos', 'grace@centurypacific.com', '0266665555', '7 Century Pacific Building', 'Taguig', 'Metro Manila', '1634', '123-456-789-006'],
            ['Procter & Gamble Philippines', 'Tom Cruz', 'tom@pg.com', '0255554444', '12/F P&G Building', 'Makati', 'Metro Manila', '1226', '123-456-789-007'],
            ['Unilever Philippines', 'Lisa Tan', 'lisa@unilever.com', '0244443333', '9/F Unilever Building', 'Taguig', 'Metro Manila', '1634', '123-456-789-008'],
            ['Johnson & Johnson Philippines', 'Mark Reyes', 'mark@jnj.com', '0233332222', '2/F J&J Building', 'Mandaluyong', 'Metro Manila', '1550', '123-456-789-009'],
            ['San Miguel Corporation', 'Judy Santos', 'judy@sanmiguel.com.ph', '0222221111', '40 San Miguel Building', 'Mandaluyong', 'Metro Manila', '1550', '123-456-789-010'],
        ];

        foreach ($suppliers as $s) {
            Supplier::create([
                'name' => $s[0],
                'contact_person' => $s[1],
                'email' => $s[2],
                'phone' => $s[3],
                'address' => $s[4],
                'city' => $s[5],
                'province' => $s[6],
                'zip_code' => $s[7],
                'tax_id' => $s[8],
                'notes' => null,
                'is_active' => true,
            ]);
        }
    }
}
