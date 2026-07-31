# Ma trận test-case cuối — Website Thiên Đức

> **Trạng thái:** Đang dùng · **Ngày:** 2026-07-30 · **Phiên:** `THIEN-DUC-FINAL-WEBSITE-QUALITY-AUDIT-M1`
> **Báo cáo kèm theo:** [audit M1](2026-07-30-final-website-quality-audit.md) · [siết chặt M2](2026-07-30-m2-release-hardening.md)
>
> **CẬP NHẬT M2 (2026-07-30):** các case dưới đây đã đổi trạng thái — xem §Cập nhật M2 ở cuối.
>
> Ma trận này được dựng **từ mã nguồn thật** (controller, route, page, schema) và
> **từ file test thật**, không kế thừa kết luận của báo cáo trước.

## Quy ước

**Mức tự động hóa**: `unit` · `component` · `integration` (Jest + PostgreSQL thật)
· `api-e2e` (Playwright gọi API) · `browser-e2e` (Playwright điều khiển trình duyệt).

**Trạng thái** — một case CHỈ được ghi `covered` khi có test tự động thật khẳng
định nó:

| Trạng thái | Nghĩa |
|---|---|
| `covered` | Có test tự động chạy xanh khẳng định case này |
| `partial` | Có test nhưng chưa phủ hết biến thể (âm/biên/bảo mật) |
| `missing` | Không có test tự động nào |
| `blocked` | Không tự động hóa được trong môi trường cục bộ (ghi rõ lý do) |

**Vai trò**: `PUB` (khách) · `EDITOR` · `ADMIN` · `SUPER_ADMIN`.

---

## A. Nền tảng backend (HTTP / validation / envelope)

Nguồn: `main.ts`, `common/filters/http-exception.filter.ts`,
`common/interceptors/response.interceptor.ts`, `common/body-limit.ts`.

| ID | Case | Vai trò | Mức | File test | Trạng thái |
|---|---|---|---|---|---|
| BE-F01 | Request hợp lệ được nhận | PUB | integration | `test/http-foundation.e2e-spec.ts` | covered |
| BE-F02 | Field lạ bị chặn 400 (`forbidNonWhitelisted`) | ADMIN+ | integration | `test/http-foundation.e2e-spec.ts` | covered |
| BE-F03 | Sai kiểu → 400 | ADMIN+ | integration | `test/http-foundation.e2e-spec.ts` | covered |
| BE-F04 | **Thiếu field bắt buộc → 400** (D2, trước là 500) | ADMIN+ | unit + integration | `common/dto/required-nested-text.spec.ts`, `test/http-foundation.e2e-spec.ts` | covered |
| BE-F05 | Biên độ dài min/max | ADMIN+ | unit | `common/dto/long-translated-text.dto.spec.ts` | covered |
| BE-F06 | Đúng ở trần → chấp nhận (100.000 ký tự) | ADMIN+ | unit + integration | như trên | covered |
| BE-F07 | Vượt trần 1 ký tự → 400 | ADMIN+ | unit + integration | như trên | covered |
| BE-F08 | Enum sai → 400 | ADMIN+ | integration | `test/http-foundation.e2e-spec.ts` | covered |
| BE-F09 | UUID/slug sai → 404 sạch, không 500 | ADMIN+ | integration | `test/http-foundation.e2e-spec.ts` | covered |
| BE-F10 | Chuỗi rỗng được chấp nhận | ADMIN+ | — | — | **missing (defect D5)** |
| BE-F11 | Chuỗi chỉ có khoảng trắng được chấp nhận | ADMIN+ | — | — | **missing (defect D5)** |
| BE-F12 | `null` → 400 | ADMIN+ | unit | `common/dto/required-nested-text.spec.ts` | covered |
| BE-F13 | Mảng quá lớn bị chặn | ADMIN+ | — | — | **missing (defect D6 — không có `@ArrayMaxSize`)** |
| BE-F14 | Validate DTO lồng nhau báo đúng `content.1.vi` | ADMIN+ | unit + integration | `long-translated-text.dto.spec.ts`, `http-foundation.e2e-spec.ts` | covered |
| BE-F15 | JSON dị dạng → 400 | PUB | integration | `test/http-foundation.e2e-spec.ts` | covered |
| BE-F16 | Content-type không hỗ trợ → 400 | PUB | integration | `test/http-foundation.e2e-spec.ts` | covered |
| BE-F17 | **Vượt trần body → 413** (D1, trước là 500) | PUB | unit + integration | `http-exception.filter.spec.ts`, `http-foundation.e2e-spec.ts` | covered |
| BE-F18 | 404 not-found | PUB | integration | `test/http-foundation.e2e-spec.ts` | covered |
| BE-F19 | 409 slug trùng (không rơi thành 500) | ADMIN+ | integration | `test/http-foundation.e2e-spec.ts` | covered |
| BE-F20 | Lỗi 500 KHÔNG lộ stack trace | PUB | unit + integration | `http-exception.filter.spec.ts`, `http-foundation.e2e-spec.ts` | covered |
| BE-F21 | Log request không lộ credential/token | — | — | — | **blocked** (cần soi log runtime; xem §Hạn chế báo cáo) |
| BE-F22 | Envelope `{success,data}` / `{success,error}` | PUB | unit + integration | `response.interceptor` qua mọi spec | covered |
| BE-F23 | Throttling (rate-limit) | PUB | unit | `common/guards/e2e-aware-throttler.guard.spec.ts`, `auth.controller.spec.ts` | covered |
| BE-F24 | Trust proxy → IP thật cho rate-limit | PUB | unit | `common/trust-proxy.spec.ts` | covered |
| BE-F25 | CORS bắt buộc, không wildcard | PUB | unit | `main.spec.ts` | covered |
| BE-F26 | Health endpoint `GET /api` | PUB | integration | `test/app.e2e-spec.ts` | covered |
| BE-F27 | Thiếu cấu hình dịch vụ ngoài → degrade no-op | — | unit | `mail.service.spec.ts`, `media.controller.spec.ts` | covered |
| BE-F28 | Prisma kết nối / transaction rollback | — | integration | `test/auth-integration.e2e-spec.ts` | covered |
| BE-F29 | Ràng buộc unique (tokenHash) | — | integration | `test/auth-integration.e2e-spec.ts` | covered |
| BE-F30 | Cascade delete theo User | — | integration | `test/auth-integration.e2e-spec.ts` | covered |

## B. Xác thực (Phase 4)

