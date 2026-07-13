<?php

namespace App\Models;

use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string|null $email
 * @property string|null $phone
 * @property string|null $address
 * @property string|null $city
 * @property string|null $province
 * @property string|null $zip_code
 * @property float $total_purchases
 * @property int $visit_count
 * @property Carbon|null $last_visit_at
 * @property int $loyalty_points
 * @property string $loyalty_tier
 * @property int $total_points_earned
 * @property int $total_points_redeemed
 * @property string|null $notes
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read Transaction[] $transactions
 */
#[Fillable(['name', 'email', 'phone', 'address', 'city', 'province', 'zip_code', 'total_purchases', 'visit_count', 'last_visit_at', 'notes', 'is_active', 'loyalty_points', 'loyalty_tier', 'total_points_earned', 'total_points_redeemed'])]
class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'total_purchases' => 'decimal:2',
            'last_visit_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function loyaltyPointsTransactions(): HasMany
    {
        return $this->hasMany(LoyaltyPointsTransaction::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
