# Siết chặt trước bàn giao — M2 (FINAL RELEASE HARDENING)

> **Trạng thái:** Đang dùng · **Ngày:** 2026-07-30 · **Phiên:** `THIEN-DUC-FINAL-WEBSITE-QUALITY-AUDIT-M1` → **M2**
> **Tiếp nối:** [audit M1](2026-07-30-final-website-quality-audit.md) · [ma trận test-case](2026-07-30-final-test-case-matrix.md)
>
> **Kết luận: 🟠 PARTIALLY GREEN** (đã thu hẹp đáng kể so với M1 — lý do còn lại ở §N).

## Tóm tắt

M2 đóng 7 khoảng trống ưu tiên cao của M1. Kết quả nổi bật:

- **Tìm và sửa một lỗ hổng XSS lưu trữ THẬT** (`XSS-01`) — đã tái hiện được trên
  trang công khai trước khi sửa, và xác minh đã đóng sau khi sửa.
- **Nâng `next` 16.2.6 → 16.2.12**: toàn bộ **9 advisory trực tiếp của Next biến
  mất**; phần còn lại chỉ là 2 phụ thuộc **bắc cầu** do chính Next ghim.
- **Sửa D10**: `next build` không còn chết khi backend im lặng — đã kiểm đủ **4
  chế độ build**.
- **Responsive lên đủ 8 viewport**, và chính việc mở rộng đó **phát hiện một
  defect CSS thật** (`ProjectItemGallery` thiếu `min-w-0`).
- **Flake `forgot-reset` chạy 13 lượt liên tiếp, retries=0: 13/13 xanh** ⇒ xếp
  loại *không tái hiện được*.

## A. Next.js — phiên bản cũ/mới

| | Trước | Sau |
|---|---|---|
| `package.json` | `"next": "16.2.6"` (ghim tuyệt đối) | `"next": "16.2.12"` |
| Đã cài | 16.2.6 | 16.2.12 |

Chỉ đúng một dòng `package.json` đổi; **không** nâng phụ thuộc nào khác. **Không**
dùng `npm audit fix --force`.

### Rà soát tác động (đã kiểm bằng lệnh, không suy đoán)

| Hạng mục | Kết quả |
|---|---|
| `src/proxy.ts` + rewrite locale | Không đổi hành vi; `/`, `/en`, `/lien-he` vẫn 200, không vòng lặp redirect |
| App Router / route động | `tsc` sạch; build sinh đúng SSG/ISR/dynamic như trước |
| `allowedDevOrigins` | Giữ nguyên trong `next.config.ts`, dev server chạy bình thường |
| Sinh metadata | 131 test frontend xanh (gồm `lib/seo`) |
| Next Image | Không đổi; cảnh báo `images.qualities` cũ vẫn còn (D8, chưa sửa) |
| Build production | Xanh ở cả 4 chế độ (§I) |
| Playwright khởi động | 3 server dựng bình thường, suite đầy đủ xanh |

## B. `npm audit` trước/sau

| Repo | Trước (tất cả) | Sau (tất cả) | Trước (production) | Sau (production) |
|---|---|---|---|---|
| frontend | 32 high | 32 high | 5 high | 5 high |
| admin | 2 critical · 11 high · 3 moderate | *không đổi* | 2 high | 2 high |
| backend | 2 high · 4 moderate | *không đổi* | 1 high · 4 moderate | *không đổi* |

**Con số tổng không đổi, nhưng bản chất đổi hẳn** — đây là điểm quan trọng nhất
của mục này:

- **Trước:** `next@16.2.6` bị tính **9 advisory của CHÍNH NÓ**, gồm 3 High:
  *Middleware/Proxy bypass in App Router applications using Turbopack and single
  locale* (trùng đúng kiến trúc `src/proxy.ts`), *SSRF in Server Actions*, *SSRF
  via rewrites*, cộng DoS + cache-confusion.
- **Sau:** `next@16.2.12` **không còn advisory nào của chính nó**. Mục `next`
  còn xuất hiện trong báo cáo chỉ vì hai phụ thuộc **bắc cầu**:
  - `postcss` 8.4.31/8.5.15 (path traversal đọc file `.map` qua `sourceMappingURL`)
  - `sharp` 0.34.5 (CVE libvips)

