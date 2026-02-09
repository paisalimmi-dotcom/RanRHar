# RanRHar — แผน Refactor ระดับโอลิมปิก (Olympic Standard)

**Version:** 1.0  
**วันที่:** 2026-02-08  
**มุมมอง:** CTO/PM ระดับโลก  
**เป้าหมาย:** WebApp พร้อมให้ขายอาหารทดลองใช้งาน — Perfect ในทุกมิติ

---

## หลักการ

1. **Git Commit ทุก Phase** — ทุกขั้นตอนมี commit แยกชัดเจน
2. **ไม่พังของเดิม** — Build และ Test ผ่านทุก phase
3. **Trial-Ready** — เน้นสิ่งที่ลูกค้าทดลองเห็นและสัมผัสได้
4. **Olympic Standard** — ตาม OLYMPIC_STANDARD.md

---

## Phase 0: Baseline (ก่อน Refactor)

- Build ✅ | Tests 56 ✅
- Commit สถานะปัจจุบันก่อนเริ่ม refactor

---

## Phase 1: Foundation — Error Boundary & Core Robustness

| รายการ | คำอธิบาย |
|--------|----------|
| Root Error Boundary | จับ error ทั้งแอป แสดง fallback UI แทน crash |
| Not Found Page | 404 หน้าเป็นมิตร พร้อมลิงก์กลับ |
| Global Loading | Skeleton หรือ loading indicator สำหรับการนำทาง |
| API Error Display | แสดงข้อความ error ที่ user-friendly |

**เกณฑ์ผ่าน:** Error ที่เกิดไม่ทำให้แอป crash, user เห็นข้อความที่เข้าใจได้

---

## Phase 2: Code Quality — Structure & Consistency

| รายการ | คำอธิบาย |
|--------|----------|
| API Layer Consistency | ใช้ apiClient ทุกที่, ไม่มี fetch ตรง |
| Error Handling | Typed APIError, consistent error handling ใน features |
| Loading States | ทุกหน้า/component ที่ fetch มี loading state |
| Type Safety | ตรวจสอบ shared types ครบ |

**เกณฑ์ผ่าน:** Lint ผ่าน, โครงสร้าง feature สม่ำเสมอ

---

## Phase 3: UX/UI Polish — Trial-Ready

| รายการ | คำอธิบาย |
|--------|----------|
| Loading Skeletons | เมนู, ออเดอร์, KDS มี skeleton ขณะโหลด |
| Empty States | หน้าไม่มีข้อมูล แสดงข้อความชัดเจน + CTA |
| Mobile Responsive | ตรวจสอบและปรับ breakpoints |
| Accessibility | aria-labels, focus states, contrast |
| Toast/Feedback | แจ้งผลสำเร็จ/ล้มเหลวให้ user เห็น |

**เกณฑ์ผ่าน:** ลูกค้าทดลองใช้งานได้ลื่นไหล ไม่สับสน

---

## Phase 4: Performance & Reliability

| รายการ | คำอธิบาย |
|--------|----------|
| Bundle Analysis | ตรวจสอบ bundle size |
| Image Optimization | next/image สำหรับรูปเมนู |
| Lazy Load | dynamic import สำหรับหน้ามือถือ |
| Error Boundary per Route | จำกัด scope error |

**เกณฑ์ผ่าน:** Lighthouse score ดี, โหลดเร็ว

---

## Phase 5: Documentation & Launch Prep

| รายการ | คำอธิบาย |
|--------|----------|
| TRIAL_GUIDE.md | คู่มือสำหรับร้านทดลองใช้งาน |
| README อัปเดต | วิธีรัน, บัญชีทดสอบ, ลิงก์ docs |
| CHANGELOG | สรุปการเปลี่ยนแปลง |
| Final Checklist | ตรวจสอบก่อน trial launch |

**เกณฑ์ผ่าน:** ทีมหรือลูกค้าสามารถเริ่มใช้ได้จาก docs

---

## สรุป Deliverables

| Phase | Commit Message | เป้าหมาย |
|-------|----------------|----------|
| 0 | chore: baseline before Olympic refactor | สถานะปัจจุบัน |
| 1 | refactor(phase1): error boundary, 404, global robustness | ไม่ crash |
| 2 | refactor(phase2): API consistency, loading states, types | โครงสร้างดี |
| 3 | refactor(phase3): UX polish, skeleton, empty states, a11y | Trial-ready |
| 4 | refactor(phase4): performance, image opt, lazy load | เร็วและเสถียร |
| 5 | docs(phase5): trial guide, README, changelog | พร้อม launch |

---

*เอกสารนี้อ้างอิงจาก OLYMPIC_STANDARD.md และ IMPROVEMENT_PLAN.md*
