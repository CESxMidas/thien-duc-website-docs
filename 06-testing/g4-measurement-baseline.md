# G4 — Baseline đo lường production (Rich Results + PageSpeed)

> **Trạng thái:** Đang dùng (G4-a ✅; G4-b ✅ baseline + ✅ đo lại sau fix NO_FCP/NO_LCP — 14/14 lượt hợp lệ, xem "Lần đo 3")
> **Nhóm:** 06 — Testing
> **Ngày đo:** 2026-07-17 (G4-a: chủ dự án; G4-b: Lighthouse CLI local) · **Môi trường:** production (Vercel FE + Render BE)
> **Base URL:** `https://thien-duc-website-frontend.vercel.app`

Tài liệu này ghi **kết quả đo**, không phải danh sách lỗi. Nguyên tắc: **đo ≠ sửa** —
mọi phát hiện cần hành động được tách sang bảng "Đề xuất fix code" cuối file,
không sửa code trong phạm vi G4.

## Ma trận URL đo (7 trang)

| # | Trang | URL |
|---|-------|-----|
| 1 | Trang chủ | `/` |
| 2 | Giới thiệu VI | `/gioi-thieu` |
| 3 | Giới thiệu EN | `/en/gioi-thieu` |
| 4 | Dự án VI | `/du-an/khu-do-thi-hung-phu` |
| 5 | Dự án EN | `/en/du-an/khu-do-thi-hung-phu` |
| 6 | Tin chi tiết VI | `/tin-tuc/le-khoi-cong-fancy-tower-khu-do-thi-hung-phu` |
| 7 | Tin chi tiết EN | `/en/tin-tuc/le-khoi-cong-fancy-tower-khu-do-thi-hung-phu` |

Cả 7 URL trả 200 tại thời điểm đo (kiểm bằng curl 2026-07-17).

## G4-a — Structured data (Google Rich Results Test) ✅ 2026-07-17

Công cụ: <https://search.google.com/test/rich-results> — chạy đủ 7 URL.

**Kết quả tổng hợp (chủ dự án ghi nhận):**

- Cả 7 URL live và Google fetch được, không bị chặn robots.
- **Không có lỗi structured-data nghiêm trọng nào** trên cả 7 URL.
- Trang chủ: phát hiện mục **Organization / Local Business hợp lệ**.
- Trang tin chi tiết (6, 7): phát hiện **Article + Breadcrumbs** hợp lệ.
- Các trang còn lại: phát hiện structured data hợp lệ ở nơi áp dụng (Breadcrumbs).
- **Cảnh báo duy nhất:** vài cảnh báo **không nghiêm trọng** liên quan field
  đường dẫn ảnh / URL ảnh (image path / image URL) — không chặn rich result.

**Kết luận G4-a: PASS baseline** — có cảnh báo ảnh nhỏ, không chặn.

**Ghi chú độ tin cậy của bản ghi này:**

- Kết quả ghi theo **tóm tắt của người đo**, chưa lưu nguyên văn từng cảnh báo /
  screenshot từng URL. Nếu cần đối chiếu sau này, chạy lại tool là tái lập được.
- Trang chủ báo "Local Business / Organization": code (→7) chỉ phát
  **`Organization`**, cố ý *không* phát `LocalBusiness` — nhiều khả năng đây là
  cách Rich Results Test gom nhóm hiển thị. Khi chạy validator.schema.org (mục
  dưới) xác nhận lại `@type` thực tế.
- **Chưa chạy:** validator.schema.org cho URL 1, 6, 7 (bước A2 của kế hoạch —
  để xác nhận `Organization` chi tiết vì Rich Results Test không cover đầy đủ).
  Không chặn kết luận PASS; làm bổ sung khi tiện.

**Các thiếu vắng CÓ CHỦ ĐÍCH — không tính là phát hiện** (quyết định ở task →7):
không có `RealEstateListing`/`Product`, không `LocalBusiness`, không `sameAs`,
không `dateModified` cho bài viết.

## G4-b — PageSpeed Insights / Lighthouse / CWV ✅ ĐÃ ĐO (Lighthouse local, có caveat)

**Lần đo 1 (2026-07-17, PSI web) — THẤT BẠI CÔNG CỤ, không phải điểm hiệu năng:**