**Hai cái này KHÔNG tự sửa được**: chúng do Next ghim, và `npm` báo
`fixAvailable: { name: 'next', version: '9.3.3', isSemVerMajor: true }` — tức lối
"sửa" duy nhất mà npm thấy là hạ Next về 9.x, hoàn toàn vô lý. Phải chờ Next phát
hành bản ghim `postcss`/`sharp` mới.

Đánh giá khai thác: cả hai đều là phụ thuộc **thời điểm build / xử lý ảnh**;
`postcss` cần CSS do kẻ tấn công kiểm soát lúc build (CSS của dự án là first-party),
`sharp` xử lý ảnh (nguồn là Cloudinary của chính công ty, đã allowlist ở
`images.remotePatterns`). Rủi ro thực tế thấp nhưng **chưa bằng không** → ghi vào
tồn đọng.

Phần dev-only (eslint/jest/vitest/vite/esbuild) không vào bundle production.
`brace-expansion` + `fast-uri` có `fixAvailable: true` nhưng **cố ý không nâng**
(ngoài phạm vi "chỉ nâng Next").

## C. Hợp đồng nội dung rich

**Kết luận: A — VĂN BẢN THUẦN (plain text). KHÔNG hỗ trợ HTML.**

Bằng chứng (kiểm cả 3 repo):

| Điểm kiểm | Kết quả |
|---|---|
| Editor Admin | `Input` / `Textarea` thường (`BilingualField`), **không** rich-text |
| Dependency rich-text/sanitizer | **Không có** ở cả admin và frontend |
| `dangerouslySetInnerHTML` ở admin | **Không có dòng nào** |
| `dangerouslySetInnerHTML` ở frontend | **Chỉ** dùng cho JSON-LD |
| Render nội dung công khai | `<p>{paragraph}</p>` — React tự escape |
| Cấu trúc `content[]` | Mảng ĐOẠN chữ thuần, tách theo dòng trống |

**Vì vậy CỐ Ý KHÔNG thêm sanitizer allowlist HTML.** Thêm vào sẽ (a) ngụ ý HTML
được hỗ trợ — trái hợp đồng, (b) phá nội dung hợp lệ như `a < b` hay
`<không phải thẻ>`. Đề bài cũng cảnh báo đúng chỗ này: *"Do not escape or strip
valid formatting without understanding the editor contract"* và *"**If** HTML is
supported, implement a centralized allowlist sanitizer"* — ở đây HTML **không**
được hỗ trợ.

Đã kiểm chứng chữ thuần được escape đúng: đoạn nội dung chứa
`<script>alert(3)</script>` render ra HTML thành
`&lt;script&gt;alert(3)&lt;/script&gt;` — an toàn.

## D. Chính sách làm sạch + test

Vì hợp đồng là plain text, việc cần làm là chặn đúng **hai chỗ chữ thuần rò vào
ngữ cảnh nguy hiểm**.

### D.1 — `XSS-01`: JSON-LD (lỗ hổng THẬT, đã sửa) · **Critical**

- **Chỗ hổng:** `frontend/src/components/ui/json-ld.tsx` +
  `components/ui/breadcrumb.tsx` nhúng schema bằng
  `dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}`.
  `JSON.stringify` **không escape `<`**.
- **Chú thích cũ trong mã nói sai:** *"dữ liệu do ta dựng (không phải HTML người
  dùng) là an toàn"* — nhưng schema có nhúng **chữ do người dùng CMS nhập**:
  `headline` = tiêu đề tin, `description` = tóm tắt, `name` = nhãn breadcrumb.
- **Đã TÁI HIỆN trước khi sửa** (bài tin thật, EDITOR+ tạo được): tiêu đề
  `BREAKOUT</script><img src=x onerror=alert(1)>` khiến khối `NewsArticle` bị cắt
  ở `"headline":"BREAKOUT`, và `<img src=x onerror=alert(1)>` + `<svg onload=...>`
  xuất hiện **nguyên vẹn, sống động** trong DOM ⇒ **XSS lưu trữ** trên trang công
  khai.
- **Bản sửa:** `frontend/src/lib/json-ld.ts` — `serializeJsonLd()` escape sang
  `\uXXXX`: `<`, `>`, `&`, U+2028, U+2029. Vẫn là **JSON hợp lệ**, parser giải mã
  lại đúng ký tự gốc nên structured data **không đổi nghĩa**. Escape ở **server**
  (các component nhúng JSON-LD đều là Server Component). Dùng chung một chỗ cho
  cả hai nơi nhúng.
