<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(User::class, 'user');
    }

    public function index(Request $request): Response
    {
        $users = User::when($request->search, fn ($q, $v) => $q->where('name', 'like', "%{$v}%")->orWhere('email', 'like', "%{$v}%"))
            ->when($request->role, fn ($q, $v) => $q->where('role', $v))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('users/index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('users/create');
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $user = User::create($request->validated());

        $roleMap = ['admin' => 'Owner', 'manager' => 'Manager', 'cashier' => 'Cashier'];
        $spatieRole = $roleMap[$request->role] ?? null;
        if ($spatieRole) {
            $user->assignRole($spatieRole);
        }

        AuditService::log('created', 'user', $user, null, $user->toArray(), "Created user: {$user->name}");

        return redirect()->route('users.index')
            ->with('success', 'User created successfully.');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('users/edit', [
            'user' => $user,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();
        if (empty($data['password'])) {
            unset($data['password']);
        }
        $user->update($data);

        $roleMap = ['admin' => 'Owner', 'manager' => 'Manager', 'cashier' => 'Cashier'];
        $spatieRole = $roleMap[$request->role] ?? null;
        if ($spatieRole) {
            $user->syncRoles([$spatieRole]);
        }

        AuditService::log('updated', 'user', $user, null, $data, "Updated user: {$user->name}");

        return redirect()->route('users.index')
            ->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        AuditService::log('deleted', 'user', $user, $user->toArray(), null, "Deleted user: {$user->name}");
        $user->delete();

        return redirect()->route('users.index')
            ->with('success', 'User deleted successfully.');
    }
}
