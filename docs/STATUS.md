# RanRHar — Project Status

## Project Overview
RanRHar is a production-ready, prompt-driven monorepo project for restaurant operations
(QR ordering, POS, inventory, payroll, expenses, multi-role access).
The project is designed for AI multi-agent development using a strict architecture and security model.

---

## Current Phase
**Phase 3: Core Implementation (Ready to start)**

---

## Completed

### Planning & Architecture
- System-level constraints and goals defined (`00_SYSTEM.md`)
- AI agent responsibilities defined (`AGENTS.md`)
- Architecture blueprint finalized (`01_ARCHITECTURE.md`)
- Security, RBAC, and RLS model finalized (`02_SECURITY_RBAC_RLS.md`)
- Database schema designed (`03_DATABASE_SCHEMA.md`)
- Backend service responsibilities defined (`04_BACKEND_SERVICES.md`)
- Frontend portals, routes, and UX defined (`05_FRONTEND_APPS.md`)
- End-to-end testing strategy defined (`09_TESTING_E2E.md`)

### Documentation Contracts
- API contract placeholder created and committed (`docs/API.md`)
- Routes contract placeholder created and committed (`docs/ROUTES.md`)
- Architecture contract placeholder created and committed (`docs/ARCHITECTURE.md`)

### Repository & Git
- Git repository initialized and connected to GitHub
- Authentication and push permissions verified
- All documentation committed and pushed to `main`
- Git workflow validated (commit / push / status checks)

### Monorepo Scaffold
- Base monorepo folder structure created
- Turborepo configuration (`turbo.json`)
- Root workspace configuration (`package.json`, `tsconfig.json`)
- Next.js App Router skeleton (`apps/web`) with feature placeholders
- Node worker skeleton (`apps/worker`)
- Shared packages initialized (`packages/db`, `packages/auth`, `packages/shared`, `packages/ui`)
- Supabase folder initialized

---

## In Progress


---

## Next Steps
1. Verify project installs and runs without errors (user action)
2. Commit scaffolded structure
3. Start parallel agent implementation:
   - DB Agent (migrations + seed)
   - Security/Auth Agent (RBAC + RLS)
   - Backend Agent (services)
   - Frontend Agent (screens/layouts)
   - [x] QA Agent (E2E tests)

### Feature Implementation
- Feature-01 /menu/[tableCode] scaffold
  - [x] Route created (`apps/web/src/app/menu/[tableCode]/page.tsx`)
  - [x] Feature module structure (`apps/web/src/features/menu`)
  - [x] Types, Service, Hook, Component created
  - [x] Minimal UI with placeholders and loading state

---

## Rules & Notes
- No business logic should be implemented before scaffold is committed
- All code must follow `docs/prompts` as the single source of truth
- `STATUS.md` must be updated by the project owner after each completed phase
- AI agents may propose updates, but final changes are committed by the owner

---

## Last Updated
- Phase: Scaffold completed, ready for logic implementation
- Git status: Clean, synced with `origin/main`

---

## Latest Update (2026-02-05)

### Environment & Tooling
- pnpm workspace configured and installed successfully
- Turborepo dev pipeline running correctly
- `pnpm dev` runs web and worker without errors

### Customer Menu MVP
- Dynamic route `/menu/[tableCode]` implemented
- Menu data loading via feature-based hooks
- Client Component boundaries validated
- Mock restaurant, branch, and menu data displayed successfully

### Current State
✅ Scaffolding phase completed  
✅ Menu browsing MVP functional  

### Next Planned Phase
🚧 Phase 4: Customer Ordering Flow
- Implement Cart state management
- Connect Menu → Cart
- Mock order submission (no backend yet)

✅ pnpm install working (Next.js dev OK)

✅ pnpm workspace files committed


### Feature-02 Cart (Customer)
- [x] Cart Feature Module (Provider, Context, Hooks)
- [x] Cart Summary UI (Sticky footer, Expandable list)
- [x] Integration with Menu (Add to cart button)
- [x] Mock Place Order

**Changes:**
- Created `apps/web/src/features/cart/` module.
- Refactored `MenuPage` to use `CartProvider`.
- Added `CartSummary` component.

**How to test:**
1. Navigate to `/menu/A12`.
2. Click "Add" on menu items.
3. Observe Cart Summary at the bottom updating (Total items/Price).
4. Click Cart Summary to expand.
5. Use + / - to adjust quantity.
6. Click "Place Order" and check console for payload.

### ✅ Feature-02: Customer Cart (Local)
- Menu page supports add-to-cart
- Cart summary with quantity controls
- Local state via React Context (no persistence)
- Build verified (pnpm build)

### ✅ Feature-03: Image-Based Menu UI
- Menu items now display with prominent images (4:3 aspect ratio)
- Modern card layout with hover effects and shadows
- Responsive grid (1-4 columns based on screen width)
- 9 mock items across 3 categories (Recommended, Main Dishes, Beverages)
- All items include placeholder images from picsum.photos
- Cart integration unchanged and working
- Build verified (pnpm build)

### ✅ Feature-04: Checkout & Order (Mock)
- Complete sales loop: Menu → Cart → Checkout → Order Success
- Order types defined in `src/shared/types/order.ts`
- Order store with localStorage persistence (`src/features/order/order.store.ts`)
- Checkout page at `/checkout` with cart summary and totals
- Order success page at `/order/success/[id]` with order details
- Orders persist across page reloads
- Cart clears after successful order placement
- Build verified (pnpm build)

