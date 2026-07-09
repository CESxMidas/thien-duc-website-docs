# Kế hoạch công việc phần Coding — Website Thiên Đức (PA2)

> Dựa trên `Báo cáo phương án kỹ thuật website Thiên Đức.docx` (cùng thư mục) + hiện trạng mã nguồn kiểm tra ngày 2026-07-14. File này chỉ liệt kê **việc code cụ thể**, tách riêng khỏi các câu hỏi cần công ty trả lời (xem `CAU-HOI-CAN-XAC-NHAN.md`).
>
> Thư mục `docs/` nằm ở cấp workspace, dùng chung cho `thien-duc-website-frontend` và `thien-duc-website-backend`.

## Hiện trạng (cập nhật 2026-07-08)

- **Đã deploy production** (xem `DEPLOY.md`): Frontend (Next.js) → **Vercel**, Backend (NestJS + Prisma) + PostgreSQL → **Render** (`render.yaml` Blueprint). Luồng gửi form liên hệ đã chạy thật end-to-end trên production (POST `/api/contact` trả `201`, bản ghi lưu vào bảng `contact_submissions` OK).
- Backend `thien-duc-website-backend/` chạy được cả local lẫn production: NestJS 11 + Prisma 7 + PostgreSQL 17 (local dùng Docker, port **5433** — vì máy dev có Postgres Windows chiếm 5432).
- Migration `init` (12 bảng) đã áp vào DB; đã test thật `GET /api/projects`, `POST /api/contact` (lưu DB OK); Swagger tại `http://localhost:3001/api/docs` (local) và `…onrender.com/api/docs` (production).
- Lệnh chạy local: `docker compose up -d` → `npm run start:dev`. Xem dữ liệu: `npx prisma studio` (local) hoặc trỏ `DATABASE_URL` vào External URL của Render.
- `tsc --noEmit` + `eslint` sạch (0 lỗi, 0 warning). CI lint+build đã có ở cả 2 repo.
- Câu trả lời nội dung thật (dự án, giới thiệu, pháp lý...) đã có cho câu 1–4, 6–8 — xem `CAU-HOI-CAN-XAC-NHAN.md`; có thể bắt đầu seed dữ liệu thật ở Sprint 1.

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
- [ ] **Admin CMS**: nối API thật cho Tin tức, Banner, Trang nội dung, Thư viện ảnh (hiện vẫn mock).

> 🐛 **Lỗi có sẵn đã sửa trong sprint này**: `.env` local thiếu `?sslmode=require` nên `PrismaService` (adapter `@prisma/adapter-pg`) không nối được Render — **mọi** route chạm DB trả `500`, kể cả `/api/projects` của Sprint 1. Prisma CLI vẫn chạy được vì dùng engine riêng, khiến lỗi rất dễ bị bỏ qua. Xem `DEPLOY.md`.

## Sprint 3 — Tuần 6–7: CMS Admin + Form liên hệ + Email

- [~] Khởi tạo project Admin CMS riêng (Vite + React), layout Dashboard (ED-02): số form mới, bài chờ duyệt, lối tắt tạo dự án/tin — **khung UI đã xong** (`thien-duc-website-admin/`). Đã nối API thật: **Tài khoản** (Sprint 1) và **Dự án** (modal 3 tab, duyệt nội dung). Còn mock: Tin tức, Trang nội dung, Banner, Liên hệ, Thư viện ảnh, và số liệu trang Tổng quan.
- [~] **Module đăng nhập Admin đã nối API thật** (`POST /auth/login`, sonner toast): `AuthContext` decode JWT → user, token lưu localStorage/sessionStorage theo "Ghi nhớ đăng nhập", `ProtectedRoute` + phân quyền + trang `/403`, xử lý 401 (hết phiên → về login) / 403 / lỗi mạng bằng toast, đăng xuất thu hồi refresh token. **Chặn cuối:** DB chưa có tài khoản nào → cần seed admin đầu tiên (backend) mới test đăng nhập thật được.
- [~] Màn hình duyệt nội dung cho Admin: chấp nhận/trả lại bài-dự án-banner (KB-06). **Dự án đã xong** (tab Thông tin trong modal chi tiết: Gửi duyệt / Duyệt & đăng / Trả về nháp, chỉ ADMIN trở lên). Còn tin tức và banner — chờ Sprint 2.
- [~] `contact` module: `POST /contact` lưu `contact_submissions` **đã xong** + giới hạn 5 request/IP/giờ **đã xong** (`@Throttle`); **còn thiếu** gửi email thông báo (TODO trong `contact.service.ts`, chờ SMTP thật — câu 9) (YC-09, mục 2.2).
- [x] Sửa `src/components/sections/contact-form.tsx`: đã bỏ `mailto`, gọi API `POST /contact` qua `src/lib/api/contact.ts` (có honeypot chống bot, validate phía client, xử lý lỗi rate-limit/network, timeout 10s), hiển thị trạng thái gửi thành công/lỗi. Khi chưa đặt `NEXT_PUBLIC_API_URL` thì tự chạy chế độ mock.
- [x] Màn hình quản lý lead cho Admin/Super Admin: đổi trạng thái Mới → Đang xử lý → Hoàn thành, ghi chú nội bộ (KB-08). `ContactPage` đã bỏ mock, nối `GET /contact` thật; `LeadDetailDialog` cho đổi trạng thái + ghi chú nội bộ, nút Lưu chỉ bật khi có thay đổi, số điện thoại/email là link `tel:`/`mailto:`, bảng gắn nhãn "Có ghi chú nội bộ". Thời gian hiển thị bằng `formatDateTime` (giờ VN). **Sửa backend**: `UpdateContactSubmissionDto.status` trước đây **bắt buộc** nên chỉ lưu ghi chú cũng bị `400` — nay optional, đúng ngữ nghĩa `PATCH`.
- [ ] Cấu hình email thật thay Yahoo tạm. **(chờ input câu 9)**

