# Production Readiness Assessment

## Database Indexes Needed
- `activity_logs`: index on `(reference_type, reference_id)`, `action`, `module` (already in migration)
- `purchase_orders`: index on `reference_number` (unique), `status`, `supplier_id`
- `purchase_order_items`: index on `purchase_order_id`, `product_id`
- `stock_counts`: index on `reference_number` (unique), `status`
- `stock_count_items`: index on `stock_count_id`, `product_id`
- `shifts`: index on `user_id`, `status`
- `cash_transactions`: index on `shift_id`, `user_id`, `type`
- `expenses`: index on `expense_category_id`, `user_id`, `expense_date`
- `expense_categories`: index on `slug` (unique)
- `customers`: index on `loyalty_tier` (after migration)

## Query Optimization Needed
- Purchase order listing: eager-load `supplier`, `user`, `items` only when needed
- Expense listing: eager-load `category`, `user`
- Activity log listing: eager-load `user`, paginate with max 50 per page
- Add `->withQueryString()` to all paginated queries for filter persistence
- Use `cursorPaginate()` for high-volume tables like activity_logs

## Error Handling Gaps
- No validation error handling on frontend create/edit forms for new modules
- No error boundaries for failed Inertia page loads
- Shift close should validate before allowing closure (check for open transactions)
- Purchase order receive shouldn't allow quantity_received > quantity_ordered without confirmation
- Stock count reconciliation should be atomic (wrap in DB transaction)

## Loading/Empty States Audit
- All new DataTable listings show "No results found" (handled by DataTable component)
- Need skeleton loading for report pages with deferred props
- Shift detail view needs loading state for cash transactions
- Purchase order detail needs loading state for items list

## Mobile Responsiveness
- All new DataTable pages use responsive table (overflow-x-auto) — already handled
- Dialog forms use `sm:max-w-lg` for mobile-friendly modals
- Report cards use `grid gap-4 md:grid-cols-4` for responsive layout
- Page headers use `flex items-center justify-between gap-4` for mobile

## Dark Mode Consistency
- All new pages use Tailwind classes (no hardcoded colors)
- Badge variants use `default`/`secondary`/`destructive` (dark-mode aware)
- Cards use `Card` component (dark-mode aware)
- Dialogs use `DialogContent` (dark-mode aware)
- ConfirmDialog already uses dark variants (`dark:bg-red-900/20`)

## Authorization Coverage
- No policies yet for PurchaseOrder, StockCount, Shift, CashTransaction, Expense, ActivityLog
- Add PurchaseOrderPolicy (viewAny, create, update, delete)
- Add StockCountPolicy (viewAny, create, update, reconcile)
- Add ShiftPolicy (open, close — only own shift)
- Add ExpensePolicy (viewAny, create, update, delete)
- ActivityLog should be view-only with potential admin gate
- Consider using Laravel Gates or policies for all new models
