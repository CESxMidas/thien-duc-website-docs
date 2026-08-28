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

**Tự đổi mật khẩu khi đang đăng nhập** (CMS-AUTH-CHANGE-PASSWORD).
`POST /api/auth/change-password` — `JwtAuthGuard`, throttle 5 lần/15 phút, mọi vai
trò đều đổi được mật khẩu **của chính mình**. Giao diện ở `/admin/ho-so` → thẻ
**Bảo mật** → **Đổi mật khẩu** (ba ô: mật khẩu hiện tại / mới / xác nhận).

- Danh tính lấy từ JWT (`@CurrentUser()`); DTO **không có `userId`** và
  `forbidNonWhitelisted` reject 400 nếu client gửi kèm — không ai đổi được mật
  khẩu người khác qua route này, **kể cả SUPER_ADMIN** (nguyên tắc cũ giữ nguyên).
- Bắt buộc nhập đúng `currentPassword` (đối chiếu bcrypt với hash đang lưu). Sai
  → **400**, cố ý KHÔNG dùng 401/403 vì Admin CMS đã gán sẵn ngữ nghĩa cho hai mã
  đó (401 = phiên hết hạn → đăng xuất; 403 = thiếu quyền → `/403`); trả nhầm sẽ
  đăng xuất người chỉ gõ sai mật khẩu.
- Mật khẩu mới phải **khác** mật khẩu hiện tại (so bằng bcrypt), dài 8–128 ký tự
  — cùng chính sách với luồng lời mời và quên mật khẩu.
- **Đi thẳng, KHÔNG qua luồng duyệt hồ sơ.** `PATCH /users/me` đưa EDITOR vào
  `ProfileChangeRequest` chờ duyệt; mật khẩu thì có hiệu lực ngay và không ai
  duyệt. Hai luồng cố ý tách riêng.
- Đổi xong: cập nhật `passwordHash` và **thu hồi toàn bộ refresh token** trong
  **cùng một transaction**; backend **không** cấp token thay thế. Admin dọn token
  ở cả `localStorage` lẫn `sessionStorage` rồi điều hướng về `/admin/dang-nhap`.
- ⚠️ **Giới hạn đã biết:** access token là JWT thuần trạng thái và schema **không
  có `tokenVersion`**, nên access token đã phát trên thiết bị khác **vẫn dùng được
  tới khi hết hạn tự nhiên** (`JWT_ACCESS_EXPIRES_IN`, mặc định 15 phút). Thu hồi
  refresh token chặn việc gia hạn nên cửa sổ tối đa đúng bằng 15 phút. Muốn cắt
  tức thì phải thêm `tokenVersion` — đổi schema, chưa làm.

**Nguồn tham khảo hiện tại:** [ADR-0002 RBAC 3 vai trò](../10-decisions/ADR-0002-rbac-three-roles.md); [security-audit-phase-1](../05-security/security-audit-phase-1.md); [sơ đồ đăng nhập](diagrams/01-dang-nhap.png).
