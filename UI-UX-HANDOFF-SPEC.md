# Hand-off Specification — Cải tiến UI/UX Website Thiên Đức

> Kết quả phân tích UX (2026-07-07) trên mã nguồn `thien-duc-website-frontend` thật (không phải mockup).
> Ràng buộc: **giữ nguyên bảng màu chủ đạo** — nâu đồng `#B06613`, nâu đậm `#7f4b0d`, vàng `#fdcd04`, đen `#191919`, xám chữ `#59646a`, nền kem `#fff8ea`. Được phép sắp xếp lại bố cục.

## 0. Tóm tắt điểm nghẽn → hạng mục sửa

| # | Điểm nghẽn (file liên quan) | Mức độ | Hạng mục |
|---|---                          |---     |---       |
| PN-1| Hero kép chiếm ~1.7 màn hình, autoplay 4s không pause (`home-banner-slider.tsx`, `home-hero.tsx`) | Cao | H1, H2 |
| PN-2 | Form liên hệ mở `mailto`, mất lead (`contact-form.tsx`) | **Nghiêm trọng** | H3 |
| PN-3 | Menu 7 mục, dropdown trộn logic, search gây hiểu lầm (`navigation.ts`, `site-header.tsx`) | Trung bình | H4 |
| PN-4 | Không có breadcrumb trang chi tiết (`du-an/[slug]/page.tsx`, `tin-tuc/[slug]/page.tsx`) | Trung bình | H5 |
| PN-5 | Filter dự án reset scroll, không đếm số lượng (`du-an/page.tsx`) | Thấp | H6 |

---

## H1 — Tái cấu trúc Hero trang chủ

**Thay đổi bố cục:**
- `HomeBannerSlider`: chiều cao `100svh` → `clamp(480px, 75svh, 820px)`.
- Thêm 2 CTA vào khối copy trong banner: primary "Xem dự án" (nền `#fdcd04`, chữ `#191919`), secondary "Liên hệ tư vấn" (viền trắng, chữ trắng, hover nền trắng/chữ đen).
- `HomeHero`: bỏ H1 khổ lớn + cặp CTA (đã dời lên banner). Giữ lại eyebrow + đoạn mô tả ngắn + 4 thẻ năng lực, đổi layout dọc → **4 cột ngang** (`grid-cols-2 lg:grid-cols-4`), tổng chiều cao mục tiêu ≤ 50vh.
- Bỏ eyebrow "Năng lực trọng tâm" thứ hai (trùng với section Capabilities bên dưới).

**Component `BannerSlider` (refactor từ `home-banner-slider.tsx`):**

```
<BannerSlider>
 ├─ <BannerSlide>        // ảnh + gradient overlay (giữ style hiện tại)
 ├─ <BannerCopy>         // eyebrow, counter, title, subtitle, <BannerCtaGroup> 2 nút
 ├─ <BannerProgressBar>  // giữ, nhưng animation-play-state theo isPaused
 ├─ <BannerArrows>       // hiện cả mobile: size-9, đặt 2 mép giữa banner
 └─ <BannerDots>         // vùng chạm ≥44×44 (padding), thumbnail-dot khi ≥lg
```

**Trạng thái phải xử lý:**
- `isPaused`: true khi `pointerenter`/`focusin` vào section, khi `document.hidden`, khi user đã tương tác thủ công (sau lần bấm arrow/dot → tạm dừng 12s rồi resume).
- `prefers-reduced-motion: reduce` → tắt autoplay + tắt scale zoom ảnh, chuyển fade → cắt cảnh tức thì.
- Autoplay: 4000ms → **7000ms**.
- Swipe mobile: dùng `touchstart/touchend` deltaX > 48px (không cần lib).

**A11y:** section giữ `aria-label`; thêm `aria-roledescription="carousel"`, mỗi slide `role="group"` + `aria-label="2 / 4"`; slide ẩn thêm `inert` để không tab vào CTA của slide không hiển thị; phím ←/→ khi focus trong carousel.

## H2 — Trật tự section trang chủ

Thứ tự mới trong `app/page.tsx` (đưa dự án lên sớm — mục tiêu người dùng BĐS):

```
1. BannerSlider (có CTA)
2. HomeFeaturedProjects   ← đưa lên từ vị trí 3
3. HomeIntroStrip          (HomeHero rút gọn)
4. HomeCapabilities
5. HomeLatestNews
6. HomeContactCta
```

## H3 — Contact Form gọi API thật (ưu tiên cao nhất)

