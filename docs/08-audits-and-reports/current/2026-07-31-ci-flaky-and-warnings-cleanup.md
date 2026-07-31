# Dọn nốt chất lượng CI — 4 test chập chờn, cảnh báo lint, nhiễu log

> **Trạng thái:** Đang dùng · **Ngày:** 2026-07-31 · **Phiên:** `THIEN-DUC-CI-FLAKY-AND-WARNINGS-CLEANUP-M1`
> **Liên quan:** [backlog §6 repo](2026-07-31-optional-backlog-repo-work.md) ·
> [sự cố migration unaccent](2026-07-31-production-unaccent-migration-incident.md) ·
> [ma trận test-case](2026-07-30-final-test-case-matrix.md)

## 0. Tóm tắt

| # | Việc | Kết quả |
|---|---|---|
| 1 | 4 test Playwright chập chờn | **FIXED** — tái hiện được 100%, sửa tất định, 5/5 lần chạy sạch |
| 2 | 5 cảnh báo lint backend | **FIXED** — `npm run lint` 0 lỗi / 0 cảnh báo |
| 3 | Nhiễu healthcheck Postgres trong CI | **FIXED** — `pg_isready -d thien_duc_test` |
| 4 | Log duplicate-key trong E2E | **LOẠI A — CÓ CHỦ ĐÍCH**, không sửa, đã ghi tài liệu |
| 5 | npm audit 3 repo | **PARTIAL** — admin 16→15, frontend 33→30, backend giữ 6 (có lý do đo được) |
| 6 | GitHub Actions chạy Node 20 hết hạn | **FIXED** — checkout/setup-node/upload-artifact → v5 (Node 24) |
| 7 | Dọn CI tùy chọn | **FIXED** — cache `.next/cache`, hết nhiễu `Thiếu SENTRY_DSN` trong unit test |

---

## 1. Bốn test Playwright chập chờn — nguyên nhân gốc là CỔNG HYDRATE

### 1.1 Không tái hiện được bằng cách chạy lại

Trước khi sửa bất cứ dòng nào, chạy trên máy dev:

| Lần chạy | Kết quả |
|---|---|
| `news-slider-pagination.e2e.ts` (cache `.next` ấm), `--retries=0` | 26/26 xanh |
| Như trên nhưng **xoá sạch `.next`** trước | 26/26 xanh |
| **Toàn bộ** 187 test, `--retries=0` | **187 passed, 0 fail, 0 flaky, 0 skip** (6,0 phút) |

Máy dev quá nhanh nên cửa sổ lỗi đóng lại trước khi Playwright kịp bấm. Đoán mò
rồi "sửa" là vô nghĩa — phải dựng lại được điều kiện của runner CI.

### 1.2 Tái hiện tất định bằng bóp CPU 20×

Dựng file tạm `e2e/public/hydration-race-repro.e2e.ts` (đã **xoá** sau khi có
bằng chứng), chạy hai chế độ trên cùng một hạ tầng:

- Bóp CPU 20× qua CDP `Emulation.setCPUThrottlingRate` — mô phỏng runner CI.
- **Làm chậm mạng KHÔNG tái hiện được**: `page.goto` mặc định chờ `load`, tức là
  đã chờ tải xong mọi script. Cửa sổ nguy hiểm nằm **sau** `load`, lúc trình
  duyệt còn đang chạy JS mà React chưa gắn handler. Thử `page.route` giữ chunk
  lại 4 giây → **4/4 xanh**, không tái hiện được gì.

| Test | `REPRO_MODE=old` (logic hiện tại) | `REPRO_MODE=new` (logic đã sửa) |
|---|---|---|
| A — slider next đổi thẻ | ❌ `expect(received).not.toBe("… bai 11")` — thẻ đứng yên | ✅ |
| B — bấm thẻ mở đúng bài | ❌ `page.waitForURL: Timeout 15000ms` | ✅ |
| C — Back quay lại trang 1 | ❌ `page.waitForURL: Timeout 15000ms` | ✅ |
| D — bản tiếng Anh, phân trang | ❌ `page.waitForURL: Timeout 15000ms` | ✅ |

