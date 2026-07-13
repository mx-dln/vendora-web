<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $user->fill($request->validated());

        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $filename = $user->id.'_'.time().'.'.$file->getClientOriginalExtension();
            $file->move(public_path('assets/avatar'), $filename);

            $oldAvatar = $user->getRawOriginal('avatar');
            if ($oldAvatar && $oldAvatar !== 'default.png' && ! str_starts_with($oldAvatar, 'pre-built-avatars/')) {
                $oldPath = public_path('assets/avatar/'.$oldAvatar);
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }

            $user->avatar = $filename;
        } elseif ($request->avatar_preset) {
            $presetPath = 'pre-built-avatars/'.$request->avatar_preset;
            if (file_exists(public_path('assets/avatar/'.$presetPath))) {
                $user->avatar = $presetPath;
            }
        }

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return redirect()->back()
            ->with('success', __('Profile updated.'));
    }

    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
