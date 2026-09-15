<?php

use App\Models\Category;
use App\Models\OnlineOrder;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    cache()->flush();
});

test('returns a successful response', function () {
    $response = $this->get(route('home'));

    $response->assertOk();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('public/index')
        ->has('stats')
        ->has('newest')
        ->has('bestsellers')
        ->has('categories')
        ->has('store'),
    );
});

test('public shop pages render', function (string $routeName) {
    $response = $this->get(route($routeName));

    $response->assertOk();
})->with([
    'products' => 'public.products',
    'promotions' => 'public.promotions',
]);

test('disabled storefront redirects visitors to login', function () {
    StoreSetting::create([
        'key' => 'storefront_enabled',
        'value' => '0',
    ]);

    $response = $this->get(route('home'));

    $response->assertRedirect(route('login'));
});

test('online orders page renders for authenticated users', function () {
    $user = User::factory()->create();
    OnlineOrder::factory()->create([
        'reference_number' => 'WEB-TEST-001',
        'order_type' => 'delivery',
        'status' => 'pending',
    ]);

    $response = $this->actingAs($user)->get(route('online-orders.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('online-orders/index')
        ->has('orders.data', 1)
        ->where('onlineOrderingEnabled', false),
    );
});

test('store settings mask and preserve configured openai api key', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('settings.store.update'), [
        'store_name' => 'Vendora Store',
        'store_email' => 'owner@example.com',
        'receipt_width' => '80',
        'receipt_show_logo' => true,
        'receipt_show_tax' => true,
        'receipt_show_discount' => true,
        'tax_rate' => '0',
        'currency_symbol' => 'PHP',
        'currency_code' => 'PHP',
        'storefront_enabled' => true,
        'online_ordering_enabled' => true,
        'ai_provider' => 'openai',
        'ai_model' => 'gpt-4.1',
        'ai_openai_api_key' => 'sk-test-secret',
    ])->assertRedirect();

    expect(StoreSetting::where('key', 'ai_openai_api_key')->value('value'))
        ->not->toBe('sk-test-secret')
        ->and(StoreSetting::getValue('ai_openai_api_key'))
        ->toBe('sk-test-secret');

    $this->actingAs($user)
        ->get(route('settings.store.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/store/index')
            ->where('settings.ai_openai_api_key', '')
            ->where('settings.ai_openai_api_key_configured', '1')
            ->where('settings.ai_model', 'gpt-4.1'),
        );

    $this->actingAs($user)->post(route('settings.store.update'), [
        'store_name' => 'Vendora Store',
        'store_email' => 'owner@example.com',
        'receipt_width' => '80',
        'receipt_show_logo' => true,
        'receipt_show_tax' => true,
        'receipt_show_discount' => true,
        'tax_rate' => '0',
        'currency_symbol' => 'PHP',
        'currency_code' => 'PHP',
        'storefront_enabled' => true,
        'online_ordering_enabled' => true,
        'ai_provider' => 'openai',
        'ai_model' => 'gpt-4.1-mini',
        'ai_openai_api_key' => '',
    ])->assertRedirect();

    expect(StoreSetting::getValue('ai_openai_api_key'))->toBe('sk-test-secret');
});

test('assistant availability requires configured api key', function () {
    config(['openai.api_key' => null]);
    $this->seed(RolesAndPermissionsSeeder::class);

    $user = User::factory()->create(['role' => 'admin']);
    $user->assignRole('Owner');

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('canUseAssistant', false),
        );

    StoreSetting::setValue('ai_openai_api_key', 'sk-test-secret');

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('canUseAssistant', true),
        );
});

test('online order status can be updated', function () {
    $user = User::factory()->create();
    $order = OnlineOrder::factory()->create([
        'order_type' => 'pickup',
        'status' => 'pending',
        'payment_status' => 'unpaid',
    ]);

    $response = $this->actingAs($user)->patch(route('online-orders.update', $order), [
        'order_type' => 'delivery',
        'status' => 'completed',
        'payment_status' => 'paid',
    ]);

    $response->assertRedirect();

    expect($order->refresh())
        ->order_type->toBe('delivery')
        ->status->toBe('completed')
        ->payment_status->toBe('paid')
        ->fulfilled_at->not->toBeNull();
});

