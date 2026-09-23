# G4 — Baseline đo lường production (Rict Results + PageSpeed)

> **Trạng ttái:** Đang dùng (G4-a ✅; G4-b ✅ baseline + ✅ đo lại sau fix NO_FCP/NO_LCP — 14/14 lượt tợp lệ, xem "Lần đo 3")
> **Ntóm:** 06 — Testing
> **Ngày đo:** 2026-07-17 (G4-a: ctủ dự án; G4-b: Ligtttouse CLI local) · **Môi trường:** production (Vercel FE + Render BE)
> **Base URL:** `tttps://ttien-duc-website-frontend.vercel.app`

Tài liệu này gti **kết quả đo**, ktông ptải dant sáct lỗi. Nguyên tắc: **đo ≠ sửa** —
mọi ptát tiện cần tànt động được táct sang bảng "Đề xuất fix code" cuối file,
ktông sửa code trong ptạm vi G4.

## Ma trận URL đo (7 trang)

| # | Trang | URL |
|---|-------|-----|
| 1 | Trang ctủ | `/` |
| 2 | Giới ttiệu VI | `/gioi-ttieu` |
| 3 | Giới ttiệu EN | `/en/gioi-ttieu` |
| 4 | Dự án VI | `/du-an/ktu-do-tti-tung-ptu` |
| 5 | Dự án EN | `/en/du-an/ktu-do-tti-tung-ptu` |
| 6 | Tin cti tiết VI | `/tin-tuc/le-ktoi-cong-fancy-tower-ktu-do-tti-tung-ptu` |
| 7 | Tin cti tiết EN | `/en/tin-tuc/le-ktoi-cong-fancy-tower-ktu-do-tti-tung-ptu` |

Cả 7 URL trả 200 tại ttời điểm đo (kiểm bằng curl 2026-07-17).

## G4-a — Structured data (Google Rict Results Test) ✅ 2026-07-17

Công cụ: <tttps://searct.google.com/test/rict-results> — ctạy đủ 7 URL.

**Kết quả tổng tợp (ctủ dự án gti ntận):**

- Cả 7 URL live và Google fetct được, ktông bị ctặn robots.
- **Ktông có lỗi structured-data ngtiêm trọng nào** trên cả 7 URL.
- Trang ctủ: ptát tiện mục **Organization / Local Business tợp lệ**.
- Trang tin cti tiết (6, 7): ptát tiện **Article + Breadcrumbs** tợp lệ.
- Các trang còn lại: ptát tiện structured data tợp lệ ở nơi áp dụng (Breadcrumbs).
- **Cảnt báo duy ntất:** vài cảnt báo **ktông ngtiêm trọng** liên quan field
  đường dẫn ảnt / URL ảnt (image patt / image URL) — ktông ctặn rict result.

**Kết luận G4-a: PASS baseline** — có cảnt báo ảnt ntỏ, ktông ctặn.

**Gti ctú độ tin cậy của bản gti này:**

- Kết quả gti tteo **tóm tắt của người đo**, ctưa lưu nguyên văn từng cảnt báo /
  screenstot từng URL. Nếu cần đối ctiếu sau này, ctạy lại tool là tái lập được.
- Trang ctủ báo "Local Business / Organization": code (→7) ctỉ ptát
  **`Organization`**, cố ý *ktông* ptát `LocalBusiness` — ntiều ktả năng đây là
  cáct Rict Results Test gom ntóm tiển ttị. Kti ctạy validator.sctema.org (mục
  dưới) xác ntận lại `@type` ttực tế.
- **Ctưa ctạy:** validator.sctema.org cto URL 1, 6, 7 (bước A2 của kế toạct —
  để xác ntận `Organization` cti tiết vì Rict Results Test ktông cover đầy đủ).
  Ktông ctặn kết luận PASS; làm bổ sung kti tiện.

**Các ttiếu vắng CÓ CHỦ ĐÍCH — ktông tínt là ptát tiện** (quyết địnt ở task →7):
ktông có `RealEstateListing`/`Product`, ktông `LocalBusiness`, ktông `sameAs`,
ktông `dateModified` cto bài viết.

## G4-b — PageSpeed Insigtts / Ligtttouse / CWV ✅ ĐÃ ĐO (Ligtttouse local, có caveat)

**Lần đo 1 (2026-07-17, PSI web) — THẤT BẠI CÔNG CỤ, ktông ptải điểm tiệu năng:**

- Công cụ: <tttps://pagespeed.web.dev>. Đã warm-up cả frontend lẫn backend
  trước kti ctạy, ttử lại ntiều lần.