Nguồn: `auth/auth.service.ts`, `auth/auth.controller.ts`, `admin/e2e/admin/login.e2e.ts`.

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| AU-01 | SUPER_ADMIN / ADMIN / EDITOR đăng nhập đúng | unit + browser-e2e | `auth.service.spec.ts`, `login.e2e.ts` | covered |
| AU-02 | Sai mật khẩu → lỗi chung | unit + browser-e2e | như trên | covered |
| AU-03 | Email không tồn tại → **trùng câu** với sai mật khẩu | unit | `auth.service.spec.ts` | covered |
| AU-04 | Tài khoản inactive bị từ chối | unit + browser-e2e | `auth.service.spec.ts`, `login.e2e.ts` | covered |
| AU-05 | Tài khoản pending (chưa thiết lập) bị từ chối | unit + browser-e2e | như trên | covered |
| AU-06 | Email dị dạng / credential rỗng | unit | `auth.controller.spec.ts` + DTO spec | covered |
| AU-07 | Field lạ trong payload login → 400 | unit | DTO spec | covered |
| AU-08 | Đếm sai mật khẩu, chưa khóa dưới 5 lần | unit | `auth.service.spec.ts` | covered |
| AU-09 | Khóa tài khoản ở lần sai thứ 5 → 423 | unit | `auth.service.spec.ts` | covered |
| AU-10 | Hết hạn khóa → đăng nhập lại được | unit | `auth.service.spec.ts` | covered |
| AU-11 | Đăng nhập thành công reset bộ đếm | unit | `auth.service.spec.ts` | covered |
| AU-12 | Không lộ mật khẩu/token trong response | unit + browser-e2e | `auth.service.spec.ts`, `token-privacy.e2e.ts` | covered |
| AU-13 | Access token hết hạn | unit | `auth.service.spec.ts` | covered |
| AU-14 | Refresh token xoay vòng (rotation) | unit + integration | `auth.service.spec.ts`, `auth-integration.e2e-spec.ts` | covered |
| AU-15 | Refresh token đã thu hồi/dùng lại bị từ chối | unit + integration | như trên | covered |
| AU-16 | Logout thu hồi phiên | unit + browser-e2e | `auth.service.spec.ts`, `login.e2e.ts` | covered |
| AU-17 | Logout-all thu hồi mọi phiên | unit | `auth.service.spec.ts` (`revokeAllTokens`) | covered |
| AU-18 | Back sau logout không lộ dữ liệu bảo vệ | browser-e2e | `user-management-security.e2e.ts` | covered |
| AU-19 | Nút hiện/ẩn mật khẩu: chuột / Enter / Space | component + browser-e2e | `PasswordInput.test.tsx`, `login.e2e.ts` | covered |
| AU-20 | Nhãn khả truy cập đổi, giá trị mật khẩu không đổi | component | `PasswordInput.test.tsx` | covered |
| AU-21 | Cookie bảo mật | — | — | **n/a** — thiết kế dùng localStorage (ADR §4 "Auth HttpOnly" hoãn post-launch) |

## C. Quên / đặt lại mật khẩu (Phase 5)

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| PR-01 | Tài khoản active → tạo token + gửi mail giả | unit + browser-e2e | `auth.service.spec.ts`, `forgot-reset.e2e.ts` | covered |
| PR-02 | Không tồn tại / inactive / pending → trung tính, KHÔNG gửi mail | unit + browser-e2e | như trên | covered |
| PR-03 | Email chỉ vào outbox giả, không gọi Resend | unit + browser-e2e | `mail.service.fake-transport.spec.ts`, `forgot-reset.e2e.ts` | covered |
| PR-04 | Rate-limit / cooldown 60s chặn gửi lặp | unit + browser-e2e | `auth.service.spec.ts`, `forgot-reset.e2e.ts` | covered |
| PR-05 | Yêu cầu mới thu hồi token cũ (chỉ token mới nhất dùng được) | unit | `auth.service.spec.ts` | covered |
| PR-06 | `tokenHash` unique | integration | `auth-integration.e2e-spec.ts` | covered |
| PR-07 | KHÔNG lưu token bản rõ trong DB | unit | `auth.service.spec.ts` | covered |
| PR-08 | KHÔNG log token bản rõ | unit | `mail.service.spec.ts` | covered |
| PR-09 | Token hợp lệ → đặt lại được | unit + browser-e2e | `auth.service.spec.ts`, `forgot-reset.e2e.ts` | covered |
| PR-10 | Token sai / hết hạn / đã dùng / dị dạng → lỗi chung | unit | `auth.service.spec.ts` | covered |
| PR-11 | Mật khẩu quá ngắn / quá dài / không khớp | component + browser-e2e | `ResetPasswordPage.test.tsx`, `forgot-reset.e2e.ts` | covered |
| PR-12 | Field lạ trong payload → 400 | unit | `reset-password.dto.spec.ts` | covered |
| PR-13 | Đặt lại tương tranh: đúng MỘT request thắng | unit + integration | `auth.service.spec.ts`, `auth-integration.e2e-spec.ts` | covered |
| PR-14 | Mật khẩu cũ hết tác dụng, mật khẩu mới dùng được | browser-e2e | `forgot-reset.e2e.ts` | covered |
| PR-15 | Thu hồi mọi refresh session sau khi đặt lại | unit + integration + browser-e2e | cả ba tầng | covered |
| PR-16 | Chỉ đổi `passwordHash` (không đổi role/email/setup) | unit | `auth.service.spec.ts` | covered |
| PR-17 | Token bị gỡ khỏi URL sau khi mở link | component + browser-e2e | `ResetPasswordPage.test.tsx`, `token-privacy.e2e.ts` | covered |
| PR-18 | Token không lọt DOM/toast/localStorage/sessionStorage/cookie/console | browser-e2e | `token-privacy.e2e.ts` | covered |

