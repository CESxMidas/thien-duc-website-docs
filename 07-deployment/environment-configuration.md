# Cấu hình biến môi trường — Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Nhóm:** 07 — Deployment
> **Cập nhật:** 2026-08-27 (Batch 15B — Admin phục vụ dưới `https://www.thienduccons.vn/admin`)
> **Tài liệu liên quan:** [deployment-guide.md](deployment-guide.md) · [database-migrations.md](database-migrations.md)

> ⚠️ **Không lưu secret thật (mật khẩu, token, API secret, connection string thật) trong tài liệu này hay bất kỳ file nào trong Git.** Chỉ ghi *tên biến*, *nơi nhập*, *ý nghĩa*. Giá trị thật nhập trực tiếp ở dashboard Render/Vercel hoặc file `.env` (đã `.gitignore`).

## URL backend production — origin vs API base

Hai giá trị này **khác nhau một đoạn `/api`**, đặt nhầm là hỏng:

| Dùng ở đâu | Giá trị đúng |
|---|---|
| Origin backend (host) | `https://thien-duc-website-backend-w1du.onrender.com` |
| Biến API của Frontend/Admin (`NEXT_PUBLIC_API_URL`, `VITE_API_URL`) | `https://thien-duc-website-backend-w1du.onrender.com/api` |
| Nguồn CSP `connect-src` của Frontend | `https://thien-duc-website-backend-w1du.onrender.com` — **origin, KHÔNG kèm `/api`** (CSP khớp theo origin, thêm path là sai) |
| `CORS_ORIGIN` của backend | domain **Frontend/Admin**, không phải domain backend |

> ⚠️ Hostname cũ `https://thien-duc-website-backend.onrender.com` **không còn dùng**.
> Nếu còn sót trong biến môi trường ở Render/Vercel thì phải sửa và **redeploy**
> (biến `NEXT_PUBLIC_*`/`VITE_*` nướng vào lúc build).

## URL công khai của Admin CMS — `/admin` (Batch 15B)

Admin **không còn** ở gốc domain Vercel riêng. Kiến trúc hiện tại:

| Vai trò | URL |
|---|---|
| Website công khai | `https://www.thienduccons.vn` |
| **Admin CMS (URL chính thức)** | **`https://www.thienduccons.vn/admin`** |
| Admin — URL chẩn đoán trực tiếp | `https://thien-duc-website-admin.vercel.app/admin/` |
| Backend API (**không đổi**) | `https://thien-duc-website-backend-w1du.onrender.com/api` |

Cách hoạt động — vẫn là **hai Vercel project tách riêng**:

1. Admin (Vite SPA) build với `base: '/admin/'` + `outDir: 'dist/admin'`, nên
   đường dẫn file trùng khớp đường dẫn URL (`/admin/assets/*` ↔
   `dist/admin/assets/*`).
2. Frontend (Next.js) rewrite `/admin` và `/admin/:path*` sang project Admin,
   **giữ nguyên tiền tố**. Đây là rewrite phía server — thanh địa chỉ của trình
   duyệt vẫn là `www.thienduccons.vn/admin/...`.
3. `src/proxy.ts` của Frontend **loại trừ** `admin$|admin/` khỏi matcher định
   tuyến locale (proxy chạy TRƯỚC rewrites; không loại trừ thì `/admin/...` bị
   biến thành `/vi/admin/...` và trả 404).

**DNS: KHÔNG đổi gì.** `www.thienduccons.vn` vốn đã trỏ vào Vercel project
Frontend; `/admin` là định tuyến theo *path*, không phải theo host.

> ⚠️ **Người dùng CMS phải đăng nhập lại MỘT lần sau khi cắt sang URL mới.**
> Admin xác thực bằng **Bearer token lưu trong `localStorage`/`sessionStorage`**,
> mà web storage gắn theo **origin**. Token cũ nằm ở origin
> `thien-duc-website-admin.vercel.app` nên không đi theo sang
> `www.thienduccons.vn`. Đây là hệ quả bình thường của việc đổi origin, không
> phải lỗi — nhưng phải báo trước cho biên tập viên.

