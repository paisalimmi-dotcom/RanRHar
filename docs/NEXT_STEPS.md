# สรุปสิ่งที่ต้องทำต่อไป (Next Steps)

**อัปเดตล่าสุด:** 2026-02-09  
**สถานะปัจจุบัน:** ระบบพื้นฐานทำงานได้แล้ว (Customer Menu, Orders, Payment, Inventory, i18n)

---

## 📋 สรุปสิ่งที่เสร็จแล้ว

### ✅ Core Features (เสร็จแล้ว)
- ✅ Customer Menu (`/menu/[tableCode]`) - รองรับ i18n (ไทย/English)
- ✅ Cart & Checkout
- ✅ Order Management (PENDING/CONFIRMED/COMPLETED/CANCELLED)
- ✅ Payment (CASH/QR)
- ✅ Inventory Management
- ✅ Authentication & RBAC (8 roles)
- ✅ Table Management (เก็บ table_code ใน orders)
- ✅ Order Cancellation (PENDING + Manager override)
- ✅ Customer Order Status Page (`/order/status/[id]`)
- ✅ i18n System (ไทย/English) - UI และเมนู

---

## 🎯 สิ่งที่ต้องทำต่อไป (เรียงตามความสำคัญ)

### 🔴 Priority 1: Features ที่ออกแบบไว้แล้ว แต่ยังไม่ได้ Implement

#### 1. Split Bill / Combined Bill System
**สถานะ:** ออกแบบแล้ว (DB schema, API design) แต่ยังไม่ได้ implement

**สิ่งที่ต้องทำ:**
- [ ] Database Migration: เพิ่ม `order_payments` table (payer, amount, validation)
- [ ] Backend API: `POST /orders/:id/payment/split`
- [ ] Backend API: `GET /orders/:id/payments`
- [ ] Frontend: Split Bill Modal UI
- [ ] Frontend: Combined Bill UI (จ่ายรวมหลายออเดอร์)

**เอกสารอ้างอิง:** ออกแบบไว้ใน conversation history

---

#### 2. Table Reservation System
**สถานะ:** ออกแบบแล้ว (DB schema, API design, UI flows) แต่ยังไม่ได้ implement

**สิ่งที่ต้องทำ:**
- [ ] Database Migration: เพิ่ม `reservations` table
- [ ] Backend API: CRUD operations สำหรับ reservations
- [ ] Frontend: Reservation Management UI (Manager)
- [ ] Frontend: Reservation Calendar/List View
- [ ] Integration: เชื่อมโยงกับ table management

**เอกสารอ้างอิง:** ออกแบบไว้ใน conversation history

---

### 🟡 Priority 2: Features ที่ยังไม่ครบ

#### 3. Menu Management UI Enhancement
**สถานะ:** มี `/admin/menu` แล้ว แต่ยังไม่ครบ

**สิ่งที่ต้องทำ:**
- [ ] เพิ่ม CRUD สำหรับ `name_en` (ชื่อภาษาอังกฤษ)
- [ ] Image Upload UI (อัปโหลดรูปเมนู)
- [ ] Menu Item Modifiers (ตัวเลือกเพิ่มเติม เช่น เผ็ด/ไม่เผ็ด)
- [ ] Menu Availability (เปิด/ปิดรายการ)

---

#### 4. KDS (Kitchen Display System) Enhancement
**สถานะ:** มี `/staff/kds` แล้ว แต่ยังไม่ครบ

**สิ่งที่ต้องทำ:**
- [ ] Order Status Flow: NEW → ACCEPTED → COOKING → READY → SERVED
- [ ] Realtime Updates (WebSocket หรือ polling)
- [ ] Kitchen Timer (แสดงเวลาที่ใช้ทำอาหาร)
- [ ] Priority Orders (ออเดอร์ด่วน)

---

#### 5. Cashier Page (แยกจาก Orders)
**สถานะ:** ยังไม่มีหน้าแยก

**สิ่งที่ต้องทำ:**
- [ ] สร้าง `/staff/cashier` page
- [ ] แสดงเฉพาะออเดอร์ที่รอชำระ
- [ ] Settlement UI (บันทึกการชำระ)
- [ ] Receipt Generation (ออกใบเสร็จ)
- [ ] Tax Invoice (ใบกำกับภาษี)

---

### 🟢 Priority 3: Manager Features

#### 6. Payroll System
**สถานะ:** ยังไม่มี

**สิ่งที่ต้องทำ:**
- [ ] Database Schema: `attendance_logs`, `leave_requests`, `payroll_periods`
- [ ] Attendance Tracking UI
- [ ] Leave Request Management
- [ ] Payroll Calculation & Approval

---

#### 7. Expenses Management
**สถานะ:** ยังไม่มี

