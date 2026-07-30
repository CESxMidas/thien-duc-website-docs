# THIEN-DUC-NEWS-SLIDER-AND-PAGINATION-M1

> **Ngày:** 2026-07-29 · **Nhóm:** 08 — Audits & Reports (current)
> **Phạm vi:** slider tin ở trang chủ + phân trang thật cho `/tin-tuc` + API phân trang backend.
> **Trạng thái:** code + unit test XONG. **Playwright/e2e CHƯA chạy được** (thiếu `.env` cục bộ — xem §7).

## 1. Vấn đề

Trang chủ hiển thị **3 thẻ tin tĩnh** trên một hàng: muốn xem thêm phải rời trang.
Trang `/tin-tuc` đổ **toàn bộ** bài đã đăng vào một lưới, không phân trang — số bài
càng tăng thì trang càng nặng và người đọc càng khó lần theo.

Ở tầng dữ liệu, `GET /news` trả mảng phẳng mọi bài PUBLISHED, sắp theo **một
khoá** `publishedAt desc`. Loạt bài nhập cùng đợt có `publishedAt` trùng nhau nên
thứ tự giữa chúng không tất định — đây là lỗi tiềm ẩn phải sửa **trước** khi
phân trang, nếu không cùng một bài có thể xuất hiện ở hai trang hoặc biến mất.

## 2. Hợp đồng API (backward-compatible)

`GET /news` giữ nguyên đường dẫn. Hành vi tách theo tham số:

| Request | Response |
| --- | --- |
| `GET /news` | **mảng phẳng** như trước — không consumer nào phải sửa |
| `GET /news?page=2&limit=9` | envelope phân trang |

```jsonc
// data của ApiResponse khi có page/limit
{
  "items": [ /* NewsPostDto[] */ ],
  "page": 2, "limit": 9,
  "totalItems": 23, "totalPages": 3,
  "hasNextPage": true, "hasPreviousPage": true
}
```

Ràng buộc (`QueryNewsDto` + ValidationPipe toàn cục):

- `page` số nguyên ≥ 1; `limit` số nguyên 1…**50** (trần cứng). Sai → **400**.
- Mặc định `limit` = 9 khi chỉ gửi `page`.
- Chỉ trả `status = PUBLISHED`; DRAFT/PENDING không bao giờ lọt ra.
- Sắp xếp **tất định**: `publishedAt desc, id desc`. Khoá phụ `id` là bắt buộc —
  xem §1.
- `count` + `findMany` chạy trong **một `$transaction`** để `totalPages` và nội
  dung trang thuộc cùng một ảnh chụp dữ liệu.
- Trang vượt quá trang cuối → `items: []`, `hasNextPage: false`, **không** ném lỗi;
  client quyết định cách xử lý.

Lý do chọn "tham số tùy chọn" thay vì đổi hẳn response hoặc thêm
`/news/paginated`: đổi hẳn là breaking change cho cả FE lẫn sitemap; endpoint
riêng thì trùng logic và phình bề mặt API.

## 3. Slider trang chủ

- Component mới `frontend/src/components/sections/news-slider.tsx` (client).
- **Không thêm thư viện** — viết theo đúng pattern `ProjectItemsCarousel` đang
  dùng trong dự án (state chỉ số + `translateX` + `lucide-react` chevron).
- Số thẻ nhìn thấy: **mobile 1 · tablet 2 (≥768px) · desktop 3 (≥1024px)**.
  Trượt **một thẻ** mỗi lần bấm.
- Dữ liệu: `getNewsPage(locale, { page: 1, limit: 8 })` — trang chủ **không** kéo
  cả kho tin nữa (trước đây gọi `getNewsPosts` rồi tự sắp và cắt 3).
- Chiều cao thẻ bằng nhau (`flex h-full` + `mt-auto` cho link), tiêu đề
  `line-clamp-3`.

**Cố ý KHÔNG autoplay**, khác các slider khác của site: khối này là điểm điều
hướng chứ không phải banner, tin tự trôi làm người đọc mất bài đang xem. Bỏ
autoplay cũng khiến e2e tất định mà không cần "chế độ test" riêng.

### A11y của slider

- `role="group"` + `aria-roledescription="carousel"` + `aria-label` song ngữ.
- Nút prev/next có `aria-label`, **`disabled` thật** ở hai đầu dãy (không loop).
- `ArrowLeft`/`ArrowRight` chuyển slide; mọi nút đều tới được bằng Tab.
- Chấm chỉ vị trí mang `aria-current`.
- Thẻ **ngoài khung** bị `aria-hidden` + `tabIndex={-1}` — nếu không, Tab sẽ nhảy
  vào thẻ khuất bên phải.
- Vùng `aria-live="polite"` báo vị trí hiện tại.
- Transition tôn trọng `motion-reduce`.

## 4. Phân trang `/tin-tuc`

- **9 bài/trang** (khớp lưới 3×3 desktop).
- Trang hiện tại nằm trong **URL query**: `/tin-tuc?page=2`, `/en/tin-tuc?page=2`.
  Không giữ state phân trang trong React memory → chia sẻ link, Back/Forward,
  reload đều đúng.
- Trang 1 = `/tin-tuc` **không** có `?page=1` → mỗi nội dung chỉ một URL.
- Chuẩn hoá (`lib/pagination.ts`, `parsePageParam`):
  - `?page=0`, `?page=-1`, `?page=abc`, `?page=` , `?page=1` → **redirect** về URL sạch.
  - `?page=999` (vượt trang cuối) → **redirect về trang cuối có thật**, không để trang trắng.
