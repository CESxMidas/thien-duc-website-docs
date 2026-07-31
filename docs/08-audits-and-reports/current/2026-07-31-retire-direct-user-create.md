# Gỡ hẳn đường tạo tài khoản trực tiếp — `POST /api/users`

> **Trạng thái:** Đang dùng · **Ngày:** 2026-07-31 · **Phiên:** `CMS-RETIRE-DIRECT-USER-CREATE-M1`
> **Liên quan:** [ma trận test-case cuối](2026-07-30-final-test-case-matrix.md) ·
> [implementation-plan §7](../../04-implementation/implementation-plan.md#section-7--changelog--audit-trail) ·
> [xác thực & phân quyền](../../02-architecture/authentication-and-authorization.md)

## 1. Tóm tắt

Cấp tài khoản CMS nay **chỉ còn một đường: lời mời**. Route tạo tài khoản trực
tiếp kèm mật khẩu do quản trị viên chọn đã bị **gỡ hẳn** khỏi backend, và các
hàm client chết tương ứng đã bị gỡ khỏi Admin.

## 2. Hành vi cũ → hành vi mới

| | Trước | Sau |
|---|---|---|
| Tạo tài khoản | `POST /api/users` (SUPER_ADMIN) với `CreateUserDto` **có `password`** | Route **không tồn tại** → **404** |
| Ai đặt mật khẩu | Quản trị viên đặt hộ | **Người được mời tự đặt** ở `/thiet-lap-tai-khoan` |
| Đường cấp tài khoản | 2 (trực tiếp + lời mời) | **1** (`POST /api/users/invitations`) |
| Client Admin | còn `createUser()` + `useCreateUser()` (code chết) | đã gỡ |

Route trả **404 chuẩn của framework**, **không** stub 410 — hiện chưa có chính
sách versioning/deprecation API nào yêu cầu giữ stub, và giữ stub sẽ để lại một
bề mặt vô ích.

## 3. Lý do bảo mật

Sau `CMS-ACCOUNT-INVITATION-PHASE3C` (bỏ `password` khỏi `PATCH /users/:id`),
`POST /users` là **lối cuối cùng** còn cho phép một tài khoản biết mật khẩu của
tài khoản khác. Giữ nó vừa là bề mặt tấn công (route SUPER_ADMIN nhận mật khẩu
thô), vừa phá bất biến muốn có: *không ai đặt mật khẩu hộ người khác*. Người
dùng quên mật khẩu đã có lối tự phục hồi riêng (forgot/reset password), nên gỡ
route không để lại khoảng trống nghiệp vụ.

## 4. File đã đổi

### Backend — `thien-duc-website-backend/`

| File | Thay đổi |
|---|---|
| `src/users/users.controller.ts` | **gỡ** handler `create()` + import `CreateUserDto` + comment TODO cũ; thay bằng ghi chú "đừng thêm lại" |
| `src/users/users.service.ts` | **gỡ** `create()` (kèm nhánh bcrypt tạo trực tiếp) + import `CreateUserDto` |
| `src/users/dto/create-user.dto.ts` | **XOÁ FILE** |
| `src/users/dto/update-user.dto.ts` | không còn kế thừa `PartialType(OmitType(CreateUserDto, …))`; khai báo tường minh `email?/name?/role?/isActive?` — **hợp đồng HTTP không đổi** |
| `src/users/users.controller.spec.ts` | bỏ `create` khỏi bảng `@Roles`; **thêm** 2 test: không còn handler `create`, không còn route `POST ""` |
| `src/users/users.service.spec.ts` | bỏ 2 test của `create()`; **thêm** 2 test: service không còn method `create`, `createInvitation` là method `create*` duy nhất |
| `test/retired-user-create.e2e-spec.ts` | **FILE MỚI** — 12 test integration trên PostgreSQL thật |

**Không đụng:** lời mời, accept-invitation, forgot/reset password, login,
refresh token, seed/bootstrap, `src/test-support/*`.

### Admin — `thien-duc-website-admin/`

| File | Thay đổi |
|---|---|
| `src/lib/api/users.ts` | **gỡ** `createUser()` + `interface CreateUserInput` + dòng `POST /users` ở header |
| `src/lib/api/queries.ts` | **gỡ** hook `useCreateUser()` |
| `src/pages/UsersPage.test.tsx`, `src/pages/pages.smoke.test.tsx` | bỏ `useCreateUser` khỏi mock |
| `src/lib/api/users.retired-create.test.ts` | **FILE MỚI** — 5 test vitest |
| `e2e/admin/retired-user-create.e2e.ts` | **FILE MỚI** — 6 test Playwright |

### Docs — `thien-duc-website-docs/`

`implementation-plan.md` (§0, §2, ledger §7), `2026-07-30-final-test-case-matrix.md`
(UM-17…UM-20 + khối cập nhật), `02-architecture/authentication-and-authorization.md`,
và báo cáo này.

**Không đổi schema, không migration.** `User.passwordHash` giữ nguyên — đăng nhập
vẫn cần hash mật khẩu.

## 5. Test đã thêm

| # | Khẳng định | Nơi |
|---|---|---|
| 1 | `POST /api/users` không còn tồn tại (không handler, không route `POST ""`) | `users.controller.spec.ts` |
| 2 | Payload tạo-trực-tiếp hợp lệ về hình thức → **404** | integration + Playwright |
| 3 | Payload kèm `password` → **0 hàng DB** | integration + Playwright |
| 4 | Payload kèm `passwordHash` → **0 hàng DB** | integration + Playwright |
| 5 | Admin không còn hàm/hook gọi trực tiếp | vitest |
| 6 | Form lời mời không có ô mật khẩu | vitest + Playwright + `user-management-security.e2e.ts` |
| 7 | SUPER_ADMIN vẫn mời được | integration + Playwright |
| 8 | ADMIN không mời được (403) | integration + Playwright |
| 9 | EDITOR không mời được (403) | integration + Playwright |
| 10 | Nhận lời mời tạo tài khoản active/setup-complete | `invitation.e2e.ts` (có sẵn) |
| 11 | Người được mời tự đặt mật khẩu | `invitation.e2e.ts` (có sẵn) |
| 12 | Đăng nhập được sau khi thiết lập | `invitation.e2e.ts` (có sẵn) |
| 13 | Gửi lại lời mời vẫn chạy | `invitation.e2e.ts` (có sẵn) |
| 14 | Thu hồi lời mời vẫn chạy | `invitation.e2e.ts` (có sẵn) |
| 15 | Token hết hạn / bị thu hồi / đã dùng đều fail an toàn | `invitation.e2e.ts` + `auth.service.spec.ts` (có sẵn) |
| 16 | Nhận lời mời tương tranh: đúng **một** request thành công | `auth-integration.e2e-spec.ts` (có sẵn) |
| 17 | Token/mật khẩu không lọt response / DOM / storage / cookie / console | `token-privacy.e2e.ts` (có sẵn) + assert mới trong integration |
| + | Không tổng số tài khoản nào tăng sau 5 lần thử liên tiếp | integration |
| + | Lời mời từ chối field `password` → 400, 0 hàng DB | integration + Playwright |
| + | Khách chưa đăng nhập gọi lời mời → 401 | integration |
| + | UI tạo tài khoản không phát sinh request `POST /users` nào (bắt request) | Playwright |

Toàn bộ dùng **transport email GIẢ** (`MAIL_FAKE_TRANSPORT=1`) — không gửi mail thật.

## 6. Kết quả chạy

| Bộ | Kết quả |
|---|---|
| Backend unit (`npm test`) | **491 pass** / 37 suite |
| Backend integration+e2e (`npm run test:e2e`) | **73 pass** / 4 suite |
| Admin vitest (`npm test`) | **156 pass** / 27 file |
| Admin coverage | đạt ngưỡng (functions **45,76%** ≥ 38) |
| Frontend jest | **131 pass** / 13 suite |
| Playwright full-stack (`--retries=0`) | **181 pass · 0 fail · 0 flaky · 0 skip** |
| `tsc --noEmit` / `lint` / `build` | sạch ở cả 3 repo (chỉ còn warning **có sẵn từ trước**) |

## 7. Toàn vẹn CSDL

Chỉ chạm `thien_duc_test` ở `localhost:5432` (cầu chì `assertSafeDatabase` +
`preflight-e2e`). Sau toàn bộ các đợt chạy: **0 fixture `@e2e.test` sót lại**,
còn đúng **2 tài khoản seed** (`superadmin@test.local` SUPER_ADMIN,
`admin-e2e@test.local` ADMIN), `passwordHash` / `setupCompletedAt` không đổi.
Không chạy `prisma migrate reset`. Không chạm dữ liệu production.

**Lỗi dọn dẹp đã sửa trong phiên này:** `AccountInvitation.invitedBy` là FK
`onDelete: Restrict`, nên xoá thẳng user fixture đã gửi lời mời sẽ vi phạm ràng
buộc và bỏ rác lại cho suite sau. `test/retired-user-create.e2e-spec.ts` vì vậy
xoá lời mời **trước**, rồi mới xoá user, và tự dọn cả ở `beforeAll`.

## 8. Tương thích ngược

Quét toàn workspace (Admin, Frontend, script, CI workflow, tài liệu, seed,
Playwright helper, fixture): **không consumer thật nào** còn gọi `POST /users`.
Hai tham chiếu duy nhất còn sống trước phiên này là `usersApi.createUser()` và
`useCreateUser()` trong Admin — **code chết**, không màn hình nào gọi. Không cần
migration dữ liệu, không cần thông báo người dùng cuối, không ảnh hưởng
production đang chạy.

## 9. Rủi ro còn lại

- **Thấp — vận hành:** nếu về sau cần tạo tài khoản khi email hỏng, không còn
  lối "đặt mật khẩu hộ". Lối thay thế: seed/bootstrap (`prisma/seed.js`, đọc
  `ADMIN_EMAIL`/`ADMIN_PASSWORD`) — vẫn giữ nguyên, chỉ chạy được từ máy có
  quyền trên DB.
- **Đã xử lý trong phiên này (không liên quan phạm vi gốc):**
  `docs/04-implementation/implementation-plan.md` mang **3 dấu xung đột merge đã
  bị commit từ trước** (`<<<<<<< HEAD`, `=======`, `>>>>>>> e3cb42b5`). Đã giải
  quyết bằng cách **giữ trọn vẹn cả hai nhánh** — không nhánh nào bị bỏ:
  - nhánh HEAD: 3 mục ledger 2026-07-30 (`FINAL-RELEASE-HARDENING-M2`,
    `BE-E2E-CI-ENV-FIX-M1`, `THIEN-DUC-FINAL-WEBSITE-QUALITY-AUDIT-M1`);
  - nhánh `e3cb42b5`: 1 mục ledger 2026-07-29
    (`NEWS-SLIDER-AND-PAGINATION-M1`).

  Đã đối chiếu: **không mục nào trùng lặp**, thứ tự đảo-thời-gian vẫn đúng
  (07-31 → 07-30 ×3 → 07-29 ×3 → 07-28 → …), và trạng thái `[~]` (làm dở — 22
  spec Playwright đã viết nhưng **chưa chạy**) của `NEWS-SLIDER-AND-PAGINATION-M1`
  **giữ nguyên**, không nâng thành `[x]`. Chỉ 3 dòng dấu xung đột bị xoá; không
  sửa nội dung mục nào. Quét lại toàn bộ 4 repo: **0 dấu xung đột thật còn lại**.
