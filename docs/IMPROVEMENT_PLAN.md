# RanRHar — แผนปรับปรุง Code แบบ Full Stack (CTO/PM Audit)

**วันที่ Audit:** 2026-02-08  
**ผู้ตรวจสอบ:** CTO/PM Audit  
**วัตถุประสงค์:** ทำให้โปรเจกต์แข็งแกร่ง พร้อมใช้งาน Production จริง

---

## สรุป Executive Summary

| หมวด | ปัญหาร้ายแรง | ปัญหาปานกลาง | ปัญหาเล็กน้อย | สถานะรวม |
|------|--------------|---------------|---------------|-----------|
| Backend API | 3 | 5 | 4 | ต้องแก้เร่งด่วน |
| Frontend | 2 | 6 | 5 | ต้องปรับปรุง |
| Database | 2 | 3 | 2 | แก้ไขก่อน Deploy |
| Testing | 1 | 2 | 1 | ยังไม่เพียงพอ |
| DevOps/CI | 2 | 3 | 2 | ยังไม่มี |
| Architecture | 1 | 2 | 3 | ยังมีช่องว่าง |

---

## Part 1: ปัญหาร้ายแรง (Critical) — แก้ก่อน Production

### 1.1 🚨 Inventory Routes ไม่ได้ Register

**ไฟล์:** `apps/api/src/index.ts`  
**ปัญหา:** `inventoryRoutes` ถูก import แต่ไม่ถูกเรียก `fastify.register(inventoryRoutes)` ทำให้ `/inventory` และ `/inventory/:id` ไม่ทำงาน

**แก้ไข:**
```typescript
await fastify.register(inventoryRoutes);
```

---

### 1.2 🚨 Password Hash ใน schema.sql ไม่ถูกต้อง

**ไฟล์:** `apps/api/src/db/schema.sql`  
**ปัญหา:** Bcrypt hash ที่ใช้เป็น placeholder ไม่ผ่านการ verify กับ "password123" ชุด seed user ไม่สามารถ login ได้

**แก้ไข:** รัน `node apps/api/seed-passwords.js` แล้วใช้ hash ที่ได้อัปเดต `schema.sql` หรือสร้าง migration แยกสำหรับ seed users

---

### 1.3 🚨 Customer ไม่สามารถ Place Order ได้

**ปัญหา:** `POST /orders` ต้องการ role `staff` หรือ `cashier` แต่ลูกค้าที่หน้า `/menu/[tableCode]` ไม่ได้ login ทำให้ checkout แล้วสร้าง order ไม่ได้

**ทางเลือกในการแก้:**
- **A)** แยก endpoint สำหรับลูกค้า เช่น `POST /orders/public` (รับ `tableCode` เพื่อระบุโต๊ะ) ไม่ต้อง auth
- **B)** ใช้ guest token / table token สำหรับลูกค้า
- **C)** บังคับให้ Checkout ต้อง login เป็น staff/cashier (เปลี่ยน flow เป็น POS เต็มรูปแบบ)

**แนะนำ:** ทาง A กับ RBAC ว่า staff/cashier ทำ order ได้ทั้งหมด แต่ลูกค้าสร้าง order ได้เฉพาะด้วย tableCode

---

### 1.4 🚨 index-simple.ts CORS เปิดกว้าง

**ไฟล์:** `apps/api/src/index-simple.ts`  
**ปัญหา:** `origin: true` รับทุก origin

**แก้ไข:** ลบไฟล์นี้ถ้าไม่ใช้ หรือเปลี่ยนเป็น whitelist เหมือน `index.ts`

---

### 1.5 🚨 Checkout ไม่มี AuthGuard

**ไฟล์:** `apps/web/src/app/checkout/page.tsx`  
**ปัญหา:** หน้า Checkout ไม่ wrap ด้วย `AuthGuard` และ API ต้องการ staff/cashier ทำให้ UX แย่: ยอมให้กด Place Order แล้วค่อย error 401

