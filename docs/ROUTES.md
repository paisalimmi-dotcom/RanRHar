# Application Routes

## Overview

RanRHar uses Next.js App Router for client-side routing. Routes are organized by access level and protected using role-based access control (RBAC).

**Base URL**: `http://localhost:3000` (development) or `https://yourdomain.com` (production)

---

## Public Routes

### GET /

Home page — redirect ทันทีไป `/menu/A12` (ลูกค้าเห็นเมนูทันที). เจ้าหน้าที่เข้า `/staff` เพื่อ login หรือจัดการ

**Access**: Public (redirect to /menu/A12)

**File**: `apps/web/src/app/page.tsx`

---

### GET /staff

Staff portal — ลิงก์สำหรับเจ้าหน้าที่เข้าสู่ระบบ, ดูออเดอร์, จัดการสต็อก

**Access**: Public (no authentication required)

**File**: `apps/web/src/app/staff/page.tsx`

---

### GET /menu/[tableCode]

Customer menu browsing page. Displays restaurant menu items with images, allows adding items to cart.

**Access**: Public (no authentication required)

**Parameters**:
- `tableCode` (string): Table identifier (e.g., "A12", "B05")

**Features**:
- Menu item display with images
- Add to cart functionality
- Cart summary (sticky footer)
- Category filtering

**File**: `apps/web/src/app/menu/[tableCode]/page.tsx`

**Example**: `/menu/A12`

---

## Authentication Routes

### GET /login

Login page for staff authentication.

**Access**: Public (redirects to `/menu/A12` if already authenticated)

**Features**:
- Email and password input
- Role selection (for development/testing)
- Error message display
- Session persistence

**File**: `apps/web/src/app/login/page.tsx`

**Redirects**:
- After successful login → `/menu/A12`

---

### GET /unauthorized

Unauthorized access error page.

**Access**: Public

**Displayed When**: User attempts to access a protected route without sufficient permissions

**File**: `apps/web/src/app/unauthorized/page.tsx`

---

## Protected Routes (Authentication Required)

### GET /checkout

Checkout page for order review and placement.

**Access**: Requires authentication (`staff` or `cashier` role)

**Features**:
- Cart item review
- Order total calculation
- Place order button
- Integration with backend API

**File**: `apps/web/src/app/checkout/page.tsx`

**RBAC**: `staff`, `cashier`

**Redirects**:
- If unauthorized → `/unauthorized`
- After successful order → `/order/success/[id]`

---

### GET /order/success/[id]

Order confirmation page.

**Access**: Public (but requires valid order ID)

**Parameters**:
- `id` (string): Order ID

**Features**:
- Order details display
- Order items list
- Total amount
- Order timestamp
- Return to menu link

**File**: `apps/web/src/app/order/success/[id]/page.tsx`

**Example**: `/order/success/42`

---

### GET /orders

Order management page for viewing and managing all orders.

**Access**: Requires authentication (`owner` or `staff` role)

**Features**:
- Order list table
- Status badges (PENDING, CONFIRMED, COMPLETED)
- Status update dropdown (owner/staff only)
- Payment status display
- Record payment button
- Real-time updates

**File**: `apps/web/src/app/orders/page.tsx`

**RBAC**: `owner`, `staff`

**Redirects**:
- If unauthorized → `/unauthorized`

---

### GET /admin

Admin dashboard (placeholder for future features).

**Access**: Requires authentication (`owner` role only)

**Features**:
- Currently displays welcome message
- Logout button
- Placeholder for future admin features

**File**: `apps/web/src/app/admin/page.tsx`

**RBAC**: `owner` only

**Redirects**:
- If unauthorized → `/unauthorized`

---

## Route Protection

### AuthGuard Component

Routes are protected using the `AuthGuard` component which:
1. Checks if user is authenticated
2. Verifies user role matches required roles
3. Redirects to `/unauthorized` if access denied

