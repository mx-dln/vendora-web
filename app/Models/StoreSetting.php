<?php

namespace App\Models;

use Database\Factories\StoreSettingFactory;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;

/**
 * @property int $id
 * @property string $key
 * @property string|null $value
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['key', 'value'])]
class StoreSetting extends Model
{
    /** @use HasFactory<StoreSettingFactory> */
    use HasFactory;

    private const ENCRYPTED_KEYS = [
        'ai_openai_api_key',
    ];

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();

        if (! $setting) {
            return $default;
        }

        if (static::isEncryptedKey($key)) {
            return static::decryptValue($setting->value) ?? $default;
        }

        return $setting->value ?? $default;
    }

    public static function setValue(string $key, mixed $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => static::prepareValue($key, $value)]
        );
    }

    public static function publicSettings(): array
    {
        $settings = static::all()->pluck('value', 'key')->toArray();

        foreach (self::ENCRYPTED_KEYS as $key) {
            if (array_key_exists($key, $settings)) {
                $settings[$key] = '';
                $settings["{$key}_configured"] = '1';
            }
        }

        return $settings;
    }

    public static function hasAiApiKey(): bool
    {
        return filled(static::getValue('ai_openai_api_key', config('openai.api_key')));
    }

    private static function prepareValue(string $key, mixed $value): string
    {
        $stringValue = is_bool($value) ? ($value ? '1' : '0') : (string) $value;

        if (static::isEncryptedKey($key)) {
            return Crypt::encryptString($stringValue);
        }

        return $stringValue;
    }

    private static function decryptValue(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        try {
            return Crypt::decryptString($value);
        } catch (DecryptException) {
            return $value;
        }
    }

    private static function isEncryptedKey(string $key): bool
    {
        return in_array($key, self::ENCRYPTED_KEYS, true);
    }
}
