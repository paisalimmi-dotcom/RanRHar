# 09_TESTING_E2E — RanRHar

## Objective
E2E tests are the definition of done. If tests fail, the build is considered broken.

## Tooling
- Playwright for E2E
- Vitest for unit tests

## Mandatory E2E flow
1) Customer opens /menu/T01 and places order with modifiers
2) KDS receives the ticket via realtime and shows NEW
3) Kitchen marks COOKING then READY
4) Cashier creates bill for T01, splits 1 item to new bill, records payment
5) Receipt + tax invoice numbers generated and displayed
6) Verify stock deducted via FEFO (earliest expiry lot consumed first)
7) Create payroll period draft, lock payroll, verify edits are blocked
8) Record expense and set budget; exceed budget triggers alert

## Unit tests required
- Promotion rule evaluation (basic)
- FEFO consumption algorithm (multiple lots)
- Payroll draft calculation (monthly + hourly)

## Deliverables
- tests/e2e/* playwright specs
- tests/unit/* vitest specs
- CI script hooks (lint/typecheck/test)

