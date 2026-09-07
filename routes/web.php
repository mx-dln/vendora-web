<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AdvancedAnalyticsController;
use App\Http\Controllers\AssistantController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\BarcodeController;
use App\Http\Controllers\CashTransactionController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeploymentController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\GoodsReceivingController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\InventoryTransferController;
use App\Http\Controllers\LoyaltyController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnlineOrderController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\StockCountController;
use App\Http\Controllers\StoreSettingController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UserController;
use App\Models\User;
use App\Services\BarcodeGenerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

// Public routes
Route::get('/', [PublicController::class, 'index'])->name('home');
Route::prefix('shop')->name('public.')->group(function () {
    Route::get('/products', [PublicController::class, 'products'])->name('products');
    Route::get('/products/{slug}', [PublicController::class, 'product'])->name('product');
    Route::get('/categories/{slug}', [PublicController::class, 'category'])->name('category');
    Route::get('/promotions', [PublicController::class, 'promotions'])->name('promotions');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    // User Management
    Route::resource('users', UserController::class);

    // Product Management
    Route::resource('categories', CategoryController::class)->except(['create', 'edit', 'show']);
    Route::resource('products', ProductController::class)->except(['create', 'edit', 'show']);
    Route::get('products/print', [ProductController::class, 'printPdf'])->name('products.print');
    Route::get('products/export/csv', [ProductController::class, 'exportCsv'])->name('products.export.csv');

    Route::post('products/import/csv', [ProductController::class, 'importCsv'])->name('products.import.csv');

    // Customer Management
    Route::resource('customers', CustomerController::class)->except(['create', 'edit']);
    Route::get('customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');

    // Supplier Management
    Route::resource('suppliers', SupplierController::class)->except(['create', 'edit', 'show']);

    // POS Module
    Route::prefix('pos')->name('pos.')->group(function () {
        Route::get('/', [POSController::class, 'index'])->name('index');
        Route::get('/search', [POSController::class, 'search'])->name('search');
        Route::post('/process', [POSController::class, 'processTransaction'])->name('process');
        Route::post('/hold', [POSController::class, 'hold'])->name('hold');
        Route::get('/resume/{id}', [POSController::class, 'resume'])->name('resume');
        Route::delete('/held/{heldTransaction}', [POSController::class, 'destroyHeld'])->name('held.destroy');
    });

    Route::get('online-orders', [OnlineOrderController::class, 'index'])->name('online-orders.index');
    Route::patch('online-orders/{onlineOrder}', [OnlineOrderController::class, 'update'])->name('online-orders.update');

    // Sales
    Route::prefix('sales')->name('sales.')->group(function () {
        Route::get('/', [SaleController::class, 'index'])->name('index');
        Route::get('/{transaction}', [SaleController::class, 'show'])->name('show');
        Route::post('/{transaction}/void', [SaleController::class, 'void'])->name('void');
        Route::post('/items/{transactionItem}/void', [SaleController::class, 'voidItem'])->name('items.void');
        Route::get('/{transaction}/receipt', [SaleController::class, 'receipt'])->name('receipt');
    });

    // Inventory
    Route::prefix('inventory')->name('inventory.')->group(function () {
        Route::get('/', [InventoryController::class, 'index'])->name('index');
        Route::post('/{product}/stock-in', [InventoryController::class, 'stockIn'])->name('stock-in');
        Route::post('/{product}/stock-out', [InventoryController::class, 'stockOut'])->name('stock-out');
        Route::post('/{product}/adjust', [InventoryController::class, 'adjust'])->name('adjust');
        Route::get('/{product}/history', [InventoryController::class, 'history'])->name('history');
        Route::get('/{product}/print-history', [InventoryController::class, 'printHistory'])->name('print-history');
    });

    // Purchase Orders
    Route::resource('purchase-orders', PurchaseOrderController::class);
    Route::post('purchase-orders/{purchaseOrder}/send', [PurchaseOrderController::class, 'send'])->name('purchase-orders.send');
    Route::post('purchase-orders/{purchaseOrder}/cancel', [PurchaseOrderController::class, 'cancel'])->name('purchase-orders.cancel');
    Route::post('purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive'])->name('purchase-orders.receive');
    Route::get('purchase-orders/{purchaseOrder}/print', [PurchaseOrderController::class, 'print'])->name('purchase-orders.print');
    Route::get('purchase-orders-analytics', [PurchaseOrderController::class, 'analytics'])->name('purchase-orders.analytics');
    Route::get('purchase-orders-product-data', [PurchaseOrderController::class, 'productData'])->name('purchase-orders.product-data');

    // Stock Counts
    Route::resource('stock-counts', StockCountController::class)->except(['create', 'edit']);
    Route::post('/stock-counts/{stockCount}/start', [StockCountController::class, 'startCounting'])->name('stock-counts.start');
    Route::post('/stock-counts/{stockCount}/save', [StockCountController::class, 'saveProgress'])->name('stock-counts.save');
    Route::post('/stock-counts/{stockCount}/reconcile', [StockCountController::class, 'reconcile'])->name('stock-counts.reconcile');

    // Shifts
    Route::prefix('shifts')->name('shifts.')->group(function () {
        Route::get('/', [ShiftController::class, 'index'])->name('index');
        Route::post('/open', [ShiftController::class, 'open'])->name('open');
        Route::post('/{shift}/close', [ShiftController::class, 'close'])->name('close');
    });

    // Cash Transactions
    Route::post('/cash-transactions', [CashTransactionController::class, 'store'])->name('cash-transactions.store');

    // Expenses
    Route::resource('expenses', ExpenseController::class)->except(['create', 'edit', 'show']);
    Route::resource('expense-categories', ExpenseCategoryController::class)->except(['create', 'edit', 'show']);

    // Assistant
    Route::post('assistant/chat', [AssistantController::class, 'chat'])->name('assistant.chat');
    Route::post('assistant/chat/stream', [AssistantController::class, 'chatStream'])->name('assistant.chat.stream');
    Route::get('assistant/conversations', [AssistantController::class, 'conversations'])->name('assistant.conversations');
    Route::post('assistant/conversations', [AssistantController::class, 'storeConversation'])->name('assistant.conversations.store');
    Route::get('assistant/conversations/{assistantConversation}', [AssistantController::class, 'showConversation'])->name('assistant.conversations.show');
    Route::patch('assistant/conversations/{assistantConversation}', [AssistantController::class, 'updateConversation'])->name('assistant.conversations.update');
    Route::delete('assistant/conversations/{assistantConversation}', [AssistantController::class, 'destroyConversation'])->name('assistant.conversations.destroy');

    // Knowledge Base
    Route::get('settings/knowledge-base/data', [AssistantController::class, 'knowledgeData'])->name('settings.knowledge-base.data');
    Route::post('settings/knowledge-base', [AssistantController::class, 'knowledgeStore'])->name('settings.knowledge-base.store');
    Route::patch('settings/knowledge-base/{knowledgeArticle}', [AssistantController::class, 'knowledgeUpdate'])->name('settings.knowledge-base.update');
    Route::delete('settings/knowledge-base/{knowledgeArticle}', [AssistantController::class, 'knowledgeDestroy'])->name('settings.knowledge-base.destroy');

    // Activity Logs
    Route::get('activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');

    // Reports
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/sales', [ReportController::class, 'sales'])->name('sales');
        Route::get('/products', [ReportController::class, 'products'])->name('products');
        Route::get('/inventory', [ReportController::class, 'inventory'])->name('inventory');
        Route::get('/profit-loss', [ReportController::class, 'profitLoss'])->name('profit-loss');
        Route::get('/product-performance', [ReportController::class, 'productPerformance'])->name('product-performance');
        Route::get('/category-performance', [ReportController::class, 'categoryPerformance'])->name('category-performance');
        Route::get('/cashier-performance', [ReportController::class, 'cashierPerformance'])->name('cashier-performance');
    });

    // Barcode & Labels
    Route::get('barcodes', [BarcodeController::class, 'index'])->name('barcodes.index');
    Route::post('barcodes/print', [BarcodeController::class, 'print'])->name('barcodes.print');
    Route::get('barcodes/duplicates', [BarcodeController::class, 'duplicates'])->name('barcodes.duplicates');
    Route::post('barcodes/products/{product}/generate', [BarcodeController::class, 'generateForProduct'])->name('barcodes.products.generate');
    Route::post('barcodes/products/generate-new', function (Request $r) {
        return response()->json(['barcode' => app(BarcodeGenerationService::class)->generateBarcode()]);
    })->name('barcodes.products.generate-new');

    // Goods Receiving
    Route::resource('goods-receivings', GoodsReceivingController::class)->except(['create', 'edit', 'update']);

    // Inventory Transfers
    Route::get('inventory-transfers', [InventoryTransferController::class, 'index'])->name('inventory-transfers.index');
    Route::post('inventory-transfers', [InventoryTransferController::class, 'store'])->name('inventory-transfers.store');
    Route::post('inventory-transfers/{inventoryTransfer}/approve', [InventoryTransferController::class, 'approve'])->name('inventory-transfers.approve');
    Route::post('inventory-transfers/{inventoryTransfer}/complete', [InventoryTransferController::class, 'complete'])->name('inventory-transfers.complete');

    // Promotions
    Route::resource('promotions', PromotionController::class)->except(['create', 'edit', 'show']);

    // Loyalty
    Route::get('loyalty', [LoyaltyController::class, 'index'])->name('loyalty.index');
    Route::post('loyalty/rewards', [LoyaltyController::class, 'storeReward'])->name('loyalty.rewards.store');
    Route::get('loyalty/customers/{customer}', [LoyaltyController::class, 'customerHistory'])->name('loyalty.customers.history');

    // Backups
    Route::get('backups', [BackupController::class, 'index'])->name('backups.index');
    Route::post('backups', [BackupController::class, 'create'])->name('backups.create');
    Route::get('backups/{backup}/download', [BackupController::class, 'download'])->name('backups.download');
    Route::delete('backups/{backup}', [BackupController::class, 'destroy'])->name('backups.destroy');

    // Advanced Analytics
    Route::get('analytics', [AdvancedAnalyticsController::class, 'index'])->name('analytics.index');

    // Roles & Permissions
    Route::get('settings/roles/data', [RolesController::class, 'data'])->name('settings.roles.data');
    Route::patch('settings/roles/{role}', [RolesController::class, 'update'])->name('settings.roles.update');
    Route::post('settings/roles/assign', [RolesController::class, 'assignUser'])->name('settings.roles.assign');
    Route::post('settings/roles/{role}/clone', [RolesController::class, 'clone'])->name('settings.roles.clone');

    // Settings
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/store', [StoreSettingController::class, 'index'])->name('store.index');
        Route::post('/store', [StoreSettingController::class, 'update'])->name('store.update');
        Route::get('/deployment', [DeploymentController::class, 'settings'])->name('deployment');
        Route::post('/deployment', [DeploymentController::class, 'updateSettings'])->name('deployment.update');
    });
});

// Quick login for local development
if (app()->environment('local')) {
    Route::post('/auth/quick-login', function (Request $request) {
        $validated = $request->validate(['email' => ['required', 'email', 'exists:users,email']]);
        $user = User::where('email', $validated['email'])->first();
        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    })->name('auth.quick-login');
}

require __DIR__.'/settings.php';