- **Xác minh đã đóng** (cùng bài tin, sau khi sửa): khối `NewsArticle`
  **parse JSON thành công**, `headline` round-trip **nguyên văn**, và
  `<img src=x onerror` / `<svg onload` **không còn** trong HTML; xuất hiện dạng
  đã escape `u003cimg`.

### D.2 — Field URL: hàng rào phía SERVER (đã sửa) · **High**

- **Trước:** `href`/`image`/`url`/`gallery[]` chỉ có `@IsString() @MaxLength()`.
  Đã đo: **cả 9 biến thể nguy hiểm đều được API nhận (201)** — `javascript:`,
  `JaVaScRiPt:`, khoảng trắng đầu, **tab chèn giữa scheme**, `data:text/html`,
  `vbscript:`, `//evil.example.com`, `http://evil.example.com`.
- **Ghi nhận trung thực:** React 19 *có* chặn `href="javascript:"` lúc render
  (thay bằng `throw new Error('React has blocked a javascript: URL…')`), nên biến
  thể `javascript:` **không khai thác được trên frontend**. Nhưng đó là cơ chế
  của một thư viện **client**, không chặn `data:`, `vbscript:`, hay URL ngoài, và
  đề bài yêu cầu rõ *"no client-only security dependency; server-side enforcement
  required"*.
- **Bản sửa:** `backend/src/common/validators/safe-url.ts` —
  **allowlist theo HÌNH DẠNG**, không phải denylist theo scheme:
  - `@IsSafeInternalPath()` cho `href`: phải bắt đầu bằng đúng **một** `/`
    (chặn `//host`, `/\host`, và mọi thứ có scheme).
  - `@IsSafeImageRef()` cho `image`/`url`/`gallery[]`: đường dẫn nội bộ **hoặc**
    URL `https://` hợp lệ (Cloudinary). `http:` bị từ chối.
  - Trước khi soi hình dạng, `collapse()` **bỏ mọi ký tự điều khiển + khoảng
    trắng Unicode** — nên `java<TAB>script:` quy về `javascript:` và trượt ngay.
- Áp cho **7 DTO**: banners (`image`,`href`), news (`image`), projects
  (`image`,`gallery[]`), project-item (`image`), gallery-image (`url`),
  cooperation (`image`), media (`url`).
- **Không phá dữ liệu thật:** đã truy vấn DB — toàn bộ `href`/`image` hiện có là
  đường dẫn nội bộ (`/du-an`, `/images/...`), đều qua được.

### D.3 — Test đã thêm

| File | Loại | Số test |
|---|---|---|
| `backend/src/common/validators/safe-url.spec.ts` | unit | 51 |
| `frontend/src/lib/json-ld.test.ts` | unit | 8 |
| `admin/e2e/public/rich-content-security.e2e.ts` | browser E2E | 5 |
| `backend/test/http-foundation.e2e-spec.ts` (bổ sung) | API E2E | +11 |

## E. Kết quả với payload nguy hiểm

Toàn bộ danh sách payload đề bài yêu cầu đã được thử, ở **cả 3 tầng** (unit,
API E2E, browser E2E) và **cả hai locale VI/EN**:

| Payload | Kết quả sau khi sửa |
|---|---|
| `<script>alert(1)</script>` | Hiện dạng CHỮ; không script nào thực thi |
| `<img src=x onerror=alert(1)>` | `img[onerror]` = **0** phần tử |
| `<svg onload=alert(1)>` | `svg[onload]` = **0** phần tử |
| `<a href="javascript:alert(1)">` | Không có `a[href]` nào mang scheme nguy hiểm |
| `<a href="data:text/html,...">` | Như trên |
| `iframe` / `object` / `embed` | **0** phần tử mỗi loại |
| Payload dựa trên `<style>` | Hiện dạng CHỮ |
| Biến thể đã encode (`&lt;script&gt;`) | Hiện dạng CHỮ |
| Scheme lẫn HOA/thường (`JaVaScRiPt:`, `<SCRIPT >`, `OnErRoR=`) | Bị chặn / hiện dạng CHỮ |
| Scheme bị làm rối bằng khoảng trắng (`java<TAB>script:`) | API trả **400** |
| `</script>` thoát khỏi JSON-LD | Mọi khối JSON-LD vẫn **parse được**, không còn `<` thô |