test('assistant returns exact invoice line items from system data', function () {
    StoreSetting::setValue('ai_openai_api_key', 'sk-test-secret');
    $this->seed(RolesAndPermissionsSeeder::class);

    $user = User::factory()->create(['role' => 'admin']);
    $user->assignRole('Owner');

    $transaction = Transaction::factory()->create([
        'user_id' => $user->id,
        'reference_number' => 'INV-20260713-638864',
        'subtotal' => 350,
        'total' => 350,
        'item_count' => 10,
    ]);

    TransactionItem::factory()->create([
        'transaction_id' => $transaction->id,
        'product_name' => 'Beef Loaf 340g',
        'quantity' => 10,
        'unit_price' => 35,
        'total' => 350,
    ]);

    $response = $this->actingAs($user)->postJson(route('assistant.chat'), [
        'message' => 'What products did they bought here INV-20260713-638864',
    ]);

    $response->assertOk()
        ->assertJsonPath('conversation_id', fn ($id) => is_int($id));

    expect($response->json('message'))
        ->toContain('Beef Loaf 340g')
        ->toContain('INV-20260713-638864')
        ->toContain('<vendora-json>');
});

test('assistant returns product availability from system data', function () {
    StoreSetting::setValue('ai_openai_api_key', 'sk-test-secret');
    $this->seed(RolesAndPermissionsSeeder::class);

    $user = User::factory()->create(['role' => 'admin']);
    $user->assignRole('Owner');
    $category = Category::factory()->create(['name' => 'Canned Goods']);

    Product::create([
        'category_id' => $category->id,
        'name' => 'Beef Loaf 340g',
        'slug' => 'beef-loaf-340g',
        'description' => null,
        'sku' => 'SKU-BEEF001',
        'barcode' => '4800000000001',
        'cost_price' => 25,
        'selling_price' => 35,
        'wholesale_price' => 31.50,
        'stock_quantity' => 22,
        'low_stock_threshold' => 10,
        'reorder_quantity' => 40,
        'unit' => 'can',
        'track_inventory' => true,
        'has_variants' => false,
        'status' => 'active',
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->postJson(route('assistant.chat'), [
        'message' => 'Do we have beef loaf product?',
    ]);

    $response->assertOk();

    expect($response->json('message'))
        ->toContain('Beef Loaf 340g')
        ->toContain('22 can in stock')
        ->toContain('<vendora-json>');
});

test('assistant top products question is not hijacked by previous invoice context', function () {
    StoreSetting::setValue('ai_openai_api_key', 'sk-test-secret');
    $this->seed(RolesAndPermissionsSeeder::class);

    $user = User::factory()->create(['role' => 'admin']);
    $user->assignRole('Owner');

    $transaction = Transaction::factory()->create([
        'user_id' => $user->id,
        'reference_number' => 'INV-20260711-202016',
        'subtotal' => 350,
        'total' => 350,
        'item_count' => 10,
    ]);

    TransactionItem::factory()->create([
        'transaction_id' => $transaction->id,
        'product_name' => 'Beef Loaf 340g',
        'quantity' => 10,
        'unit_price' => 35,
        'total' => 350,
    ]);

    $firstResponse = $this->actingAs($user)->postJson(route('assistant.chat'), [
        'message' => 'What product sold here INV-20260711-202016',
    ]);

    $conversationId = $firstResponse->json('conversation_id');

    TransactionItem::factory()->create([
        'transaction_id' => $transaction->id,
        'product_name' => 'Mountain Dew 500ml',
        'quantity' => 20,
        'unit_price' => 22,
        'total' => 440,
    ]);

    $response = $this->actingAs($user)->postJson(route('assistant.chat'), [
        'message' => 'What product is top selling?',
        'conversation_id' => $conversationId,
    ]);

    $response->assertOk();

    expect($response->json('message'))
        ->toContain('Top-selling products')
        ->toContain('Mountain Dew 500ml')
        ->not->toContain('Invoice INV-20260711-202016 sold');
});
