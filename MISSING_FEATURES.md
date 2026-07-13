# Missing Features Audit

## Phase 2 - Retail Operations (Purchase Orders & Stock Counts)
- Purchase order management (CRUD, status tracking: draft/sent/partial/received/cancelled)
- Purchase order items with cost tracking
- Stock count / inventory audit (full, partial, spot)
- Stock count reconciliation workflow
- Reference number auto-generation

## Phase 3 - Cash Management
- Shift management (open/close, balance tracking)
- Cash transactions (cash in/out, petty cash)
- Expense tracking with categories
- Expense categories CRUD
- Receipt image upload for expenses

## Phase 4 - Multi-Tenant (Skipped for v1 — requires architectural changes)

## Phase 5 - Accountability
- Activity log / audit trail for all CRUD operations
- Audit service for centralized logging
- IP address and user agent tracking
- Old/new value diff tracking

## Phase 6 - Reporting
- Profit & Loss report (sales - COGS - expenses)
- Product performance report (quantity, revenue, profit)
- Category performance report (revenue by category)
- Cashier performance report (sales by user)

## Phase 7 - Expense Management
- Expense list with search, filter by category/date
- Create expense with category, payment method, receipt
- Expense category management
- Integration with shift/cash management

## Phase 8 - Customer Features
- Loyalty points system
- Loyalty tiers (regular, silver, gold, platinum)
- Points earned/redeemed tracking
- Automatic tier progression based on spending

## Phase 9-12 - (Not yet scoped — future phases)

## General Gaps
- No frontend pages for any of the above modules
- No route definitions for new modules
- No controllers for purchase orders, stock counts, shifts, cash transactions, expenses, activity logs
- Missing wayfinder route generation after adding new routes