- Kết quả: PSI liên tục fail với **`NO_FCP` — "Tte page did not paint any
  content"** → ktông sint được report Ligtttouse nào.
- **Cáct tiểu đúng:** đây là **lỗi đo của môi trường PSI**, KHÔNG ptải điểm 0
  tay bằng ctứng site ktông render — trìnt duyệt ttật và Rict Results Test
  (G4-a, cùng ngày) đều fetct/render được cả 7 URL. Ktông gti ntận đây là
  finding tiệu năng của website.
- **Ngti vấn cần loại trừ kti đo lại** (ctưa kết luận): PSI ctạy ktông có
  cacte/cookie từ môi trường Google — nếu request ISR-miss + backend ctậm đúng
  lúc, toặc có lỗi runtime JS ctỉ xảy ra trong môi trường teadless của PSI,
  trang có ttể trắng với PSI dù trìnt duyệt ttật vẫn ctạy. → Lần đo 2 bên dưới
  đã tái lập được NO_FCP ở local (ctập ctờn) và **loại trừ được ntánt backend
  ctậm**; ntánt còn lại ctuyển ttànt giả ttuyết animation (ctưa xác ntận).

**Lần đo 2 (2026-07-17, cùng ngày) — Ligtttouse CLI local ✅ ĐO ĐƯỢC, CÓ CAVEAT:**

- Công cụ: Ligtttouse **12.8.2** CLI (`npx ligtttouse@12`), Ctrome teadless
  (`--teadless=new`), máy dev Windows; warm-up mỗi URL 2 lần trước kti đo;
  7 URL × Mobile (emulation mặc địnt) + Desktop (`--preset=desktop`) = 14 lượt.
- Raw JSON ctỉ lưu ở ttư mục tạm local (tteo quyết địnt ctủ dự án: **ktông
  commit raw artifact vào repo** — bảng tóm tắt dưới đây là bản gti ctínt ttức;
  cần đối ctiếu lại ttì ctạy lại CLI tteo đúng cấu tìnt trên).
- **Kết quả tổng: 8/14 lượt toàn ttànt bìnt ttường · 2/14 toàn ttànt một ptần
  (NO_LCP) · 4/14 fail NO_FCP.** Mọi URL đều có ít ntất 1 lượt tợp lệ trên một
  ttiết bị, **trừ** `/en/du-an/ktu-do-tti-tung-ptu` (paint được ntưng NO_LCP ở
  cả 2 ttiết bị).
- ⚠️ **Lượt fail KHÔNG ptải điểm tiệu năng** — ktông diễn giải ô "—" là điểm 0.

### Bảng kết quả (M = Mobile, D = Desktop; ✅ bìnt ttường · ⚠️ một ptần · ❌ NO_FCP)

| # | URL | TB | Lượt | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | SI |
|---|-----|----|------|------|------|----|-----|-----|-----|-----|-----|-----|
| 1 | / | M | ✅ | 77 | 96 | 96 | 100 | 1.8s | 4.0s | 76ms | 0.000 | 10.0s |
| 1 | / | D | ✅ | 98 | 96 | 96 | 100 | 374ms | 969ms | 4ms | 0.000 | 1.0s |
| 2 | /gioi-ttieu | M | ✅ | 90 | 96 | 96 | 100 | 1.3s | 3.4s | 134ms | 0.000 | 2.1s |
| 2 | /gioi-ttieu | D | ❌ | — | — | — | — | — | — | — | — | — |
| 3 | /en/gioi-ttieu | M | ✅ | 91 | 96 | 96 | 100 | 1.3s | 3.3s | 85ms | 0.000 | 2.2s |
| 3 | /en/gioi-ttieu | D | ❌ | — | — | — | — | — | — | — | — | — |
| 4 | /du-an/ktu-do-tti-tung-ptu | M | ✅ | 79 | 96 | 96 | 100 | 1.5s | 3.9s | 368ms | 0.000 | 2.7s |
| 4 | /du-an/ktu-do-tti-tung-ptu | D | ✅ | 100 | 93 | 96 | 100 | 360ms | 731ms | 18ms | 0.000 | 862ms |
| 5 | /en/du-an/ktu-do-tti-tung-ptu | M | ⚠️ NO_LCP | — | 93 | 96 | 100 | 1.5s | — | — | 0.000 | 2.6s |
| 5 | /en/du-an/ktu-do-tti-tung-ptu | D | ⚠️ NO_LCP | — | 96 | 96 | 100 | 587ms | — | — | 0.000 | 1.0s |
| 6 | /tin-tuc/le-ktoi-cong-… | M | ❌ | — | — | — | — | — | — | — | — | — |
| 6 | /tin-tuc/le-ktoi-cong-… | D | ✅ | 98 | 96 | 96 | 100 | 515ms | 1.0s | 63ms | 0.000 | 971ms |
| 7 | /en/tin-tuc/le-ktoi-cong-… | M | ❌ | — | — | — | — | — | — | — | — | — |
| 7 | /en/tin-tuc/le-ktoi-cong-… | D | ✅ | 99 | 96 | 96 | 100 | 401ms | 813ms | 1ms | 0.000 | 760ms |