**แก้ไข:** Wrap ด้วย `AuthGuard` และกำหนด role ที่เหมาะสม หรือปรับ flow ตามข้อ 1.3

---

## Part 2: ปัญหาปานกลาง (High) — แก้ก่อน Launch

### 2.1 Database Pool Race Condition

**ไฟล์:** `apps/api/src/db/index.ts`  
**ปัญหา:** `getPool()` ส่งคืน pool ก่อนที่ `SELECT NOW()` จะเสร็จ ถ้า connection fail จะ fallback เป็น mock แบบ async ทำให้ request แรกอาจใช้ real pool ที่ยังไม่พร้อม

**แก้ไข:** ใช้ `await pool.query('SELECT 1')` ใน `getPool()` ก่อน return หรือแยกฟังก์ชัน `initDatabase()` และเรียกก่อน start server

---

### 2.2 N+1 Query — Orders Page โหลด Payment แยก

**ไฟล์:** `apps/web/src/app/orders/page.tsx`  
**ปัญหา:** วน loop เรียก `paymentApi.getPayment(order.id)` ทีละ order

**แก้ไข:**
- เพิ่ม API `GET /orders?includePayment=true` หรือ `GET /payments/bulk?orderIds=1,2,3`
- หรือให้ backend คืน payment status ใน `GET /orders` (JOIN/aggregate)

---

### 2.3 ไม่มี Request Schema Validation

**ปัญหา:** ใช้ validation แบบ manual (`if (!email)`) ไม่มี Zod/TypeBox

**แก้ไข:** เพิ่ม `@fastify/type-provider-typebox` หรือ Zod สำหรับทุก route body/params

---

### 2.4 Menu ยังเป็น Mock

**ไฟล์:** `apps/web/src/features/menu/services/menu.service.ts`  
**ปัญหา:** เมนู hardcode ไม่มาจาก DB

**แก้ไข:**
- สร้างตาราง `menu_items`, `menu_categories`, `restaurants`
- สร้าง API `GET /menu?tableCode=...` หรือ `GET /restaurants/:id/menu`
- แทนที่ mock ด้วยการเรียก API

---

### 2.5 ไม่มี Unit Test

**ปัญหา:** ไม่มี `*.test.ts` หรือ `*.spec.ts` สำหรับ logic สำคัญ

**แก้ไข:** เพิ่ม vitest/jest พร้อม unit test สำหรับ:
- `auth.store.ts`, `order.store.ts`
- API routes (ผ่าน supertest หรือ fastify.inject)
- `api-client.ts` (mock fetch)

---

### 2.6 DEPLOYMENT.md ไม่ครบ Migration

**ปัญหา:** รายการ migration ไม่รวม `migration-003-add-inventory.sql`

**แก้ไข:** อัปเดต DEPLOYMENT.md ให้รวม migration 003 และลำดับการรัน

---

## Part 3: ปัญหาเล็กน้อย (Medium) — ปรับปรุงต่อเนื่อง

### 3.1 Error Handling ไม่สม่ำเสมอ

**ปัญหา:** บาง route ใช้ `console.error` บาง route ไม่ handle error

**แก้ไข:** ใช้ centralized error handler และส่ง error ไป Sentry/LogRocket

---

### 3.2 ไม่มี API Versioning

**ปัญหา:** Routes เป็น `/orders`, `/auth` ไม่มี prefix เช่น `/v1`

**แก้ไข:** ใช้ `fastify.register(routes, { prefix: '/v1' })`

---

### 3.3 API Client ไม่มี Retry / Timeout

**ไฟล์:** `apps/web/src/lib/api-client.ts`  
**ปัญหา:** ไม่มี retry, timeout, หรือ circuit breaker

**แก้ไข:** เพิ่ม AbortController สำหรับ timeout และ retry logic สำหรับ transient errors

---

### 3.4 ไม่มี CI/CD Pipeline

**ปัญหา:** ไม่มี GitHub Actions / GitLab CI สำหรับ build, test, deploy

**แก้ไข:** สร้าง pipeline สำหรับ:
- `pnpm install` → `pnpm lint` → `pnpm build` → `pnpm test`
- E2E ใน CI (optional)
- Deploy ไป staging/production (optional)

