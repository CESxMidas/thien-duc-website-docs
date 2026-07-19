# Kế hoạch công việc phần Coding — Website Thiên Đức (PA2)

> **Trạng thái:** Đang dùng (tài liệu sống — cập nhật theo sprint)
> **Nhóm:** 04 — Implementation
> **Cập nhật:** 2026-07-17
> **Nguồn (di chuyển từ):** `KE-HOACH-CODING.md` (thư mục gốc, trước tái cấu trúc)
> **Tài liệu liên quan:** [open-questions](../01-requirements/open-questions.md) · [deployment-guide](../07-deployment/deployment-guide.md) · [security](../05-security/README.md) · [audit-baseline](../08-audits-and-reports/current/2026-07-16-audit-baseline.md)

> Dựa trên [Báo cáo phương án kỹ thuật (PA2)](../01-requirements/technical-proposal-pa2.docx) + hiện trạng mã nguồn kiểm tra ngày 2026-07-10. File này chỉ liệt kê **việc code cụ thể**, tách riêng khỏi các câu hỏi cần công ty trả lời (xem [open-questions](../01-requirements/open-questions.md)).
>
> Thư mục `docs/` nằm ở cấp workspace, dùng chung cho `thien-duc-website-frontend`, `thien-duc-website-admin` và `thien-duc-website-backend`. Quy ước code chung cho cả 3: `../../../AGENTS.md` (gốc workspace).

## Hiện trạng (cập nhật 2026-07-10)

- **Đã deploy production** (xem [deployment-guide](../07-deployment/deployment-guide.md)): Frontend (Next.js) → **Vercel**, Backend (NestJS + Prisma) + PostgreSQL → **Render** (`render.yaml` Blueprint). Luồng gửi form liên hệ đã chạy thật end-to-end trên production (POST `/api/contact` trả `201`, bản ghi lưu vào bảng `contact_submissions` OK).
- Backend `thien-duc-website-backend/` chạy được cả local lẫn production: NestJS 11 + Prisma 7 + PostgreSQL 17 (local dùng Docker, port **5433** — vì máy dev có Postgres Windows chiếm 5432).
- Migration `init` (12 bảng) đã áp vào DB; đã test thật `GET /api/projects`, `POST /api/contact` (lưu DB OK); Swagger tại `http://localhost:3001/api/docs` (local) và `…onrender.com/api/docs` (production).
- Lệnh chạy local: `docker compose up -d` → `npm run start:dev`. Xem dữ liệu: `npx prisma studio` (local) hoặc trỏ `DATABASE_URL` vào External URL của Render.
- **Admin CMS đã nối API thật 100%** — mọi trang (Tổng quan, Dự án, Tin tức, Trang nội dung, Banner, Liên hệ, Thư viện ảnh, Tài khoản) dùng `apiFetch` + TanStack Query; thư mục `src/data/` (mock) đã xóa.
- `tsc --noEmit` + `eslint` sạch (0 lỗi, 0 warning). CI lint+build đã có ở cả 2 repo.
- Câu trả lời nội dung thật (dự án, giới thiệu, pháp lý...) đã có cho câu 1–4, 6–8 — xem [open-questions](../01-requirements/open-questions.md); có thể bắt đầu seed dữ liệu thật ở Sprint 1.

### Việc nên làm trước ở phiên tiếp theo

1. **Áp migration full-text lên production (Render)**: đã kiểm chứng trên DB local. Lưu ý `.env` dev đang trỏ vào Render — chạy `prisma migrate deploy` phải là hành động có chủ ý.
2. **Seed trang nội dung**: `GET /pages/gioi-thieu` và `/pages/lien-he` chưa có bản ghi nào trong DB, nên frontend đang chạy nhánh fallback tĩnh. Cần seed (hoặc nhập qua Admin CMS bằng `PageFormDialog` mới) để vòng đời "admin sửa → web hiện" chạy thật.
3. **Cron ngoài cho ED-08**: Render free tier ngủ sau 15 phút nên `@Cron` nội bộ không đủ. Đặt UptimeRobot/cron-job.org gọi `POST /api/news/publish-scheduled` (cần token ADMIN).
4. ~~**Nhập bản dịch tiếng Anh cho nội dung CMS**~~ — **✅ ĐÃ ĐÓNG cho phạm vi production/audited hiện tại** (task →4, chi tiết ở phần dưới): dự án production duy nhất `khu-do-thi-hung-phu` + mọi route EN audited đã dịch xong, **không còn chặn go-live**. Công cụ vẫn sẵn (Admin CMS, mỗi field có nút VI/EN, chấm vàng = chưa dịch). **Còn lại là backlog nội dung tương lai — KHÔNG phải blocker go-live hiện tại:** 3 dự án seed/dev (`chung-cu-la-bonita`, `du-an-vung-tau`, `du-an-bay-hien`) chỉ tồn tại trong seed, nếu/khi publish lên Admin CMS production phải nhập bản dịch EN **trước khi publish**.
5. **Bấm tay kiểm thử Admin CMS**: `BannerFormDialog`, `PageFormDialog` và `BilingualField` mới viết chỉ qua `tsc` + `build`, chưa chạy thật (cần backend + DB + đăng nhập).
6. **Gửi email form liên hệ** vẫn là TODO trong `contact.service.ts` — chờ SMTP thật (câu 9).

> ⚠️ Render free tier: backend **ngủ sau 15 phút** không có request (request đầu tiên chậm ~30–50s, có thể làm form timeout ở FE — timeout FE đang đặt 10s). Cân nhắc UptimeRobot ping định kỳ hoặc nâng plan khi go-live. Postgres free hết hạn sau 90 ngày.
> 🟠 **Go-live: BLOCKED / DEFERRED (2026-07-19, G7-M1).** Kiểm vận hành thủ công mức cao — hạ tầng còn Free / chưa xác nhận (backend + Postgres Free, backup/PITR + restore + monitoring chưa làm). Hoãn có chủ đích; nâng plan trả phí + monitoring **bắt buộc trước go-live cuối**. Chi tiết: [G7-M1 note](../08-audits-and-reports/current/2026-07-19-g7-m1-manual-ops-verification.md).
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

> 🐛 **Lỗi có sẵn đã sửa trong sprint này**: `.env` local thiếu `?sslmode=require` nên `PrismaService` (adapter `@prisma/adapter-pg`) không nối được Render — **mọi** route chạm DB trả `500`, kể cả `/api/projects` của Sprint 1. Prisma CLI vẫn chạy được vì dùng engine riêng, khiến lỗi rất dễ bị bỏ qua. Xem [deployment-guide](../07-deployment/deployment-guide.md).

## Sprint 3 — Tuần 6–7: CMS Admin + Form liên hệ + Email