## D. Lời mời & thiết lập tài khoản (Phase 6)

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| IN-01 | SUPER_ADMIN mời được | unit + browser-e2e | `users.service.spec.ts`, `invitation.e2e.ts` | covered |
| IN-02 | ADMIN / EDITOR KHÔNG mời được (403) | unit + browser-e2e | `users.controller.spec.ts`, `invitation.e2e.ts` | covered |
| IN-03 | Chưa đăng nhập → 401 | integration | `http-foundation.e2e-spec.ts`, `banner-content.e2e.ts` | covered |
| IN-04 | Email trùng / dị dạng / đã active / đang pending | unit | `create-account-invitation.dto.spec.ts`, `users.service.spec.ts` | covered |
| IN-05 | Mail lời mời vào outbox giả, không gửi thật | browser-e2e | `invitation.e2e.ts` | covered |
| IN-06 | Token bản rõ KHÔNG trả qua API thường | unit + browser-e2e | `users.service.spec.ts`, `token-privacy.e2e.ts` | covered |
| IN-07 | `tokenHash` unique + hết hạn 48h | unit + integration | `users.service.spec.ts`, `auth-integration.e2e-spec.ts` | covered |
| IN-08 | Gửi lại: link cũ vô hiệu, chỉ link mới dùng được | browser-e2e | `invitation.e2e.ts` | covered |
| IN-09 | Gửi lại cho tài khoản active/disabled bị từ chối | unit | `users.service.spec.ts` | covered |
| IN-10 | Thu hồi: token bị vô hiệu | browser-e2e | `invitation.e2e.ts` | covered |
| IN-11 | Thu hồi khi đã thu hồi / đã nhận | unit | `users.service.spec.ts` | covered |
| IN-12 | Nhận lời mời hợp lệ → đặt mật khẩu, `setupCompletedAt` | unit + browser-e2e | `auth.service.spec.ts`, `invitation.e2e.ts` | covered |
| IN-13 | Token sai/hết hạn/đã thu hồi/đã dùng → lỗi chung | unit | `auth.service.spec.ts` | covered |
| IN-14 | Validate mật khẩu + hồ sơ | unit + component | `accept-invitation.dto.spec.ts`, `AccountSetupPage.test.tsx` | covered |
| IN-15 | Nhận tương tranh: đúng MỘT request thắng | integration | `auth-integration.e2e-spec.ts` | covered |
| IN-16 | Đăng nhập được sau khi thiết lập | browser-e2e | `invitation.e2e.ts` | covered |
| IN-17 | Không tạo phiên đăng nhập khi accept | unit | `auth.service.spec.ts` | covered |

## E. Quản lý tài khoản & phân quyền (Phase 7)

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| UM-01 | SUPER_ADMIN: list/xem/mời/gửi lại/thu hồi/sửa/đổi vai trò/khóa | unit + browser-e2e | `users.controller.spec.ts`, `UsersPage.test.tsx`, `user-management-security.e2e.ts` | covered |
| UM-02 | ADMIN: read-only, không thấy nút quản lý, API 403 | unit + browser-e2e | `users.controller.spec.ts`, `user-management-security.e2e.ts` | covered |
| UM-03 | EDITOR: chặn UI (`/403`) + API 403 | component + browser-e2e | `nav.test.ts`, `ProtectedRoute.test.tsx`, `invitation.e2e.ts` | covered |
| UM-04 | Không có ô mật khẩu ở form tạo/sửa | component + browser-e2e | `UserFormDialog.test.tsx`, `user-management-security.e2e.ts` | covered |
| UM-05 | `passwordHash` không bao giờ lộ ra response | unit + api-e2e | `users.service.spec.ts`, `user-management-security.e2e.ts` | covered |
| UM-06 | Không mass-assign `setupCompletedAt`/`failedLoginAttempts`/`lockedUntil` | unit + api-e2e | `update-user.dto.spec.ts`, `user-management-security.e2e.ts` | covered |
| UM-07 | tokenHash (lời mời/reset/refresh) không lộ | api-e2e | `user-management-security.e2e.ts` | covered |
| UM-08 | Leo thang vai trò bị từ chối 403 | api-e2e | `user-management-security.e2e.ts` | covered |
| UM-09 | SUPER_ADMIN cuối không bị hạ quyền/khóa/xóa | unit + api-e2e | `users.service.spec.ts`, `user-management-security.e2e.ts` | covered |
| UM-10 | Hạ quyền SUPER_ADMIN **không phải cuối** vẫn được | api-e2e | `user-management-security.e2e.ts` | covered |
| UM-11 | Tự hạ quyền / tự khóa bị chặn | unit + api-e2e | như trên | covered |
| UM-12 | Tài khoản seed nguyên vẹn sau mọi thao tác | api-e2e | `user-management-security.e2e.ts` | covered |
| UM-13 | Nhãn trạng thái Pending/Active/Disabled + ưu tiên | unit + browser-e2e | `user-status.test.ts`, `user-management-security.e2e.ts` | covered |
| UM-14 | Tương phản WCAG AA của huy hiệu trạng thái | browser-e2e | `accessibility.e2e.ts`, `contrast.e2e.ts` | covered |
| UM-15 | Phân trang / filter / search danh sách tài khoản | — | — | **missing** |
| UM-16 | Đổi vai trò thu hồi phiên | api-e2e | `user-management-security.e2e.ts` | covered |
| UM-17 | **`POST /api/users` (tạo trực tiếp) đã gỡ — trả 404** cho khách / ADMIN / EDITOR / SUPER_ADMIN | unit + integration + api-e2e | `users.controller.spec.ts`, `test/retired-user-create.e2e-spec.ts`, `retired-user-create.e2e.ts` | covered |
| UM-18 | **Payload `password` / `passwordHash` / rỗng gửi tới `POST /api/users` không tạo hàng nào trong DB** | integration + api-e2e | `test/retired-user-create.e2e-spec.ts`, `retired-user-create.e2e.ts` | covered |
| UM-19 | **Admin không còn hàm/hook/URL tạo tài khoản trực tiếp**; UI tạo tài khoản không phát sinh `POST /users` | unit + browser-e2e | `lib/api/users.retired-create.test.ts`, `retired-user-create.e2e.ts` | covered |
| UM-20 | **Lời mời vẫn là lối cấp tài khoản duy nhất** và từ chối field `password` (400) | integration + api-e2e | `test/retired-user-create.e2e-spec.ts`, `invitation.e2e.ts` | covered |

