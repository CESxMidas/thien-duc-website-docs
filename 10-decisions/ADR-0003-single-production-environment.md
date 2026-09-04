# ADR-0003 — Một môi trường production duy nhất (chưa tách dev/preview/staging)

- **Trạng thái:** Accepted (có lưu ý rủi ro)
- **Ngày:** 2026-07-16 (ghi nhận)
- **Nguồn:** [implementation-plan](../04-implementation/implementation-plan.md) Sprint 2 (quyết định chủ dự án); [audit-baseline](../08-audits-and-reports/current/2026-07-16-audit-baseline.md) mục 7

## Bối cảnh

Chi phí và độ phức tạp vận hành giai đoạn đầu. Cloudinary và hạ tầng dùng chung.

## Quyết định

Theo quyết định của chủ dự án: chỉ dùng **một môi trường production**, không tách dev/preview/staging riêng. Ảnh Cloudinary xếp theo thư mục (`projects/<slug>/`, `news/<year>/`, `banners/`, `pages/`), không tạo tài khoản riêng từng dự án.

## Hệ quả

- ✅ Đơn giản, chi phí thấp.
- ⚠️ **Rủi ro:** không có staging để thử migration trước khi lên production; `.env` máy dev có thể trỏ thẳng vào DB production → mọi lệnh `prisma migrate deploy` phải là hành động **có chủ ý** (xem [database-migrations](../07-deployment/database-migrations.md)).
- ⚠️ Audit khuyến nghị thêm staging trước khi go-live doanh nghiệp phụ thuộc uptime — cân nhắc tạo ADR mới khi ngân sách cho phép.
