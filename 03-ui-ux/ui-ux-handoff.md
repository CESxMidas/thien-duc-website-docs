# Hand-off Specification — Cải tiến UI/UX Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Nhóm:** 03 — UI/UX
> **Cập nhật:** 2026-10-24
> **Nguồn (di chuyển từ):** `UI-UX-HANDOFF-SPEC.md` (thư mục gốc)
> **Tài liệu liên quan:** [design-system](design-system.md) · [implementation-plan](../04-implementation/implementation-plan.md)

> Kết quả phân tích UX (2026-07-07) trên mã nguồn `thien-duc-website-frontend` thật (không phải mockup).
> Ràng buộc: **giữ nguyên bảng màu chủ đạo** — nâu đồng `#B06613`, nâu đậm `#7f4b0d`, vàng `#fdcd04`, đen `#191919`, xám chữ `#59646a`, nền kem `#fff8ea`. Được phép sắp xếp lại bố cục.

## 0. Tóm tắt điểm nghẽn → hạng mục sửa

### Chuẩn bổ sung 2026-10-24 — Ảnh dự án và con trỏ tương tác

- Footer dùng nền kem sáng chuyển nhẹ từ ivory sang gold-soft, chữ ink/brand-dark, biểu tượng nâu; bỏ nền ảnh tối và text-shadow để logo rõ. Logo fallback dùng bản header-transparent màu nâu. Khối thương hiệu xếp dọc trên mobile; tên công ty xuống dòng tự nhiên, không `whitespace-nowrap`, font 14px/line-height 28px. Link điều hướng có vùng bấm tối thiểu 44px; email cho phép ngắt chuỗi để không tràn màn hình. Chỉ đổi footer, không thay các token olive của khu vực khác.

- Thanh cuộn website công khai dùng tay nắm nâu đồng, rãnh kem, bo tròn; Chromium/Safari rộng/cao 10px với viền trong 2px, không đổi kích thước khi hover. Firefox dùng `scrollbar-width: thin` và `scrollbar-color` tương ứng. Màu tham chiếu token thương hiệu trong `globals.css`; hover/active đậm hơn. Áp dụng cho trang, menu mobile, sidebar/nội dung dài, textarea và dải ảnh. Carousel chủ đích giấu thanh cuộn dùng class chung `no-scrollbar`; giữ nút điều hướng/swipe. Chế độ forced-colors dùng màu hệ thống.

- Mô tả tổng quan dự án/hạng mục nhập từ CMS dùng `.project-description` và style trực tiếp `whiteSpace: "pre-line"` để giữ xuống dòng và dòng trống giữa các đoạn, kể cả khi stylesheet trên bản đang phục vụ thiếu rule mới. Không áp `white-space: normal` ghi đè lên nội dung này và không yêu cầu biên tập viên nhập HTML.

- Chi tiết dự án và chi tiết hạng mục dùng khung ảnh cố định **4:3**, co giãn theo chiều rộng responsive. Không lấy kích thước ảnh gốc để thay đổi chiều cao khung khi tải/chuyển ảnh. Ảnh chụp dự án có logo góc trên trái dùng `object-cover object-left-top origin-top-left`: phủ kín khung và giữ góc chứa logo, cắt phần dư bên phải/dưới, không kéo méo. Áp dụng cho ảnh lớn, thumbnail, thẻ hạng mục, ảnh dự án ở trang chủ/carousel/sidebar/tìm kiếm và ảnh chụp cạnh bản đồ. Gốc phóng to cũng phải là góc trên trái. Nhãn trạng thái trên ảnh đặt góc trên phải để không đè logo. Sơ đồ vị trí giữ cách dựng riêng để bảo toàn tọa độ marker; banner có điểm căn riêng từ CMS không bị ghi đè.
- Ảnh thu nhỏ, ảnh trên thẻ hạng mục, gallery theo nhóm và dải ảnh dự án dùng chung class `project-image-frame` trong `frontend/src/app/globals.css`. Ảnh xem trước dạng thẻ giữ `object-cover`; bản đồ, logo và banner giữ tỷ lệ riêng theo vai trò.
- Website công khai dùng `cursor: pointer` cho liên kết có đích, nút, điều khiển có role button, summary, select và input chọn/tải tệp. Trạng thái disabled/aria-disabled dùng `not-allowed`; ô nhập chữ giữ con trỏ nhập liệu. Các utility con trỏ chuyên biệt như phóng to/kéo vẫn được ưu tiên.
- Quy tắc áp dụng cả phần tử `role="link"` và nút ảnh `input[type="image"]`. Điều khiển con của nhóm `aria-disabled="true"` kế thừa con trỏ cấm; vùng `inert` dùng con trỏ thường. Không thêm pointer cho thẻ chỉ đọc dù có hiệu ứng hover/focus, hoặc cho mọi nhãn ô nhập.

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
- **Font (cập nhật 2026-07-16)**: đã đổi Geist → **Playfair Display** (heading
  H1/H2) + **Be Vietnam Pro** (body/UI) qua `next/font/google`, subset
  `["latin","vietnamese"]`, `display:swap`, chỉ nạp weight thực dùng. Nguồn sự
  thật ở `app/[locale]/layout.tsx` + type-scale token trong `globals.css`
  (`--text-*`, `--leading-*`, `--tracking-*`, utility `.text-eyebrow`/`.measure`/
  `font-display`). Đổi typography sửa ở token, không gõ cỡ chữ cứng trong
  component. Xem log "Redesign typography toàn site" trong [implementation-plan](../04-implementation/implementation-plan.md).
