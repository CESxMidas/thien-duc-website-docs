# Kế hoạch công việc phần Coding — Website Thiên Đức (PA2)

> Dựa trên `Báo cáo phương án kỹ thuật website Thiên Đức.docx` (cùng thư mục) + hiện trạng mã nguồn kiểm tra ngày 2026-07-10. File này chỉ liệt kê **việc code cụ thể**, tách riêng khỏi các câu hỏi cần công ty trả lời (xem `CAU-HOI-CAN-XAC-NHAN.md`).
>
> Thư mục `docs/` nằm ở cấp workspace, dùng chung cho `thien-duc-website-frontend`, `thien-duc-website-admin` và `thien-duc-website-backend`. Quy ước code chung cho cả 3: `../AGENTS.md` (gốc workspace).

## Hiện trạng (cập nhật 2026-07-10)

- **Đã deploy production** (xem `DEPLOY.md`): Frontend (Next.js) → **Vercel**, Backend (NestJS + Prisma) + PostgreSQL → **Render** (`render.yaml` Blueprint). Luồng gửi form liên hệ đã chạy thật end-to-end trên production (POST `/api/contact` trả `201`, bản ghi lưu vào bảng `contact_submissions` OK).
- Backend `thien-duc-website-backend/` chạy được cả local lẫn production: NestJS 11 + Prisma 7 + PostgreSQL 17 (local dùng Docker, port **5433** — vì máy dev có Postgres Windows chiếm 5432).
- Migration `init` (12 bảng) đã áp vào DB; đã test thật `GET /api/projects`, `POST /api/contact` (lưu DB OK); Swagger tại `http://localhost:3001/api/docs` (local) và `…onrender.com/api/docs` (production).
- Lệnh chạy local: `docker compose up -d` → `npm run start:dev`. Xem dữ liệu: `npx prisma studio` (local) hoặc trỏ `DATABASE_URL` vào External URL của Render.
- **Admin CMS đã nối API thật 100%** — mọi trang (Tổng quan, Dự án, Tin tức, Trang nội dung, Banner, Liên hệ, Thư viện ảnh, Tài khoản) dùng `apiFetch` + TanStack Query; thư mục `src/data/` (mock) đã xóa.
- `tsc --noEmit` + `eslint` sạch (0 lỗi, 0 warning). CI lint+build đã có ở cả 2 repo.
- Câu trả lời nội dung thật (dự án, giới thiệu, pháp lý...) đã có cho câu 1–4, 6–8 — xem `CAU-HOI-CAN-XAC-NHAN.md`; có thể bắt đầu seed dữ liệu thật ở Sprint 1.

### Việc nên làm trước ở phiên tiếp theo

1. **Áp migration full-text lên production (Render)**: đã kiểm chứng trên DB local. Lưu ý `.env` dev đang trỏ vào Render — chạy `prisma migrate deploy` phải là hành động có chủ ý.
2. **Seed trang nội dung**: `GET /pages/gioi-thieu` và `/pages/lien-he` chưa có bản ghi nào trong DB, nên frontend đang chạy nhánh fallback tĩnh. Cần seed (hoặc nhập qua Admin CMS bằng `PageFormDialog` mới) để vòng đời "admin sửa → web hiện" chạy thật.
3. **Cron ngoài cho ED-08**: Render free tier ngủ sau 15 phút nên `@Cron` nội bộ không đủ. Đặt UptimeRobot/cron-job.org gọi `POST /api/news/publish-scheduled` (cần token ADMIN).
4. **Nhập bản dịch tiếng Anh cho nội dung CMS** — **chặn go-live** (câu 19: song ngữ bắt buộc). Công cụ đã sẵn: mở Admin CMS, mỗi field có nút VI/EN, chấm vàng = chưa dịch. Cần dịch: 4 dự án + hạng mục, 1 bài tin, banner, trang `gioi-thieu` / `lien-he`. Trang nội dung có cột "Đã dịch / Chưa dịch" để rà.
5. **Bấm tay kiểm thử Admin CMS**: `BannerFormDialog`, `PageFormDialog` và `BilingualField` mới viết chỉ qua `tsc` + `build`, chưa chạy thật (cần backend + DB + đăng nhập).
6. **Gửi email form liên hệ** vẫn là TODO trong `contact.service.ts` — chờ SMTP thật (câu 9).

> ⚠️ Render free tier: backend **ngủ sau 15 phút** không có request (request đầu tiên chậm ~30–50s, có thể làm form timeout ở FE — timeout FE đang đặt 10s). Cân nhắc UptimeRobot ping định kỳ hoặc nâng plan khi go-live. Postgres free hết hạn sau 90 ngày.
> ⚠️ Thời gian (`created_at`…) lưu **UTC**; hiển thị phải quy đổi giờ VN (UTC+7) bằng `formatDateTime` trong `src/lib/format.ts` (frontend).

## Quy ước

- Mỗi việc gắn mã báo cáo (YC-xx/ED-xx/CL-xx) khi có, để truy vết yêu cầu gốc.
- Trạng thái: `[ ]` chưa làm · `[~]` đang làm · `[x]` xong.
- Việc nào phụ thuộc câu trả lời của công ty sẽ ghi rõ **(chờ input)**.

---

## Sprint 0 — Tuần 1: Nền móng kỹ thuật

