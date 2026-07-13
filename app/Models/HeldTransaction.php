<?php

namespace App\Models;

use Database\Factories\HeldTransactionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $label
 * @property array $cart_data
 * @property array|null $customer_data
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 */
#[Fillable(['user_id', 'label', 'cart_data', 'customer_data', 'notes'])]
class HeldTransaction extends Model
{
    /** @use HasFactory<HeldTransactionFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'cart_data' => 'array',
            'customer_data' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
