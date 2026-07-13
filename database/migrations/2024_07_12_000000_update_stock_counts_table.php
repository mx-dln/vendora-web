<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_counts', function (Blueprint $table) {
            $table->string('status')->default('draft')->change();
        });

        Schema::table('stock_count_items', function (Blueprint $table) {
            $table->renameColumn('expected_quantity', 'expected_qty');
            $table->renameColumn('counted_quantity', 'counted_qty');
            $table->renameColumn('difference', 'difference_qty');
        });
    }

    public function down(): void
    {
        Schema::table('stock_count_items', function (Blueprint $table) {
            $table->renameColumn('expected_qty', 'expected_quantity');
            $table->renameColumn('counted_qty', 'counted_quantity');
            $table->renameColumn('difference_qty', 'difference');
        });
    }
};
