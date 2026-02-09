# Changelog

All notable changes to RanRHar will be documented in this file.

## [Unreleased] — 2026-02-08 (Olympic Refactor)

### Added
- **Error Boundary:** Root error.tsx, global-error.tsx — แสดง fallback แทน crash
- **404 Page:** not-found.tsx — หน้าเป็นมิตร พร้อมลิงก์กลับเมนู
- **Loading States:** LoadingFallback, MenuSkeleton, TableSkeleton
- **Route Loading:** loading.tsx สำหรับ /menu, /orders
- **Empty States:** หน้า Orders, KDS แสดงข้อความเมื่อยังไม่มีข้อมูล
- **Accessibility:** aria-label ปุ่มเพิ่มตระกร้า, aria-busy ปุ่มสั่งอาหาร
- **Checkout Error:** แสดงข้อความ error inline แทน alert
- **TRIAL_GUIDE.md:** คู่มือทดลองใช้งานสำหรับร้านอาหาร

### Changed
- **menu.service:** ใช้ apiClient แทน fetch โดยตรง
- **AuthGuard:** แสดง LoadingFallback แทน blank ขณะ validate
- **Unauthorized:** ลิงก์กลับเมนูใช้ /menu/A12 แทน demo-table

### Fixed
- Unauthorized page redirect to correct menu URL

---

## [0.10.0] — 2026-02-08

### Added
- Role manager, chef, host, delivery
- Menu Admin (จัดการหมวดหมู่และรายการเมนู)
- StaffNav แสดงลิงก์ตาม role
- เอกสาร JOB_DESCRIPTIONS, ROLES_ALL, CUSTOMER_FLOW

### Changed
- Owner: ดูอย่างเดียว
- Manager: สิทธิ์เต็ม (เมนู สต็อก ออเดอร์)

---

## [0.9.0] — 2026-02-07

- Inventory Management
- Payment Integration
- Security Hardening (Cookie auth, Helmet, Rate Limit)

---

*For full history see git log*