## F. Tin tức (Phase 8 admin · Phase 9 public)

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| NW-01 | Tạo nháp mặc định DRAFT, chưa có `publishedAt` | integration | `app.e2e-spec.ts` | covered |
| NW-02 | SUPER_ADMIN tạo là PUBLISHED ngay (bypass duyệt) | unit | `common/content-approval.spec.ts` | covered |
| NW-03 | EDITOR chỉ `DRAFT→PENDING`; ADMIN đặt trạng thái tùy ý | unit | `content-approval.spec.ts`, `news.service.spec.ts` | covered |
| NW-04 | Chuyển trạng thái bị cấm → 403 | unit | `news.service.spec.ts` | covered |
| NW-05 | Duyệt đăng → xuất hiện public kèm `publishedAt` | integration | `app.e2e-spec.ts` | covered |
| NW-06 | **DRAFT/PENDING không lộ ra route public** (list + chi tiết) | integration + api-e2e + browser-e2e | `app.e2e-spec.ts`, `http-foundation.e2e-spec.ts`, `news-slider-pagination.e2e.ts`, `content.e2e.ts` | covered |
| NW-07 | Validate slug/title/summary + slug trùng 409 | unit + integration | DTO spec, `http-foundation.e2e-spec.ts` | covered |
| NW-08 | Nội dung dài tới trần 100.000 ký tự, không truncate | unit | `long-translated-text.dto.spec.ts`, `long-form-content.test.ts` | covered |
| NW-09 | Nội dung VI + EN | unit + component | `bilingual.test.ts`, `BilingualField.test.tsx` | covered |
| NW-10 | Xóa bài → public 404 | integration | `app.e2e-spec.ts` | covered |
| NW-11 | Xóa không đủ quyền bị chặn | unit | `news.controller` `@Roles` metadata spec | covered |
| NW-12 | Slider trang chủ: 3/2/1 thẻ theo desktop/tablet/mobile | browser-e2e | `news-slider-pagination.e2e.ts` | covered |
| NW-13 | Next/Previous, phím ArrowLeft/Right, nút vô hiệu ở biên | browser-e2e | `news-slider-pagination.e2e.ts` | covered |
| NW-14 | Không thẻ trùng, không track trắng, không tràn ngang | unit + browser-e2e | `news-slider-transform.test.ts`, `news-slider.test.tsx`, e2e | covered |
| NW-15 | Phân trang: trang 1/2/cuối, rỗng, `page=0`/âm/không phải số/vượt trần | api-e2e + browser-e2e | `news-slider-pagination.e2e.ts` | covered |
| NW-16 | URL là nguồn sự thật; refresh + Back/Forward giữ trang | browser-e2e | `news-slider-pagination.e2e.ts` | covered |
| NW-17 | `aria-current` đúng, phân trang mobile không tràn | browser-e2e | `news-slider-pagination.e2e.ts` | covered |
| NW-18 | Trang khác nhau không lặp bản ghi | api-e2e | `news-slider-pagination.e2e.ts` | covered |
| NW-19 | Bản EN của trang tin | browser-e2e | `news-slider-pagination.e2e.ts` | covered |
| NW-20 | Chi tiết bài: JSON-LD NewsArticle + breadcrumb | unit | `lib/seo.test.ts` | partial (chưa khẳng định trên HTML render thật) |
| NW-21 | Admin list tin: phân trang/sort/search/filter/empty/error/loading | — | — | **missing** (chỉ có smoke `pages.smoke.test.tsx`) |
| NW-22 | Admin form tin: nạp lại đủ nội dung dài, không đổi trạng thái ngoài ý | unit | `long-form-content.test.ts` (round-trip) | partial |
| NW-23 | Sanitize HTML / chống XSS trong nội dung rich | — | — | **missing** (xem defect D7) |

## G. Banner (Phase 10)

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| BN-01 | API công khai chỉ trả banner đang bật | unit + api-e2e | `banners.controller.spec.ts`, `banner-content.e2e.ts` | covered |
| BN-02 | Thứ tự tất định, không trùng ảnh | api-e2e | `banner-content.e2e.ts` | covered |
| BN-03 | Không token → không đọc/ghi route quản trị | api-e2e | `banner-content.e2e.ts` | covered |
| BN-04 | Phân quyền create/update/reorder/delete = ADMIN+ | unit | `banners.controller.spec.ts` | covered |
| BN-05 | Validate DTO, `href`, `objectPosition`, song ngữ, độ dài | unit + component | `banner-content.spec.ts`, `BannersPage.test.tsx` | covered |
| BN-06 | Admin: list, thêm, sửa, bật/tắt, xem trước ảnh, payload khớp DTO | component | `BannersPage.test.tsx` | covered |
| BN-07 | Trang chủ VI/EN hiện đúng nội dung slide | browser-e2e | `banner-content.e2e.ts` | covered |
| BN-08 | 4 slide, ảnh tải được, alt có nghĩa | browser-e2e | `banner-content.e2e.ts` | covered |
| BN-09 | Route CTA mở được ở cả VI và EN | browser-e2e | `banner-content.e2e.ts` | covered |
| BN-10 | Điều khiển bàn phím + focus ring nhìn thấy | browser-e2e | `banner-content.e2e.ts` | covered |
| BN-11 | `prefers-reduced-motion` tắt autoplay | browser-e2e | `banner-content.e2e.ts` | covered |
| BN-12 | Autoplay tạm dừng khi hover | browser-e2e | `banner-content.e2e.ts` | covered |
| BN-13 | Responsive 375/768/1280 không tràn, chữ không bị clamp mất | browser-e2e | `banner-content.e2e.ts` | covered |
| BN-14 | axe + tương phản khối banner | browser-e2e | `banner-content.e2e.ts` | covered |
| BN-15 | Không lỗi console, không gọi dịch vụ production | browser-e2e | `banner-content.e2e.ts` | covered |
| BN-16 | Reorder qua Admin UI | — | — | **missing** (backend có test phân quyền; UI chưa) |

## H. Dự án & hạng mục (Phase 11)

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| PJ-01 | API list/detail công khai chỉ trả PUBLISHED | unit | `projects.service.spec.ts` | covered |
| PJ-02 | Chi tiết hạng mục, gallery cấp dự án, fallback ảnh | unit | `projects.service.spec.ts`, `mappers.test.ts` | covered |
| PJ-03 | Route công khai `/du-an`, `/du-an/[slug]` không lỗi | browser-e2e | `content.e2e.ts` | partial (chỉ kiểm status + không lỗi console) |
| PJ-04 | Tương phản trang `du-an` | browser-e2e | `contrast.e2e.ts` | covered |
| PJ-05 | Admin CRUD dự án: create/edit/delete/validate/slug trùng | integration (API) | `http-foundation.e2e-spec.ts` (một phần), `projects.service.spec.ts` | partial |
| PJ-06 | Gallery keyboard / touch / responsive | — | — | **missing** |
| PJ-07 | Breadcrumb + JSON-LD trang dự án | unit | `breadcrumb.test.tsx`, `seo.test.ts` | partial (chưa kiểm trên HTML thật) |
| PJ-08 | Thiếu field bắt buộc → 400 (D2) | unit + integration | `required-nested-text.spec.ts`, `http-foundation.e2e-spec.ts` | covered |

## I. Trang tĩnh & trang do CMS quản lý (Phase 12)