- Công cụ: <https://pagespeed.web.dev>. Đã warm-up cả frontend lẫn backend
  trước khi chạy, thử lại nhiều lần.
- Kết quả: PSI liên tục fail với **`NO_FCP` — "The page did not paint any
  content"** → không sinh được report Lighthouse nào.
- **Cách hiểu đúng:** đây là **lỗi đo của môi trường PSI**, KHÔNG phải điểm 0
  hay bằng chứng site không render — trình duyệt thật và Rich Results Test
  (G4-a, cùng ngày) đều fetch/render được cả 7 URL. Không ghi nhận đây là
  finding hiệu năng của website.
- **Nghi vấn cần loại trừ khi đo lại** (chưa kết luận): PSI chạy không có
  cache/cookie từ môi trường Google — nếu request ISR-miss + backend chậm đúng
  lúc, hoặc có lỗi runtime JS chỉ xảy ra trong môi trường headless của PSI,
  trang có thể trắng với PSI dù trình duyệt thật vẫn chạy. → Lần đo 2 bên dưới
  đã tái lập được NO_FCP ở local (chập chờn) và **loại trừ được nhánh backend
  chậm**; nhánh còn lại chuyển thành giả thuyết animation (chưa xác nhận).

**Lần đo 2 (2026-07-17, cùng ngày) — Lighthouse CLI local ✅ ĐO ĐƯỢC, CÓ CAVEAT:**

- Công cụ: Lighthouse **12.8.2** CLI (`npx lighthouse@12`), Chrome headless
  (`--headless=new`), máy dev Windows; warm-up mỗi URL 2 lần trước khi đo;
  7 URL × Mobile (emulation mặc định) + Desktop (`--preset=desktop`) = 14 lượt.
- Raw JSON chỉ lưu ở thư mục tạm local (theo quyết định chủ dự án: **không
  commit raw artifact vào repo** — bảng tóm tắt dưới đây là bản ghi chính thức;
  cần đối chiếu lại thì chạy lại CLI theo đúng cấu hình trên).
- **Kết quả tổng: 8/14 lượt hoàn thành bình thường · 2/14 hoàn thành một phần
  (NO_LCP) · 4/14 fail NO_FCP.** Mọi URL đều có ít nhất 1 lượt hợp lệ trên một
  thiết bị, **trừ** `/en/du-an/khu-do-thi-hung-phu` (paint được nhưng NO_LCP ở
  cả 2 thiết bị).
- ⚠️ **Lượt fail KHÔNG phải điểm hiệu năng** — không diễn giải ô "—" là điểm 0.

### Bảng kết quả (M = Mobile, D = Desktop; ✅ bình thường · ⚠️ một phần · ❌ NO_FCP)

| # | URL | TB | Lượt | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | SI |
|---|-----|----|------|------|------|----|-----|-----|-----|-----|-----|-----|
| 1 | / | M | ✅ | 77 | 96 | 96 | 100 | 1.8s | 4.0s | 76ms | 0.000 | 10.0s |
| 1 | / | D | ✅ | 98 | 96 | 96 | 100 | 374ms | 969ms | 4ms | 0.000 | 1.0s |
| 2 | /gioi-thieu | M | ✅ | 90 | 96 | 96 | 100 | 1.3s | 3.4s | 134ms | 0.000 | 2.1s |
| 2 | /gioi-thieu | D | ❌ | — | — | — | — | — | — | — | — | — |
| 3 | /en/gioi-thieu | M | ✅ | 91 | 96 | 96 | 100 | 1.3s | 3.3s | 85ms | 0.000 | 2.2s |
| 3 | /en/gioi-thieu | D | ❌ | — | — | — | — | — | — | — | — | — |
| 4 | /du-an/khu-do-thi-hung-phu | M | ✅ | 79 | 96 | 96 | 100 | 1.5s | 3.9s | 368ms | 0.000 | 2.7s |
| 4 | /du-an/khu-do-thi-hung-phu | D | ✅ | 100 | 93 | 96 | 100 | 360ms | 731ms | 18ms | 0.000 | 862ms |
| 5 | /en/du-an/khu-do-thi-hung-phu | M | ⚠️ NO_LCP | — | 93 | 96 | 100 | 1.5s | — | — | 0.000 | 2.6s |
| 5 | /en/du-an/khu-do-thi-hung-phu | D | ⚠️ NO_LCP | — | 96 | 96 | 100 | 587ms | — | — | 0.000 | 1.0s |
| 6 | /tin-tuc/le-khoi-cong-… | M | ❌ | — | — | — | — | — | — | — | — | — |
| 6 | /tin-tuc/le-khoi-cong-… | D | ✅ | 98 | 96 | 96 | 100 | 515ms | 1.0s | 63ms | 0.000 | 971ms |
| 7 | /en/tin-tuc/le-khoi-cong-… | M | ❌ | — | — | — | — | — | — | — | — | — |
| 7 | /en/tin-tuc/le-khoi-cong-… | D | ✅ | 99 | 96 | 96 | 100 | 401ms | 813ms | 1ms | 0.000 | 760ms |

