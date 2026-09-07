<?php

namespace App\Models;

use Database\Factories\OnlineOrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $reference_number
 * @property string|null $customer_name
 * @property string|null $customer_phone
 * @property string|null $customer_email
 * @property string|null $delivery_address
 * @property string $order_type
 * @property string $status
 * @property string $payment_status
 * @property string $total
 * @property int $item_count
 * @property string|null $notes
 * @property Carbon|null $requested_at
 * @property Carbon|null $fulfilled_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['reference_number', 'customer_name', 'customer_phone', 'customer_email', 'delivery_address', 'order_type', 'status', 'payment_status', 'total', 'item_count', 'notes', 'requested_at', 'fulfilled_at'])]
class OnlineOrder extends Model
{
    /** @use HasFactory<OnlineOrderFactory> */
    use HasFactory;

    protected $attributes = [
        'order_type' => 'pickup',
        'status' => 'pending',
        'payment_status' => 'unpaid',
        'total' => 0,
        'item_count' => 0,
    ];

    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
            'item_count' => 'integer',
            'requested_at' => 'datetime',
            'fulfilled_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (OnlineOrder $order) {
            if (empty($order->reference_number)) {
                $order->reference_number = 'WEB-'.now()->format('Ymd').'-'.str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            }
        });
    }
}