---

### 3.5 ไม่มี Health Check แบบลึก

**ปัญหา:** `/health` แค่ return `{ status: 'ok' }` ไม่เช็ค DB

**แก้ไข:** เพิ่ม `/health/ready` ที่ `SELECT 1` เพื่อตรวจสอบ DB

---

## Part 4: แผนดำเนินการตาม Phase

### Phase 1 — Critical Fixes (1–2 วัน) ✅ เสร็จแล้ว

| ลำดับ | งาน | ประเภท | สถานะ |
|------|-----|--------|--------|
| 1 | Register `inventoryRoutes` ใน `index.ts` | Backend | ✅ |
| 2 | แก้ password hash ใน schema หรือ seed script | Backend | ✅ |
| 3 | ออกแบบและ implement Customer Order flow (ข้อ 1.3) | Full Stack | ✅ |
| 4 | ลบหรือแก้ `index-simple.ts` CORS | Backend | ✅ |
| 5 | Checkout ใช้ guest flow (ไม่ต้อง AuthGuard) | Frontend | ✅ |

---

### Phase 2 — High Priority (3–5 วัน) ✅ เสร็จแล้ว

| ลำดับ | งาน | ประเภท | สถานะ |
|------|-----|--------|--------|
| 1 | แก้ DB pool (Phase 1 ทำแล้ว) | Backend | ✅ |
| 2 | Bulk payment / JOIN ใน GET /orders | Backend + Frontend | ✅ |
| 3 | Request validation ด้วย TypeBox | Backend | ✅ |
| 4 | DB + API สำหรับ Menu จาก DB | Full Stack | ✅ |
| 5 | Unit tests สำหรับ core logic | Testing | ✅ |
| 6 | อัปเดต DEPLOYMENT.md | Docs | ✅ |

---

### Phase 3 — Quality & DevOps (1 สัปดาห์) ✅ เสร็จแล้ว

| ลำดับ | งาน | ประเภท | สถานะ |
|------|-----|--------|--------|
| 1 | CI/CD pipeline (GitHub Actions) | DevOps | ✅ |
| 2 | Error tracking (Sentry) | Full Stack | ✅ |
| 3 | API versioning `/v1` | Backend | ✅ |
| 4 | Deep health check `/health/ready` | Backend | ✅ (Phase 2) |
| 5 | Retry + timeout ใน api-client | Frontend | ✅ |

---

### Phase 4 — Production Readiness (2 สัปดาห์)

| ลำดับ | งาน | ประเภท |
|------|-----|--------|
| 1 | Performance profiling (bundle size, render cycles) | Frontend |
| 2 | WebSocket สำหรับ real-time order updates | Full Stack |
| 3 | Multi-branch support (Feature-10) | Full Stack |
| 4 | Monitoring & alerting | DevOps |

---

## Part 5: Checklist ก่อน Production

```
[ ] Critical bugs (Phase 1) แก้ครบ
[ ] Unit tests สำหรับ auth, order, payment
[ ] E2E tests ผ่านทั้งใน CI และ local
[ ] Migrations ครบและรันสำเร็จ
[ ] JWT_SECRET เปลี่ยนจาก default
[ ] CORS ตั้งค่าให้ตรงกับ domain จริง
[ ] Database backup ตั้งค่าแล้ว
[ ] SSL/TLS ใช้กับ production
[ ] Error tracking เปิดใช้งาน
[ ] Health check ใช้ได้ทั้ง /health และ /health/ready
```

---

## Part 6: สรุป Tech Debt

| หมวด | รายการ |
|------|--------|
| Code | Validation, error handling, API versioning |
| Testing | Unit tests, E2E coverage |
| Infra | CI/CD, monitoring, health checks |
| Data | Menu จาก DB, bulk payment |
| Security | ลบ index-simple, แก้ CORS |

---

**Last Updated:** 2026-02-08  
**Next Review:** หลัง Phase 1 เสร็จ