**Đúng 4 test được báo cáo, không thừa test nào.** Thông điệp lỗi của A trùng
khớp thông điệp CI báo (`expect.poll(firstVisibleTitle).not.toBe(before)` hết
hạn 10 giây).

### 1.3 Nguyên nhân gốc

HTML server render đã có đủ nút và link; Playwright thấy chúng "khả kiến, bấm
được" nên bấm ngay. Nhưng handler React chỉ tồn tại **sau khi cây hydrate**:

- **Nút slider** (`onClick` của `NewsSlider`): bấm sớm → không handler nào nhận →
  thẻ đứng yên → `expect.poll` hết hạn. Đây là **defect của test**, không phải
  của sản phẩm: người dùng thật bấm vào nút chết trong ~1 giây đầu cũng không
  có gì xảy ra, và họ chỉ việc bấm lại.
- **Link phân trang / thẻ tin** (`next/link`): trước hydrate là thẻ `a` thường
  (điều hướng cứng); sau hydrate router chặn `click` và chuyển trang phía client.
  Bấm đúng lúc giao thời thì hoặc điều hướng không xảy ra, hoặc **cùng một cú
  bấm bị xử lý hai lần** → hai mục lịch sử cho cùng `?page=2` → một lần
  `goBack()` không quay về được trang 1.

Đây đúng lớp lỗi đã ghi nhận và sửa ở `banner-content.e2e.ts` (khối chú thích
"CỔNG HYDRATE"), lần đó tình cờ có sẵn tín hiệu quan sát được (thanh
`.banner-progress` biến mất). `NewsSlider` **không** có tín hiệu tương tự trên
desktop: effect duy nhất của nó đặt `visibleCount` từ `window.innerWidth`, mà
giá trị SSR đã là 3 nên ở 1280px không có gì thay đổi để chờ.

### 1.4 Bản sửa

**Helper mới `e2e/helpers/hydration.ts`** — `waitForAppHydration(page)`:

Chờ phần tử `<next-route-announcer>`. App Router tự chèn phần tử này vào
`document.body` trong `useEffect` của `AppRouterAnnouncer`
(`next/dist/client/components/app-router-announcer.js`). Đã kiểm chứng: **không
có** trong HTML server render (tải thẳng HTML `/tin-tuc`: 0 kết quả), chỉ xuất
hiện khi effect chạy — tức cây đã hydrate.

- **Không** thêm thuộc tính test nào vào mã production.
- Là chi tiết nội bộ của Next: nếu bản Next sau đổi tên, helper hết hạn chờ và
  test **đỏ rõ ràng**, không âm thầm xanh sai.

| Test | Sửa chính xác |
|---|---|
| `desktop: 3 thẻ, next/previous đổi thẻ` | `waitForAppHydration` trước cú bấm đầu; thêm khẳng định `previous` **toBeEnabled** sau khi next (bằng chứng trạng thái, độc lập với nội dung thẻ) |
| `ArrowRight/ArrowLeft` (chưa chập chờn, cùng lớp rủi ro) | `waitForAppHydration` trước khi bấm phím |
| `bấm thẻ mở đúng bài` | `waitForAppHydration`; đọc `href` thật của thẻ, khẳng định dạng `/tin-tuc/…`, rồi `waitForURL` theo **đúng `pathname` đó** với `waitUntil: 'commit'` (điều hướng phía client không phát sự kiện `load` mới — chờ `load` là treo tới hết hạn) |
| `Back của trình duyệt quay lại trang 1` | `waitForAppHydration` + chốt `aria-current = 1` **trước** khi bấm; chốt `aria-current = 2` **trước** khi `goBack()` |
| `bản tiếng Anh` | `waitForAppHydration` + chốt trang 1 trước khi bấm; `waitForURL` so `pathname` + `searchParams` thay vì so chuỗi nguyên |
| `bấm sang trang 2`, `Previous`, `mobile phân trang` (cùng lớp rủi ro) | thêm `waitForAppHydration` |

