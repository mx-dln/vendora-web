<?php

namespace App\Enums;

enum TransactionStatus: string
{
    case Completed = 'completed';
    case Voided = 'voided';
    case Refunded = 'refunded';
}