**Usage Example**:
```tsx
<AuthGuard allowedRoles={['owner', 'staff']}>
  <OrdersPage />
</AuthGuard>
```

**File**: `apps/web/src/features/auth/auth.guard.tsx`

---

## Role-Based Access Control (RBAC)

### Roles

| Role | Description |
|------|-------------|
| **owner** | Full system access, all features |
| **staff** | Order management, payment recording, order viewing |
| **cashier** | Order creation, payment recording |

### Route Permissions Matrix

| Route | Public | cashier | staff | owner |
|-------|--------|---------|-------|-------|
| `/` | ✓ (redirect) | ✓ | ✓ | ✓ |
| `/menu/[tableCode]` | ✓ | ✓ | ✓ | ✓ |
| `/staff` | ✓ | ✓ | ✓ | ✓ |
| `/login` | ✓ | ✓ | ✓ | ✓ |
| `/unauthorized` | ✓ | ✓ | ✓ | ✓ |
| `/checkout` | ✓ | ✓ | ✓ | ✓ |
| `/order/success/[id]` | ✓ | ✓ | ✓ | ✓ |
| `/orders` | - | ✓ | ✓ | ✓ |
| `/inventory` | - | - | ✓ | ✓ |
| `/admin` | - | - | - | ✓ |

---

## Navigation Flow

### Customer Order Flow
```
/menu/[tableCode] → Add items to cart
                  → Click cart summary
                  → /checkout (requires login)
                  → Place order
                  → /order/success/[id]
```

### Staff Order Management Flow
```
/login → Authenticate
      → /orders (view all orders)
      → Update order status
      → Record payment
```

### Admin Flow
```
/login → Authenticate as owner
      → /admin (dashboard)
      → Access all features
```

---

## Session Management

### Authentication Storage
- **Method**: localStorage
- **Key**: `ranrhar_session`
- **Data**: JWT token, user email, user role

### Session Persistence
- Sessions persist across page reloads
- Token validated on protected route access
- Automatic redirect to `/login` if session expired

### Logout
- Clears localStorage session
- Redirects to `/login`
- Available via `LogoutButton` component

**File**: `apps/web/src/features/auth/auth.store.ts`

---

## Future Routes (Planned)

The following routes are planned for future features:

### Inventory Management
- `/inventory` - Inventory listing and management
- `/inventory/add` - Add new inventory item
- `/inventory/[id]` - Edit inventory item

### Staff Management
- `/staff` - Staff listing
- `/staff/add` - Add new staff member
- `/staff/[id]` - Edit staff details

### Reports & Analytics
- `/reports` - Reports dashboard
- `/reports/sales` - Sales reports
- `/reports/inventory` - Inventory reports

### Menu Management
- `/menu-management` - Menu item management
- `/menu-management/add` - Add new menu item
- `/menu-management/[id]` - Edit menu item

> [!NOTE]
> Future routes will follow the same RBAC pattern with appropriate role restrictions.

---

## Development

### Adding New Routes

1. Create page file in `apps/web/src/app/[route]/page.tsx`
2. Wrap with `AuthGuard` if protection needed
3. Update this documentation
4. Update RBAC matrix if new role requirements

### Testing Routes

```bash
cd apps/web
pnpm dev
```

Navigate to `http://localhost:3000/[route]`

### Route File Structure

```
apps/web/src/app/
├── page.tsx                    # Home page
├── layout.tsx                  # Root layout
├── menu/
│   └── [tableCode]/
│       └── page.tsx            # Menu page
├── login/
│   └── page.tsx                # Login page
├── checkout/
│   └── page.tsx                # Checkout page
├── order/
│   └── success/
│       └── [id]/
│           └── page.tsx        # Order success page
├── orders/
│   └── page.tsx                # Orders management page
├── admin/
│   └── page.tsx                # Admin dashboard
└── unauthorized/
    └── page.tsx                # Unauthorized error page
```