- [x] Khởi tạo project Admin CMS riêng (Vite + React), layout Dashboard (ED-02): số form mới, bài chờ duyệt, lối tắt tạo dự án/tin — xong (`thien-duc-website-admin/`). **Toàn bộ 8 trang đã nối API thật**; số liệu trang Tổng quan suy ra từ `useLeads`/`useNews`/`useProjects` chứ không còn số cứng.
- [x] **Module đăng nhập Admin đã nối API thật** (`POST /auth/login`, sonner toast): `AuthContext` decode JWT → user, token lưu localStorage/sessionStorage theo "Ghi nhớ đăng nhập", `ProtectedRoute` + phân quyền + trang `/403`, xử lý 401 (hết phiên → về login) / 403 / lỗi mạng bằng toast, đăng xuất thu hồi refresh token. Đã gỡ chặn: tài khoản `SUPER_ADMIN` đầu tiên tạo bằng `npm run prisma:seed`.
- [x] Màn hình duyệt nội dung cho Admin: chấp nhận/trả lại bài-dự án-banner (KB-06). **Dự án** (tab Thông tin trong modal chi tiết: Gửi duyệt / Duyệt & đăng / Trả về nháp, chỉ ADMIN trở lên), **Tin tức** (`useUpdateNewsStatus`) và **Trang nội dung** (`useUpdatePageStatus`) đều đã có. Banner không theo luồng duyệt mà bật/tắt hiển thị + sắp thứ tự.
- [x] `contact` module: `POST /contact` lưu `contact_submissions` **đã xong** + giới hạn 5 request/IP/giờ **đã xong** (`@Throttle`) + **gửi email thông báo lead đã xong** — `MailService.sendContactNotification` gọi non-blocking trong `contact.service.ts` (thiếu SMTP thì tự no-op, lead vẫn lưu). **Còn lại chỉ là cấu hình SMTP thật** = việc vận hành thủ công, xem mục MANUAL-OPS bên dưới (chờ input câu 9). (YC-09, mục 2.2)
- [x] Sửa `src/components/sections/contact-form.tsx`: đã bỏ `mailto`, gọi API `POST /contact` qua `src/lib/api/contact.ts` (có honeypot chống bot, validate phía client, xử lý lỗi rate-limit/network, timeout 10s), hiển thị trạng thái gửi thành công/lỗi. `NEXT_PUBLIC_API_URL` là **bắt buộc** — frontend **không có chế độ mock**: thiếu biến → base URL rỗng, lời gọi API hỏng lúc chạy (xem [environment-configuration.md](../07-deployment/environment-configuration.md)).
- [x] Màn hình quản lý lead cho Admin/Super Admin: đổi trạng thái Mới → Đang xử lý → Hoàn thành, ghi chú nội bộ (KB-08). `ContactPage` đã bỏ mock, nối `GET /contact` thật; `LeadDetailDialog` cho đổi trạng thái + ghi chú nội bộ, nút Lưu chỉ bật khi có thay đổi, số điện thoại/email là link `tel:`/`mailto:`, bảng gắn nhãn "Có ghi chú nội bộ". Thời gian hiển thị bằng `formatDateTime` (giờ VN). **Sửa backend**: `UpdateContactSubmissionDto.status` trước đây **bắt buộc** nên chỉ lưu ghi chú cũng bị `400` — nay optional, đúng ngữ nghĩa `PATCH`.
- [ ] **[MANUAL-OPS]** Cấu hình SMTP thật (thay Yahoo tạm) — nhập credential ở dashboard/biến môi trường. **(chờ input câu 9)** Code gửi mail đã sẵn (mục trên); đây chỉ là nhập cấu hình, không phải việc code.

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
> 3. **Sửa hạng mục dự án làm mất bản dịch tiếng Anh**: `ProjectItemsTab` gửi `title: { vi }`, mà `PATCH` ghi đè nguyên field JSON — `en` đã nhập bị xóa âm thầm. Nay gửi lại cả hai ngôn ngữ. ✅ **ADMIN-ITEM-CONTENT-P2 Batch M1** (2026-07-19) đã kiểm chứng runtime thủ công round-trip VI/EN, cơ chế bỏ qua field không đổi trong PATCH, xóa trắng có chủ đích, và fix Select dùng chung (`select.tsx`, commit `8a9de74`) — A–F PASS; xem [báo cáo](../08-audits-and-reports/current/2026-07-19-admin-item-content-p2-batch-m1.md).

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
  > ⚠️ Khối số liệu **Cần Thơ 43,44 ha** trong câu 2 là lỗi sao chép (công ty xác nhận) — đã xóa khỏi [open-questions](../01-requirements/open-questions.md). Khu đô thị Hưng Phú = Bến Tre, 11,25 ha.
- [x] **Câu 6 — công ty thành viên**: `data/member-companies.ts` + trang `cong-ty-thanh-vien` dựng nội dung thật (người đại diện Trần Hữu Nghị + 3 pháp nhân). **Đã gỡ khỏi `placeholderPaths`** → bỏ `noindex`, đưa vào sitemap. Công ty chưa cung cấp MST/địa chỉ/ngành nghề từng đơn vị nên trang chỉ nêu tên, kèm lối liên hệ để hỏi thêm.
- [x] **Câu 7 — giới thiệu công ty**: `data/about.ts` bổ sung `aboutTimeline` (2010 · 2014-2018 CapitaLand · 2018-nay), `aboutStats` (16+ năm, 3 đại dự án, 1.152 căn Vista Verde, 11,25 ha Hưng Phú) và `aboutPortfolio` (Vista Verde, Feliz en Vista, Hưng Phú, Fancy Tower). Trang `gioi-thieu` render thêm 3 khối tương ứng.
- [x] **Câu 8 — thông tin pháp lý**: `legalInfo` trong `config/site.ts` (MST `0309910290`, tên pháp nhân đầy đủ, cơ quan quản lý) hiển thị ở dải chân trang.
- [~] **Câu 4 — tuyển dụng**: `data/careers.ts` + trang `tuyen-dung` đã dựng khung đầy đủ (giá trị, danh sách vị trí, quy trình 3 bước, nộp hồ sơ qua email). `openPositions` **cố ý để rỗng** — chưa có vị trí thật, trang hiện trạng thái "chưa có vị trí đang tuyển" và vẫn `noindex`. Đổ dữ liệu vào mảng đó là trang tự hiện.
- [ ] **[FUTURE-CONTENT — không phải việc code]** **Câu 5 — chính sách nhân sự / đào tạo**: vẫn chờ nội dung. Ba trang `dao-tao`, `chinh-sach-nhan-su` và `so-do-to-chuc-cong-ty` đã dựng khung, giữ `noindex`; đổ nội dung thật là trang tự hiện. Backlog nội dung tương lai, không chặn tiến độ code.

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

## Redesign typography toàn site — Playfair + Be Vietnam Pro (2026-07-16)

Yêu cầu: phân tích + thiết kế lại typography toàn website theo hướng **modern
luxury real estate** (dùng skill `frontend-design` + `ui-ux-pro-max`), **giữ
nguyên bảng màu thương hiệu** (quy tắc 12). Làm theo hướng **token-first**: đặt
nền ở `layout.tsx` + `globals.css` để mọi trang kế thừa, rồi chuẩn hóa chi tiết
từng cụm. `tsc --noEmit` + `eslint` + `next build` **sạch 0 lỗi**, prerender OK.

- [x] **Đổi font toàn site: Geist → Playfair Display (heading) + Be Vietnam Pro
  (body/UI)** (`app/[locale]/layout.tsx`). Cả hai nạp qua `next/font/google` với
  `subsets: ["latin", "vietnamese"]` (vá lỗ hổng cũ: Geist chỉ có `latin` nên
  dấu tiếng Việt rơi fallback), `display: "swap"`, chỉ nạp weight thực dùng
  (Be Vietnam 400/500/600/700, Playfair 500/600/700).
- [x] **Design tokens typography** trong `globals.css` (`:root`): type scale
  responsive bằng `clamp()` (`--text-hero` 36→72px, `--text-h1` 32→56px,
  `--text-h2` 28→42px, `--text-h3` 22→30px, `--text-lead` 17→20px), line-height
  (hero 1.08 / heading 1.22 / body 1.7), tracking (`--tracking-display` -0.012em,
  `--tracking-eyebrow` 0.18em — giảm từ 0.24em vốn hơi thô cho dấu tiếng Việt),
  `--measure-prose` 68ch. Sinh utility `.text-hero/.text-h1/.text-h2/.text-lead/
  .text-eyebrow/.measure` + `font-display` (từ `@theme inline`).
- [x] **Serif có tiết chế**: rule toàn cục chỉ đặt **H1/H2** dùng Playfair; H3
  trở xuống (card title, sub-label) giữ Be Vietnam Pro đậm cho dễ đọc và tông
  "corporate premium". Số liệu thống kê trang Giới thiệu dùng `font-display`
  (serif) làm điểm nhấn.
- [x] **Chuẩn hóa eyebrow toàn site về `.text-eyebrow`** (13px, tracking 0.18em):
  trang chủ (banner, featured, latest-news, contact-cta, cooperation-slider),
  Giới thiệu, Dự án + chi tiết + hạng mục + carousel, Tin tức, Liên hệ, Tuyển
  dụng, Công ty thành viên, và tiêu đề cột Footer (`<h2>` label → giữ sans, tránh
  serif nhỏ lạc quẻ). `PageHeading` (dùng chung mọi trang phụ) cũng đổi eyebrow +
  h1 serif `leading-[1.12]`.