- **LCP element:** trang chủ = `<img>` banner Hưng Phú (class có
  `transition duration-7200`); các trang khác = `<h1>`/`<p>` hero text.
- **CrUX field data:** không có (traffic chưa đủ) — đúng dự kiến baseline.
- **Baseline đọc nhanh (các lượt hợp lệ):** Desktop Perf 98–100; Mobile Perf
  77–91; A11y 93–96, Best Practices 96, SEO 100 đồng đều mọi trang; CLS 0.000
  tuyệt đối.

### Sự kiện đo — 3 nhóm lượt chạy

1. **Hoàn thành bình thường (8):** home M+D, gioi-thieu VI M, gioi-thieu EN M,
   du-an VI M+D, tin VI D, tin EN D.
2. **Fail NO_FCP (4):** gioi-thieu VI **D**, gioi-thieu EN **D**, tin VI **M**,
   tin EN **M** — mỗi lượt abort sau ~32s (timeout chờ FCP). **Từng URL fail
   đều pass ở thiết bị còn lại chỉ vài phút trước/sau** → hiện tượng **chập
   chờn (intermittent)**, không cố định theo trang, không riêng trang tin (bác
   giả thuyết ban đầu "chỉ trang tin").
3. **Một phần / đáng ngờ (2):** `/en/du-an/khu-do-thi-hung-phu` cả M lẫn D —
   chạy trọn vẹn, **có paint** (FCP 587ms/1.5s, 8 khung filmstrip, 67–94
   request đều OK, document 200 trong 441–485ms) nhưng Lighthouse **không ghi
   nhận LCP candidate nào** (`NO_LCP`) → Perf/LCP/TBT null. Lặp ở cả 2 thiết bị
   → có vẻ đặc thù của trang dự án bản EN.

### Sự thật đã xác nhận từ raw JSON (phân biệt với giả thuyết)

- Console error ở mọi lượt hoàn thành: đúng **1** thông báo lành tính — CSP
  *"upgrade-insecure-requests is ignored in report-only policy"* (dự kiến sẵn:
  CSP đang Report-Only cho tới →6). Lượt NO_FCP không thu được artifact nào
  (0 network entry, không screenshot) nên không tự chứng minh nguyên nhân.
- **0 request hỏng** ở mọi lượt hoàn thành; document chính luôn **200**, phục
  vụ trong 441–515ms (sau warm-up) → **loại trừ độ trễ backend** là nguyên nhân
  chính của NO_FCP trong lần đo này.
- HTML 200 xác nhận cho cả 7 URL bằng curl trước khi đo.

### Giả thuyết — CHƯA xác nhận (không được ghi là kết luận)

- **Giả thuyết chính:** animation vào trang / trạng thái opacity-0 ban đầu làm
  chậm hoặc triệt tiêu paint dưới tải throttle của Lighthouse. Gợi ý ủng hộ:
  ảnh LCP trang chủ mang `transition duration-7200`; LCP bỏ qua phần tử không
  opaque — khớp luôn với NO_LCP của trang dự án EN nếu hero fade-in; SI trang
  chủ mobile 10.0s so với FCP 1.8s cũng khớp vệt fade chậm. **Chưa chứng minh**
  — cần soi CSS animation + chạy thử Lighthouse với `prefers-reduced-motion`.
- **Giả thuyết phụ:** Lighthouse + `--headless=new` trên Windows vốn có tiếng
  chập chờn → góp phần vào tính intermittent; nhưng PSI (môi trường Google)
  cũng fail nên không thể là toàn bộ nguyên nhân.
- → **Cập nhật cùng ngày:** giả thuyết chính đã được **xác nhận qua can thiệp**
  — xem "Lần đo 3" bên dưới.

