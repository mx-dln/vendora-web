<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissionsByGroup = [
            'Sales' => ['sales.view', 'sales.create', 'sales.void', 'sales.refund'],
            'Products' => ['products.view', 'products.create', 'products.edit', 'products.delete'],
            'Inventory' => ['inventory.view', 'inventory.adjust', 'inventory.stock_count', 'inventory.transfer'],
            'Customers' => ['customers.view', 'customers.create', 'customers.edit', 'customers.delete'],
            'Expenses' => ['expenses.view', 'expenses.create', 'expenses.edit', 'expenses.approve', 'expenses.delete'],
            'Purchase Orders' => ['purchase_orders.view', 'purchase_orders.create', 'purchase_orders.edit', 'purchase_orders.approve', 'purchase_orders.delete'],
            'Reports' => ['reports.view', 'reports.export'],
            'Users' => ['users.view', 'users.create', 'users.edit', 'users.delete'],
            'Roles & Permissions' => ['roles.view', 'roles.manage'],
            'Settings' => ['settings.view', 'settings.manage'],
            'AI Assistant' => ['assistant.use', 'assistant.admin'],
        ];

        $allPermissions = [];
        foreach ($permissionsByGroup as $group => $perms) {
            foreach ($perms as $perm) {
                $allPermissions[] = Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
            }
        }

        // Owner — all permissions
        $owner = Role::firstOrCreate(['name' => 'Owner', 'guard_name' => 'web']);
        $owner->syncPermissions($allPermissions);

        // Manager — operational permissions
        $manager = Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);
        $managerPermissions = [
            'sales.view', 'sales.create', 'sales.void',
            'products.view', 'products.create', 'products.edit',
            'inventory.view', 'inventory.adjust', 'inventory.stock_count', 'inventory.transfer',
            'customers.view', 'customers.create', 'customers.edit',
            'expenses.view', 'expenses.create', 'expenses.edit',
            'purchase_orders.view', 'purchase_orders.create', 'purchase_orders.edit',
            'reports.view',
            'assistant.use',
        ];
        $manager->syncPermissions(Permission::whereIn('name', $managerPermissions)->get());

        // Cashier — limited to sales and customers
        $cashier = Role::firstOrCreate(['name' => 'Cashier', 'guard_name' => 'web']);
        $cashierPermissions = [
            'sales.view', 'sales.create',
            'customers.view', 'customers.create',
            'assistant.use',
        ];
        $cashier->syncPermissions(Permission::whereIn('name', $cashierPermissions)->get());

        // Future-ready roles
        Role::firstOrCreate(['name' => 'Accountant', 'guard_name' => 'web']);

        // Assign roles to existing users based on their `role` column
        $this->assignRolesFromColumn();

        $this->command->info('Roles and permissions seeded successfully.');
    }

    private function assignRolesFromColumn(): void
    {
        $roleMap = [
            'admin' => 'Owner',
            'manager' => 'Manager',
            'cashier' => 'Cashier',
        ];

        foreach (User::all() as $user) {
            $roleName = $roleMap[$user->getRawOriginal('role')] ?? null;
            if ($roleName && ! $user->hasRole($roleName)) {
                $user->assignRole($roleName);
            }
        }
    }
}
