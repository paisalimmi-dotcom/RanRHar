# RanRHar — หน้าจอแต่ละบทบาท สิทธิ์การเข้าถึง และความปลอดภัย

**Version:** 1.0  
**วันที่:** 2026-02-08  
**วัตถุประสงค์:** แจงให้เห็นว่าคนแต่ละบทบาทเปิด WebApp แล้วเห็นอะไร เข้าถึงได้แค่ไหน และระบบความปลอดภัยระดับโลก

---

## 1. บทบาทและหน้าจอเมื่อเปิด WebApp

### 1.1 ลูกค้า (ไม่มี account, ไม่ login)

| ขั้นตอน | หน้าจอที่เห็น | รายละเอียด |
|---------|----------------|-------------|
| **เปิด URL** | `/` | Redirect ทันที → `/menu/A12` |
| **หน้าแรก** | `/menu/A12` | เมนูอาหาร หมวดหมู่ รูป ราคา ตระกร้า (sticky footer) |
| **เพิ่มในตระกร้า** | เดิม | คลิก Add to Cart — ตระกร้าแสดงจำนวนและยอด |
| **กดสั่งอาหาร** | `/checkout` | สรุปออเดอร์, ปุ่ม Place Order |
| **สั่งสำเร็จ** | `/order/success/[id]` | แสดงเลขออเดอร์, รายการ, ยอดรวม |

**ไม่เห็น:** ลิงก์ staff, orders, inventory, admin (เมนูซ่อน "เจ้าหน้าที่" เมื่อไม่ login)

---

### 1.2 พนักงานเสิร์ฟ / แคชเชียร์ (staff, cashier)

| ขั้นตอน | หน้าจอที่เห็น | รายละเอียด |
|---------|----------------|-------------|
| **เปิด URL** | `/` | Redirect → `/menu/A12` (เหมือนลูกค้า) |
| **เข้า Staff** | `/staff` | คลิก "เจ้าหน้าที่" บนเมนู หรือพิมพ์ /staff โดยตรง |
| **Login** | `/login` | กรอก email, password → Login |
| **หลัง Login** | Redirect → `/menu/A12` | (หรือตามที่ตั้งไว้) |
| **Orders** | `/orders` | **staff เท่านั้น** — ตารางออเดอร์, สถานะ, บันทึกการชำระ |
| **Inventory** | `/inventory` | **staff เท่านั้น** — รายการสต็อก, ปรับปริมาณ |
| **Checkout** | `/checkout` | staff, cashier — สรุปและสั่งอาหาร |
| **Admin** | `/admin` | **staff ไม่เข้าได้** — redirect → /unauthorized |

**staff เห็น:** menu, checkout, orders, inventory, staff  
**cashier เห็น:** menu, checkout, orders (จำกัด — บันทึกการชำระได้), staff

---

### 1.3 เจ้าของร้าน (owner)

| ขั้นตอน | หน้าจอที่เห็น | รายละเอียด |
|---------|----------------|-------------|
| **เปิด URL** | `/` | Redirect → `/menu/A12` |
| **Login** | `/login` | กรอก email, password |
| **หลัง Login** | `/menu/A12` | |
| **Admin** | `/admin` | **owner + manager** — Dashboard (owner ดูอย่างเดียว) |
| **Orders** | `/orders` | ✅ ดูอย่างเดียว |
| **สรุปโต๊ะ** | `/staff/tables` | ✅ ดูอย่างเดียว |
| **Inventory** | `/inventory` | ❌ (manager, staff เท่านั้น — owner ดูไม่ได้) |
| **Checkout** | `/checkout` | ✅ |

**owner เห็น:** ออเดอร์ สรุปโต๊ะ Dashboard — **ดูอย่างเดียว ไม่มีสิทธิ์แก้ไข**

### 1.4 ผู้จัดการ (manager)

