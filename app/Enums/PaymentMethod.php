<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case Gcash = 'gcash';
    case Maya = 'maya';
    case Mixed = 'mixed';
}
