# Full-stack E2E tự động bằng Playwright (Admin + Frontend + Backend)

> **Ngày:** 2026-07-27
> **Nhóm:** 08 — Audits & Reports (chính: 06 Testing; phụ: 02 Architecture, 05 Reliability)
> **Trạng thái:** 🟡 **PASS có điều kiện — đã bị vượt qua một phần.** Hạ tầng E2E full-stack trong báo cáo này vẫn đúng và đang dùng. Nhưng khẳng định “toàn bộ chạy xanh” **chỉ đúng cho lần chạy cục bộ 82/82 tại thời điểm 2026-07-27**: khi CI thật chạy (`e2e-fullstack.yml`, sau khi bộ test mở rộng lên 112) kết quả là **109 passed · 1 failed · 2 flaky**. Xem đính chính và bản sửa ở [2026-07-29-e2e-ci-red-contrast-overflow-flake-fix.md](2026-07-29-e2e-ci-red-contrast-overflow-flake-fix.md) — sau bản sửa: **113/113, 0 fail, 0 flaky**.
> **Liên quan:** [testing-strategy.md](../../06-testing/testing-strategy.md) · [implementation-plan.md](../../04-implementation/implementation-plan.md) · [2026-07-29 — sửa CI đỏ](2026-07-29-e2e-ci-red-contrast-overflow-flake-fix.md)

## Phạm vi

Bổ sung **E2E trình duyệt thật (Playwright)** phủ các luồng full-stack mà trước đây chỉ có unit/integration ở backend: lời mời tài khoản, thiết lập tài khoản, đăng nhập/đăng xuất, quên/đặt lại mật khẩu, phân quyền vai trò, bảo mật quản lý tài khoản, form liên hệ công khai, nội dung công khai (DRAFT/PUBLISHED), quyền riêng tư token, accessibility, responsive; cùng **integration PostgreSQL thật** ở backend và **coverage** cho admin.

**Không dùng kết quả thủ công làm bằng chứng** — mọi khẳng định đến từ lệnh tự động.

## Kiến trúc test

- **Host E2E:** repo `thien-duc-website-admin` (`e2e/`, `playwright.config.ts`). Playwright 1.62 + `@axe-core/playwright` 4.12, Chromium.
- **Điều phối server:** `webServer` của Playwright tự dựng **Backend (3001) + Admin (5174) + Frontend (3000)** — chạy bằng một lệnh `npm run test:e2e`, không cần mở 3 terminal.
- **DB test cô lập:** `localhost:5432/thien_duc_test`. `globalSetup` có **cầu chì an toàn** (chỉ localhost + đúng `thien_duc_test`, chặn `render.com`) → `prisma migrate deploy` → `prisma db seed` (seed-e2e, 2 tài khoản). In metadata DB an toàn, KHÔNG in `DATABASE_URL` đầy đủ.
- **Transport email GIẢ:** `MailService` có nhánh capture gate bằng `NODE_ENV=test` **và** cờ tường minh `MAIL_FAKE_TRANSPORT=1` → ghi email vào `MailOutboxService` trong bộ nhớ thay vì gọi Resend. Ở production (không cờ) hành vi Resend **giữ nguyên**; route test không tồn tại.
- **Route hỗ trợ test (chặn cứng):** `TestSupportModule` chỉ nạp khi `NODE_ENV=test + MAIL_FAKE_TRANSPORT=1`, mọi route qua `TestOnlyGuard` (localhost). Gồm: đọc/xoá outbox + fail-mode; fixture user (`@e2e.test`); chẩn đoán trạng thái (vân tay passwordHash một chiều, đếm invitation/refresh); dọn lead liên hệ.
- **Bypass rate-limit chỉ trong E2E:** `E2eAwareThrottlerGuard` bỏ qua throttle khi (và chỉ khi) `NODE_ENV=test + MAIL_FAKE_TRANSPORT=1`. Production giữ nguyên throttle (login 5/phút, forgot 5/15′...).
- **Cô lập dữ liệu:** email fixture theo domain riêng `@e2e.test` (tách hẳn seed `@test.local`); ID/slug/lead có tem duy nhất mỗi lần chạy; dọn sau mỗi suite; `workers: 1` cho tất định.

## Lệnh Playwright

```bash
# Trong thien-duc-website-admin:
npm run test:e2e            # dựng 3 server + chạy toàn bộ spec (Chromium)
npm run test:e2e:report     # mở HTML report
```

## Luồng đã phủ (spec Playwright — 82 test, PASS)

