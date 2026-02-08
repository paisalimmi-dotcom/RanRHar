# API Documentation

**OpenAPI Spec:** [openapi.yaml](openapi.yaml)

## Overview

RanRHar REST API provides endpoints for authentication, order management, and payment processing. All endpoints use JSON for request and response bodies.

**Base URL**: `http://localhost:3001/v1` (development) or `https://api.yourdomain.com/v1` (production)

**Versioning**: All API routes are prefixed with `/v1`. Health endpoints (`/health`, `/health/ready`) are unversioned.

**Authentication**: JWT Bearer token (except `/auth/login` and `/health`)

**Rate Limiting**:
- Global: 100 requests per minute
- `/auth/login`: 5 requests per 15 minutes (brute force protection)

---

## Authentication

### POST /v1/auth/login

Login with email and password to receive a JWT access token.

**Request:**
```json
{
  "email": "owner@test.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "owner@test.com",
    "role": "owner"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing email or password
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Rate limit exceeded (5 attempts per 15 minutes)

**Rate Limit**: 5 requests per 15 minutes

---

### GET /me

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "email": "owner@test.com",
  "role": "owner"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token

**RBAC**: Requires authentication (any role)

---

## Orders

### POST /orders

Create a new order.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "items": [
    {
      "id": "1",
      "name": "Pad Thai",
      "priceTHB": 120,
      "quantity": 2
    },
    {
      "id": "2",
      "name": "Thai Iced Tea",
      "priceTHB": 50,
      "quantity": 1
    }
  ],
  "total": 290
}
```

**Response (201 Created):**
```json
{
  "id": "42",
  "items": [...],
  "subtotal": 290,
  "total": 290,
  "status": "PENDING",
  "createdAt": "2026-02-07T13:33:14.000Z",
  "createdBy": 1
}
```

**Error Responses:**
- `400 Bad Request`: Invalid items or total
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions

**RBAC**: Requires `staff` or `cashier` role

---

### GET /orders

List all orders (most recent first, limited to 100).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "orders": [
    {
      "id": "42",
      "items": [...],
      "subtotal": 290,
      "total": 290,
      "status": "PENDING",
      "createdAt": "2026-02-07T13:33:14.000Z",
      "createdBy": {
        "id": 1,
        "email": "staff@test.com",
        "role": "staff"
      }
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions

**RBAC**: Requires `owner` or `staff` role

---

### PATCH /orders/:id/status

Update order status.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "status": "CONFIRMED"
}
```

**Valid Status Values**: `PENDING`, `CONFIRMED`, `COMPLETED`

**Response (200 OK):**
```json
{
  "id": "42",
  "items": [...],
  "subtotal": 290,
  "total": 290,
  "status": "CONFIRMED",
  "createdAt": "2026-02-07T13:33:14.000Z",
  "createdBy": 1
}
```

**Error Responses:**
- `400 Bad Request`: Invalid status value
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Order not found

**RBAC**: Requires `owner` or `staff` role

---

## Payments

### POST /orders/:id/payment

Record a payment for an order.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "amount": 290,
  "method": "CASH",
  "notes": "Paid in full"
}
```

**Valid Payment Methods**: `CASH`, `QR`

**Response (201 Created):**
```json
{
  "id": "15",
  "orderId": "42",
  "amount": 290,
  "method": "CASH",
  "status": "PAID",
  "paidAt": "2026-02-07T13:35:00.000Z",
  "createdBy": 1,
  "notes": "Paid in full"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid amount, method, or amount doesn't match order total
- `400 Bad Request`: Payment already exists for this order
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Order not found

**Validation Rules**:
- Amount must match order total exactly
- Only one payment per order allowed
- Payment method must be CASH or QR

**RBAC**: Requires `staff` or `cashier` role

---

### GET /orders/:id/payment

Get payment details for an order.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "15",
  "orderId": "42",
  "amount": 290,
  "method": "CASH",
  "status": "PAID",
  "paidAt": "2026-02-07T13:35:00.000Z",
  "createdBy": {
    "id": 1,
    "email": "cashier@test.com",
    "role": "cashier"
  },
  "notes": "Paid in full"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Payment not found

**RBAC**: Requires `owner`, `staff`, or `cashier` role

---

## Health Check

### GET /health

Check API server health status (no authentication required).

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-02-07T13:33:14.000Z"
}
```

**RBAC**: Public endpoint (no authentication required)

---

## Role-Based Access Control (RBAC)

### Roles

| Role | Permissions |
|------|-------------|
| **owner** | Full access to all endpoints |
| **staff** | Create orders, view orders, update order status, record payments, view payments |
| **cashier** | Create orders, record payments, view payments |

### Endpoint Permissions Matrix

| Endpoint | owner | staff | cashier | public |
|----------|-------|-------|---------|--------|
| `POST /auth/login` | ✓ | ✓ | ✓ | ✓ |
| `GET /me` | ✓ | ✓ | ✓ | - |
| `POST /orders` | ✓ | ✓ | ✓ | - |
| `GET /orders` | ✓ | ✓ | - | - |
| `PATCH /orders/:id/status` | ✓ | ✓ | - | - |
| `POST /orders/:id/payment` | ✓ | ✓ | ✓ | - |
| `GET /orders/:id/payment` | ✓ | ✓ | ✓ | - |
| `GET /health` | ✓ | ✓ | ✓ | ✓ |

---

## Test Accounts

All test accounts use password: `password123`

| Email | Role | Description |
|-------|------|-------------|
| owner@test.com | owner | Full system access |
| staff@test.com | staff | Order management and payments |
| cashier@test.com | cashier | Order creation and payment recording |

> [!WARNING]
> **Change or remove test accounts in production.** These accounts are for development and testing only.

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## Security Features

- **Helmet**: Security headers (CSP, HSTS)
- **CORS**: Whitelist-based origin validation
- **Rate Limiting**: Global (100/min) and endpoint-specific (auth: 5/15min)
- **JWT**: 1-hour token expiration
- **Password Hashing**: bcryptjs with 10 rounds
- **HTTPS Enforcement**: Automatic redirect in production
- **Error Sanitization**: Stack traces hidden in production

---

## Development

### Running Locally

```bash
cd apps/api
pnpm dev
```

Server runs on `http://localhost:3001`

### Testing with curl

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@test.com","password":"password123"}' \
  | jq -r '.accessToken')

# Get orders
curl http://localhost:3001/orders \
  -H "Authorization: Bearer $TOKEN"
```

### Testing with PowerShell

See `scripts/smoke-test.ps1` for automated API testing.
