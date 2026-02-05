# 04_BACKEND_SERVICES — RanRHar

## Objective
Implement server-side business logic with strong consistency and authorization.

## Rules
- All mutations must be transactional
- All inputs validated with Zod (packages/shared)
- Permission checks server-side (packages/auth)
- Never trust frontend role checks
- Idempotency where relevant (payments, invoice receive)

## Required actions/endpoints (minimum)
Ordering:
- placeOrder(tableCode, items[])
- updateKitchenStatus(ticketId, status)

Billing:
- createBill(tableId)
- splitBill(billId, itemIds[])
- moveBillItems(sourceBillId, targetBillId, itemIds[])
- recordPayment(billId, method, amount)
- voidBill(billId, reason)

Inventory/Procurement:
- receiveSupplierInvoice(invoicePayload + attachments)
- adjustStock(ingredientId, qtyDelta, reason)

Payroll:
- createPayrollPeriod(month)
- recalcPayroll(periodId)
- approvePayroll(periodId)
- lockPayroll(periodId)

Expenses:
- recordExpense(categoryId, amount, date, attachment?)
- recordUtilityBill(type, amount or meter, period)
- setBudget(categoryId, monthlyLimit)
- generateBudgetAlerts(period)

## Audit
Every above mutation must write audit_logs entries with before/after JSON.

## Deliverables
- Server action layer + services
- Shared Zod schemas
- Error model (typed errors surfaced to UI)

