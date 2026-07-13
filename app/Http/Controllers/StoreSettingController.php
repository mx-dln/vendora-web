<?php

namespace App\Http\Controllers;

use App\Models\StoreSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StoreSettingController extends Controller
{
    public function index(): Response
    {
        $settings = StoreSetting::all()->pluck('value', 'key')->toArray();

        return Inertia::render('settings/store/index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'store_name' => ['nullable', 'string', 'max:255'],
            'store_address' => ['nullable', 'string'],
            'store_city' => ['nullable', 'string', 'max:100'],
            'store_province' => ['nullable', 'string', 'max:100'],
            'store_zip' => ['nullable', 'string', 'max:20'],
            'store_phone' => ['nullable', 'string', 'max:50'],
            'store_email' => ['nullable', 'email', 'max:255'],
            'store_tin' => ['nullable', 'string', 'max:50'],
            'receipt_footer' => ['nullable', 'string'],
            'receipt_width' => ['nullable', 'string', 'in:58,80'],
            'receipt_show_logo' => ['boolean'],
            'receipt_show_tax' => ['boolean'],
            'receipt_show_discount' => ['boolean'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'currency_symbol' => ['nullable', 'string', 'max:10'],
            'currency_code' => ['nullable', 'string', 'max:10'],
        ]);

        foreach ($validated as $key => $value) {
            StoreSetting::updateOrCreate(
                ['key' => $key],
                ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
            );
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => 'Settings updated successfully.']);
        }

        return redirect()->back()
            ->with('success', 'Settings updated successfully.');
    }
}
