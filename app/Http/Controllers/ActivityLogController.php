<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    public function index(Request $request): Response
    {
        $logs = ActivityLog::with('user:id,name')
            ->when($request->search, fn ($q, $v) => $q->where('description', 'like', "%{$v}%"))
            ->when($request->action, fn ($q, $v) => $q->where('action', $v))
            ->when($request->module, fn ($q, $v) => $q->where('module', $v))
            ->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('activity-logs/index', [
            'logs' => $logs,
            'filters' => $request->only(['search', 'action', 'module', 'sort', 'order']),
        ]);
    }
}