Ngoài ra khẳng định: `window.__xss` **undefined**, **không** dialog nào, **không**
`pageerror` nào, và payload **vẫn hiển thị nguyên văn dạng chữ** (không bị âm thầm
cắt bỏ — đúng hợp đồng plain text).

**Ghi chú kỹ thuật đáng lưu:** bản đầu của test browser đếm cả script
`self.__next_f` (dữ liệu flight RSC của Next) là "script lạ" → dương tính giả 5
script. RSC payload nhúng nội dung trang vào một **chuỗi JSON** trong thẻ script;
đó là hành vi bình thường và không thực thi. Test đã lọc chúng ra.

## F. Thay đổi validate khoảng trắng (D5)

- **Helper dùng chung:** `backend/src/common/validators/not-blank.ts` —
  `@IsNotBlank()` + `isNotBlank()`.
- **HỢP ĐỒNG: TỪ CHỐI, KHÔNG TỰ ĐỘNG TRIM.** Lý do: không âm thầm sửa dữ liệu
  người dùng gửi lên; báo lỗi rõ để biên tập viên tự sửa.
  - Hệ quả đã ghi rõ + có test: vì **không** trim, `@MaxLength` vẫn đo trên chuỗi
    **thô**. `'  ' + 5000 ký tự` = 5002 → bị `MaxLength` chặn (không phải rule này).
  - Khoảng trắng quanh nội dung THẬT vẫn hợp lệ: `'  Tiêu đề thật  '` được nhận.
- **Nhận diện "trắng":** `trim()` (phủ khoảng trắng Unicode: NBSP, U+2000–200A,
  U+2028/9, U+202F, U+205F, U+3000, FEFF) **cộng thêm** zero-width
  U+200B/200C/200D — tiêu đề chỉ gồm ký tự vô hình cũng là rác.
- **Phạm vi — chỉ field BẮT BUỘC:**
  - `TranslatedTextDto.vi` và `LongTranslatedTextDto.vi` (áp cho mọi field song
    ngữ bắt buộc: title, summary, name, location, category, role, partner, scale…)
  - `slug` của news post / news category / page / project / project item
  - contact: `name`, `phone`, `message`
- **KHÔNG áp cho field optional:** `en?` (bản dịch không bắt buộc) vẫn nhận `''`
  và `'   '` — đó là cách hợp lệ để nói "chưa có bản dịch". Có test khẳng định.
- **`Update*Dto` (PartialType):** vẫn áp rule **khi có gửi** field, và payload
  rỗng vẫn hợp lệ ⇒ PATCH từng phần không bị siết. Có test.
- Test: 44 test ở `not-blank.spec.ts` (gồm valid/empty/space/tab/newline/
  leading-trailing/Unicode whitespace/biên độ dài) + 6 case HTTP E2E.

## G. Trần `content[]` và căn cứ (D6)

**`MAX_CONTENT_BLOCKS = 500`** (`backend/src/common/dto/content-blocks.ts`).

Căn cứ từ **dữ liệu thật**, không đoán:

| Nguồn | Số đoạn |
|---|---|
| 18 bài nhập từ website hiện hữu (`prisma/news-thienduccons-import.json`) | min **2** · trung vị **17** · p90 **41** · **cao nhất 48** |

- 500 ≈ **10 lần** bài dài nhất thật ⇒ không thể chặn nhầm nội dung chính đáng.
- Admin tách đoạn theo **dòng trống**, nên số đoạn ≈ số đoạn văn biên tập viên gõ.

**Tương thích với các trần khác** (đã kiểm chéo):
- Trần tổng payload vẫn là body parser **2 MB** — đó mới là ràng buộc tổng kích
  thước. 500 × 100.000 ký tự ≫ 2 MB, nên bài dài thật sẽ chạm trần **body** trước.
- Trần này chặn đúng lớp còn lại mà trần body **không** bắt được: mảng **rất
  nhiều đoạn rất nhỏ** (defect gốc: 5.000 đoạn tí xíu → từng trả 201).

