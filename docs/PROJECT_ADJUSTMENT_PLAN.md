# RanRHar — แผนการปรับ Project

**Version:** 1.0  
**วันที่:** 2026-02-08  
**วัตถุประสงค์:** จัดการปรับ Project ให้สอดคล้องกับ Tech Stack Freemium, ความต้องการ stake holders และมาตรฐานระดับโอลิมปิก

---

## 1. สรุปการปรับ

| หมวด | รายการ | สถานะ | ลำดับ |
|------|--------|--------|-------|
| **เอกสาร** | PROJECT_ADJUSTMENT_PLAN, DEVELOPER_SPEC, Tech Stack | ✅ | 1 |
| **Tech Stack** | เพิ่ม Freemium stack เป็นเป้าหมาย | ✅ | 2 |
| **เอกสาร** | อัปเดต ROUTES, ROLE_UI_ACCESS | ✅ | 3 |
| **Feature** | Guest Order flow ให้ครบ | ✅ | 4 |
| **Feature** | Cashier เข้า /orders ได้ | ✅ | 5 |
| **Future** | Migrate ไป Supabase (optional) | - | - |

---

## 2. Phase การปรับ

### Phase 1: เอกสารและ Roadmap (ทำแล้ว)

- [x] สร้าง PROJECT_ADJUSTMENT_PLAN.md
- [x] อัปเดต DEVELOPER_SPEC ด้วย Tech Stack Freemium
- [x] อัปเดต STATUS.md ให้ตรงกับสถานะปัจจุบัน

### Phase 2: ความสอดคล้องของเอกสาร

- [x] ROUTES.md — แก้ / redirect ไป /menu/A12, เพิ่ม /staff
- [x] ROLE_UI_ACCESS_SECURITY.md — ตรวจสอบความถูกต้อง
- [x] สร้าง README ที่ root — Quick start, links ไป docs

### Phase 3: ปรับปรุงเล็กน้อย (Non-breaking)

- [x] Cashier เข้า /orders ได้ — เปลี่ยน allowedRoles เป็น ['owner','staff','cashier']
- [x] Checkout — ไม่ใช้ AuthGuard (ลูกค้าใช้ Guest Order API ได้โดยไม่ต้อง login)
- [x] index-simple.ts — มี CORS whitelist อยู่แล้ว (ไม่ต้องแก้)

### Phase 4: Freemium Stack (อนาคต)

- [ ] ประเมิน Supabase migration
- [ ] ตั้งค่า Vercel deploy
- [ ] Supabase Auth (optional) — หรือคง JWT

---

## 3. Tech Stack เป้าหมาย (Freemium ≤50 ร้าน)

| ชั้น | ปัจจุบัน | เป้าหมาย | หมายเหตุ |
|------|----------|----------|----------|
| Frontend | Next.js + Vercel | รวม | ไม่ต้องเปลี่ยน |
| API | Fastify | Fastify หรือ Vercel Serverless | ใช้ได้ทั้งสอง |
| Database | PostgreSQL (self) | Supabase / Neon | ขยับเมื่อต้องการ scale |
| Auth | JWT + Cookie | Supabase Auth หรือคงเดิม | ขึ้นกับ migration |
| Storage | - | Supabase Storage | รูปเมนู |
| Realtime | - | Supabase Realtime | KDS |
| Deploy | - | Vercel + Railway | ฟรี tier |

---

## 4. สิ่งที่ต้องตรวจสอบ

| รายการ | ไฟล์ | การดำเนินการ |
|--------|------|--------------|
| index-simple.ts | apps/api/src/index-simple.ts | ลบหรือจำกัด CORS |
| Checkout AuthGuard | apps/web/src/app/checkout/page.tsx | ✅ ไม่ใช้ — guest flow ทำงานได้ |
| Cashier /orders | apps/web/src/app/orders/page.tsx | ✅ เพิ่ม cashier แล้ว |
| ROUTES.md | docs/ROUTES.md | ✅ อัปเดตแล้ว |

---

## 5. การดำเนินการหลังแผน

1. **ทันที:** อัปเดตเอกสารให้ครบ
2. **สัปดาห์นี้:** Cashier เข้า orders, ตรวจสอบ CORS
3. **เดือนนี้:** วางแผน Supabase (ถ้าต้องการ)
4. **ต่อเนื่อง:** ทำตาม STAKEHOLDER_REQUIREMENTS, Phase A–E

---

*แผนนี้ใช้เป็นเอกสาร living — อัปเดตเมื่อมีการปรับ project*