- Route `du-an` thêm `loading.tsx` khi chuyển sang fetch API.

**A11y checklist:**
- [x] Mọi trang đúng 1 `<h1>` — trang chủ dùng h1 trong banner (2026-07-08).
- [x] Skip-link "Bỏ qua điều hướng" trước header + `<main id="main-content">` trong SiteShell.
- [x] Focus-visible toàn cục (outline vàng, globals.css).
- [x] Contrast: `text-white/75` trên `#c99248` → `text-white` (5 chỗ: du-an, du-an/[slug], gioi-thieu, lien-he, home-contact-cta).
- [x] Carousel: keyboard ←/→, `inert` slide ẩn, pause khi focus.
- [x] Form: `aria-invalid`, `aria-describedby`, banner `role="status"/"alert"`.
- [ ] Touch target ≥ 44×44: dots slider ✅; icon social footer — chưa rà.

## 9. Thứ tự triển khai đề xuất


1. ~~**H3 Contact Form + API**~~ ✅ Xong 2026-07-08 — form gọi `POST /api/contact` (mailto đã bỏ), validate on-blur, đủ trạng thái submitting/success/error/429, honeypot; backend cho `email` optional (migration `contact_email_optional`).
   > ✅ Đã xác nhận (2026-07-21): frontend **không có mock mode** — `src/lib/api/client.ts` luôn `fetch` thật, biến bắt buộc là `NEXT_PUBLIC_API_URL` (frontend là Next.js, không phải Vite). Mô tả cũ "Mock mode khi chưa đặt `VITE_API_URL`" đã lỗi thời cả về hành vi lẫn tên biến — xem [deployment-guide.md](../07-deployment/deployment-guide.md) mục 5.
2. ~~**H1+H2 Hero/trang chủ**~~ ✅ Xong 2026-07-08 — banner 75svh + CTA kép + h1, autoplay 7s pause hover/focus/tab ẩn/reduced-motion, swipe mobile, arrows mobile, dots 44px, a11y carousel đầy đủ; HomeHero → HomeIntroStrip (4 cột năng lực); FeaturedProjects dời lên ngay sau banner.
3. ~~**H5 Breadcrumb**~~ ✅ Xong 2026-07-08 — `src/components/ui/breadcrumb.tsx` (JSON-LD BreadcrumbList, aria-current, thu gọn "…" mobile); đã áp cho `du-an/[slug]`, `tin-tuc/[slug]`, 3 trang con Nhân sự. Route `[hang-muc]` khi tạo chỉ cần thêm 1 cấp item.
4. ~~**H4 Navigation**~~ ✅ Xong 2026-07-08 — dropdown chia nhóm heading (NavItem.group), nhãn "Tuyển dụng & Nhân sự", search "Tìm tin tức...", delay đóng 150ms + chevron + aria-haspopup/expanded + Escape, mobile toggle expand với link cha thành item đầu (overviewLabel).
5. ~~**H6 Filter + mục 7, 8**~~ ✅ Phần lớn xong 2026-07-08 — filter `scroll={false}` + đếm số lượng + icon check; focus-visible toàn cục; skip-link; sửa 5 chỗ contrast. **Còn lại chờ nối API Sprint 1–2**: `loading.tsx` + `ProjectCardSkeleton`, `_count` từ API thay đếm client, rà touch target icon footer.

## 10. Cập nhật giao diện liên hệ — 2026-10-26

- `ContactSection` gom form, quy trình và văn phòng/bản đồ trong một grid 1.1/0.9 ở desktop (từ 1024px), hai cột cùng mép trên/dưới; mobile xếp dọc. Quy trình dùng danh sách 3 bước gọn, bản đồ giãn trong phần chiều cao còn lại của cột phải, không tạo hàng bản đồ riêng gây khoảng trống.
- Form dùng ô nhập cao 52px, bo 12px, viền `divider`, biểu tượng mảnh tông `brand`, nền trắng trên panel nhẹ; họ tên/điện thoại và email/nhóm yêu cầu chia hai hàng đôi từ 640px. Bộ chọn có mũi tên riêng và giữ thao tác bàn phím native. Textarea co giãn dọc; ghi chú bảo mật và nút gửi cùng hàng trên desktop.
- Nhãn luôn hiển thị; focus có ring, lỗi có chữ và biểu tượng, đưa focus tới ô lỗi đầu tiên. Đang gửi khóa các ô nhập/nút gửi; giữ thông báo thành công, lỗi mạng/rate-limit và honeypot. Nội dung VI/EN và thông tin liên hệ lấy từ nguồn hiện có.