Route thật (từ `frontend/src/app/[locale]/`): `/`, `gioi-thieu`,
`cong-ty-thanh-vien`, `du-an`, `du-an/[slug]`, `du-an/[slug]/[hang-muc]`,
`tin-tuc`, `tin-tuc/[slug]`, `lien-he`, `tuyen-dung`, `dao-tao`,
`chinh-sach-nhan-su`, `so-do-to-chuc-cong-ty` + `robots.ts`, `sitemap.ts`,
`api/health`.

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| ST-01 | Route quan trọng trả status mong đợi, không lỗi console | browser-e2e | `content.e2e.ts` | covered |
| ST-02 | Route VI và EN + đổi locale | browser-e2e | `content.e2e.ts` | covered |
| ST-03 | Nội dung không tồn tại → not-found | browser-e2e | `content.e2e.ts` | covered |
| ST-04 | Route auth/admin KHÔNG tồn tại trên frontend công khai | browser-e2e | `content.e2e.ts` | covered |
| ST-05 | axe trang chủ / liên hệ / tin tức | browser-e2e | `accessibility.e2e.ts` | covered |
| ST-06 | axe `gioi-thieu` / `cong-ty-thanh-vien` / `du-an` | browser-e2e | `contrast.e2e.ts` (chỉ color-contrast) | partial |
| ST-07 | axe `tuyen-dung` / `dao-tao` / `chinh-sach-nhan-su` / `so-do-to-chuc` | — | — | **missing** |
| ST-08 | Metadata/canonical/hreflang trên HTML render thật | — | — | **missing** (chỉ có unit `seo.test.ts`) |
| ST-09 | Phân cấp heading (một `h1`) toàn site | browser-e2e | `accessibility.e2e.ts` (admin + 3 trang public) | partial |
| ST-10 | 404 page + error boundary | browser-e2e | `content.e2e.ts` (not-found) | partial (chưa kiểm `error.tsx`) |

## J. Form liên hệ (Phase 13)

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| CT-01 | Gửi hợp lệ → UI thành công + lưu DB + mail giả đúng người nhận | browser-e2e | `contact.e2e.ts` | covered |
| CT-02 | Validate bắt buộc / email / độ dài nội dung | component + browser-e2e | `contact-form.test.tsx`, `contact.e2e.ts` | covered |
| CT-03 | Biên min/max, đúng trần, vượt trần 1 | unit | `create-contact-submission.dto.spec.ts` | covered |
| CT-04 | Field lạ bị từ chối | unit | `create-contact-submission.dto.spec.ts` | covered |
| CT-05 | Chống gửi trùng / double-click | browser-e2e | `contact.e2e.ts` | covered |
| CT-06 | Lưu DB TRƯỚC khi gửi mail; mail lỗi không mất lead | unit + browser-e2e | `contact.service.spec.ts`, `contact.e2e.ts` | covered |
| CT-07 | Escape HTML / payload XSS an toàn trong email | unit + browser-e2e | `mail.service.spec.ts`, `contact.e2e.ts` | covered |
| CT-08 | Rate limit 5/IP/giờ | unit | `contact.service.spec.ts` / controller spec | covered |
| CT-09 | Lỗi backend hiển thị an toàn, không lộ stack | browser-e2e | `contact.e2e.ts` | covered |
| CT-10 | Nhãn khả truy cập + focus sau lỗi validate | browser-e2e | `accessibility.e2e.ts`, `contact.e2e.ts` | covered |
| CT-11 | Lead xuất hiện qua `GET /contact` (ADMIN+) | api-e2e | `contact.e2e.ts` | covered |
| CT-12 | Admin quản lý lead: list/phân trang/filter/chi tiết/đổi trạng thái/ghi chú | component | `ContactPage` (coverage 79%, không có test riêng) | **partial** |
| CT-13 | Vai trò không đủ quyền bị chặn khỏi lead | unit | `contact.controller` `@Roles` | covered |

## K. Module CMS khác (Phase 14)

| ID | Module | List/CRUD | Phân quyền | Public | Trạng thái |
|---|---|---|---|---|---|
| CM-01 | Pages (`/trang`) | unit backend + smoke admin | unit | `pages.service.spec.ts` | partial |
| CM-02 | Cooperation (`/du-an-hop-tac`) | — | controller `@Roles` | — | **missing** (admin page 0% coverage) |
| CM-03 | Media (`/thu-vien`) | component | unit (`media.controller.spec.ts` R1) | — | covered |
| CM-04 | News categories | unit DTO | controller `@Roles` | — | partial |
| CM-05 | Search (`/search`) | unit | — | `search.service.spec.ts` | partial |
| CM-06 | Dashboard (`/`) | — | — | — | **missing** (0% coverage) |
| CM-07 | Profile (`/ho-so`) | — | unit (`/users/me`) | — | **missing** (0% coverage) |
| CM-08 | Profile requests (`/duyet-ho-so`) | — | unit (controller) | — | **missing** (0% coverage) |

## L. Localization (Phase 15)

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| LC-01 | Route VI + EN, đổi locale giữ trang | browser-e2e | `content.e2e.ts`, `news-slider-pagination.e2e.ts` | covered |
| LC-02 | Cấu hình i18n + fallback khi thiếu bản dịch | unit | `lib/i18n/config.test.ts`, `mappers.test.ts` | covered |
| LC-03 | Nội dung banner/tin VI + EN trên HTML thật | browser-e2e | `banner-content.e2e.ts`, `news-slider-pagination.e2e.ts` | covered |
| LC-04 | Phân trang giữ locale + số trang | browser-e2e | `news-slider-pagination.e2e.ts` | covered |
| LC-05 | Field song ngữ ở Admin lưu + nạp lại đúng | component | `BilingualField.test.tsx`, `bilingual.test.ts` | covered |
| LC-06 | Ngày tháng theo giờ VN (UTC+7) | unit | `labels.test.ts`, `format` | covered |
| LC-07 | KHÔNG còn chữ Việt lọt trang `/en` (và ngược lại) | — | — | **missing** (đợt EN-SITE-WIDE làm thủ công) |
| LC-08 | Metadata bản địa hóa | unit | `seo.test.ts` | partial |

## M. Responsive (Phase 16)

| ID | Phạm vi | Viewport | File test | Trạng thái |
|---|---|---|---|---|
| RS-01 | Admin login/forgot/reset/setup | 375 · 768 · 1280 | `responsive.e2e.ts` | covered |
| RS-02 | Admin danh sách tài khoản | 375 · 768 · 1280 | `responsive.e2e.ts` | covered |
| RS-03 | Modal thêm tài khoản nằm gọn viewport | 375 | `responsive.e2e.ts` | covered |
| RS-04 | Frontend trang chủ + liên hệ | 375 · 768 · 1280 | `responsive.e2e.ts` | covered |
| RS-05 | Banner + chữ banner | 375 · 768 · 1280 | `banner-content.e2e.ts` | covered |
| RS-06 | Slider tin + phân trang mobile | 375 · 768 · 1280 | `news-slider-pagination.e2e.ts` | covered |
| RS-07 | Viewport 320×568 · 360×800 · 390×844 · 1024×768 · 1440×900 | — | — | **missing** (bộ hiện tại chỉ 3 viewport) |
| RS-08 | Admin news/projects/banners/contacts form ở mobile | — | — | **missing** |
| RS-09 | Chẩn đoán tràn ngang chỉ đúng phần tử + bounding box | helper | `e2e/helpers/layout.ts` | covered |