- [x] **Chống cắt dấu tiếng Việt**: chỗ heading serif có `line-clamp` (hero
  banner `line-clamp-2`) nới `leading` để dấu không bị box overflow cắt. Heading
  không clamp giữ nguyên (glyph tràn ngoài, không bị cắt).
- Giữ nguyên: hai chỗ `tracking-[0.24em]` cố ý — hiệu ứng hover giãn chữ ở
  `project-gallery-sections.tsx` và badge brand ở `home-intro-strip.tsx`.

> 📌 Chỉ mới `lint` + `tsc` + `next build`. **Chưa duyệt thị giác trên trình
> duyệt** — nên `npm run dev` (kèm backend) rà cảm giác serif Playfair trên nội
> dung thật + dấu tiếng Việt trên desktop/mobile trước khi chốt.

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

- ~~Toàn bộ Sprint 1–2 phần dữ liệu thật (dự án, tin tức, tuyển dụng)~~ — **phần lớn đã có trả lời** (câu 1–4, 6–8, xem [open-questions](../01-requirements/open-questions.md) mục 1); còn thiếu ảnh thật, chính sách nhân sự/đào tạo (câu 5).
- Cấu hình email/domain thật ở Sprint 3 và Go-live — mục 2 trong file câu hỏi.
- Phân quyền chi tiết nếu cần thêm vai trò ngoài 3 cấp hiện tại — mục 4 câu 18.

---

## Security Audit Phase 1–2: Bảo mật (Hoàn thành 2026-07-14)

**Xem chi tiết tại:** [security-audit-phase-1](../05-security/security-audit-phase-1.md) + [security README](../05-security/README.md)

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
- Xem: [security README](../05-security/README.md) section "Phase 3: HTTP Security Headers"

---

## Phase tiếp theo — Nâng cấp theo Audit Baseline (2026-07-16)

> Nguồn: [audit-baseline](../08-audits-and-reports/current/2026-07-16-audit-baseline.md) (cùng thư mục). Điểm hiện tại **60/100**;
> định giá hiện tại ~$9k–$13k, sau khi đóng gap lớn ~$15k–$22k. Mục tiêu phase này
> là đưa dự án từ "website custom chuyên nghiệp" lên "nền tảng nghiệp vụ
> production-grade". Thứ tự đề xuất ghi ở đầu mỗi nhóm; số trong ngoặc `(→ n)` là
> thứ tự triển khai tổng thể xuyên suốt các nhóm.

### 1. Critical — Bắt buộc trước production

Thứ tự: làm tuần tự C1 → C4 (C1 và C2 chặn go-live thật sự).

- [x] **(→ 1) Email thông báo form liên hệ** — *Hạng mục: Integrations & lead capture* ✅ 2026-07-16
  - **Khu vực:** `backend/src/contact/contact.service.ts:11` (TODO), biến SMTP đã có ở `backend/render.yaml`.
  - **Lý do:** Lead hiện được lưu DB nhưng không ai được báo → có thể mất khách. Đây là gap giá trị cao nhất cho site hướng bán hàng.
  - **Gợi ý:** Thêm mailer (Nodemailer) đọc `SMTP_*`; gửi async, không chặn response `201`; nuốt lỗi gửi mail (log lại) để không làm hỏng luồng lưu lead.
  - **Đã hoàn thành:**
    - **SMTP notification đã cài** — module `backend/src/mail/` (`MailService` + `MailModule`) dùng Nodemailer, theo khuôn degrade-thành-no-op của `CloudinaryService`: thiếu cấu hình thì chỉ log cảnh báo, không sập app.
    - **Lead được lưu trước khi gửi email** — `ContactService.create` `await` lưu DB rồi mới kích hoạt gửi mail.
    - **Email hỏng không chặn response** — gửi mail fire-and-forget (`void`, không `await`); `sendContactNotification` tự nuốt lỗi và chỉ log `error.message` (không log cấu hình/secret SMTP). API luôn trả `201` nếu lead đã lưu.
    - **Nội dung email:** họ tên, SĐT, email (nếu có), loại yêu cầu, thời gian gửi (giờ VN, UTC+7), IP (nếu bắt được), nội dung, kèm ghi chú "gửi từ form liên hệ website". Body HTML được escape chống injection; `replyTo` = email khách.
    - **Biến môi trường production cần đặt:** `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` (bắt buộc để bật gửi mail), `SMTP_PORT` (mặc định 587), `SMTP_FROM` (đã có sẵn), và tùy chọn `CONTACT_NOTIFY_TO` (nơi nhận; bỏ trống → gửi về `SMTP_FROM`). Đã khai `sync: false` trong `render.yaml`, cập nhật `.env.example`.
    - **Test coverage:** `backend/src/contact/contact.service.spec.ts` — 4 test (lưu-trước-gửi-sau, đúng dữ liệu lead, gửi mail không chặn kết quả, email lỗi vẫn trả bản ghi). MailService được mock hoàn toàn → không đụng SMTP thật, không lộ secret trong test.
    - **File thay đổi:** thêm `src/mail/mail.service.ts`, `src/mail/mail.module.ts`, `src/contact/contact.service.spec.ts`; sửa `src/contact/contact.service.ts`, `src/contact/contact.module.ts`, `.env.example`, `render.yaml`, `package.json` (thêm `nodemailer` + `@types/nodemailer`).

- [x] **(→ 2) Rời free-tier + backup DB tự động** — *Hạng mục: Deployment & operations* ✅ 2026-07-16 (phần repo)
  - **Khu vực:** `backend/render.yaml` (nay **khai plan trả phí**: web `starter`, Postgres `basic-256mb` — xem mục "Đã hoàn thành" bên dưới; tên/giá phải kiểm tra lại ở Dashboard lúc nâng), [deployment-guide](../07-deployment/deployment-guide.md).
  - **Lý do:** Backend ngủ sau 15 phút (request đầu 30–50s có thể timeout form FE); Postgres free hết hạn sau 90 ngày → nguy cơ mất dữ liệu. Không có backup = không có đường lùi.
  - **Gợi ý:** Nâng plan web + Postgres; bật backup định kỳ của Render (hoặc `pg_dump` theo lịch ra lưu trữ ngoài). Trong lúc chờ ngân sách: đặt UptimeRobot/cron-job.org ping giữ backend thức + gọi `POST /api/news/publish-scheduled`.
  - **Đã hoàn thành (phần repo — 2026-07-16):**
    - **`render.yaml` khai plan trả phí:** web `plan: free` → `starter` (always-on); Postgres `plan: free` → `basic-256mb`. Kèm comment: tên/giá/retention/PITR phải kiểm tra lại ở Dashboard lúc nâng, đổi YAML không tự thanh toán.
    - **[backup-and-restore.md](../07-deployment/backup-and-restore.md)** từ khung → runbook đầy đủ: Render managed backup (lớp chính) + `pg_dump`/`pg_restore` thủ công (khẩn cấp/xuất dữ liệu) + checklist kiểm thử khôi phục + **đường di trú Postgres free→paid** nếu Render không cho nâng tại chỗ + nhật ký xác nhận retention/PITR.
    - **[rollback-plan.md](../07-deployment/rollback-plan.md)** từ khung → quy trình 3 lớp: (1) rollback app (Vercel Instant Rollback / Render rollback deploy), (2) migration forward-fix (Prisma không có `down`), (3) restore DB từ backup/PITR. Kèm tiêu chí quyết định và bẫy "rollback code không rollback schema".
    - **[deployment-guide.md](../07-deployment/deployment-guide.md)** thêm mục **1b. Nâng lên plan production** + checklist Dashboard; sửa troubleshooting timeout theo hướng nâng plan.
    - **Quyết định phạm vi (chủ dự án):** backup off-site tự động (script + lịch + kho ngoài) tách thành task riêng sau — chưa làm ở →2.
    - **Không đổi:** logic ứng dụng, Prisma schema, DTO/controller/service/test, `environment-configuration.md` (không cần biến mới).
  - **⚠️ Còn chờ thao tác tay ở Render Dashboard (repo không làm thay được):** áp plan + thanh toán khi sync Blueprint; nếu free→paid không nâng tại chỗ → di trú theo runbook (làm **trước mốc 90 ngày**); xác nhận backup daily/retention/PITR và điền nhật ký; kiểm thử khôi phục 1 lần; diễn tập rollback 1 lần. Danh sách đầy đủ: deployment-guide mục 1b.