| Spec | Test | Nội dung |
|---|---|---|
| `login.e2e.ts` (§6) | 16 | render logged-out, không có link đăng ký, quên mật khẩu, sai thông tin, pending/inactive không login, ADMIN/SUPER_ADMIN login, phiên persist, logout xoá token, redirect route bảo vệ, điều hướng theo vai trò, toggle mật khẩu chuột/bàn phím, Enter submit |
| `forgot-reset.e2e.ts` (§8) | 8 | email→link→đặt lại, token gỡ khỏi URL + vắng ở storage/cookie, không tự đăng nhập, mật khẩu cũ hỏng/mới đúng, phiên cũ thu hồi, link cũ vô hiệu, email không tồn tại/inactive/pending trung tính + KHÔNG gửi mail, validate khớp/độ dài, chống gửi lặp (cooldown), lỗi mạng không lộ tồn tại tài khoản |
| `invitation.e2e.ts` (§7) | 5 | tạo→thiết lập→đăng nhập→link cũ vô hiệu; payload không mật khẩu; pending hiển thị; token privacy; gửi lại (link cũ vô hiệu, link mới chạy); thu hồi; ADMIN/EDITOR không tạo/gửi lại/thu hồi (UI + API 403) |
| `user-management-security.e2e.ts` (§9) | 15 | UI/API không lộ mật khẩu; từ chối field cấm (400); leo thang quyền (403); nhãn trạng thái + ưu tiên disabled; phân quyền SUPER_ADMIN/ADMIN/EDITOR; bảo vệ route + back; privacy response; bảo vệ self-demote/disable/delete; toàn vẹn passwordHash/setup/lời mời |
| `contact.e2e.ts` (§10) | 9 | mở trang; validate bắt buộc/email/độ dài; gửi hợp lệ→UI thành công; lưu DB; email giả đúng người nhận; escape HTML; **giả lập lỗi provider→lead vẫn lưu, không email**; hợp đồng API; chống gửi trùng; lỗi backend an toàn không stack trace |
| `content.e2e.ts` (§11) | 8 | route VN/EN + locale; route công khai không lỗi; not-found; route admin vắng mặt; DRAFT ẩn/PUBLISHED hiện; banner từ CMS local; project endpoint; API/site URL là local không Render/Vercel |
| `token-privacy.e2e.ts` (§12) | 2 | token lời mời + đặt lại KHÔNG lọt URL/DOM/toast/storage/cookie/console toàn vòng đời |
| `accessibility.e2e.ts` (§13) | 9 | axe (WCAG2A/AA) admin login/forgot/reset/setup/users + frontend home/contact/news; một h1; nhãn input; nút toggle có tên khả truy cập; modal bẫy focus + Escape |
| `responsive.e2e.ts` (§14) | 10 | 3 viewport (375/768/1280) × admin (login/forgot/reset/setup/users) + frontend (home/contact): không tràn ngang, control chính hiện, điều hướng truy cập được, modal trong viewport |

## Integration PostgreSQL thật (backend Jest, 7 test — PASS)

`test/auth-integration.e2e-spec.ts` chạy với DB thật (không mock): nhận lời mời **tương tranh → đúng một thành công** (claim nguyên tử); đặt lại mật khẩu tương tranh → đúng một thành công; ràng buộc **unique tokenHash** lời mời + reset; **rollback giao dịch** (lỗi giữa chừng → không ghi phần nào); **cascade** xoá invitation/reset/refresh khi xoá user; **thu hồi refresh token** sau đặt lại + refresh cũ bị API từ chối (401).

## Kết quả accessibility

- **Vi phạm cấu trúc mức serious/critical (nhãn, ARIA, vai trò): KHÔNG có** — cổng axe chặn nhóm này, tất cả trang PASS.
- **`color-contrast` (serious): ĐÃ XỬ LÝ TRỌN VẸN ở M2** (xem mục dưới) — 0 vi phạm tương phản trên mọi trang đã test × 3 viewport. Rule KHÔNG bị tắt/loại trừ; nay là cổng CHẶN đầy đủ.
- axe chỉ bắt phần tự động — **không** khẳng định đạt chuẩn a11y toàn diện.

## M2 — Xử lý color-contrast (2026-07-27)

**Baseline (máy đọc, 3 viewport):** 94 findings, gom về **2 nguyên nhân gốc**:

1. **Brand `#b06613` chỉ đạt 4.41:1** (dưới 4.5) — trắng-trên-brand (nút), brand-trên-trắng/ấm (link, eyebrow). ~67 findings.
2. **`#faf4ed` trên `#c99248` = 2.5:1** — chữ trắng trên panel `bg-brand-soft`, chủ yếu ở **header top-strip dùng chung** (xuất hiện mọi trang) + vài panel section. ~27 findings.

**Sửa ở tầng token/idiom (không magic hex rải rác):**

