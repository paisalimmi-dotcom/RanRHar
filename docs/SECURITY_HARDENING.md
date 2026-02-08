# RanRHar — ลำดับการเสริมความปลอดภัย (Security Hardening)

**Version:** 1.0  
**วันที่:** 2026-02-08  
**วัตถุประสงค์:** ดำเนินการปรับปรุงความปลอดภัยตามลำดับความสำคัญ

---

## ลำดับการดำเนินการ (ตามลำดับ)

### ระดับ 1: Critical (ทำแล้ว)

| ลำดับ | รายการ | สถานะ | หมายเหตุ |
|-------|--------|--------|----------|
| 1.1 | Order ตรวจราคาจาก menu DB | ✅ | validateItemsAgainstMenu() |
| 1.2 | Idempotency-Key สำหรับ guest order | ✅ | ป้องกัน duplicate |
| 1.3 | httpOnly cookie (ไม่ใช้ localStorage) | ✅ | ป้องกัน XSS |
| 1.4 | CORS whitelist | ✅ | reject unknown origin |
| 1.5 | Rate limit auth/login (5/15min) | ✅ | ป้องกัน brute force |
| 1.6 | JWT 1h expiry | ✅ | จำกัดผลกระทบหาก token ถูกขโมย |
| 1.7 | Audit log (order, payment, auth) | ✅ | audit_logs table |

### ระดับ 2: High (ทำแล้ว)

| ลำดับ | รายการ | สถานะ | หมายเหตุ |
|-------|--------|--------|----------|
| 2.1 | Helmet security headers | ✅ | CSP, HSTS |
| 2.2 | Body limit 1MB | ✅ | ป้องกัน DoS |
| 2.3 | Stack trace ซ่อนใน production | ✅ | ไม่ leak ข้อมูล |
| 2.4 | CORS จาก env (CORS_ORIGIN) | ✅ | Production ตั้งค่าได้ |
| 2.5 | Guest order rate limit 10/min | ✅ | ลดจาก 20 → 10 |
| 2.6 | Logout rate limit 30/min | ✅ | ป้องกัน abuse |
| 2.7 | Failed login audit | ✅ | audit_logs + metric |

### ระดับ 3: Medium (ทำแล้ว)

| ลำดับ | รายการ | สถานะ | หมายเหตุ |
|-------|--------|--------|----------|
| 3.1 | TypeBox schema validation | ✅ | ทุก route body |
| 3.2 | Parameterized queries | ✅ | ป้องกัน SQL injection |
| 3.3 | Global rate limit 100/min | ✅ | |
| 3.4 | /health/ready เช็ค DB | ✅ | |
| 3.5 | index-simple.ts CORS | ✅ | ใช้ whitelist เหมือน main |

### ระดับ 4: Nice to Have (อนาคต)

| ลำดับ | รายการ | สถานะ | หมายเหตุ |
|-------|--------|--------|----------|
| 4.1 | MFA | ❌ | ตาม scope |
| 4.2 | IP blocking หลัง failed login | ❌ | Optional |
| 4.3 | Session invalidation | ❌ | ปัจจุบันใช้ token expiry |

---

## Checklist ก่อน Production

```
[ ] JWT_SECRET เปลี่ยนจาก default (openssl rand -base64 32)
[ ] CORS_ORIGIN ตั้งค่า domain จริง (comma-separated ถ้ามีหลาย domain)
[ ] NODE_ENV=production
[ ] DATABASE_URL production
[ ] SSL/TLS ใช้กับ production
[ ] รัน migration ครบ
[ ] Audit log ตรวจสอบได้
```

---

## สรุป Rate Limits

| Endpoint | Limit | วัตถุประสงค์ |
|----------|-------|---------------|
| Global | 100/min | ป้องกัน DoS |
| POST /auth/login | 5/15min | ป้องกัน brute force |
| POST /auth/logout | 30/min | ป้องกัน abuse |
| POST /orders/guest | 10/min | ป้องกัน spam order |

---

*เอกสารนี้อัปเดตตามลำดับการดำเนินการจริง*