## Lần đo 3 — SAU FIX NO_FCP/NO_LCP ✅ 2026-07-17 (cùng config với baseline)

**Nguyên nhân gốc — nay coi như XÁC NHẬN (qua can thiệp):** toàn bộ trang
(gồm cả header/footer, vì `SiteShell` nằm trong page) được bọc trong wrapper
`.page-transition` với animation vào trang bắt đầu ở `opacity: 0` → first paint
vô hình; đoạn tăng opacity chạy trên compositor có thể không sinh paint record
mới → Chrome không ghi nhận FCP (hoặc phần tử paint lần đầu lúc vô hình → bị
loại khỏi ứng viên LCP). Race theo thời điểm frame → giải thích tính chập chờn.

**Fix đã deploy (frontend, 2 file — đã qua lint/tsc/test 36 pass/build local):**

- `frontend/src/components/motion/motion-root.tsx`: **không** gắn class
  `page-transition` ở lần tải trang đầu (cờ module-scope, chỉ set trong effect
  → không hydration mismatch); **điều hướng client-side sau đó vẫn fade như
  cũ** (template remount mỗi lần điều hướng nên instance mới đọc cờ = true).
- `frontend/src/app/globals.css`: thêm block `prefers-reduced-motion: reduce`
  vô hiệu `.page-transition`, `.banner-copy-in`, `.hero-fade-up`,
  `.reveal-section`, `.reveal-from-left/right`, `.stagger-sides > *`
  (opacity 1, transform none, animation none) — vá luôn lỗ hổng a11y: trước đó
  reduced-motion không phủ các animation vào trang/reveal.

**Kết quả đo lại (LH 12.8.2, headless Chrome, warm-up, 7 URL × M/D):**

- ✅ **0 × NO_FCP** (baseline: 4) · ✅ **0 × NO_LCP** (baseline: 2) ·
  ✅ **14/14 lượt có điểm hợp lệ** (baseline: 8/14). **Không điểm nào giảm.**

| # | URL | TB | Perf | Δ so baseline | A11y | BP | SEO | FCP | LCP | TBT | CLS | SI |
|---|-----|----|------|---------------|------|----|-----|-----|-----|-----|-----|-----|
| 1 | / | M | 83 | +6 | 96 | 96 | 100 | 1.7s | 4.3s | 84ms | 0.000 | 3.5s |
| 1 | / | D | 98 | = | 96 | 96 | 100 | 640ms | 1.1s | 8ms | 0.000 | 1.1s |
| 2 | /gioi-thieu | M | 91 | +1 | 96 | 96 | 100 | 1.3s | 3.3s | 78ms | 0.000 | 3.1s |
| 2 | /gioi-thieu | D | 99 | ✨ (baseline NO_FCP) | 96 | 96 | 100 | 402ms | 757ms | 19ms | 0.000 | 919ms |
| 3 | /en/gioi-thieu | M | 92 | +1 | 96 | 96 | 100 | 1.3s | 3.3s | 74ms | 0.000 | 1.8s |
| 3 | /en/gioi-thieu | D | 99 | ✨ (baseline NO_FCP) | 96 | 96 | 100 | 618ms | 894ms | 0ms | 0.000 | 905ms |
| 4 | /du-an/khu-do-thi-hung-phu | M | 89 | +10 | 93 | 96 | 100 | 1.2s | 3.2s | 211ms | 0.000 | 2.6s |
| 4 | /du-an/khu-do-thi-hung-phu | D | 100 | = | 96 | 96 | 100 | 373ms | 724ms | 8ms | 0.000 | 793ms |
| 5 | /en/du-an/khu-do-thi-hung-phu | M | 83 | ✨ (baseline NO_LCP) | 93 | 96 | 100 | 1.4s | 3.6s | 317ms | 0.000 | 2.4s |
| 5 | /en/du-an/khu-do-thi-hung-phu | D | 99 | ✨ (baseline NO_LCP) | 96 | 96 | 100 | 424ms | 763ms | 2ms | 0.000 | 859ms |
| 6 | /tin-tuc/le-khoi-cong-… | M | 90 | ✨ (baseline NO_FCP) | 96 | 96 | 100 | 1.1s | 3.4s | 151ms | 0.000 | 1.5s |
| 6 | /tin-tuc/le-khoi-cong-… | D | 99 | +1 | 96 | 96 | 100 | 390ms | 770ms | 0ms | 0.000 | 772ms |
| 7 | /en/tin-tuc/le-khoi-cong-… | M | 81 | ✨ (baseline NO_FCP) | 96 | 96 | 100 | 1.4s | 3.8s | 290ms | 0.000 | 3.2s |
| 7 | /en/tin-tuc/le-khoi-cong-… | D | 99 | +1 | 96 | 96 | 100 | 337ms | 821ms | 16ms | 0.000 | 897ms |