**Một defect do chính bản sửa gây ra, đã bắt và sửa ngay**: bản đầu dùng
`waitForURL('http://127.0.0.1:3000/en/tin-tuc?page=2')` so chuỗi nguyên — link
phân trang có kèm neo `#danh-sach-tin` nên không bao giờ khớp (đỏ ở lần chạy
xác minh thứ nhất). Đã đổi sang so `pathname` + `searchParams`.

**Không** dùng `waitForTimeout` ở bất kỳ đâu. **Không** tăng `retries`.
**Không** bỏ hay nới lỏng test nào — chỉ thêm điều kiện chờ và thêm khẳng định.

### 1.5 Bằng chứng sau khi sửa

Năm lần chạy liên tiếp `e2e/public/news-slider-pagination.e2e.ts --retries=0`:

| Lần | Kết quả |
|---|---|
| 1 | 26 passed (53,1s) |
| 2 | 26 passed (51,7s) |
| 3 | 26 passed (51,4s) |
| 4 | 26 passed (51,3s) |
| 5 | 26 passed (52,2s) |

**0 failed · 0 flaky · 0 skipped** ở cả 5 lần.

---

## 2. Năm cảnh báo lint backend — sửa bằng kiểu, không tắt luật

`npm run lint` trước phiên: **0 lỗi, 5 cảnh báo** `no-unsafe-assignment`.

| Vị trí | Nguyên nhân | Cách sửa |
|---|---|---|
| `src/media/cloudinary.service.ts:94` | `cloudinary.uploader.destroy()` khai báo trả `any` | Nhận vào `unknown`, thu hẹp bằng type guard thật `destroyStatusOf()`; shape lạ → `undefined` → ném lỗi (trước đây âm thầm so `undefined !== 'ok'`) |
| `src/users/users.service.spec.ts:213, 226 (×2), 530` | `expect.objectContaining` / `expect.anything` trả `any`, đặt thẳng vào field của object literal | Ba hàm bọc trả `unknown` (`objectContaining`, `notObjectContaining`, `anything`) — matcher vẫn nguyên hành vi lúc chạy |

**Không** tắt luật toàn cục, **không** thêm `eslint-disable` diện rộng, **không**
cast bừa. Sau phiên: **0 lỗi, 0 cảnh báo**.

---

## 3. Nhiễu healthcheck Postgres trong CI

`thien-duc-website-backend/.github/workflows/ci.yml`, job `e2e`:

```diff
- --health-cmd "pg_isready -U thienduc_ci"
+ --health-cmd "pg_isready -U thienduc_ci -d thien_duc_test"
```

Thiếu `-d`, `pg_isready` mặc định thăm dò database **trùng tên user**
(`thienduc_ci`) — database đó không tồn tại, nên cứ 5 giây Postgres lại ghi
`FATAL: database "thienduc_ci" does not exist`. Container vẫn "healthy"
(pg_isready coi cả phản hồi FATAL là server đã sống) nên trước giờ không ai để
ý; hậu quả là log job đầy nhiễu và **che mất lỗi DB thật**.

Không đổi credential test, không đụng cấu hình production.

---

## 4. Log duplicate-key trong E2E — LOẠI A, có chủ đích

| Log | Nguồn | Phân loại |
|---|---|---|
| `news_posts_slug_key` | `test/http-foundation.e2e-spec.ts` — *"slug trùng → 409 (không rơi thành 500)"* | **A — có chủ đích** |
| `account_invitations_token_hash_key` | `test/auth-integration.e2e-spec.ts` — *"ràng buộc unique tokenHash của lời mời"* + *"rollback giao dịch: lỗi giữa chừng → KHÔNG ghi phần nào"* (cố ý chiếm trước `tokenHash` để bước hai trong transaction vi phạm unique) | **A — có chủ đích** |
| `password_reset_tokens_token_hash_key` | `test/auth-integration.e2e-spec.ts` — *"ràng buộc unique tokenHash của reset token"* | **A — có chủ đích** |

