# Implementation Order (by Business Criticality)

## Priority 1 — Retail Operations (Phase 2)
**Business impact: Core inventory management**
1. Purchase Orders (create/view/receive)
2. Purchase Order Items (line-item tracking)
3. Stock Counts (inventory audit)
4. Stock Count Items (count reconciliation)

## Priority 2 — Cash Management (Phase 3)
**Business impact: Daily cash accountability**
5. Shifts (open/close, balance tracking)
6. Cash Transactions (cash in/out tracking)
7. Expense Categories (expense classification)
8. Expenses (expense recording with receipts)

## Priority 3 — Accountability (Phase 5)
**Business impact: Audit trail for compliance**
9. Activity Log (model + migration)
10. Audit Service (centralized logging helper)

## Priority 4 — Customer Features (Phase 8)
**Business impact: Customer retention**
11. Loyalty fields on customers table
12. Loyalty points logic (earn/redeem/progression)

## Priority 5 — Reporting (Phase 6)
**Business impact: Business intelligence**
13. Profit & Loss report
14. Product Performance report
15. Category Performance report
16. Cashier Performance report

## Priority 6 — Expense Management (Phase 7)
**Business impact: Cost tracking (shared with Phase 3)**
17. Expense CRUD frontend
18. Expense category management frontend

## Implementation Steps

### Step 1: Database
- Run all new migrations

### Step 2: Models
- Create all model files

### Step 3: Services & Controllers
- Create AuditService
- Create all controllers
- Update ReportService with new methods
- Update routes/web.php

### Step 4: Generate Wayfinder routes
- Run `php artisan wayfinder:generate`

### Step 5: Frontend pages
- Create all page components
- Wire up navigation links
