# Backlog tùy chọn §6 — phần làm được trong repo

> **Trạng thái:** Đang dùng · **Ngày:** 2026-07-31 · **Phiên:** `THIEN-DUC-OPTIONAL-BACKLOG-REPO-WORK-M1`
> **Liên quan:** [implementation-plan §6](../../04-implementation/implementation-plan.md) ·
> [backup-and-restore](../../07-deployment/backup-and-restore.md) ·
> [monitoring-and-alerting](../../07-deployment/monitoring-and-alerting.md)

## 0. Tóm tắt trạng thái

| # | Mục backlog §6 | Trạng thái sau phiên |
|---|---|---|
| 1 | Tìm kiếm bỏ dấu (`unaccent`) | **COMPLETE (repo)** + EXTERNAL VERIFICATION REQUIRED (quyền tạo extension trên Render) |
| 2 | Sentry source-map upload | **REPO PREPARATION COMPLETE** (frontend) · EXTERNAL UPLOAD NOT VERIFIED · Admin BLOCKED BY DEPENDENCY |
| 3 | Backup off-site tự động | **REPO AUTOMATION PREPARED** · EXTERNAL STORAGE NOT CONFIGURED · RESTORE DRILL NOT PRODUCTION-VERIFIED |
| 4 | G4 — hiệu năng còn lại | **PARTIALLY COMPLETE** — sửa 1 defect ảnh thật; LCP/TBT/Lighthouse: EXTERNAL VERIFICATION REQUIRED |
| 5 | Schema.org mở rộng | **BLOCKED BY BUSINESS DATA** (không đổi) |
| 6 | Test Zod schema 6 FormDialog | **COMPLETE** |
| + | M2-R2 reduced motion | **COMPLETE** |
| + | D8 `quality={100}` | **COMPLETE** (là bug thật, không chỉ lệch cấu hình) |

---

## 1. Tìm kiếm bỏ dấu — checkbox `[x]` SAI, tính năng chưa từng tồn tại

**Phát hiện quan trọng nhất của phiên.** §6 đánh dấu mục này `[x]` (đã xong),
nhưng:

- `grep -r unaccent` trên toàn backend: **0 kết quả** — không migration, không
  hàm, không extension.
- Không có mục ledger §7 nào cho việc này.
- Đo trực tiếp trên PostgreSQL thật trước khi sửa:

  ```
  to_tsvector('simple','Dự án Hưng Phú') @@ plainto_tsquery('simple','du an')  -> false
  to_tsvector('simple','Dự án Hưng Phú') @@ plainto_tsquery('simple','Dự án')  -> true
  ```

Tức là người gõ không dấu — thói quen phổ biến nhất của người Việt — **không
tìm thấy gì**. Checkbox mô tả *việc cần làm*, không phải việc đã làm.

### Đã cài đặt

Migration `20260731120000_search_unaccent`:

1. `CREATE EXTENSION IF NOT EXISTS unaccent`.
2. Hàm bọc `immutable_unaccent(text)`. **Bắt buộc**: `unaccent(text)` một tham số
   là `STABLE` (phụ thuộc `search_path`) nên **không dùng được trong biểu thức
   index**; dạng hai tham số `unaccent(regdictionary, text)` thì được, nên ta bọc
   lại và khai báo `IMMUTABLE` — đúng cách PostgreSQL khuyến nghị. Tên dictionary
   ghi rõ schema (`public.unaccent`) để không phụ thuộc `search_path` phiên gọi.
3. `DROP INDEX` **trước** khi đổi thân hàm, rồi `CREATE INDEX` lại. `CREATE OR
   REPLACE FUNCTION` không tự dựng lại index đã xây theo thân cũ — bỏ qua bước
   này sẽ có index lệch dữ liệu và **tìm kiếm trả kết quả sai âm thầm**.
4. `src/search/search.service.ts` bọc `immutable_unaccent()` quanh **từ khoá**.
   Bọc một phía là vô nghĩa.

> **Bẫy đã gặp và đã sửa trong lúc làm**: index tin tức tên là
> `news_posts_search_idx`, không phải `news_search_idx`. Bản nháp migration đầu
> tiên drop nhầm tên → sẽ để lại index cũ với biểu thức cũ. Đã đối chiếu tên
> index thật trong mọi migration trước khi chốt.

