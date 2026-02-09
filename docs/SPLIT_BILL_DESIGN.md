# RanRHar — ออกแบบระบบแยกบิล/รวมบิล (Split Bill / Combined Bill)

**Version:** 1.0  
**วันที่:** 2026-02-08  
**สถานะ:** Design Phase

---

## 1. สถานะปัจจุบัน

### 1.1 ระบบที่มีอยู่

| รายการ | สถานะ | ข้อจำกัด |
|--------|--------|----------|
| Payment | ✅ มี | 1 order = 1 payment เท่านั้น |
| Amount validation | ✅ มี | amount ต้องเท่ากับ order.total |
| Multiple payments | ❌ ไม่มี | ไม่รองรับหลาย payment ต่อ 1 order |

### 1.2 ปัญหา

- **1 โต๊ะ หลายคน** → ไม่สามารถแยกจ่ายได้
- **หลายโต๊ะ** → ไม่สามารถรวมบิลได้

---

## 2. Use Cases

### 2.1 สถานการณ์จริงในร้านอาหาร

#### กรณีที่ 1: อาหารจานเดียว (แต่ละคนสั่งของตัวเอง)
```
โต๊ะ A12: 4 คน
- สมชาย: Pad Thai + น้ำ (฿250) → จ่ายเอง
- สมหญิง: Tom Yum + น้ำ (฿300) → จ่ายเอง
- สมศักดิ์: Green Curry + น้ำ (฿220) → จ่ายเอง
- สมศรี: Fried Rice + น้ำ (฿150) → จ่ายเอง
รวม: ฿920

→ แยกจ่าย (Split Bill): 4 คน จ่าย 4 ครั้ง
```

#### กรณีที่ 2: อาหารชุด (กินร่วมกัน)
```
โต๊ะ A12: 4 คน
- ชุดสำหรับ 4 คน (฿1,200) → จ่ายรวม
- น้ำ 4 แก้ว (฿180) → จ่ายรวม
รวม: ฿1,380

→ จ่ายรวม (Single Payment): 1 คนจ่าย หรือแบ่งเท่าๆ กัน
```

#### กรณีที่ 3: ผสมกัน (จานเดียว + ชุด)
```
โต๊ะ A12: 4 คน
- สมชาย: Pad Thai (฿250) → จ่ายเอง
- สมหญิง: Tom Yum (฿300) → จ่ายเอง
- ชุดสำหรับ 2 คน (฿600) → สมศักดิ์ + สมศรี แบ่งกัน
- น้ำ 4 แก้ว (฿180) → แบ่งเท่าๆ กัน
รวม: ฿1,330

→ แยกจ่ายแบบกำหนดเอง:
  - สมชาย: ฿250 (Pad Thai) + ฿45 (น้ำ) = ฿295
  - สมหญิง: ฿300 (Tom Yum) + ฿45 (น้ำ) = ฿345
  - สมศักดิ์: ฿300 (ชุดครึ่ง) + ฿45 (น้ำ) = ฿345
  - สมศรี: ฿300 (ชุดครึ่ง) + ฿45 (น้ำ) = ฿345
```

### 2.2 Split Bill (แยกจ่าย)

#### วิธีจ่าย
- **Option 1:** แยกจ่ายตามรายการ (แต่ละคนจ่ายตามที่สั่ง)
- **Option 2:** แยกจ่ายตามจำนวนคน (แบ่งเท่าๆ กัน)
- **Option 3:** แยกจ่ายแบบกำหนดเอง (กำหนดยอดที่แต่ละคนจ่าย)

---

### 2.2 Combined Bill (รวมบิล)

#### สถานการณ์
```
โต๊ะ A12: Order #1 (฿500)
โต๊ะ A12: Order #2 (฿300)
โต๊ะ A12: Order #3 (฿200)
รวม: ฿1000
```

#### วิธีจ่าย
- **รวมบิล:** จ่ายครั้งเดียว ฿1000 (รวมทุกออเดอร์)

