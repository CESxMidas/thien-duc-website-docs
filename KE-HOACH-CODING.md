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
- [x] Dựng `.env.example` cho backend (DATABASE_URL, JWT_*, CLOUDINARY_*, SMTP_*) **và frontend** (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`). CLOUDINARY_*/SMTP_* vẫn **(chờ input câu 9, 12)** để điền giá trị thật.
- [x] Setup CI tối thiểu: lint + build tự động khi mở PR ở cả 2 repo (`.github/workflows/ci.yml`). **Hosting đã chốt (câu 11): Vercel (FE) + Render (BE + Postgres)** — auto-deploy khi push `main` (`render.yaml` + Vercel Git integration).

## Sprint 1 — Tuần 2–3: Auth + CRUD dự án

- [ ] `auth` module: đăng nhập email/password, JWT access + refresh token, khóa tạm tài khoản sau 5 lần sai (ED-01).
- [ ] `users` module: CRUD tài khoản, gán vai trò Editor/Admin/Super Admin (KB-10). **(chờ input câu 18 nếu cần thêm vai trò)**
- [ ] `projects` module: CRUD dự án + `project_items` (hạng mục con) + `project_gallery`, trạng thái nháp/chờ duyệt/đã đăng (ED-03).
- [ ] Migrate dữ liệu mẫu từ `src/data/projects.ts` (179 dòng) vào DB làm dữ liệu seed/test — **câu 1–2 đã có trả lời** (5 dự án giữ nguyên + chi tiết vị trí/quy mô/pháp lý/tiến độ từng dự án trong `CAU-HOI-CAN-XAC-NHAN.md`), có thể seed dữ liệu thật luôn; chỉ còn thiếu ảnh thật.
- [ ] Frontend: tạo route còn thiếu `src/app/du-an/[slug]/[hang-muc]/page.tsx` (hiện `Chưa có` theo báo cáo mục 1.1.4), dùng cùng cấu trúc với `du-an/[slug]` hiện có.
- [ ] Viết lớp fetch API phía frontend (`src/lib/api/*`) thay thế dần import trực tiếp từ `src/data/projects.ts`, giữ interface tương thích để không phải sửa component UI.

## Sprint 2 — Tuần 4–5: CRUD tin tức + Cloudinary

- [ ] `news` module: CRUD `news_categories`, `news_posts`, luồng nháp → gửi duyệt → xuất bản (ED-04).
- [ ] `media` module: tích hợp Cloudinary upload, tối ưu ảnh (WebP/AVIF, giới hạn ~1200px, tối đa 2MB) (ED-05, mục 2.1.4).
- [ ] Thay `src/data/news.ts` (hiện chỉ 20 dòng mẫu) bằng dữ liệu lấy từ API. **(chờ input câu 3)** nếu chưa có tin thật, tạm dùng seed data rõ ràng đánh dấu "demo".
- [ ] `pages` module: CRUD nội dung trang tĩnh (giới thiệu, chính sách nhân sự, đào tạo) để Editor sửa không cần đụng code (ED-07).
- [ ] `banners` module: CRUD banner trang chủ, thứ tự hiển thị (ED-06).

## Sprint 3 — Tuần 6–7: CMS Admin + Form liên hệ + Email

- [ ] Khởi tạo project Admin CMS riêng (Vite + React), layout Dashboard (ED-02): số form mới, bài chờ duyệt, lối tắt tạo dự án/tin.
- [ ] Màn hình duyệt nội dung cho Admin: chấp nhận/trả lại bài-dự án-banner (KB-06).
- [~] `contact` module: `POST /contact` lưu `contact_submissions` **đã xong** + giới hạn 5 request/IP/giờ **đã xong** (`@Throttle`); **còn thiếu** gửi email thông báo (TODO trong `contact.service.ts`, chờ SMTP thật — câu 9) (YC-09, mục 2.2).
- [x] Sửa `src/components/sections/contact-form.tsx`: đã bỏ `mailto`, gọi API `POST /contact` qua `src/lib/api/contact.ts` (có honeypot chống bot, validate phía client, xử lý lỗi rate-limit/network, timeout 10s), hiển thị trạng thái gửi thành công/lỗi. Khi chưa đặt `NEXT_PUBLIC_API_URL` thì tự chạy chế độ mock.
- [ ] Màn hình quản lý lead cho Admin/Super Admin: đổi trạng thái Mới → Đang xử lý → Hoàn thành, ghi chú nội bộ (KB-08). Backend đã có `GET /contact`, `GET /contact/:id`, `PATCH /contact/:id` (guard ADMIN/SUPER_ADMIN) — chỉ còn dựng UI. Hiển thị thời gian dùng `formatDateTime` (giờ VN).
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
- [ ] Dựng khung Admin CMS (UI, chưa cần nội dung thật).
- [x] Viết lớp `src/lib/api/*` cho frontend với dữ liệu mock giống schema dự kiến — client (bật/tắt qua `NEXT_PUBLIC_API_URL`) + DTO types + mock từ `src/data/*` + mapper về type UI; còn việc thay import trong component (Sprint 1).
- [x] Setup CI/CD tối thiểu (lint + build) cho cả 2 repo, `.env.example` cho backend. Còn thiếu: cấu trúc `[locale]` routing.

## Việc bắt buộc phải có input công ty trước khi code có ý nghĩa

- ~~Toàn bộ Sprint 1–2 phần dữ liệu thật (dự án, tin tức, tuyển dụng)~~ — **phần lớn đã có trả lời** (câu 1–4, 6–8, xem `CAU-HOI-CAN-XAC-NHAN.md` mục 1); còn thiếu ảnh thật, chính sách nhân sự/đào tạo (câu 5).
- Cấu hình email/domain thật ở Sprint 3 và Go-live — mục 2 trong file câu hỏi.
- Phân quyền chi tiết nếu cần thêm vai trò ngoài 3 cấp hiện tại — mục 4 câu 18.
