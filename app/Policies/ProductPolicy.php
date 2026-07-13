<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Product $product): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Admin->value || $user->role === UserRole::Manager->value;
    }

    public function update(User $user, Product $product): bool
    {
        return $user->role === UserRole::Admin->value || $user->role === UserRole::Manager->value;
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->role === UserRole::Admin->value;
    }
}