## Backend (Render — service `thien-duc-website-backend`)

`render.yaml` (Blueprint) đã khai sẵn phần lớn biến. Bảng dưới nêu biến và cách xử lý:

| Biến | Nguồn / cách đặt | Ghi chú |
|---|---|---|
| `DATABASE_URL` | Render tự nối từ Postgres. ✅ không cần làm gì. | Nối từ ngoài Render **bắt buộc `?sslmode=require`** — xem cảnh báo bên dưới. |
| `JWT_ACCESS_SECRET` | Render tự sinh ngẫu nhiên. ✅ | Secret chỉ nằm ở backend. |
| `CORS_ORIGIN` | **Nhập tay** sau khi có domain Vercel thật (mặc định `https://thien-duc-website-frontend.vercel.app`). | Nhiều domain cách nhau bằng dấu phẩy, không khoảng trắng. Backend **từ chối khởi động** nếu thiếu — không fallback wildcard. |
| `NODE_ENV` | **Không khai trong `render.yaml`** — runtime Node của Render tự đặt `production`. ✅ không cần làm gì. | Backend theo quy ước **fail-closed**: thiếu / rỗng / khoảng trắng đều được coi là `production`. Quyết định việc bật **Swagger** (`(nodeEnv?.trim() \|\| 'production') !== 'production'` trong `src/common/swagger.ts`), nạp module hỗ trợ test, và bắt buộc HTTPS cho `ADMIN_APP_URL`. **Đừng** đặt `development`/`test` trên Render — sẽ mở lại `/api/docs` ra Internet. |
| `CLOUDINARY_CLOUD_NAME` | **`ksnntvmu`** — đã xác nhận 2026-08-10. Công khai (nằm trong URL ảnh), đã khai sẵn `value` trong `render.yaml` nên không phải nhập tay. | ✅ Khớp với allowlist ảnh của frontend (`next.config.ts` → `pathname: "/ksnntvmu/**"`, có test khoá ở `next.config.spec.ts`). Ghi chú cũ `thienduc` trong bảng này là **SAI** và đã bỏ. Đổi cloud sau này thì phải sửa **cả** `next.config.ts` + test, nếu không `next/image` trả **400** và ảnh không hiện. |
| `CLOUDINARY_API_KEY` | **Nhập tay** ở Render Dashboard → service backend → Environment (`sync: false`). | Lấy tại Cloudinary Dashboard → API Keys, role **Master Admin**. |
| `CLOUDINARY_API_SECRET` | **Nhập tay** (`sync: false`). | Role *Media Library User* KHÔNG gọi được Admin API → lệnh xóa ảnh thất bại. **Không bao giờ** đặt tiền tố client (`NEXT_PUBLIC_` / `VITE_`). |
| `RESEND_API_KEY` | **Nhập tay** (`sync: false`). | Email thông báo lead chạy **Resend-only** (SMTP fallback đã gỡ khỏi code — xem [SMTP-REMOVAL-ENV-CLEANUP](../08-audits-and-reports/current/2026-07-20-smtp-removal-env-cleanup.md)). Lấy ở dashboard Resend. **Không bao giờ** đặt tiền tố client (`NEXT_PUBLIC_` / `VITE_`). Thiếu → bỏ qua gửi mail, lead vẫn lưu. |
| `MAIL_FROM` | **Nhập tay** (`sync: false`). | Địa chỉ gửi, phải thuộc domain đã verify ở Resend. Thiếu → bỏ qua gửi mail, lead vẫn lưu. |
| `CONTACT_NOTIFY_TO` | **Nhập tay** (`sync: false`). | Nơi nhận email báo lead mới. Thiếu → bỏ qua gửi mail, lead vẫn lưu. |
| `SENTRY_DSN` | **Nhập tay** (`sync: false`), tùy chọn. | Error tracking backend (task →5) — DSN project Sentry riêng của backend. Thiếu = tắt tracking, app vẫn chạy. Xem [monitoring-and-alerting.md](monitoring-and-alerting.md). |
| `ADMIN_APP_URL` | **Nhập tay** (`sync: false`). Giá trị sau cắt sang `/admin`: `https://www.thienduccons.vn/admin` | Gốc để dựng link trong email **mời tài khoản** + **đặt lại mật khẩu**. Bắt buộc **HTTPS** ở production. **Được phép chứa sub-path** (`/admin`) — `mail.service.ts` ghép path tương đối nên tiền tố được giữ nguyên (khoá bằng test từ Batch 15B). Backend **không** hardcode `/admin`: tiền tố hoàn toàn do biến này quyết định. |

