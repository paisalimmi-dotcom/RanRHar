# RanRHar — ออกแบบระบบจองโต๊ะ (Table Reservation System)

**Version:** 1.0  
**วันที่:** 2026-02-08  
**สถานะ:** Design Phase

---

## 1. ภาพรวมระบบ

### 1.1 Flow การจองโต๊ะ

```
ลูกค้าจองโต๊ะ (ออนไลน์/โทร)
        │
        ▼
┌─────────────────────────────────────┐
│ 1. กรอกข้อมูล: ชื่อ, เบอร์, วันที่/เวลา, จำนวนคน │
│ 2. เลือกโต๊ะ (หรือให้ระบบเลือก)     │
│ 3. ยืนยันการจอง                     │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Host/Manager รับการจอง               │
│ - ยืนยันการจอง                       │
│ - หรือปฏิเสธ (ถ้าโต๊ะไม่ว่าง)        │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ ลูกค้ามาถึงร้าน                       │
│ - แสดง QR Code หรือเลขโต๊ะ           │
│ - สั่งอาหารผ่าน QR                   │
└─────────────────────────────────────┘
```

---

## 2. Database Design

### 2.1 ตาราง `reservations`

```sql
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255), -- Optional
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    table_code VARCHAR(50), -- NULL = ยังไม่ได้กำหนดโต๊ะ
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    special_requests TEXT, -- อาหารพิเศษ, วันเกิด, ฯลฯ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    seated_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancelled_by INTEGER REFERENCES users(id),
    cancel_reason TEXT,
    created_by INTEGER REFERENCES users(id), -- NULL = ลูกค้าจองเอง
    notes TEXT -- หมายเหตุจาก Host/Manager
);

CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_table_code ON reservations(table_code);
CREATE INDEX idx_reservations_phone ON reservations(customer_phone);
```

### 2.2 ตาราง `tables` (ถ้ายังไม่มี)

```sql
CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    table_code VARCHAR(50) UNIQUE NOT NULL, -- A12, B05, etc.
    capacity INTEGER NOT NULL CHECK (capacity > 0), -- จำนวนที่นั่ง
    location VARCHAR(100), -- ภายใน/นอก, โซน A/B
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tables_code ON tables(table_code);
CREATE INDEX idx_tables_active ON tables(is_active);
```

---

## 3. API Design

### 3.1 Public Endpoints (ลูกค้า)

#### `POST /reservations` — สร้างการจอง
```typescript
Request:
{
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  reservationDate: string; // YYYY-MM-DD
  reservationTime: string; // HH:MM
  partySize: number;
  tableCode?: string; // Optional - ถ้าไม่ระบุให้ระบบเลือก
  specialRequests?: string;
}

Response:
{
  id: number;
  reservationCode: string; // เช่น "RES-20260208-001"
  status: 'PENDING';
  message: "รอการยืนยันจากร้าน";
}
```

#### `GET /reservations/check` — ตรวจสอบโต๊ะว่าง
```typescript
Query: ?date=2026-02-08&time=18:00&partySize=4

Response:
{
  availableTables: [
    { tableCode: 'A12', capacity: 4, location: 'ภายใน' },
    { tableCode: 'B05', capacity: 6, location: 'นอก' }
  ],
  suggestedTable: 'A12'
}
```

#### `GET /reservations/:code` — ดูสถานะการจอง
```typescript
Query: ?phone=0812345678 (verify)

Response:
{
  id: number;
  reservationCode: string;
  customerName: string;
  reservationDate: string;
  reservationTime: string;
  tableCode: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED';
  partySize: number;
}
```

---

### 3.2 Staff Endpoints (Host/Manager)

#### `GET /reservations` — รายการจอง
```typescript
Query: ?date=2026-02-08&status=PENDING

Response:
{
  reservations: [
    {
      id: number;
      reservationCode: string;
      customerName: string;
      customerPhone: string;
      reservationDate: string;
      reservationTime: string;
      partySize: number;
      tableCode: string | null;
      status: string;
      specialRequests?: string;
    }
  ]
}
```

#### `PATCH /reservations/:id/confirm` — ยืนยันการจอง
```typescript
Request:
{
  tableCode: string; // กำหนดโต๊ะ
  notes?: string;
}

Response:
{
  id: number;
  status: 'CONFIRMED';
  tableCode: string;
  confirmedAt: string;
}
```

#### `PATCH /reservations/:id/seat` — ลูกค้ามาถึง (Seated)
```typescript
Response:
{
  id: number;
  status: 'SEATED';
  seatedAt: string;
  tableCode: string;
  qrCode: string; // URL สำหรับสั่งอาหาร /menu/A12
}
```

