# RanRHar — Developer Specification

**Version:** 1.0  
**Last Updated:** 2026-02-08  
**Purpose:** Spec สำหรับนักพัฒนา — นำ Tech Stack มาใช้งานให้เกิดประสิทธิภาพสูงสุดในระบบร้านอาหารครบวงจร

---

## 1. วิสัยทัศน์และขอบเขต

### 1.1 โปรเจกต์คืออะไร

RanRHar เป็น **Restaurant Operating System** แบบ full-stack สำหรับร้านอาหารที่ต้องการ:

- **ลูกค้า:** สแกน QR โต๊ะ → ดูเมนู → สั่งอาหาร → ชำระเงิน → ติดตามสถานะออเดอร์
- **เจ้าหน้าที่:** KDS (Kitchen Display), Cashier (รับชำระ/ออกใบเสร็จ)
- **ผู้จัดการ:** จัดการเมนู, สต็อก, ค่าจ้าง, ค่าใช้จ่าย
- **เจ้าของ:** Dashboard สรุปยอดขาย, P&amp;L, Multi-branch (อนาคต)

### 1.2 MVP ขอบเขตปัจจุบัน

| ฟีเจอร์ | สถานะ | หมายเหตุ |
|---------|--------|----------|
| Customer Menu + Cart | ✅ | ดูเมนู, เพิ่มในตระกร้า |
| Checkout + Order | ✅ | สร้างออเดอร์, บันทึกใน DB |
| Order Management | ✅ | PENDING, CONFIRMED, COMPLETED |
| Payment | ✅ | บันทึกเงินสด/QR |
| Inventory | ✅ | สต็อก, แจ้งเตือนของต่ำ |
| Auth + RBAC | ✅ | owner, staff, cashier |
| Menu Management | ❌ | ยังไม่มี Admin UI |
| KDS | ❌ | ยังไม่มี /staff/kds |
| Cashier | ❌ | แยกจาก /orders |
| Payroll | ❌ | ยังไม่มี |
| Expenses | ❌ | ยังไม่มี |
| Multi-branch | ❌ | ยังไม่รองรับ |
| i18n | ❌ | ยังไม่มี TH/EN/JP/ZH |

---

## 2. Tech Stack

### 2.1 สรุป Stack

| ชั้น | เทคโนโลยี | เวอร์ชัน | บทบาท |
|------|-----------|----------|--------|
| **Monorepo** | pnpm + Turborepo | Latest | workspace, cache, build pipeline |
| **Frontend** | Next.js App Router | 16.x | React, SSR, routing |
| **API** | Fastify | 4.x | REST API, JWT, cookies |
| **Database** | PostgreSQL | - | สถานะ, migrations |
| **Auth** | JWT + httpOnly Cookie | - | session, RBAC |
| **Styling** | Tailwind CSS | v4 | utility-first |
| **Testing** | Vitest + Playwright | 4.x / 1.x | unit, E2E |
| **CI** | GitHub Actions | - | lint, test, build, E2E |

### 2.2 Tech Stack Freemium (เป้าหมาย ≤50 ร้าน)

| ชั้น | แนะนำ | Free Tier | หมายเหตุ |
|------|-------|-----------|----------|
| Frontend | Next.js + Vercel | ✅ | 100GB bandwidth |
| Database | Supabase / Neon | ✅ 500MB | PostgreSQL |
| Auth | Supabase Auth | ✅ | หรือคง JWT |
| Storage | Supabase Storage | ✅ 1GB | รูปเมนู |
| Realtime | Supabase Realtime | ✅ 200 conn | KDS |
| API | Fastify หรือ Vercel Serverless | ✅ | ตาม deploy |

**Freemium:** ต้นทุน 0 บาทสำหรับร้าน ≤50 ร้าน — ดู PROJECT_ADJUSTMENT_PLAN.md

### 2.3 โครงสร้าง Monorepo

```
RanRHar/
├── apps/
│   ├── api/          # Fastify Backend API
│   ├── web/          # Next.js Frontend
│   └── worker/       # Background jobs (skeleton)
├── packages/
│   ├── auth/         # RBAC helpers
│   ├── db/           # DB schema/migrations
│   ├── shared/       # Types, Zod schemas, constants
│   └── ui/           # Shared UI components
├── docs/
│   ├── prompts/      # Architecture specs (agent instructions)
│   ├── API.md
│   ├── ROUTES.md
│   └── DEVELOPER_SPEC.md (this file)
├── scripts/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### 2.4 คำสั่งหลัก

```bash
# ติดตั้ง
pnpm install