## Sprint 4 — Tuần 8–9: Song ngữ, tìm kiếm, SEO, nối API

- [ ] Thêm cấu trúc `[locale]` routing (`/vi/...`, `/en/...`) thay redirect placeholder hiện tại trong `next.config.ts` (chỉ có `/vi → /`).
- [ ] Nội dung song ngữ lưu JSONB theo thiết kế DB (mục 2.2.1) — cần bản dịch tiếng Anh cho giới thiệu, dự án tiêu biểu, liên hệ. **(chờ input câu 19 về mức độ ưu tiên)**
- [ ] Nối `src/lib/search.ts` với API tìm kiếm full-text (thay lọc phía client hiện tại) — dự án + tin tức theo từ khóa (YC-10).
- [ ] SEO: metadata động theo từng trang/dự án/bài tin, sinh `sitemap.xml` + `robots.txt` tự động, Open Graph tags (YC-12).
- [ ] Đặt lịch đăng bài tự động (ED-08) — cron job hoặc queue kiểm tra `scheduled_at`.
- [ ] Hoàn tất nối toàn bộ trang frontend còn lại với API thật, loại bỏ import trực tiếp từ `src/data/*` (giữ lại làm fallback/demo nếu cần).

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
- [x] Dựng khung Admin CMS (UI, chưa cần nội dung thật) — `thien-duc-website-admin/`. **Công nghệ đúng mục 2.5 báo cáo**: Vite + React 19 + TS, **shadcn/ui** + Tailwind v4, **TanStack Query** (`src/lib/api/queries.ts`), **React Hook Form + Zod** (form đăng nhập + `ProjectFormDialog`). Có: đăng nhập giả lập + route bảo vệ, layout Dashboard (sidebar + topbar), trang Tổng quan (form mới / nội dung chờ duyệt / lối tắt tạo dự án-tin — ED-02), các trang danh sách Dự án / Tin tức / Trang nội dung / Banner / Liên hệ (lead, lọc trạng thái) / Thư viện ảnh / Tài khoản. Dữ liệu là **mock**, `apiFetch` + `queryFn` sẵn sàng nối backend qua `VITE_API_URL`. `npm run build` + `lint` sạch.
- [x] Viết lớp `src/lib/api/*` cho frontend với dữ liệu mock giống schema dự kiến — client (bật/tắt qua `NEXT_PUBLIC_API_URL`) + DTO types + mock từ `src/data/*` + mapper về type UI; còn việc thay import trong component (Sprint 1).
- [x] Setup CI/CD tối thiểu (lint + build) cho cả 2 repo, `.env.example` cho backend. Còn thiếu: cấu trúc `[locale]` routing.

## Việc bắt buộc phải có input công ty trước khi code có ý nghĩa

- ~~Toàn bộ Sprint 1–2 phần dữ liệu thật (dự án, tin tức, tuyển dụng)~~ — **phần lớn đã có trả lời** (câu 1–4, 6–8, xem `CAU-HOI-CAN-XAC-NHAN.md` mục 1); còn thiếu ảnh thật, chính sách nhân sự/đào tạo (câu 5).
- Cấu hình email/domain thật ở Sprint 3 và Go-live — mục 2 trong file câu hỏi.
- Phân quyền chi tiết nếu cần thêm vai trò ngoài 3 cấp hiện tại — mục 4 câu 18.
