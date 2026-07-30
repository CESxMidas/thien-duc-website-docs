# Audit chất lượng website cuối — Website Thiên Đức

> **Trạng thái:** Đang dùng · **Ngày:** 2026-07-30 · **Phiên:** `THIEN-DUC-FINAL-WEBSITE-QUALITY-AUDIT-M1`
> **Ma trận test-case kèm theo:** [2026-07-30-final-test-case-matrix.md](2026-07-30-final-test-case-matrix.md)
>
> **Kết luận: 🟠 PARTIALLY GREEN.** Không phải FULLY GREEN. Lý do nêu ở §Verdict.

## Phạm vi & nguyên tắc

Audit tự động toàn bộ chức năng đã triển khai, dựng lại **từ mã nguồn thật**
(controller, route, page, schema) và **file test thật**. Không kế thừa kết luận
của báo cáo trước — mọi số liệu dưới đây là lệnh chạy trong đợt này.

Toàn bộ chạy **cục bộ**: PostgreSQL `127.0.0.1:5432/thien_duc_test`, backend
`127.0.0.1:3001`, admin `127.0.0.1:5174`, frontend `127.0.0.1:3000`. Transport
email **GIẢ**. Không gọi Resend/Cloudinary/Sentry/Gmail. Không chạm DB
production. Không commit, không push.

## A. Executive summary

- **Chất lượng nền tảng cao.** 4 repo sạch, `tsc` sạch cả 3, lint **0 error**, 3
  build production xanh, và **842 test tự động** chạy xanh sau đợt này (703
  unit/integration + **139** Playwright). Hai lượt full-suite Playwright
  `--retries=0` đều **139/139**.
- **Tìm được 2 defect sản phẩm thật** ở tầng xử lý lỗi HTTP, cả hai đều **đã sửa
  + có test hồi quy**: vượt trần body trả **500 thay vì 413** (D1) và thiếu field
  song ngữ bắt buộc trả **500 (Prisma) thay vì 400** (D2, ảnh hưởng cả 4 module
  News/Projects/Pages/Banners + Cooperation).
- **Tìm được 1 defect test** làm **26 test Playwright không hề chạy** trong khi
  suite vẫn báo "112 passed" (D3): một khẳng định sai `login.status === 200`
  trong `beforeAll` (đúng là **201**). Đây là loại lỗi nguy hiểm nhất trong báo
  cáo test — nó **che mất** cả một file test khỏi kết quả.
- **Sửa D3 làm lộ ra defect test thứ hai (D4)** mà nó đang che: test bàn phím
  slider tin bấm phím vào một `<div>` **không focus được**, nên đỏ **6/6 lượt**
  (tất định, không phải flaky — xem đính chính ở §AF/§M). Sản phẩm **không** lỗi:
  bàn phím hoạt động đúng khi tiêu điểm ở nút điều khiển thật. Đã sửa, **26/26 ×
  5 lượt xanh**.