#### `PATCH /reservations/:id/cancel` — ยกเลิกการจอง
```typescript
Request:
{
  reason: string;
}

Response:
{
  id: number;
  status: 'CANCELLED';
  cancelledAt: string;
}
```

---

## 4. Frontend Design

### 4.1 หน้าจองโต๊ะ (ลูกค้า) — `/reservation`

#### UI Components
```
┌─────────────────────────────────────────┐
│  จองโต๊ะ                                 │
├─────────────────────────────────────────┤
│  ชื่อ-นามสกุล: [___________]            │
│  เบอร์โทร: [___________]                │
│  อีเมล (ไม่บังคับ): [___________]        │
│                                          │
│  วันที่: [📅 เลือกวันที่]                │
│  เวลา: [🕐 เลือกเวลา]                    │
│  จำนวนคน: [🔢 เลือก]                     │
│                                          │
│  โต๊ะ (ไม่บังคับ):                       │
│  ○ ให้ระบบเลือก                          │
│  ○ เลือกเอง: [Dropdown]                 │
│                                          │
│  หมายเหตุพิเศษ:                          │
│  [________________________]              │
│                                          │
│  [ยืนยันการจอง]                          │
└─────────────────────────────────────────┘
```

#### Flow
1. กรอกข้อมูล → ตรวจสอบโต๊ะว่าง
2. ถ้าเลือกโต๊ะเอง → แสดงโต๊ะที่ว่าง
3. ยืนยันการจอง → แสดง Reservation Code
4. แสดง "รอการยืนยันจากร้าน"

---

### 4.2 หน้าจัดการจอง (Host/Manager) — `/staff/reservations`

#### UI Layout
```
┌─────────────────────────────────────────────────────────┐
│  จัดการจองโต๊ะ                    [📅 เลือกวันที่]      │
├─────────────────────────────────────────────────────────┤
│  [ทั้งหมด] [รอยืนยัน] [ยืนยันแล้ว] [ลูกค้ามาแล้ว] [ยกเลิก] │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐   │
│  │ RES-001 | สมชาย | 0812345678 | 18:00 | 4 คน     │   │
│  │ โต๊ะ: - | สถานะ: รอยืนยัน                        │   │
│  │ [ยืนยัน] [กำหนดโต๊ะ] [ยกเลิก]                    │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ RES-002 | สมหญิง | 0823456789 | 19:00 | 2 คน     │   │
│  │ โต๊ะ: A12 | สถานะ: ยืนยันแล้ว                    │   │
│  │ [ลูกค้ามาแล้ว] [ดูรายละเอียด]                     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### Actions
- **ยืนยัน** — กำหนดโต๊ะ → สถานะ = CONFIRMED
- **ลูกค้ามาแล้ว** — สถานะ = SEATED → แสดง QR Code
- **ยกเลิก** — กรอกเหตุผล → สถานะ = CANCELLED

---

### 4.3 หน้า Dashboard (Host) — `/staff/reservations/today`

แสดงสรุปการจองวันนี้:
```
┌─────────────────────────────────────────┐
│  การจองวันนี้ (2026-02-08)               │
├─────────────────────────────────────────┤
│  รอยืนยัน: 3                            │
│  ยืนยันแล้ว: 8                          │
│  ลูกค้ามาแล้ว: 5                         │
│  ยกเลิก: 1                              │
├─────────────────────────────────────────┤
│  Timeline:                              │
│  12:00 - RES-001 (โต๊ะ A12) - 4 คน     │
│  13:00 - RES-002 (โต๊ะ B05) - 2 คน     │
│  18:00 - RES-003 (รอยืนยัน) - 6 คน     │
└─────────────────────────────────────────┘
```

---

## 5. Business Rules

### 5.1 การตรวจสอบโต๊ะว่าง

| เงื่อนไข | ตรวจสอบ |
|----------|---------|
| **วันที่/เวลา** | ไม่มีการจองที่ซ้อนทับ |
| **จำนวนคน** | โต๊ะรองรับได้ (capacity >= partySize) |
| **สถานะโต๊ะ** | is_active = TRUE |
| **เวลาล่วงหน้า** | จองได้ล่วงหน้าได้กี่วัน (เช่น 30 วัน) |

### 5.2 สถานะการจอง

| สถานะ | ความหมาย | Transition |
|-------|----------|------------|
| **PENDING** | รอยืนยันจากร้าน | → CONFIRMED หรือ CANCELLED |
| **CONFIRMED** | ยืนยันแล้ว รอลูกค้ามา | → SEATED หรือ CANCELLED |
| **SEATED** | ลูกค้ามาถึง นั่งแล้ว | → COMPLETED |
| **COMPLETED** | เสร็จสิ้น (กินเสร็จ) | - |
| **CANCELLED** | ยกเลิก | - |
| **NO_SHOW** | ไม่มา (หลังเวลาจองผ่านไป) | - |

### 5.3 การกำหนดโต๊ะ

- **ถ้าลูกค้าเลือกโต๊ะ** → ใช้โต๊ะนั้น (ถ้าว่าง)
- **ถ้าไม่เลือก** → ระบบเลือกโต๊ะที่เหมาะสม:
  - จำนวนคนพอดี (ไม่ใหญ่เกินไป)
  - โซนที่เหมาะสม (ถ้ามี)
  - ไม่มีการจองซ้อนทับ

---

## 6. Integration กับระบบที่มีอยู่

### 6.1 เชื่อมกับ Order System

```
การจอง → ลูกค้ามาถึง → SEATED → สั่งอาหาร
        │
        ▼
