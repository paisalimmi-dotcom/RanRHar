# RanRHar
Free & Freemium Restaurant Operating System

## 🎯 Project Status: **80% Complete** (8/10 Features)

### ✅ Completed Features
- **Feature-01**: Menu Browsing (`/menu/[tableCode]`)
- **Feature-02**: Customer Cart (React Context + localStorage)
- **Feature-03**: Image-Based Menu UI (Responsive cards)
- **Feature-04**: Checkout & Order Flow (Full sales loop)
- **Feature-05**: Authentication & RBAC (JWT + 3 roles)
- **Feature-06**: Backend API (Fastify + PostgreSQL + JWT)
- **Feature-07**: Order Status Management (PENDING/CONFIRMED/COMPLETED)
- **Feature-08**: Payment Integration (CASH/QR with orders page) ✨ **NEW**

### 🚧 Planned
- **Feature-09**: Inventory Management
- **Feature-10**: Multi-branch Support

### 🔒 Security: **8.5/10** (Production Ready)
- ✅ Helmet (CSP, HSTS)
- ✅ CORS whitelist
- ✅ Rate limiting (100/min, 5/15min auth)
- ✅ JWT validation (1h expiry)
- ✅ HTTPS enforcement (production)

### ⚠️ Critical Gap
- **Test Coverage**: 3/10 (E2E smoke test script added, not yet executed)

### 📚 Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Fastify, PostgreSQL, JWT
- **Monorepo**: Turborepo + pnpm workspaces
- **Security**: Helmet, Rate Limit, CORS

### 🚀 Quick Start
```bash
# Install dependencies
pnpm install

# Start API (requires PostgreSQL)
cd apps/api && pnpm dev

# Start Web
cd apps/web && pnpm dev

# Run smoke tests
.\scripts\smoke-test.ps1
```

### 📖 Documentation
- [STATUS.md](docs/STATUS.md) — Detailed project status
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture
- [ROUTES.md](docs/ROUTES.md) — Frontend routes
- [API.md](docs/API.md) — API documentation

---

**Last Updated**: 2026-02-07  
**Phase**: 8 (Feature Completion & Testing)  
**Next**: Add E2E tests, Feature-09 (Inventory)