Cả ba đều là test đường-âm khẳng định ràng buộc unique **thật sự có tác dụng**.
Không phải va chạm fixture, không phải rò rỉ dọn dẹp: mỗi test tự tạo dữ liệu
riêng rồi cố ý ghi trùng.

**Giữ nguyên ràng buộc CSDL và khẳng định của test.** Không suppress:

- Dòng log do **chính PostgreSQL** ghi (server log), không phải do ứng dụng.
  Muốn tắt phải hạ `log_min_messages` của server — sẽ giấu luôn mọi lỗi DB thật,
  đúng thứ ta không được phép làm.
- Phía ứng dụng **không** hề log: `HttpExceptionFilter` chỉ `logger.error` cho
  ngoại lệ **không phải** `HttpException`; 409/404 đi qua im lặng.

Kết luận: đây là log **mong đợi**, đã ghi vào tài liệu để lần sau không ai mất
thời gian điều tra lại.

---

## 5. Triage phụ thuộc

Đã chạy `npm audit --json` ở cả ba repo và phân loại từng advisory.

### 5.1 Backend — 6 advisory, GIỮ NGUYÊN (có lý do đo được)

| Advisory | Đường phụ thuộc | Runtime? | Fix |
|---|---|---|---|
| `@hono/node-server` (moderate ×2) | `prisma` → `@prisma/dev` (Prisma Studio) | **Không** — chỉ chạy khi gọi `prisma studio`/dev server | cần `prisma` 7.9.1 |
| `valibot` (moderate) | như trên | **Không** | như trên |
| `@prisma/dev`, `prisma` (moderate) | trực tiếp, nhưng chỉ là CLI | **Không** | như trên |
| `brace-expansion` (high, DoS) | `eslint`, `jest`, `@nestjs/cli` | **Không** — công cụ build/test | xem dưới |
| `fast-uri` (high) | `@nestjs/cli` → `webpack`/`ajv` | **Không** — chỉ lúc build | xem dưới |

**Không advisory nào chạm runtime đã deploy** (`dist/` + `@prisma/client` +
`@nestjs/*`).

Đã thử **hai** đường sửa và đo kết quả, không đoán:

1. `npm audit fix`: kéo `prisma` 7.8.0 → 7.9.1 (**+46 gói**, chủ yếu là d3/visx
   của Prisma Studio) nhưng **không** nâng `@prisma/client` (vẫn 7.8.0). Prisma
   yêu cầu CLI và client **cùng phiên bản**; lệch phiên bản là rủi ro thật, và
   nâng Prisma trong lúc **sự cố migration production đang mở** thì không phải là
   "targeted, non-breaking".
2. `npm update brace-expansion fast-uri` (targeted, không đụng Prisma): kết quả
   đo được là **6 → 29 advisory** (4 moderate + 25 high) vì cây phụ thuộc bị dựng
   lại sinh thêm bản sao `brace-expansion` cũ dưới `@jest/*`. Đã **hoàn nguyên**
   `package-lock.json` + `npm ci`, xác nhận trở lại đúng 6.

→ **Kết luận: giữ nguyên, ghi nhận công khai.** Cách sửa đúng là một lần nâng
Prisma 7.8 → 7.9 **đồng bộ cả `prisma` và `@prisma/client`**, làm sau khi sự cố
migration production đã đóng.

### 5.2 Admin — 16 → 15

Đã áp `npm audit fix` (chỉ 9 gói, toàn bản vá patch, **không** breaking):
`postcss` 8.5.16→8.5.25 (high, path traversal), `nanoid`, `brace-expansion` ×3,
`eslint` 9.39.4→9.39.5, `@eslint/js`, `@eslint/eslintrc`, `acorn`.

