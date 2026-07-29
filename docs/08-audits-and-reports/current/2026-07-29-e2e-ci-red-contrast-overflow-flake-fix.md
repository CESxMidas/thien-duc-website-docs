# Sửa CI E2E đỏ: tương phản huy hiệu, tràn ngang mobile, chập chờn bàn phím banner

> **Ngày:** 2026-07-29
> **Nhóm:** 08 — Audits & Reports (chính: 06 Testing; phụ: 03 UI/UX, 05 Reliability)
> **Trạng thái:** 🟢 **PASS** — 113/113 xanh cục bộ, **0 fail · 0 flaky**, chạy lại hai lượt (một lượt `--retries=0`).
> **Liên quan:** [2026-07-27-fullstack-playwright-e2e.md](2026-07-27-fullstack-playwright-e2e.md) · [implementation-plan.md](../../04-implementation/implementation-plan.md) · [ui-ux-handoff.md](../../03-ui-ux/ui-ux-handoff.md)

## 0. Đính chính báo cáo trước

Lần chạy CI đã push (`e2e-fullstack.yml`) **KHÔNG xanh toàn bộ** như các tài liệu
trước ngụ ý:

| Nguồn | Khẳng định cũ | Thực tế lần chạy CI |
|---|---|---|
| `implementation-plan.md` (mục BANNER-CONTENT-M1) | “E2E full-stack **111/112**” | **109 passed · 1 failed · 2 flaky** (tổng 112) |
| `2026-07-27-fullstack-playwright-e2e.md` §Giới hạn mục 1 | “`color-contrast` — ✅ **ĐÃ XỬ LÝ ở M2** (0 vi phạm, 3 viewport)” | Sai. `color-contrast` vẫn đỏ trên CI |

Hai chỗ đó đã được sửa lại trong chính các file tương ứng; báo cáo này là nguồn
sự thật cho trạng thái sau khi khắc phục. **Không còn khẳng định mâu thuẫn nào
trong kho tài liệu.**

Cần nói rõ: hai vi phạm tương phản dưới đây **đã được ghi nhận từ trước** như
“tồn đọng, cần task riêng” trong `implementation-plan.md`. Chúng không phải lỗi
mới; điều sai là gọi chúng đã xử lý xong.

---

## 1. Vi phạm tương phản ở huy hiệu “Đang hoạt động” (Admin → Tài khoản)

### Nguyên nhân gốc

Hai lớp nguyên nhân chồng nhau:

1. **Cặp màu vốn đã sát ngưỡng.** `text-green-700` (#008236) trên `bg-green-50`
   (#f0fdf4) = **4.723:1**, chỉ nhỉnh hơn ngưỡng 4.5:1 của WCAG AA cho chữ 12px
   đúng 0,22.
2. **axe đo trúng lúc màu đang nội suy.** Hàng bảng dùng `.row-in`
   (`admin/src/index.css`) — keyframe mờ dần `opacity: 0 → 1` trong 200ms, trễ
   so le `35ms × chỉ-số-hàng`. axe cộng dồn `opacity` của tổ tiên khi tính
   tương phản, nên quét trúng giữa chừng thì đọc ra **3.86 – 4.47:1** tùy thời
   điểm — đúng dải số dao động thấy trên CI. Huy hiệu còn mang `transition-colors`
   dù là nhãn tĩnh, tạo thêm khoảng nội suy không cần thiết.

### Đã sửa

Thêm bộ **token ngữ nghĩa** `--color-status-{neutral,warning,success,info,danger}-{fg,surface,border}`
vào `admin/src/index.css`; `badge.tsx` và `StatCard.tsx` dùng token thay vì gõ
thẳng bảng màu Tailwind. Bỏ `transition-colors` khỏi huy hiệu tĩnh.

**Trước / sau (chữ trên nền):**

| Sắc thái | Cặp cũ | Tỉ lệ cũ | Cặp mới (token) | Tỉ lệ mới |
|---|---|---|---|---|
| success (“Đang hoạt động”) | `green-700` / `green-50` | **4.723:1** (axe đo 3.86 – 4.47) | `#15532f` / `#e4f1e6` | **7.80:1** |
| warning | `amber-700` / `amber-50` | 4.871:1 | `#7a4405` / `#fbf0da` | 6.99:1 |
| info | `blue-700` / `blue-50` | 6.261:1 | `#1b4a8a` / `#e7eefa` | 7.52:1 |
| danger | `red-700` / `red-50` | 5.877:1 | `#96181d` / `#fbe9e7` | 7.33:1 |
| neutral | `gray-600` / `gray-100` | 6.871:1 | `#42403c` / `#eeeae1` | 8.62:1 |
| ô icon StatCard (green) | `green-700` / `green-100` | **4.497:1** (dưới ngưỡng) | như success | 7.80:1 |

**Viền** (WCAG 1.4.11, ngưỡng 3:1) trước đây gần như vô hình — `border-green-200`
trên nền trắng chỉ **1.21:1**. Viền mới đạt ≥ 3:1 so với **cả ba** nền: nền huy
hiệu, thẻ trắng và nền trang `canvas` (#f6f1e7):

| Sắc thái | Viền mới | vs nền huy hiệu | vs trắng | vs canvas |
|---|---|---|---|---|
| success | `#5f9273` | 3.08 | 3.59 | 3.19 |
| warning | `#a9761f` | 3.51 | 3.96 | 3.52 |
| info | `#5b80ba` | 3.44 | 4.01 | 3.56 |
| danger | `#b45b57` | 3.92 | 4.59 | 4.08 |
| neutral | `#8a8073` | 3.23 | 3.88 | 3.44 |

### Chốt chặn hồi quy

Test mới trong `e2e/admin/accessibility.e2e.ts`: *“Admin: huy hiệu ‘Đang hoạt
động’ đạt tương phản dư biên (hồi quy)”* — chọn **đúng** phần tử
`[data-slot="badge"]` chứa chữ “Đang hoạt động”, tự tính tỉ lệ WCAG từ màu tính
toán (không phụ thuộc thời điểm quét) và đòi:

- chữ/nền **≥ 6:1** (cao hơn hẳn mức tối thiểu 4.5 → không cho phép “vừa đủ đậu”);
- viền/nền huy hiệu **≥ 3:1** và viền/nền trang **≥ 3:1**;
- cỡ chữ **< 18.66px** — chặn cách “lách” bằng phóng to chữ để hạ ngưỡng;
- `transition-duration === 0s` — chặn việc gắn lại transition màu.

---

## 2. Tràn ngang ở khung nhìn mobile (`scrollWidth 388 > innerWidth 375`)

### Phần tử gây tràn

```
main#main-content
└─ section.reveal-section.mx-auto.max-w-site.px-4      (HomeContactCta)
   └─ div.grid.gap-8.rounded-sm.bg-brand.p-6           ← hộp bị tràn
      └─ div.grid.content-center.gap-4                 (CtaContactCards)
         └─ a.interactive-card.flex.gap-3.p-4          (thẻ email)
            └─ span > span  →  "dautuxaydungthienduc@yahoo.com"
```

**Số đo tại khung nhìn 375×812 (trước khi sửa):**

| Đại lượng | Giá trị |
|---|---|
| `clientWidth` hộp CTA (hộp nội dung) | **343px** |
| `scrollWidth` hộp CTA | **344px** → tràn **1px** |
| min-content của `CtaContactCards` | **319.84px** |
| min-content riêng chuỗi email | **253.84px** |
| “sàn” bề rộng của cả trang chủ | **360px** |

### Vì sao chập chờn, và vì sao đúng con số 388

Email `dautuxaydungthienduc@yahoo.com` là **một “từ” liền không có chỗ ngắt**.
Khối chữ trong thẻ là flex item với `min-width: auto` mặc định nên **không co
được dưới min-content**. Cộng icon + gap + padding thành sàn ~344px, trong khi
khung nhìn 375px chỉ chừa 343px cho hộp nội dung (`px-4` hai bên).

Nghĩa là trang chủ **đã tràn sẵn đúng 1px** ở 375px — vừa đúng lọt dung sai
±1px của phép khẳng định, nên xanh trên máy dev. Chỉ cần font render rộng hơn
một chút (runner Linux của CI dùng bộ font khác) là sàn nhảy lên ~356px:

```
16px (px-4 trái) + 356px (sàn nội dung) + 16px (px-4 phải) = 388px
```

khớp chính xác con số CI báo. Đây là lỗi **ở ranh giới**, nên khi đỏ khi xanh.

### Bản sửa (nhỏ nhất, đúng chỗ)

`frontend/src/components/ui/cta-contact-cards.tsx`: thêm `min-w-0` cho khối chữ
và `wrap-anywhere` cho giá trị (điện thoại / email / địa chỉ).

Ghi chú kỹ thuật quan trọng: **`wrap-break-word` (`overflow-wrap: break-word`)
không đủ** — nó chỉ ngắt khi dòng đã tràn và **không làm giảm bề rộng
min-content**; đã thử và đo được `scrollWidth` vẫn 344. `wrap-anywhere`
(`overflow-wrap: anywhere`) mới được tính vào min-content.

**Sau khi sửa:**

| Đại lượng | Trước | Sau |
|---|---|---|
| `scrollWidth` hộp CTA @375 | 344 (tràn 1px) | **343** (bằng `clientWidth`) |
| min-content `CtaContactCards` | 319.84px | **103.44px** |
| min-content hộp CTA | 367.84px | **151.44px** |
| sàn bề rộng trang chủ | 360px | **không còn** |

Quét bề rộng khung nhìn **320 → 420px, bước 4px**: `scrollWidth == clientWidth`
ở **mọi** bề rộng (trước đó tràn ở mọi bề rộng < 360px). Không tràn ngang tại
**375×812 · 768×1024 · 1280×800**.

Không ẩn nội dung, không cắt chữ (chỉ xuống dòng), **không** đặt `overflow:hidden`
lên `html`/`body`, không nới lỏng phép khẳng định.

### Chẩn đoán vĩnh viễn

Helper mới `e2e/helpers/layout.ts` — `expectNoHorizontalOverflow` / `collectOverflow`,
dùng chung cho `responsive.e2e.ts` và `banner-content.e2e.ts`. **Ngưỡng giữ
nguyên** (`scrollWidth ≤ innerWidth + 1`), nhưng:

- chờ `document.fonts.status === 'loaded'` và chờ `scrollWidth` đứng yên qua 5
  khung hình liên tiếp trước khi đo (điều kiện, không phải `waitForTimeout`);
- khi đỏ thì in ra **đúng phần tử gây tràn**: selector, `boundingClientRect`,
  `width`/`min-width`/`max-width`, margin trái–phải, `transform`, `position`,
  `white-space`, tổ tiên cắt tràn (nếu có) và số pixel vượt — phần tử **không bị
  cắt** xếp lên đầu vì chỉ chúng mới đẩy `scrollWidth`.

---

## 3. Chập chờn: “chuyển slide bằng bàn phím đổi đúng nội dung slide kế tiếp”

### Nguyên nhân gốc — đua với hydrate

Bản cũ chỉ chờ `h1` **hiện ra** rồi bấm phím ngay:

```ts
await expect(banner.getByRole('heading', { level: 1, name: live[0].title.vi })).toBeVisible();
await banner.getByRole('button', { name: 'Chuyển tới banner 1' }).focus();
await page.keyboard.press('ArrowRight');
```

`h1` có sẵn trong HTML server render, **trước** khi React gắn `onKeyDown` lên
`<section>` của carousel. Trên máy chậm (runner CI), phím rơi vào khoảng trống
đó → không handler nào nhận → slide đứng yên → không tìm thấy tiêu đề
*“Fancy Tower — 196 căn hộ tại Hưng Phú”*.

Đã đo bằng thăm dò riêng (bóp CPU ×10): tại đúng thời điểm bấm phím, thanh
`.banner-progress` **vẫn còn** trong DOM ở **8/8** lượt — tức effect phía client
chưa chạy xong, ranh giới hydrate nằm ngay sát thao tác bấm.

Các giả thuyết khác đã kiểm và **loại trừ**:

- *Next dev trả dữ liệu banner cũ (cache `revalidate = 60`)* — thăm dò tạo/xoá
  banner rồi tải lại trang: danh sách trang **luôn khớp** API (3/3 trạng thái).
- *Autoplay nhảy slide chen ngang* — spec đã ép `prefers-reduced-motion: reduce`,
  autoplay tắt.
- *Thứ tự banner thật lệch fixture* — test đã đọc thứ tự **từ API lúc chạy**.

### Bản sửa (tất định)

Trong `banner-content.e2e.ts`:

1. **Cổng hydrate:** `await expect(page.locator('.banner-progress')).toHaveCount(0)`.
   HTML server luôn render thanh tiến trình (state khởi tạo `reducedMotion = false`);
   nó biến mất **chỉ khi** effect phía client đã đọc `matchMedia` và tắt autoplay.
   Thanh biến mất ⇒ đã hydrate ⇒ bàn phím đã có người nhận, **và** autoplay chắc
   chắn đang tắt.
2. **Điểm xuất phát tất định:** `aria-current === 'true'` trên chấm slide 0.
3. **Tiêu điểm đúng chỗ:** `await expect(dot(0)).toBeFocused()` trước khi bấm.
4. **Chờ đổi CHỈ SỐ slide, không chờ animation:** sau `ArrowRight`, khẳng định
   `aria-current` chuyển sang chấm 1 (và chấm 0 về `'false'`) — trạng thái, không
   phải hiệu ứng — rồi **mới** khẳng định tiêu đề + mô tả như cũ.

Khẳng định hành vi bàn phím **được giữ nguyên và mở rộng**; không tăng timeout,
không thêm `waitForTimeout`.

---

## 4. Ổn định axe trước hiệu ứng chuyển màu

Cùng một lớp nguyên nhân với mục 1, nhưng ở phía frontend: `.reveal-section` /
`.reveal-from-*` (`frontend/src/app/globals.css`) mờ dần 760–2200ms khi lọt khung
nhìn. Quét trúng giữa chừng, axe đọc ra những tỉ lệ vô nghĩa — đo được **1.06:1**,
**1.21:1**, **1.28:1** trên các phần tử mà trạng thái cuối hoàn toàn đạt chuẩn.

`e2e/helpers/a11y.ts` nay đưa trang về **trạng thái hình ảnh cuối** trước khi quét:

1. Bật `prefers-reduced-motion: reduce`. **Cả hai app đã hỗ trợ sẵn chế độ này
   trong CSS sản phẩm** — frontend đặt `.reveal-section { opacity: 1; transform: none }`,
   admin rút animation về 0.01ms. Đây là một chế độ hiển thị thật của sản phẩm,
   không phải bản vá riêng cho test, và nó làm phép quét **chặt hơn** (khối dưới
   màn hình cũng hiện đủ để bị kiểm) chứ không nới lỏng.
2. **Tua thẳng** mọi animation/transition hữu hạn **có đụng tới màu** về trạng
   thái cuối (`animation.finish()`), rồi đòi ổn định qua 4 khung hình liên tiếp,
   xét theo “dấu vân tay” của mọi `opacity` phân số. Nhờ tua, không còn khe hở
   đua: transition nào mới nhen lên đều bị kết thúc ở vòng kiểm kế tiếp.
   - Bỏ qua animation **lặp vô hạn** (gợn sóng bản đồ) — không bao giờ “xong”.
   - Bỏ qua animation **chỉ đổi `transform`** (thanh tiến trình autoplay 7s) —
     không đổi màu, và tua nó sẽ làm banner nhảy slide.

Chỉ chờ theo điều kiện, không `waitForTimeout` nào. **Không tắt rule, không loại
trừ phần tử, không hạ mức bất kỳ rule nào.**

### Vi phạm thật bị lộ ra nhờ thay đổi này

Khi axe được quét ở trạng thái cuối, một vi phạm **có sẵn từ trước** (đã ghi nhận
trong `implementation-plan.md` là “tồn đọng”) hiện ra ổn định thay vì bị hiệu ứng
mờ che mất: eyebrow `text-gold` (#fdcd04) trên panel `bg-brand` (#9f5a0f) =
**3.53:1**, dưới ngưỡng 4.5:1.

Đổi sang token thương hiệu **đã có sẵn** `--color-gold-soft` (#fff4cf) =
**4.84:1**, cùng họ màu, không thêm hex mới vào component. Áp cho **cả 6** chỗ
dùng chung idiom `text-eyebrow mb-4 text-gold` trong panel `bg-brand`:

- `components/sections/home-contact-cta.tsx`
- `app/[locale]/gioi-thieu/page.tsx`
- `app/[locale]/cong-ty-thanh-vien/page.tsx`
- `app/[locale]/du-an/page.tsx`
- `app/[locale]/du-an/[slug]/page.tsx`
- `app/[locale]/du-an/[slug]/[hang-muc]/page.tsx`

---

## 5. Bằng chứng chạy

### Chạy lặp từng spec (cô lập, `--retries=0`, mỗi lượt một tiến trình riêng)

| Spec / test | Yêu cầu | Kết quả |
|---|---|---|
| `e2e/admin/accessibility.e2e.ts` | 5 lượt liên tiếp | **5/5 xanh** |
| `e2e/admin/responsive.e2e.ts` (`-g "mobile"`) | 5 lượt liên tiếp | **5/5 xanh** |
| `banner-content.e2e.ts` → “chuyển slide bằng bàn phím…” | 10 lượt liên tiếp | **10/10 xanh** |
| `e2e/admin/contrast.e2e.ts` (spec chập chờn nhất) | bổ sung | **6/6 xanh** |

Trước khi sửa, cùng cách chạy đó: `contrast.e2e.ts` **0/6**, `accessibility.e2e.ts`
đỏ 2/5 lượt.

### Toàn bộ Playwright

| Lượt | Cấu hình | Kết quả |
|---|---|---|
| 1 | `--retries=0` (chặt hơn CI) | **113 passed · 0 failed · 0 flaky** |
| 2 | retries theo cấu hình CI (=1) | **113 passed · 0 failed · 0 flaky** |

113 = 112 test cũ + 1 test hồi quy huy hiệu mới thêm.

### Cổng chất lượng

| Project | Lệnh | Kết quả |
|---|---|---|
| Admin | `npm test` | **126/126 passed** (25 file) |
| Admin | `npm run test:coverage` | PASS (đạt ngưỡng) |
| Admin | `npx tsc --noEmit` | 0 lỗi |
| Admin | `npm run lint` | 0 error · 1 warning **có sẵn từ trước** ở `src/components/ui/form.tsx` (`react-refresh/only-export-components`) — file không nằm trong thay đổi lần này |
| Admin | `npm run build` | PASS |
| Frontend | `npm test` | **53/53 passed** (8 suite) |
| Frontend | `npx tsc --noEmit` | 0 lỗi |
| Frontend | `npm run lint` | 0 lỗi · 0 warning |
| Frontend | `npm run build` | PASS |

---

## 6. File đã đổi

**`thien-duc-website-admin`**

| File | Thay đổi |
|---|---|
| `src/index.css` | Thêm token ngữ nghĩa `--color-status-*` (5 sắc thái × fg/surface/border) kèm tỉ lệ tương phản trong chú thích |
| `src/components/ui/badge.tsx` | Biến thể màu đọc token; bỏ `transition-colors` khỏi huy hiệu tĩnh |
| `src/components/ui/StatCard.tsx` | Ô icon dùng cùng token (bỏ cặp `green-700`/`green-100` = 4.497:1) |
| `e2e/helpers/a11y.ts` | Đưa trang về trạng thái hình ảnh cuối trước khi quét axe (reduced-motion + tua animation màu + chờ ổn định) |
| `e2e/helpers/layout.ts` | **Mới** — kiểm tràn ngang có chờ bố cục ổn định + chẩn đoán phần tử gây tràn |
| `e2e/admin/responsive.e2e.ts` | Dùng helper chung (ngưỡng giữ nguyên) |
| `e2e/admin/accessibility.e2e.ts` | **Thêm** test hồi quy tương phản huy hiệu “Đang hoạt động” |
| `e2e/public/banner-content.e2e.ts` | Test bàn phím tất định (cổng hydrate + focus + đổi chỉ số slide); dùng `collectOverflow` cho phép kiểm tràn ngang |

**`thien-duc-website-frontend`**

| File | Thay đổi |
|---|---|
| `src/components/ui/cta-contact-cards.tsx` | `min-w-0` + `wrap-anywhere` — gỡ sàn bề rộng gây tràn ngang |
| `src/components/sections/home-contact-cta.tsx` | Eyebrow `text-gold` → `text-gold-soft` |
| `src/app/[locale]/gioi-thieu/page.tsx` | nt |
| `src/app/[locale]/cong-ty-thanh-vien/page.tsx` | nt |
| `src/app/[locale]/du-an/page.tsx` | nt |
| `src/app/[locale]/du-an/[slug]/page.tsx` | nt |
| `src/app/[locale]/du-an/[slug]/[hang-muc]/page.tsx` | nt |
| `src/app/globals.css` | Chú thích cho `--color-gold-soft`: dùng làm chữ trên nền nâu đồng (4.84:1) |

**`thien-duc-website-docs`**

| File | Thay đổi |
|---|---|
| `docs/08-audits-and-reports/current/2026-07-29-…-fix.md` | **Mới** — báo cáo này |
| `docs/08-audits-and-reports/README.md` | Thêm vào index |
| `docs/08-audits-and-reports/current/2026-07-27-fullstack-playwright-e2e.md` | Đính chính khẳng định “color-contrast đã xử lý” và trạng thái CI |
| `docs/04-implementation/implementation-plan.md` | Đính chính “E2E full-stack 111/112”; đóng mục tồn đọng tương phản |

Backend: **không đổi file nào.**

---

## 7. Xác nhận an toàn

- **Không** tắt rule axe nào; **không** dùng `disableRules` / `exclude` cho phần
  tử vi phạm; bộ tag `wcag2a` + `wcag2aa` giữ nguyên.
- **Không** nới lỏng phép khẳng định nào. Ngưỡng tràn ngang vẫn `≤ innerWidth + 1px`;
  khẳng định hành vi bàn phím được giữ và **mở rộng** thêm kiểm tra chỉ số slide.
- **Không** tăng timeout để né lỗi (`expect` vẫn 10s như cũ). Các mốc chờ mới đều
  là **điều kiện**, có trần thời gian riêng.
- **Không** thêm `waitForTimeout` / sleep cố định nào vào test.
- **Không** đặt `overflow: hidden` lên `html`/`body`, không cắt xén để giấu nội
  dung; chữ vẫn hiện đầy đủ, chỉ xuống dòng.
- **Không** tăng cỡ chữ để hạ ngưỡng tương phản (test hồi quy chặn hẳn điều này).
- **Không** chạm DB production: chỉ `localhost:5432/thien_duc_test`, qua cầu chì
  `assertSafeDatabase`.
- **Không** gọi dịch vụ ngoài: backend chạy `MAIL_FAKE_TRANSPORT=1`, Resend /
  Cloudinary / Sentry để rỗng (log khởi động xác nhận).
- **Không** in hay commit secret nào.
- **Chưa commit, chưa push** — toàn bộ thay đổi đang nằm ở working tree.
