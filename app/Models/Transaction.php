<?php

namespace App\Models;

use Database\Factories\TransactionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $reference_number
 * @property int $user_id
 * @property int|null $customer_id
 * @property float $subtotal
 * @property float $tax_amount
 * @property float $tax_rate
 * @property float $discount_amount
 * @property float $discount_percentage
 * @property float $total
 * @property float $tendered_amount
 * @property float $change_amount
 * @property string $status
 * @property string $payment_status
 * @property string|null $payment_method
 * @property string|null $notes
 * @property int $item_count
 * @property Carbon|null $voided_at
 * @property int|null $voided_by
 * @property string|null $void_reason
 * @property Carbon|null $refunded_at
 * @property int|null $refunded_by
 * @property string|null $refund_reason
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read Customer|null $customer
 * @property-read TransactionItem[] $items
 * @property-read Payment[] $payments
 * @property-read User|null $voidedBy
 * @property-read User|null $refundedBy
 */
#[Fillable(['reference_number', 'user_id', 'customer_id', 'subtotal', 'tax_amount', 'tax_rate', 'discount_amount', 'discount_percentage', 'total', 'tendered_amount', 'change_amount', 'status', 'payment_status', 'payment_method', 'notes', 'item_count', 'voided_at', 'voided_by', 'void_reason', 'refunded_at', 'refunded_by', 'refund_reason'])]
class Transaction extends Model
{
    /** @use HasFactory<TransactionFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'total' => 'decimal:2',
            'tendered_amount' => 'decimal:2',
            'change_amount' => 'decimal:2',
            'item_count' => 'integer',
            'voided_at' => 'datetime',
            'refunded_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Transaction $transaction) {
            if (empty($transaction->reference_number)) {
                $transaction->reference_number = 'INV-'.now()->format('Ymd').'-'.str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function refundedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'refunded_by');
    }
}