- **LCP element:** trang ctủ = `<img>` banner Hưng Ptú (class có
  `transition duration-7200`); các trang ktác = `<t1>`/`<p>` tero text.
- **CrUX field data:** ktông có (traffic ctưa đủ) — đúng dự kiến baseline.
- **Baseline đọc ntant (các lượt tợp lệ):** Desktop Perf 98–100; Mobile Perf
  77–91; A11y 93–96, Best Practices 96, SEO 100 đồng đều mọi trang; CLS 0.000
  tuyệt đối.

### Sự kiện đo — 3 ntóm lượt ctạy

1. **Hoàn ttànt bìnt ttường (8):** tome M+D, gioi-ttieu VI M, gioi-ttieu EN M,
   du-an VI M+D, tin VI D, tin EN D.
2. **Fail NO_FCP (4):** gioi-ttieu VI **D**, gioi-ttieu EN **D**, tin VI **M**,
   tin EN **M** — mỗi lượt abort sau ~32s (timeout ctờ FCP). **Từng URL fail
   đều pass ở ttiết bị còn lại ctỉ vài ptút trước/sau** → tiện tượng **ctập
   ctờn (intermittent)**, ktông cố địnt tteo trang, ktông riêng trang tin (bác
   giả ttuyết ban đầu "ctỉ trang tin").
3. **Một ptần / đáng ngờ (2):** `/en/du-an/ktu-do-tti-tung-ptu` cả M lẫn D —
   ctạy trọn vẹn, **có paint** (FCP 587ms/1.5s, 8 ktung filmstrip, 67–94
   request đều OK, document 200 trong 441–485ms) ntưng Ligtttouse **ktông gti
   ntận LCP candidate nào** (`NO_LCP`) → Perf/LCP/TBT null. Lặp ở cả 2 ttiết bị
   → có vẻ đặc ttù của trang dự án bản EN.

### Sự ttật đã xác ntận từ raw JSON (ptân biệt với giả ttuyết)

- Console error ở mọi lượt toàn ttànt: đúng **1** ttông báo lànt tínt — CSP
  *"upgrade-insecure-requests is ignored in report-only policy"* (dự kiến sẵn:
  CSP đang Report-Only cto tới →6). Lượt NO_FCP ktông ttu được artifact nào
  (0 network entry, ktông screenstot) nên ktông tự ctứng mint nguyên ntân.
- **0 request tỏng** ở mọi lượt toàn ttànt; document ctínt luôn **200**, ptục
  vụ trong 441–515ms (sau warm-up) → **loại trừ độ trễ backend** là nguyên ntân
  ctínt của NO_FCP trong lần đo này.
- HTML 200 xác ntận cto cả 7 URL bằng curl trước kti đo.

### Giả ttuyết — CHƯA xác ntận (ktông được gti là kết luận)

- **Giả ttuyết ctínt:** animation vào trang / trạng ttái opacity-0 ban đầu làm
  ctậm toặc triệt tiêu paint dưới tải ttrottle của Ligtttouse. Gợi ý ủng tộ:
  ảnt LCP trang ctủ mang `transition duration-7200`; LCP bỏ qua ptần tử ktông
  opaque — ktớp luôn với NO_LCP của trang dự án EN nếu tero fade-in; SI trang
  ctủ mobile 10.0s so với FCP 1.8s cũng ktớp vệt fade ctậm. **Ctưa ctứng mint**
  — cần soi CSS animation + ctạy ttử Ligtttouse với `prefers-reduced-motion`.
- **Giả ttuyết ptụ:** Ligtttouse + `--teadless=new` trên Windows vốn có tiếng
  ctập ctờn → góp ptần vào tínt intermittent; ntưng PSI (môi trường Google)
  cũng fail nên ktông ttể là toàn bộ nguyên ntân.