# Development
pnpm dev                    # รัน api + web + worker

# Build
pnpm build                  # Build ทั้งหมด

# Lint
pnpm lint

# Test
pnpm test                   # Vitest unit tests
pnpm test:coverage          # Unit + coverage
cd apps/web && pnpm test:e2e   # Playwright E2E

# Database
pnpm migrate                # run migrations
```

---

## 3. Architecture Conventions

### 3.1 Feature Isolation (Frontend)

**กฎ:** `apps/web/src/features/*` แยกโค้ดตาม domain อย่างชัดเจน

```
features/
├── menu/       # เมนู, หมวดหมู่
├── cart/       # ตระกร้า
├── order/      # ออเดอร์
├── payment/    # การชำระเงิน
├── inventory/  # สต็อก
├── auth/       # Authen, RBAC
└── theme/      # UI theme
```

- **ห้าม:** cross-feature import โดยตรง
- **อนุญาต:** ใช้ `packages/shared` สำหรับ types/contracts
- **อนุญาต:** ใช้ `packages/ui` สำหรับ primitives

### 3.2 API Contracts

- **Base URL:** `/v1` (versioned)
- **Auth:** `Authorization: Bearer <token>` หรือ httpOnly cookie (credentials: 'include')
- **Validation:** TypeBox สำหรับ request body
- **Response:** JSON เสมอ

### 3.3 RBAC

| Role | เข้าถึงได้ |
|------|------------|
| owner | Admin, Orders, Inventory, ดูเมนู |
| staff | Orders, Inventory, Checkout |
| cashier | Checkout, Orders (จำกัด) |

### 3.4 Database

- **Migrations:** `apps/api/src/db/migration-*.sql` เรียงตามหมายเลข
- **Seed:** `schema.sql` + migration seed
- **Mock:** `apps/api/src/db/mock.ts` สำหรับ dev/test เมื่อไม่มี DB จริง

---

## 4. Development Guidelines

### 4.1 ก่อนเริ่มพัฒนา

1. อ่าน `docs/prompts/01_ARCHITECTURE.md` — ขอบเขตและ non-negotiables
2. อ่าน `docs/prompts/AGENTS.md` — ownership ของแต่ละ domain
3. ตรวจสอบ `docs/ROUTES.md` และ `docs/API.md` — สัญญา API/Route

### 4.2 เมื่อเพิ่ม Feature ใหม่

1. **Contract First:** กำหนด types, API endpoints, routes ก่อน
2. **Backend:** เพิ่ม route + schema + RBAC + audit log (ถ้า sensitive)
3. **Frontend:** สร้าง feature module ใหม่ใน `features/`
4. **Test:** หน่วยทดสอบ + E2E สำหรับ critical path

### 4.3 Security Checklist

- [ ] ไม่ hardcode secrets
- [ ] RBAC ตรวจสอบที่ server เท่านั้น
- [ ] Input validation ด้วย TypeBox/Zod
- [ ] Audit log สำหรับ order, payment, auth, role changes

### 4.4 Code Style

- **TypeScript:** strict mode
- **Format:** Prettier (`pnpm format`)
- **Lint:** ESLint (`pnpm lint`)

---

## 5. API Reference (สรุป)

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | /v1/auth/login | - | - |
| GET | /me | Cookie | Any |
| POST | /v1/auth/logout | Cookie | Any |
| GET | /v1/menu?tableCode= | - | Public |
| POST | /v1/orders | Cookie | staff, cashier |
| GET | /v1/orders | Cookie | owner, staff |
| PATCH | /v1/orders/:id/status | Cookie | owner, staff |
| POST | /v1/orders/:id/payment | Cookie | staff, cashier |
| GET | /v1/orders/:id/payment | Cookie | owner, staff |
| GET | /v1/inventory | Cookie | owner, staff |
| GET | /health | - | - |
| GET | /metrics | - | - |

**OpenAPI:** `docs/openapi.yaml`

---

## 6. Routes Reference (สรุป)

| Route | Access | หน้าที่ |
|-------|--------|---------|
| / | Public | Redirect → /menu/A12 |
| /menu/[tableCode] | Public | เมนู, ตระกร้า |
| /checkout | staff, cashier | ตรวจสอบ, สั่งอาหาร |
| /order/success/[id] | Public | ยืนยันออเดอร์ |
| /orders | owner, staff | จัดการออเดอร์ |
| /inventory | owner, staff | จัดการสต็อก |
| /admin | owner | Dashboard (placeholder) |
| /staff | Public | ลิงก์สำหรับเจ้าหน้าที่ |
| /login | Public | เข้าสู่ระบบ |

---

## 7. Environment Variables

### API (`apps/api/.env`)

```env
PORT=3001
DATABASE_URL=postgresql://...
JWT_SECRET=<32+ chars, openssl rand -base64 32>
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### Web (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 8. Testing Strategy

### 8.1 Unit Tests (Vitest)

- **Location:** `*.test.ts` ข้างไฟล์ที่ทดสอบ
- **Scope:** API routes, schemas, lib
- **Coverage:** 50%+ statements, 40%+ branches
- **Run:** `pnpm test`

### 8.2 E2E (Playwright)

- **Location:** `apps/web/e2e/`
- **Scope:** Customer ordering, Staff login, Orders
- **Run:** `cd apps/web && pnpm test:e2e`

### 8.3 CI Pipeline

`.github/workflows/ci.yml`:

1. Lint
2. Unit tests + coverage
3. Audit (fail if critical)
4. Build
5. E2E (with migrations)

---

## 9. Deployment

- **Pre-deploy:** `docs/PRODUCTION_CHECKLIST.md`
- **Deploy guide:** `docs/DEPLOYMENT.md`
- **Migrations:** `docs/MIGRATIONS.md`

---

## 10. Implementation Roadmap (แนะนำ)

### Phase 1: เสถียรภาพ (ปัจจุบัน)

- [x] Customer flow ครบ
- [x] Orders + Payment
- [x] Inventory
- [x] Auth + RBAC
- [ ] แก้ Guest Order flow (ลูกค้าไม่ login ก็สั่งได้)

### Phase 2: จัดการเมนู

- [ ] Menu Management UI (`/manager/menu` หรือ `/admin/menu`)
- [ ] CRUD หมวดหมู่, รายการอาหาร
- [ ] อัปโหลดรูปเมนู

### Phase 3: KDS + Cashier

- [ ] `/staff/kds` — Kitchen Display
- [ ] Order status flow: NEW → ACCEPTED → COOKING → READY → SERVED
- [ ] `/staff/cashier` — แยกจาก orders สำหรับรับชำระ/ออกใบเสร็จ
- [ ] Realtime (WebSocket หรือ polling)

### Phase 4: Manager Features

- [ ] Inventory: receive invoice, stock movements
- [ ] Payroll: attendance, leave, payroll period
- [ ] Expenses: categories, entries

### Phase 5: Scale

- [ ] Multi-branch
- [ ] i18n (TH/EN/JP/ZH)
- [ ] PWA สำหรับลูกค้า

---

## 11. ช่องว่างที่ต้องแก้ก่อน Production

ดูรายละเอียดใน `docs/IMPROVEMENT_PLAN.md` สรุป Critical:

1. **Guest Order:** ลูกค้าไม่ login — ต้องมี endpoint เช่น `POST /v1/orders/public` (รับ tableCode)
2. **Inventory routes:** ตรวจสอบว่า register แล้ว
3. **Password hash:** ใช้ `seed-passwords.js` สำหรับ seed users
4. **index-simple.ts:** CORS เปิดกว้าง — ลบหรือจำกัด

---

## 12. เอกสารอ้างอิง

| เอกสาร | วัตถุประสงค์ |
|--------|--------------|
| `docs/prompts/01_ARCHITECTURE.md` | สถาปัตยกรรมและขอบเขต |
| `docs/prompts/04_BACKEND_SERVICES.md` | Backend services spec |
| `docs/prompts/05_FRONTEND_APPS.md` | Frontend routes และ UX |
| `docs/API.md` | API endpoints |
| `docs/ROUTES.md` | Frontend routes + RBAC |
| `docs/STATUS.md` | สถานะโปรเจกต์ |
| `docs/IMPROVEMENT_PLAN.md` | รายการแก้ไข |
| `docs/ASSESSMENT.md` | คะแนนประเมิน |

---

## 13. สรุปสำหรับนักพัฒนา

1. **เริ่มต้น:** `pnpm install` → `pnpm dev` → เปิด `http://localhost:3000`
2. **อ่านก่อน:** `01_ARCHITECTURE.md`, `AGENTS.md`, `ROUTES.md`
3. **พัฒนา:** Contract first, feature isolation, test critical path
4. **Deploy:** ใช้ `PRODUCTION_CHECKLIST.md` และ `DEPLOYMENT.md`

---

*เอกสารนี้เขียนเพื่อให้ทีมพัฒนาเข้าใจ Tech Stack และนำไปใช้ได้อย่างมีประสิทธิภาพ*
