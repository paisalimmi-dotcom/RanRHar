# คู่มือการเข้าถึงเมนูสำหรับ Role ต่างๆ

## สรุปภาพรวม

ระบบ RanRHar มีหน้าเมนูหลายแบบสำหรับ Role ต่างๆ:

| Role | หน้าเมนูที่เข้าถึงได้ | URL | วัตถุประสงค์ |
|------|---------------------|-----|-------------|
| **ลูกค้า (Guest)** | เมนูลูกค้า | `/menu/[tableCode]` | ดูเมนูและสั่งอาหาร |
| **Staff** | เมนูลูกค้า, Staff Portal | `/menu/[tableCode]`, `/staff` | ดูเมนู, เข้าถึงหน้าจัดการต่างๆ |
| **Manager** | เมนูลูกค้า, Staff Portal, Admin Menu | `/menu/[tableCode]`, `/staff`, `/admin/menu` | ดูเมนู, จัดการเมนู (แก้ไขชื่อ ราคา รูปภาพ) |
| **Owner** | เมนูลูกค้า, Staff Portal, Admin Menu | `/menu/[tableCode]`, `/staff`, `/admin/menu` | ดูเมนู, ดูการจัดการเมนู (ดูอย่างเดียว) |

---

## 1. เมนูลูกค้า (Customer Menu)

**URL:** `/menu/[tableCode]` (เช่น `/menu/A12`)

**เข้าถึงได้โดย:** ทุกคน (Public)

**ฟีเจอร์:**
- ดูรายการอาหารทั้งหมด
- เพิ่มอาหารลงตะกร้า
- สั่งอาหาร
- เปลี่ยนภาษา (ไทย/English)
- ดูสถานะออเดอร์

**สำหรับ Staff/Manager/Owner:**
- เมื่อ login แล้ว จะเห็น link "เจ้าหน้าที่" → ไปที่ `/staff`
- ถ้าเป็น Manager/Owner จะเห็น link "จัดการเมนู" → ไปที่ `/admin/menu`

---

## 2. Staff Portal

**URL:** `/staff`

**เข้าถึงได้โดย:** ทุกคน (Public - แต่บางหน้าต้อง login)

**ฟีเจอร์:**
- Navigation hub สำหรับเจ้าหน้าที่ทุก role
- แสดง links ตาม role ที่ login:
  - **KDS (ครัว)** - สำหรับ Chef/Staff/Manager
  - **รายการออเดอร์** - สำหรับทุก role (ยกเว้น Guest)
  - **จัดการสต็อก** - สำหรับ Manager/Staff
  - **สรุปโต๊ะ** - สำหรับ Staff/Cashier/Host
  - **Admin** - สำหรับ Owner/Manager

**วิธีเข้า:**
1. ไปที่ `/staff` โดยตรง
2. หรือคลิก "เจ้าหน้าที่" จากหน้าเมนูลูกค้า (ถ้า login แล้ว)

---

## 3. Admin Menu (จัดการเมนู)

**URL:** `/admin/menu`

**เข้าถึงได้โดย:** Manager, Owner (ต้อง login)

**ฟีเจอร์:**
- **Manager:** แก้ไขชื่อ ราคา รูปภาพ ของรายการเมนู
- **Owner:** ดูอย่างเดียว (ไม่สามารถแก้ไขได้)

**วิธีเข้า:**
1. Login เป็น Manager หรือ Owner
2. ไปที่ `/admin` → คลิก "จัดการเมนู"
3. หรือคลิก "จัดการเมนู" จากหน้าเมนูลูกค้า (ถ้า login แล้วเป็น Manager/Owner)

---

## 4. หน้าอื่นๆ ที่เกี่ยวข้อง

### Orders Page (`/orders`)
- **เข้าถึงได้โดย:** Owner, Manager, Staff, Cashier, Chef, Host, Delivery
- จัดการคำสั่งซื้อ บันทึกการชำระ

### KDS (`/staff/kds`)
- **เข้าถึงได้โดย:** Manager, Staff, Chef
- หน้าจอแสดงออเดอร์สำหรับพ่อครัว

### Tables Summary (`/staff/tables`)
- **เข้าถึงได้โดย:** Owner, Manager, Staff, Cashier, Host, Delivery
- ออเดอร์ตามสถานะ สำหรับพนักงานเสิร์ฟ

### Inventory (`/inventory`)
- **เข้าถึงได้โดย:** Manager, Staff
- จัดการคลังสินค้าและวัตถุดิบ

---

## 5. Flow การใช้งาน

### สำหรับลูกค้า:
```
เปิดเว็บ → /menu/A12 → ดูเมนู → สั่งอาหาร → Checkout → Success
```

### สำหรับ Staff:
```
เปิดเว็บ → /staff → Login → เข้าถึงหน้าต่างๆ ตาม role
หรือ
เปิดเว็บ → /menu/A12 → Login → คลิก "เจ้าหน้าที่" → เข้าถึงหน้าต่างๆ
```

### สำหรับ Manager:
```
เปิดเว็บ → /staff → Login → เข้าถึง Admin → จัดการเมนู
หรือ
เปิดเว็บ → /menu/A12 → Login → คลิก "จัดการเมนู" → แก้ไขเมนู
```

### สำหรับ Owner:
```
เปิดเว็บ → /staff → Login → เข้าถึง Admin → ดูการจัดการเมนู
หรือ
เปิดเว็บ → /menu/A12 → Login → คลิก "จัดการเมนู" → ดูเมนู (ดูอย่างเดียว)
```

---

## 6. หมายเหตุ

- **เมนูลูกค้า** (`/menu/[tableCode]`) แสดงเมนูแบบ read-only สำหรับลูกค้า
- **Admin Menu** (`/admin/menu`) สำหรับ Manager/Owner จัดการเมนู (แก้ไขชื่อ ราคา รูปภาพ)
- **Staff Portal** (`/staff`) เป็น navigation hub สำหรับเจ้าหน้าที่ทุก role
- ทุกหน้าเมนูรองรับการเปลี่ยนภาษา (ไทย/English)