**สิ่งที่ต้องทำ:**
- [ ] Database Schema: `expense_categories`, `expenses`
- [ ] Expense CRUD UI
- [ ] Monthly Expense Reports
- [ ] Integration with P&L

---

#### 8. Owner Dashboard
**สถานะ:** ยังไม่มี

**สิ่งที่ต้องทำ:**
- [ ] Dashboard UI (`/owner/dashboard`)
- [ ] KPIs: Today Sales, Receipts, Low Stock Alerts
- [ ] P&L Report
- [ ] Multi-branch Support (อนาคต)

---

### 🔵 Priority 4: UX & Quality Improvements

#### 9. Menu Features Enhancement
**สิ่งที่ต้องทำ:**
- [ ] Food Tags (เนื้อ, หมู, ทะเล, มังสวิรัติ)
- [ ] Promotions (ลดราคา, แถม)
- [ ] Menu Search Enhancement
- [ ] Menu Filtering (ตามหมวดหมู่, tags, ราคา)

---

#### 10. Order Features Enhancement
**สิ่งที่ต้องทำ:**
- [ ] Special Requests (คำขอพิเศษใน order_items)
- [ ] Order History (ลูกค้าเห็นประวัติการสั่ง)
- [ ] Order Notes (บันทึกเพิ่มเติม)
- [ ] Order Rating/Feedback

---

#### 11. Payment Features Enhancement
**สิ่งที่ต้องทำ:**
- [ ] Multiple Payment Methods (บัตร, โอน)
- [ ] VAT Calculation (7%)
- [ ] Receipt Template Customization
- [ ] Payment Refund Flow

---

### 🟣 Priority 5: Technical Improvements

#### 12. Realtime Updates
**สิ่งที่ต้องทำ:**
- [ ] WebSocket Integration
- [ ] Real-time Order Status Updates
- [ ] Real-time KDS Updates
- [ ] Real-time Inventory Alerts

---

#### 13. Performance & Scalability
**สิ่งที่ต้องทำ:**
- [ ] Image Optimization (CDN)
- [ ] Database Indexing Optimization
- [ ] API Response Caching
- [ ] Frontend Code Splitting

---

#### 14. Testing & QA
**สิ่งที่ต้องทำ:**
- [ ] E2E Tests สำหรับ features ใหม่
- [ ] Unit Tests สำหรับ critical functions
- [ ] Integration Tests สำหรับ API
- [ ] Performance Testing

---

#### 15. Documentation
**สิ่งที่ต้องทำ:**
- [ ] API Documentation (OpenAPI/Swagger)
- [ ] User Manual (สำหรับแต่ละ role)
- [ ] Deployment Guide
- [ ] Troubleshooting Guide

---

## 📊 สรุปตาม Phase

### Phase 1: Payment & Reservation (Priority 1)
- [ ] Split Bill / Combined Bill
- [ ] Table Reservation System

### Phase 2: Staff Operations (Priority 2)
- [ ] Menu Management Enhancement
- [ ] KDS Enhancement
- [ ] Cashier Page

### Phase 3: Management Features (Priority 3)
- [ ] Payroll System
- [ ] Expenses Management
- [ ] Owner Dashboard

### Phase 4: UX Improvements (Priority 4)
- [ ] Menu Features Enhancement
- [ ] Order Features Enhancement
- [ ] Payment Features Enhancement

### Phase 5: Technical (Priority 5)
- [ ] Realtime Updates
- [ ] Performance & Scalability
- [ ] Testing & QA
- [ ] Documentation

---

## 🎯 Quick Wins (ทำได้เร็ว)

1. **Menu Management Enhancement** - เพิ่ม CRUD สำหรับ `name_en`
2. **Image Upload UI** - สำหรับอัปโหลดรูปเมนู
3. **Food Tags** - เพิ่ม tags สำหรับเมนู (เนื้อ, หมู, ทะเล, มังสวิรัติ)
4. **Order Notes** - เพิ่มฟิลด์ notes ใน order items
5. **Receipt Template** - ปรับปรุงใบเสร็จให้สวยขึ้น

---

## 📝 หมายเหตุ

- **Priority 1** = Features ที่ออกแบบไว้แล้ว ควรทำก่อน
- **Priority 2** = Features ที่สำคัญสำหรับการใช้งานประจำวัน
- **Priority 3** = Features สำหรับการจัดการร้าน
- **Priority 4** = UX improvements ที่ทำให้ระบบดีขึ้น
- **Priority 5** = Technical improvements ที่ทำให้ระบบเสถียรและเร็วขึ้น

---

*เอกสารนี้อ้างอิงจาก IMPLEMENTATION_SUMMARY.md, DEVELOPER_SPEC.md, และ conversation history*
