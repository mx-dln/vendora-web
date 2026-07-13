<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->integer('loyalty_points')->default(0)->after('notes');
            $table->string('loyalty_tier')->default('regular')->after('loyalty_points')->comment('regular, silver, gold, platinum');
            $table->integer('total_points_earned')->default(0)->after('loyalty_tier');
            $table->integer('total_points_redeemed')->default(0)->after('total_points_earned');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['loyalty_points', 'loyalty_tier', 'total_points_earned', 'total_points_redeemed']);
        });
    }
};