**Áp đồng nhất:** `CreateNewsPostDto.content`, `CreatePageDto.content`, kế thừa
sang `Update*` qua `PartialType`, **và** schema Zod của Admin
(`admin/src/lib/long-form-content.ts` — `MAX_CONTENT_BLOCKS = 500`, kiểm cả ô VI
và EN) để biên tập viên thấy lỗi tại chỗ.

Test: rỗng (news hợp lệ / page bị `ArrayNotEmpty` chặn) · 1 đoạn · **đúng 500** ·
**501** · 5.000 · đoạn lồng nhau sai kiểu · payload tổng quá lớn (413).

## H. Kết quả responsive 8 viewport

Đủ **8/8** viewport: **320×568 · 360×800 · 375×812 · 390×844 · 768×1024 ·
1024×768 · 1280×800 · 1440×900** (giữ nguyên 3 viewport cũ).

Phạm vi mở rộng: frontend (trang chủ, liên hệ, **tin tức list + chi tiết**,
**dự án list + chi tiết + hạng mục**, **giới thiệu**, **công ty thành viên**);
Admin (login/forgot/reset/setup, tài khoản, **tổng quan, tin tức, dự án, banner,
liên hệ**, + **modal form** của tin tức/dự án/banner phải nằm gọn viewport).

**Kết quả: 41/41 test xanh.**

Việc mở rộng này **phát hiện một defect CSS thật** và **hai lỗi giả** trong cách
đo — cả ba đều đã xử lý:

1. **Defect THẬT — `ProjectItemGallery` thiếu `min-w-0`** (đã sửa sản phẩm).
   Dải ảnh thu nhỏ (`overflow-x-auto`, 7 ảnh × 96px ≈ 744px) làm cột grid không
   co được (grid item mặc định `min-width: auto`) → **chìa ra 440px ở viewport
   320**, và tràn ở mọi bề rộng < 1440. Sửa bằng `min-w-0` ở cột grid + cột flex
   + dải cuộn (đúng khuôn `min-w-0` mà repo đã dùng ở `cta-contact-cards.tsx`).
   **Không** dùng `overflow-x: hidden` toàn cục.
2. **Lỗi giả trong test của tôi** — nhánh sidebar Admin dựa vào bề rộng viewport
   Playwright (1024) trong khi media query `lg:` của Tailwind đọc **layout
   width** (1024 − thanh cuộn ≈ 1009) → không khớp. Sửa: nhánh theo
   `document.documentElement.clientWidth`.
3. **Lỗi giả trong phép đo tràn ngang** — xem §H.1.

### H.1 — Đổi cơ sở khẳng định tràn ngang (quan trọng, cần biết khi đọc test)

Trước: khẳng định `documentElement.scrollWidth ≤ innerWidth + 1`.

Vấn đề đo được bằng probe trong trình duyệt: các khối `.stagger-sides` /
`.reveal-*` reveal theo IntersectionObserver, và **trạng thái trước khi reveal cố
ý nằm lệch ngoài khung** (`translateX(±128px)` — `.projects-motion` nâng
`--reveal-sides-distance` lên 128px). Ngay sau khi tải:
`getAnimations().length === 0`, **chưa** có class `is-revealed`, `scrollWidth` =
1128 ở viewport 1024. Sau khi reveal xong: thẻ về `right = 1000`, `scrollWidth` =
1024 — **không hề tràn**.

Đã xử lý hai lớp:
1. **Đưa trang về trạng thái đã reveal một cách TẤT ĐỊNH** trước khi đo: gắn đúng
   class `is-revealed` mà sản phẩm dùng, rồi chờ **các animation có điểm kết**
   chạy xong (lọc bỏ animation `iterations: Infinity` — thanh tiến trình autoplay
   trang chủ chạy mãi, chờ nó là treo). Điều kiện, **không** `waitForTimeout`.
2. **Khẳng định theo PHẦN TỬ**, không theo `scrollWidth`: sau khi mọi phần tử đã
   về trong khung, `scrollWidth` **vẫn** giữ vùng cuộn cũ (đo được: danh sách
   phần tử vượt khung RỖNG mà `scrollWidth` vẫn 1128). Nay khẳng định *"không có
   phần tử nào chìa ra ngoài layout width"*, loại riêng phần tử bị cắt bởi khối
   **bên trong** (carousel track, dải ảnh cuộn ngang — cắt có chủ đích).

