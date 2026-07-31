# Xác thực và phân quyền

> **Trạng thái:** Khung — chưa có nội dung riêng (sẽ bổ sung)
> **Nhóm:** 02 — Architecture
> **Cập nhật:** 2026-07-16

JWT access 15 phút + refresh 30 ngày (hash SHA-256, xoay vòng, thu hồi), khóa tài khoản sau 5 lần sai (423), 3 vai trò SUPER_ADMIN/ADMIN/EDITOR.

**Cấp tài khoản: CHỈ qua lời mời** (CMS-RETIRE-DIRECT-USER-CREATE-M1, 2026-07-31).
SUPER_ADMIN gọi `POST /api/users/invitations` (không có field mật khẩu) → hệ thống
gửi email link dùng một lần → **người được mời tự đặt mật khẩu**. Không quản trị
viên nào đặt, thấy hay gửi được mật khẩu của tài khoản khác: `PATCH /users/:id`
không nhận `password`, và route tạo trực tiếp `POST /api/users` **đã bị gỡ hẳn**
(trả 404 — không stub, không 410). Người quên mật khẩu tự phục hồi qua luồng
forgot/reset. Endpoint fixture `/api/test/*` **không phải API production** — chỉ
nạp khi `NODE_ENV=test` + `MAIL_FAKE_TRANSPORT=1`, còn qua `TestOnlyGuard`
(localhost) và ẩn khỏi Swagger.

**Nguồn tham khảo hiện tại:** [ADR-0002 RBAC 3 vai trò](../10-decisions/ADR-0002-rbac-three-roles.md); [security-audit-phase-1](../05-security/security-audit-phase-1.md); [sơ đồ đăng nhập](diagrams/01-dang-nhap.png).