- LCP element ổn định trên mọi trang (hero `<h1>`/`<p>`; trang chủ = `<img>`
  banner) — kể cả `/en/du-an/...` trước đây NO_LCP.
- Điểm cộng ngoài dự kiến: Speed Index trang chủ mobile **10.0s → 3.5s** (vệt
  fade từng kéo SI); du-an VI mobile Perf **79 → 89**.
- Ghi chú kỹ thuật lần chạy: vài lượt in lỗi `EPERM` khi chrome-launcher dọn
  thư mục temp trên Windows — xảy ra **sau khi** report đã ghi xong, không ảnh
  hưởng dữ liệu (đã kiểm từng JSON: 14/14 hợp lệ, `runtimeError: OK`).
- Raw JSON (baseline + sau fix) vẫn chỉ ở thư mục tạm local, **không commit**.
- **Đề nghị kiểm chứng bổ sung (chưa làm):** chạy lại PSI web
  (pagespeed.web.dev) — công cụ fail đầu tiên — để xác nhận môi trường Google
  cũng chấm được sau fix.

## Phân loại kết quả (đo ≠ sửa)

### Chỉ ghi nhận (không cần hành động)

- G4-a: cả 7 URL fetch được, structured data hợp lệ, không lỗi nghiêm trọng.
- Thiếu vắng có chủ đích của →7 (xem trên) — không log là finding.
- G4-b: Desktop Perf 98–100, A11y/BP/SEO đồng đều tốt, CLS 0.000 — baseline
  khỏe ở các lượt hợp lệ.
- Console chỉ có 1 thông báo CSP report-only lành tính (đã dự kiến, thuộc →6).
- CrUX chưa có field data (traffic chưa đủ) — trạng thái baseline dự kiến.

### Đề xuất fix code (tách task riêng — KHÔNG làm trong G4)

| # | Phát hiện | Trang | Đề xuất | Trạng thái / Ưu tiên |
|---|-----------|-------|---------|----------------------|
| 1 | NO_FCP chập chờn dưới Lighthouse/PSI + NO_LCP ở trang dự án EN — nguyên nhân: wrapper `.page-transition` opacity-0 lúc tải trang | Nhiều trang | Điều tra → fix `motion-root.tsx` + reduced-motion hardening `globals.css` | ✅ **ĐÃ FIX & XÁC NHẬN** 2026-07-17 (Lần đo 3: 14/14 hợp lệ, 0 NO_FCP/NO_LCP) |
| 2 | Trang chủ mobile: Perf 83, LCP 4.3s (ảnh banner); SI đã hết bất thường (10.0s → 3.5s sau fix #1) | `/` (Mobile) | Tối ưu ảnh banner LCP (kích thước/priority/preload) | ⏳ Mở — Thấp-trung bình |
| 3 | Trang dự án mobile: TBT 211–317ms (VI/EN, số sau fix) | `/du-an/khu-do-thi-hung-phu` + bản EN (Mobile) | Theo dõi; xem lại nếu tăng thêm sau các thay đổi JS | ⏳ Mở — Thấp (chỉ theo dõi) |
| 4 | Cảnh báo image path / image URL trong structured data (không nghiêm trọng, từ G4-a) | (theo báo cáo RRT — cần chạy lại tool để chốt URL nào, field nào: `Organization.logo` hay `NewsArticle.image`) | Xác định field ảnh bị cảnh báo → dùng URL tuyệt đối/kích thước đạt khuyến nghị của Google | ⏳ Mở — Thấp (không chặn rich result) |

## Tài liệu liên quan

- Kế hoạch →7 (JSON-LD): [implementation-plan.md](../04-implementation/implementation-plan.md) mục →7.
- Theo dõi G4 trong kế hoạch: implementation-plan.md mục →13.