- [x] Khởi tạo repo `thien-duc-website-backend` (NestJS + Prisma + PostgreSQL), cấu trúc module theo mục 2.2 báo cáo: `auth`, `users`, `projects`, `news`, `pages`, `banners`, `contact`, `media`.
- [x] Viết schema Prisma theo ERD 12 bảng (mục 2.2.1): `users, projects, project_items, project_gallery, news_categories, news_posts, pages, banners, contact_submissions, media_assets, site_settings, refresh_tokens`. **(chờ input câu 1)** nếu cấu trúc dự án thay đổi — schema hiện tại dùng field song ngữ dạng JSON `{vi, en}` nên có thể sửa nội dung sau mà không đổi cấu trúc bảng.
- [x] Định nghĩa chuẩn response `{success, data, message}` / `{success:false, error:{code,message,details}}` làm middleware/interceptor dùng chung (mục 2.3) — `src/common/interceptors/response.interceptor.ts` + `src/common/filters/http-exception.filter.ts`.
- [x] Viết đặc tả API (OpenAPI/Swagger) — tự sinh tại `/api/docs` từ decorator trong controller (auth, users, projects, news, pages, banners, contact, media); cần rà lại field tên/kiểu dữ liệu cùng FE trước khi tách nhánh làm song song.
- [x] Đối chiếu `src/types/content.ts` (frontend) với schema Prisma — tên field khớp toàn bộ (schema thiết kế theo content.ts). Khác biệt có chủ đích, xử lý ở `src/lib/api/mappers.ts`: (1) field song ngữ backend là `{vi, en?}` → mapper lấy `vi`; (2) `ProjectStatus` backend là enum `DA_BAN_GIAO`… → mapper đổi về kebab-case; (3) `NewsPost.category` backend là quan hệ `{slug, name}` → mapper lấy `name.vi`. Đã bổ sung `ProjectItem` (content.ts) + `ProjectItemDto`, `ProjectGalleryImageDto` (lib/api/types.ts) + `mapProjectItem` cho route `du-an/[slug]/[hang-muc]` sắp làm.
- [x] Dựng `.env.example` cho backend (DATABASE*URL, JWT*_, CLOUDINARY\__, SMTP*\*) **và frontend** (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`). CLOUDINARY*_/SMTP\__ vẫn **(chờ input câu 9, 12)** để điền giá trị thật.
- [x] Setup CI tối thiểu: lint + build tự động khi mở PR ở cả 2 repo (`.github/workflows/ci.yml`). **Hosting đã chốt (câu 11): Vercel (FE) + Render (BE + Postgres)** — auto-deploy khi push `main` (`render.yaml` + Vercel Git integration).

## Sprint 1 — Tuần 2–3: Auth + CRUD dự án

- [x] `auth` module: đăng nhập email/password, JWT access + refresh token, khóa tạm tài khoản sau 5 lần sai (ED-01). Access 15 phút + refresh 30 ngày (lưu SHA-256 hash, xoay vòng khi refresh); khóa 15 phút sau 5 lần sai → trả **423 Locked**; thêm `GET /auth/me`; 14 unit test ở `src/auth/auth.service.spec.ts`. Phía Admin CMS: `apiFetch` tự làm mới token khi 401, khôi phục phiên khi tải lại trang, map lỗi sang toast tiếng Việt.
- [x] `users` module: CRUD tài khoản, gán vai trò Editor/Admin/Super Admin (KB-10). **(chờ input câu 18 nếu cần thêm vai trò)** Backend: email trùng trả 409; khóa/mở khóa qua `isActive`; đặt lại mật khẩu; chặn tự đổi vai trò, tự khóa, tự xóa và chặn hạ quyền/khóa Super Admin cuối cùng. Bảo mật: khóa tài khoản / đổi vai trò / đổi mật khẩu đều **thu hồi toàn bộ refresh token**, và `/auth/refresh` từ chối tài khoản đã bị vô hiệu hóa (trước đây người bị khóa vẫn gia hạn phiên vô hạn). 18 unit test ở `src/users/users.service.spec.ts`. Admin CMS: trang Tài khoản đã nối API thật (thêm/sửa/khóa/mở khóa, xác nhận trước khi khóa).
- [x] `projects` module: CRUD dự án + `project_items` (hạng mục con) + `project_gallery`, trạng thái nháp/chờ duyệt/đã đăng (ED-03). Backend: `GET /projects` (chỉ bài đã đăng) + `GET /projects/admin` (kèm nháp/chờ duyệt), CRUD dự án/hạng mục/ảnh, `PATCH /projects/:slug/status` để duyệt (ADMIN trở lên), sắp xếp ảnh bằng `PATCH /projects/:slug/gallery/reorder`. Admin CMS: trang Dự án đã bỏ mock, nối API thật + modal chi tiết 3 tab **Thông tin / Hình ảnh / Hạng mục**. Đã sửa `ProjectStatus` phía admin (trước khai báo sai `SAP_MO_BAN`, `DANG_MO_BAN` — enum thật chỉ có `DA_BAN_GIAO`, `DANG_THI_CONG`, `CHUAN_BI_KHOI_CONG`).
- [x] Migrate dữ liệu mẫu từ `src/data/projects.ts` vào DB làm dữ liệu seed/test — `prisma/seed-projects.js` (`npm run prisma:seed:projects`, idempotent). **4 dự án** (Hưng Phú, La Bonita, Silver Sea Tower, Bảy Hiền Tower); Fancy Tower là **hạng mục con** của Khu đô thị Hưng Phú chứ không phải dự án độc lập (câu 7). Đã bổ sung `gallery_sections` + `map_location` vào seed và sửa lỗi `highlights` seed dạng mảng chuỗi trong khi mapper FE đọc `{vi}` — nay seed đúng dạng field song ngữ. Chỉ còn thiếu ảnh thật.
- [x] Frontend: tạo route còn thiếu `src/app/du-an/[slug]/[hang-muc]/page.tsx`, dùng cùng cấu trúc với `du-an/[slug]` hiện có. Trang dự án cha có thêm mục "Hạng mục trong dự án"; trang hạng mục có breadcrumb 4 cấp + khối "Hạng mục khác" để chuyển giữa các hạng mục anh em. `next build` prerender đúng 3 hạng mục của Hưng Phú.
- [x] Viết lớp fetch API phía frontend (`src/lib/api/*`) thay thế dần import trực tiếp từ `src/data/projects.ts`, giữ interface tương thích để không phải sửa component UI. `du-an`, `du-an/[slug]`, `du-an/[slug]/[hang-muc]` và `home-featured-projects` nay lấy dữ liệu qua `getProjects` / `getProjectBySlug` / `getProjectItem`; nhãn trạng thái tách sang `src/lib/project-status.ts`. `src/data/projects.ts` chỉ còn là nguồn mock khi chưa đặt `NEXT_PUBLIC_API_URL`. `apiFetch` phân biệt 404 (trả `undefined` → `notFound()`) với lỗi thật.

## Sprint 2 — Tuần 4–5: CRUD tin tức + Cloudinary

> **Cloudinary đã chốt (câu 12)**: tài khoản free tier, cloud name `thienduc`, API key role Master Admin. Ảnh xếp theo thư mục `projects/<slug>/`, `news/<year>/`, `banners/`, `pages/` — **không** tạo tài khoản riêng cho từng dự án. Theo quyết định của chủ dự án: chỉ dùng một môi trường **production**, không tách dev/preview.

- [x] `news` module: CRUD `news_categories`, `news_posts`, luồng nháp → gửi duyệt → xuất bản (ED-04). Bổ sung `GET /news/categories` + CRUD chuyên mục, `GET /news/admin` và `GET /news/admin/:slug` (kèm nháp/chờ duyệt). **Vá lỗ bảo mật**: `GET /news/:slug` công khai trước đây trả cả bài `DRAFT`/`PENDING` cho ai đoán đúng slug. Slug trùng trả `409` thay vì `500`. `updateStatus` không còn ghi đè `publishedAt` mỗi lần đăng lại. Sửa `CreateNewsPostDto.content` từ `@IsObject()` → **mảng** `TranslatedTextDto[]` cho khớp `NewsPostDto.content: LocalizedText[]` mà FE đọc (trước đây Admin CMS gửi nội dung bài sẽ nhận `400`).
- [x] `media` module: tích hợp Cloudinary upload, tối ưu ảnh (WebP, giới hạn 1200px) (ED-05, mục 2.1.4). `POST /media/upload` (multipart) nhận `?folder=`, chặn mime ngoài jpeg/png/webp/avif và file >10MB, ép transform `width/height 1200 crop:limit` + `quality:auto:good` + `fetch_format:webp` — ảnh lưu thật nhỏ hơn 2MB rất nhiều. `folder` được làm sạch chống thoát thư mục (`news/../../hack` → `news/hack`). `publicId` lưu **đủ đường dẫn thư mục**, thiếu tiền tố thì `destroy` im lặng không xóa và ảnh vẫn ăn quota. `DELETE /media/:id` xóa ảnh trên cloud **trước**, thất bại thì giữ nguyên bản ghi DB (tránh asset mồ côi). Đã test thật đầu-cuối: upload → 200 trên CDN → xóa → 404 cả DB lẫn Cloudinary.
- [x] Thay `src/data/news.ts` bằng dữ liệu lấy từ API — `tin-tuc/page.tsx`, `tin-tuc/[slug]/page.tsx`, `home-latest-news.tsx` nay dùng `getNewsPosts`/`getNewsPostBySlug`. Sửa `getNewsPostBySlug` dùng `apiFetchOptional` (trước dùng `apiFetch` nên bài không tồn tại ra lỗi 500 thay vì trang 404). `src/data/news.ts` chỉ còn là nguồn mock khi chưa đặt `NEXT_PUBLIC_API_URL`.
- [x] Seed tin tức thật — `prisma/seed-news.js` (`npm run prisma:seed:news`, idempotent, có chốt `SEED_CONFIRM_PRODUCTION=yes`). 3 chuyên mục (Tin dự án / Tin công ty / Tin thị trường) + **1 bài thật duy nhất** "Lễ khởi công Fancy Tower" theo đúng câu 3 — không bịa thêm tin demo.
- [x] `pages` module: CRUD nội dung trang tĩnh (ED-07). **Vá lỗ bảo mật** giống `news`: `GET /pages` và `GET /pages/:slug` công khai trước đây trả cả trang `DRAFT`. Thêm `GET /pages/admin` + `GET /pages/admin/:slug`, slug trùng trả `409`.
- [x] `banners` module: CRUD banner trang chủ, thứ tự hiển thị (ED-06). Thêm `GET /banners/admin` (kèm banner đã tắt — trước đây admin không có cách nào xem), `PATCH /banners/reorder` (bắt gửi đủ danh sách id, chặn trùng lặp, ghi `order` trong transaction), và chốt thứ tự `order, createdAt` để banner không nhảy chỗ khi `order` trùng nhau.
- [x] Đã tạo tài khoản `SUPER_ADMIN` đầu tiên bằng `npm run prisma:seed` — gỡ chặn cuối của Sprint 1/3 (đăng nhập Admin CMS thật).
- [x] **Admin CMS**: nối API thật cho Tin tức, Banner, Trang nội dung, Thư viện ảnh — xong, không còn `mockAsync` trong `queries.ts`. Banner sắp xếp lên/xuống qua `useReorderBanners` (`PATCH /banners/reorder`); Thư viện ảnh upload + xóa (`useUploadMedia`/`useDeleteMedia`); Tin tức có luồng nháp → gửi duyệt → đăng (`useUpdateNewsStatus`) + CRUD chuyên mục.

> 🐛 **Lỗi có sẵn đã sửa trong sprint này**: `.env` local thiếu `?sslmode=require` nên `PrismaService` (adapter `@prisma/adapter-pg`) không nối được Render — **mọi** route chạm DB trả `500`, kể cả `/api/projects` của Sprint 1. Prisma CLI vẫn chạy được vì dùng engine riêng, khiến lỗi rất dễ bị bỏ qua. Xem `DEPLOY.md`.

## Sprint 3 — Tuần 6–7: CMS Admin + Form liên hệ + Email

- [x] Khởi tạo project Admin CMS riêng (Vite + React), layout Dashboard (ED-02): số form mới, bài chờ duyệt, lối tắt tạo dự án/tin — xong (`thien-duc-website-admin/`). **Toàn bộ 8 trang đã nối API thật**; số liệu trang Tổng quan suy ra từ `useLeads`/`useNews`/`useProjects` chứ không còn số cứng.
- [x] **Module đăng nhập Admin đã nối API thật** (`POST /auth/login`, sonner toast): `AuthContext` decode JWT → user, token lưu localStorage/sessionStorage theo "Ghi nhớ đăng nhập", `ProtectedRoute` + phân quyền + trang `/403`, xử lý 401 (hết phiên → về login) / 403 / lỗi mạng bằng toast, đăng xuất thu hồi refresh token. Đã gỡ chặn: tài khoản `SUPER_ADMIN` đầu tiên tạo bằng `npm run prisma:seed`.
- [x] Màn hình duyệt nội dung cho Admin: chấp nhận/trả lại bài-dự án-banner (KB-06). **Dự án** (tab Thông tin trong modal chi tiết: Gửi duyệt / Duyệt & đăng / Trả về nháp, chỉ ADMIN trở lên), **Tin tức** (`useUpdateNewsStatus`) và **Trang nội dung** (`useUpdatePageStatus`) đều đã có. Banner không theo luồng duyệt mà bật/tắt hiển thị + sắp thứ tự.
- [~] `contact` module: `POST /contact` lưu `contact_submissions` **đã xong** + giới hạn 5 request/IP/giờ **đã xong** (`@Throttle`); **còn thiếu** gửi email thông báo (TODO trong `contact.service.ts`, chờ SMTP thật — câu 9) (YC-09, mục 2.2).
- [x] Sửa `src/components/sections/contact-form.tsx`: đã bỏ `mailto`, gọi API `POST /contact` qua `src/lib/api/contact.ts` (có honeypot chống bot, validate phía client, xử lý lỗi rate-limit/network, timeout 10s), hiển thị trạng thái gửi thành công/lỗi. Khi chưa đặt `NEXT_PUBLIC_API_URL` thì tự chạy chế độ mock.
- [x] Màn hình quản lý lead cho Admin/Super Admin: đổi trạng thái Mới → Đang xử lý → Hoàn thành, ghi chú nội bộ (KB-08). `ContactPage` đã bỏ mock, nối `GET /contact` thật; `LeadDetailDialog` cho đổi trạng thái + ghi chú nội bộ, nút Lưu chỉ bật khi có thay đổi, số điện thoại/email là link `tel:`/`mailto:`, bảng gắn nhãn "Có ghi chú nội bộ". Thời gian hiển thị bằng `formatDateTime` (giờ VN). **Sửa backend**: `UpdateContactSubmissionDto.status` trước đây **bắt buộc** nên chỉ lưu ghi chú cũng bị `400` — nay optional, đúng ngữ nghĩa `PATCH`.
- [ ] Cấu hình email thật thay Yahoo tạm. **(chờ input câu 9)**

## Sprint 4 — Tuần 8–9: Song ngữ, tìm kiếm, SEO, nối API

- [x] Cấu trúc `[locale]` routing. **Tiếng Việt không tiền tố** (`/du-an` giữ nguyên URL production), **tiếng Anh có tiền tố** (`/en/du-an`); `/vi/...` redirect 308 về bản không tiền tố để chỉ có một URL chính tắc. Toàn bộ `src/app/*` đã chuyển vào `src/app/[locale]/`. **Next.js 16 đổi `middleware.ts` → `proxy.ts`** — logic rewrite/redirect nằm ở `src/proxy.ts`, `next.config.ts` không còn `redirects()`. Lõi i18n: `src/lib/i18n/config.ts` (`localizePath`, `splitLocale`), `get-dictionary.ts` + `dictionaries/{vi,en}.json`. `SiteShell` nhận `locale`, nạp dictionary ở server rồi truyền xuống header/footer nên hai file dịch không vào bundle client. Có `LanguageSwitcher` (cố ý không dùng `useSearchParams` — hook đó nằm trong shell dùng chung sẽ ép mọi trang tĩnh rơi vào render động).
- [~] Nội dung song ngữ JSONB: **hạ tầng + công cụ nhập liệu xong, chưa có bản dịch thật**. `mappers.ts` nhận `locale`, đọc `.en` và **tự fallback về `.vi`** khi thiếu (chuỗi `en` rỗng cũng coi như thiếu). Chuỗi giao diện tĩnh đã dịch trong `dictionaries/en.json`; nhãn nav/footer đánh khóa theo `href` để không phải sửa `data/navigation.ts` / `data/footer.ts`. **Câu 19 đã có trả lời: song ngữ BẮT BUỘC ở go-live** — xem mục Admin CMS bên dưới về ô nhập `en`. Nội dung tiếng Anh do biên tập viên nhập, không tự chế.
- [x] **Admin CMS nhập được tiếng Anh** (hệ quả của câu 19). Thêm `components/ui/BilingualField.tsx` (nút VI/EN, chấm vàng báo thiếu bản dịch) + `lib/bilingual.ts`. Đã gắn vào Dự án, Hạng mục, Tin tức. Viết mới `BannerFormDialog` và `PageFormDialog` — trước đó nút "Thêm banner" bị `disabled` và "Tạo trang" không gắn handler, tức **banner và trang nội dung chưa từng nhập được qua CMS, kể cả tiếng Việt**. Trang nội dung thêm nút Đăng / Về nháp (ADMIN trở lên) vì website công khai chỉ đọc trang `PUBLISHED`, và cột "Tiếng Anh: Đã dịch / Chưa dịch" để thấy ngay chỗ còn thiếu trước go-live.
- [x] **Câu 18**: chốt đúng 3 cấp `SUPER_ADMIN` / `ADMIN` / `EDITOR` — enum `Role` hiện tại đã khớp, không phải sửa code.
- [x] Tìm kiếm full-text (YC-10). **Backend trước đây chưa có module search** — đã thêm `src/search/` (`GET /search?q=&type=all|projects|news&limit=`), xếp hạng bằng `ts_rank`. Migration `20260710120000_add_fulltext_search` tạo hai hàm `IMMUTABLE` (`project_search_document`, `news_search_document`) + index GIN trên đúng lời gọi hàm đó — gói biểu thức vào hàm để index và câu truy vấn không bao giờ lệch nhau. Dùng ts config `simple` (Postgres không có config tiếng Việt; `english` sẽ cắt gốc từ sai). Frontend: `src/lib/api/search.ts` gọi API thật; **`matchesSearchQuery` (lọc phía client) đã bị gỡ khỏi `src/lib/search.ts`**. `/tin-tuc?q=` và `/du-an?q=` nay tìm phía server.
- [x] SEO (YC-12): `src/lib/seo.ts` gom canonical + hreflang + Open Graph + Twitter Card. Mọi trang tĩnh đã có `generateMetadata`. Thêm `src/app/sitemap.ts` (mỗi URL khai báo một lần theo bản `vi` kèm `alternates` hreflang + `x-default`) và `src/app/robots.ts`. **5 trang còn là khung placeholder** (`tuyen-dung`, `cong-ty-thanh-vien`, `so-do-to-chuc-cong-ty`, `dao-tao`, `chinh-sach-nhan-su` — chờ câu 5) bị gắn `noindex` và loại khỏi sitemap; xem `placeholderPaths` trong `seo.ts`, gỡ slug khỏi mảng đó khi có nội dung thật.
- [x] Đặt lịch đăng bài tự động (ED-08) — `@nestjs/schedule` + `src/news/news-scheduler.service.ts`, chạy mỗi 5 phút. Idempotent nhờ **một câu UPDATE nguyên tử** có điều kiện `status <> 'PUBLISHED'`: chạy lại không đăng trùng, hai instance cũng không tranh nhau (Postgres khóa hàng). Lỗi được log và bỏ qua để cron không chết. Thêm `POST /news/publish-scheduled` (ADMIN+) để cron ngoài gọi — **cron nội bộ không chạy khi Render free tier ngủ**, nên cần UptimeRobot/cron-job.org gọi route này.
- [x] Nối nốt frontend với API thật. `home-banner-slider.tsx` nay nhận dữ liệu từ `getBanners()` qua wrapper server `home-banner-section.tsx` (carousel vẫn là client component). `gioi-thieu` + `lien-he` đọc `GET /pages/:slug` qua `src/lib/api/pages.ts`, **fallback về `data/about.ts` / `data/contact.ts` khi CMS chưa có bản ghi** — chỉ phần chữ (tiêu đề + đoạn văn) thuộc CMS, các khối có bố cục riêng (giá trị cốt lõi, quy trình liên hệ, bản đồ) vẫn là UI tĩnh. `data/home.ts`, `data/navigation.ts`, `data/footer.ts` giữ nguyên như yêu cầu.

> 🐛 **Lỗi có sẵn đã sửa trong sprint này**:
> 1. **Lộ dự án `DRAFT`**: `GET /projects/:slug`, `/:slug/gallery`, `/:slug/:itemSlug` là route công khai nhưng `findBySlug` không lọc `contentStatus` — đoán đúng slug là đọc được dự án nháp. Đã thêm `publishedOnly` (giống `news`/`pages`) và thêm `GET /projects/admin/:slug` + `/admin/:slug/gallery` cho Admin CMS (đã trỏ `admin/src/lib/api/projects.ts` sang route mới).
> 2. **Không tạo được trang nội dung từ CMS**: `CreatePageDto.content` khai `@IsObject()`, nhưng class-validator **loại mảng ra khỏi "object"** — Admin gửi `Bilingual[]` luôn nhận `400`. Đã đổi sang `TranslatedTextDto[]`, cùng quy ước với `NewsPost.content`.
> 3. **Sửa hạng mục dự án làm mất bản dịch tiếng Anh**: `ProjectItemsTab` gửi `title: { vi }`, mà `PATCH` ghi đè nguyên field JSON — `en` đã nhập bị xóa âm thầm. Nay gửi lại cả hai ngôn ngữ.

> ✅ **Đã kiểm chứng trên DB local** (2026-07-10, Postgres 17 qua Docker port 5433):
> - Migration `20260710120000_add_fulltext_search` áp thành công; hai hàm `IMMUTABLE` và hai index GIN tồn tại đúng.
> - `EXPLAIN` cho thấy truy vấn dùng **`Bitmap Index Scan on projects_search_idx`**, không seq scan → mẹo gói biểu thức vào hàm `IMMUTABLE` hoạt động đúng ý đồ.
> - `GET /api/search` chạy thật: `Hưng Phú` → dự án + 1 tin, `Vũng Tàu` → Silver Sea Tower, `sổ hồng` → 2 dự án. `q` 1 ký tự → `400`, `limit=51` → `400`, từ khóa vô nghĩa → mảng rỗng.
> - ED-08: bài `DRAFT` quá hạn `scheduled_at` → `POST /news/publish-scheduled` lượt 1 đăng 1 bài, **lượt 2 đăng 0 bài**, hai lượt **song song cũng 0** → idempotent, không đăng trùng. `published_at` lấy đúng `scheduled_at` chứ không phải `NOW()`. Không token → `401`.
>
> ⚠️ **Chưa chạy trên production**: `.env` của máy dev trỏ `DATABASE_URL` vào **Render (production)**. Các lệnh trên đều chạy với `DATABASE_URL` override sang localhost. Trước go-live phải `prisma migrate deploy` lên Render một cách có chủ ý.

> 🔎 **Hạn chế đã biết của tìm kiếm**: dùng ts config `simple` nên **không bỏ dấu** — gõ `hung phu` (không dấu) không ra `Hưng Phú`. Người Việt gõ không dấu rất phổ biến. Cách xử lý: bật extension `unaccent` và bọc thêm `unaccent()` trong hai hàm `*_search_document` (cần migration mới + `CREATE EXTENSION unaccent`, xác nhận Render cho phép). Chưa làm trong sprint này.

## Nội dung thật từ các câu đã xác nhận (2026-07-10)

- [x] **Câu 2 — số liệu 4 dự án**: `data/projects.ts` đã thay nội dung tạm bằng số liệu thật (vị trí, diện tích, số tầng, số căn, tiến độ). Đổi tiêu đề "Dự án Vũng Tàu" → **Silver Sea Tower**, "Dự án Bảy Hiền" → **Bảy Hiền Tower**; **slug giữ nguyên** (`du-an-vung-tau`, `du-an-bay-hien`) để không hỏng liên kết đã phát ra ngoài.
  > ⚠️ **Đã lược bỏ có chủ đích**: câu trả lời gốc mô tả La Bonita "dính phốt lừa đảo… chủ mưu lãnh án chung thân", Bảy Hiền Tower "sai phạm xây dựng vượt tầng… chưa được cấp sổ hồng". Đây là ghi chú nội bộ, **không đăng lên website công khai của chính công ty**. Nội dung công bố chỉ giữ vị trí, quy mô, tiến độ. Trạng thái pháp lý chỉ nêu khi thuận lợi và đã xác nhận (Hưng Phú, Silver Sea Tower có sổ hồng lâu dài). Cần công ty duyệt lại phần này trước go-live.
  > ⚠️ Khối số liệu **Cần Thơ 43,44 ha** trong câu 2 là lỗi sao chép (công ty xác nhận) — đã xóa khỏi `CAU-HOI-CAN-XAC-NHAN.md`. Khu đô thị Hưng Phú = Bến Tre, 11,25 ha.
- [x] **Câu 6 — công ty thành viên**: `data/member-companies.ts` + trang `cong-ty-thanh-vien` dựng nội dung thật (người đại diện Trần Hữu Nghị + 3 pháp nhân). **Đã gỡ khỏi `placeholderPaths`** → bỏ `noindex`, đưa vào sitemap. Công ty chưa cung cấp MST/địa chỉ/ngành nghề từng đơn vị nên trang chỉ nêu tên, kèm lối liên hệ để hỏi thêm.
- [x] **Câu 7 — giới thiệu công ty**: `data/about.ts` bổ sung `aboutTimeline` (2010 · 2014-2018 CapitaLand · 2018-nay), `aboutStats` (16+ năm, 3 đại dự án, 1.152 căn Vista Verde, 11,25 ha Hưng Phú) và `aboutPortfolio` (Vista Verde, Feliz en Vista, Hưng Phú, Fancy Tower). Trang `gioi-thieu` render thêm 3 khối tương ứng.
- [x] **Câu 8 — thông tin pháp lý**: `legalInfo` trong `config/site.ts` (MST `0309910290`, tên pháp nhân đầy đủ, cơ quan quản lý) hiển thị ở dải chân trang.
- [~] **Câu 4 — tuyển dụng**: `data/careers.ts` + trang `tuyen-dung` đã dựng khung đầy đủ (giá trị, danh sách vị trí, quy trình 3 bước, nộp hồ sơ qua email). `openPositions` **cố ý để rỗng** — chưa có vị trí thật, trang hiện trạng thái "chưa có vị trí đang tuyển" và vẫn `noindex`. Đổ dữ liệu vào mảng đó là trang tự hiện.
- [ ] **Câu 5 — chính sách nhân sự / đào tạo**: vẫn chờ nội dung. Hai trang `dao-tao`, `chinh-sach-nhan-su` và `so-do-to-chuc-cong-ty` giữ `noindex`.

## Kho ảnh + giao diện dự án tiêu biểu (2026-07-10)

- [x] **Kho ảnh `thien-duc-website-resources/`**: 30 ảnh hiện có đã đưa vào `images/`, kèm `README.md` (quy ước đặt tên, bảng kiểm kê, danh sách ảnh còn thiếu, danh sách ảnh cần nén). Script `npm run sync:images` ở frontend đồng bộ một chiều kho → `public/images/`, so sánh bằng **hash nội dung** (dùng `mtime` sẽ chép lại mỗi lượt vì bản đích luôn mới hơn).
  > ⚠️ **Không tự lấy ảnh từ Internet**: Vista Verde, Feliz en Vista, Hưng Phú Mall chưa có ảnh. Ảnh của CapitaLand và các trang bất động sản thuộc bản quyền bên thứ ba — công ty phải cung cấp.
- [x] **Bỏ dạng bảng ở khối "Dự án tiêu biểu"** (trang Giới thiệu) → thẻ, cùng ngôn ngữ thị giác với trang chủ (`components/sections/about-portfolio.tsx`). Bảng 5 cột buộc khách hàng đọc ngang để ghép "Vai trò" với "Quy mô", và phải cuộn ngang trên điện thoại. Hai dự án CapitaLand không có ảnh → render **tấm chữ nêu quan hệ đối tác** thay vì mượn ảnh dự án khác (mượn ảnh là nói dối bằng hình).
- [x] **Slider ảnh cho mọi dự án**: `ProjectGallerySections` (đã có autoplay, thanh tiến trình, chấm điều hướng, tôn trọng `prefers-reduced-motion`) trước đây chỉ dùng khi dự án có `gallerySections`. Nay dự án chỉ có `gallery` phẳng (La Bonita, Silver Sea Tower) và trang hạng mục cũng dùng chung slider này thay vì lưới ảnh tĩnh. Thêm prop `sectionLabel` + tự ẩn đánh số khi chỉ có một khối.

> 🐛 **Lỗi dữ liệu đã sửa** (thấy trên bản deploy Vercel):
> 1. `location` trong seed lưu **địa chỉ đầy đủ** → thẻ dự án trang chủ hiện `SỐ 9 PHẠM PHÚ THỨ, PHƯỜNG 11, QUẬN TÂN BÌNH, TP.HCM` viết hoa giãn chữ, tràn hai dòng. Nay `location` là địa danh ngắn (`Tân Bình, TP.HCM`), địa chỉ đầy đủ chuyển vào `quickFacts`.
> 2. **Bảy Hiền Tower gắn nhãn `DANG_THI_CONG`** trong khi khối căn hộ đã bàn giao, hơn 150 hộ dân đang ở (câu 2) → đổi thành `DA_BAN_GIAO`.
> 3. Seed để câu **"Chưa được cấp sổ hồng"** trong mục *Điểm nổi bật* của trang công khai, và mô tả nhắc "UBND TP.HCM xem xét gỡ vướng". Đã thay bằng nội dung trung tính về vị trí và tiện ích ngoại khu.
> 4. Mock frontend chỉ để **một** ảnh trong `gallery` (ảnh bìa nằm riêng ở `image`) nên slider chỉ có 1 ảnh và ẩn hết điều hướng, trong khi seed backend để cả hai. Đã đồng bộ mock theo seed.

> 📌 Seed đã sửa nhưng **chưa chạy lại trên production**. Cần `npm run prisma:seed:projects` với `DATABASE_URL` trỏ Render (có chốt `SEED_CONFIRM_PRODUCTION=yes`) thì nội dung mới lên web thật.

## Tinh chỉnh UI/UX phần dự án (2026-07-11)

Rà lại trải nghiệm trên bản deploy (dùng skill `frontend-design` + `ui-ux-pro-max`), giữ nguyên bảng màu thương hiệu. `lint` + `next build` sạch, cả 8 trang dự án + hạng mục prerender OK.

- [x] **Hai panel "Thông tin nhanh / Tổng quan dự án" cân chiều cao**: mô tả + đoạn giới thiệu bản đồ nay `line-clamp` (6 / 3 dòng) để cột phải không cao vống hơn cột trái. **Bỏ dải địa chỉ + nút "Xem trên Google Maps"** trong panel Tổng quan vì khối bản đồ `ProjectLocationMap` ngay dưới đã có đủ địa chỉ và nút chỉ đường — trước đây trùng lặp và làm lệch chiều cao.
- [x] **Gộp hạng mục thành một showcase tự chạy** — mới `components/sections/project-items-carousel.tsx`. Trước đây hạng mục hiện **hai lần** (lưới thẻ tĩnh + khối `gallerySections` cùng tên Fancy Tower) gây trùng lặp; nay chỉ còn một carousel tự chuyển slide (ảnh + thông tin từng hạng mục, dẫn tới trang chi tiết), có thanh tiến trình, chấm điều hướng, mũi tên, tạm dừng khi hover, tôn trọng `prefers-reduced-motion`. Thứ tự khối ảnh trang dự án: có `items` → carousel; không → `gallerySections`; không → `gallery` phẳng.
- [x] **Dự án không có hạng mục (La Bonita, Silver Sea, Bảy Hiền)**: slider ảnh nay chạy tự động và **bỏ tiêu đề khối "Thư viện ảnh …" + đầu thẻ "Thư viện / {tên}"** (phần khoanh đỏ trong ảnh phản hồi) — tên dự án đã ở tiêu đề trang. Thêm prop `hideHeader` cho `ProjectGallerySections`.
- [x] **Trang hạng mục dựng lại bố cục hai cột cân bằng** (`du-an/[slug]/[hang-muc]`): cột trái `ProjectItemGallery` mới (ảnh đại diện lớn + list ảnh con chạy slide ngay dưới, bấm chọn hoặc tự chuyển); cột phải **gộp** Thông tin nhanh + Tổng quan hạng mục vào một panel duy nhất, đặt ngang và cùng chiều cao với cột ảnh. Hạng mục không có ảnh → panel thông tin chiếm trọn chiều ngang.
- Hạng mục nhiều ảnh vẫn chạy slide như cũ (yêu cầu giữ nguyên).

> 📌 Chỉ mới `lint` + `build`, **chưa chạy thật trên trình duyệt**. Nên mở dev (`npm run dev`) rà nhanh: carousel hạng mục Hưng Phú, slider ảnh phẳng Bảy Hiền/La Bonita, và bố cục hai cột trang Fancy Tower trên cả desktop lẫn mobile trước khi chốt.

### Đợt 2 — Đồng nhất bố cục mọi dự án (2026-07-11)

Phản hồi: bố cục giữa các dự án chưa đồng nhất, lấy **Khu đô thị Hưng Phú làm chuẩn**. `lint` + `next build` sạch, prerender OK.

- [x] **Bản đồ cho mọi dự án**: Hưng Phú giữ bản đồ minh hoạ vẽ tay (`ProjectLocationMap`); La Bonita / Silver Sea / Bảy Hiền nay **nhúng Google Maps** (`ProjectMapEmbed`, `output=embed`, không cần API key) — địa chỉ suy từ quickFact "Địa chỉ" hoặc "tên + địa danh". **Có bản đồ thì ẩn ảnh hero trùng ở trên**, ảnh dự án chuyển vào cạnh bản đồ (đồng bộ cách Hưng Phú làm). Không suy được địa chỉ thì không render (không để khối trống). *Chốt hướng: chủ dự án chọn nhúng Google Maps thay vì chờ ảnh map vẽ tay.*
- [x] **Cân hai panel Thông tin nhanh / Tổng quan**: cột trái (lưới thông số) dùng `flex-1 auto-rows-fr` + ô căn giữa để **giãn đều lấp hết chiều cao**, bỏ khoảng trống thừa ở đáy (phần khoanh đỏ trong ảnh phản hồi). Cột phải `line-clamp` mô tả (6/3 dòng) để không cao vống hơn cột trái.
- [x] **Thư viện ảnh dự án không hạng mục** (`ProjectPhotoStrip`): xếp ảnh thành **hàng tối đa 3 ảnh, tự trượt** (scroll-snap) khi > 3 ảnh; ít ảnh thì hiện lưới tĩnh gọn. Là khối song song với carousel hạng mục để bố cục các dự án đồng nhất.
- [x] **Footer bớt khoảng trống dư thừa**: gom dải "Liên hệ" (điện thoại/email/trụ sở) full-width thưa thớt thành **một cột trong hàng trên** cạnh 3 cột điều hướng — hàng trên lấp đầy, hết khoảng trống ngang. Thêm nhãn `footer.contact` song ngữ (VI "Liên hệ" / EN "Contact").

> ⚠️ **Cần ảnh thật để thấy slide**: kho ảnh hiện chỉ có **1–2 ảnh/dự án** (La Bonita 2, Silver Sea 2, Bảy Hiền 1) nên `ProjectPhotoStrip` đang hiện hàng tĩnh, chưa trượt. Có ≥ 4 ảnh (upload qua Admin → tab Hình ảnh) là tự chạy slide. Cùng với việc bổ sung ảnh đại diện cho hạng mục Hưng Phú Mall / Khu nhà ở thấp tầng — xem mục Admin bên dưới.

> 🔧 **Admin còn thiếu ô cho hạng mục**: form hạng mục (`ProjectItemsTab`) mới nhập được tên/slug/mô tả ngắn/trạng thái/ảnh đại diện; **chưa có ô mô tả chi tiết (`description`), giá trị nổi bật (`highlights`), thông số (`quickFacts`)** dù backend + FE đều hỗ trợ. Thư viện ảnh con của hạng mục thì đã nhập được qua tab Hình ảnh (chọn "Thuộc hạng mục"). Nên bổ sung 3 ô này để trang hạng mục hiện đầy đủ như thiết kế.

### Đợt 3 — Cơ cấu lại nội dung trang chủ ↔ giới thiệu, chống trùng lặp (2026-07-11)

Phản hồi: nội dung lặp giữa trang chủ và trang Giới thiệu; cần tối ưu UI/UX + SEO trước khi go-live. `lint` + `tsc --noEmit` sạch.

- [x] **Bỏ "Dự án tiêu biểu" ở trang Giới thiệu** — trang chủ đã có khối `HomeFeaturedProjects` (lấy dự án chủ đầu tư từ API), nên khối tĩnh trùng ở `/gioi-thieu` là dư thừa. Đã xoá `about-portfolio.tsx` + dữ liệu `aboutPortfolio`/`PortfolioProject`.
- [x] **"Lĩnh vực hoạt động" gom về một nơi (trang Giới thiệu)** — bỏ khối `HomeCapabilities` ở trang chủ; nội dung ngành nghề chỉ còn ở `/gioi-thieu` (dùng `aboutFields = businessFields`). Đã xoá `home-capabilities.tsx` + export `homeCapabilities`.
- [x] **Section mới "Dự án hợp tác" ở trang chủ** (`home-cooperation.tsx`): slider một hàng ngang (scroll-snap, tự chạy, tôn trọng `prefers-reduced-motion`, tạm dừng khi hover/focus, có mũi tên + chấm chỉ báo). Chứa dự án đồng phát triển cùng CapitaLand (Vista Verde, Feliz en Vista) — trước đây nằm lẫn trong "Dự án tiêu biểu" của trang Giới thiệu. Đây là tín hiệu uy tín (đối tác quốc tế) không trùng với trang nào khác. Ảnh do đối tác giữ bản quyền nên thẻ dùng nền thương hiệu + thông tin, không mượn ảnh. Dữ liệu tĩnh (`homeCooperation` trong `data/home.ts`), **không cần đổi backend**.
- Bố cục trang chủ sau chỉnh: Banner → Dự án tiêu biểu → Dải giới thiệu (thế mạnh) → **Dự án hợp tác** → Tin tức mới → CTA liên hệ.
- Thêm utility `.no-scrollbar` trong `globals.css` cho track slider.

### Đợt 3b — Dự án hợp tác quản lý từ CMS (2026-07-11)

Yêu cầu: sau này thêm dự án hợp tác mới phải làm được từ Admin, không sửa code.
Đã dựng CRUD xuyên suốt 3 project. `build`/`lint`/`tsc` sạch ở cả 3 (backend
build + admin build pass; frontend `tsc --noEmit` + `eslint` sạch — frontend
`next build` cần backend chạy để prerender như thường lệ).

- [x] **Backend**: model `CooperationProject` (bảng `cooperation_projects`, mọi
  field chữ song ngữ `{vi,en?}` + `contentStatus` + `order`), module
  `cooperation` (controller/service/dto). Route công khai `GET /cooperation`
  **chỉ trả `PUBLISHED`**; route admin `GET /cooperation/admin`, POST, PATCH
  `:id`, PATCH `reorder`, PATCH `:id/status` (ADMIN), DELETE (ADMIN).
- [x] **Admin CMS**: trang "Dự án hợp tác" (`/du-an-hop-tac`) — DataTable + kéo
  thứ tự bằng mũi tên, badge trạng thái bấm để đăng/ẩn, form RHF+Zod
  (`CooperationFormDialog`) với `BilingualField`. Thêm mục sidebar (icon
  Handshake) đặt ngay sau "Dự án".
- [x] **Frontend**: `getCooperationProjects()` (`lib/api/cooperation.ts`) — gọi
  `/cooperation`, fallback mock tĩnh `homeCooperation` khi chưa bật API.
  `HomeCooperation` tách thành server (fetch) + `CooperationSlider` (client).

> ⚠️ **Phải áp migration trước/khi deploy**: `prisma/migrations/20260711120000_add_cooperation_projects`
> đã tạo sẵn nhưng **chưa áp** (`.env` dev trỏ Render/production, không tự chạy
> `migrate dev`). Trên production chạy `prisma migrate deploy` có chủ ý; local
> bật Docker (port 5433) rồi `migrate deploy` hoặc `migrate dev`. Cho tới khi áp,
> `GET /cooperation` sẽ 500 (bảng chưa tồn tại) → nếu bật API, section trang chủ
> hỏng. Có seed sẵn 2 dự án CapitaLand: `npm run prisma:seed:cooperation`
> (production cần `SEED_CONFIRM_PRODUCTION=yes`).

## UAT + Go-live — Tuần 10

- [ ] Chạy checklist nghiệm thu go-live đầy đủ (xem mục 3.3 báo cáo / mục 4 file kế hoạch tổng — `ke-hoach-thien-duc.md`).
- [ ] Đo Lighthouse (Performance ≥ mục tiêu CL-02, SEO ≥ 90 - CL-10) trên staging.
- [ ] Test tải k6 cho 50–100 người đồng thời (CL-04, CL-05).
- [ ] Test khôi phục backup DB (CL-09).
- [ ] Cấu hình HTTPS + domain chính thức + DNS. **(chờ input câu 10)**
- [ ] UAT thủ công với Editor + Admin thật trên toàn bộ luồng (đăng nhập, soạn bài, duyệt, form liên hệ, upload ảnh).
- [ ] Xác nhận nội dung không còn placeholder (dự án, tin tức, tuyển dụng, thông tin pháp lý). **(chờ input câu 1–8)**

---

## Việc kỹ thuật có thể bắt đầu ngay, không cần chờ công ty trả lời

- [x] Khởi tạo repo backend + schema Prisma nháp (có thể chỉnh sau khi có input) — `thien-duc-website-backend/`.
- [x] Viết đặc tả API/OpenAPI — Swagger tự sinh tại `/api/docs`.
- [x] Dựng khung Admin CMS (UI, chưa cần nội dung thật) — `thien-duc-website-admin/`. **Công nghệ đúng mục 2.5 báo cáo**: Vite + React 19 + TS, **shadcn/ui** + Tailwind v4, **TanStack Query** (`src/lib/api/queries.ts`), **React Hook Form + Zod** (form đăng nhập + `ProjectFormDialog`). Có: đăng nhập giả lập + route bảo vệ, layout Dashboard (sidebar + topbar), trang Tổng quan (form mới / nội dung chờ duyệt / lối tắt tạo dự án-tin — ED-02), các trang danh sách Dự án / Tin tức / Trang nội dung / Banner / Liên hệ (lead, lọc trạng thái) / Thư viện ảnh / Tài khoản. Dữ liệu **đã nối API thật toàn bộ** qua `VITE_API_URL` (mock đã gỡ). `npm run build` + `lint` sạch.
- [x] Viết lớp `src/lib/api/*` cho frontend với dữ liệu mock giống schema dự kiến — client (bật/tắt qua `NEXT_PUBLIC_API_URL`) + DTO types + mock từ `src/data/*` + mapper về type UI; còn việc thay import trong component (Sprint 1).
- [x] Setup CI/CD tối thiểu (lint + build) cho cả 2 repo, `.env.example` cho backend. Còn thiếu: cấu trúc `[locale]` routing.

## Việc bắt buộc phải có input công ty trước khi code có ý nghĩa

- ~~Toàn bộ Sprint 1–2 phần dữ liệu thật (dự án, tin tức, tuyển dụng)~~ — **phần lớn đã có trả lời** (câu 1–4, 6–8, xem `CAU-HOI-CAN-XAC-NHAN.md` mục 1); còn thiếu ảnh thật, chính sách nhân sự/đào tạo (câu 5).
- Cấu hình email/domain thật ở Sprint 3 và Go-live — mục 2 trong file câu hỏi.
- Phân quyền chi tiết nếu cần thêm vai trò ngoài 3 cấp hiện tại — mục 4 câu 18.

---

## Security Audit Phase 1–2: Bảo mật (Hoàn thành 2026-07-14)

**Xem chi tiết tại:** `security-audit/SECURITY_AUDIT_PHASE_1.md` + `security-audit/README.md`

### Phase 1: Analysis & Planning ✅ COMPLETE
- [x] Audit toàn codebase (NestJS, Next.js, Vite + Render/Vercel config)
- [x] Xác định 3 HIGH-severity findings (CORS, Rate Limiting, SQL Injection)
- [x] Lập kế hoạch remediation 4 phases

### Phase 2: Implementation — Critical Fixes ✅ COMPLETE (2026-07-14)

#### Finding 1A: CORS Fallback to Wildcard ✅
- **File:** `thien-duc-website-backend/src/main.ts` (lines 16–22)
- **Issue:** Nếu env `CORS_ORIGIN` không set → fallback về `*` (công khai mọi origin)
- **Fix:** Xóa fallback `?? '*'`, throw error at startup nếu `CORS_ORIGIN` missing
- **Test:** `main.spec.ts` — 5/5 tests pass ✅
- **Status:** Sẵn sàng production

#### Finding 1B: Missing Rate Limiting on Auth Endpoints ✅
- **File:** `thien-duc-website-backend/src/auth/auth.controller.ts` (lines 15, 21, 35)
- **Issue:** Login/refresh/logout không có rate limit → brute force attack
- **Fix:** Thêm `@Throttle` decorators
  - Login: `@Throttle({ default: { limit: 5, ttl: 60 * 1000 } })` (5/min per IP)
  - Refresh: `@Throttle({ default: { limit: 10, ttl: 60 * 1000 } })` (10/min per IP)
  - Logout: `@Throttle({ default: { limit: 20, ttl: 60 * 1000 } })` (20/min per IP)
- **Test:** `auth.controller.spec.ts` — 10/10 tests pass ✅
- **Status:** Sẵn sàng production

#### Finding 3A: SQL Injection in Search Endpoint ✅
- **File:** `thien-duc-website-backend/src/search/search.service.ts` (lines 29, 60)
- **Issue:** Dùng `websearch_to_tsquery()` → FTS operator không escape (injection risk)
- **Fix:** Thay bằng `plainto_tsquery()` (coi input là plain text, không parse operator)
- **Test:** `search.service.spec.ts` — 16/16 tests pass ✅
- **Status:** Sẵn sàng production

### Verification Status (2026-07-14)
- [x] ESLint: 3 security-critical files sạch (0 errors, 0 warnings)
- [x] TypeScript: 3 security-critical files sạch (0 errors, 0 warnings)
- [x] Jest: 31/31 tests pass (3 security test suites)
  - `main.spec.ts` (SEC-CORS-001): 5 tests ✅
  - `auth.controller.spec.ts` (SEC-RATE-001): 10 tests ✅
  - `search.service.spec.ts` (SEC-INJ-001): 16 tests ✅

### Next: Phase 3 (HTTP Security Headers)
- [x] Frontend: Add CSP, HSTS, X-Frame-Options headers (Next.js config)
- [x] Backend: Verify Helmet headers active
- Timeline: 1 week
- Xem: `security-audit/README.md` section "Phase 3: HTTP Security Headers"