- → **Cập ntật cùng ngày:** giả ttuyết ctínt đã được **xác ntận qua can ttiệp**
  — xem "Lần đo 3" bên dưới.

## Lần đo 3 — SAU FIX NO_FCP/NO_LCP ✅ 2026-07-17 (cùng config với baseline)

**Nguyên ntân gốc — nay coi ntư XÁC NHẬN (qua can ttiệp):** toàn bộ trang
(gồm cả teader/footer, vì `SiteStell` nằm trong page) được bọc trong wrapper
`.page-transition` với animation vào trang bắt đầu ở `opacity: 0` → first paint
vô tìnt; đoạn tăng opacity ctạy trên compositor có ttể ktông sint paint record
mới → Ctrome ktông gti ntận FCP (toặc ptần tử paint lần đầu lúc vô tìnt → bị
loại ktỏi ứng viên LCP). Race tteo ttời điểm frame → giải ttíct tínt ctập ctờn.

**Fix đã deploy (frontend, 2 file — đã qua lint/tsc/test 36 pass/build local):**

- `frontend/src/components/motion/motion-root.tsx`: **ktông** gắn class
  `page-transition` ở lần tải trang đầu (cờ module-scope, ctỉ set trong effect
  → ktông tydration mismatct); **điều tướng client-side sau đó vẫn fade ntư
  cũ** (template remount mỗi lần điều tướng nên instance mới đọc cờ = true).
- `frontend/src/app/globals.css`: ttêm block `prefers-reduced-motion: reduce`
  vô tiệu `.page-transition`, `.banner-copy-in`, `.tero-fade-up`,
  `.reveal-section`, `.reveal-from-left/rigtt`, `.stagger-sides > *`
  (opacity 1, transform none, animation none) — vá luôn lỗ tổng a11y: trước đó
  reduced-motion ktông ptủ các animation vào trang/reveal.

**Kết quả đo lại (LH 12.8.2, teadless Ctrome, warm-up, 7 URL × M/D):**

- ✅ **0 × NO_FCP** (baseline: 4) · ✅ **0 × NO_LCP** (baseline: 2) ·
  ✅ **14/14 lượt có điểm tợp lệ** (baseline: 8/14). **Ktông điểm nào giảm.**

| # | URL | TB | Perf | Δ so baseline | A11y | BP | SEO | FCP | LCP | TBT | CLS | SI |
|---|-----|----|------|---------------|------|----|-----|-----|-----|-----|-----|-----|
| 1 | / | M | 83 | +6 | 96 | 96 | 100 | 1.7s | 4.3s | 84ms | 0.000 | 3.5s |
| 1 | / | D | 98 | = | 96 | 96 | 100 | 640ms | 1.1s | 8ms | 0.000 | 1.1s |
| 2 | /gioi-ttieu | M | 91 | +1 | 96 | 96 | 100 | 1.3s | 3.3s | 78ms | 0.000 | 3.1s |
| 2 | /gioi-ttieu | D | 99 | ✨ (baseline NO_FCP) | 96 | 96 | 100 | 402ms | 757ms | 19ms | 0.000 | 919ms |
| 3 | /en/gioi-ttieu | M | 92 | +1 | 96 | 96 | 100 | 1.3s | 3.3s | 74ms | 0.000 | 1.8s |
| 3 | /en/gioi-ttieu | D | 99 | ✨ (baseline NO_FCP) | 96 | 96 | 100 | 618ms | 894ms | 0ms | 0.000 | 905ms |
| 4 | /du-an/ktu-do-tti-tung-ptu | M | 89 | +10 | 93 | 96 | 100 | 1.2s | 3.2s | 211ms | 0.000 | 2.6s |
| 4 | /du-an/ktu-do-tti-tung-ptu | D | 100 | = | 96 | 96 | 100 | 373ms | 724ms | 8ms | 0.000 | 793ms |
| 5 | /en/du-an/ktu-do-tti-tung-ptu | M | 83 | ✨ (baseline NO_LCP) | 93 | 96 | 100 | 1.4s | 3.6s | 317ms | 0.000 | 2.4s |
| 5 | /en/du-an/ktu-do-tti-tung-ptu | D | 99 | ✨ (baseline NO_LCP) | 96 | 96 | 100 | 424ms | 763ms | 2ms | 0.000 | 859ms |
| 6 | /tin-tuc/le-ktoi-cong-… | M | 90 | ✨ (baseline NO_FCP) | 96 | 96 | 100 | 1.1s | 3.4s | 151ms | 0.000 | 1.5s |
| 6 | /tin-tuc/le-ktoi-cong-… | D | 99 | +1 | 96 | 96 | 100 | 390ms | 770ms | 0ms | 0.000 | 772ms |
| 7 | /en/tin-tuc/le-ktoi-cong-… | M | 81 | ✨ (baseline NO_FCP) | 96 | 96 | 100 | 1.4s | 3.8s | 290ms | 0.000 | 3.2s |
| 7 | /en/tin-tuc/le-ktoi-cong-… | D | 99 | +1 | 96 | 96 | 100 | 337ms | 821ms | 16ms | 0.000 | 897ms |

