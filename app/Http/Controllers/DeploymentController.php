<?php

namespace App\Http\Controllers;

use App\Models\StoreSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeploymentController extends Controller
{
    public function settings()
    {
        $settings = StoreSetting::all()->pluck('value', 'key')->toArray();

        return Inertia::render('settings/deployment', [
            'settings' => $settings,
            'sessionData' => \DB::table('sessions')->whereNotNull('user_id')->with('user')->get(),
        ]);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'printer_name' => ['nullable', 'string', 'max:255'],
            'printer_interface' => ['nullable', 'string', 'max:50'],
            'cash_drawer_enabled' => ['boolean'],
            'email_driver' => ['nullable', 'string', 'max:50'],
            'email_host' => ['nullable', 'string', 'max:255'],
            'email_port' => ['nullable', 'integer'],
            'email_username' => ['nullable', 'string', 'max:255'],
            'email_password' => ['nullable', 'string', 'max:255'],
            'email_encryption' => ['nullable', 'string', 'max:50'],
            'email_from_address' => ['nullable', 'email', 'max:255'],
            'email_from_name' => ['nullable', 'string', 'max:255'],
            'sms_provider' => ['nullable', 'string', 'max:50'],
            'sms_api_key' => ['nullable', 'string', 'max:255'],
            'sms_from_number' => ['nullable', 'string', 'max:50'],
            'maintenance_mode' => ['boolean'],
        ]);

        foreach ($validated as $key => $value) {
            StoreSetting::updateOrCreate(
                ['key' => $key],
                ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
            );
        }

        if ($request->boolean('maintenance_mode')) {
            \Artisan::call('down', ['--secret' => 'vendora-secret']);
        } else {
            \Artisan::call('up');
        }

        return redirect()->back()->with('success', 'Deployment settings updated.');
    }
}
