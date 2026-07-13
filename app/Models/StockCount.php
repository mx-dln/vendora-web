<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockCount extends Model
{
    use HasFactory;

    protected $fillable = ['reference_number', 'user_id', 'type', 'status', 'notes', 'counted_at', 'reconciled_at', 'reconciled_by'];

    protected function casts(): array
    {
        return [
            'counted_at' => 'datetime',
            'reconciled_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reconciledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reconciled_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockCountItem::class);
    }

    public function scopeDraft($q)
    {
        return $q->where('status', 'draft');
    }

    public function scopeCounting($q)
    {
        return $q->where('status', 'counting');
    }

    public function scopeReconciled($q)
    {
        return $q->where('status', 'reconciled');
    }

    protected static function booted(): void
    {
        static::creating(function ($sc) {
            $sc->reference_number = 'SC-'.now()->format('Ymd').'-'.str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        });
    }
}