Đây là phép đo **chặt hơn và chính xác hơn**, không phải nới lỏng: nó chỉ ra đúng
phần tử gây lỗi, và **vẫn bắt được defect thật** của đợt này (dải ảnh chìa 440px).

### H.2 — Phát hiện phụ (chưa sửa)

`prefers-reduced-motion: reduce` **không** trung hoà được hiệu ứng reveal trên
trang có `.projects-motion`: khối `@media` (globals.css:446) đặt
`.reveal-from-left/right`, `.stagger-sides > *` về `transform: none`, nhưng thứ tự
stylesheet khiến rule cơ sở đặt sau vẫn thắng. Đã kiểm bằng
`emulateMedia({ reducedMotion: 'reduce' })`: transform vẫn 128px. ⇒ người dùng
chọn giảm chuyển động **vẫn thấy hiệu ứng trượt**. Là a11y gap thật, mức Low–
Medium, **chưa sửa** (thay đổi CSS trình bày, nên để chủ dự án quyết).

## I. Build / API parity (D10 — đã sửa)

**Route nào fetch lúc build, và vì sao:** `generateStaticParams` của
`[locale]/layout.tsx` (sinh locale), `tin-tuc/[slug]`, `du-an/[slug]`,
`du-an/[slug]/[hang-muc]` — để **prerender SSG** danh sách slug thật; và bản thân
các trang được prerender (trang chủ, `gioi-thieu`, `lien-he`…) cũng fetch CMS.

**Bản sửa** (`frontend/src/lib/api/client.ts`):
- `staticParamsSafe(label, load)` — lỗi khi liệt kê slug → cảnh báo **kèm nguyên
  văn lý do** (thấy được `ECONNREFUSED` trong log) rồi trả `[]`.
- `isApiReachableAtBuild(label)` — **cổng duy nhất** ở `[locale]/layout.tsx`:
  backend không với tới được → trả `[]` ⇒ **không route nào dưới `/[locale]`**
  được prerender, toàn bộ chuyển sang **render on-demand lúc chạy** (ISR
  `revalidate = 60` vẫn nguyên). Cần thiết vì `staticParamsSafe` một mình không
  đủ — các **trang** được prerender vẫn fetch và vẫn làm build đỏ.
- `BUILD_REQUIRE_API=1` — **hợp đồng build tường minh**: pipeline nào đã tự dựng
  backend thì đặt cờ này để lỗi API lúc build làm **build đỏ** thay vì degrade.

**Không che `ECONNREFUSED`**: lý do lỗi được in ra, và có cờ để biến nó thành lỗi
cứng. **Hành vi runtime giữ nguyên** (render on-demand), chỉ mất phần tĩnh hoá.

### Đã kiểm đủ 4 chế độ

| Chế độ | Trước M2 | Sau M2 |
|---|---|---|
| Thiếu `NEXT_PUBLIC_API_URL` (CI hiện tại) | exit 0, không prerender | exit 0, không prerender |
| Có URL + backend **sống** | exit 0, **có** prerender | exit 0, **có** prerender |
| Có URL + backend **ngủ** | **exit 1** — `Failed to collect page data` | **exit 0** + cảnh báo rõ, không prerender |
| Có URL + backend ngủ + `BUILD_REQUIRE_API=1` | (không có) | **exit 1** có chủ đích, thông điệp rõ |

### Yêu cầu môi trường CI + hệ quả Vercel

- `frontend/.github/workflows/ci.yml` nay **ghi tường minh**
  `NEXT_PUBLIC_API_URL: ''` kèm chú thích: bước build này **cố ý không** phủ
  prerender phụ thuộc backend. Trước đây nó xanh chỉ vì **tình cờ thiếu biến** —
  không ai thấy khoảng trống đó.
- **Hệ quả Vercel (rủi ro go-live thật, nay đã vô hiệu hoá):** build production
  *có* đặt `NEXT_PUBLIC_API_URL`, và backend đang ở **Render Free — ngủ sau 15
  phút**. Trước M2, một lần build trúng lúc backend ngủ sẽ **thất bại**. Sau M2,
  build vẫn xanh và trang render on-demand. Muốn bảo đảm prerender thì phải làm
  backend thức trước rồi đặt `BUILD_REQUIRE_API=1`.

