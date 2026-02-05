# 05_FRONTEND_APPS — RanRHar

## Objective
Create UI for customer, staff, manager, owner with i18n and clean UX. No business logic on client.

## Global UI requirements
- Next.js App Router
- Tailwind + shadcn/ui
- i18n: th/en/ja/zh with language switch
- THB formatting for prices
- Permission-aware navigation (UX only; security enforced server-side)

## Pages required
Customer:
- /menu/[tableCode]
  - categories, item cards with images
  - modifiers, cart, place order

Staff:
- /staff/kds
  - realtime ticket list, station filter, status updates
- /staff/cashier
  - bill list by table, split/merge, payment record, receipt/tax invoice view

Manager:
- /manager/menu
  - manage categories/items/translations/images/modifiers
- /manager/inventory
  - ingredients/uom/recipes, receive invoice, stock lots, alerts
- /manager/payroll
  - shifts, attendance approvals, payroll draft/lock
- /manager/expenses
  - expense entry, utilities, rent, budgets/alerts

Owner:
- /owner/dashboard
  - sales, COGS estimate, labor, utilities, profit snapshot

## Deliverables
- Feature modules under src/features/*
- Reusable UI in packages/ui
- Loading/error states for every page