- Component `components/ui/pagination.tsx`: `<nav aria-label>`, số trang là **thẻ
  `a` thật** (`next/link`) chứ không phải nút JS → bot bò được sang trang sau.
  Trang hiện tại `aria-current="page"`. Nút vô hiệu là `<span aria-disabled>`
  chứ không phải `<a>` chết. `rel="prev"/"next"` cho Previous/Next.
- Rút gọn `1 2 3 … 8` khi nhiều trang; dấu lược chỉ chèn khi **thực sự nhảy cách** ≥ 2 trang.
- Mobile: ẩn dãy số, thay bằng "Trang x / y" — hàng điều khiển không tràn ngang.
- Link phân trang neo `#danh-sach-tin` để sang trang không phải cuộn lại từ header.
- **Kết quả tìm kiếm (`?q=`) không phân trang** — API search đã tự giới hạn số lượng.

## 5. SEO

- Mỗi trang phân trang **tự trỏ canonical về chính nó** (`?page=2`), không gộp về
  trang 1 — gộp lại thì bài từ trang 2 trở đi mất đường vào chỉ mục.
- `hreflang` sinh cùng cơ chế nên tự mang theo `?page=`.
- Title trang ≥2 có hậu tố "— Trang N" / "— Page N".
- **Không** thêm `noindex` (đúng chiến lược SEO hiện hành: trang danh sách nên bò được).
- Dữ liệu lấy phía server (server component) → không có màn trắng trước hydrate;
  URL API vẫn qua `NEXT_PUBLIC_API_URL`, không hardcode.

## 6. Test đã thêm

| Nơi | Số test | Nội dung |
| --- | --- | --- |
| backend `news-pagination.service.spec.ts` | 10 | where/orderBy/skip/take, transaction, totalPages, trang cuối, rỗng, vượt trang, chia hết, thứ tự tất định của cả 2 nhánh `findAll` |
| frontend `lib/pagination.test.ts` | 14 | chuẩn hoá `?page=`, clamp, dựng href |
| frontend `components/ui/pagination.test.tsx` | 12 | `buildPageList`, aria-current, disabled, rel, href, EN |
| frontend `components/sections/news-slider.test.tsx` | 18 | 1/2/3 thẻ theo viewport, next/prev, disabled, bàn phím, chấm, ≤ số ô thì ẩn điều khiển, thiếu ảnh, Tab, kẹp chỉ số khi đổi viewport, EN |
| admin `e2e/public/news-slider-pagination.e2e.ts` | 22 | Playwright + axe — xem §7 |

Tổng cộng **54 unit test mới** (đều xanh) + 22 spec Playwright **chưa chạy được**.

## 7. Hạn chế còn lại

**Playwright chưa chạy.** Spec đã viết đầy đủ và đặt vào harness full-stack sẵn
có ở repo admin (`e2e/public/`, cùng chỗ với `banner-content.e2e.ts`) — cố ý
**không** dựng Playwright thứ hai trong repo frontend vì harness hiện tại đã bao
cả Next.js :3000 + backend :3001 + axe + cầu chì DB.

Blocker là môi trường, không phải code: **không repo nào có file `.env`** (chỉ
`.env.example`). Backend không khởi động nổi (`JwtStrategy requires a secret or
key`), nên `webServer` của Playwright chết ngay và `backend npm run test:e2e`
cũng đỏ (`Thiếu DATABASE_URL`). Postgres **có** chạy ở `127.0.0.1:5432`; chỉ
thiếu chuỗi kết nối + secret. Không tự bịa credential.

Để chạy: tạo `backend/.env` (`DATABASE_URL` trỏ `thien_duc_test`,
`JWT_ACCESS_SECRET`, `SUPER_ADMIN_EMAIL/PASSWORD`, `CORS_ORIGIN`) và
`frontend/.env` (`NEXT_PUBLIC_API_URL`), rồi:

```bash
cd thien-duc-website-admin
npx playwright test e2e/public/news-slider-pagination.e2e.ts   # spec mới, chạy riêng
npx playwright test                                            # toàn bộ
cd ../thien-duc-website-backend && npm run test:e2e
```

Cho tới lúc đó **chưa có bằng chứng đo được** cho: axe 0 vi phạm serious/critical
trên trang chủ + `/tin-tuc`, không tràn ngang ở 375/768/1280, và hành vi
Back/Forward thật của trình duyệt. Các khẳng định đó hiện chỉ ở mức **thiết kế +
unit test**, chưa phải kết quả chạy.

## 8. File thay đổi

**backend**
- `src/news/dto/query-news.dto.ts` *(mới)*
- `src/news/news.service.ts` — `findAllPaginated`, `listOrderBy`
- `src/news/news.controller.ts` — `@Query() QueryNewsDto`
- `src/news/news-pagination.service.spec.ts` *(mới)*

**frontend**
- `src/components/sections/news-slider.tsx` *(mới)* + test *(mới)*
- `src/components/ui/pagination.tsx` *(mới)* + test *(mới)*
- `src/lib/pagination.ts` *(mới)* + test *(mới)*
- `src/components/sections/home-latest-news.tsx` — dùng slider, nạp 1 trang
- `src/app/[locale]/tin-tuc/page.tsx` — phân trang + redirect chuẩn hoá + metadata
- `src/lib/api/news.ts` — `getNewsPage`, `NEWS_PAGE_SIZE`, `HOME_NEWS_LIMIT`
- `src/lib/api/types.ts` — `PaginatedDto<T>`
- `src/lib/i18n/dictionaries/{vi,en}.json` + `get-dictionary.ts` — `newsSlider`, `pagination`

**admin**
- `e2e/public/news-slider-pagination.e2e.ts` *(mới)* — không đụng code sản phẩm admin.