## 11. Sắp xếp nội dung và tạo đường dẫn — 2026-10-26

- Dự án, Tin tức, Tuyển dụng và Hạng mục có nút **Sắp xếp hiển thị** cho quản trị viên: mở danh sách đầy đủ, dùng bốn nút đưa lên đầu/lên/xuống/xuống cuối, sau đó **Lưu thứ tự**. Banner và Hợp tác tiếp tục có nút lên/xuống theo hàng. Mục ở trên hiển thị trước trên website; nội dung chưa đăng vẫn không công khai.
- Khi thêm mới, đường dẫn tự điền từ tên tiếng Việt. Có thể tự chỉnh đường dẫn nếu cần; sau khi chỉnh riêng, tên thay đổi không ghi đè đường dẫn. Chế độ sửa giữ nguyên đường dẫn cũ. Đường dẫn tạo từ tên dài được giới hạn 160 ký tự.
- Hộp sắp xếp dùng `SplitModal`, kiểm tra danh sách đã thay đổi trước khi lưu; trạng thái đang lưu khóa thao tác. Trên mobile, tên nội dung ở hàng trên, bốn nút 44px ở hàng dưới để tránh ép chữ thành cột hẹp. Thứ tự lưu xuống backend, không chỉ thay đổi bảng đang mở.

## 12. Trạng thái khi tới giờ đăng — 2026-10-26

- Nội dung đã tới giờ công khai hiển thị **Đã đăng theo lịch** với huy hiệu xanh, không yêu cầu duyệt hoặc đăng lại dù trạng thái lưu còn `PENDING` trước lượt đồng bộ backend. Tin tức và Dự án xếp nội dung đó vào nhóm **Đã đăng**; **Đã lên lịch** chỉ gồm lịch tương lai.
- Các nút, nhãn và số liệu chờ duyệt dùng cùng trạng thái suy ra. Hàng chờ ở Tổng quan chỉ có nội dung PENDING thực sự chưa được lên lịch; không trộn bài đã lên lịch hoặc đã tới hạn vào đây.
- Màn hình tự cập nhật khi đi qua deadline hoặc khi người dùng quay lại tab. Không cần reload hay gửi lại lệnh đăng. Thời điểm ghi kèm huy hiệu là giờ Việt Nam; giao diện không hiển thị chi tiết kỹ thuật về reconciler/đồng bộ.

## 13. Xóa nội dung và phân quyền — 2026-10-27

- Nút **Xóa** mở hộp thoại cho chọn **Đưa vào thùng rác** hoặc **Xóa vĩnh viễn**. Mặc định thùng rác; xóa vĩnh viễn phải tích thêm xác nhận hiểu thao tác không thể hoàn tác. Thao tác ẩn/tắt nội dung là chức năng hiển thị riêng.
- Chỉ Super Admin và thành viên có quyền xóa chung thấy nút. **Tài khoản → Quyền xóa** có một checkbox cho toàn CMS; chỉ Super Admin được cấp/thu hồi. Bảng tài khoản ghi rõ **Toàn quyền / Được cấp / Chưa cấp**.
- **Thùng rác** có các loại nội dung, phân trang, khôi phục và xóa vĩnh viễn. Khôi phục bài/dự án/trang/tuyển dụng về nháp; ảnh thư viện/banner/chuyên mục/tài khoản cần được bật lại. Không tự chạy lại lịch đăng cũ; cần khôi phục cha trước con.
- Khi đang xử lý, khóa xác nhận. Khi lưu lỗi hoặc quyền bị thu hồi, giữ hộp thoại và thông báo rõ. Xóa dự án nói rõ tác động tới hạng mục/ảnh; xóa tài khoản nói rõ phiên/lời mời/hồ sơ liên quan. Không cho tự xóa mình hoặc mất Super Admin cuối cùng.

## 14. Đổi mật khẩu có mã email — 2026-10-27

- Bước đầu nhập ba ô mật khẩu và bấm **Gửi mã xác nhận**. Gửi thành công mới chuyển sang ô **Mã xác nhận**; hiện email đã che, hướng dẫn kiểm tra thư rác, thời hạn 10 phút và thông báo cần đăng nhập lại sau khi đổi.
- Mã nhập bằng một ô, hỗ trợ bàn phím số, dán và tự điền mã một lần. **Gửi lại mã** có bộ đếm 60 giây; **Sửa mật khẩu** quay về bước trước. Mã hết hạn khóa xác nhận nhưng vẫn cho hủy hoặc gửi lại. Mật khẩu không lưu ở storage hoặc URL.
- Lỗi gửi email giữ bước mật khẩu; lỗi mã giữ hộp thoại và focus lại ô mã. Không đăng xuất chỉ vì nhập sai mật khẩu/mã. Chỉ khi đổi thành công mới dọn token và chuyển đúng trang đăng nhập Admin.
