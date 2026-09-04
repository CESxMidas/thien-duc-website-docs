# Checklist bàn giao — Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Nhóm:** 09 — Handover
> **Cập nhật:** 2026-07-16

Tài liệu điểm khởi đầu cho người/đội mới tiếp nhận. Đọc theo thứ tự dưới, tick khi đã nắm.

## 1. Hiểu bối cảnh

- [ ] [Tổng quan dự án](../00-overview/project-overview.md) — dự án là gì, công ty, danh mục dự án.
- [ ] [Kiến trúc hệ thống](../02-architecture/system-architecture.md) — 3 tầng, hợp đồng chung.
- [ ] `AGENTS.md` (workspace root) — quy ước code + hợp đồng chung 3 project (nguồn sự thật).
- [ ] [Câu hỏi còn mở](../01-requirements/open-questions.md) — việc đang chờ công ty trả lời (đừng tự chế dữ liệu).

## 2. Trạng thái & kế hoạch

- [ ] [Kế hoạch triển khai](../04-implementation/implementation-plan.md) — trạng thái từng sprint/module.
- [ ] [Audit baseline 2026-07-16](../08-audits-and-reports/current/2026-07-16-audit-baseline.md) — điểm 60/100, khoảng trống, kế hoạch nâng cấp.

## 3. Vận hành & triển khai

- [ ] [Hướng dẫn deploy](../07-deployment/deployment-guide.md) — Vercel (FE) + Render (BE + Postgres).
- [ ] [Cấu hình biến môi trường](../07-deployment/environment-configuration.md) — biến nào ở đâu, secret không vào Git.
- [ ] [Migration DB](../07-deployment/database-migrations.md) + [Sao lưu/khôi phục](../07-deployment/backup-and-restore.md) + [Rollback](../07-deployment/rollback-plan.md).
- [ ] [Hướng dẫn vận hành](operations-guide.md) + [Hướng dẫn bảo trì](maintenance-guide.md).

## 4. Bảo mật

- [ ] [Thư mục bảo mật](../05-security/README.md) — audit + findings + trạng thái khắc phục.

## 5. Việc quan trọng còn treo (mốc 2026-07-16)

Trích từ audit baseline + kế hoạch — các mục **chặn/critical** trước production:

- [ ] Cài email thông báo form liên hệ (hiện là TODO ở backend).
- [ ] Nhập bản dịch tiếng Anh (mọi field `.en` còn trống — **chặn go-live song ngữ**).
- [ ] Rời hạ tầng free-tier + backup DB tự động + monitoring.
- [ ] Thêm `@MaxLength` cho DTO chữ tự do (contact).
- [ ] Cron ngoài (UptimeRobot/cron-job.org) gọi `POST /api/news/publish-scheduled` vì Render free ngủ sau 15'.

## 6. Quyết định đã chốt

- [ ] [Nhật ký quyết định (ADR)](../10-decisions/README.md) — hosting, RBAC 3 vai trò, một môi trường production, song ngữ + locale routing.

## 7. Bàn giao tài khoản & bí mật (NGOÀI tài liệu)

> ⚠️ Secret/tài khoản (Render, Vercel, Cloudinary, DB, SMTP, GitHub) **không** nằm trong Git. Bàn giao qua kênh an toàn riêng — chỉ đối chiếu *danh sách biến* ở [environment-configuration](../07-deployment/environment-configuration.md).