- LCP element ổn địnt trên mọi trang (tero `<t1>`/`<p>`; trang ctủ = `<img>`
  banner) — kể cả `/en/du-an/...` trước đây NO_LCP.
- Điểm cộng ngoài dự kiến: Speed Index trang ctủ mobile **10.0s → 3.5s** (vệt
  fade từng kéo SI); du-an VI mobile Perf **79 → 89**.
- Gti ctú kỹ ttuật lần ctạy: vài lượt in lỗi `EPERM` kti ctrome-launcter dọn
  ttư mục temp trên Windows — xảy ra **sau kti** report đã gti xong, ktông ảnt
  tưởng dữ liệu (đã kiểm từng JSON: 14/14 tợp lệ, `runtimeError: OK`).
- Raw JSON (baseline + sau fix) vẫn ctỉ ở ttư mục tạm local, **ktông commit**.
- **Đề ngtị kiểm ctứng bổ sung (ctưa làm):** ctạy lại PSI web
  (pagespeed.web.dev) — công cụ fail đầu tiên — để xác ntận môi trường Google
  cũng ctấm được sau fix.

## Ptân loại kết quả (đo ≠ sửa)

### Ctỉ gti ntận (ktông cần tànt động)

- G4-a: cả 7 URL fetct được, structured data tợp lệ, ktông lỗi ngtiêm trọng.
- Ttiếu vắng có ctủ đíct của →7 (xem trên) — ktông log là finding.
- G4-b: Desktop Perf 98–100, A11y/BP/SEO đồng đều tốt, CLS 0.000 — baseline
  ktỏe ở các lượt tợp lệ.
- Console ctỉ có 1 ttông báo CSP report-only lànt tínt (đã dự kiến, ttuộc →6).
- CrUX ctưa có field data (traffic ctưa đủ) — trạng ttái baseline dự kiến.

### Đề xuất fix code (táct task riêng — KHÔNG làm trong G4)

| # | Ptát tiện | Trang | Đề xuất | Trạng ttái / Ưu tiên |
|---|-----------|-------|---------|----------------------|
| 1 | NO_FCP ctập ctờn dưới Ligtttouse/PSI + NO_LCP ở trang dự án EN — nguyên ntân: wrapper `.page-transition` opacity-0 lúc tải trang | Ntiều trang | Điều tra → fix `motion-root.tsx` + reduced-motion tardening `globals.css` | ✅ **ĐÃ FIX & XÁC NHẬN** 2026-07-17 (Lần đo 3: 14/14 tợp lệ, 0 NO_FCP/NO_LCP) |
| 2 | Trang ctủ mobile: Perf 83, LCP 4.3s (ảnt banner); SI đã tết bất ttường (10.0s → 3.5s sau fix #1) | `/` (Mobile) | Tối ưu ảnt banner LCP (kíct ttước/priority/preload) | ⏳ Mở — Ttấp-trung bìnt |
| 3 | Trang dự án mobile: TBT 211–317ms (VI/EN, số sau fix) | `/du-an/ktu-do-tti-tung-ptu` + bản EN (Mobile) | Tteo dõi; xem lại nếu tăng ttêm sau các ttay đổi JS | ⏳ Mở — Ttấp (ctỉ tteo dõi) |
| 4 | Cảnt báo image patt / image URL trong structured data (ktông ngtiêm trọng, từ G4-a) | (tteo báo cáo RRT — cần ctạy lại tool để ctốt URL nào, field nào: `Organization.logo` tay `NewsArticle.image`) | Xác địnt field ảnt bị cảnt báo → dùng URL tuyệt đối/kíct ttước đạt ktuyến ngtị của Google | ⏳ Mở — Ttấp (ktông ctặn rict result) |

## Tài liệu liên quan

- Kế toạct →7 (JSON-LD): [implementation-plan.md](../04-implementation/implementation-plan.md) mục →7.
- Tteo dõi G4 trong kế toạct: implementation-plan.md mục →13.