### Bằng chứng sau khi sửa (PostgreSQL 16 cục bộ, `thien_duc_test`)

| Truy vấn | Kết quả |
|---|---|
| `du an` (bỏ dấu) | **true** (trước: false) |
| `Dự án` (có dấu) | true |
| `DU AN` (HOA, bỏ dấu) | true |
| `hung phu` | true |
| `bien hoa` (không liên quan) | false |
| `immutable_unaccent` volatility | `i` (IMMUTABLE) |
| `project_search_document` / `news_search_document` chứa `immutable_unaccent` | true / true |
| `projects_search_idx`, `news_posts_search_idx` | cả hai tồn tại |
| Dữ liệu thật: `hung phu` trên project PUBLISHED | 1 kết quả |
| Chuỗi `' OR 1=1; DROP TABLE users; --` | 0 kết quả, không lỗi, bảng `users` nguyên vẹn |

**+23 test integration** (`test/search-unaccent.e2e-spec.ts`) qua HTTP thật: có
dấu / bỏ dấu / HOA-thường / một phần / bản dịch EN / DRAFT không lộ / thứ tự tất
định / injection vô hại / `q` 1 ký tự vẫn 400.

### Còn lại (ngoài repo)

`CREATE EXTENSION unaccent` cần quyền trên instance Render. Extension nằm trong
`contrib` của PostgreSQL nên thường được cho phép, **nhưng phiên này không truy
cập production nên KHÔNG xác nhận được**. Phải chạy `prisma migrate deploy` trên
staging/production và xác nhận migration đi qua trước khi coi là xong hẳn.

---

## 2. Test Zod schema 6 FormDialog — COMPLETE

### Sáu FormDialog (suy ra từ mã nguồn, không đoán)

`BannerFormDialog`, `CooperationFormDialog`, `NewsFormDialog`, `PageFormDialog`,
`ProjectFormDialog`, `UserFormDialog` — đúng sáu file có `z.object` +
`zodResolver`. (`NewsCategoryManagerDialog`, `LeadDetailDialog`,
`ProjectDetailDialog`, `UserDetailDialog`, `DeactivateUserDialog`,
`RevokeInvitationDialog` không có schema.)

### Cách export

Schema **tách hẳn sang module riêng** (`banner-schema.ts`, `news-schema.ts`, …)
thay vì export từ file component. Hai lý do đo được, không phải sở thích:

1. `react-refresh/only-export-components` báo lỗi khi file component export thêm
   thứ khác (đã dựng lại đúng 6 cảnh báo này rồi mới tách).
2. Import schema từ file component kéo **cả component** vào mẫu số coverage →
   `functions` tụt 45,76% → **35,53%**, dưới ngưỡng 38 và làm đỏ
   `test:coverage`. Sau khi tách: **47,41%**, không phải hạ ngưỡng.

Component chỉ import schema; **không** export gì thêm ra ngoài.

### Bảng đối chiếu Admin ↔ Backend DTO

| Module | Admin schema | Backend DTO | Khớp | Khác biệt (trước phiên → sau phiên) |
|---|---|---|---|---|
| Banner | `bannerSchema` | `CreateBannerDto` | ✅ sau sửa | `image` thiếu max 500 + `IsSafeImageRef`; `href` chỉ `startsWith("/")` (không chặn `//host`); `objectPosition` thiếu max 60 → **đã bổ sung đủ** |
| Cooperation | `cooperationSchema` | `CreateCooperationProjectDto` | ✅ sau sửa | mọi field chữ thiếu max 5.000; `image` thiếu max + safe-ref → **đã bổ sung** |
| News | `newsSchema` | `CreateNewsPostDto` | ✅ sau sửa | `slug` thiếu max 160; `author` thiếu max 120; `categoryId` thiếu max 60; `image` thiếu max + safe-ref; `eventDate` không kiểm định dạng → **đã bổ sung** |
| Page | `pageSchema` | `CreatePageDto` | ✅ sau sửa | `slug` thiếu max 160; `title` thiếu max 5.000 → **đã bổ sung** |
| Project | `projectSchema` | `CreateProjectDto` | ✅ sau sửa | như News, cộng `location`/`category` thiếu max → **đã bổ sung** |
| User | `userSchema` | `CreateAccountInvitationDto` | ✅ | không lệch; đã đúng từ trước |