## J. Flake — kết quả 13 lượt

`admin/e2e/admin/forgot-reset.e2e.ts`, `--retries=0`, fixture tất định, mail giả,
dọn dữ liệu độc lập:

| Lượt | Kết quả |
|---|---|
| 1–13 | **13/13 xanh**, 0 đỏ (8/8 test mỗi lượt) |

Ghi chú trung thực: 12/13 lượt in rõ dòng `8 passed`; lượt 8 không bắt được dòng
tổng kết trong log (không có báo lỗi nào) — nên đã chạy thêm 3 lượt (11–13) để có
bằng chứng không mơ hồ.

Đã soi các nghi vấn đề bài nêu: thời điểm token (fixture tự gieo, không dùng chung),
trạng thái outbox (`clearOutbox()` trước mỗi case), dọn fixture
(`deleteTestUsers()` ở `afterAll`), thời gian animation (không liên quan — lỗi cũ
ở màn xác nhận chữ), trạng thái DB dùng chung (`workers: 1`, thứ tự file tất
định), giả định hết hạn/clock (cooldown 60s có test riêng).

**Xếp loại: flake LỊCH SỬ, KHÔNG TÁI HIỆN ĐƯỢC.** Quan sát duy nhất là 1 lần đỏ
trong lượt full-suite baseline của M1; không tái hiện qua **16 lượt** (3 ở M1 +
13 ở M2). **Không** thêm sleep, **không** nới timeout, **không** bật retry.

## K. Số liệu test chính xác

| Bộ test | M1 (trước) | M2 (sau) |
|---|---|---|
| Backend unit (`npm test`) | 394 / 37 suite | **489 passed, 0 failed** / 37 suite |
| Backend E2E (`npm run test:e2e`) | 40 / 3 suite | **61 passed, 0 failed** / 3 suite |
| Admin unit (`vitest run`) | 146 / 26 file | **151 passed, 0 failed** / 26 file |
| Frontend unit (`jest`) | 123 / 12 suite | **131 passed, 0 failed** / 13 suite |
| Playwright full-stack | 139 | **175 passed, 0 failed, 0 flaky, 0 skipped** |

Cộng dồn unit/integration: 703 → **832**.

### K.1 — Playwright (retries=0)

| Lượt | passed | failed | flaky | skipped | thời lượng | exit |
|---|---|---|---|---|---|---|
| 1 | **175** | 0 | 0 | 0 | 8.1m | 0 |
| 2 | **175** | 0 | 0 | 0 | 8.0m | 0 |

Tổng số test Playwright: **139 → 175** (+31 responsive do mở lên 8 viewport và thêm
trang/modal, +5 bảo mật nội dung rich).

`retries` cục bộ vốn đã là 0, và hai lượt trên còn truyền `--retries=0` tường minh
⇒ **không kết quả nào đến từ retry**.

Ngoài ra, các spec mới/đã sửa còn được chạy RIÊNG trước khi chạy cả bộ:
`rich-content-security.e2e.ts` 5/5 · `responsive.e2e.ts` 41/41 ·
`forgot-reset.e2e.ts` 13 lượt × 8/8.

### Kiểm định khác

| Hạng mục | Backend | Admin | Frontend |
|---|---|---|---|
| `tsc --noEmit` | sạch | sạch | sạch |
| lint | **0 lỗi** (8 warning CŨ, số lượng không đổi) | **0 lỗi** (1 warning cũ `ui/form.tsx`) | **0 lỗi, 0 warning** |
| build | xanh | xanh | xanh (4 chế độ) |
| `prisma validate` / `generate` | xanh | — | — |
| coverage | — | **43,27%** lines (ngưỡng 34) **PASS** | — |

Ngưỡng coverage **không bị hạ**.

## L. File thay đổi theo repo

### `thien-duc-website-backend`

Mới: `src/common/validators/safe-url.ts` · `safe-url.spec.ts` ·
`not-blank.ts` · `not-blank.spec.ts` · `src/common/dto/content-blocks.ts`.

