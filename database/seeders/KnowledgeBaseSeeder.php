<?php

namespace Database\Seeders;

use App\Models\KnowledgeArticle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class KnowledgeBaseSeeder extends Seeder
{
    public function run(): void
    {
        KnowledgeArticle::truncate();

        $articles = [
            // ─── General ───
            [
                'title' => 'Understanding the Dashboard',
                'category' => 'general',
                'keywords' => 'dashboard, overview, kpi, operations, today, sales summary, metrics',
                'content' => "**Operations Center (Dashboard)**\n\nThe Dashboard gives you a real-time snapshot of today's business performance.\n\n**KPI Cards (Top Row):**\n- **Sales Today:** Total revenue from completed transactions today\n- **Profit:** Estimated gross profit (selling price minus cost price)\n- **Transactions:** Number of completed sales\n- **Average Sale:** Average value per transaction\n- **Low Stock Count:** Products below their reorder threshold\n\n**Charts & Sections:**\n- **Sales Trend:** 7-day revenue sparkline chart\n- **Recent Transactions:** Latest 5 completed sales\n- **Shift Summary:** Current shift status, opening balance, expected vs actual cash\n- **Low Stock:** Products needing replenishment\n- **Pending Orders:** Purchase orders still in draft or sent status\n- **Quick Actions:** Buttons for POS, new sale, stock count, create PO\n\nClick any KPI card to navigate to its detailed section.",
            ],
            [
                'title' => 'Understanding the Vendora Assistant',
                'category' => 'general',
                'keywords' => 'assistant, AI, chat, help, questions, vendora assistant, copilot',
                'content' => "**Vendora Assistant (AI Copilot)**\n\nThe Vendora Assistant is an AI-powered business copilot integrated into your POS system. It can answer questions, analyze data, and guide you through features.\n\n**What you can ask:**\n- Sales queries: \"What are my sales today?\", \"Show sales this month\"\n- Inventory: \"Show low stock items\", \"What is my inventory value?\"\n- Customers: \"Who are my top customers?\", \"How many customers?\"\n- Expenses: \"My expenses today\", \"Expense breakdown by category\"\n- Feature help: \"How do I create a purchase order?\", \"Explain stock count\"\n\n**How it works:**\n1. Click the chat bubble (bottom-right)\n2. Type your question or click a suggestion\n3. The assistant fetches live data from your system\n4. Results appear as rich cards, tables, and metrics\n\nConversations are saved automatically. You can return to any previous chat from the sidebar.",
            ],
            [
                'title' => 'Store Settings & Configuration',
                'category' => 'general',
                'keywords' => 'store settings, configuration, business info, receipt, tax, currency',
                'content' => "**Store Settings**\n\nConfigure your business information from the Settings modal (click your avatar > Settings > Store).\n\n**Settings available:**\n- **Store Name:** Appears on receipts\n- **Address, City, Province, ZIP:** Business location\n- **Phone, Email, TIN:** Contact and tax information\n- **Tax Rate:** Percentage applied to sales (e.g., 12 for VAT)\n- **Currency Symbol & Code:** Display format (₱, PHP)\n- **Receipt Width:** 58mm or 80mm thermal paper\n- **Receipt Footer:** Custom message (e.g., \"Thank you!\")\n- **Receipt Options:** Toggle logo, tax breakdown, discount display\n\nChanges take effect immediately on new transactions and receipts.",
            ],
            [
                'title' => 'User Roles & Permissions',
                'category' => 'general',
                'keywords' => 'users, roles, admin, manager, cashier, permissions, staff',
                'content' => "**User Roles & Permissions**\n\nVendora has three user roles with different access levels:\n\n**Admin:** Full access to all features including settings, user management, backups, and reports. Can void any transaction.\n\n**Manager:** Can manage sales, inventory, purchases, customers, and most operational features. Cannot access user management or system settings.\n\n**Cashier:** Limited to POS terminal, sales history (view only), and their own shift management. Cannot void transactions without a manager password.\n\n**Managing Users:**\nAdmin users can create, edit, and deactivate users from the Users page in the sidebar. Each user needs a name, email, and role assignment.",
            ],
            [
                'title' => 'Keyboard Shortcuts',
                'category' => 'general',
                'keywords' => 'shortcuts, keyboard, hotkeys, quick, navigation',
                'content' => "**Keyboard Shortcuts**\n\n**POS Terminal:**\n- **Type a number + Space** then product name: Set quantity before search (e.g., \"5 coke\" for 5 units)\n- **Arrow Keys:** Navigate product grid\n- **Enter:** Add selected product to cart\n- **F1-F4:** Quick-apply preset discount percentages\n- **Escape:** Close modals and dialogs\n- **Barcode scanner:** Auto-adds product on scan\n\n**General:**\n- **Ctrl+K / Cmd+K:** Quick search (if available)\n- **Escape:** Close any open modal, sheet, or dialog\n\n**Assistant Chat:**\n- **Enter:** Send message\n- **Shift+Enter:** New line in message",
            ],

            // ─── Sales ───
            [
                'title' => 'How to Create a Sale in POS',
                'category' => 'sales',
                'keywords' => 'sale, pos, transaction, payment, cashier, sell, checkout',
                'content' => "**Creating a Sale in Vendora POS**\n\n**Before you start:** Ensure a shift is open (click \"Open Shift\" at the top-right if needed).\n\n**Steps:**\n1. Go to **POS** from the sidebar\n2. Search products by name, SKU, or scan a barcode\n3. Click a product to add it to the cart (or press Enter after search)\n4. Adjust quantity with +/- buttons or type a number + Space before searching (e.g., \"5 coke\")\n5. Optionally add a customer (for loyalty points and tracking)\n6. Add discounts if needed (percentage or fixed amount)\n7. Select payment method: Cash, GCash, or Maya\n8. Click \"Complete Sale\" to finalize\n\n**Payment Methods:**\n- **Cash:** Enter tendered amount, change is calculated automatically\n- **GCash:** Filipino mobile wallet\n- **Maya:** Digital payments app\n\nAfter completion, a receipt modal appears. You can print or download it.",
            ],
            [
                'title' => 'Sales History & Management',
                'category' => 'sales',
                'keywords' => 'sales list, history, transactions, void, refund, receipt',
                'content' => "**Sales History**\n\nView all completed transactions from the Sales page. Features:\n\n**List View:**\n- Date, reference number, customer, items, total, payment method, cashier\n- Filter by date range, payment method, or status\n- Search by reference number or customer name\n\n**Sale Detail:**\n- Full item breakdown with prices and quantities\n- Payment details (method, amount tendered, change)\n- Customer information if assigned\n- Receipt reprint button\n\n**Voiding a Sale:**\n- Click \"Void\" on the sale detail page\n- Manager password required for security\n- Reason for void must be provided\n- Voided items show in red with strikethrough\n\n**Per-Item Void:**\n- Individual items within a sale can be voided\n- Useful for partial returns or corrections\n- Voided items are tracked with reason and timestamp",
            ],
            [
                'title' => 'Receipt Printing',
                'category' => 'sales',
                'keywords' => 'receipt, print, thermal, e-receipt, reprint',
                'content' => "**Receipt Printing**\n\nAfter completing a sale, you can print or view the receipt.\n\n**Thermal Receipt (80mm/58mm):**\n- Configure width in Settings > Store (80mm or 58mm)\n- Receipt includes: store name, address, TIN, date, items, totals, payment, footer\n- Optional: logo, tax breakdown, discount details\n- Click \"Print\" to send to a thermal printer\n\n**E-Receipt:**\n- PDF download option for digital records\n- Email option (if customer email is on file)\n\n**Reprinting:**\n- Go to Sales > select a transaction\n- Click \"Receipt\" to view and reprint\n- Print history is tracked in the activity logs",
            ],

            // ─── Products ───
            [
                'title' => 'Product Management',
                'category' => 'products',
                'keywords' => 'products, items, SKU, barcode, price, cost, import, export, CSV',
                'content' => "**Product Management**\n\nProducts are the core of your inventory. Each product can have:\n\n**Product Fields:**\n- **Name & Description:** Display name and details\n- **SKU:** Stock Keeping Unit — your internal code\n- **Barcode:** For scanner lookup (EAN-13 or Code128)\n- **Category:** Group products for reporting\n- **Prices:** Cost price, selling price, wholesale price\n- **Stock:** Current quantity, low stock threshold, unit (piece, kg, liter, etc.)\n- **Tracking:** Toggle inventory tracking on/off\n- **Variants:** Support for sizes, colors, or other variations\n- **Image:** Product photo\n- **Status:** Active or inactive (inactive products won't appear in POS)\n\n**Import/Export:**\n- Export products to CSV for bulk editing\n- Import products from CSV with automatic SKU matching\n- Download a sample CSV template from the products page",
            ],
            [
                'title' => 'Product Variants',
                'category' => 'products',
                'keywords' => 'variants, size, color, option, SKU, stock per variant',
                'content' => "**Product Variants**\n\nVariants let you sell the same product in different sizes, colors, or options.\n\n**Example:** A T-shirt available in Small, Medium, Large and Red, Blue, Black.\n\n**Setup:**\n1. When creating/editing a product, enable \"Has Variants\"\n2. Define attribute types (e.g., Size, Color)\n3. Add attribute values (S, M, L and Red, Blue, Black)\n4. Variants are auto-generated for each combination\n5. Each variant gets its own SKU, barcode, prices, and stock\n\n**Benefits:**\n- Track stock per variant independently\n- Customers can choose options in POS\n- Reports show sales by variant\n- Barcode scan works per variant",
            ],
            [
                'title' => 'Categories',
                'category' => 'products',
                'keywords' => 'categories, grouping, classification, product groups',
                'content' => "**Product Categories**\n\nCategories help organize your products into logical groups.\n\n**Common categories:** Beverages, Snacks, Canned Goods, Rice & Noodles, Condiments, Dairy, Household, Cleaning Supplies, Personal Care, Baby Products, Cigarettes, Medicine, School Supplies, Bread & Bakery\n\n**How categories help:**\n- Filter products in POS by category\n- Reports show sales and profit by category\n- Category-based promotions (e.g., \"20% off all Beverages\")\n- Inventory reports grouped by category\n- Easier product management\n\nCategories can be managed from the sidebar under Products > Categories.",
            ],

            // ─── Customers ───
            [
                'title' => 'Customer Management & Loyalty',
                'category' => 'customers',
                'keywords' => 'customer, client, loyalty, points, tier, rewards, profile',
                'content' => "**Customer Management**\n\nCustomers help you track who buys from your store and build loyalty.\n\n**Customer Profiles:**\n- Name, email, phone, address\n- Purchase history with full transaction details\n- Total purchases and visit count\n- Last visit date\n- Notes for special instructions\n\n**Loyalty Program:**\n- Customers earn points on every purchase\n- **Tiers:** Regular → Silver → Gold → Platinum (based on total spending)\n- Higher tiers earn more points per purchase\n- Points can be redeemed for rewards\n\n**Rewards:**\n- **Discount:** Percentage or fixed amount off\n- **Free Product:** Redeem points for a specific product\n- **Free Shipping:** Waive delivery fees\n- Rewards can be tier-restricted\n\n**How points work:**\n- Configure points earned per currency spent in Loyalty settings\n- Points are automatically credited on completed sales\n- Assign a customer during POS checkout to track their purchases",
            ],

            // ─── Suppliers ───
            [
                'title' => 'Supplier Management',
                'category' => 'suppliers',
                'keywords' => 'supplier, vendor, provider, contact, purchase',
                'content' => "**Supplier Management**\n\nSuppliers are the businesses you purchase products from.\n\n**Supplier Profile:**\n- Company name, contact person\n- Email, phone, address\n- Tax ID / TIN\n- Payment terms\n- Notes\n\n**How suppliers are used:**\n- Create Purchase Orders for a specific supplier\n- Goods Receiving links to the supplier\n- Track purchase history by supplier\n- Quick reordering from supplier profile\n\nManage suppliers from the sidebar under Purchasing > Suppliers.",
            ],

            // ─── Inventory ───
            [
                'title' => 'Inventory Management (Stock In/Out/Adjust)',
                'category' => 'inventory',
                'keywords' => 'inventory, stock, stock in, stock out, adjust, movement, product',
                'content' => "**Inventory Management**\n\nThe Inventory section helps you track and manage product stock levels.\n\n**Stock In:**\nAdd quantity to a product (e.g., new delivery from supplier).\n- Select product\n- Enter quantity received\n- Add reference note (e.g., \"Delivery from Nestle\")\n- Stock increases immediately\n\n**Stock Out:**\nRemove quantity (e.g., damaged, expired, or stolen items).\n- Select product\n- Enter quantity to remove\n- Provide reason\n- Stock decreases immediately\n\n**Stock Adjustment:**\nSet the exact stock quantity (use after physical count).\n- Select product\n- Enter the actual counted quantity\n- System calculates and records the difference\n- Movement is logged with before/after values\n\n**Movement History:**\n- View all stock changes for any product\n- Date, type, quantity change, reference, user\n- Printable report available",
            ],
            [
                'title' => 'Purchase Orders',
                'category' => 'inventory',
                'keywords' => 'purchase order, PO, order, supplier, replenish, draft, sent, received',
                'content' => "**Purchase Orders (PO)**\n\nPurchase Orders are used to order products from suppliers.\n\n**To create a PO:**\n1. Go to Purchase Orders from the sidebar\n2. Click \"Create Purchase Order\"\n3. Select a supplier\n4. Add items: search products, set quantity and unit cost\n5. Set order date and expected delivery date\n6. Add notes if needed\n7. Save as Draft or mark as Sent\n\n**PO Statuses:**\n- **Draft:** Still editing, not yet sent to supplier\n- **Sent:** Order placed with supplier\n- **Partial:** Some items received\n- **Received:** All items received\n- **Cancelled:** Order cancelled\n\n**From a PO you can:**\n- Directly create a Goods Receiving note\n- Track expected vs received quantities\n- View item-level cost and totals\n- Filter by status and supplier",
            ],
            [
                'title' => 'Goods Receiving',
                'category' => 'inventory',
                'keywords' => 'goods receiving, receive, delivery, PO, purchase order, damaged',
                'content' => "**Goods Receiving**\n\nGoods Receiving records inventory deliveries from suppliers, typically against a Purchase Order.\n\n**To receive goods:**\n1. Go to Goods Receiving from the sidebar\n2. Click \"New Receiving\" (or create from a PO)\n3. If linked to a PO, items auto-populate\n4. Enter received quantities for each item\n5. Record any damaged quantities separately\n6. Add delivery note or reference number\n7. Save to update inventory automatically\n\n**Statuses:**\n- **Received:** All items received successfully\n- **Partial:** Some items pending\n- **Cancelled:** Receiving cancelled\n\n**Key features:**\n- Damaged goods tracking (separate from received count)\n- Auto-updates product stock\n- Links back to the original PO\n- Updates PO status to Received/Partial automatically",
            ],
            [
                'title' => 'How Stock Count Works',
                'category' => 'inventory',
                'keywords' => 'stock count, inventory count, physical count, audit, reconcile, difference',
                'content' => "**Stock Count / Inventory Audit**\n\nStock Count compares actual physical inventory against system records.\n\n**Types of counts:**\n- **Full Count:** All active products loaded automatically\n- **Partial Count:** Select specific products or categories\n- **Spot Count:** Quick count of a single product\n\n**Steps:**\n1. Go to Stock Counts from the sidebar\n2. Click \"New Count\" and choose type\n3. Count products and enter the actual quantities\n4. Save progress anytime (returns to In Progress status)\n5. When finished, mark as Completed\n6. **Reconcile:** Review differences and apply corrections\n\n**Reconciliation:**\n- Shows expected vs counted difference for each item\n- You can accept or override each difference\n- Accepted differences create inventory movements\n- Finalizes stock quantities in the system\n\n**Statuses:** Draft → In Progress → Completed → Reconciled",
            ],
            [
                'title' => 'Inventory Transfers',
                'category' => 'inventory',
                'keywords' => 'transfer, location, warehouse, branch, move stock, approval',
                'content' => "**Inventory Transfers**\n\nTransfer stock between locations (e.g., Main Store to Warehouse).\n\n**To create a transfer:**\n1. Go to Inventory Transfers from the sidebar\n2. Click \"New Transfer\"\n3. Select source and destination locations\n4. Add products and quantities to transfer\n5. Submit for approval\n\n**Transfer workflow:**\n- **Pending:** Awaiting approval\n- **Approved:** Ready to execute\n- **Completed:** Stock moved successfully\n- **Cancelled:** Transfer cancelled\n\n**Key features:**\n- Approval workflow (requires manager/admin approval)\n- Stock is deducted from source and added to destination\n- Full audit trail of all transfers\n- Reference numbers for tracking\n- Notes and reason for transfer",
            ],
            [
                'title' => 'Promotions & Discounts',
                'category' => 'inventory',
                'keywords' => 'promotions, discounts, sale, BOGO, percentage, coupon, happy hour',
                'content' => "**Promotions & Discounts**\n\nCreate special offers to boost sales.\n\n**Promotion Types:**\n- **Percentage:** % off selected products (e.g., 20% off)\n- **Fixed Amount:** Fixed peso discount\n- **Buy X Get Y:** Buy X quantity, get Y items discounted\n- **BOGO:** Buy One Get One (free or discounted)\n- **Category Discount:** Discount on entire product category\n- **Happy Hour:** Time-based discount (e.g., 3-5 PM daily)\n\n**Configuration:**\n- Date range (start and end)\n- Minimum purchase amount\n- Days of week (e.g., weekends only)\n- Usage limit (max redemptions)\n- Coupon code for customer entry\n- Scope: specific products, category, or all items\n\n**How customers use:**\n- In POS, cashier applies promotion manually\n- If coupon code exists, customer enters code\n- Happy hour applies automatically during set times\n- Multiple promotions can stack (configure per promotion)",
            ],

            // ─── Expenses ───
            [
                'title' => 'Managing Expenses & Categories',
                'category' => 'expenses',
                'keywords' => 'expense, spending, cost, record expense, business expense, category',
                'content' => "**Managing Expenses**\n\nExpenses track your business spending outside of inventory purchases.\n\n**To record an expense:**\n1. Go to Expenses from the sidebar\n2. Click \"Add Expense\"\n3. Fill in:\n   - Description (what was purchased)\n   - Amount\n   - Date\n   - Category (Utilities, Rent, Salaries, Supplies, etc.)\n   - Payment method\n   - Optional: receipt image upload\n\n**Expense Categories:**\nPre-built categories you can customize:\n- Utilities (electricity, water, internet)\n- Rent / Lease\n- Salaries & Wages\n- Transportation & Delivery\n- Office Supplies\n- Marketing & Advertising\n- Maintenance & Repairs\n- Permits & Licenses\n- Insurance\n- Miscellaneous\n\n**Reports:**\n- View expenses by category in the Expense Dashboard\n- Compare against sales for profit analysis\n- Monthly trend charts\n- Expense breakdown pie chart",
            ],

            // ─── Shift Management ───
            [
                'title' => 'Shift Management & Cash Reconciliation',
                'category' => 'shifts',
                'keywords' => 'shift, open shift, close shift, cash, reconciliation, over, short',
                'content' => "**Shift Management**\n\nShifts track cashier sessions and cash drawer balances.\n\n**Opening a Shift:**\n1. Go to Shifts from the sidebar\n2. Click \"Open Shift\"\n3. Enter the opening cash balance in the drawer\n4. Shift is now active — POS sales will be tracked to this shift\n\n**Closing a Shift:**\n1. Count the actual cash in the drawer\n2. Enter the closing balance\n3. System calculates expected balance (opening + sales - expenses)\n4. Difference is shown as Over (positive) or Short (negative)\n5. Add notes explaining any discrepancies\n6. Close the shift\n\n**What happens on close:**\n- All held/suspended transactions are automatically discarded\n- Shift summary is saved for records\n- A new shift must be opened before processing more sales\n\n**Shift reports show:**\n- Opening and closing balances\n- Total sales during shift\n- Total expenses during shift\n- Expected vs actual cash\n- Over/short amount\n- Sales per cashier",
            ],

            // ─── Barcode & Labels ───
            [
                'title' => 'Barcode & Label Printing',
                'category' => 'products',
                'keywords' => 'barcode, label, price tag, shelf tag, print, code128, ean13, QR',
                'content' => "**Barcode & Label Printing**\n\nPrint custom barcode labels, price tags, and shelf tags for your products.\n\n**Template Types:**\n- **Label:** Standard product label with barcode\n- **Price Tag:** Includes product name and selling price\n- **Shelf Tag:** For shelf-edge displays\n\n**Template Configuration:**\n- Page and label dimensions\n- Columns and rows layout\n- Barcode type: Code128, EAN-13, or QR code\n- Show/hide: product name, price, barcode, brand\n- Font size and margins\n- Default template for quick printing\n\n**How to print:**\n1. Go to Barcodes from the sidebar\n2. Select a template or create one\n3. Choose products to print\n4. Configure quantity per product\n5. Click Print — opens a printer-friendly page\n6. Use your browser's print function to send to a label printer\n\n**Compatible with:** Brother, Zebra, Dymo, and other label printers",
            ],

            // ─── Activity Logs ───
            [
                'title' => 'Activity Logs (Audit Trail)',
                'category' => 'reports',
                'keywords' => 'activity logs, audit, history, changes, tracking, security',
                'content' => "**Activity Logs**\n\nEvery significant action in Vendora is logged for auditing and security.\n\n**What is tracked:**\n- User login/logout\n- Product creation, updates, deletion\n- Sales completed, voided, refunded\n- Inventory changes (stock in, out, adjust)\n- Purchase order status changes\n- Customer and supplier changes\n- Shift open/close\n- Expense recording\n- Settings changes\n- User management actions\n\n**For each action, the log records:**\n- Who performed the action\n- What module and action type\n- What changed (before and after values in JSON)\n- IP address and browser user agent\n- Timestamp\n\n**How to view:**\nGo to Activity Logs from the sidebar. You can filter by:\n- Date range\n- Action type (create, update, delete)\n- Module (products, sales, inventory, etc.)\n- Specific user\n\nLogs are retained indefinitely for compliance.",
            ],

            // ─── Backups ───
            [
                'title' => 'Backups & Data Protection',
                'category' => 'general',
                'keywords' => 'backup, restore, data protection, download, schedule, safety',
                'content' => "**Backups**\n\nRegular backups protect your business data against accidental loss.\n\n**Manual Backup:**\n1. Go to Backups from the sidebar\n2. Click \"Create Backup\"\n3. Wait for the process to complete\n4. Download the backup file to your computer\n\n**Scheduled Backups:**\n- Configure automatic daily/weekly backups in Settings > Deployment\n- Backups are stored on the server\n- Older backups are automatically pruned based on retention settings\n\n**Backup file contains:**\n- Complete database (transactions, products, customers, etc.)\n- Does NOT include uploaded images (photos, receipts)\n\n**Best practices:**\n- Create a manual backup before major changes\n- Download backups to external storage regularly\n- Keep at least 30 days of backups\n- Test restoration periodically\n\nTo restore a backup, contact your system administrator.",
            ],

            // ─── Reports & Analytics ───
            [
                'title' => 'Sales Reports & Analytics',
                'category' => 'reports',
                'keywords' => 'sales report, revenue, cashier performance, payment methods, trends',
                'content' => "**Sales Reports**\n\n**Sales Report:**\n- Revenue trend chart (daily, weekly, monthly)\n- Payment method breakdown (cash, GCash, Maya)\n- Cashier performance: sales per staff member\n- Hourly/daily transaction patterns\n- Filter by date range\n\n**Profit & Loss Statement:**\n- Gross revenue vs expenses\n- Net profit calculation\n- Cost of goods sold estimates\n- Expense breakdown by category\n- Period-over-period comparison\n\n**Cashier Performance:**\n- Sales per cashier\n- Average transaction value per cashier\n- Items sold per cashier\n- Shift performance metrics",
            ],
            [
                'title' => 'Product & Category Reports',
                'category' => 'reports',
                'keywords' => 'product report, top sellers, category performance, margin, profitability',
                'content' => "**Product Reports**\n\n**Top Selling Products:**\n- Products ranked by quantity sold\n- Revenue and profit per product\n- Margin analysis (selling price vs cost)\n- Low-performing products\n\n**Category Performance:**\n- Sales by category (bar chart)\n- Profit margin per category\n- Category comparison\n- Trends over time\n\n**Product Performance Report:**\n- Individual product sales history\n- Price changes and impact\n- Stock movement correlation\n\n**Inventory Health Report:**\n- Stock value at cost vs retail\n- Low stock alerts\n- Overstocked items\n- Dead stock identification\n- Category stock distribution (donut chart)",
            ],
            [
                'title' => 'Inventory Reports',
                'category' => 'reports',
                'keywords' => 'inventory report, stock value, low stock, overstock, health',
                'content' => "**Inventory Reports**\n\n**Inventory Health:**\n- Donut chart showing stock status distribution\n- Categories: Well-Stocked, Low Stock, Out of Stock\n- Overall inventory health score\n\n**Stock Value:**\n- Total inventory value at cost price\n- Total retail value\n- Potential profit margin\n- Value by category breakdown\n\n**Low Stock Report:**\n- Products below threshold\n- Current quantity vs threshold\n- Suggested reorder quantities\n- Supplier information for quick reordering\n\n**Overstock Report:**\n- Products with excess inventory\n- Carrying cost estimates\n- Days of supply remaining\n- Slow-moving items needing promotion",
            ],

            // ─── Additional features ───
            [
                'title' => 'Loyalty Program Setup & Management',
                'category' => 'customers',
                'keywords' => 'loyalty, rewards, points, tiers, earn, redeem, silver, gold, platinum',
                'content' => "**Loyalty Program**\n\nBuild customer loyalty with a points-based rewards program.\n\n**Setup:**\n1. Go to Loyalty from the sidebar\n2. Configure points earned per amount spent (e.g., 1 point per ₱10)\n3. Define tier thresholds:\n   - Silver: ₱0–₱5,000 total spend\n   - Gold: ₱5,001–₱20,000 total spend\n   - Platinum: ₱20,001+ total spend\n4. Higher tiers earn bonus points (e.g., Platinum earns 2x points)\n\n**Creating Rewards:**\n- Set reward name and description\n- Choose type: Discount, Free Product, or Free Shipping\n- Set points required\n- Optionally restrict to specific tiers\n- Activate the reward\n\n**Customer experience:**\n- Customers earn points automatically on each purchase\n- Track points balance on their profile\n- Redeem points during POS checkout\n- Points never expire (configurable)\n\n**Monitoring:**\n- View points history per customer\n- Total points earned, redeemed, and expired\n- Most active loyalty customers\n- Reward redemption rates",
            ],
        ];

        foreach ($articles as $article) {
            KnowledgeArticle::create([
                'title' => $article['title'],
                'slug' => Str::slug($article['title']).'-'.Str::random(4),
                'category' => $article['category'],
                'keywords' => $article['keywords'],
                'content' => $article['content'],
                'is_active' => true,
            ]);
        }

        $this->command->info('Seeded '.count($articles).' knowledge base articles.');
    }
}