## N. Accessibility (Phase 17)

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| A1-01 | axe WCAG 2A/2AA — admin login/forgot/reset/setup/users | browser-e2e | `accessibility.e2e.ts` | covered |
| A1-02 | axe — frontend home/contact/news | browser-e2e | `accessibility.e2e.ts` | covered |
| A1-03 | 0 vi phạm color-contrast × 3 viewport (admin + 6 trang FE) | browser-e2e | `contrast.e2e.ts` | covered |
| A1-04 | Đúng một `h1` | browser-e2e | `accessibility.e2e.ts` | partial (4 trang) |
| A1-05 | Nhãn form + tên khả truy cập của nút/link | browser-e2e | `accessibility.e2e.ts`, `banner-content.e2e.ts` | covered |
| A1-06 | Modal bẫy focus + Escape đóng + focus quay về trigger | browser-e2e | `accessibility.e2e.ts` | covered |
| A1-07 | Điều khiển carousel bằng bàn phím + focus ring | browser-e2e | `banner-content.e2e.ts` | covered |
| A1-08 | Semantics phân trang + `aria-current` | component + browser-e2e | `pagination.test.tsx`, `news-slider-pagination.e2e.ts` | covered |
| A1-09 | Huy hiệu trạng thái đạt tương phản dư biên (hồi quy) | browser-e2e | `accessibility.e2e.ts` | covered |
| A1-10 | `prefers-reduced-motion` | browser-e2e | `banner-content.e2e.ts` | covered |
| A1-11 | Alt ảnh có nghĩa / ảnh trang trí | browser-e2e | `banner-content.e2e.ts` | partial |
| A1-12 | "Skip to content" | — | — | **missing** |
| A1-13 | Trạng thái điều hướng active | component | `nav.test.ts` | partial |

## O. Bảo mật (Phase 18)

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| SC-01 | 401 cho API bảo vệ khi chưa đăng nhập | integration + api-e2e | `http-foundation.e2e-spec.ts`, nhiều spec | covered |
| SC-02 | 403 cho vai trò không đủ quyền | unit + api-e2e | controller specs, `user-management-security.e2e.ts` | covered |
| SC-03 | Điều hướng URL trực tiếp bị chặn | browser-e2e | `invitation.e2e.ts`, `login.e2e.ts` | covered |
| SC-04 | Leo thang vai trò bị từ chối | api-e2e | `user-management-security.e2e.ts` | covered |
| SC-05 | Field lạ / mass assignment | unit + integration | DTO specs, `http-foundation.e2e-spec.ts` | covered |
| SC-06 | Chuỗi SQL injection | unit | `search.service.spec.ts` (parameterized) | partial |
| SC-07 | JSON dị dạng / payload quá lớn / content-type lạ | integration | `http-foundation.e2e-spec.ts` | covered |
| SC-08 | Chuỗi path traversal (media) | unit | `media.controller.spec.ts` / cloudinary | partial |
| SC-09 | URL scheme độc hại (`javascript:` / `data:`) | — | — | **missing** (defect D7) |
| SC-10 | Sanitize nội dung rich | — | — | **missing** (defect D7) |
| SC-11 | Không lộ password/hash/tokenHash | unit + api-e2e | `users.service.spec.ts`, `user-management-security.e2e.ts` | covered |
| SC-12 | Token bản rõ không lọt log/DOM/storage/console/history | unit + browser-e2e | `mail.service.spec.ts`, `token-privacy.e2e.ts` | covered |
| SC-13 | CORS | unit | `main.spec.ts` | covered |
| SC-14 | Security headers (helmet + `vercel.json`) | unit | `vercel-headers.test.ts`, `main.spec.ts` | covered |
| SC-15 | Thông điệp lỗi không lộ nội bộ | unit + integration | `http-exception.filter.spec.ts`, `http-foundation.e2e-spec.ts` | covered |
| SC-16 | `npm audit` theo mức nghiêm trọng | — | báo cáo audit §Z | covered (báo cáo, không tự sửa) |
| SC-17 | IDOR / truy cập tài nguyên của user khác | api-e2e | `user-management-security.e2e.ts` (một phần) | partial |
| SC-18 | Cache-control cho response bảo vệ | — | — | **missing** |
| SC-19 | Route hỗ trợ test chỉ chạy cục bộ + `@e2e.test` | unit | `test-only.guard.spec.ts`, `test-users.service.spec.ts` | covered |

## P. SEO (Phase 19)

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| SE-01 | title/description/canonical/hreflang (hàm dựng) | unit | `lib/seo.test.ts` | covered |
| SE-02 | `robots.ts` + `sitemap.ts` | unit | `site.test.ts`, `seo.test.ts` | partial |
| SE-03 | JSON-LD Organization / NewsArticle / BreadcrumbList | unit | `seo.test.ts` | partial |
| SE-04 | Open Graph / Twitter metadata | unit | `seo.test.ts` | partial |
| SE-05 | `noindex` cho trang placeholder | unit | `seo.test.ts` (`placeholderPaths`) | covered |
| SE-06 | Xác minh metadata trên **HTML render thật** mọi route công khai | — | — | **missing** |
| SE-07 | Canonical trang phân trang | — | — | **missing** |
| SE-08 | Admin không bị index | unit | `vercel-headers.test.ts` | partial |
| SE-09 | Link nội bộ / link vỡ | browser-e2e | `banner-content.e2e.ts` (href CTA) | partial |

## Q. Hiệu năng & runtime (Phase 20)

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| PF-01 | Không lỗi console trên trang chủ | browser-e2e | `banner-content.e2e.ts`, `content.e2e.ts` | covered |
| PF-02 | Trang chủ KHÔNG kéo cả kho tin (tôn trọng `limit`) | api-e2e + browser-e2e | `news-slider-pagination.e2e.ts` | covered |
| PF-03 | Trần phân trang API (`limit` vượt → 400) | api-e2e | `news-slider-pagination.e2e.ts` | covered |
| PF-04 | Thứ tự DB tất định | api-e2e | `news-slider-pagination.e2e.ts`, `banner-content.e2e.ts` | covered |
| PF-05 | Build production 3 repo | build | `npm run build` × 3 | covered |
| PF-06 | Không cảnh báo hydration / duplicate React key | browser-e2e | gián tiếp qua kiểm lỗi console | partial |
| PF-07 | Lighthouse home/news/project/contact | — | — | **blocked** (không chạy trong đợt này — xem §AB báo cáo) |
| PF-08 | Rò rỉ bộ nhớ khi điều hướng lặp | — | — | **missing** |
| PF-09 | Ảnh dùng `next/image` + lazy-load | — | — | partial (cảnh báo `images.qualities` phát hiện trong log — defect D8) |

