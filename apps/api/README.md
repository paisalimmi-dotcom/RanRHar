# Backend API (apps/api)

REST API for RanRHar restaurant operations system.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Fastify
- **Database**: PostgreSQL
- **Auth**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs

## Setup

### 1. Install Dependencies
```bash
cd apps/api
pnpm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and configure:
```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/ranrhar
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

### 3. Setup Database
Create PostgreSQL database and run schema:
```bash
psql -U postgres -c "CREATE DATABASE ranrhar;"
psql -U postgres -d ranrhar -f src/db/schema.sql
```

### 4. Start Server
```bash
pnpm dev
```

Server will run on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /auth/login` - Login with email/password
- `GET /me` - Get current user (requires auth)

### Orders
- `POST /orders` - Create order (requires auth: staff, cashier)
- `GET /orders` - List orders (requires auth: owner, staff)

### Health
- `GET /health` - Health check

## Test Accounts
All test accounts use password: `password123`

- `owner@test.com` - Full access
- `staff@test.com` - Read orders, create orders
- `cashier@test.com` - Create orders only

## Development
```bash
pnpm dev     # Start dev server with auto-reload
pnpm build   # Build for production
pnpm start   # Start production server
```
