export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    parent_id: number | null;
    is_active: boolean;
    color: string | null;
    sort_order: number;
    products_count?: number;
    parent?: Category;
    children?: Category[];
    created_at: string;
    updated_at: string;
}

export interface ProductVariant {
    id: number;
    product_id: number;
    name: string;
    sku: string | null;
    barcode: string | null;
    cost_price: number;
    selling_price: number;
    wholesale_price: number | null;
    stock_quantity: number;
    low_stock_threshold: number;
    attributes: Record<string, string> | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: number;
    name: string;
    brand: string | null;
    slug: string;
    description: string | null;
    sku: string | null;
    barcode: string | null;
    barcode_type: string | null;
    category_id: number | null;
    category?: Category;
    cost_price: number;
    selling_price: number;
    wholesale_price: number | null;
    stock_quantity: number;
    low_stock_threshold: number;
    reorder_quantity: number | null;
    unit: string | null;
    track_inventory: boolean;
    has_variants: boolean;
    is_active: boolean;
    status: string;
    image: string | null;
    notes: string | null;
    preferred_supplier_id: number | null;
    preferred_supplier?: Supplier;
    variants?: ProductVariant[];
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    zip_code: string | null;
    total_purchases: number;
    visit_count: number;
    last_visit_at: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    transactions?: Transaction[];
}

