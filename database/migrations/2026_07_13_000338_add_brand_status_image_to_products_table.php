<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'status')) {
                $table->string('status')->default('active')->after('is_active')->comment('active, inactive, discontinued');
            }
            if (! Schema::hasColumn('products', 'reorder_quantity')) {
                $table->decimal('reorder_quantity', 15, 2)->nullable()->after('low_stock_threshold');
            }
            if (! Schema::hasColumn('products', 'preferred_supplier_id')) {
                $table->foreignId('preferred_supplier_id')->nullable()->after('reorder_quantity')->constrained('suppliers')->nullOnDelete();
            }
            if (! Schema::hasColumn('products', 'wholesale_price')) {
                $table->decimal('wholesale_price', 15, 2)->nullable()->after('selling_price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('preferred_supplier_id');
            $table->dropColumn(['status', 'reorder_quantity', 'wholesale_price']);
        });
    }
};
