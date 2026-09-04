# ADR-0002 — Phân quyền 3 vai trò: SUPER_ADMIN / ADMIN / EDITOR

- **Trạng thái:** Accepted
- **Ngày:** 2026-07-16 (ghi nhận; xác nhận ở câu 18)
- **Nguồn:** [open-questions](../01-requirements/open-questions.md) câu 18; enum `Role` trong `prisma/schema.prisma`

## Bối cảnh

CMS cần phân quyền biên tập/duyệt/quản trị. Báo cáo PA2 (mục 1.2.2–1.2.3) đề xuất 3 cấp; cần công ty xác nhận có đủ không hay cần vai trò khác.

## Quyết định

Dùng đúng **3 vai trò**: `SUPER_ADMIN`, `ADMIN`, `EDITOR` — công ty xác nhận đủ, không thêm vai trò khác. Enum `Role` trong Prisma đã khớp, không phải sửa code.

- Duyệt nội dung (`PATCH .../status`) giới hạn **ADMIN trở lên**.
- Bảo vệ bằng `JwtAuthGuard` + `RolesGuard` + `@Roles(...)`.

## Hệ quả

- ✅ Đơn giản, khớp quy trình thực tế của công ty.
- ✅ Không cần migration/đổi enum.
- Nếu sau này cần vai trò chuyên biệt (VD Marketing chỉ xem lead), phải tạo ADR mới thay thế ADR này.