Sửa: `src/common/dto/translated-text.dto.ts` · `long-translated-text.dto.ts` ·
`src/banners/dto/create-banner.dto.ts` ·
`src/cooperation/dto/create-cooperation-project.dto.ts` ·
`src/media/dto/create-media-asset.dto.ts` ·
`src/news/dto/create-news-post.dto.ts` · `create-news-category.dto.ts` ·
`src/pages/dto/create-page.dto.ts` ·
`src/projects/dto/create-project.dto.ts` · `create-project-item.dto.ts` ·
`create-gallery-image.dto.ts` ·
`src/contact/dto/create-contact-submission.dto.ts` ·
`test/http-foundation.e2e-spec.ts`.

### `thien-duc-website-admin`

Mới: `e2e/public/rich-content-security.e2e.ts`.

Sửa: `e2e/admin/responsive.e2e.ts` (8 viewport + trang/modal mới) ·
`e2e/helpers/layout.ts` (đo ở trạng thái đã reveal + khẳng định theo phần tử) ·
`src/lib/long-form-content.ts` (`MAX_CONTENT_BLOCKS`) ·
`src/lib/long-form-content.test.ts` (+5 test).

### `thien-duc-website-frontend`

Mới: `src/lib/json-ld.ts` · `src/lib/json-ld.test.ts`.

Sửa: `package.json` + `package-lock.json` (chỉ `next` 16.2.6 → 16.2.12) ·
`src/components/ui/json-ld.tsx` · `src/components/ui/breadcrumb.tsx` ·
`src/lib/api/client.ts` · `src/app/[locale]/layout.tsx` ·
`src/app/[locale]/tin-tuc/[slug]/page.tsx` ·
`src/app/[locale]/du-an/[slug]/page.tsx` ·
`src/app/[locale]/du-an/[slug]/[hang-muc]/page.tsx` (+ `min-w-0`) ·
`src/components/sections/project-item-gallery.tsx` (`min-w-0`) ·
`.github/workflows/ci.yml` (hợp đồng build tường minh).

### `thien-duc-website-docs`

Mới: file này. Sửa: `implementation-plan.md` · `08-audits-and-reports/README.md` ·
`05-security/README.md` · `07-deployment/deployment-guide.md`.

## M. Tồn đọng

| ID | Mức | Nội dung |
|---|---|---|
| M2-R1 | Medium | `postcss` + `sharp` bắc cầu qua Next vẫn còn advisory High — **không sửa được** cho tới khi Next phát hành bản ghim mới |
| M2-R2 | Low–Med | `prefers-reduced-motion` không trung hoà reveal trên trang `.projects-motion` (§H.2) |
| D8 (M1) | Low | `<Image quality={100}>` vs `images.qualities: [75, 90]` |
| D9 (M1) | Low | 8 lint warning cũ ở backend + script `lint` có `--fix` (tự ghi file) |
| CI-14 | Blocked | **Không có** lượt GitHub Actions thật làm bằng chứng — chạy cục bộ, không push |
| PF-07 | Blocked | Lighthouse chưa chạy; repo không định nghĩa ngưỡng |
| — | Medium | Còn nhiều khoảng trống test của M1 chưa đóng: axe cho 4 trang tĩnh + trang chi tiết, metadata SEO trên HTML render thật, CRUD Admin ở tầng trình duyệt cho News/Projects/Pages/Cooperation, `admin/src/lib/api/client.ts` coverage 17% |

## N. Kết luận

### 🟠 PARTIALLY GREEN

**Đạt:** 7/7 hạng mục trong phạm vi M2 đã xử lý · một XSS lưu trữ thật đã đóng và
xác minh · một defect CSS responsive thật đã sửa · advisory trực tiếp của Next về
0 · build không còn phụ thuộc backend còn thức · 8/8 viewport phủ · flake 13/13
xanh · toàn bộ test xanh, `tsc` sạch, lint 0 lỗi, mọi build xanh.

**Chưa FULLY GREEN vì:**
1. **`postcss`/`sharp` bắc cầu vẫn còn advisory High** và **không có bản sửa** —
   phụ thuộc thượng nguồn (M2-R1).
2. **Không có bằng chứng CI xanh thật** — chạy cục bộ, không commit/push (CI-14).
3. **Lighthouse chưa chạy** (PF-07).
4. Còn tồn đọng M1 chưa đóng (§M dòng cuối) + M2-R2, D8, D9.

**Không** khẳng định: tuân thủ WCAG đầy đủ · đã pentest · không còn rủi ro bảo
mật · CI xanh.