## R. Cơ sở dữ liệu (Phase 21)

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| DB-01 | `prisma validate` / `generate` / `migrate deploy` sạch | pipeline | thủ công + CI | covered |
| DB-02 | Seed idempotent (chạy 2 lần không nhân bản) | pipeline | kiểm trong đợt audit này | covered |
| DB-03 | Đúng 2 tài khoản seed, vai trò đúng | pipeline + integration | `app.e2e-spec.ts`, kiểm SQL | covered |
| DB-04 | Transaction rollback | integration | `auth-integration.e2e-spec.ts` | covered |
| DB-05 | Unique constraint | integration | `auth-integration.e2e-spec.ts` | covered |
| DB-06 | Cascade delete | integration | `auth-integration.e2e-spec.ts` | covered |
| DB-07 | Nhận lời mời / đặt lại tương tranh | integration | `auth-integration.e2e-spec.ts` | covered |
| DB-08 | Không còn dữ liệu `@e2e.test` sau khi chạy | pipeline | kiểm SQL trong đợt audit | covered |
| DB-09 | Cầu chì từ chối URL DB không phải cục bộ | unit + pipeline | `seed-e2e.js`, `e2e/helpers/backend-env.ts` | covered |
| DB-10 | Ràng buộc enum / nullability | schema | `prisma validate` | partial |

## S. Trạng thái lỗi / rỗng / đang tải (Phase 22)

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| ER-01 | Lỗi mạng ở form quên mật khẩu → toast chung, giữ form | component + browser-e2e | `ForgotPasswordPage.test.tsx`, `forgot-reset.e2e.ts` | covered |
| ER-02 | Lỗi backend ở form liên hệ hiển thị an toàn | browser-e2e | `contact.e2e.ts` | covered |
| ER-03 | Token chết vs mất mạng phân biệt được | component | `ResetPasswordPage.test.tsx` | covered |
| ER-04 | Dịch thông điệp lỗi API sang tiếng Việt | unit | `api-error-message.test.ts`, `auth-error-message.test.ts` | covered |
| ER-05 | Trạng thái rỗng / đang tải các trang Admin | component | `pages.smoke.test.tsx`, `MediaPage.test.tsx`, `BannersPage.test.tsx` | partial |
| ER-06 | API 401/403/404/409/429/500 ở từng trang Admin | — | — | **missing** (phủ ở tầng API, chưa ở tầng UI từng trang) |
| ER-07 | Phiên hết hạn → tự `/auth/refresh` | component | `AuthContext.test.tsx`, `client.ts` (17% coverage) | partial |
| ER-08 | Retry không nhân đôi mutation | browser-e2e | `contact.e2e.ts` (chống gửi trùng) | partial |

## T. Điều hướng trình duyệt (Phase 23)

| ID | Case | Mức | File test | Trạng thái |
|---|---|---|---|---|
| NV-01 | Deep link trực tiếp + refresh trên route động | browser-e2e | `news-slider-pagination.e2e.ts` | covered |
| NV-02 | Back / Forward | browser-e2e | `news-slider-pagination.e2e.ts` | covered |
| NV-03 | Giữ query-string / locale / số trang | browser-e2e | `news-slider-pagination.e2e.ts` | covered |
| NV-04 | Route bảo vệ redirect về đăng nhập | browser-e2e | `login.e2e.ts` | covered |
| NV-05 | Back sau logout không lộ dữ liệu | browser-e2e | `user-management-security.e2e.ts` | covered |
| NV-06 | 404 handling | browser-e2e | `content.e2e.ts` | covered |
| NV-07 | Không vòng lặp redirect | browser-e2e | gián tiếp (mọi test điều hướng) | partial |
| NV-08 | Redirect sau đăng nhập về đúng trang trước đó | — | — | **missing** |
| NV-09 | Link ngoài / anchor | — | — | **missing** |

## U. CI (Phase 24)

| ID | Case | Bằng chứng | Trạng thái |
|---|---|---|---|
| CI-01 | YAML hợp lệ, 4 workflow | đọc + parse | covered |
| CI-02 | Node 22, `npm ci`, lockfile | `ci.yml` × 3, `e2e-fullstack.yml` | covered |
| CI-03 | Service PostgreSQL 17 + health-check | `e2e-fullstack.yml` | covered |
| CI-04 | `prisma validate/generate/migrate/seed` thành bước riêng | `e2e-fullstack.yml` | covered |
| CI-05 | Kiểm vai trò tài khoản bootstrap = ADMIN | `e2e-fullstack.yml` | covered |
| CI-06 | DB cục bộ an toàn, secret toàn giá trị GIẢ | `e2e-fullstack.yml` | covered |
| CI-07 | Cổng tường minh + `--strictPort` + 127.0.0.1 | `e2e-fullstack.yml` | covered |
| CI-08 | Frontend health route + làm nóng trang | `e2e-fullstack.yml` | covered |
| CI-09 | Vòng lặp thử lại có giới hạn, in log service khi lỗi | `e2e-fullstack.yml` | covered |
| CI-10 | `DEBUG=pw:webserver` + upload artifact khi lỗi | `e2e-fullstack.yml` | covered |
| CI-11 | Không `continue-on-error`, không `\|\| true`, không skip test | grep toàn bộ workflow | covered |
| CI-12 | Không trigger deploy, không dùng credential production | đọc workflow | covered |
| CI-13 | Checkout cross-repo cần `WORKSPACE_TOKEN` | `e2e-fullstack.yml` | covered |
| CI-14 | **Có lượt chạy Actions thật làm bằng chứng xanh** | — | **blocked** (audit này chạy cục bộ; không commit/push) |

---

## Tổng hợp

| Nhóm | covered | partial | missing | blocked | n/a |
|---|---|---|---|---|---|
| A. Nền tảng backend | 27 | 0 | 3 | 1* | 0 |
| B. Xác thực | 19 | 0 | 0 | 0 | 1 |
| C. Quên/đặt lại mật khẩu | 18 | 0 | 0 | 0 | 0 |
| D. Lời mời / thiết lập | 17 | 0 | 0 | 0 | 0 |
| E. Quản lý tài khoản | 19 | 0 | 1 | 0 | 0 |
| F. Tin tức | 19 | 3 | 2 | 0 | 0 |
| G. Banner | 15 | 0 | 1 | 0 | 0 |
| H. Dự án | 4 | 3 | 1 | 0 | 0 |
| I. Trang tĩnh | 5 | 4 | 2 | 0 | 0 |
| J. Liên hệ | 11 | 1 | 0 | 0 | 0 |
| K. Module CMS khác | 1 | 3 | 4 | 0 | 0 |
| L. Localization | 6 | 1 | 1 | 0 | 0 |
| M. Responsive | 7 | 0 | 2 | 0 | 0 |
| N. Accessibility | 9 | 4 | 1 | 0 | 0 |
| O. Bảo mật | 12 | 4 | 3 | 0 | 0 |
| P. SEO | 2 | 6 | 2 | 0 | 0 |
| Q. Hiệu năng | 5 | 2 | 1 | 1 | 0 |
| R. Cơ sở dữ liệu | 9 | 1 | 0 | 0 | 0 |
| S. Lỗi/rỗng/tải | 4 | 3 | 1 | 0 | 0 |
| T. Điều hướng | 6 | 1 | 2 | 0 | 0 |
| U. CI | 13 | 0 | 0 | 1 | 0 |
| **Tổng** | **224** | **39** | **27** | **4** | **1** |