Backend đã chạy: `POST /api/contact` (đã test), response chuẩn `{success, data|error}`, rate-limit 5 request/IP/giờ.

**Component `ContactForm` (sửa `contact-form.tsx`):**

```
<ContactForm>
 ├─ <FormField>            // label + control + <FieldError>, prop: required, hint
 │    └─ aria-invalid, aria-describedby={`${id}-error`}
 ├─ <SubmitButton>         // 4 trạng thái, min-width cố định tránh giật layout
 └─ <FormStatusBanner>     // success | error | rate-limited, role="status"/"alert"
```

**State machine của form:** `idle → validating → submitting → success | error`.

| Trạng thái | UI |
|---|---|
| Default | như hiện tại |
| Focus | viền `#B06613` + ring `2px #fdcd04/40` (hiện chỉ đổi viền — thêm ring) |
| Invalid (sau blur) | viền `#9b2c2c`, `<FieldError>` chữ đỏ 13px dưới field, icon cảnh báo |
| Submitting | button disabled + spinner 16px + chữ "Đang gửi..."; toàn form `aria-busy` |
| Success | thay form bằng banner xanh lá `#166534/10` nền, icon check, "Đã gửi thành công — Thiên Đức sẽ liên hệ trong 24h làm việc" + nút "Gửi yêu cầu khác" (reset) |
| Error mạng/5xx | banner đỏ trên nút, **giữ nguyên dữ liệu đã nhập**, nút "Thử lại" |
| 429 (rate-limit) | banner vàng: "Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau 1 giờ hoặc gọi 093 8759 156" |

**Validate phía client (trước khi gọi API):** name ≥ 2 ký tự; phone regex VN `^(0|\+84)\d{9,10}$`; email optional nhưng nếu nhập phải hợp lệ; message ≥ 10 ký tự. Validate on-blur từng field, re-validate on-change sau khi đã lỗi.

**Kỹ thuật:** dùng `fetch` qua lớp `src/lib/api/client.ts` sẵn có; timeout 10s bằng `AbortController`; honeypot field ẩn chống spam bot (input `display:none`, backend bỏ qua nếu có giá trị).

## H4 — Navigation

Sửa `src/data/navigation.ts` + `site-header.tsx`:

- Dropdown "Dự án" chia 2 nhóm có heading nhỏ (`text-xs uppercase text-white/60 px-7 pt-3`):
  - **Dự án nổi bật**: Khu đô thị Hưng Phú (sau này lấy top N từ API, field `order`).
  - **Theo trạng thái**: 3 link filter hiện tại.
- Nhãn "Nhân sự" → **"Tuyển dụng & Nhân sự"**.
- Search: placeholder "Tìm kiếm..." → **"Tìm tin tức..."**; khi backend search toàn site (Sprint 4) đổi lại + mở rộng scope.
- Dropdown desktop: thêm delay đóng 150ms (tránh đóng khi chuột trượt chéo); mũi tên chevron-down cạnh label mục có con (hiện không có chỉ báo nào là mục có dropdown).
- Mobile menu: mục có con → nhãn cha là nút toggle expand (chevron xoay), **không** vừa là link vừa mở con như hiện tại (link cha đặt thành mục đầu trong nhóm con: "Tất cả dự án").

**A11y:** dropdown thêm `aria-haspopup="true"` + `aria-expanded`; đóng bằng `Escape`; focus trap không cần (không phải modal) nhưng tab phải đi qua được toàn bộ item.

## H5 — Breadcrumb component (mới)

`src/components/ui/breadcrumb.tsx`:

```tsx
<Breadcrumb items={[{label:"Trang chủ", href:"/"}, {label:"Dự án", href:"/du-an"}, {label: project.title}]} />
```

- Render `<nav aria-label="Breadcrumb"><ol>`, phần tử cuối `aria-current="page"`, không phải link.
- Kèm JSON-LD `BreadcrumbList` (inject `<script type="application/ld+json">`).
- Style: chữ 13px, separator `/` màu `#B06613/40`, đặt ngay trên `PageHeading`.
- Áp dụng: `du-an/[slug]`, `du-an/[slug]/[hang-muc]` (route sắp tạo), `tin-tuc/[slug]`, các trang con mục Nhân sự.
- Mobile: nếu > 3 cấp, thu gọn cấp giữa thành `…`.

## H6 — Filter danh sách dự án

