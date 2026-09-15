<?php

namespace App\Http\Middleware;

use App\Models\StoreSetting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user() ? $request->user()->load('roles') : null,
            ],
            'app_env' => app()->environment(),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'storeSettings' => StoreSetting::publicSettings(),
            'unreadNotifications' => $request->user()
                ? $request->user()->unreadNotifications()->count()
                : 0,
            'canUseAssistant' => ($request->user()?->can('assistant.use') ?? false) && StoreSetting::hasAiApiKey(),
        ];
    }
}