| ขั้นตอน | หน้าจอที่เห็น | รายละเอียด |
|---------|----------------|-------------|
| **Admin** | `/admin` | Dashboard + จัดการเมนู |
| **จัดการเมนู** | `/admin/menu` | เพิ่ม/แก้ไขหมวดหมู่และรายการเมนู |
| **Inventory** | `/inventory` | จัดการสต็อกเต็มรูปแบบ |
| **Orders** | `/orders` | ดู อัปเดตสถานะ บันทึกการชำระ |
| **KDS** | `/staff/kds` | ✅ |
| **สรุปโต๊ะ** | `/staff/tables` | ✅ |

**manager เห็น:** ทุกอย่างที่ staff เห็น + Admin + จัดการเมนู

**StaffNav:** แสดงลิงก์ตาม role — owner ดูได้, manager แก้ไขได้

---

## 2. สรุปเส้นทาง (Flow) ตามบทบาท

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    เปิด localhost:3000                    │
                    └─────────────────────────────────────────────────────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │   / → redirect       │
                                    │   /menu/A12          │
                                    └─────────────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
            ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
            │   ลูกค้า      │          │  staff/cashier │          │    owner      │
            │   (ไม่ login) │          │  ไป /staff     │          │   ไป /staff   │
            └───────────────┘          │  → /login      │          │   → /login    │
                    │                  └───────────────┘          └───────────────┘
                    │                          │                          │
                    ▼                          ▼                          ▼
            เมนู → ตระกร้า →          เมนู + checkout +            เมนู + ทุกอย่าง
            checkout → success        orders + inventory            + /admin