- [x] **(→ 3) `@MaxLength` cho DTO chữ tự do** — *Hạng mục: Reliability & security* ✅ 2026-07-16
  - **Khu vực:** `backend/src/contact/dto/create-contact-submission.dto.ts` (và rà các DTO chữ khác).
  - **Lý do:** Finding #9 còn mở — payload khổng lồ gây DoS/phình DB.
  - **Gợi ý:** `@MaxLength` hợp lý (vd. name/phone ≤ 120, email ≤ 200, message ≤ 5000). ValidationPipe đã bật nên chỉ cần thêm decorator.
  - **Đã hoàn thành:**
    - **Phủ toàn bộ 13 DTO chữ tự do** (nhóm A công khai + nhóm B admin). Trần chính: contact name 120 / phone 30 / email 200 / inquiryType 100 / message 5000; `internalNote` 1000; search `q` 200; `TranslatedTextDto.vi/en` 5000 (phủ mọi title/summary/content/caption qua DTO nhúng); slug 160; URL/ảnh/href 500; metadata ngắn 60–300 (`objectPosition` 60, `categoryId`/`format` 60, `author`/`category` 120, `folder` 200, `publicId`/`location` 300). Mọi DTO `update-*` dùng `PartialType` nên tự thừa hưởng.
    - **Phone dùng 30** (thay vì "≤120" ghi đại khái ở gợi ý) — khớp convention `users/update-profile.dto.ts`; chọn mức chặt hơn = an toàn hơn.
    - **`gallery: string[]`** (create-project) thêm `@IsString({each}) @MaxLength(500, {each})` — trần theo từng phần tử.
    - **FE khớp trần:** `contact-form.tsx` thêm thuộc tính HTML `maxLength` 120/30/200/5000 — chỉ attribute, không đổi logic form.
    - **Không đổi:** Prisma schema (cột `text` giữ nguyên, không migration), business logic, task →4+.
    - **Test:** `create-contact-submission.dto.spec.ts` (9 test) — payload hợp lệ pass, đúng-bằng-trần pass (email 200 ký tự dựng đúng cấu trúc vì `@IsEmail` giới hạn local-part ≤ 64), từng field vượt trần 1 ký tự fail, message 100KB fail (kịch bản DoS finding #9), MinLength cũ vẫn giữ. Full suite backend: **8 suites / 77 test pass**; FE `lint` + `tsc` sạch.

- [x] **(→ 4) Nhập bản dịch tiếng Anh còn thiếu** — *Hạng mục: Content operations* ✅ **HOÀN TẤT cho phạm vi production/audited (2026-07-19).** Toàn bộ giới hạn code/CMS/data-model đã đóng: CMS batch 1–4 + i18n UI tĩnh (B-series) + loạt C data-model song ngữ + [EN-FULL 7-route](../08-audits-and-reports/current/2026-07-18-en-full-group2-closure.md) + [EN-SITE-WIDE 5-route](../08-audits-and-reports/current/2026-07-18-en-site-wide-follow-up.md) + [EN-PROJECT-ITEMS-P1 3-route hạng mục](../08-audits-and-reports/current/2026-07-18-en-project-items-p1.md) + [Admin editor nội dung hạng mục kiểm chứng runtime A–F](../08-audits-and-reports/current/2026-07-19-admin-item-content-p2-batch-m1.md). **Dự án production duy nhất (`khu-do-thi-hung-phu`) và mọi route EN audited: 0 tiếng Việt hiển thị, VI byte-identical, không `[object Object]`.** *(Phạm vi hoàn tất = nội dung CMS production/audited hiện tại. Dự án tương lai phải được nhập bản dịch EN **trước khi publish** — xem backlog nội dung tương lai bên dưới.)* *(Lưu ý: "CMS batch 1–4" = các lô nhập liệu Admin CMS; "i18n-B1–B4" = các lô dịch UI tĩnh bằng code — hai chuỗi khác nhau.)*
  - **Khu vực:** Nội dung CMS (dự án + hạng mục, bài tin, banner, dự án hợp tác, trang `gioi-thieu`/`lien-he`) — nhập qua Admin CMS (`BilingualField`, chấm vàng = chưa dịch).
  - **Lý do:** Song ngữ bắt buộc là điều kiện go-live (câu 19). Đây là việc nhập liệu, không phải code.
  - **Gợi ý:** Làm song song với C1–C3 (không phụ thuộc code). Seed trang nội dung trước (xem Q11 ở Quick wins) để có bản ghi mà dịch.
  - **Nguyên tắc chung cả 4 batch:** bản dịch bám sát nguồn tiếng Việt trong CMS, không thêm dữ kiện ngoài nguồn; **tiếng Việt không đổi một chữ**; không sửa code — chỉ nhập liệu qua Admin CMS.
  - **Batch 1 — Đã xong (2026-07-16) — 2 trang nội dung seed từ Q11:**
    - `gioi-thieu`: title + 4 đoạn nội dung đã có bản EN; `lien-he`: title + 1 đoạn đã có bản EN.
    - **Kiểm chứng (chủ dự án):** Admin CMS hết chấm vàng "chưa dịch" ở cả 2 trang; `/en/gioi-thieu` + `/en/lien-he` hiện title/body tiếng Anh từ CMS; `/gioi-thieu` + `/lien-he` giữ nguyên tiếng Việt.
    - Kèm trong batch này: dự án `khu-do-thi-hung-phu` + các hạng mục liên quan đã dịch EN qua Admin CMS.
  - **Batch 2 — Đã xong (2026-07-16/17):**
    - Bài tin `le-khoi-cong-fancy-tower-khu-do-thi-hung-phu`: title/summary/content đã có bản EN.
    - Chuyên mục tin: `tin-du-an` → "Project news", `tin-cong-ty` → "Company news", `tin-thi-truong` → "Market news".
  - **Batch 3 — Đã xong (2026-07-17) — banner trang chủ:**
    - Banner CMS "Khu đô thị Hưng Phú" (bản ghi banner duy nhất trong CMS production): eyebrow/title/subtitle/ctaLabel đã có bản EN.
    - **Lưu ý phát hiện khi rà:** 3 banner còn lại trên trang chủ là **fallback tĩnh trong `frontend/src/data/banners.ts`**, không phải bản ghi CMS — thuộc phần "UI tĩnh FE" bên dưới, không tính vào phần CMS của →4.
  - **Batch 4 — Đã xong (2026-07-17) — dự án hợp tác:**
    - `Feliz en Vista`: name/location/role/partner/scale/status đã có bản EN.
    - **Lưu ý:** CMS production hiện chỉ có Feliz en Vista (Vista Verde không có trong DB production dù có trong `seed-cooperation.js`).
    - **Kiểm chứng batch 2–4 (chủ dự án):** nhập qua Admin CMS, chấm vàng "chưa dịch" đã hết ở các bản ghi liên quan; tiếng Việt không bị sửa.
  - **✅ i18n UI tĩnh frontend — ĐÃ XONG (2026-07-17, deploy):** trước đây là "mục còn lại #2" của →4; nay đã hoàn tất bằng **code** (không phải nhập liệu CMS). Toàn bộ copy giao diện tĩnh trên route EN đã chuyển sang dictionary song ngữ `frontend/src/lib/i18n/dictionaries/{vi,en}.json` theo đúng pattern có sẵn (`get-dictionary.ts`). Làm theo 4 lô + 1 follow-up nhỏ, mỗi lô đều: lint/tsc/test (36 pass)/build sạch, **đối chiếu VI byte-identical với production** (0 khác biệt), và kiểm EN không còn chuỗi tiếng Việt ngoài phần cố ý giữ.
    - **i18n-B1** — nhãn nổi bật trang dự án + tin: trạng thái dự án + chip lọc, breadcrumb, eyebrow/tiêu đề khối, nhãn sidebar tin, "Xem chi tiết/Xem hạng mục".
    - **i18n-B2** — shell dùng chung: footer (tagline/motto), section trang chủ (intro, hợp tác, contact CTA), nhãn a11y/alt/aria (logo, banner prev/next…).
    - **i18n-B3** — form liên hệ: nhãn field, placeholder, option loại yêu cầu, note bảo mật, nút gửi, thông báo loading/success/error/validate (id `inquiryType` gửi backend giữ nguyên; test `contact-form.test.tsx` cập nhật, vẫn xanh).
    - **i18n-B4** — copy tĩnh trang `/gioi-thieu` + `/lien-he`: hero fallback, timeline, giá trị cốt lõi (tầm nhìn/sứ mệnh), lĩnh vực ngành nghề, quy trình liên hệ, khối bản đồ. Xoá `data/about.ts`, `data/business-fields.ts` (đã dời hết vào dictionary); `data/contact.ts` chỉ còn `inquiryTypeIds`.
    - **Follow-up nhỏ** — tên hiển thị công ty ở footer route EN: "Công ty Thiên Đức" → **"Thien Duc Company"** qua khóa `shared.companyName` (VI giữ nguyên).
    - **Ghi chú 3 banner tĩnh trong `data/banners.ts`:** phần eyebrow/title/subtitle/ctaLabel của các banner này nằm trong copy UI tĩnh và đã thuộc phạm vi B-series (dictionary hoá qua các section trang chủ) — không còn là mục treo.
  - **Cố ý GIỮ tiếng Việt (không phải thiếu sót):**
    - Tên pháp lý đăng ký, mã số thuế + cơ quan thuế, địa chỉ trụ sở — dữ liệu pháp lý/định danh, không dịch.
    - Nhãn chuyển ngôn ngữ **"Tiếng Việt"** — đúng UX (gọi tên ngôn ngữ đích bằng chính ngôn ngữ đó).
    - **Metadata JSON-LD `Organization.name` + OpenGraph `siteName`** vẫn dùng brand/config gốc (structured data, không phải heading hiển thị; `seo.test.ts` khẳng định giá trị này) — cố ý giữ.
  - **✅ EN-FULL (Group 2) — 7 route audited: HOÀN TẤT (2026-07-18).** Nhánh "nội dung tiếng Anh" cho **bảy route audited** (`/en`, `/en/gioi-thieu`, `/en/lien-he`, `/en/du-an`, `/en/du-an/khu-do-thi-hung-phu`, `/en/tin-tuc`, `/en/tin-tuc/le-khoi-cong-fancy-tower-khu-do-thi-hung-phu`) đã đóng: **0 chuỗi tiếng Việt hiển thị**, VI giữ nguyên, không `[object Object]`, nhãn bản đồ hiện tiếng Anh. Chi tiết + backlog ngoài phạm vi: [closure note 2026-07-18](../08-audits-and-reports/current/2026-07-18-en-full-group2-closure.md). Loạt C khép lại đúng "mục #2 Còn lại" bên dưới (data-model field chưa song ngữ):
    - **C1/C2** — data-model + backfill song ngữ cho project `location`/`category` và news `category.name` (`{vi, en?}`).
    - **C3** — project `quickFacts` song ngữ (label + value) + backfill.
    - **C4** — hiển thị byline tác giả tin theo locale (brand "Thiên Đức" → "Thien Duc" trên `/en`), không đổi schema.
    - **C5a** — `mapLocation` prose (`heading`/`description`/`address`) song ngữ + backfill.
    - **C5b** — 27 nhãn overlay `mapLocation.labels[].text` song ngữ + backfill bằng **script** (`prisma/backfill-map-labels.js`), không có editor Admin cho nhãn.
    - **Bất biến (cả loạt C):** VI giữ **byte-identical**; không `[object Object]` (mapper lùi an toàn về `vi`); dùng cột **JSONB** sẵn có nên **không phát sinh Prisma migration** cho C3/C5a/C5b; C5b do script/seed quản lý (xem [database-migrations.md](../07-deployment/database-migrations.md#seed-dữ-liệu)).
  - **📌 Backlog nội dung tương lai (KHÔNG phải blocker của →4):**
    1. **3 dự án seed/dev — chỉ tồn tại trong `prisma/seed-projects.js`, KHÔNG có trong Admin CMS production** (production xác nhận chỉ có đúng 1 dự án: `khu-do-thi-hung-phu`): `chung-cu-la-bonita`, `du-an-vung-tau` (Silver Sea Tower), `du-an-bay-hien` (Bảy Hiền Tower). Đây là placeholder seed/dev, **không chặn →4**. Nếu/khi các dự án này được publish lên Admin CMS production, phải nhập bản dịch EN **trước khi publish** — dùng Admin editor nội dung song ngữ đã kiểm chứng runtime A–F ([ADMIN-ITEM-CONTENT-P2 Batch M1](../08-audits-and-reports/current/2026-07-19-admin-item-content-p2-batch-m1.md)); năng lực data-model + editor đã sẵn sàng, chỉ còn là việc nhập liệu.
    2. ~~**Một số field CMS chưa song ngữ trong data model hiện tại** — project `quickFacts`, `category`/`location`, nhãn `mapLocation`…~~ **✅ ĐÃ GIẢI QUYẾT (2026-07-18)** qua loạt C ở trên. *Lưu ý phạm vi:* loạt C đóng cho **7 route audited**. Năm trang `/en` ngoài phạm vi (`/en/cong-ty-thanh-vien`, `/en/tuyen-dung`, `/en/dao-tao`, `/en/so-do-to-chuc-cong-ty`, `/en/chinh-sach-nhan-su`) **đã được dọn riêng qua EN-SITE-WIDE (F1–F3)**; ba route hạng mục `[hang-muc]` của Hưng Phú **đã được dọn riêng qua EN-PROJECT-ITEMS-P1** — xem bullet ngay dưới.
  - **✅ EN-SITE-WIDE (F1–F3) — 5 route `/en` ngoài phạm vi 7-route: HOÀN TẤT (2026-07-18).** Dọn tiếng Việt hiển thị cho **năm trang `/en` không nằm trong closure 7-route** — **frontend-only**, dùng dictionary song ngữ `frontend/src/lib/i18n/dictionaries/{vi,en}.json` + data tĩnh song ngữ (cùng pattern loạt i18n UI tĩnh trước đó). **Không đụng backend/Admin/CMS/schema.** Chi tiết + backlog: [follow-up note 2026-07-18](../08-audits-and-reports/current/2026-07-18-en-site-wide-follow-up.md).
    - **F1 — `/en/cong-ty-thanh-vien`:** section dictionary `memberCompanies` + `member-companies.ts` song ngữ (`role`/`note`); intro người đại diện dùng `legalDisplayName[locale]` (nhất quán footer). *Cố ý giữ tiếng Việt:* tên pháp nhân đăng ký + tên người (`Trần Hữu Nghị`) — danh từ riêng/pháp lý.
    - **F2 — `/en/tuyen-dung`:** chuyển hero/values/process/label sang section dictionary `careers` (khuôn `about`/`contact`); `careers.ts` chỉ còn model `OpenPosition` + `openPositions` (rỗng). Nhãn thẻ vị trí đã locale-ready cho vị trí tương lai.
    - **F3 — 3 trang HR placeholder (`/en/dao-tao`, `/en/so-do-to-chuc-cong-ty`, `/en/chinh-sach-nhan-su`):** section dictionary `hrPages` (breadcrumb tái dùng `breadcrumb.home`, nhãn cha "Careers & Human Resources", eyebrow, title + description mỗi trang). Giữ nguyên tính chất **placeholder + `noIndex`** (câu 5 vẫn chờ nội dung).
    - **Bất biến:** VI **byte-identical** (đối chiếu render từng chuỗi gốc); không `[object Object]`; chỉ **thêm** key dictionary mới (không sửa key cũ) nên 7-route đã đóng không bị ảnh hưởng.
    - **Kiểm chứng:** mỗi lô lint + `tsc --noEmit` + test (46 pass) sạch; render/curl từng route EN (0 token tiếng Việt trong body, trừ danh từ riêng F1) + VI (nguyên văn). `next build` **không chạy trọn local** do backend LAN tắt (`ECONNREFUSED …:3001`) ở route `du-an/[hang-muc]` không liên quan — compile + TypeScript trong build vẫn pass.
  - **✅ EN-PROJECT-ITEMS-P1 — 3 route hạng mục `[hang-muc]` của Hưng Phú: HOÀN TẤT (2026-07-18, repo + production).** Backfill tiếng Anh cho `description`/`highlights`/`quickFacts` của `/en/du-an/khu-do-thi-hung-phu/{fancy-tower,hung-phu-mall,khu-nha-o-thap-tang}` bằng script backend **idempotent** `prisma/backfill-project-items.js` + npm script `prisma:backfill:project-items`. **Không đụng frontend/Admin/schema/seed-projects.js, không phát sinh Prisma migration** (JSONB sẵn có), `.vi` giữ nguyên và `.en` đã có thì bỏ qua. Production dry-run 0 unmapped; apply cập nhật **3 hạng mục / 14 field song ngữ**; re-scan production bằng browser trên `document.body.innerText`: 0 match tiếng Việt mục tiêu và 0 ký tự dấu tiếng Việt trong text hiển thị cho cả 3 route. Chi tiết: [EN-PROJECT-ITEMS-P1 note](../08-audits-and-reports/current/2026-07-18-en-project-items-p1.md).

### 2. High-value — Củng cố định giá $10,000+

Thứ tự: H5 → H8 (H5 nên có sớm để đo được chất lượng sau mỗi thay đổi tiếp theo).

- [x] **(→ 5) Error tracking + uptime monitoring** — *Hạng mục: Deployment & operations* ✅ 2026-07-16 (phần repo)
  - **Khu vực:** Backend (NestJS bootstrap `backend/src/main.ts`) + Frontend (Next.js); dịch vụ ngoài (vd. Sentry) + health monitor.
  - **Lý do:** Hiện không biết khi nào production lỗi. Monitoring là điều kiện để gọi là "đáng tin cậy".
  - **Gợi ý:** Tích hợp Sentry cả FE/BE; alert khi 5xx tăng hoặc healthcheck `/api` fail.
  - **Đã hoàn thành (phần repo — 2026-07-16):**
    - **Sentry cả 3 app, errors-only** (`tracesSampleRate: 0`, không Replay, `sendDefaultPii: false`), thiếu DSN → no-op an toàn. Backend: `src/instrument.ts` + capture **chỉ 500 bất ngờ** trong `HttpExceptionFilter` (4xx chủ đích không capture; envelope response giữ nguyên); `beforeSend` xóa request body/IP — nội dung lead/token không bao giờ lên Sentry. Frontend: `instrumentation.ts` (server/edge + `onRequestError`) + `instrumentation-client.ts` + `global-error.tsx` + `[locale]/error.tsx` (UI lỗi thương hiệu, trước đây thiếu hẳn). Admin: init trong `main.tsx` + `Sentry.ErrorBoundary` với `CrashFallback` (`components/crash-fallback.tsx`) — hết trắng trang lặng lẽ.
    - **Env:** `SENTRY_DSN` (render.yaml `sync: false` + `.env.example`), `NEXT_PUBLIC_SENTRY_DSN`, `VITE_SENTRY_DSN` (2 file `.env.example`). Không thêm `SENTRY_AUTH_TOKEN` — source map upload hoãn, tách task riêng.
    - **Docs:** tạo `docs/07-deployment/monitoring-and-alerting.md` (runbook Sentry + UptimeRobot + kiểm chứng + checklist thủ công), cập nhật index 07 + `environment-configuration.md` (kèm sửa ghi chú SMTP đã lỗi thời từ →1).
    - **Kiểm chứng:** backend lint/build/test sạch (8 suites / 77 test); FE `lint` + `tsc` sạch, compile của `next build` pass — **prerender SSG fail do môi trường** (cần DB sống; máy dev không có Docker chạy và không truy cập DB production — hạn chế có sẵn, không do task này); admin lint (chỉ còn 1 warning có sẵn ở `ui/form.tsx`) + build pass.
  - **⚠️ Còn chờ thao tác tay:** tạo 3 project Sentry + dán 3 DSN vào Render/Vercel rồi redeploy; tạo 2 monitor UptimeRobot (`/api` + trang chủ) — sau →2 chỉ để **báo động**, không phải giữ thức. Checklist đầy đủ: `monitoring-and-alerting.md`.
  - **Liên đới →6:** khi enforce CSP phải thêm domain ingest Sentry vào `connect-src` (đã ghi trong monitoring-and-alerting.md).

- [ ] **(→ 6) Enforce CSP (bỏ Report-Only)** — *Hạng mục: Reliability & security*
  - **Khu vực:** `frontend/next.config.ts` (đang `Content-Security-Policy-Report-Only`, còn `unsafe-inline`/`unsafe-eval`).
  - **Lý do:** CSP hiện chỉ giám sát, chưa chặn. Siết lại để phòng thủ XSS thật sự.
  - **Gợi ý:** Theo dõi report một thời gian → chuyển sang `Content-Security-Policy`; thay `unsafe-inline`/`unsafe-eval` bằng nonce/hash của Next.js. Làm **sau** H5 để bắt được vi phạm qua monitoring.

- [x] **(→ 7) JSON-LD structured data giàu hơn** — *Hạng mục: Performance & SEO* ✅ 2026-07-16
  - **Khu vực:** `frontend/src/lib/seo.ts` + layout/trang liên quan (mới chỉ có `BreadcrumbList` ở `frontend/src/components/ui/breadcrumb.tsx`).
  - **Lý do:** Bỏ phí rich-result cho thương hiệu bất động sản → mất cơ hội hiển thị nổi bật trên Google.
  - **Gợi ý:** Thêm `Organization`/`LocalBusiness` (toàn site), `Article` (tin tức), cân nhắc `RealEstateListing`/`Product` cho dự án.
  - **Đã hoàn thành:**
    - **`Organization` toàn site** (nhúng ở `[locale]/layout.tsx`, có `@id` để schema khác tham chiếu): toàn bộ field lấy từ `config/site.ts` — legalName, taxID, foundingDate (2010-04-05, đổi từ `operatingSince`), email, telephone, address (PostalAddress tách từ chuỗi địa chỉ sẵn có), logo thật (`/images/brand/logo-thien-duc.png`). **Không bịa dữ liệu nào.**
    - **`NewsArticle`** ở `tin-tuc/[slug]`: headline/description/image/datePublished từ API; `author` = Person khi bài ghi tác giả, ngược lại trỏ Organization qua `@id`; `publisher` trỏ Organization; `inLanguage` theo locale; `dateModified` cố ý bỏ (API public chưa trả `updatedAt`).
    - **Builder + component:** `buildOrganizationJsonLd()` / `buildNewsArticleJsonLd()` trong `lib/seo.ts`; component `ui/json-ld.tsx` dùng chung. `BreadcrumbList` hiện có giữ nguyên.
    - **Cố ý KHÔNG làm:** `RealEstateListing`/`Product` cho dự án (portfolio đã bàn giao, không có giá/offer — gắn schema rao bán là khai man; xem lại nếu công ty mở bán); `LocalBusiness` (thiếu `openingHours`/`geo`); `sameAs` (repo chưa có URL mạng xã hội chính thức — bổ sung khi công ty cung cấp).
    - **Kiểm chứng:** FE `lint` + `tsc` sạch; bundle riêng `seo.ts` (esbuild) chạy in JSON thật — Organization + NewsArticle (cả hai nhánh author, cả hai locale) đúng cấu trúc, URL localize đúng (`/tin-tuc/…` vs `/en/tin-tuc/…`). Google Rich Results Test bản URL cần chạy sau khi deploy (production dùng `NEXT_PUBLIC_SITE_URL` thật thay `localhost`).

- [x] **(→ 8) CI cho admin + test FE/e2e** — *Hạng mục: Process & deliverables* ✅ 2026-07-16
  - **Khu vực:** `admin/` (chưa có `.github/workflows`), FE (chưa có component test), script `test:e2e` backend chưa dựng.
  - **Lý do:** Regression tự động còn nhẹ; admin không được CI gate.
  - **Gợi ý:** Thêm `ci.yml` cho admin (lint + `tsc -b` + build); thêm vài test component FE trọng yếu + một e2e smoke (đăng nhập admin → tạo nháp → thấy ở FE).
  - **Đã hoàn thành:**
    - **Admin CI:** thêm `.github/workflows/ci.yml` (Node 22, `npm ci` → `lint` → `build`; script `build` = `tsc -b && vite build` nên typecheck đã nằm trong build). Không thêm dependency mới.
    - **FE test setup:** `jest.config.mjs` dùng transformer `next/jest` (jest/ts-jest đã có sẵn trong devDependencies) + `jest.setup.ts` nạp `@testing-library/jest-dom`; script `"test": "jest"`; CI thêm bước `npm test` giữa lint và build. Dev deps mới: `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`. Lưu ý: SWC của `next/jest` chỉ resolve `@/*` trong import — `jest.mock("@/...")` cần `moduleNameMapper` tường minh (đã khai trong `jest.config.mjs`).
    - **FE test (5 suite / 36 test):** `lib/seo.test.ts` (builder JSON-LD →7: Organization/NewsArticle 2 nhánh author + 2 locale, alternates/hreflang, noIndex); `lib/i18n/config.test.ts` (localizePath/splitLocale — bất biến "vi không tiền tố, en có /en"); `ui/breadcrumb.test.tsx` (JSON-LD BreadcrumbList, aria-current, thu gọn mobile); `sections/contact-form.test.tsx` (trần maxLength khớp →3, validate client, honeypot không gọi API, luồng thành công + rate-limit — API mock hoàn toàn); **viết lại `next.config.spec.ts`**: bản cũ so sánh chuỗi hardcode với chính nó (không import config thật, không bắt được regression) → bản mới import `next.config.ts` và assert header thật (phải cập nhật khi làm →6).
    - **Backend e2e smoke:** viết lại `test/app.e2e-spec.ts` (bỏ boilerplate "Hello World!" đã sai từ lâu vì thiếu prefix `api`) thành luồng thật: `GET /api` sống → ghi không token bị 401 → login tài khoản seed → tạo nháp (DRAFT, publishedAt null) → nháp KHÔNG lộ ở route public (list + đoán slug → 404) → PATCH status PUBLISHED → hiện ở public kèm publishedAt → xóa dọn → payload vượt trần →3 bị 400. Bootstrap lặp đúng main.ts (prefix + ValidationPipe + interceptor + filter).
    - **Backend CI job `e2e`:** service container `postgres:17` (credentials vứt đi khai ngay trong workflow — không phải secret), `prisma migrate deploy` → `prisma:seed` (ADMIN_EMAIL/PASSWORD giả) → `test:e2e`. SMTP/Cloudinary/Sentry không cấu hình — đều no-op an toàn theo thiết kế.
    - **Quyết định phạm vi:** không dựng e2e xuyên 3 app (đăng nhập admin UI → thấy ở FE) — cần chạy đồng thời FE+admin+BE trong CI, quá nặng so với giá trị thêm; smoke API-level phủ cùng bề mặt regression.
    - **Kiểm chứng:** admin `lint` + `build` pass; FE `lint` + `tsc --noEmit` sạch, `npm test` 5 suite / 36 test pass; backend `lint` (chỉ còn warning có sẵn) + `build` + unit 8 suite / 77 test pass. **e2e đã xanh trên GitHub Actions** (2026-07-16, sau 2 fix bên dưới) — máy dev không có Postgres/Docker nên e2e chỉ chạy đầy đủ trên CI.
    - **Docs:** `06-testing/testing-strategy.md` từ khung → nội dung thật (ma trận test/CI + cách chạy).
    - **Fix bổ sung (CI build FE đỏ lần chạy đầu):** `next build` không có `NEXT_PUBLIC_API_URL` nổ `Failed to parse URL from /news|/projects|/pages/*` — prerender gọi `fetch` URL tương đối (chế độ mock cũ README nhắc đã bị gỡ, `src/data/projects|news.ts` không còn). Fix: `isApiConfigured` (`lib/api/client.ts`); thiếu API → `generateStaticParams` của `[locale]` layout + 3 trang chi tiết trả rỗng (bỏ prerender, render on-demand + ISR 60s sẵn có), sitemap chỉ gồm route tĩnh. Env đã đặt (Vercel) → full SSG như cũ, không hardcode URL production. Kiểm chứng cả 2 chế độ build local: không env (4 trang tĩnh gốc, pass) + có env (SSG đầy đủ đúng slug thật, pass).
    - **Fix bổ sung (CI e2e backend đỏ lần chạy đầu, 2 vòng):** (1) `test/jest-e2e.json` thiếu `moduleNameMapper` bỏ đuôi `.js` — client Prisma 7 sinh ra file `.ts` nhưng import kiểu ESM `./x.js` (config unit trong `package.json` đã có mapper này từ trước, e2e thì chưa). (2) Client Prisma 7 nạp WASM query compiler bằng `import()` động → Jest cần Node flag `--experimental-vm-modules`: script `test:e2e` đổi thành `node --experimental-vm-modules node_modules/jest/bin/jest.js ...` (đa nền tảng, không thêm dependency; unit test không cần vì mock PrismaService). Sau 2 fix: **CI xanh toàn bộ, e2e 8/8 pass trên Postgres service container.**
  - **✅ SYS-P1-ADMIN-ROBUSTNESS — nền tảng test cho Admin CMS (2026-07-19, repo + push):** →8 để lại khoảng trống "admin chưa có test tự động nào" (CI admin mới chỉ `lint + build`). Batch này thêm **harness Vitest + React Testing Library** (jsdom) vào `thien-duc-website-admin`: `vitest.config.ts` + `src/test/setup.ts`, script `test`/`test:watch` (không đổi `dev`/`build`/`lint`), dev deps `vitest` + `@testing-library/{react,user-event,jest-dom}` + `jsdom`. **Phủ đường đi trọng yếu:** lib helpers (`bilingual`/`jwt`/`api-error-message`/`auth-error-message`/`asset-url`/`labels`/`utils`), `BilingualField`, `ProtectedRoute`, `AuthContext`, `LoginPage`, và smoke render Projects/News/Pages/Contact (API mock). **Kiểm chứng: `npm run lint` PASS · `npm test` PASS · 53 test / 12 file. Không đổi hành vi runtime, không sửa file nguồn admin, không đụng CI YAML.** Hoãn: test trực tiếp schema Zod của 6 FormDialog (schema module-local, cần quyết định export/testability riêng — validation song ngữ đang phủ gián tiếp qua `BilingualField`/`bilingual.ts`). Chi tiết: [SYS-P1-ADMIN-ROBUSTNESS note](../08-audits-and-reports/current/2026-07-19-sys-p1-admin-robustness.md).

### 3. Optional — Nâng cao

Thứ tự: cân nhắc sau khi Critical + High-value xong.

- [ ] **(→ 9) Auth bằng cookie HttpOnly** — *Hạng mục: Reliability & security*
  - **Khu vực:** `admin/src/lib/api/client.ts:8-9` (token trong localStorage) + backend auth.
  - **Lý do:** Finding #10 — XSS có thể lấy token khỏi localStorage. Chuyển sang HttpOnly cookie loại bỏ hẳn rủi ro này (đổi lại phải xử lý CSRF).
  - **Gợi ý:** Việc lớn, ảnh hưởng cả FE+BE; chỉ làm nếu chấp nhận đánh đổi độ phức tạp.

- [ ] **(→ 10) Môi trường staging + WAF** — *Hạng mục: Deployment & operations*
  - **Khu vực:** Hạ tầng (Render/Vercel) + Cloudflare trước API.
  - **Lý do:** Staging cho phép verify trước khi lên thật; WAF chắn DDoS/scan (finding hạ tầng).
  - **Gợi ý:** Phụ thuộc ngân sách; tách branch/preview cho staging.

### 4. Quick wins — Làm nhanh, chi phí thấp

Thứ tự: có thể xen kẽ bất cứ lúc nào; Q11 nên làm sớm vì bổ trợ C4.

- [x] **(→ 11) Seed trang `gioi-thieu`/`lien-he`** — *Hạng mục: Content operations* ✅ 2026-07-16 (repo + production)
  - **Khu vực:** Bảng `pages` (chưa có bản ghi → FE chạy fallback tĩnh); nhập qua `PageFormDialog` hoặc seed script.
  - **Lý do:** Để vòng đời "admin sửa → web hiện" chạy thật, và có bản ghi để nhập bản dịch EN (bổ trợ C4 / →4 — **Q11 là tiền đề của →4**).
  - **Đã hoàn thành (phần repo — 2026-07-16):**
    - **`prisma/seed-pages.js`** + script `prisma:seed:pages`: 2 trang `gioi-thieu` (title + 4 đoạn) và `lien-he` (title + 1 đoạn), nội dung **nguyên văn** copy dự phòng đang chạy trên FE (`data/about.ts`/`contact.ts`, đã đối chiếu từng chuỗi) → seed xong trang public không đổi chữ nào, chỉ chuyển nguồn sang CMS. Status `PUBLISHED` (nội dung vốn đã công khai).
    - **Idempotent + không đè bản admin sửa:** `ON CONFLICT (slug) DO NOTHING` — chỉ tạo khi chưa có, khác các seed upsert khác (trang nội dung là dữ liệu Admin CMS biên tập trực tiếp). Kèm guard `SEED_CONFIRM_PRODUCTION=yes` như các seed khác.
    - **Tiếng Anh cố ý bỏ trống** — repo không có bản dịch EN chính thức cho copy này; →4 nhập qua Admin CMS (chấm vàng "chưa dịch" là chỉ dấu đúng).
    - **Không đổi:** Prisma schema/migration, FE (đã CMS-aware sẵn với fallback), Admin (PageFormDialog đã hỗ trợ đủ slug/title/content song ngữ + đăng/nháp).
    - **Kiểm chứng:** `node --check` pass; guard production hoạt động; backend lint/build/unit 8 suite / 77 test pass.
  - **✅ Đã chạy trên production (2026-07-16, chủ dự án xác nhận):** seed chạy đúng DB Render production; Admin CMS hiện đủ 2 trang; sửa thử `lien-he` trong Admin → thay đổi hiện trên cả FE local lẫn bản Vercel production; kiểm cả chu trình đăng/nháp — về nháp → API public trả **404**, đăng lại → **200**; fallback tĩnh của FE hoạt động đúng khi CMS không có nội dung. **Vòng đời CMS → API → DB → web xác nhận chạy thật đầu-cuối. →4 chính thức hết bị chặn** (2 bản ghi đã sẵn sàng nhận bản dịch EN qua `BilingualField`).

- [ ] **(→ 12) Bỏ cast `as unknown as Prisma.*Input`** — *Hạng mục: Architecture & engineering depth*
  - **Khu vực:** `backend/src/projects/projects.service.ts:103` (và các chỗ tương tự).
  - **Lý do:** Khôi phục type-safety ở ranh giới DB, giảm rủi ro bug tiềm ẩn.
  - **Gợi ý:** Dùng input có kiểu của Prisma thay vì ép kiểu; nhỏ, an toàn, làm kèm khi đụng service liên quan.

- [x] **(→ 13) G4 — Baseline đo lường production (Rich Results + PageSpeed)** — *Hạng mục: Performance & SEO* ✅ 2026-07-17 (phần ĐO hoàn tất — có caveat; các fix phát sinh là task riêng, chưa làm)
  - **Khu vực:** Đo trên production, không sửa code. Kết quả chi tiết + bảng đầy đủ: [g4-measurement-baseline.md](../06-testing/g4-measurement-baseline.md).
  - **Lý do:** Chốt baseline sau →7 (JSON-LD) và trước các fix hiệu năng — có số để so trước/sau. Nguyên tắc: **đo ≠ sửa**, phát hiện actionable tách task riêng.
  - **G4-a — Rich Results Test ✅ (2026-07-17, chủ dự án đo):** 7/7 URL production fetch được, structured data hợp lệ, **không lỗi nghiêm trọng**; trang chủ ra Organization, trang tin ra Article + Breadcrumbs; chỉ có cảnh báo nhỏ về image path/URL (không chặn) — đã ghi vào bảng "Đề xuất fix code" của audit note, ưu tiên thấp. Bước bổ sung chưa chạy: validator.schema.org (xác nhận chi tiết `Organization`).
  - **G4-b — Lighthouse ✅ đo được bằng CLI local (2026-07-17), sau khi PSI web fail `NO_FCP`:** Lighthouse 12.8.2, 7 URL × Mobile + Desktop = 14 lượt. **Kết quả: 8/14 hoàn thành bình thường · 2/14 một phần (`NO_LCP` — riêng `/en/du-an/khu-do-thi-hung-phu`, paint được nhưng không có LCP candidate ở cả 2 thiết bị) · 4/14 fail `NO_FCP` (chập chờn — URL fail đều pass ở thiết bị còn lại).** Lượt fail **không phải điểm hiệu năng**. Baseline lượt hợp lệ: Desktop Perf 98–100, Mobile 77–91, A11y 93–96, BP 96, SEO 100, CLS 0.000. Đã xác nhận từ raw JSON: 0 request hỏng, document luôn 200 <520ms (loại trừ backend chậm); giả thuyết animation/initial-paint **chưa xác nhận** — ghi rõ tách bạch trong audit note. Raw JSON không commit (quyết định chủ dự án) — bảng tóm tắt trong audit note là bản ghi chính thức.
  - **Task ứng viên #1 — NO_FCP/NO_LCP: ✅ ĐÃ FIX & XÁC NHẬN (2026-07-17, cùng ngày):** điều tra ra nguyên nhân gốc — toàn trang bọc trong wrapper `.page-transition` có animation vào trang bắt đầu `opacity: 0` → first paint vô hình, FCP/LCP race dưới throttle của Lighthouse/PSI. **Fix (frontend, 2 file):** `motion-root.tsx` không gắn `page-transition` ở lần tải đầu (cờ module-scope set trong effect — không hydration mismatch; fade khi điều hướng client-side giữ nguyên) + `globals.css` thêm block `prefers-reduced-motion: reduce` phủ các class vào trang/reveal (vá luôn lỗ hổng a11y). Kiểm chứng: lint/tsc/test 36 pass/build local sạch; deploy Vercel; **đo lại cùng config: 14/14 lượt hợp lệ, 0 NO_FCP (trước: 4), 0 NO_LCP (trước: 2), không điểm nào giảm** — bonus SI trang chủ mobile 10.0s→3.5s, du-an VI mobile Perf 79→89. Bảng đầy đủ: audit note "Lần đo 3". Còn chờ (tùy chọn): PSI web re-check để xác nhận môi trường Google.
  - **2 task ứng viên còn mở (xem bảng "Đề xuất fix code" trong audit note):** (2) trang chủ mobile LCP 4.3s — tối ưu ảnh banner; (3) TBT 211–317ms trang dự án mobile (chỉ theo dõi).