export interface Supplier {
    id: number;
    name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    zip_code: string | null;
    tax_id: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Transaction {
    id: number;
    reference_number: string;
    user_id: number;
    user?: User;
    customer_id: number | null;
    customer?: Customer | null;
    subtotal: number;
    tax_amount: number;
    tax_rate: number;
    discount_amount: number;
    discount_percentage: number;
    total: number;
    tendered_amount: number;
    change_amount: number;
    status: 'completed' | 'voided' | 'refunded';
    payment_status: 'paid' | 'partial' | 'unpaid';
    payment_method: string | null;
    notes: string | null;
    item_count: number;
    items?: TransactionItem[];
    payments?: Payment[];
    voided_at: string | null;
    voided_by: number | null;
    voidedBy?: User | null;
    void_reason: string | null;
    refunded_at: string | null;
    refunded_by: number | null;
    refundedBy?: User | null;
    refund_reason: string | null;
    created_at: string;
    updated_at: string;
}

export interface TransactionItem {
    id: number;
    transaction_id: number;
    product_id: number | null;
    product_variant_id: number | null;
    product_name: string;
    product_sku: string | null;
    product_barcode: string | null;
    unit_price: number;
    cost_price: number;
    quantity: number;
    subtotal: number;
    discount_amount: number;
    discount_percentage: number;
    tax_amount: number;
    total: number;
    unit: string | null;
    notes: string | null;
    transaction?: Transaction;
    product?: Product;
    variant?: ProductVariant;
}

export interface Payment {
    id: number;
    transaction_id: number;
    payment_method: string;
    amount: number;
    reference_number: string | null;
    notes: string | null;
    transaction?: Transaction;
}

export interface InventoryMovement {
    id: number;
    product_id: number | null;
    product_variant_id: number | null;
    type: 'stock_in' | 'stock_out' | 'adjustment' | 'return' | 'sale' | 'initial';
    quantity: number;
    quantity_before: number;
    quantity_after: number;
    unit_cost: number | null;
    reference_type: string | null;
    reference_id: number | null;
    user_id: number | null;
    user?: User;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface HeldTransaction {
    id: number;
    user_id: number;
    label: string;
    cart_data: CartItem[];
    customer_data: { customer_id?: number; customer_name?: string } | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface CartItem {
    product_id: number;
    product_variant_id?: number;
    name: string;
    brand?: string | null;
    sku: string | null;
    barcode: string | null;
    unit_price: number;
    quantity: number;
    subtotal: number;
    image: string | null;
    notes?: string;
    stock_quantity: number;
}

export interface DashboardStats {
    today_sales: number;
    today_transactions: number;
    monthly_sales: number;
    monthly_transactions: number;
    average_sale: number;
    total_products: number;
    low_stock_count: number;
    out_of_stock_count: number;
}

export interface RevenueData {
    month: string;
    revenue: number;
    transactions: number;
}

export interface DailySalesReport {
    date: string;
    total_sales: number;
    total_transactions: number;
    average_sale: number;
    total_items: number;
    total_discounts: number;
    total_tax: number;
    payment_breakdown: Record<string, { count: number; total: number }>;
    hourly_breakdown: Array<{ hour: string; count: number; total: number }>;
}

export interface MonthlySalesReport {
    year: number;
    month: number;
    total_sales: number;
    total_transactions: number;
    average_sale: number;
    total_items: number;
    total_discounts: number;
    total_tax: number;
    daily_breakdown: Array<{ date: string; count: number; total: number }>;
}

export interface TopProduct {
    product_id: number;
    product_name: string;
    total_quantity: number;
    total_revenue: number;
}

export interface InventoryReport {
    total_products: number;
    active_products: number;
    low_stock: number;
    out_of_stock: number;
    total_stock_value: number;
    total_retail_value: number;
}

export interface PurchaseOrder {
    id: number;
    reference_number: string;
    supplier_id: number | null;
    supplier?: Supplier | null;
    user_id: number;
    user?: User;
    order_date: string;
    expected_date: string | null;
    status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    shipping_cost: number;
    total: number;
    notes: string | null;
    items?: PurchaseOrderItem[];
    created_at: string;
    updated_at: string;
}

export interface PurchaseOrderItem {
    id: number;
    purchase_order_id: number;
    product_id: number | null;
    product_name: string;
    product_sku: string | null;
    quantity_ordered: number;
    quantity_received: number;
    unit_cost: number;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
}

export interface StockCount {
    id: number;
    reference_number: string;
    user_id: number;
    user?: User;
    type: 'full' | 'spot';
    status: 'draft' | 'counting' | 'reconciled';
    notes: string | null;
    counted_at: string | null;
    reconciled_at: string | null;
    reconciled_by: number | null;
    reconciledBy?: User | null;
    items?: StockCountItem[];
    created_at: string;
    updated_at: string;
}

export interface StockCountItem {
    id: number;
    stock_count_id: number;
    product_id: number | null;
    product?: Product;
    expected_qty: number;
    counted_qty: number | null;
    difference_qty: number;
    notes: string | null;
}

export interface Shift {
    id: number;
    user_id: number;
    user?: User;
    opened_at: string | null;
    closed_at: string | null;
    opening_balance: number;
    closing_balance: number | null;
    expected_balance: number | null;
    difference: number | null;
    status: 'open' | 'closed';
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface CashTransaction {
    id: number;
    shift_id: number | null;
    shift?: Shift;
    user_id: number;
    user?: User;
    type: 'cash_in' | 'cash_out' | 'petty_cash';
    amount: number;
    category: string | null;
    reference_type: string | null;
    reference_id: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface ExpenseCategory {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    expenses_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Expense {
    id: number;
    expense_category_id: number | null;
    category?: ExpenseCategory | null;
    user_id: number;
    user?: User;
    shift_id: number | null;
    shift?: Shift;
    description: string;
    amount: number;
    expense_date: string;
    payment_method: string;
    receipt_image: string | null;
    reference_number: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface ActivityLog {
    id: number;
    user_id: number | null;
    user?: User | null;
    action: string;
    module: string;
    reference_type: string | null;
    reference_id: number | null;
    description: string | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    updated_at: string;
}

export interface ProfitLossReport {
    total_sales: number;
    cost_of_goods_sold: number;
    gross_profit: number;
    gross_margin: number;
    total_expenses: number;
    net_profit: number;
    net_margin: number;
}

export interface ProductPerformanceItem {
    product_id: number;
    product_name: string;
    total_quantity: number;
    total_revenue: number;
    total_cost: number;
    total_profit: number;
}

export interface StoreSettings {
    store_name?: string;
    store_address?: string;
    store_city?: string;
    store_province?: string;
    store_zip?: string;
    store_phone?: string;
    store_email?: string;
    store_tin?: string;
    receipt_footer?: string;
    receipt_show_logo?: boolean;
    receipt_show_tax?: boolean;
    receipt_show_discount?: boolean;
    tax_rate?: number;
    currency_symbol?: string;
    currency_code?: string;
}

export interface GoodsReceiving {
    id: number;
    reference_number: string;
    purchase_order_id: number | null;
    purchase_order?: PurchaseOrder | null;
    supplier_id: number | null;
    supplier?: Supplier | null;
    user_id: number;
    user?: User;
    received_date: string;
    delivery_note: string | null;
    status: 'received' | 'partial' | 'cancelled';
    item_count: number;
    notes: string | null;
    items?: GoodsReceivingItem[];
    movements?: InventoryMovement[];
    created_at: string;
    updated_at: string;
}

export interface GoodsReceivingItem {
    id: number;
    goods_receiving_id: number;
    product_id: number;
    product?: Product;
    product_name: string;
    qty_ordered: number;
    qty_received: number;
    qty_damaged: number;
    unit_cost: number;
    subtotal: number;
    created_at: string;
    updated_at: string;
}

export interface InventoryTransfer {
    id: number;
    reference_number: string;
    from_location_id: number;
    from_location?: { id: number; name: string };
    to_location_id: number;
    to_location?: { id: number; name: string };
    user_id: number;
    user?: User;
    status: 'pending' | 'approved' | 'completed' | 'cancelled';
    item_count: number;
    notes: string | null;
    items?: InventoryTransferItem[];
    created_at: string;
    updated_at: string;
}

export interface InventoryTransferItem {
    id: number;
    inventory_transfer_id: number;
    product_id: number;
    product?: Product;
    product_name: string;
    quantity: number;
    created_at: string;
    updated_at: string;
}

export type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

export interface KnowledgeArticle {
    id: number;
    title: string;
    slug: string;
    category: string;
    keywords: string | null;
    content: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AssistantConversation {
    id: number;
    title: string;
    created_at: string;
}

export interface AssistantMessage {
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}