\* BE-F21 (log không lộ credential) — `blocked` vì cần soi log runtime, không tự
động hóa được bằng bộ test hiện tại.

**Kết luận ma trận:** 224/295 case (75,9%) có test tự động thật khẳng định. 39
case phủ một phần, 27 case chưa có test, 4 case bị chặn. Các khoảng trống lớn
nhất, theo thứ tự rủi ro: **sanitize nội dung rich / URL scheme độc hại (D7)**,
**metadata SEO trên HTML render thật (SE-06/07)**, **CRUD Admin cho News /
Projects / Pages / Cooperation ở tầng trình duyệt**, và **axe cho 4 trang tĩnh
còn lại (ST-07)**.

---

## Cập nhật M2 (2026-07-30)

Đợt [FINAL-RELEASE-HARDENING-M2](2026-07-30-m2-release-hardening.md) đổi trạng thái
các case sau:

| ID | Trước M2 | Sau M2 | Bằng chứng |
|---|---|---|---|
| BE-F10 | missing (defect D5) | **covered** | `not-blank.spec.ts` + HTTP E2E — chuỗi rỗng bị **từ chối** |
| BE-F11 | missing (defect D5) | **covered** | như trên — khoảng trắng/tab/newline/Unicode/zero-width bị từ chối |
| BE-F13 | missing (defect D6) | **covered** | `MAX_CONTENT_BLOCKS = 500`; test rỗng/1/500/501/5000 |
| SC-09 | **missing** (URL scheme độc hại) | **covered** | `safe-url.spec.ts` (51) + 11 HTTP E2E + browser E2E; hàng rào **phía server** |
| SC-10 | **missing** (sanitize rich content) | **covered** | Hợp đồng xác định là **plain text**; `json-ld.test.ts` (8) + `rich-content-security.e2e.ts` (5) — payload không thực thi ở cả VI/EN |
| NW-23 | **missing** (XSS nội dung rich) | **covered** | như trên; **đã tìm + đóng XSS-01 thật** |
| RS-07 | **missing** (5/8 viewport) | **covered** | `responsive.e2e.ts` đủ 8 viewport, 41/41 xanh |
| RS-08 | **missing** (form Admin ở mobile) | **covered** | modal form tin tức/dự án/banner nằm gọn viewport ở cả 8 bề rộng |
| PJ-06 | missing (gallery responsive) | **partial** | gallery hạng mục nay được đo responsive ở 8 viewport (đã tìm+sửa defect `min-w-0`); bàn phím/touch vẫn chưa phủ |
| ST-06 | partial | **partial** (rộng hơn) | thêm `gioi-thieu`, `cong-ty-thanh-vien`, tin tức/dự án chi tiết vào phép đo responsive; axe vẫn chưa phủ hết |
| D10 (CI) | missing/blocked | **covered** | 4 chế độ build đã kiểm; hợp đồng CI ghi tường minh |

**Tổng cập nhật:** `covered` 224 → **233** · `partial` 39 → 39 · `missing` 27 →
**18** · `blocked` 4 → 4 · `n/a` 1.

Tỷ lệ có test tự động thật: 75,9% → **79,0%**.

**Khoảng trống lớn nhất còn lại** (theo thứ tự rủi ro):
1. **SE-06/SE-07** — metadata/canonical/hreflang/JSON-LD chưa được kiểm trên **HTML
   render thật** của mọi route công khai (JSON-LD nay *có* được kiểm là JSON hợp lệ
   ở trang tin tức, nhưng chưa phủ toàn site).
2. **ST-07** — axe chưa phủ 4 trang tĩnh + trang chi tiết tin/dự án/hạng mục + phần
   lớn trang Admin.
3. **CRUD Admin ở tầng trình duyệt** cho News/Projects/Pages/Cooperation (§F, §K)
   — 4 trang vẫn 0% coverage đơn vị.
4. **LC-07** — chưa có test tự động chặn chữ Việt lọt trang `/en`.
5. **`admin/src/lib/api/client.ts`** coverage 17% — nhánh tự `/auth/refresh` khi 401
   chỉ phủ gián tiếp.
6. **M2-R2** — `prefers-reduced-motion` không trung hoà reveal trên trang
   `.projects-motion` (a11y gap mới phát hiện, chưa sửa).

## Cập nhật CMS-RETIRE-DIRECT-USER-CREATE-M1 (2026-07-31)

Gỡ hẳn route tạo tài khoản trực tiếp `POST /api/users` (xem ledger
[implementation-plan §7](../../04-implementation/implementation-plan.md#section-7--changelog--audit-trail)).

| ID | Trước | Sau | Bằng chứng |
|---|---|---|---|
| UM-17 | *(chưa có case — route vẫn reachable)* | **covered** | 404 cho khách/ADMIN/EDITOR/SUPER_ADMIN; unit khẳng định controller không còn handler `create` và không còn route `POST ""` |
| UM-18 | *(chưa có case)* | **covered** | `password` / `passwordHash` / `setupCompletedAt` / payload rỗng đều 404 + **0 hàng DB**; tổng số user không đổi sau 5 lần thử |
| UM-19 | *(chưa có case)* | **covered** | Admin không còn `createUser` / `CreateUserInput` / `useCreateUser`; Playwright bắt request xác nhận UI không gọi `POST /users` |
| UM-20 | UM-01 phủ gián tiếp | **covered** | lời mời vẫn tạo đúng 1 tài khoản pending; gửi kèm `password` → 400, 0 hàng DB |

**Tổng cập nhật:** nhóm E `covered` 15 → **19**; toàn ma trận `covered` 233 →
**237**. `partial` / `missing` / `blocked` / `n/a` không đổi.

**Không case nào bị hạ trạng thái** — luồng lời mời, đặt lại mật khẩu, đăng nhập,
refresh token và fixture `/api/test/*` giữ nguyên coverage.
