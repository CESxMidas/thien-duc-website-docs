# Xác thực và phân quyền

> **Trạng thái:** Khung — chưa có nội dung riêng (sẽ bổ sung)
> **Nhóm:** 02 — Architecture
> **Cập nhật:** 2026-07-16

JWT access 15 phút + refresh 30 ngày (hash SHA-256, xoay vòng, thu hồi), khóa tài khoản sau 5 lần sai (423), 3 vai trò SUPER_ADMIN/ADMIN/EDITOR.

**Nguồn tham khảo hiện tại:** [ADR-0002 RBAC 3 vai trò](../10-decisions/ADR-0002-rbac-three-roles.md); [security-audit-phase-1](../05-security/security-audit-phase-1.md); [sơ đồ đăng nhập](diagrams/01-dang-nhap.png).