**Files Created:**
- `apps/web/src/shared/types/order.ts`
- `apps/web/src/features/order/order.store.ts`
- `apps/web/src/app/checkout/page.tsx`
- `apps/web/src/app/order/success/[id]/page.tsx`

**Files Modified:**
- `apps/web/src/features/cart/components/CartSummary.tsx` (navigate to checkout)

**How to test:**
1. Navigate to `/menu/A12`
2. Add items to cart
3. Click cart summary → "Place Order"
4. Review checkout → "Place Order"
5. View order success page
6. Reload page → order persists
7. Return to menu → cart is empty

# Project Status Log

## 2026-02-06
### Feature-04: Checkout & Order (Mock)
- Completed end-to-end sales loop
- Order is stored as snapshot (decoupled from cart)
- Persistence via localStorage (`ranrhar_orders`)
- Build verified: pnpm build ✅

### Decisions
- Auth & Role will be implemented before image upload
- Backend API deferred

### Next
- Start Feature-05: Authentication & Role Management

---

## 2026-02-06 (Later)
### ✅ Feature-05: Authentication & Role Management (Mock)
- Mock authentication using localStorage (API-ready architecture)
- Role-based access control with 3 roles: owner, staff, cashier
- Login page with email input and role selector
- Unauthorized page with error message
- Auth store with login/logout/getSession functions
- AuthGuard component for route protection
- LogoutButton component for user logout
- Protected routes:
  - `/admin` (owner only)
  - `/orders` (owner, staff)
  - `/checkout` (staff, cashier)
- Session persistence across page reloads
- Build verified (pnpm build)

**Files Created:**
- `apps/web/src/features/auth/auth.types.ts`
- `apps/web/src/features/auth/auth.store.ts`
- `apps/web/src/features/auth/auth.guard.tsx`
- `apps/web/src/features/auth/LogoutButton.tsx`
- `apps/web/src/features/auth/index.ts`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/unauthorized/page.tsx`
- `apps/web/src/app/admin/page.tsx`
- `apps/web/src/app/orders/page.tsx`

**Files Modified:**
- `apps/web/src/app/checkout/page.tsx` (added AuthGuard)

**How to test:**
1. Navigate to `/login`
2. Enter email and select role
3. Click Login → redirects to menu
4. Try accessing `/admin` with different roles
5. Try accessing `/orders` with different roles
6. Try accessing `/checkout` with different roles
7. Refresh page → session persists
8. Logout → redirects to login

**Next:**
- Feature-06: Image Upload & Management (if needed)
- Backend API integration (when ready)

## 2026-02-06

### Feature-05: Authentication & Role Management (Mock)
- Completed mock authentication with role-based access control
- Roles implemented: owner, staff, cashier
- Route protection enforced (/admin, /orders, /checkout)
- Session persisted via localStorage
- Build verified: pnpm build ✅
- Milestone tagged: v0.5.0-auth-role-mock

### Decision
- Proceed with Feature-06A: Backend API Integration
- Rationale: unlock data persistence, role-based orders, and future payment

### Next
- Replace mock auth & order storage with backend API
- Keep existing UX unchanged

---

## 2026-02-06 (Later)

### ✅ Feature-06A: Backend API Integration (Auth & Orders)
- Replaced localStorage-based auth and orders with real backend API
- Backend: Fastify + PostgreSQL + JWT authentication
- Database schema: users and orders tables with RBAC
- API endpoints:
  - POST /auth/login (email/password → JWT token)
  - GET /me (validate token)
  - POST /orders (create order, requires staff/cashier)
  - GET /orders (list orders, requires owner/staff)
- Frontend API adapters:
  - `api-client.ts` - HTTP client with auto token injection
  - `auth.api.ts` - Auth API calls
  - `order.api.ts` - Order API calls
- Updated `auth.store` to use async API login with password
- Updated `order.store` to use async API calls with cache fallback
- Updated login page with password field and error handling
- Updated checkout page with async order placement
- Build verified: pnpm build ✅
- Test accounts: owner@test.com, staff@test.com, cashier@test.com (password: password123)

**Files Created (Backend):**
- `apps/api/` - Complete backend service
- `apps/api/src/index.ts` - Fastify server
- `apps/api/src/db/schema.sql` - Database schema
- `apps/api/src/middleware/auth.ts` - JWT auth & RBAC
- `apps/api/src/routes/auth.ts` - Auth endpoints
- `apps/api/src/routes/orders.ts` - Order endpoints

**Files Created (Frontend):**
- `apps/web/src/lib/api-client.ts` - HTTP client
- `apps/web/src/features/auth/auth.api.ts` - Auth adapter
- `apps/web/src/features/order/order.api.ts` - Order adapter

**Files Modified:**
- `apps/web/src/features/auth/auth.store.ts` - Async API login
- `apps/web/src/features/order/order.store.ts` - Async API calls
- `apps/web/src/app/login/page.tsx` - Password field + async
- `apps/web/src/app/checkout/page.tsx` - Async order placement

**Breaking Changes:**
- Users must re-login (localStorage sessions incompatible)
- Existing localStorage orders NOT migrated

**Next:**
- Deploy backend API to production
- Configure production database
- Update frontend API URL for production
- Feature-07: Payment integration or dashboard features