> ⚠️ **Nối DB từ ngoài Render bắt buộc có `?sslmode=require` trong `DATABASE_URL`.** `PrismaService` dùng adapter `@prisma/adapter-pg` (node-postgres), mà node-postgres mặc định **không** bật SSL → Render đóng kết nối và mọi route chạm DB trả `500` kèm thông báo đánh lạc hướng `User was denied access on the database`. Prisma CLI (`studio`, `db execute`, `migrate`) có engine riêng tự bật SSL nên vẫn chạy bình thường — **đừng lấy CLI làm bằng chứng rằng DB ổn**. Backend chạy trên Render dùng Internal URL nên không gặp lỗi này; chỉ `.env` máy dev (trỏ External URL) mới cần.

## Frontend (Vercel — project `thien-duc-website-frontend`)

Thêm cho cả 3 scope (Production / Preview / Development):

| Key | Value | Ghi chú |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://thien-duc-website-backend-w1du.onrender.com/api` (origin Render + `/api`) | **Bắt buộc.** Frontend **không có mock mode**: thiếu biến này thì base URL rỗng làm mọi lời gọi API hỏng lúc chạy (`isApiConfigured=false` chỉ bỏ prerender SSG trong build không có API, không giả lập dữ liệu). Xem [deployment-guide.md](deployment-guide.md) mục 5. |
| `NEXT_PUBLIC_SITE_URL` | `https://thien-duc-website-frontend.vercel.app` (domain Vercel thật) | Dùng cho canonical/OG + JSON-LD. |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN project Sentry riêng của frontend (task →5), tùy chọn | DSN là khóa **ingest-only** — an toàn nằm trong bundle client, không phải secret. Thiếu = tắt tracking. |

> ⚠️ Frontend là **Next.js** — biến client dùng tiền tố `NEXT_PUBLIC_` (không phải `VITE_`), được **nướng vào lúc build**; đặt/đổi xong bắt buộc **Redeploy** mới có hiệu lực.

### Biến chỉ dùng lúc BUILD (frontend)

Không có tiền tố `NEXT_PUBLIC_` nên **không lọt vào bundle client**.

| Key | Bắt buộc? | Ghi chú |
|---|---|---|
| `SENTRY_AUTH_TOKEN` | Tùy chọn | 🔒 **SECRET THẬT** (khác DSN). Chỉ đặt ở Vercel/CI, không bao giờ commit, **không bao giờ** đặt sang `NEXT_PUBLIC_*`. Scope cần: `project:releases`. |
| `SENTRY_ORG` | Tùy chọn | Phải có **đủ cả ba** (`AUTH_TOKEN` + `ORG` + `PROJECT`) thì build mới upload source map; thiếu bất kỳ cái nào → bỏ qua, build vẫn xanh (`src/lib/sentry-build.ts`). |
| `SENTRY_PROJECT` | Tùy chọn | |
| `SENTRY_RELEASE` | Tùy chọn | Bỏ trống thì suy theo `VERCEL_GIT_COMMIT_SHA` → `GITHUB_SHA`. |
| `BUILD_REQUIRE_API` | Tùy chọn — **khuyến nghị để trống** | `=1` làm lỗi gọi API lúc build thành **build đỏ** thay vì degrade. Không bật trên Vercel production khi backend còn Free tier (ngủ sau 15 phút) — trúng lúc ngủ là hỏng deploy. |

## Admin CMS (Vercel — project `thien-duc-website-admin`)

Admin là **Vite SPA**, biến client dùng tiền tố `VITE_` và **nướng vào lúc build** → đổi xong phải **Redeploy**.

