<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Product;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('notifications:generate')]
#[Description('Generate low stock/out of stock notifications for Owner users')]
class GenerateNotifications extends Command
{
    public function handle()
    {
        $owners = User::role('Owner')->get();
        $count = ['low_stock' => 0, 'out_of_stock' => 0];

        Product::with('category')->where('track_inventory', true)->chunk(100, function ($products) use ($owners, &$count) {
            foreach ($products as $product) {
                if ($product->stock_quantity <= 0) {
                    $this->createNotification($owners, 'out_of_stock', "{$product->name} is out of stock", "{$product->name} ({$product->sku}) has 0 stock. Restock immediately.", route('products.index', ['status' => 'out_of_stock']));
                    $count['out_of_stock']++;
                } elseif ($product->stock_quantity <= $product->low_stock_threshold) {
                    $this->createNotification($owners, 'low_stock', "{$product->name} is running low", "Only {$product->stock_quantity} left (threshold: {$product->low_stock_threshold}). Consider reordering.", route('products.index', ['status' => 'low_stock']));
                    $count['low_stock']++;
                }
            }
        });

        $this->info("Done. {$count['low_stock']} low stock, {$count['out_of_stock']} out of stock notifications generated.");
    }

    private function createNotification($users, string $type, string $title, string $body, string $link): void
    {
        foreach ($users as $user) {
            $existing = Notification::forUser($user->id)
                ->where('type', $type)
                ->where('title', $title)
                ->whereNull('read_at')
                ->exists();

            if (! $existing) {
                Notification::create([
                    'user_id' => $user->id,
                    'type' => $type,
                    'title' => $title,
                    'body' => $body,
                    'link' => $link,
                ]);
            }
        }
    }
}