---

## 3. Database Design

### 3.1 ปรับปรุงตาราง `payments`

#### Option A: หลาย Payment ต่อ 1 Order (Split Bill)
```sql
-- ไม่ต้องเปลี่ยน schema - รองรับอยู่แล้ว!
-- แต่ต้องเปลี่ยน validation:
-- - ไม่บังคับ amount = order.total
-- - ตรวจสอบ sum(payments.amount) <= order.total
```

#### Option B: 1 Payment ต่อหลาย Order (Combined Bill)
```sql
-- ต้องสร้างตารางใหม่: payment_orders (many-to-many)
CREATE TABLE payment_orders (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL, -- ส่วนของ order นี้ใน payment
    UNIQUE(payment_id, order_id)
);

CREATE INDEX idx_payment_orders_payment ON payment_orders(payment_id);
CREATE INDEX idx_payment_orders_order ON payment_orders(order_id);
```

#### Option C: รองรับทั้งสอง (แนะนำ)

**ปรับปรุง `payments`:**
```sql
-- เพิ่ม column
ALTER TABLE payments ADD COLUMN payment_type VARCHAR(20) DEFAULT 'SINGLE' 
    CHECK (payment_type IN ('SINGLE', 'SPLIT', 'COMBINED'));

-- สร้างตาราง payment_orders สำหรับ Combined Bill
CREATE TABLE payment_orders (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    UNIQUE(payment_id, order_id)
);
```

---

## 4. API Design

### 4.1 Split Bill (แยกจ่าย)

#### `POST /orders/:id/payment/split` — แยกจ่าย
```typescript
Request:
{
  payments: [
    { amount: 300, method: 'CASH', payer: 'สมชาย' },
    { amount: 300, method: 'QR', payer: 'สมหญิง' },
    { amount: 220, method: 'CASH', payer: 'สมศักดิ์' },
    { amount: 100, method: 'QR', payer: 'สมศรี' }
  ],
  notes?: string
}

Response:
{
  orderId: string;
  totalAmount: 920;
  paidAmount: 920;
  remainingAmount: 0;
  payments: [
    { id: string, amount: 300, method: 'CASH', payer: 'สมชาย' },
    { id: string, amount: 300, method: 'QR', payer: 'สมหญิง' },
    { id: string, amount: 220, method: 'CASH', payer: 'สมศักดิ์' },
    { id: string, amount: 100, method: 'QR', payer: 'สมศรี' }
  ],
  status: 'FULLY_PAID' | 'PARTIALLY_PAID'
}
```

#### `GET /orders/:id/payments` — ดูรายการ payment (ถ้ามีหลาย payment)
```typescript
Response:
{
  orderId: string;
  orderTotal: 920;
  paidAmount: 620; // sum of all payments
  remainingAmount: 300;
  payments: [
    { id: string, amount: 300, method: 'CASH', payer: 'สมชาย', paidAt: string },
    { id: string, amount: 320, method: 'QR', payer: 'สมหญิง', paidAt: string }
  ],
  status: 'PARTIALLY_PAID'
}
```

---

### 4.2 Combined Bill (รวมบิล)

#### `POST /payments/combined` — รวมบิลหลายออเดอร์
```typescript
Request:
{
  orderIds: [1, 2, 3], // ออเดอร์ที่ต้องการรวม
  amount: 1000, // ยอดรวมที่จ่าย
  method: 'CASH' | 'QR',
  notes?: string
}

Response:
{
  paymentId: string;
  orderIds: [1, 2, 3];
  totalAmount: 1000;
  amount: 1000;
  method: 'CASH';
  status: 'PAID';
  orderBreakdown: [
    { orderId: 1, amount: 500 },
    { orderId: 2, amount: 300 },
    { orderId: 3, amount: 200 }
  ]
}
```

---

## 5. Business Rules

### 5.1 Split Bill Rules