> 🔒 **Mọi biến `VITE_*` đều lộ ra trình duyệt.** Tuyệt đối không đặt API secret, DB password hay Sentry auth token vào `VITE_*`.

| Key | Bắt buộc? | Value production | Ghi chú |
|---|---|---|---|
| `VITE_API_URL` | **Bắt buộc** | `https://thien-duc-website-backend-w1du.onrender.com/api` | URL gốc backend, **không** có dấu `/` ở cuối. Origin của admin phải nằm trong `CORS_ORIGIN` của backend. Bundle Admin production hiện đã nhúng đúng giá trị này (kiểm chứng 13F-2A); backend trả JSON 401 cho `/api/auth/me` khi chưa đăng nhập và CORS đã cho phép origin Admin trên Vercel. |
| `VITE_SITE_URL` | Nên có | `https://www.thienduccons.vn` | Dùng dựng URL ảnh xem trước (ảnh lưu dạng đường dẫn tương đối của web công khai). Thiếu → tab "Hình ảnh" hiện ô giữ chỗ. Tên biến đúng là `VITE_SITE_URL` (**không** phải `VITE_PUBLIC_SITE_URL`) — xác nhận trong `admin/src`. |
| `VITE_SENTRY_DSN` | Tùy chọn | DSN project Sentry riêng của admin | Ingest-only, an toàn trong bundle client. |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_RELEASE` | Tùy chọn | — | Build-only, **không** tiền tố `VITE_`. Cùng cổng "đủ cả ba" như frontend (`vite.config.ts`). |

## Cloudinary — chốt cloud name (phải làm trước khi deploy)

Backend upload lên cloud nào thì frontend phải cho phép đúng cloud đó:

- Backend: `CLOUDINARY_CLOUD_NAME` (Render env).
- Frontend: `next.config.ts` → `images.remotePatterns[0].pathname` = `"/<cloud>/**"` — **hardcode trong code**, có test khoá (`next.config.spec.ts`).

Hai nơi lệch nhau → `next/image` trả **400**, ảnh không hiện.

> ✅ **ĐÃ CHỐT (2026-08-10): cloud name production là `ksnntvmu`.** Trùng khớp với
> allowlist đang có trong `next.config.ts` → **không cần sửa code frontend**.
> `render.yaml` đã đặt sẵn `CLOUDINARY_CLOUD_NAME: ksnntvmu` (giá trị công khai,
> không phải secret). Chỉ còn `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` phải
> nhập tay ở Render Dashboard.

Nếu sau này đổi sang Cloudinary account/cloud khác thì phải sửa **đồng thời**:
`next.config.ts`, `next.config.spec.ts`, `render.yaml`, và bảng biến ở trên.

## Kiểm tra nhanh: giá trị phải nhập tay

Đánh dấu: **REQUIRED** = thiếu là hỏng · **OPTIONAL** = bỏ được ở lần deploy đầu · **LATER** = làm sau khi có domain thật.

**Render — Backend**

- [ ] `DATABASE_URL` — REQUIRED (Blueprint tự nối; chỉ nhập tay nếu dựng thủ công)
- [ ] `JWT_ACCESS_SECRET` — REQUIRED (Blueprint `generateValue: true`; nếu tự nhập: `openssl rand -base64 48`)
- [ ] `CORS_ORIGIN` — REQUIRED (backend **không khởi động** nếu thiếu)
- [ ] `ADMIN_APP_URL` — LATER (bắt buộc **HTTPS**). Sau Batch 15B: `https://www.thienduccons.vn/admin` — **có** đuôi `/admin`
- [ ] `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — REQUIRED nếu cần upload ảnh (thiếu → upload trả 503, app vẫn chạy)
- [ ] `RESEND_API_KEY` / `MAIL_FROM` / `CONTACT_NOTIFY_TO` — OPTIONAL cho lần deploy đầu (thiếu → không gửi mail, lead vẫn lưu)
- [ ] `SENTRY_DSN` — OPTIONAL
- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` — REQUIRED một lần, để chạy `npm run prisma:seed` tạo tài khoản đầu tiên. Đăng nhập xong **đổi mật khẩu ngay** ở `/admin/ho-so` → **Bảo mật** → **Đổi mật khẩu**; từ lúc đó giá trị trong `ADMIN_PASSWORD` không còn mở được tài khoản nữa