Còn lại 15, **tất cả đều đòi bản major**:

| Còn lại | Phân loại | Vì sao chưa sửa |
|---|---|---|
| `vitest`, `@vitest/coverage-v8`, `@vitest/mocker`, `vite`, `vite-node`, `esbuild` (2 critical + moderate) | **dev/test only** — `vitest` UI server & dev server, không có trong bundle production | cần `vitest` 4.x (major) |
| `eslint`, `@eslint/*`, `minimatch`, `brace-expansion`, `glob`, `test-exclude` (high) | **dev only** | cần `eslint` 10.x (major) |
| `react-router` / `react-router-dom` (high — CSRF ở **chế độ RSC**) | runtime, **nhưng** admin là SPA Vite thuần, **không dùng RSC mode** → không tới được | `npm audit fix` không tự nâng được trong range hiện tại |

### 5.3 Frontend — 33 → 30

Đã áp `npm audit fix` (16 gói, toàn patch): `postcss`, `js-yaml` 4.2.0→4.3.0,
`fast-uri` 3.1.3→3.1.4, `ts-jest` 29.4.11→29.4.12, `eslint` patch,
`brace-expansion` ×7, `nanoid`.

Còn lại 30:

| Còn lại | Phân loại | Vì sao chưa sửa |
|---|---|---|
| `sharp` (libvips CVE-2026-33327/33328/35590/35591) | **runtime** — `next/image` dùng phía server | npm chỉ đề xuất `next@9.3.3`, tức **hạ cấp** — không có bản vá tiến lên trong range của Next 16. **Rủi ro tồn đọng thật, cần theo dõi bản Next kế tiếp.** |
| `postcss` (qua `next`) | build-time | như trên |
| `jest`, `@jest/*`, `babel-jest`, `ts-jest`, `glob`, `test-exclude` | **dev/test only** | cần `jest` 19.x (major) |
| `eslint`, `eslint-config-next`, `eslint-plugin-*` | **dev only** | cần `eslint` 10.x / `eslint-config-next` major |

**Không** dùng `npm audit fix --force` ở bất kỳ repo nào.

---

## 6. GitHub Actions chạy Node 20 đã hết hạn

CI cảnh báo `actions/checkout@v4` và `actions/setup-node@v4` nhắm Node 20 (đã bỏ)
và đang bị ép chạy trên Node 24.

**Quyết định: nâng lên `v5`** (bản major đầu tiên chạy Node 24) cho
`actions/checkout`, `actions/setup-node` và `actions/upload-artifact` (v4 của nó
cũng còn Node 20). Sửa ở cả 4 workflow:

- `backend/.github/workflows/ci.yml`
- `frontend/.github/workflows/ci.yml`
- `admin/.github/workflows/ci.yml`
- `admin/.github/workflows/e2e-fullstack.yml`

**Cố ý KHÔNG nhảy thẳng lên v6/v7** dù chúng đã ra: v6 của checkout đổi cách lưu
credential ("persist creds to a separate file") và v7 chặn checkout fork PR cho
`pull_request_target`/`workflow_run`; workflow của ta dùng cross-repo checkout có
token và trigger `pull_request`, nên không có lợi ích gì đủ để đánh đổi rủi ro
hành vi. v5 là thay đổi nhỏ nhất dập được cảnh báo.

Giữ nguyên: hành vi checkout, `cache: npm`, `node-version: 22`, quyền.
**Không** đặt `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION`.

---

## 7. Dọn CI tùy chọn

### 7.1 Cache `.next/cache` (frontend)

Thêm `actions/cache@v5` (v5 để khỏi kéo lại cảnh báo Node 20) vào
`frontend/.github/workflows/ci.yml`:

- **Chỉ** cache `.next/cache` — bộ nhớ đệm biên dịch. **Tuyệt đối không** cache
  cả `.next`: đó là **kết quả build**, khôi phục lại sẽ khiến job "xanh" bằng
  output của commit trước thay vì build lại từ mã nguồn hiện tại.