┌─────────────────────────────────────┐
│ เมื่อ SEATED:                        │
│ - แสดง QR Code: /menu/A12           │
│ - ลูกค้าสแกน QR → สั่งอาหาร          │
│ - ออเดอร์จะเชื่อมกับ table_code      │
└─────────────────────────────────────┘
```

### 6.2 เชื่อมกับ Payment

```
กินเสร็จ → ชำระเงิน → COMPLETED
```

---

## 7. UX Considerations

### 7.1 ลูกค้า

| จุด | UX ที่ดี |
|-----|----------|
| **จอง** | ง่าย รวดเร็ว ไม่ต้อง login |
| **ยืนยัน** | แจ้ง SMS/Email (ถ้ามีเบอร์/อีเมล) |
| **ตรวจสอบ** | ใช้ Reservation Code + เบอร์โทร |
| **มาถึง** | แสดง QR Code ชัดเจน |

### 7.2 Host/Manager

| จุด | UX ที่ดี |
|-----|----------|
| **ดูรายการ** | แสดงตามวันที่, กรองตามสถานะ |
| **ยืนยัน** | เร็ว กำหนดโต๊ะได้ง่าย |
| **ลูกค้ามา** | กดปุ่ม "ลูกค้ามาแล้ว" → แสดง QR |

---

## 8. Security & Validation

### 8.1 Rate Limiting
- จองได้ 5 ครั้ง/วัน/เบอร์โทร (ป้องกัน spam)

### 8.2 Validation
- เบอร์โทร: ตรวจสอบรูปแบบ (10 หลัก)
- วันที่: ไม่จองย้อนหลัง, ไม่จองเกิน 30 วัน
- เวลา: อยู่ในเวลาทำการ (เช่น 11:00-22:00)
- จำนวนคน: 1-20 คน

### 8.3 Privacy
- ไม่เก็บข้อมูลส่วนตัวมากเกินไป
- ใช้เบอร์โทรเป็นหลักในการ verify

---

## 9. Implementation Plan

### Phase 1: Database & Backend (1-2 วัน)
- [ ] สร้างตาราง `reservations` และ `tables`
- [ ] Migration script
- [ ] API endpoints (POST, GET, PATCH)

### Phase 2: Frontend - จองโต๊ะ (ลูกค้า) (1-2 วัน)
- [ ] หน้า `/reservation`
- [ ] Form validation
- [ ] แสดง Reservation Code

### Phase 3: Frontend - จัดการจอง (Host/Manager) (2-3 วัน)
- [ ] หน้า `/staff/reservations`
- [ ] Dashboard วันนี้
- [ ] Actions: ยืนยัน, กำหนดโต๊ะ, SEATED, Cancel

### Phase 4: Integration (1 วัน)
- [ ] เชื่อมกับ Order System (QR Code)
- [ ] แสดง QR เมื่อ SEATED

---

## 10. สรุป

### Features
- ✅ ลูกค้าจองโต๊ะได้ (ไม่ต้อง login)
- ✅ Host/Manager จัดการจอง
- ✅ ตรวจสอบโต๊ะว่าง
- ✅ เชื่อมกับ Order System (QR Code)

### Benefits
- ลดการรอคิว
- จัดการโต๊ะได้ดีขึ้น
- ลูกค้าสะดวกขึ้น

---

*เอกสารนี้ออกแบบสำหรับ RanRHar Restaurant POS System*