**Vercel — Frontend**

- [ ] `NEXT_PUBLIC_API_URL` — REQUIRED
- [ ] `NEXT_PUBLIC_SITE_URL` — REQUIRED
- [ ] `NEXT_PUBLIC_SENTRY_DSN` — OPTIONAL
- [ ] `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` — OPTIONAL (chỉ khi bật upload source map)
- [ ] `BUILD_REQUIRE_API` — để trống (khuyến nghị)

**Vercel — Admin**

- [ ] `VITE_API_URL` — REQUIRED
- [ ] `VITE_SITE_URL` — REQUIRED (để ảnh xem trước hiện đúng). Sau Batch 15B: `https://www.thienduccons.vn`
- [ ] `VITE_SENTRY_DSN` — OPTIONAL

## Lấy giá trị ở đâu

| Biến | Nguồn |
|---|---|
| `DATABASE_URL` | Render Dashboard → Postgres `thien-duc-db` → Connection (Internal URL cho service cùng region) |
| `JWT_ACCESS_SECRET` | Tự sinh: `openssl rand -base64 48` — không lấy từ đâu, không dùng lại giá trị cũ |
| `CORS_ORIGIN` | Suy ra từ domain frontend + admin đã deploy |
| `ADMIN_APP_URL` | URL công khai của Admin — sau Batch 15B là `https://www.thienduccons.vn/admin` (**kèm** sub-path `/admin`), không phải domain `*.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` | Cloudinary Console → Dashboard / API Keys (role **Master Admin**) |
| `RESEND_API_KEY` | Resend Dashboard → API Keys (cần verify domain gửi trước) |
| `MAIL_FROM` | Địa chỉ thuộc domain đã verify ở Resend |
| `CONTACT_NOTIFY_TO` | Hộp thư công ty muốn nhận lead |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` / `VITE_SENTRY_DSN` | Sentry → Project Settings → Client Keys (DSN) — **mỗi app một project riêng** |
| `SENTRY_AUTH_TOKEN` | Sentry → Settings → Auth Tokens (scope `project:releases`) |
| `NEXT_PUBLIC_API_URL` / `VITE_API_URL` | URL Render (hoặc custom API domain) + `/api` |
| `NEXT_PUBLIC_SITE_URL` / `VITE_SITE_URL` | Domain frontend cuối cùng (`https://www.thienduccons.vn`) — Admin cũng trỏ về đây vì ảnh dự án lưu đường dẫn tương đối của web công khai |

## `.env.example`

Cả 3 project (`backend`, `frontend`, `admin`) đều có `.env.example` liệt kê đầy đủ biến cần thiết — dùng làm mẫu khi dựng môi trường mới. Admin CMS dùng `VITE_API_URL` (mặc định `http://localhost:3001/api`) và `VITE_SENTRY_DSN` (tùy chọn, task →5 — DSN project Sentry riêng của admin, ingest-only nên không phải secret).

Quy ước file env của cả ba repo:

| File | Trạng thái Git | Dùng để |
|---|---|---|
| `.env.example` | **Được track** | Mẫu, chỉ chứa placeholder — không bao giờ chứa giá trị thật |
| `.env` | **Bị ignore** | Giá trị thật ở máy dev. Production KHÔNG dùng file này — nhập thẳng ở dashboard Render/Vercel |

> ✅ Follow-up "comment mock mode ở `frontend/.env.example` đã lỗi thời" (G7-D1)
> đã xong — dòng đầu file hiện ghi rõ frontend **không** có mock mode.

---

## Document history