**Chỉ sửa khác biệt VÔ Ý.** Tiêu chí: mọi khác biệt được sửa đều là *Admin lỏng
hơn backend*, nghĩa là biên tập viên gõ xong bấm Lưu mới nhận 400 — không có
trường hợp nào Admin chặn thứ backend chấp nhận. Việc soi gương trần của backend
đã là chính sách sẵn có của repo (xem `long-form-content.ts`: "khớp backend, và
**không** đặt thấp hơn").

**Khác biệt CÓ CHỦ Ý, KHÔNG đụng tới** (báo cáo, không sửa):

- `en` không bắt buộc ở Admin trong khi backend cũng cho phép rỗng — có chú
  thích rõ trong `ProjectFormDialog`: biên tập viên nhập VI trước, thiếu EN chỉ
  bị đánh dấu chấm vàng chứ không chặn lưu.
- Admin gửi `en: ""` còn backend `@IsOptional()` — `""` vẫn qua `IsString` +
  `MaxLength`. Không phải lỗi.
- `U+200B` (zero-width space) không bị `trim()` bỏ ở **cả hai** phía → hai bên
  vẫn khớp nhau. Đã khoá bằng test để đổi một bên là thấy ngay.

### Test đã thêm

`src/components/form-schemas.test.ts` — **121 test**, phủ: payload tối thiểu /
đầy đủ, VI bắt buộc, EN tùy chọn, chuỗi rỗng, chỉ khoảng trắng, NBSP,
zero-width, min, đúng trần, quá trần 1 ký tự, hình dạng slug (7 biến thể sai),
URL nguy hiểm (10 biến thể gồm `javascript:` chèn tab/newline, `data:`, `http:`,
`//host`, `/\host`), ảnh nội bộ vs https, trần số đoạn 500, trần đoạn 100.000,
nhiều đoạn ngắn cộng lại vượt trần vẫn hợp lệ, enum, ngày, field lạ bị strip,
tạo mới vs sửa.

---

## 3. Sentry source-map upload

### Frontend (Next.js) — REPO PREPARATION COMPLETE

`next.config.ts` nay bọc `withSentryConfig` (tích hợp **chính thức** của
`@sentry/nextjs@10`, đã có sẵn trong `package.json` — không thêm dependency,
không viết script upload tự chế).

Bảo đảm:

- **Cổng bật**: chỉ chạy khi có ĐỦ `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` +
  `SENTRY_PROJECT`. Thiếu bất kỳ cái nào → trả về cấu hình gốc nguyên vẹn.
  Đã kiểm: `npm run build` **không có token** vẫn xanh, không gọi mạng.
- **Không đoán org/project** — đoán sai là bắn source map sang project người khác.
- `release` = `SENTRY_RELEASE` → `VERCEL_GIT_COMMIT_SHA` → `GITHUB_SHA`; không
  suy được thì bỏ trống, **không bịa**.
- `deleteSourcemapsAfterUpload: true` — source map không phát công khai.
- `errorHandler` chỉ cảnh báo: upload hỏng **không** làm đổ deploy.
- `telemetry: false`.
- Token chỉ đọc từ biến môi trường; `.env.example` chỉ thêm **tên biến** + mô tả.

Logic cổng tách ra `src/lib/sentry-build.ts` và có **15 test** chạy không cần
build, không cần mạng, không cần token thật.

### Admin (Vite) — BLOCKED BY DEPENDENCY

Đường chính thức là `@sentry/vite-plugin`, **chưa được cài** (admin chỉ có
`@sentry/react`). Phiên này cố ý không tự thêm dependency mới. Khi được duyệt:

```bash
npm i -D @sentry/vite-plugin
```

rồi thêm plugin vào `vite.config.ts` với đúng cổng bật như frontend
(`build.sourcemap: true` + `sentryVitePlugin({ org, project, authToken })`,
chỉ khi đủ ba biến).

### Backend (NestJS) — chưa cần

Chạy JS đã biên dịch phía máy chủ; stack trace vẫn đọc được nhờ file `.js.map`
sinh tại chỗ. Không ưu tiên.

### Việc thủ công còn lại trên Sentry Dashboard

1. Tạo (hoặc xác nhận) project Sentry riêng cho frontend.
2. Settings → Auth Tokens → tạo token scope **`project:releases`**.
3. Dán `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` vào biến môi
   trường của Vercel (Production + Preview). **Không** commit.
4. Deploy một bản, mở Releases → xác nhận có artifact source map.
5. Bắn một lỗi thử và xác nhận stack trace hiện đúng tên file/dòng TypeScript.

**Chưa thực hiện upload thật** — không có token và không được phép tạo.

---

## 4. Backup off-site — REPO AUTOMATION PREPARED

Bộ script mới ở `thien-duc-website-backend/scripts/backup/`:

| File | Vai trò |
|---|---|
| `lib.sh` | Hàm chung: phân tích URL an toàn, **cầu chì đích**, mã thoát, sha256 khả chuyển |
| `backup.sh` | `pg_dump -Fc -Z6` + timestamp + checksum + mã hóa tùy chọn + adapter upload |
| `verify-restore.sh` | Khôi phục vào DB **dùng-một-lần** rồi đếm bảng/hàng |
| `prune.sh` | Dọn theo tuổi, **luôn giữ N bản mới nhất**, mặc định chỉ liệt kê |
| `backup.env.example` | Mẫu biến — **chỉ tên, không giá trị** |
| `scheduler-examples.md` | Mẫu cron / GitHub Actions / scheduler ngoài — **chưa kích hoạt** |

Kiểm soát an toàn đã **chạy thật và đo được**:

| Tình huống | Kết quả |
|---|---|
| `--dry-run` | in kế hoạch, không tạo file, exit 0 |
| Backup thật `thien_duc_test` | 195.324 byte + file `.sha256`, exit 0 |
| `verify-restore.sh` | checksum khớp → restore → **17 bảng**, users 2, projects 4 → exit 0, DB thử tự xoá |
| Thiếu `DATABASE_URL` | exit **2** |
| Đích không phải localhost | exit **3** |
| Đích tên DB production (`thien_duc`) | exit **3** |
| Đích `*.render.com` | exit **3** |
| Checksum bị sửa | exit **6**, không restore |
| `prune.sh` không `--apply` | chỉ liệt kê, không xóa file nào |
| Mật khẩu DB xuất hiện trong log | **0 lần** |

`.gitignore` chặn `/backups/`, `*.dump`, `*.dump.gpg`, `*.dump.sha256` và
`scripts/backup/backup.env`.

**Mã hóa**: hỗ trợ `gpg` AES256 qua `BACKUP_ENCRYPT_KEY`. Không đặt thì script
vẫn chạy nhưng **in cảnh báo rõ ràng** — bản dump chứa dữ liệu cá nhân (email,
điện thoại người liên hệ) nên không được rời máy khi chưa mã hóa.

### Còn lại (ngoài repo)

- **Chưa chọn nhà cung cấp**, chưa có credential, **chưa upload gì lên đâu cả**.
  Adapter `s3` / `b2` / `gcs` đã viết nhưng chưa chạy lần nào với đích thật.
- **Chưa diễn tập khôi phục trên production.** Kiểm chứng ở trên là dump của DB
  **test** cục bộ, không phải dữ liệu thật.
- Chưa bật lịch chạy nào.
- Lưu ý phiên bản: production là PostgreSQL 17, máy chạy backup phải có
  `pg_dump` **≥ 17**. Kiểm chứng ở trên chạy bằng client 16 trên DB 16 cục bộ.

---

## 5. G4 — hiệu năng

### 5.1 LCP trang chủ mobile — không có thay đổi nào dựa trên bằng chứng

Đọc `home-banner-slider.tsx`: **mọi tối ưu mà backlog gợi ý đều đã có sẵn** —
`preload` chỉ cho slide đầu (`index === 0`), `loading="lazy"` cho các slide còn
lại, `sizes="100vw"`, `quality={90}` (đã allowlist), đi qua pipeline
`next/image` (WebP/AVIF, nhiều bề rộng).

Đo thật qua `/_next/image` (`w=640`): q=75 → 32.709 byte · q=90 → 55.243 byte ·
ảnh gốc 241.918 byte.

Vì vậy **không sửa gì**: con số 4,3 s đến từ một lần đo PSI mobile trên
production chạy **Render Free** (backend ngủ sau 15 phút, cold start), là đặc
tính hạ tầng chứ không phải khuyết điểm mã frontend. Sửa mò để "đẹp điểm" sẽ vi
phạm nguyên tắc không bịa cải thiện. Cần **đo lại sau khi nâng plan trả phí**.

### 5.2 TBT trang dự án — CHƯA LÀM

Không profile. Cần trace CPU thật (Lighthouse/CDP) mới xác định được bottleneck;
đoán rồi viết lại component là đúng thứ backlog dặn "không rewrite chỉ để chạy
theo một điểm số tổng hợp không ổn định". **DEFERRED**, chưa có bằng chứng.

### 5.3 Lighthouse / PSI — CHƯA CHẠY

Chưa chạy Lighthouse cục bộ trong phiên này. Không có số liệu Performance /
A11y / Best Practices / SEO / LCP / CLS / TBT nào mới để báo cáo — và **không**
suy diễn kết quả PSI production từ số đo cục bộ.

**Checklist PSI cần chạy sau khi deploy** (điền vào bảng khi có số):

| URL | Cần đo |
|---|---|
| `https://<domain>/` | Perf, LCP, CLS, TBT (mobile + desktop) |
| `https://<domain>/du-an` | như trên |
| `https://<domain>/du-an/<slug>` | như trên (TBT là mối lo chính) |
| `https://<domain>/tin-tuc` | như trên |
| `https://<domain>/lien-he` | như trên |

Điều kiện: chạy **sau** khi backend đã lên plan trả phí (không cold start), lấy
**trung vị 3 lần**, ghi rõ ngày và phiên bản deploy.

---

## 6. Schema.org

### Organization — AUTOMATED LOCALLY VERIFIED

Thêm `src/lib/structured-data-shape.test.ts` (**43 test**) khoá các bất biến mà
validator hay bắt: JSON hợp lệ sau `serializeJsonLd`, `@context` đúng, `@id`
**giống nhau giữa vi/en** (Google nối cùng một thực thể), mọi URL tuyệt đối,
`foundingDate` ISO 8601, `PostalAddress` có `addressCountry: VN`, không field
rỗng/null, **không giá trị giữ chỗ** (`lorem`, `example.com`, `TODO`,
`CHANGEME`, …), và chống XSS breakout (`</script>`, `<`, `>`, U+2028/9).

Cũng khoá điều **cố ý không có**: `sameAs`, `openingHours`, `geo`, `priceRange`,
`aggregateRating` — để không ai vô tình thêm dữ liệu bịa.

**PENDING EXTERNAL CHECK**: chưa dán vào `validator.schema.org` hay Rich Results
Test (cần URL công khai chạy được). Cách lấy payload sau khi deploy:

```bash
curl -s https://<domain>/ | grep -o '<script type="application/ld+json">.*</script>'
```

### Các loại mở rộng — BLOCKED BY BUSINESS DATA

| Loại | Field bắt buộc còn thiếu | Chặn bởi |
|---|---|---|
| `RealEstateListing` | `offers.price`, `priceCurrency`, `availability`, diện tích/số phòng từng căn | Công ty chưa mở bán, chưa có bảng giá |
| `Product` | `offers` (giá + tình trạng), `sku`/`gtin` | như trên |
| `LocalBusiness` | `openingHours`, `geo.latitude/longitude`, `priceRange` | Repo không có giờ mở cửa hay toạ độ đã xác minh |
| `sameAs` | URL mạng xã hội chính thức | Chưa có URL nào được công ty xác nhận |

Không loại nào được thêm. Khai báo thiếu field bắt buộc thì Google bỏ qua toàn
khối; bịa field thì tệ hơn — sai lệch thông tin doanh nghiệp.

---

## 7. Reduced motion (M2-R2) — COMPLETE

**Chẩn đoán lại từ đầu**: báo cáo M2 ghi nguyên nhân là "thứ tự stylesheet".
Thực tế là **specificity**:

```
.stagger-sides > *:nth-child(odd)             = 0,2,0   (đặt transform ±128px)
.stagger-sides.is-revealed > *:nth-child(odd) = 0,3,0   (đặt animation)
```

cao hơn hai luật trung hoà trong khối `@media (prefers-reduced-motion)`
(`.stagger-sides > *` = 0,1,0 và `.stagger-sides.is-revealed > *` = 0,2,0). Đứng
sau trong file **không cứu được** khi specificity thấp hơn.

Sửa: lặp lại đúng hình dạng selector `:nth-child(odd|even)` bên trong khối
reduced-motion (thắng nhờ đứng sau, cùng specificity). **Không** `!important`,
**không** tắt animation toàn cục, và cố ý **không** đụng `:hover` (0,3,0) nên
phản hồi nhấc thẻ 5px khi rê chuột vẫn còn — đó là phản hồi tương tác, không
phải chuyển động tự phát.

`e2e/public/reduced-motion.e2e.ts` — **6 test**, kiểm cả hai chiều:
`animation-name: none` + `transform: none` **và** `opacity: 1` (sửa a11y không
được đánh đổi bằng nội dung biến mất), cộng một test khẳng định người **không**
bật giảm chuyển động vẫn thấy hiệu ứng.

**Đã chứng minh test bắt được lỗi**: tạm hoàn nguyên CSS → **2 test đỏ**; áp lại
bản sửa → **6/6 xanh**.

---

## 8. `quality={100}` (D8) — COMPLETE, và nặng hơn "lệch cấu hình"

`project-location-map.tsx` dùng `quality={100}` trong khi `next.config.ts` khai
`images.qualities: [75, 90]`. Đo trực tiếp trên `next dev`:

```
q=75  -> HTTP 200
q=90  -> HTTP 200
q=100 -> HTTP 400   "q" parameter (quality) of 100 is not allowed
```

Nghĩa là **ảnh bản đồ HỎNG trên mọi trang chi tiết dự án có bản đồ**, không phải
chỉ lệch cấu hình như báo cáo cũ ghi.

Sửa: dùng `quality={90}` — mức cao nhất đã allowlist. **Đánh đổi**: 55,2 KB so
với 32,7 KB ở q=75 (w=640). Chọn 90 vì bản đồ có chữ nhỏ cần nét; thêm 100 vào
allowlist sẽ làm nặng toàn site cho lợi ích thị giác gần như bằng không.

---

## 9. Kết quả kiểm thử

| Bộ | Trước phiên | Sau phiên |
|---|---|---|
| Backend unit | 491 | **491** |
| Backend integration/e2e | 73 | **96** (+23 unaccent) |
| Admin vitest | 156 | **277** (+121 schema) |
| Admin coverage (functions) | 45,76% | **47,41%** (ngưỡng 38 — không hạ) |
| Frontend jest | 131 | **189** (+43 schema.org, +15 cổng Sentry) |
| Playwright | 181 | **187** (+6 reduced-motion) — 0 fail / 0 flaky / 0 skip |

`tsc --noEmit` sạch cả ba repo. Lint: backend 0 lỗi (5 warning **có sẵn**),
admin 0 lỗi (1 warning **có sẵn**), frontend **0/0**. Mọi `build` xanh.

**Toàn vẹn CSDL** sau tất cả: 0 fixture `e2eunaccent*`, 0 user `@e2e.test`, đúng
2 tài khoản seed, DB thử `thien_duc_verify` đã bị xoá. Chỉ chạm
`localhost:5432/thien_duc_test`.

---

## 10. Còn phụ thuộc bên ngoài

1. `CREATE EXTENSION unaccent` trên Render — chạy `migrate deploy` và xác nhận.
2. Token + org + project Sentry, rồi xác minh source map trên một deploy thật.
3. Chọn nhà cung cấp kho backup, cấp credential, chạy lần upload đầu.
4. Diễn tập khôi phục từ backup **production** thật.
5. Cài `@sentry/vite-plugin` cho Admin (cần duyệt thêm dependency).
6. Đo PSI/Lighthouse sau khi nâng plan trả phí; profile TBT trang dự án.
7. Dữ liệu kinh doanh thật (giá/offer, giờ mở cửa, toạ độ, mạng xã hội) cho các
   loại Schema.org mở rộng.