| กฎ | รายละเอียด |
|----|------------|
| **Sum Validation** | sum(payments.amount) <= order.total |
| **Fully Paid** | ถ้า sum = order.total → status = FULLY_PAID |
| **Partially Paid** | ถ้า sum < order.total → status = PARTIALLY_PAID |
| **Over Payment** | ถ้า sum > order.total → Error (ต้อง Refund) |
| **Multiple Payments** | รองรับหลาย payment ต่อ 1 order |

### 5.2 Combined Bill Rules

| กฎ | รายละเอียด |
|----|------------|
| **Same Table** | ออเดอร์ต้องเป็นโต๊ะเดียวกัน (table_code เดียวกัน) |
| **Not Paid** | ออเดอร์ที่รวมต้องยังไม่ชำระ |
| **Amount Match** | amount ต้องเท่ากับ sum(order.total) |
| **Status Update** | อัปเดต payment status ของทุกออเดอร์ |

---

## 6. Frontend Design

### 6.1 Split Bill UI

#### หน้า Orders → กด "แยกจ่าย" ที่ออเดอร์
```
┌─────────────────────────────────────────┐
│  แยกจ่าย - ออเดอร์ #123                 │
│  ยอดรวม: ฿920                          │
├─────────────────────────────────────────┤
│  รายการ:                                │
│  - Pad Thai + น้ำ (฿250)               │
│  - Tom Yum + น้ำ (฿300)                │
│  - Green Curry + น้ำ (฿220)            │
│  - Fried Rice + น้ำ (฿150)             │
├─────────────────────────────────────────┤
│  วิธีแยกจ่าย:                           │
│  ○ แยกตามรายการ                        │
│  ○ แบ่งเท่าๆ กัน (฿230/คน)            │
│  ○ กำหนดเอง                            │
├─────────────────────────────────────────┤
│  รายการจ่าย:                            │
│  ┌──────────────────────────────────┐  │
│  │ สมชาย: ฿[300] [CASH▼] [ลบ]      │  │
│  │ สมหญิง: ฿[300] [QR▼] [ลบ]       │  │
│  │ สมศักดิ์: ฿[220] [CASH▼] [ลบ]   │  │
│  │ สมศรี: ฿[100] [QR▼] [ลบ]         │  │
│  └──────────────────────────────────┘  │
│  รวมจ่าย: ฿920 / ฿920                  │
│  [บันทึกการชำระ]                       │
└─────────────────────────────────────────┘
```

#### Flow
1. เลือกวิธีแยกจ่าย (ตามรายการ/เท่าๆ กัน/กำหนดเอง)
2. กรอกจำนวนเงิน + วิธีจ่าย + ชื่อผู้จ่าย
3. ตรวจสอบ: sum = order.total?
4. บันทึก → สร้างหลาย payment records

---

### 6.2 Combined Bill UI

#### หน้า Orders → เลือกหลายออเดอร์ → "รวมบิล"
```
┌─────────────────────────────────────────┐
│  รวมบิล                                 │
│  โต๊ะ: A12                              │
├─────────────────────────────────────────┤
│  ออเดอร์ที่เลือก:                        │
│  ☑ ออเดอร์ #1 - ฿500                   │
│  ☑ ออเดอร์ #2 - ฿300                   │
│  ☑ ออเดอร์ #3 - ฿200                   │
│                                          │
│  ยอดรวม: ฿1,000                         │
├─────────────────────────────────────────┤
│  วิธีชำระ: [CASH▼]                      │
│  หมายเหตุ: [________________]           │
│                                          │
│  [รวมบิล] [ยกเลิก]                      │
└─────────────────────────────────────────┘
```

#### Flow
1. เลือกหลายออเดอร์ (ต้องเป็นโต๊ะเดียวกัน)
2. ตรวจสอบ: ออเดอร์ยังไม่ชำระ?
3. แสดงยอดรวม
4. บันทึก → สร้าง 1 payment + payment_orders records

---

## 7. UX Considerations

### 7.1 Split Bill