- **Còn 1 quan sát chập chờn chưa giải thích được** (`forgot-reset` "mật khẩu quá
  ngắn", đỏ 1 lần ở lượt baseline, không tái hiện được) → theo tiêu chí "0
  flaky", audit **không thể** gọi là FULLY GREEN.
- **Rủi ro bảo mật cao nhất là phụ thuộc, không phải mã nguồn**: Next.js
  **16.2.6** có **9 advisory** (3 High), trong đó một lỗi *middleware/proxy
  bypass cho App Router dùng single locale* — đúng kiến trúc `src/proxy.ts` của
  dự án. Bản sửa là **16.2.12** (patch, không phải major). **Chưa áp** — cần
  quyết định của chủ dự án (§AL).
- **Không có nội dung DRAFT/PENDING nào lộ ra public** — khẳng định ở 3 tầng test
  độc lập.

## B. Repository & branch status

Bốn repo độc lập, tất cả trên `main`, **working tree sạch trước khi audit** (không
có thay đổi lạ nào phải báo):

| Repo | Branch | Commit đầu phiên | Đồng bộ origin |
|---|---|---|---|
| `thien-duc-website-backend` | `main` | `0f729e0` | `## main...origin/main` (không lệch) |
| `thien-duc-website-admin` | `main` | `1d56b06` | `## main...origin/main` |
| `thien-duc-website-frontend` | `main` | `1690ea5` | `## main...origin/main` |
| `thien-duc-website-docs` | `main` | `f3bb77b` | `## main...origin/main` |

Ghi chú: thư mục workspace gốc có một `.git` **rỗng** (không phải repo) — vô hại,
nhưng `git status` ở gốc sẽ báo "not a git repository". Mỗi project là một repo
riêng.

Node cục bộ **v24.15.0**; CI dùng **Node 22** → lệch minor major giữa máy dev và
CI (không gây lỗi trong đợt này, ghi lại để biết).

## C. Environment & database safety

- `DATABASE_URL` → `host=localhost port=5432 database=thien_duc_test`. **Không**
  khớp bất kỳ host bị cấm nào (render.com, onrender.com, vercel.app, neon.tech,
  supabase.co, railway.app). Giá trị đầy đủ **không được in** ở bất kỳ đâu.
- Cầu chì an toàn **hai tầng**, đã đọc và xác nhận:
  `prisma/seed-e2e.js` (`assertLocalTestDatabase`) và
  `admin/e2e/helpers/backend-env.ts` (`assertSafeDatabase`) — cả hai chỉ cho
  `localhost`/`127.0.0.1` **và** đúng tên DB `thien_duc_test`, hủy **trước khi
  ghi**.
- Transport email giả gated bằng **AND hai điều kiện** `NODE_ENV=test` +
  `MAIL_FAKE_TRANSPORT=1` (`mail.service.ts` `onModuleInit`). Cả
  `backend/test/e2e-setup.ts` và `playwright.config.ts` đều đặt đủ hai cờ.
- ⚠️ **Lưu ý vận hành:** `backend/.env` cục bộ **có chứa** `RESEND_API_KEY`,
  `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` **thật**. Bộ E2E an toàn vì
  `playwright.config.ts` ghi đè các biến đó thành chuỗi rỗng cho tiến trình
  backend mà nó dựng, và transport giả chặn Resend ở tầng trên. Nhưng bất kỳ
  lệnh nào chạy backend **không** qua hai đường đó sẽ dùng credential thật —
  nên khuyến nghị tách `.env.e2e` riêng (§AL).

## D. Feature inventory

Dựng từ mã nguồn, không từ tài liệu.

**Backend — 14 controller / 13 module nghiệp vụ**: `auth` (9 route), `users` (14),
`news` (14), `projects` (21), `pages` (8), `banners` (7), `cooperation` (8),
`contact` (4), `media` (5), `search` (1), `app` (1), + 3 controller hỗ trợ test
(`test/contact`, `test/mail`, `test/users`) chặn cứng bằng `TestOnlyGuard`.

**Admin CMS — 17 trang / route**: `dang-nhap`, `thiet-lap-tai-khoan`,
`quen-mat-khau`, `dat-lai-mat-khau`, `403`, `/` (Dashboard), `du-an`, `tin-tuc`,
`trang`, `banner`, `du-an-hop-tac`, `lien-he`, `thu-vien`, `ho-so`, `duyet-ho-so`,
`tai-khoan`, `*` (NotFound).

**Frontend public — 13 route nội dung + 3 route hạ tầng**: `/`, `gioi-thieu`,
`cong-ty-thanh-vien`, `du-an`, `du-an/[slug]`, `du-an/[slug]/[hang-muc]`,
`tin-tuc`, `tin-tuc/[slug]`, `lien-he`, `tuyen-dung`, `dao-tao`,
`chinh-sach-nhan-su`, `so-do-to-chuc-cong-ty` + `robots.ts`, `sitemap.ts`,
`api/health` — mỗi route có bản `vi` và `en`.

## E. Test-case matrix summary

Chi tiết: [ma trận](2026-07-30-final-test-case-matrix.md). Tổng **295 case**:

| Trạng thái | Số case | Tỷ lệ |
|---|---|---|
| `covered` (có test tự động khẳng định) | 224 | 75,9% |
| `partial` | 39 | 13,2% |
| `missing` | 27 | 9,2% |
| `blocked` | 4 | 1,4% |
| `n/a` | 1 | 0,3% |

## F. Existing tests found

Trước đợt này: **33 suite / 359 test** backend unit · **2 suite / 16 test** backend
integration · **26 file / 146 test** admin Vitest · **12 suite / 123 test**
frontend Jest · **12 file** Playwright E2E.

## G. New tests added

| File | Loại | Số test |
|---|---|---|
| `backend/src/common/filters/http-exception.filter.spec.ts` | unit (mới) | 10 |
| `backend/src/common/dto/required-nested-text.spec.ts` | unit (mới) | 25 |
| `backend/test/http-foundation.e2e-spec.ts` | integration PostgreSQL thật (mới) | 24 |
| **Tổng test mới** | | **59** |

Sửa **2 defect test** trong `admin/e2e/public/news-slider-pagination.e2e.ts`:
D3 (khẳng định `login.status` sai — mở lại **26 test** vốn bị bỏ chạy âm thầm) và
D4 (test bàn phím nhắm vào phần tử không focus được — lộ ra sau khi sửa D3).

## H. Backend unit results

```
npm test  →  Test Suites: 35 passed, 35 total
             Tests:       394 passed, 394 total   (0 failed)
```
Trước đợt này: 33 suite / 359 test. Chênh lệch = 2 suite / 35 test mới.

## I. Backend E2E / integration results

```
npm run test:e2e  →  Test Suites: 3 passed, 3 total
                     Tests:       40 passed, 40 total   (0 failed)
```
Trước đợt này: 2 suite / 16 test. Chênh lệch = 1 suite / 24 test mới. Chạy trên
PostgreSQL 17 thật tại `localhost:5432/thien_duc_test`.

Pipeline Prisma: `prisma validate` ✅ · `generate` ✅ · `migrate deploy` ✅ (10
migration, **không** migration nào pending) · `db seed` ✅.

## J. Admin unit / component results

```
npm test           →  Test Files: 26 passed (26)
                      Tests:      146 passed (146)   (0 failed)
npm run test:coverage → ngưỡng PASS (xem §AE)
```

## K. Frontend unit results

```
npm test  →  Test Suites: 12 passed, 12 total
             Tests:       123 passed, 123 total   (0 failed)
```

## L. Playwright full-stack results

**Lượt baseline (trước sửa):**
```
112 passed · 2 failed · 25 did not run   (2.8m)
```
Hai lỗi: (1) `forgot-reset.e2e.ts:193` "validate: mật khẩu quá ngắn"; (2)
`news-slider-pagination.e2e.ts:108` — `beforeAll` đổ vì khẳng định
`login.status === 200` (thật là 201) → **kéo theo 25 test không chạy**.

⚠️ Chi tiết đáng lưu ý: lệnh chạy qua `| tail` nên **exit code bị `tail` che**,
báo 0 dù suite đỏ. Khi đo kết quả test, phải đọc dòng tổng kết chứ không tin exit
code của pipeline.

**Lượt sau khi sửa D3:**
```
138 passed · 1 failed · 0 skipped   (3.3m)   EXIT=1
```
Lỗi còn lại: test bàn phím slider tin — hoá ra **tất định** (D4), không phải
chập chờn (xem §M, §AF).

**Hai lượt cuối, sau khi sửa D4, `--retries=0`:**

| Lượt | passed | failed | flaky | skipped | thời lượng | exit |
|---|---|---|---|---|---|---|
| 1 | **139** | 0 | 0 | 0 | 2.8m | 0 |
| 2 | **139** | 0 | 0 | 0 | 2.9m | 0 |

Tổng số test Playwright: **113 → 139** (+26 test được mở lại nhờ sửa D3).

Ghi chú: `retries` cục bộ vốn đã là 0 (`retries: isCI ? 1 : 0`), và hai lượt trên
còn truyền `--retries=0` tường minh ⇒ **không có kết quả nào đến từ retry**.

## M. Repeated stability results

| Bộ test | Số lượt | Kết quả |
|---|---|---|
| `forgot-reset.e2e.ts` (8 test) | 3 | **3/3 xanh** (8/8 mỗi lượt) — lỗi ở lượt baseline không tái hiện được khi chạy riêng ⇒ **flaky**, phụ thuộc trạng thái/thứ tự khi chạy cả suite |
| `news-slider-pagination.e2e.ts` — **trước** sửa D4 | 6 | **0/6 xanh** (25 passed · 1 failed mỗi lượt) ⇒ **tất định**, không phải flaky |
| `news-slider-pagination.e2e.ts` — **sau** sửa D4 | 5 | **5/5 xanh** (26/26 mỗi lượt) |
| Full suite `--retries=0` | 2 | xem §L |

**Bài học phương pháp:** phân loại "flaky" chỉ được kết luận **sau khi chạy lặp**.
D4 thoạt trông như flake (đỏ 1 lần trong full-suite) nhưng chạy lặp cho thấy nó
đỏ 6/6 ⇒ tất định. Nếu tin vào lần quan sát đầu, bản sửa sẽ đi sai hướng hoàn
toàn (thêm cổng hydrate thay vì sửa mục tiêu tiêu điểm).

**Kết luận ổn định:** sau các bản sửa, **1 test đã quan sát thấy chập chờn** còn
tồn: `forgot-reset` "validate: mật khẩu quá ngắn" (đỏ 1 lần ở lượt baseline
full-suite, xanh 3/3 khi chạy riêng, xanh ở các lượt full-suite sau). **Chưa xác
định được nguyên nhân gốc** — chưa tái hiện lại được. Theo yêu cầu "0 failed / 0
flaky", một quan sát chập chờn chưa giải thích được là **đủ** để audit không phải
FULLY GREEN.

Không thêm `sleep`, không nới timeout, không bật retry để làm xanh bất kỳ test
nào trong đợt này.

## N. Authentication results

Phủ **đầy đủ** vòng đời (20/21 case `covered`, 1 `n/a`): đăng nhập 3 vai trò,
sai mật khẩu, email không tồn tại (**thông điệp trùng nhau** — chống dò tài
khoản), inactive, pending, khóa ở lần sai thứ 5 → **423**, hết hạn khóa, reset bộ
đếm sau khi đăng nhập thành công, xoay vòng refresh token, từ chối refresh đã
thu hồi/dùng lại, logout, logout-all, Back sau logout không lộ dữ liệu, nút
hiện/ẩn mật khẩu bằng chuột + Enter + Space.

Case `n/a`: cookie bảo mật — hệ thống **cố ý** dùng localStorage; "Auth
HttpOnly" đã được ghi hoãn sang post-launch trong `implementation-plan` §4.

Ghi nhận hợp đồng: `POST /api/auth/login` trả **201** (Nest mặc định cho POST,
controller không đặt `@HttpCode`). Ba nơi test đã khoá hợp đồng này.

## O. Invitation / account-setup results

17/17 case `covered`. Đáng chú ý: **nhận lời mời tương tranh** và **đặt lại mật
khẩu tương tranh** đều được khẳng định "đúng MỘT request thắng" bằng claim nguyên
tử trên PostgreSQL thật (`test/auth-integration.e2e-spec.ts`); `tokenHash`
unique; token bản rõ không bao giờ trả qua API thường; link cũ vô hiệu sau khi
gửi lại / thu hồi.

## P. User-management authorization results

16 case, 15 `covered` + 1 `missing`. Phân quyền được khẳng định **ở cả UI và
API** cho từng vai trò: SUPER_ADMIN toàn quyền; ADMIN read-only (không có nút
quản lý **và** API trả 403); EDITOR bị chặn về `/403` **và** API 403. Các bảo vệ
bổ sung đã có test: không mass-assign `setupCompletedAt`/`failedLoginAttempts`/
`lockedUntil`, `passwordHash` + mọi `tokenHash` không bao giờ lộ, leo thang vai
trò 403, SUPER_ADMIN **cuối cùng** không bị hạ quyền/khóa/xóa (và ngược lại:
SUPER_ADMIN *không phải cuối* vẫn hạ được — rule không chặn nhầm), tài khoản seed
nguyên vẹn sau toàn bộ thao tác.

`missing`: phân trang / filter / search của danh sách tài khoản (UM-15).

## Q. News workflow results

Luồng `DRAFT → PENDING → PUBLISHED` khớp "Option B" đã chốt: EDITOR chỉ gửi
duyệt, ADMIN/SUPER_ADMIN đặt trạng thái tùy ý, SUPER_ADMIN tạo là PUBLISHED
ngay. Chuyển trạng thái bị cấm → 403.

**Không lộ nội dung chưa đăng** — khẳng định độc lập ở **3 tầng**: integration
(`app.e2e-spec.ts`, `http-foundation.e2e-spec.ts`), API E2E và browser E2E
(`news-slider-pagination.e2e.ts`, `content.e2e.ts`). Đoán đúng slug cũng trả
404.

`missing`/`partial`: danh sách tin ở Admin (phân trang/sort/search/filter/
empty/error/loading) chưa có test riêng; **sanitize HTML nội dung rich chưa có
test nào** (defect D7).

## R. News slider & pagination results

Slider: 3/2/1 thẻ theo desktop/tablet/mobile, next/previous, ArrowLeft/Right,
nút vô hiệu ở biên, không thẻ trùng, không tràn ngang, a11y sạch. Phân trang:
trang 1/2/cuối, rỗng, `page=0`, page âm, page không phải số, page vượt trang
cuối, `limit` vượt trần → 400, URL là nguồn sự thật, refresh + Back/Forward giữ
trang, `aria-current` đúng, bản EN, phân trang mobile không tràn, **các trang
khác nhau không lặp bản ghi**, DRAFT/PENDING không lọt.

Một test bàn phím từng đỏ tất định vì nhắm sai phần tử tiêu điểm — đã sửa
(D4, §AF).

Kiểm hiệu năng liên quan: trang chủ **không** kéo cả kho tin — API tôn trọng
`limit`, và `limit` vượt trần bị 400.

## S. Banner results

15/16 case `covered`. API công khai chỉ lộ banner đang bật (Admin thấy cả banner
tắt); thứ tự tất định; không token thì không đọc/ghi route quản trị; phân quyền
create/update/reorder/delete = ADMIN+; nội dung VI/EN đầy đủ trên HTML thật; 4
slide mỗi ảnh đúng một lần, ảnh tải được, alt có nghĩa; route CTA mở được ở cả
hai locale; bàn phím + focus ring; `prefers-reduced-motion` tắt autoplay;
autoplay tạm dừng khi hover; responsive 3 viewport không clamp mất chữ; axe +
tương phản sạch; không lỗi console, không gọi dịch vụ production.

`missing`: reorder qua Admin UI (BN-16).

## T. Project results

Yếu nhất trong các module nội dung: 4 `covered` · 3 `partial` · 1 `missing`.
Service (lọc PUBLISHED, gallery cấp dự án, fallback ảnh) có unit test tốt, và
D2 nay chặn đúng 400. Nhưng ở tầng trình duyệt chỉ có kiểm "route trả status +
không lỗi console" và tương phản; **gallery bàn phím/touch/responsive chưa có
test** (PJ-06), breadcrumb/JSON-LD chỉ kiểm ở unit chứ chưa trên HTML render
thật.

## U. Contact-form results

11/13 `covered`. Điểm mạnh: thứ tự **lưu DB trước, gửi mail sau** được khẳng
định, và có test riêng cho "provider email lỗi → lead vẫn lưu, UI vẫn thành
công, không có email" (chế độ fail-mode của outbox giả). XSS payload được escape
trong email. Rate limit 5/IP/giờ. Lỗi backend hiển thị an toàn, không lộ stack.

`partial`: trang quản lý lead ở Admin (`ContactPage`) không có test riêng —
coverage 79% đến từ smoke test.

## V. Other CMS module results

Đây là vùng trắng lớn nhất: **Cooperation, Dashboard, Profile, ProfileRequests
đều 0% coverage đơn vị** và không có browser E2E. Pages/News categories/Search
chỉ `partial`. Media là module phụ duy nhất `covered` đầy đủ (gồm rule R1
"delete chỉ ADMIN+").

Phân quyền của các module này *có* được khoá bằng test metadata `@Roles` ở
backend, nên rủi ro phân quyền thấp; rủi ro nằm ở hành vi UI chưa được kiểm.

## W. Localization results

VI/EN hoạt động ở mọi route đã kiểm, đổi locale giữ đúng trang, phân trang giữ
locale + số trang, field song ngữ ở Admin lưu/nạp đúng, ngày giờ quy đổi UTC+7,
fallback khi thiếu bản dịch có test.

`missing` (LC-07): **không có test tự động nào khẳng định "không còn chữ Việt lọt
trang `/en`"** — đợt EN-SITE-WIDE trước làm thủ công. Rà chuỗi hardcode trong
mã nguồn cũng chưa được tự động hóa.

## X. Responsive results

Không phát hiện tràn ngang mới. Các trang tới hạn được kiểm ở **3 viewport**
(375×812 · 768×1024 · 1280×800): admin login/forgot/reset/setup, danh sách tài
khoản, modal, frontend trang chủ + liên hệ, banner, slider tin + phân trang.
Helper `e2e/helpers/layout.ts` chờ font + bố cục ổn định rồi mới đo và in đúng
phần tử gây tràn kèm bounding box khi đỏ.

**Chưa phủ (RS-07):** 320×568 · 360×800 · 390×844 · 1024×768 · 1440×900 — 5 trong
8 viewport mà phạm vi audit yêu cầu. **Chưa phủ (RS-08):** form
news/projects/banners/contacts của Admin ở mobile.

Không dùng `overflow-x: hidden` toàn cục để che defect ở bất kỳ đâu.

## Y. Accessibility results

Trong **phạm vi đã kiểm**: **0 vi phạm serious**, **0 vi phạm critical**, **0 vi
phạm color-contrast**. axe chạy với rule WCAG 2A + 2AA, **không tắt/loại trừ/hạ
mức rule nào**.

Phạm vi đã kiểm = admin (login, forgot, reset, setup, users) + frontend (home,
contact, news, du-an, gioi-thieu, cong-ty) × 3 viewport, cộng khối banner VI/EN.
Có thêm test hồi quy đo trực tiếp huy hiệu "Đang hoạt động" (đòi ≥ 6:1, viền
≥ 3:1, `transition-duration: 0s`).

Hành vi thủ công đã tự động hóa: modal bẫy focus + Escape + focus quay về
trigger, carousel bàn phím + focus ring, semantics phân trang + `aria-current`,
nhãn form, tên khả truy cập của nút/link, `prefers-reduced-motion`.

**Hạn chế phải nói rõ:**
- **Chưa** kiểm axe cho `tuyen-dung`, `dao-tao`, `chinh-sach-nhan-su`,
  `so-do-to-chuc-cong-ty`, `tin-tuc/[slug]`, `du-an/[slug]`,
  `du-an/[slug]/[hang-muc]`, và phần lớn trang Admin (news/projects/banners/
  contacts/media/profile).
- **Chưa** có test "Skip to content" (A1-12).
- "Đúng một `h1`" chỉ kiểm ở 4 trang.
- axe **không** phát hiện được mọi vấn đề a11y (thứ tự đọc, nhãn có nghĩa thật,
  trải nghiệm screen-reader). **Đây KHÔNG phải chứng nhận WCAG.**

## Z. Security results

**Đã khẳng định bằng test:** 401 cho API bảo vệ, 403 cho vai trò không đủ quyền
(cả UI và API), điều hướng URL trực tiếp bị chặn, leo thang vai trò bị từ chối,
field lạ + mass assignment bị chặn 400, JSON dị dạng → 400, content-type lạ →
400, payload quá lớn → **413** (sau D1), password/`passwordHash`/mọi `tokenHash`
không lộ, token bản rõ không lọt log/DOM/storage/console/URL, CORS bắt buộc
không wildcard, security header (helmet + `vercel.json`), thông điệp lỗi không
lộ nội bộ (không stack, không đường dẫn file, không dấu vết Prisma), route hỗ trợ
test chặn cứng localhost + `@e2e.test`.

**Khoảng trống bảo mật (chưa có test):**
- **SC-09/SC-10 — URL scheme độc hại (`javascript:`, `data:`) và sanitize nội
  dung rich.** Đây là khoảng trống rủi ro cao nhất về mã nguồn: `href` của banner
  và nội dung bài viết do người dùng CMS nhập, chưa có test nào chứng minh chúng
  được làm sạch. Xem D7.
- SC-18 — cache-control cho response bảo vệ.
- SC-06/SC-08/SC-17 chỉ `partial` (SQL injection, path traversal, IDOR).

### Dependencies (`npm audit`)

| Repo | Tổng | Production-only |
|---|---|---|
| backend | 6 (2 high · 4 moderate) | 5 (1 high · 4 moderate) |
| admin | 16 (2 critical · 11 high · 3 moderate) | **2 high** |
| frontend | 32 (32 high) | **5 high** |

Phần lớn là **dev-only** (eslint, jest, vitest, vite, esbuild) — không đi vào
bundle production.

**Đáng chú ý ở production:**
- **frontend `next@16.2.6` → 9 advisory (3 High).** Gồm *Middleware/Proxy bypass
  in App Router applications using Turbopack and single locale* — trùng đúng
  kiến trúc `src/proxy.ts` (rewrite locale) của dự án — cùng SSRF trong Server
  Actions, SSRF qua rewrites, DoS Server Actions, cache confusion. Bản sửa
  **16.2.12** (patch trong 16.2.x, `isSemVerMajor: false`).
- frontend `sharp <0.35.0` (libvips CVE) và `postcss <=8.5.17` (path traversal
  đọc file `.map`) — cùng được kéo theo bởi bản Next.
- admin `react-router` / `react-router-dom` high — advisory là *RSC Mode CSRF
  Bypass*; admin là SPA **không** dùng RSC mode ⇒ khả năng khai thác thấp, vẫn
  nên nâng.
- backend `prisma` CLI đang nằm ở **`dependencies`** (không phải
  `devDependencies`), nên `@prisma/dev` + `@hono/node-server` bị tính là lỗ hổng
  *production*. Đây là vấn đề đóng gói, không phải lỗ hổng runtime thật.

**Không tự nâng bất kỳ dependency nào** trong đợt này — nâng framework sẽ vô hiệu
hóa toàn bộ bằng chứng test vừa thu, và thuộc loại việc cần chủ dự án quyết.

## AA. SEO results

Hàm dựng metadata có unit test tốt (`lib/seo.test.ts`): title, description,
canonical, hreflang, JSON-LD Organization/NewsArticle/BreadcrumbList, Open
Graph/Twitter, và `noindex` cho trang placeholder.

**Hạn chế lớn:** hầu hết SEO **chỉ được kiểm ở tầng unit trên hàm dựng**, chưa
có test nào đọc **HTML render thật** của các route công khai để khẳng định thẻ
`<title>`/`<meta>`/`<link rel=canonical>`/`hreflang`/JSON-LD xuất hiện đúng và
không trùng lặp (SE-06). Canonical cho trang phân trang cũng chưa được kiểm
(SE-07). Vì vậy §AA chỉ ở mức **partially verified**.

Không phát minh structured data nào không có dữ liệu nghiệp vụ thật đỡ lưng.

## AB. Performance / runtime results

**Đã khẳng định:** không lỗi console ở trang chủ và các route công khai đã kiểm;
trang chủ **không** fetch cả kho tin; trần `limit` của API phân trang chặn 400;
thứ tự DB tất định (news + banners); 3 build production xanh — **frontend chỉ xanh
khi backend đang chạy**, xem D10.

**Chưa làm:**
- **Lighthouse: KHÔNG chạy trong đợt này** (`blocked`). Repo không định nghĩa
  ngưỡng Lighthouse nào nên không có tiêu chí đỗ/trượt; §AB không kết luận gì về
  điểm số.
- Rò rỉ bộ nhớ khi điều hướng lặp: chưa kiểm.
- Cảnh báo hydration / duplicate React key: chỉ phủ *gián tiếp* qua kiểm lỗi
  console.

**Phát hiện phụ (D8, Low):** log `next dev` trong lúc chạy E2E in cảnh báo lặp:
`Image with src "/images/projects/hung-phu/location/hung-phu-location-map-base.png"
is using quality "100" which is not configured in images.qualities [75, 90]`.
Ảnh vẫn hiện; đây là cấu hình lệch giữa `next.config.ts` và chỗ dùng `<Image
quality={100}>`.

## AC. Database integrity & cleanup

- `prisma validate` / `generate` / `migrate deploy` sạch; **10 migration**, không
  có migration pending.
- **Seed idempotent — kiểm trực tiếp:** chạy `npx prisma db seed` **hai lần liên
  tiếp**, sau đó đếm bằng SQL: `[{"role":"ADMIN","n":1},{"role":"SUPER_ADMIN","n":1}]`
  ⇒ đúng **2 tài khoản seed**, đúng vai trò, **không nhân bản**.
- **Dọn dữ liệu test:** `SELECT count(*) FROM users WHERE email LIKE '%@e2e.test'`
  → **0**. Không còn dữ liệu fixture sót lại.
- Transaction rollback, unique constraint (`tokenHash`), cascade delete theo
  User, và hai luồng tương tranh (nhận lời mời / đặt lại mật khẩu) đều có test
  integration trên PostgreSQL thật.
- Cầu chì "không phải DB cục bộ thì hủy" có ở cả seed và tầng E2E.
- **Không** chạy `migrate reset` hay bất kỳ lệnh phá hủy nào.

## AD. CI validation

Bốn workflow, YAML đọc + parse được: `backend/ci.yml`, `admin/ci.yml`,
`frontend/ci.yml`, `admin/e2e-fullstack.yml`.

`e2e-fullstack.yml` đạt **13/14** tiêu chí kiểm: Node 22 · `npm ci` · service
PostgreSQL 17 kèm health-check `pg_isready` · `prisma validate/generate/migrate
deploy/db seed` tách thành bước riêng · kiểm vai trò tài khoản bootstrap phải là
ADMIN · secret **toàn giá trị GIẢ**, `RESEND_API_KEY`/`CLOUDINARY_*`/`SENTRY_DSN`
để rỗng · cổng tường minh + `--strictPort` + `127.0.0.1` · frontend health route
+ bước làm nóng trang chủ · vòng lặp thử lại **có giới hạn** (không sleep cố
định) · in log đúng service khi lỗi · `DEBUG=pw:webserver` · upload
`playwright-report` + `test-results` khi lỗi · checkout cross-repo qua
`WORKSPACE_TOKEN` · **không** trigger deploy, **không** credential production.

Grep toàn bộ workflow: **không** `continue-on-error`, **không** `|| true`,
**không** lệnh test nào bị skip.

`frontend/ci.yml` **thiếu một điểm quan trọng**: chạy `npm run build` mà không
`.env` / `NEXT_PUBLIC_API_URL` / backend, nên bước build của CI **không kiểm được
prerender phụ thuộc backend** — xem **D10** (§AG).

⚠️ **CI-14 `blocked`: KHÔNG có bằng chứng lượt chạy GitHub Actions thật.** Audit
này chạy hoàn toàn cục bộ và **không commit/push**, nên **không được phép kết
luận "CI xanh"**. Cấu hình CI *validate được*; kết quả CI *chưa có bằng chứng*.

## AE. Coverage

Admin (Vitest + v8), `npm run test:coverage`:

| Chỉ số | Đo được | Ngưỡng | Kết quả |
|---|---|---|---|
| Statements | 43,28% | 34% | PASS |
| Branches | 71,42% | 64% | PASS |
| Functions | 45,76% | 38% | PASS |
| Lines | 43,28% | 34% | PASS |

**Không hạ ngưỡng nào.** Ngưỡng vốn được đặt *dưới* baseline một cách có chủ ý —
chúng chỉ để chống hồi quy, không phải mục tiêu chất lượng.

**Vùng tới hạn — phủ tốt (90–100%):** `ResetPasswordPage` 99,43% ·
`AccountSetupPage` 97,67% · `ForgotPasswordPage` 90,75% · `LoginPage` 90,26% ·
`UserFormDialog` 92,94% · `user-status.ts` / `roles.ts` / `jwt.ts` / `labels.ts`
/ `bilingual.ts` / `long-form-content.ts` / cả hai `*-error-message.ts` = 100%.

**Vùng tới hạn — phủ kém, nhánh chưa test:**
- `src/lib/api/` **5,1%** — `queries.ts` 0% (502 dòng), `client.ts` **17,14%**,
  `auth.ts` 0% (240 dòng), `news.ts`/`projects.ts`/`users.ts`/`pages.ts`/
  `banners.ts`/`contact.ts`/`cooperation.ts` đều 0%. Nhánh chưa phủ đáng lo nhất
  là **tự `/auth/refresh` khi gặp 401** và xử lý lỗi mạng trong `client.ts` —
  chúng chỉ được phủ *gián tiếp* qua Playwright.
- Trang 0%: `CooperationPage` (290 dòng), `ProfilePage` (322), `ProfileRequestsPage`
  (245), `DashboardPage` (198), `NotFoundPage`, `ForbiddenPage`.
- `NewsPage` 45,66% · `PagesPage` 44,07% · `ProjectsPage` 63,5% — nhánh
  functions rất thấp (7–12%).

Backend/frontend: repo **không** cấu hình ngưỡng coverage; không đo trong đợt này
(`test:cov` có sẵn ở backend nhưng không có ngưỡng để đối chiếu).

Không thêm assertion vô nghĩa để đẩy số coverage.

## AF. Product defects found and fixed

### D1 — Vượt trần body JSON trả 500 thay vì 413 · **High** · Product

- **Module:** `backend/src/common/filters/http-exception.filter.ts`
- **Tái hiện:** `POST /api/auth/login` với body JSON ~3 MB (trần là 2 MB).
- **Trước:** `500 {"code":"INTERNAL_SERVER_ERROR","message":"Internal server error"}`
- **Nguyên nhân gốc (đã chứng minh):** lỗi body-parser của Express
  (`PayloadTooLargeError`, `type: entity.too.large`) **không** phải
  `HttpException`, nên filter `@Catch()` đưa nó vào nhánh 500 chung — đồng thời
  gọi `Sentry.captureException` cho một lỗi phía **client**.
- **Tác động:** client không phân biệt được "nội dung của bạn quá lớn" với
  "server hỏng" (trực tiếp trái với ý định ghi trong `common/body-limit.ts`, nơi
  nói rõ hành vi mong đợi là 413); thêm nữa là nhiễu Sentry và thống kê lỗi 5xx
  sai lệch.
- **Tác động bảo mật:** thấp; không lộ dữ liệu.
- **Bản sửa:** thêm `clientErrorStatus()` — lỗi middleware mang `status`/
  `statusCode` **4xx** được trả đúng mã đó, kèm thông điệp an toàn và
  `details: null`, **không** báo Sentry. **Chỉ nhận 4xx**: lỗi mang `status` 5xx
  vẫn đi đường 500 + Sentry, nên không thể mượn đường này để tắt cảnh báo.
- **Test hồi quy:** `http-exception.filter.spec.ts` (10 test) +
  `http-foundation.e2e-spec.ts` case "D1".
- **Kiểm chứng:** `413 {"code":"PAYLOAD_TOO_LARGE","message":"Nội dung gửi lên
  vượt quá dung lượng cho phép.","details":null}` trên backend build thật.

### D2 — Thiếu field song ngữ bắt buộc trả 500 (Prisma) thay vì 400 · **High** · Product

- **Module:** DTO create của `news`, `projects`, `pages`, `banners`,
  `cooperation`, `news-category`, `project-item`.
- **Tái hiện:** `POST /api/news` với `{slug, summary}` (thiếu `title`).
- **Trước:** `500 Internal server error`; log backend:
  `PrismaClientValidationError: Argument \`title\` is missing`.
- **Nguyên nhân gốc (đã chứng minh):** `@ValidateNested()` **một mình không chặn
  `undefined`** — class-validator bỏ qua giá trị undefined, DTO lọt qua
  `ValidationPipe`, rồi Prisma mới ném. Ban đầu tưởng chỉ ảnh hưởng `news` (vì
  các DTO khác có field scalar bắt buộc khác đổ trước, *che* mất lỗi); sau khi
  gửi payload đủ mọi scalar bắt buộc và chỉ bỏ field song ngữ thì **cả
  `projects`, `pages`, `banners` đều 500** ⇒ khuyết điểm mang tính hệ thống.
- **Tác động:** một payload sai của client bị báo là lỗi **server**; API tự
  thống kê sai 5xx; Sentry bị bắn nhiễu; client không nhận được thông tin field
  nào sai.
- **Tác động bảo mật:** thấp — response đã bị filter làm sạch nên **không** lộ
  chi tiết Prisma ra ngoài (đã có test khẳng định).
- **Bản sửa:** thêm `@IsDefined()` cho 14 field song ngữ bắt buộc trên 7 DTO
  (+21 dòng, không xóa dòng nào). Đây là bản sửa **siết** validation, không nới.
- **Kiểm chứng đặc biệt quan trọng:** `Update*Dto` dùng `PartialType` nên
  `@IsOptional()` được áp cho mọi field ⇒ **PATCH từng phần không bị siết theo**.
  Có test riêng khẳng định điều này (payload rỗng vẫn hợp lệ; chỉ gửi `title`
  vẫn hợp lệ; nhưng sai **kiểu** vẫn bị chặn).
- **Test hồi quy:** `required-nested-text.spec.ts` (25 test) +
  `http-foundation.e2e-spec.ts` nhóm "D2" (5 module).
- **Kiểm chứng:** cả 4 module trả `400 ["title should not be null or undefined"]`;
  log backend **0** `PrismaClientValidationError`; happy path nguyên vẹn (create
  201, PATCH từng phần 200, slug trùng 409).

### D3 — Khẳng định sai làm 26 test Playwright bị bỏ chạy âm thầm · **High** · Test-only

- **Module:** `admin/e2e/public/news-slider-pagination.e2e.ts:86`
- **Nguyên nhân gốc:** `expect(login.status).toBe(200)` trong `test.beforeAll`,
  nhưng `POST /auth/login` trả **201**. `beforeAll` đổ ⇒ 1 failed + **25 did not
  run**.
- **Tác động:** toàn bộ test phân trang/slider tin **không hề chạy**, trong khi
  dòng tổng kết vẫn đọc là "112 passed" — một khoảng trống kiểm thử bị che.
- **Bản sửa:** đổi sang `toBe(201)` kèm chú thích nêu rõ hợp đồng và ba nơi đã
  khoá nó.
- **Kiểm chứng:** số test chạy 113 → **139**; số test đỗ 112 → **138**.

### D4 — Test bàn phím slider tin bấm phím vào phần tử KHÔNG focus được · **High** · Test-only

- **Module:** `admin/e2e/public/news-slider-pagination.e2e.ts` —
  "ArrowRight/ArrowLeft điều khiển được bằng bàn phím".
- **Cách phát hiện:** đây là **lỗi thứ hai bị D3 che**. Vì `beforeAll` đổ, test
  này chưa từng chạy; sửa D3 xong nó mới lộ ra.
- **Đính chính quan trọng:** ban đầu tôi phân loại là *chập chờn* (đỏ 1 lần
  trong full-suite). Chạy lặp riêng cho thấy nó đỏ **6/6 lượt** ⇒ **tất định**,
  KHÔNG phải flaky. Giả thuyết "cổng hydrate" ban đầu là **sai**.
- **Nguyên nhân gốc (đo trực tiếp bằng probe trong trình duyệt):**
  `handleKeyDown` gắn trên `<div role="group">` của `NewsSlider`, nhưng div đó
  **không có `tabindex`** → `tabIndex: -1`, `hasTabIndexAttr: false` ⇒ **không
  focus được**. `locator.press()` của Playwright `focus()` trước khi bấm; focus
  thất bại nên tiêu điểm rơi về **`BODY`**, phím vào `document.body` và **không
  nổi bọt** tới div (body không phải con của div) → slider đứng yên.
- **Sản phẩm KHÔNG lỗi** — probe khẳng định cả ba điều: (A) press vào container
  → *không* đổi slide; (B) focus **nút next thật** rồi ArrowRight → **đổi
  slide**; (C) click chuột → đổi slide. Đường bàn phím thật của người dùng là Tab
  tới nút prev/next hoặc chấm tròn (đều là `<button>`) rồi bấm mũi tên — sự kiện
  nổi bọt từ button lên div và handler nhận được. Đã loại trừ giả thuyết dữ
  liệu: `PUBLISHED_COUNT = 11` ⇒ `maxIndex = 8 > 0`, slider luôn tương tác được.
- **Bản sửa:** đặt tiêu điểm lên `news-slider-next` (khẳng định `toBeFocused()`)
  rồi mới `keyboard.press` — **đúng khuôn** test bàn phím banner đang dùng
  (focus `dot(0)` trước khi bấm). Vẫn khẳng định đủ cả ArrowRight (đổi thẻ) và
  ArrowLeft (quay lại đúng thẻ ban đầu), **không** làm yếu assertion nào.
- **Kiểm chứng:** **26/26 test, 5/5 lượt xanh** (trước đó 25 passed · 1 failed ở
  6/6 lượt).
- **Khuyến nghị đi kèm (không tự sửa):** cân nhắc thêm `tabIndex={0}` cho
  container `role="group"` của `NewsSlider` để chính vùng carousel cũng nhận được
  tiêu điểm — cải thiện a11y, nhưng là thay đổi mã sản phẩm nên để chủ dự án
  quyết (§AL).

## AG. Remaining defects

### D5 — Tiêu đề rỗng / chỉ có khoảng trắng được chấp nhận · **Medium** · Product · CHƯA SỬA

`POST /api/news` với `title: {vi: ""}` hoặc `title: {vi: "   "}` trả **201**.
`TranslatedTextDto.vi` chỉ có `@IsString()` + `@MaxLength()`, không có
`@IsNotEmpty()`/`@Matches`. Hệ quả: tạo được bài có tiêu đề trắng, render ra
trang công khai thành khoảng trống.

**Không tự sửa** — đây là **thay đổi quy tắc nghiệp vụ** (nội dung tối thiểu),
áp dụng cho *mọi* field song ngữ của *mọi* module và có thể làm nội dung đang tồn
tại không lưu lại được. Cần quyết định của chủ dự án. Khác D2 ở chỗ: D2 là
**ánh xạ lỗi sai** (500 đáng lẽ 400), còn D5 là **chính sách nội dung**.

### D6 — Không có `@ArrayMaxSize` cho `content[]` · **Low** · Product · CHƯA SỬA

`POST /api/news` với `content` gồm **5.000 đoạn** trả 201. Chỉ bị chặn gián tiếp
bởi trần body 2 MB. Nên có trần số đoạn tường minh; là quyết định về giới hạn
nghiệp vụ nên chưa tự đặt.

### D7 — Không có test cho sanitize nội dung rich & URL scheme độc hại · **High (rủi ro kiểm thử)** · CHƯA SỬA

Không có test tự động nào chứng minh nội dung bài viết và `href` banner được làm
sạch trước khi render, cũng không có test cho `javascript:` / `data:`. Đây là
**khoảng trống kiểm thử**, không phải lỗ hổng đã được chứng minh — audit này
**không** khẳng định có hay không có XSS. Cần một đợt riêng để xác định và phủ.

### D8 — `images.qualities` lệch cấu hình · **Low** · Product · CHƯA SỬA

Xem §AB. `<Image quality={100}>` trong khi `next.config.ts` khai
`images.qualities: [75, 90]` → cảnh báo lặp trong log dev.

### D9 — 8 lint warning tồn đọng ở backend · **Low** · Code quality · CHƯA SỬA

`npx eslint` backend: **0 error, 8 warning** (`no-unsafe-assignment`) — 1 ở
`media/cloudinary.service.ts`, 7 ở `users/users.service.spec.ts`. Trái với chuẩn
"0 lỗi, 0 warning" mà `AGENTS.md` tự đặt. Đều là **dòng cũ**, không thuộc thay
đổi của đợt này (số warning trước và sau đợt này **không đổi**: 8). Admin cũng
còn 1 warning cũ ở `ui/form.tsx`.

⚠️ Ghi chú quy trình: `backend/package.json` đặt `"lint": "eslint … --fix"` —
tức lệnh lint mặc định **ghi vào file**. Trong đợt audit này tôi chạy `eslint`
**không** `--fix` để không sửa file ngoài phạm vi; chỉ dùng `--fix` **giới hạn
đúng 4 file mới/đã sửa** của mình.

### D10 — CI frontend build KHÔNG kiểm được prerender phụ thuộc backend · **Medium** · CI/Environment · CHƯA SỬA

- **Tái hiện (đo được cả 3 nhánh):**
  - `npm run build` với `.env` cục bộ trỏ `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
    và **backend TẮT** → **build đổ hẳn**, `exit 1`:
    `[TypeError: fetch failed] ECONNREFUSED` → `Failed to collect page data for
    /[locale]/tin-tuc/[slug]`.
  - Cùng lệnh với **backend BẬT** → `exit 0`, prerender đủ (SSG cho
    `tin-tuc/[slug]`, các trang dự án…).
  - Với `NEXT_PUBLIC_API_URL=` (rỗng) và **không** backend → `exit 0`, nhưng
    `generateStaticParams` không lấy được gì nên **không prerender dữ liệu thật**.
- **Vấn đề:** `frontend/.github/workflows/ci.yml` chạy `npm run build` **không**
  tạo `.env`, **không** đặt `NEXT_PUBLIC_API_URL`, **không** dựng backend ⇒ CI
  luôn đi đúng nhánh thứ ba. Nghĩa là: (a) CI **không bao giờ** kiểm được việc
  prerender các route phụ thuộc backend; (b) một lỗi build thuộc lớp này **không
  bị CI bắt**.
- **Rủi ro triển khai thật (đáng lưu ý nhất):** build trên Vercel **có** đặt
  `NEXT_PUBLIC_API_URL`. Backend đang ở **Render Free — ngủ sau 15 phút không
  hoạt động** (đã ghi ở `implementation-plan` §3, mục ED-08). Nếu backend đang ngủ
  hoặc chậm dậy lúc Vercel build, build sẽ đi đúng nhánh thứ nhất và **đổ hẳn**.
- **Không tự sửa** vì thuộc chính sách CI/deploy. Khuyến nghị ở §AL.

## AH. Blocked tests

| ID | Case | Lý do bị chặn |
|---|---|---|
| BE-F21 | Log request không lộ credential/token | Cần soi log runtime; bộ test hiện tại không tự động hóa được |
| PF-07 | Lighthouse home/news/project/contact | Không chạy trong đợt này; repo không định nghĩa ngưỡng |
| CI-14 | Bằng chứng lượt chạy CI thật | Audit chạy cục bộ, không commit/push |
| AU-21 | Cookie bảo mật | `n/a` — thiết kế dùng localStorage, HttpOnly đã hoãn post-launch |

## AI. Files changed by repository

### `thien-duc-website-backend` (10 file)

Sửa (mã sản phẩm — tổng **+23 dòng**, 0 dòng bị xóa):
- `src/common/filters/http-exception.filter.ts` — bản sửa D1.
- `src/banners/dto/create-banner.dto.ts` — D2 (+2)
- `src/cooperation/dto/create-cooperation-project.dto.ts` — D2 (+7)
- `src/news/dto/create-news-category.dto.ts` — D2 (+2)
- `src/news/dto/create-news-post.dto.ts` — D2 (+3)
- `src/pages/dto/create-page.dto.ts` — D2 (+2)
- `src/projects/dto/create-project-item.dto.ts` — D2 (+2)
- `src/projects/dto/create-project.dto.ts` — D2 (+3)

Thêm (test):
- `src/common/filters/http-exception.filter.spec.ts` (10 test)
- `src/common/dto/required-nested-text.spec.ts` (25 test)
- `test/http-foundation.e2e-spec.ts` (24 test)

### `thien-duc-website-admin` (1 file)

- `e2e/public/news-slider-pagination.e2e.ts` — bản sửa **D3** (1 khẳng định +
  chú thích) và **D4** (đặt tiêu điểm lên nút điều khiển thật trước khi bấm phím
  + chú thích nêu bằng chứng đo được).

### `thien-duc-website-frontend` (0 file)

Không đổi file nào.

### `thien-duc-website-docs` (3 file)

- `docs/08-audits-and-reports/current/2026-07-30-final-test-case-matrix.md` (mới)
- `docs/08-audits-and-reports/current/2026-07-30-final-website-quality-audit.md` (mới, file này)
- `docs/08-audits-and-reports/README.md` — thêm 2 dòng index
- `docs/04-implementation/implementation-plan.md` — ghi ledger §7

**Không** sửa file nào ngoài phạm vi. **Không** chạm `archive/`.

## AJ. Documentation changes

Ba việc: (1) ma trận test-case cuối; (2) báo cáo này; (3) cập nhật
`implementation-plan.md` §7 + index `08-audits-and-reports/README.md`.

## AK. Final readiness verdict

### 🟠 PARTIALLY GREEN

Đạt: backend unit 394/394 · backend integration 40/40 · admin 146/146 ·
frontend 123/123 · `tsc` sạch cả 3 repo · lint **0 error** · 3 build production
xanh · axe 0 serious/critical/contrast **trong phạm vi đã kiểm** · responsive
không tràn ngang ở các trang tới hạn **trong 3 viewport đã kiểm** · không lộ
DRAFT/PENDING · phân quyền enforced ở **cả** UI và API · không rò token/secret ·
DB dọn sạch · cấu hình CI validate được · coverage vượt mọi ngưỡng.

**Không** đạt FULLY GREEN vì:

1. **Playwright chưa đạt "0 flaky"** — còn **1 quan sát chập chờn chưa giải
   thích được** (`forgot-reset` "mật khẩu quá ngắn", đỏ 1 lần ở lượt baseline
   full-suite, không tái hiện được qua 3 lượt chạy riêng).
2. **Không có bằng chứng CI xanh** — audit chạy cục bộ, không push (CI-14).
3. **27 case chưa có test**, gồm khoảng trống rủi ro cao **D7** (sanitize rich
   content / URL scheme độc hại).
4. **Lighthouse không chạy** (PF-07); **5/8 viewport** yêu cầu chưa kiểm
   (RS-07); axe chưa phủ nhiều route (§Y).
4b. **D10** — bước build của CI frontend không kiểm được prerender phụ thuộc
   backend, và build production **đổ hẳn** nếu backend không phản hồi (rủi ro
   thật với Render Free ngủ sau 15′).
5. **`next@16.2.6` còn 9 advisory (3 High)** chưa vá, một cái trùng đúng kiến
   trúc proxy locale của dự án.
6. Còn **D5/D6/D8/D9** chưa sửa (đều Low–Medium, đã nêu lý do không tự sửa).

Báo cáo này **không** khẳng định: tuân thủ WCAG đầy đủ · đã pentest · sẵn sàng
production · CI xanh · không còn rủi ro bảo mật.

Lưu ý độc lập: cổng go-live vẫn **BLOCKED/DEFERRED** vì hạ tầng (plan trả phí,
backup/PITR, monitoring) theo `implementation-plan` §3 — nằm ngoài phạm vi audit
tự động này.

## AL. Recommended next actions

**Ưu tiên 1 — bảo mật phụ thuộc (cần quyết định):**
1. Nâng `next` **16.2.6 → 16.2.12** (patch, `isSemVerMajor: false`) rồi chạy lại
   toàn bộ: `tsc`, lint, `jest`, `next build`, và **toàn bộ Playwright**. Kéo
   theo bản vá `sharp` + `postcss`. Ưu tiên vì có advisory *middleware/proxy
   bypass* trùng đúng kiến trúc `src/proxy.ts`.
2. Nâng `react-router-dom` ở admin (khả năng khai thác thấp — không dùng RSC
   mode — nhưng nên đóng).
3. Chuyển `prisma` CLI từ `dependencies` sang `devDependencies` ở backend để
   `npm audit --omit=dev` phản ánh đúng bề mặt production.

**Ưu tiên 2 — đóng flake để đạt "0 flaky":**
4. Chạy full-suite lặp ≥ 5 lượt (`--retries=0`) để xác định `forgot-reset`
   "mật khẩu quá ngắn" còn chập chờn hay không. Nếu tái hiện: nghi vấn đầu tiên
   là **trạng thái dùng chung giữa các spec** (outbox giả + user fixture trong
   một DB chung, `workers: 1` nên thứ tự file là tất định) — cần bắt response
   thật của `POST /auth/forgot-password` tại thời điểm đỏ để biết mã lỗi.
5. Cân nhắc thêm `tabIndex={0}` cho container `role="group"` của `NewsSlider` để
   chính vùng carousel nhận được tiêu điểm (cải thiện a11y — hiện chỉ các nút
   điều khiển nhận được phím). Chạm mã frontend nên cần phê duyệt.

**Ưu tiên 3 — bịt khoảng trống kiểm thử rủi ro cao:**
6. **D7**: thêm test sanitize nội dung rich + chặn `javascript:`/`data:` cho
   `href` banner và nội dung bài. Nếu phát hiện lỗ hổng thật thì tách thành
   ticket bảo mật riêng.
7. **SE-06/07**: test metadata/canonical/hreflang/JSON-LD trên **HTML render
   thật** của mọi route công khai.
8. **ST-07**: axe cho `tuyen-dung`, `dao-tao`, `chinh-sach-nhan-su`,
   `so-do-to-chuc-cong-ty`, `tin-tuc/[slug]`, `du-an/[slug]`,
   `du-an/[slug]/[hang-muc]`, và các trang Admin còn lại.
9. **RS-07**: mở rộng bộ responsive lên 8 viewport theo yêu cầu.
10. Browser E2E cho CRUD Admin: News, Projects, Pages, Cooperation, quản lý
    lead (§V, §K) — bốn trang đang 0% coverage.
11. Unit test cho `admin/src/lib/api/client.ts`, đặc biệt nhánh **tự
    `/auth/refresh` khi 401** (hiện 17,14%).

**Ưu tiên 4 — quyết định nghiệp vụ:**
12. **D5** — có chặn tiêu đề rỗng/chỉ khoảng trắng không? **D6** — trần số đoạn
    `content[]` là bao nhiêu?
13. **D8** — thêm `100` vào `images.qualities` hoặc hạ `quality` chỗ dùng.
14. **D9** — dọn 8 lint warning tồn đọng; cân nhắc bỏ `--fix` khỏi script `lint`
    để CI không âm thầm sửa file.

**Ưu tiên 4b — CI/deploy (D10):**
14b. Cho `frontend/ci.yml` một trong hai đường: (a) dựng backend + Postgres rồi
    build với `NEXT_PUBLIC_API_URL` thật (kiểm được prerender), hoặc (b) đặt
    tường minh `NEXT_PUBLIC_API_URL=` và **ghi rõ** rằng bước build cố ý không
    phủ prerender. Đừng để trạng thái "xanh nhờ thiếu biến môi trường".
14c. Làm `generateStaticParams` chịu lỗi được (backend không phản hồi → trả rỗng
    + cảnh báo, thay vì làm đổ cả build), hoặc bảo đảm backend luôn thức lúc
    Vercel build. Đây là rủi ro go-live thật khi backend còn ở Render Free.

**Ưu tiên 5 — vận hành:**
15. Tách `backend/.env.e2e` không chứa credential thật, để không lần chạy cục bộ
    nào có thể dùng Resend/Cloudinary thật (§C).
16. Chạy Lighthouse cục bộ có kiểm soát và **định nghĩa ngưỡng** trong repo để
    lần sau có tiêu chí đỗ/trượt.
17. Sau khi phê duyệt và commit, lấy **một lượt GitHub Actions thật** làm bằng
    chứng cho CI-14.

## Xác nhận tuân thủ

- ✅ Chỉ dùng service cục bộ `localhost`/`127.0.0.1` (Postgres 5432, BE 3001,
  Admin 5174, FE 3000).
- ✅ **Không** truy cập DB production; `DATABASE_URL` đã kiểm là
  `localhost:5432/thien_duc_test`.
- ✅ **Không** gọi Resend / Gmail / Cloudinary / Sentry.
- ✅ Dùng transport email **GIẢ**; **không** email thật nào được gửi.
- ✅ **Không** dùng tài khoản người dùng thật — chỉ tài khoản seed test và
  fixture `@e2e.test`.
- ✅ **Không** log/in token bản rõ, mật khẩu, JWT, cookie, `DATABASE_URL` hay
  secret nào.
- ✅ **Không** commit, **không** push. Cả 4 repo còn nguyên thay đổi chờ phê
  duyệt.
- ✅ **Không** skip test nào để lấy màu xanh.
- ✅ **Không** tắt/loại trừ/hạ mức rule axe nào.
- ✅ **Không** làm yếu bất kỳ assertion nào; bản sửa D2 **siết** validation.
- ✅ **Không** thêm sleep tùy ý; **không** nới timeout; **không** bật retry để
  che lỗi.
- ✅ **Không** dùng `overflow-x: hidden` toàn cục để che defect responsive.
- ✅ **Không** thêm `continue-on-error` / `|| true`.
- ✅ **Không** sửa file không liên quan; **không** chạm `archive/legacy-docs`.
- ✅ **Không** làm yếu authentication/authorization/validation.