- Key = hash lockfile + hash mã nguồn; `restore-keys` lùi về cache gần nhất cùng
  lockfile. Cache lệch chỉ làm build chậm lại, không làm kết quả sai.

### 7.2 Nhiễu `Thiếu SENTRY_DSN` trong unit test backend

`src/instrument.ts` cảnh báo ngay lúc import khi thiếu DSN — đúng hành vi mong
muốn ở production, nhưng `instrument.spec.ts` import tĩnh nên mọi lần `npm test`
đều in dòng đó ra stderr.

Sửa **ở test, không đụng mã production**: nạp module qua `loadInstrument()` —
`jest.resetModules()` → `jest.spyOn(console, 'warn')` → `require`. Cảnh báo trở
thành **thứ được khẳng định** (`toHaveBeenCalledTimes(1)` +
`stringContaining('Thiếu SENTRY_DSN')`) thay vì nhiễu. Backend unit: **491 → 492**.

Ghi chú kỹ thuật: dùng `require` (có `eslint-disable-next-line` một dòng, kèm lý
do) chứ không phải `await import()` — jest chạy CommonJS, `import()` động cần cờ
`--experimental-vm-modules` (đã đo: *"A dynamic import callback was invoked
without --experimental-vm-modules"*). Giá trị trả về được ép về đúng shape của
module nên không có `any` nào lọt ra.

---

## 8. Kết quả kiểm thử cuối phiên

| Bộ | Trước phiên | Sau phiên |
|---|---|---|
| Backend unit | 491 / 36 suite | **492 / 37 suite** (+1 khẳng định cảnh báo Sentry) |
| Backend E2E/integration | 96 | **96** (5 suite) |
| Backend migration trên PostgreSQL | 11/11 | **11/11**, `migrate deploy` không còn migration chờ |
| Frontend jest | 189 / 15 suite | **189 / 15 suite** |
| Admin vitest | 277 / 28 file | **277 / 28 file** · coverage functions **47,41%** (ngưỡng 38) |
| Playwright toàn bộ | 187 pass, **4 flaky** | lần 1: 186 pass / **1 fail** (lỗi lạ, xem §8b) · lần 2: **187 pass, 0 fail, 0 flaky, 0 skip** (8,3 phút, `--retries=0`) |
| Playwright file đã sửa ×5 | — | **5/5 × 26 pass** |
| `responsive.e2e.ts` ×3 (điều tra §8b) | — | **3/3 × 41 pass** |

Lint / typecheck / build:

| Repo | lint | `tsc --noEmit` | build |
|---|---|---|---|
| Backend | **0 lỗi, 0 cảnh báo** (trước: 0 lỗi, 5 cảnh báo) | sạch | xanh |
| Frontend | 0/0 | sạch | xanh (`NEXT_PUBLIC_API_URL=''`, đúng hợp đồng CI) |
| Admin | 0/0 | sạch | xanh |

> **Lưu ý về build frontend cục bộ**: chạy `npm run build` với `.env` cục bộ
> (trỏ `NEXT_PUBLIC_API_URL` vào backend) **trong khi backend không chạy** sẽ đỏ
> ở bước prerender `/sitemap.xml` (`ECONNREFUSED`). Đây là hợp đồng đã ghi rõ
> trong `frontend/.github/workflows/ci.yml`: CI build **không** có backend nên
> đặt biến rỗng. Không phải hồi quy.

Chỉ chạm `127.0.0.1:5432/thien_duc_test`. Không gọi Render, Vercel, Resend,
Cloudinary hay Sentry.

---

## 8b. Một lỗi MỚI xuất hiện đúng một lần — `responsive.e2e.ts` @ 1280x800

Lần chạy toàn bộ đầu tiên **sau** khi sửa cho kết quả **186 passed / 1 failed**.
Test đỏ **không** nằm trong 4 test của phiên này mà là
`e2e/admin/responsive.e2e.ts:121` — *"Admin: login/forgot/reset/setup không tràn
ngang + control chính hiển thị"* ở viewport 1280x800:

```
expect(getByRole('button', { name: 'Đăng nhập' })).toBeVisible()
Timeout: 10000ms — element(s) not found
```

Ảnh chụp lúc đỏ: **trang trắng hoàn toàn** — SPA Admin không mount.

### Đã điều tra

| Bằng chứng | Kết quả |
|---|---|
| Ảnh chụp | trắng trơn, không có nội dung nào |
| Trace | **không có** — `playwright.config.ts` đặt `trace: 'on-first-retry'` mà lần chạy này `--retries=0`, nên không sinh trace. Console/`#root` của **chính lần đỏ đó** vì thế không truy hồi được |
| Log server quanh thời điểm đỏ | **không** có lỗi nào của Vite/Admin |
| Test kế tiếp (số 97) | dùng đúng app Admin đó và **xanh sau 1,2 giây** → dev server vẫn khỏe |
| Chạy lại `responsive.e2e.ts --retries=0` **3 lần** | **41 passed** mỗi lần (123 lượt test, gồm 3 lần đúng ca 1280x800) |
| Probe tạm 40 vòng `goto('/dang-nhap')` ở 1280x800, bắt console/pageerror/requestfailed/response ≥400 + đọc `#root` | **0/40 lần trang trắng**, 0 page error, 0 request hỏng, 0 phản hồi ≥400 |
| Chạy lại **toàn bộ** 187 test `--retries=0` sau điều tra | **187 passed, 0 fail, 0 flaky, 0 skip** (8,3 phút) |

### Phân loại: **MỘT LẦN DUY NHẤT, KHÔNG TÁI HIỆN ĐƯỢC**

Không sửa mò. Không tăng `retries`, không thêm `waitForTimeout`. Test hiện đã
chờ theo điều kiện (`toBeVisible`, hạn 10 giây) — đúng cách; cái thiếu là **dữ
liệu chẩn đoán** cho lần đỏ đó, không phải thiếu điều kiện chờ.

**Đề xuất (chưa làm, cần duyệt)**: đổi `trace` sang `'retain-on-failure'` trong
`playwright.config.ts` để lần sau còn trace/console mà đọc. Đây là thay đổi
*tăng* khả năng chẩn đoán, không phải che giấu — nhưng nằm ngoài phạm vi phiên
này nên không tự ý sửa.

## 9. Rủi ro còn lại

1. **`sharp` / libvips (frontend, runtime)** — chưa có bản vá tiến lên trong
   range của Next 16. Theo dõi bản Next kế tiếp; đây là advisory *duy nhất* còn
   lại chạm được runtime deploy.
2. **Nâng Prisma 7.8 → 7.9** (backend) còn treo, phải làm đồng bộ `prisma` +
   `@prisma/client`, sau khi sự cố migration production đã đóng.
3. **`eslint` 10 / `vitest` 4 / `jest` 19** — các bản major dọn phần lớn advisory
   dev-only còn lại; nên làm thành một phiên nâng công cụ riêng.
4. **Helper hydrate bám vào chi tiết nội bộ của Next** (`<next-route-announcer>`).
   Đổi bản Next thì test đỏ rõ ràng chứ không xanh sai, nhưng vẫn là điểm cần
   nhớ khi nâng Next.
5. Bản sửa chập chờn được chứng minh bằng **mô phỏng** runner chậm (CPU 20×) và
   5 lần chạy sạch cục bộ. **Chưa** chạy lại trên chính runner CI — cần một lần
   CI xanh để đóng hẳn.
6. **`responsive.e2e.ts` @ 1280x800 từng trắng trang đúng một lần** (§8b) và
   không tái hiện được sau 123 lượt chạy lại + 40 vòng probe. Chưa có nguyên
   nhân gốc; nếu tái diễn, việc đầu tiên là bật `trace: 'retain-on-failure'`.