- **2026-08-27** — Batch 15B: Admin CMS chuyển sang phục vụ dưới
  **`https://www.thienduccons.vn/admin`** (vẫn hai Vercel project tách riêng, FE
  rewrite giữ nguyên tiền tố). Thêm mục **URL công khai của Admin CMS**; thêm
  dòng `ADMIN_APP_URL` vào bảng biến backend kèm ghi chú **được phép chứa
  sub-path**; chốt `VITE_SITE_URL` = `https://www.thienduccons.vn`. Ghi rõ **DNS
  không đổi** và **người dùng CMS phải đăng nhập lại một lần** (token gắn theo
  origin). Hai biến provider (`ADMIN_APP_URL` trên Render, `VITE_SITE_URL` trên
  Vercel-Admin) **chưa** được đổi trong batch này — là bước thủ công khi cắt.
- **2026-08-25** — Batch 13H (docs-only): sửa `NEXT_PUBLIC_API_URL` từ hostname cũ
  `thien-duc-website-backend.onrender.com` sang **`thien-duc-website-backend-w1du.onrender.com/api`**;
  thêm mục **URL backend production — origin vs API base** (phân biệt rõ origin,
  API base có `/api`, và nguồn CSP `connect-src` **không** kèm `/api`); thêm dòng
  `NODE_ENV` vào bảng biến backend kèm hành vi **fail-closed** quyết định việc bật
  Swagger (xem Batch 13G, backend `202bee0`).
- **2026-08-10** — Chuẩn bị bàn giao deploy: bổ sung mục **Admin CMS** (`VITE_API_URL`,
  `VITE_SITE_URL`, `VITE_SENTRY_DSN` — xác nhận tên biến trong `admin/src`, **không**
  phải `VITE_PUBLIC_SITE_URL`); bổ sung bảng **biến chỉ dùng lúc build** của frontend
  (`SENTRY_AUTH_TOKEN`/`ORG`/`PROJECT`/`RELEASE`, `BUILD_REQUIRE_API`); thêm checklist
  giá trị nhập tay + bảng "lấy giá trị ở đâu"; thêm quy ước `.env.example` (track) vs
  `.env` (ignore). **Đánh dấu mâu thuẫn chưa chốt**: `CLOUDINARY_CLOUD_NAME` trong bảng
  ghi `thienduc` nhưng `frontend/next.config.ts` khoá allowlist `"/ksnntvmu/**"` — phải
  xác nhận cloud thật trước khi deploy, lệch nhau thì ảnh không hiện.

- **2026-07-21** — Audit tính nhất quán tên biến env (docs-only): sửa bảng biến
  Frontend từ `VITE_*` → `NEXT_PUBLIC_*` (frontend là **Next.js**, không phải Vite
  — xác nhận qua `frontend/src/lib/api/client.ts`, `.env.example`); gộp email về
  **Resend-only** và gỡ hàng `MAIL_PROVIDER`/`SMTP_*` đã lỗi thời (SMTP fallback
  đã gỡ khỏi code — xem [SMTP-REMOVAL-ENV-CLEANUP](../08-audits-and-reports/current/2026-07-20-smtp-removal-env-cleanup.md)).
  Các mục changelog cũ bên dưới ghi `VITE_API_URL`/`MAIL_PROVIDER` phản ánh cách
  mô tả tại thời điểm đó; tên biến hiện hành xem bảng phía trên.
- **2026-07-20** — Email thông báo lead chạy thật trên production bằng **Resend**
  (`MAIL_PROVIDER=resend`): thêm hàng `MAIL_PROVIDER`/`RESEND_API_KEY`/`MAIL_FROM`,
  ghi rõ Render timeout cổng SMTP nên Resend là mặc định production, SMTP giữ làm
  phương án dự phòng. Test production PASS, hộp thư Gmail công ty nhận được email.
- **2026-07-19** — Batch G7-D1: ghi rõ `VITE_API_URL` bắt buộc và frontend
  không có mock mode (xác nhận qua `client.ts`); thêm ghi chú follow-up "comment
  mock mode ở `frontend/.env.example` đã lỗi thời — sửa ở batch riêng có duyệt".
- **2026-07-16** — Tách từ `DEPLOY.md` (mục "Các biến môi trường", cảnh báo `sslmode`, bảng biến Vercel) khi tái cấu trúc tài liệu.