```

---

## 3. ตารางสิทธิ์การเข้าถึง (Access Control Matrix)

### 3.1 หน้า (Routes)

| Route | ลูกค้า | cashier | staff | owner |
|-------|--------|---------|-------|-------|
| `/` | ✅ redirect | ✅ redirect | ✅ redirect | ✅ redirect |
| `/menu/[tableCode]` | ✅ | ✅ | ✅ | ✅ |
| `/checkout` | ✅ | ✅ | ✅ | ✅ |
| `/order/success/[id]` | ✅ | ✅ | ✅ | ✅ |
| `/staff` | ✅ | ✅ | ✅ | ✅ |
| `/login` | ✅ | ✅ | ✅ | ✅ |
| `/orders` | ❌ | ✅ | ✅ | ✅ |
| `/inventory` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/admin` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/unauthorized` | ✅ | ✅ | ✅ | ✅ |

*หมายเหตุ: cashier เข้า /orders ได้แล้ว — เพื่อดูรายการและบันทึกการชำระ*

### 3.2 API Endpoints

| Endpoint | ลูกค้า | cashier | staff | owner |
|----------|--------|---------|-------|-------|
| GET /v1/menu | ✅ | ✅ | ✅ | ✅ |
| POST /v1/orders/guest | ✅ | ✅ | ✅ | ✅ |
| GET /v1/orders | ❌ | ❌ | ✅ | ✅ |
| PATCH /v1/orders/:id/status | ❌ | ❌ | ✅ | ✅ |
| POST /v1/orders/:id/payment | ❌ | ✅ | ✅ | ❌* |
| GET /v1/orders/:id/payment | ❌ | ✅ | ✅ | ✅ |
| GET /v1/inventory | ❌ | ❌ | ✅ | ✅ |
| POST /v1/auth/login | ✅ | ✅ | ✅ | ✅ |
| GET /me | ❌ | ✅ | ✅ | ✅ |

*owner อาจมีสิทธิ์ payment ตาม policy — ตรวจสอบ backend*

---

## 4. ระบบความปลอดภัยระดับโลก (World-Class Security)

### 4.1 เลเยอร์ความปลอดภัย

| เลเยอร์ | การป้องกัน | สถานะ |
|---------|-------------|--------|
| **Transport** | HTTPS ใน production, HSTS | ✅ |
| **Authentication** | JWT (1h expiry), httpOnly cookie | ✅ |
| **Authorization** | RBAC server-side, requireRole() | ✅ |
| **Input** | TypeBox schema, validate vs DB | ✅ |
| **Output** | No stack trace ใน prod | ✅ |
| **Rate Limit** | 100/min global, 5/15min login | ✅ |
| **CORS** | Whitelist เท่านั้น | ✅ |
| **Headers** | Helmet (CSP, XSS protection) | ✅ |
| **Audit** | order.create, payment.create, auth | ✅ |

### 4.2 รายการ Security ที่มี

| รายการ | รายละเอียด |
|--------|-------------|
| **JWT** | 1 ชั่วโมงหมดอายุ, ไม่เก็บใน localStorage (ใช้ httpOnly cookie) |
| **Password** | bcrypt, ไม่ leak ใน error |
| **Order** | ราคาตรวจกับ menu_items ใน DB (ไม่ trust client) |
| **Idempotency** | Idempotency-Key ป้องกัน duplicate order |
| **Failed Login** | Audit log + metric (failed_logins_total) |
| **Request** | requestId สำหรับ tracing |
| **Body** | จำกัด 1MB (ป้องกัน DoS) |

### 4.3 สิ่งที่ยังไม่มี (ช่องว่าง)

| รายการ | หมายเหตุ |
|--------|----------|
| MFA | อนาคต |
| Session invalidation | Token หมดอายุเท่านั้น |
| IP blocking | หลัง failed login หลายครั้ง (optional) |

---

## 5. ภาพรวมหน้าจอ (Wireframe สรุป)

### ลูกค้า

```
┌────────────────────────────────────────┐
│  เมนู                    เจ้าหน้าที่ →  │
├────────────────────────────────────────┤
│  Table: A12  Restaurant: RanRHar        │
├────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐            │
│  │ Pad  │ │ Tom  │ │Green │   ...      │
│  │ Thai │ │ Yum  │ │Curry │            │
│  │ ฿199 │ │ ฿249 │ │ ฿189 │            │
│  │ Add  │ │ Add  │ │ Add  │            │
│  └──────┘ └──────┘ └──────┘            │
├────────────────────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  Cart: 3 items  ฿637    [Place Order]  │
└────────────────────────────────────────┘
```

### Staff / Owner (หลัง Login)

```
┌────────────────────────────────────────────────────────────────────────┐
│  [หน้าที่]  Staff | ออเดอร์ | สรุปโต๊ะ | KDS | สต็อก | Admin | Logout   │
├────────────────────────────────────────────────────────────────────────┤
│  Orders Management                     │
│  ┌──────────────────────────────────┐ │
│  │ # │ Table │ Items │ Total │Status│ │
│  │ 1 │ A12   │ ...   │ ฿637  │ PEND │ │
│  │ 2 │ B05   │ ...   │ ฿290  │ PAID │ │
│  └──────────────────────────────────┘ │
│  [Record Payment] [Update Status]      │
└────────────────────────────────────────┘
```

### Owner only (Admin)

```
┌────────────────────────────────────────┐
│  RanRHar    Orders | Inventory | Admin │
├────────────────────────────────────────┤
│  Admin Dashboard                       │
│  This page is only accessible to owners│
└────────────────────────────────────────┘
```

---

## 6. สรุปสำหรับแต่ละบทบาท

| บทบาท | เปิดแอปเห็น | เข้าถึงได้ | ความปลอดภัย |
|-------|--------------|------------|--------------|
| **ลูกค้า** | เมนู → ตระกร้า → Checkout → Success | เมนู, สั่งอาหาร (guest) | ไม่ต้อง login, API validate ราคา |
| **Cashier** | เหมือนลูกค้า + /staff | Login → checkout, orders, staff/tables, บันทึกการชำระ | RBAC server-side |
| **Staff** | เหมือนลูกค้า + /staff | Login → KDS, orders, inventory, staff/tables, checkout | RBAC server-side |
| **Owner** | เหมือน staff | + /admin | RBAC server-side |

---

*เอกสารนี้อ้างอิงจาก ROUTES.md, API.md, auth.guard.tsx และ middleware/auth.ts*