| จุด | UX ที่ดี |
|-----|----------|
| **เลือกวิธีแยก** | แสดง 3 ตัวเลือกชัดเจน |
| **กรอกข้อมูล** | ง่าย รวดเร็ว (อาจมี autofill) |
| **ตรวจสอบยอด** | แสดง "รวมจ่าย: ฿920 / ฿920" แบบ real-time |
| **บันทึก** | แสดงสรุปก่อนบันทึก |

### 7.2 Combined Bill

| จุด | UX ที่ดี |
|-----|----------|
| **เลือกออเดอร์** | Checkbox ง่าย |
| **ตรวจสอบโต๊ะ** | แจ้งเตือนถ้าเลือกออเดอร์คนละโต๊ะ |
| **ยอดรวม** | แสดงชัดเจน |
| **บันทึก** | แสดงสรุปก่อนบันทึก |

---

## 8. Implementation Plan

### Phase 1: Split Bill (2-3 วัน)

#### Database
- [ ] ปรับ validation: รองรับหลาย payment ต่อ 1 order
- [ ] เพิ่ม `payer` ใน payments (optional)

#### Backend
- [ ] `POST /orders/:id/payment/split` — แยกจ่าย
- [ ] `GET /orders/:id/payments` — ดูรายการ payment
- [ ] ปรับ validation: sum <= order.total

#### Frontend
- [ ] Modal แยกจ่าย
- [ ] UI เลือกวิธีแยก (ตามรายการ/เท่าๆ กัน/กำหนดเอง)
- [ ] Form กรอกข้อมูลจ่าย
- [ ] แสดงสรุปก่อนบันทึก

---

### Phase 2: Combined Bill (2-3 วัน)

#### Database
- [ ] สร้างตาราง `payment_orders`
- [ ] เพิ่ม `payment_type` ใน payments

#### Backend
- [ ] `POST /payments/combined` — รวมบิล
- [ ] `GET /payments/:id/orders` — ดูออเดอร์ที่รวม

#### Frontend
- [ ] Checkbox เลือกหลายออเดอร์
- [ ] Modal รวมบิล
- [ ] แสดงสรุปก่อนบันทึก

---

## 9. สรุปการออกแบบ

### Features
- ✅ **Split Bill** — แยกจ่าย 1 order เป็นหลาย payment
  - เหมาะกับ: อาหารจานเดียว (แต่ละคนสั่งของตัวเอง)
  - รองรับ: แยกตามรายการ / แบ่งเท่าๆ กัน / กำหนดเอง
- ✅ **Combined Bill** — รวมบิลหลาย order เป็น 1 payment
  - เหมาะกับ: อาหารชุด (กินร่วมกัน) หรือหลายออเดอร์
- ✅ **Flexible Payment** — รองรับทั้งสองแบบ
  - รองรับ: จานเดียว + ชุดในออเดอร์เดียวกัน

### Benefits
- **ลูกค้าสะดวก** — จ่ายตามต้องการ (แยกหรือรวม)
- **ร้านจัดการง่าย** — รองรับทุกกรณี (จานเดียว, ชุด, ผสม)
- **ยืดหยุ่น** — ไม่ต้องบังคับว่าต้องแยกหรือรวม

### สรุป Use Cases

| สถานการณ์ | วิธีจ่ายที่แนะนำ | ระบบรองรับ |
|-----------|------------------|------------|
| **จานเดียว (แต่ละคนสั่ง)** | แยกจ่าย | ✅ Split Bill |
| **ชุด (กินร่วมกัน)** | จ่ายรวม | ✅ Single Payment หรือ Split แบ่งเท่าๆ กัน |
| **ผสมกัน (จานเดียว + ชุด)** | แยกจ่ายแบบกำหนดเอง | ✅ Split Bill แบบกำหนดเอง |
| **หลายออเดอร์** | รวมบิล | ✅ Combined Bill |

---

*เอกสารนี้ออกแบบสำหรับ RanRHar Restaurant POS System*