`du-an/page.tsx`:
- `<Link scroll={false}>` cho các nút filter (giữ vị trí cuộn).
- Hiện số lượng: `Đã bàn giao (2)` — đếm từ mảng projects (sau này API trả `_count`).
- Nút filter active thêm icon check nhỏ bên trái (phân biệt không chỉ bằng màu — hỗ trợ mù màu).
- Empty state hiện tại đã tốt — giữ.
- Khi nối API: thêm `<ProjectCardSkeleton>` (aspect 3/2 xám nhấp nháy + 3 dòng chữ) hiển thị qua `loading.tsx` của route.

## 7. Trạng thái giao diện chuẩn cho mọi component tương tác

| State | Quy ước chung |
|---|---|
| Hover | đổi nền/viền sang `#B06613` hoặc `#7f4b0d`, transition 200ms; card: viền + translateY(-2px) |
| Focus-visible | `outline: 2px solid #fdcd04; outline-offset: 2px` — **thêm toàn cục vào globals.css**, hiện nhiều element chỉ có hover |
| Active | scale(0.98) trên button |
| Disabled | `opacity-50 cursor-not-allowed`, bỏ mọi hover effect |
| Loading | spinner 16px cùng màu chữ, giữ min-width nút |
| Empty | icon + tiêu đề + mô tả + 1 CTA quay lại (pattern như empty state du-an hiện có) |
| Error | banner `role="alert"`, màu `#9b2c2c`, luôn kèm hành động thoát (thử lại/gọi điện) |

## 8. Hiệu năng & A11y tổng thể

**Performance (phục vụ mục tiêu CL-02 Lighthouse):**
- Banner: chỉ `preload` slide đầu (đã đúng); các slide sau thêm `loading="lazy"` + render ảnh slide `n+1` trước 1 chu kỳ thay vì mount cả 4 ảnh ngay (giảm ~3 ảnh full-viewport lúc LCP).
- Ảnh gốc 8K trong `public/images` phải xuất bản web ≤ 1600px/WebP trước go-live (đã ghi trong README).
- `next/font` cho font chữ nếu thêm font riêng — tránh FOUT.
- Route `du-an` thêm `loading.tsx` khi chuyển sang fetch API.

**A11y checklist:**
- [ ] Mọi trang đúng 1 `<h1>` (kiểm tra lại trang chủ sau khi banner nhận H1 thật thay vì `h2` hiện tại trong slider).
- [ ] Skip-link "Bỏ qua điều hướng" trước header (chưa có).
- [ ] Focus-visible toàn cục (mục 7).
- [ ] Contrast: chữ `text-white/75` trên nền `#c99248` (CTA section du-an) ~3.2:1 — **dưới chuẩn AA 4.5:1**, tăng lên `text-white` hoặc đậm nền.
- [ ] Carousel: keyboard ←/→, `inert` slide ẩn, pause khi focus.
- [ ] Form: `aria-invalid`, `aria-describedby`, banner `role="status"/"alert"`.
- [ ] Touch target ≥ 44×44: dots slider, icon social footer.

## 9. Thứ tự triển khai đề xuất

1. ~~**H3 Contact Form + API**~~ ✅ Xong 2026-07-08 — form gọi `POST /api/contact` (mailto đã bỏ), validate on-blur, đủ trạng thái submitting/success/error/429, honeypot; backend cho `email` optional (migration `contact_email_optional`). Mock mode khi chưa đặt `NEXT_PUBLIC_API_URL`.
2. ~~**H1+H2 Hero/trang chủ**~~ ✅ Xong 2026-07-08 — banner 75svh + CTA kép + h1, autoplay 7s pause hover/focus/tab ẩn/reduced-motion, swipe mobile, arrows mobile, dots 44px, a11y carousel đầy đủ; HomeHero → HomeIntroStrip (4 cột năng lực); FeaturedProjects dời lên ngay sau banner.
3. ~~**H5 Breadcrumb**~~ ✅ Xong 2026-07-08 — `src/components/ui/breadcrumb.tsx` (JSON-LD BreadcrumbList, aria-current, thu gọn "…" mobile); đã áp cho `du-an/[slug]`, `tin-tuc/[slug]`, 3 trang con Nhân sự. Route `[hang-muc]` khi tạo chỉ cần thêm 1 cấp item.
4. ~~**H4 Navigation**~~ ✅ Xong 2026-07-08 — dropdown chia nhóm heading (NavItem.group), nhãn "Tuyển dụng & Nhân sự", search "Tìm tin tức...", delay đóng 150ms + chevron + aria-haspopup/expanded + Escape, mobile toggle expand với link cha thành item đầu (overviewLabel).
5. **H6 Filter + mục 7, 8** — rải trong Sprint 1–2 khi nối API.
