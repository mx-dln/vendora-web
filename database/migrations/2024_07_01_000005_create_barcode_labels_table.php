<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barcode_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type')->default('label')->comment('label, price_tag, shelf_tag');
            $table->string('page_width', 20)->default('80mm');
            $table->string('page_height', 20)->default('25mm');
            $table->string('label_width', 20)->default('70mm');
            $table->string('label_height', 20)->default('20mm');
            $table->integer('columns')->default(1);
            $table->integer('rows')->default(1);
            $table->string('barcode_type')->default('code128')->comment('code128, ean13, qr');
            $table->boolean('show_price')->default(true);
            $table->boolean('show_product_name')->default(true);
            $table->boolean('show_barcode')->default(true);
            $table->boolean('show_brand')->default(false);
            $table->integer('font_size')->default(8);
            $table->json('margins')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('goods_receivings', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number')->unique();
            $table->foreignId('purchase_order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->constrained();
            $table->date('received_date');
            $table->string('delivery_note')->nullable();
            $table->string('status')->default('received')->comment('received, partial, cancelled');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('goods_receiving_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goods_receiving_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('purchase_order_item_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->string('product_sku')->nullable();
            $table->decimal('quantity_ordered', 15, 2)->default(0);
            $table->decimal('quantity_received', 15, 2)->default(0);
            $table->decimal('quantity_damaged', 15, 2)->default(0);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('inventory_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number')->unique();
            $table->string('from_location')->default('main');
            $table->string('to_location')->default('warehouse');
            $table->foreignId('user_id')->constrained();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending')->comment('pending, approved, completed, cancelled');
            $table->text('notes')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('inventory_transfer_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_transfer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('quantity', 15, 2)->default(0);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('type')->default('percentage')->comment('percentage, fixed, buy_x_get_y, bogo, category_discount, happy_hour');
            $table->decimal('discount_value', 15, 2)->default(0);
            $table->decimal('min_purchase', 15, 2)->nullable();
            $table->integer('buy_quantity')->nullable();
            $table->integer('get_quantity')->nullable();
            $table->decimal('get_discount_percent', 5, 2)->nullable();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('happy_hour_start')->nullable();
            $table->string('happy_hour_end')->nullable();
            $table->json('days_of_week')->nullable();
            $table->integer('usage_limit')->nullable();
            $table->integer('usage_count')->default(0);
            $table->string('coupon_code')->nullable()->unique();
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('loyalty_rewards', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('tier')->default('regular')->comment('regular, silver, gold, platinum');
            $table->integer('points_required')->default(0);
            $table->string('reward_type')->default('discount')->comment('discount, free_product, free_shipping');
            $table->decimal('discount_value', 15, 2)->nullable();
            $table->string('discount_type')->nullable()->comment('percentage, fixed');
            $table->foreignId('free_product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('loyalty_points_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('transaction_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('loyalty_reward_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type')->comment('earned, redeemed, expired, adjusted');
            $table->integer('points');
            $table->decimal('transaction_amount', 15, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('backups', function (Blueprint $table) {
            $table->id();
            $table->string('filename');
            $table->string('filepath');
            $table->string('size')->nullable();
            $table->string('type')->default('manual')->comment('manual, scheduled');
            $table->string('status')->default('completed')->comment('completed, failed, in_progress');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backups');
        Schema::dropIfExists('loyalty_points_transactions');
        Schema::dropIfExists('loyalty_rewards');
        Schema::dropIfExists('promotions');
        Schema::dropIfExists('inventory_transfer_items');
        Schema::dropIfExists('inventory_transfers');
        Schema::dropIfExists('goods_receiving_items');
        Schema::dropIfExists('goods_receivings');
        Schema::dropIfExists('barcode_templates');
    }
};
