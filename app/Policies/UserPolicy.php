<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::Admin->value || $user->role === UserRole::Manager->value;
    }

    public function view(User $user, User $model): bool
    {
        return $user->role === UserRole::Admin->value || $user->role === UserRole::Manager->value;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Admin->value;
    }

    public function update(User $user, User $model): bool
    {
        return $user->role === UserRole::Admin->value;
    }

    public function delete(User $user, User $model): bool
    {
        return $user->role === UserRole::Admin->value && $user->id !== $model->id;
    }
}