- **`--color-brand: #b06613 → #9f5a0f`** (cả `admin/src/index.css` + `frontend/src/app/globals.css`) — cùng tông đồng, đậm hơn chút. Kết quả đo: trắng-trên-brand **4.42 → 5.33**, brand-trên-nền-ấm (#f6f3ee) **3.9x → 4.73**, brand-trên-trắng **4.41 → 5.33**. Viền focus (dùng chính brand) vẫn ≥ 3:1: **5.33** trên trắng, **3.31** trên sidebar espresso (WCAG 2.4.11 vẫn đạt). Literal `#b06613` ở focus/skip-link của `globals.css` cũng cập nhật theo.
- **`bg-brand-soft` + `text-white` → `bg-brand`** cho các panel chữ trắng: header top-strip (dùng chung), `home-contact-cta`, và cùng idiom ở `du-an`/`gioi-thieu`/`cong-ty-thanh-vien`. Trắng trên brand mới = 5.33:1. `brand-soft` giữ nguyên cho các dùng ĐÚNG (gradient trang trí, scrollbar, marker) — không đụng.

**Kiểm chứng tự động (không dùng ảnh chụp):** spec mới `e2e/admin/contrast.e2e.ts` chạy axe `color-contrast` ở **375/768/1280** trên toàn bộ trang admin (login/forgot/reset/setup/users) + frontend (home/contact/news + du-an/gioi-thieu/cong-ty) → **0 vi phạm**. Helper `expectNoSeriousA11y` bỏ loại trừ color-contrast → nay chặn đầy đủ. Bộ Playwright: **82 → 91** test.

**Giữ được ý nghĩa ngữ nghĩa:** brand vẫn là brand (đậm hơn chút), muted `slate` không đổi (vốn đã đạt), disabled/link/badge/focus giữ phân biệt, không "đen tuyền/trắng tinh". Không tắt/loại trừ/hạ mức bất kỳ rule axe nào.

## Kết quả responsive

Không tràn ngang + control chính hiển thị + điều hướng truy cập được ở cả 3 viewport cho các trang tới hạn; modal nằm gọn trong viewport mobile. (Không dùng ảnh chụp làm assertion duy nhất — kiểm bằng `scrollWidth`/bounding box.)

## Coverage (admin — Vitest v8)

`npm run test:coverage`. **Baseline:** lines/stmts 36.85% · branches 68.26% · funcs 40.84% (global thấp vì nhiều trang chưa có unit test — được phủ bởi E2E). File tới hạn luồng auth: **Login 90% · Forgot 91% · Reset 99% · AccountSetup 98% · user-status 100%**; API client (`auth.ts`/`client.ts`) + route protection phủ bởi E2E. Ngưỡng chống hồi quy đặt **dưới** baseline (lines 34 / funcs 38 / branches 64).

## CI

- **Backend `ci.yml`:** thêm `prisma validate`; job e2e chạy `migrate deploy` + seed + `test:e2e` (**gồm integration**, `e2e-setup.ts` bật `MAIL_FAKE_TRANSPORT=1`).
- **Admin `ci.yml`:** thêm `npm run test:coverage` (unit + coverage) cạnh lint + build.
- **Admin `e2e-fullstack.yml` (mới):** PostgreSQL 17 service (`thien_duc_test`), checkout 3 repo anh em, `.env` GIẢ, Playwright Chromium, chạy toàn bộ E2E + axe, **upload report/trace khi lỗi**. Dùng secret giả, user giả, URL local; không Resend/Cloudinary/Sentry/DB production.

## Bằng chứng chạy (cục bộ)

- Playwright: **82/82 PASS** (`npm run test:e2e`).
- Backend unit **298/298**, e2e+integration **15/15**, tsc sạch, lint 0 lỗi, build PASS.
- Admin unit **120/120**, coverage PASS ngưỡng, tsc sạch, lint 0 lỗi, build PASS.
- DB sau chạy: 2 tài khoản seed nguyên vẹn, **0** bản ghi `@e2e.test` sót, 0 lead/news/banner E2E sót.

## Giới hạn / còn lại

1. **`color-contrast`** — ⚠️ **ĐÍNH CHÍNH (2026-07-29).** Khẳng định “đã xử lý ở M2, 0 vi phạm, 3 viewport” **là sai**: nó đúng cho phạm vi trang đã quét tại thời điểm đó, nhưng khi bộ test mở rộng thì CI vẫn đỏ `color-contrast` ở huy hiệu “Đang hoạt động” (Admin → Tài khoản), và trang chủ vẫn còn vi phạm ở eyebrow CTA liên hệ. Cả hai **đã được sửa thật** ngày 2026-07-29 — xem [báo cáo sửa](2026-07-29-e2e-ci-red-contrast-overflow-flake-fix.md) (huy hiệu 4.723:1 → **7.80:1**; eyebrow 3.53:1 → **4.84:1**). Ngoài phạm vi test tự động vẫn nên rà thủ công; axe chỉ bắt phần tự động.
2. **CI full-stack + cross-repo** — YAML đã soạn nhưng **chưa chạy trên CI ở lần này** (không push; checkout cross-repo cần `WORKSPACE_TOKEN`). Bằng chứng hiện tại là **chạy cục bộ tự động**.
3. **Frontend orchestration** dùng `next dev` (không prerender lúc build) — nhanh khi lặp; production build có thể thêm sau nếu muốn kiểm SSG.
4. Refresh token của **tài khoản seed** tích lũy qua nhiều lần chạy (session, không phải rò rỉ `@e2e.test`) — vô hại trong DB test; có thể thêm bước dọn nếu cần.

## Xác nhận an toàn

Chỉ dùng `localhost:5432/thien_duc_test`; không chạm Render/Vercel; không gửi email Resend thật (transport giả); không Cloudinary; không Sentry; không dùng tài khoản/Gmail thật; không log token bản rõ; không commit secret/.env; **không manual testing làm bằng chứng**.
