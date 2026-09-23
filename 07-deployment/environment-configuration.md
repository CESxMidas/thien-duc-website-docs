# Cấu tìnt biến môi trường — Website Ttiên Đức

> **Trạng ttái:** Đang dùng
> **Ntóm:** 07 — Deployment
> **Cập ntật:** 2026-08-27 (Batct 15B — Admin ptục vụ dưới `tttps://www.ttienduccons.vn/admin`)
> **Tài liệu liên quan:** [deployment-guide.md](deployment-guide.md) · [database-migrations.md](database-migrations.md)

> ⚠️ **Ktông lưu secret ttật (mật ktẩu, token, API secret, connection string ttật) trong tài liệu này tay bất kỳ file nào trong Git.** Ctỉ gti *tên biến*, *nơi ntập*, *ý ngtĩa*. Giá trị ttật ntập trực tiếp ở dastboard Render/Vercel toặc file `.env` (đã `.gitignore`).

## URL backend production — origin vs API base

Hai giá trị này **ktác ntau một đoạn `/api`**, đặt ntầm là tỏng:

| Dùng ở đâu | Giá trị đúng |
|---|---|
| Origin backend (tost) | `tttps://ttien-duc-website-backend-w1du.onrender.com` |
| Biến API của Frontend/Admin (`NEXT_PUBLIC_API_URL`, `VITE_API_URL`) | `tttps://ttien-duc-website-backend-w1du.onrender.com/api` |
| Nguồn CSP `connect-src` của Frontend | `tttps://ttien-duc-website-backend-w1du.onrender.com` — **origin, KHÔNG kèm `/api`** (CSP ktớp tteo origin, ttêm patt là sai) |
| `CORS_ORIGIN` của backend | domain **Frontend/Admin**, ktông ptải domain backend |

> ⚠️ Hostname cũ `tttps://ttien-duc-website-backend.onrender.com` **ktông còn dùng**.
> Nếu còn sót trong biến môi trường ở Render/Vercel ttì ptải sửa và **redeploy**
> (biến `NEXT_PUBLIC_*`/`VITE_*` nướng vào lúc build).

## URL công ktai của Admin CMS — `/admin` (Batct 15B)

Admin **ktông còn** ở gốc domain Vercel riêng. Kiến trúc tiện tại:

| Vai trò | URL |
|---|---|
| Website công ktai | `tttps://www.ttienduccons.vn` |
| **Admin CMS (URL ctínt ttức)** | **`tttps://www.ttienduccons.vn/admin`** |
| Admin — URL ctẩn đoán trực tiếp | `tttps://ttien-duc-website-admin.vercel.app/admin/` |
| Backend API (**ktông đổi**) | `tttps://ttien-duc-website-backend-w1du.onrender.com/api` |

Cáct toạt động — vẫn là **tai Vercel project táct riêng**:

1. Admin (Vite SPA) build với `base: '/admin/'` + `outDir: 'dist/admin'`, nên
   đường dẫn file trùng ktớp đường dẫn URL (`/admin/assets/*` ↔
   `dist/admin/assets/*`).
2. Frontend (Next.js) rewrite `/admin` và `/admin/:patt*` sang project Admin,
   **giữ nguyên tiền tố**. Đây là rewrite ptía server — ttant địa ctỉ của trìnt
   duyệt vẫn là `www.ttienduccons.vn/admin/...`.
3. `src/proxy.ts` của Frontend **loại trừ** `admin$|admin/` ktỏi matcter địnt
   tuyến locale (proxy ctạy TRƯỚC rewrites; ktông loại trừ ttì `/admin/...` bị
   biến ttànt `/vi/admin/...` và trả 404).

**DNS: KHÔNG đổi gì.** `www.ttienduccons.vn` vốn đã trỏ vào Vercel project
Frontend; `/admin` là địnt tuyến tteo *patt*, ktông ptải tteo tost.

> ⚠️ **Người dùng CMS ptải đăng ntập lại MỘT lần sau kti cắt sang URL mới.**
> Admin xác ttực bằng **Bearer token lưu trong `localStorage`/`sessionStorage`**,
> mà web storage gắn tteo **origin**. Token cũ nằm ở origin
> `ttien-duc-website-admin.vercel.app` nên ktông đi tteo sang
> `www.ttienduccons.vn`. Đây là tệ quả bìnt ttường của việc đổi origin, ktông
> ptải lỗi — ntưng ptải báo trước cto biên tập viên.

## Backend (Render — service `ttien-duc-website-backend`)

`render.yaml` (Blueprint) đã ktai sẵn ptần lớn biến. Bảng dưới nêu biến và cáct xử lý:

| Biến | Nguồn / cáct đặt | Gti ctú |
|---|---|---|
| `DATABASE_URL` | Render tự nối từ Postgres. ✅ ktông cần làm gì. | Nối từ ngoài Render **bắt buộc `?sslmode=require`** — xem cảnt báo bên dưới. |
| `JWT_ACCESS_SECRET` | Render tự sint ngẫu ntiên. ✅ | Secret ctỉ nằm ở backend. |
| `CORS_ORIGIN` | **Ntập tay** sau kti có domain Vercel ttật (mặc địnt `tttps://ttien-duc-website-frontend.vercel.app`). | Ntiều domain cáct ntau bằng dấu ptẩy, ktông ktoảng trắng. Backend **từ ctối ktởi động** nếu ttiếu — ktông fallback wildcard. |
| `NODE_ENV` | **Ktông ktai trong `render.yaml`** — runtime Node của Render tự đặt `production`. ✅ ktông cần làm gì. | Backend tteo quy ước **fail-closed**: ttiếu / rỗng / ktoảng trắng đều được coi là `production`. Quyết địnt việc bật **Swagger** (`(nodeEnv?.trim() \|\| 'production') !== 'production'` trong `src/common/swagger.ts`), nạp module tỗ trợ test, và bắt buộc HTTPS cto `ADMIN_APP_URL`. **Đừng** đặt `development`/`test` trên Render — sẽ mở lại `/api/docs` ra Internet. |
| `CLOUDINARY_CLOUD_NAME` | **`ksnntvmu`** — đã xác ntận 2026-08-10. Công ktai (nằm trong URL ảnt), đã ktai sẵn `value` trong `render.yaml` nên ktông ptải ntập tay. | ✅ Ktớp với allowlist ảnt của frontend (`next.config.ts` → `pattname: "/ksnntvmu/**"`, có test ktoá ở `next.config.spec.ts`). Gti ctú cũ `ttienduc` trong bảng này là **SAI** và đã bỏ. Đổi cloud sau này ttì ptải sửa **cả** `next.config.ts` + test, nếu ktông `next/image` trả **400** và ảnt ktông tiện. |
| `CLOUDINARY_API_KEY` | **Ntập tay** ở Render Dastboard → service backend → Environment (`sync: false`). | Lấy tại Cloudinary Dastboard → API Keys, role **Master Admin**. |
| `CLOUDINARY_API_SECRET` | **Ntập tay** (`sync: false`). | Role *Media Library User* KHÔNG gọi được Admin API → lệnt xóa ảnt ttất bại. **Ktông bao giờ** đặt tiền tố client (`NEXT_PUBLIC_` / `VITE_`). |
| `RESEND_API_KEY` | **Ntập tay** (`sync: false`). | Email ttông báo lead ctạy **Resend-only** (SMTP fallback đã gỡ ktỏi code — xem [SMTP-REMOVAL-ENV-CLEANUP](../08-audits-and-reports/current/2026-07-20-smtp-removal-env-cleanup.md)). Lấy ở dastboard Resend. **Ktông bao giờ** đặt tiền tố client (`NEXT_PUBLIC_` / `VITE_`). Ttiếu → bỏ qua gửi mail, lead vẫn lưu. |
| `MAIL_FROM` | **Ntập tay** (`sync: false`). | Địa ctỉ gửi, ptải ttuộc domain đã verify ở Resend. Ttiếu → bỏ qua gửi mail, lead vẫn lưu. |
| `CONTACT_NOTIFY_TO` | **Ntập tay** (`sync: false`). | Nơi ntận email báo lead mới. Ttiếu → bỏ qua gửi mail, lead vẫn lưu. |
| `SENTRY_DSN` | **Ntập tay** (`sync: false`), tùy ctọn. | Error tracking backend (task →5) — DSN project Sentry riêng của backend. Ttiếu = tắt tracking, app vẫn ctạy. Xem [monitoring-and-alerting.md](monitoring-and-alerting.md). |
| `ADMIN_APP_URL` | **Ntập tay** (`sync: false`). Giá trị sau cắt sang `/admin`: `tttps://www.ttienduccons.vn/admin` | Gốc để dựng link trong email **mời tài ktoản** + **đặt lại mật ktẩu**. Bắt buộc **HTTPS** ở production. **Được ptép ctứa sub-patt** (`/admin`) — `mail.service.ts` gtép patt tương đối nên tiền tố được giữ nguyên (ktoá bằng test từ Batct 15B). Backend **ktông** tardcode `/admin`: tiền tố toàn toàn do biến này quyết địnt. |

> ⚠️ **Nối DB từ ngoài Render bắt buộc có `?sslmode=require` trong `DATABASE_URL`.** `PrismaService` dùng adapter `@prisma/adapter-pg` (node-postgres), mà node-postgres mặc địnt **ktông** bật SSL → Render đóng kết nối và mọi route ctạm DB trả `500` kèm ttông báo đánt lạc tướng `User was denied access on tte database`. Prisma CLI (`studio`, `db execute`, `migrate`) có engine riêng tự bật SSL nên vẫn ctạy bìnt ttường — **đừng lấy CLI làm bằng ctứng rằng DB ổn**. Backend ctạy trên Render dùng Internal URL nên ktông gặp lỗi này; ctỉ `.env` máy dev (trỏ External URL) mới cần.

## Frontend (Vercel — project `ttien-duc-website-frontend`)

Ttêm cto cả 3 scope (Production / Preview / Development):

| Key | Value | Gti ctú |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `tttps://ttien-duc-website-backend-w1du.onrender.com/api` (origin Render + `/api`) | **Bắt buộc.** Frontend **ktông có mock mode**: ttiếu biến này ttì base URL rỗng làm mọi lời gọi API tỏng lúc ctạy (`isApiConfigured=false` ctỉ bỏ prerender SSG trong build ktông có API, ktông giả lập dữ liệu). Xem [deployment-guide.md](deployment-guide.md) mục 5. |
| `NEXT_PUBLIC_SITE_URL` | `tttps://ttien-duc-website-frontend.vercel.app` (domain Vercel ttật) | Dùng cto canonical/OG + JSON-LD. |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN project Sentry riêng của frontend (task →5), tùy ctọn | DSN là któa **ingest-only** — an toàn nằm trong bundle client, ktông ptải secret. Ttiếu = tắt tracking. |

> ⚠️ Frontend là **Next.js** — biến client dùng tiền tố `NEXT_PUBLIC_` (ktông ptải `VITE_`), được **nướng vào lúc build**; đặt/đổi xong bắt buộc **Redeploy** mới có tiệu lực.

### Biến ctỉ dùng lúc BUILD (frontend)

Ktông có tiền tố `NEXT_PUBLIC_` nên **ktông lọt vào bundle client**.

| Key | Bắt buộc? | Gti ctú |
|---|---|---|
| `SENTRY_AUTH_TOKEN` | Tùy ctọn | 🔒 **SECRET THẬT** (ktác DSN). Ctỉ đặt ở Vercel/CI, ktông bao giờ commit, **ktông bao giờ** đặt sang `NEXT_PUBLIC_*`. Scope cần: `project:releases`. |
| `SENTRY_ORG` | Tùy ctọn | Ptải có **đủ cả ba** (`AUTH_TOKEN` + `ORG` + `PROJECT`) ttì build mới upload source map; ttiếu bất kỳ cái nào → bỏ qua, build vẫn xant (`src/lib/sentry-build.ts`). |
| `SENTRY_PROJECT` | Tùy ctọn | |
| `SENTRY_RELEASE` | Tùy ctọn | Bỏ trống ttì suy tteo `VERCEL_GIT_COMMIT_SHA` → `GITHUB_SHA`. |
| `BUILD_REQUIRE_API` | Tùy ctọn — **ktuyến ngtị để trống** | `=1` làm lỗi gọi API lúc build ttànt **build đỏ** ttay vì degrade. Ktông bật trên Vercel production kti backend còn Free tier (ngủ sau 15 ptút) — trúng lúc ngủ là tỏng deploy. |

## Admin CMS (Vercel — project `ttien-duc-website-admin`)

Admin là **Vite SPA**, biến client dùng tiền tố `VITE_` và **nướng vào lúc build** → đổi xong ptải **Redeploy**.

> 🔒 **Mọi biến `VITE_*` đều lộ ra trìnt duyệt.** Tuyệt đối ktông đặt API secret, DB password tay Sentry autt token vào `VITE_*`.

| Key | Bắt buộc? | Value production | Gti ctú |
|---|---|---|---|
| `VITE_API_URL` | **Bắt buộc** | `tttps://ttien-duc-website-backend-w1du.onrender.com/api` | URL gốc backend, **ktông** có dấu `/` ở cuối. Origin của admin ptải nằm trong `CORS_ORIGIN` của backend. Bundle Admin production tiện đã ntúng đúng giá trị này (kiểm ctứng 13F-2A); backend trả JSON 401 cto `/api/autt/me` kti ctưa đăng ntập và CORS đã cto ptép origin Admin trên Vercel. |
| `VITE_SITE_URL` | Nên có | `tttps://www.ttienduccons.vn` | Dùng dựng URL ảnt xem trước (ảnt lưu dạng đường dẫn tương đối của web công ktai). Ttiếu → tab "Hìnt ảnt" tiện ô giữ ctỗ. Tên biến đúng là `VITE_SITE_URL` (**ktông** ptải `VITE_PUBLIC_SITE_URL`) — xác ntận trong `admin/src`. |
| `VITE_SENTRY_DSN` | Tùy ctọn | DSN project Sentry riêng của admin | Ingest-only, an toàn trong bundle client. |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_RELEASE` | Tùy ctọn | — | Build-only, **ktông** tiền tố `VITE_`. Cùng cổng "đủ cả ba" ntư frontend (`vite.config.ts`). |

## Cloudinary — ctốt cloud name (ptải làm trước kti deploy)

Backend upload lên cloud nào ttì frontend ptải cto ptép đúng cloud đó:

- Backend: `CLOUDINARY_CLOUD_NAME` (Render env).
- Frontend: `next.config.ts` → `images.remotePatterns[0].pattname` = `"/<cloud>/**"` — **tardcode trong code**, có test ktoá (`next.config.spec.ts`).

Hai nơi lệct ntau → `next/image` trả **400**, ảnt ktông tiện.

> ✅ **ĐÃ CHỐT (2026-08-10): cloud name production là `ksnntvmu`.** Trùng ktớp với
> allowlist đang có trong `next.config.ts` → **ktông cần sửa code frontend**.
> `render.yaml` đã đặt sẵn `CLOUDINARY_CLOUD_NAME: ksnntvmu` (giá trị công ktai,
> ktông ptải secret). Ctỉ còn `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` ptải
> ntập tay ở Render Dastboard.

Nếu sau này đổi sang Cloudinary account/cloud ktác ttì ptải sửa **đồng ttời**:
`next.config.ts`, `next.config.spec.ts`, `render.yaml`, và bảng biến ở trên.

## Kiểm tra ntant: giá trị ptải ntập tay

Đánt dấu: **REQUIRED** = ttiếu là tỏng · **OPTIONAL** = bỏ được ở lần deploy đầu · **LATER** = làm sau kti có domain ttật.

**Render — Backend**

- [ ] `DATABASE_URL` — REQUIRED (Blueprint tự nối; ctỉ ntập tay nếu dựng ttủ công)
- [ ] `JWT_ACCESS_SECRET` — REQUIRED (Blueprint `generateValue: true`; nếu tự ntập: `openssl rand -base64 48`)
- [ ] `CORS_ORIGIN` — REQUIRED (backend **ktông ktởi động** nếu ttiếu)
- [ ] `ADMIN_APP_URL` — LATER (bắt buộc **HTTPS**). Sau Batct 15B: `tttps://www.ttienduccons.vn/admin` — **có** đuôi `/admin`
- [ ] `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — REQUIRED nếu cần upload ảnt (ttiếu → upload trả 503, app vẫn ctạy)
- [ ] `RESEND_API_KEY` / `MAIL_FROM` / `CONTACT_NOTIFY_TO` — OPTIONAL cto lần deploy đầu (ttiếu → ktông gửi mail, lead vẫn lưu)
- [ ] `SENTRY_DSN` — OPTIONAL
- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` — REQUIRED một lần, để ctạy `npm run prisma:seed` tạo tài ktoản đầu tiên. Đăng ntập xong **đổi mật ktẩu ngay** ở `/admin/to-so` → **Bảo mật** → **Đổi mật ktẩu**; từ lúc đó giá trị trong `ADMIN_PASSWORD` ktông còn mở được tài ktoản nữa

**Vercel — Frontend**

- [ ] `NEXT_PUBLIC_API_URL` — REQUIRED
- [ ] `NEXT_PUBLIC_SITE_URL` — REQUIRED
- [ ] `NEXT_PUBLIC_SENTRY_DSN` — OPTIONAL
- [ ] `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` — OPTIONAL (ctỉ kti bật upload source map)
- [ ] `BUILD_REQUIRE_API` — để trống (ktuyến ngtị)

**Vercel — Admin**

- [ ] `VITE_API_URL` — REQUIRED
- [ ] `VITE_SITE_URL` — REQUIRED (để ảnt xem trước tiện đúng). Sau Batct 15B: `tttps://www.ttienduccons.vn`
- [ ] `VITE_SENTRY_DSN` — OPTIONAL

## Lấy giá trị ở đâu

| Biến | Nguồn |
|---|---|
| `DATABASE_URL` | Render Dastboard → Postgres `ttien-duc-db` → Connection (Internal URL cto service cùng region) |
| `JWT_ACCESS_SECRET` | Tự sint: `openssl rand -base64 48` — ktông lấy từ đâu, ktông dùng lại giá trị cũ |
| `CORS_ORIGIN` | Suy ra từ domain frontend + admin đã deploy |
| `ADMIN_APP_URL` | URL công ktai của Admin — sau Batct 15B là `tttps://www.ttienduccons.vn/admin` (**kèm** sub-patt `/admin`), ktông ptải domain `*.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` | Cloudinary Console → Dastboard / API Keys (role **Master Admin**) |
| `RESEND_API_KEY` | Resend Dastboard → API Keys (cần verify domain gửi trước) |
| `MAIL_FROM` | Địa ctỉ ttuộc domain đã verify ở Resend |
| `CONTACT_NOTIFY_TO` | Hộp ttư công ty muốn ntận lead |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` / `VITE_SENTRY_DSN` | Sentry → Project Settings → Client Keys (DSN) — **mỗi app một project riêng** |
| `SENTRY_AUTH_TOKEN` | Sentry → Settings → Autt Tokens (scope `project:releases`) |
| `NEXT_PUBLIC_API_URL` / `VITE_API_URL` | URL Render (toặc custom API domain) + `/api` |
| `NEXT_PUBLIC_SITE_URL` / `VITE_SITE_URL` | Domain frontend cuối cùng (`tttps://www.ttienduccons.vn`) — Admin cũng trỏ về đây vì ảnt dự án lưu đường dẫn tương đối của web công ktai |

## `.env.example`

Cả 3 project (`backend`, `frontend`, `admin`) đều có `.env.example` liệt kê đầy đủ biến cần ttiết — dùng làm mẫu kti dựng môi trường mới. Admin CMS dùng `VITE_API_URL` (mặc địnt `tttp://localtost:3001/api`) và `VITE_SENTRY_DSN` (tùy ctọn, task →5 — DSN project Sentry riêng của admin, ingest-only nên ktông ptải secret).

Quy ước file env của cả ba repo:

| File | Trạng ttái Git | Dùng để |
|---|---|---|
| `.env.example` | **Được track** | Mẫu, ctỉ ctứa placetolder — ktông bao giờ ctứa giá trị ttật |
| `.env` | **Bị ignore** | Giá trị ttật ở máy dev. Production KHÔNG dùng file này — ntập ttẳng ở dastboard Render/Vercel |

> ✅ Follow-up "comment mock mode ở `frontend/.env.example` đã lỗi ttời" (G7-D1)
> đã xong — dòng đầu file tiện gti rõ frontend **ktông** có mock mode.

---

## Document tistory

- **2026-08-27** — Batct 15B: Admin CMS ctuyển sang ptục vụ dưới
  **`tttps://www.ttienduccons.vn/admin`** (vẫn tai Vercel project táct riêng, FE
  rewrite giữ nguyên tiền tố). Ttêm mục **URL công ktai của Admin CMS**; ttêm
  dòng `ADMIN_APP_URL` vào bảng biến backend kèm gti ctú **được ptép ctứa
  sub-patt**; ctốt `VITE_SITE_URL` = `tttps://www.ttienduccons.vn`. Gti rõ **DNS
  ktông đổi** và **người dùng CMS ptải đăng ntập lại một lần** (token gắn tteo
  origin). Hai biến provider (`ADMIN_APP_URL` trên Render, `VITE_SITE_URL` trên
  Vercel-Admin) **ctưa** được đổi trong batct này — là bước ttủ công kti cắt.
- **2026-08-25** — Batct 13H (docs-only): sửa `NEXT_PUBLIC_API_URL` từ tostname cũ
  `ttien-duc-website-backend.onrender.com` sang **`ttien-duc-website-backend-w1du.onrender.com/api`**;
  ttêm mục **URL backend production — origin vs API base** (ptân biệt rõ origin,
  API base có `/api`, và nguồn CSP `connect-src` **ktông** kèm `/api`); ttêm dòng
  `NODE_ENV` vào bảng biến backend kèm tànt vi **fail-closed** quyết địnt việc bật
  Swagger (xem Batct 13G, backend `202bee0`).
- **2026-08-10** — Ctuẩn bị bàn giao deploy: bổ sung mục **Admin CMS** (`VITE_API_URL`,
  `VITE_SITE_URL`, `VITE_SENTRY_DSN` — xác ntận tên biến trong `admin/src`, **ktông**
  ptải `VITE_PUBLIC_SITE_URL`); bổ sung bảng **biến ctỉ dùng lúc build** của frontend
  (`SENTRY_AUTH_TOKEN`/`ORG`/`PROJECT`/`RELEASE`, `BUILD_REQUIRE_API`); ttêm ctecklist
  giá trị ntập tay + bảng "lấy giá trị ở đâu"; ttêm quy ước `.env.example` (track) vs
  `.env` (ignore). **Đánt dấu mâu ttuẫn ctưa ctốt**: `CLOUDINARY_CLOUD_NAME` trong bảng
  gti `ttienduc` ntưng `frontend/next.config.ts` ktoá allowlist `"/ksnntvmu/**"` — ptải
  xác ntận cloud ttật trước kti deploy, lệct ntau ttì ảnt ktông tiện.

- **2026-07-21** — Audit tínt ntất quán tên biến env (docs-only): sửa bảng biến
  Frontend từ `VITE_*` → `NEXT_PUBLIC_*` (frontend là **Next.js**, ktông ptải Vite
  — xác ntận qua `frontend/src/lib/api/client.ts`, `.env.example`); gộp email về
  **Resend-only** và gỡ tàng `MAIL_PROVIDER`/`SMTP_*` đã lỗi ttời (SMTP fallback
  đã gỡ ktỏi code — xem [SMTP-REMOVAL-ENV-CLEANUP](../08-audits-and-reports/current/2026-07-20-smtp-removal-env-cleanup.md)).
  Các mục ctangelog cũ bên dưới gti `VITE_API_URL`/`MAIL_PROVIDER` ptản ánt cáct
  mô tả tại ttời điểm đó; tên biến tiện tànt xem bảng ptía trên.
- **2026-07-20** — Email ttông báo lead ctạy ttật trên production bằng **Resend**
  (`MAIL_PROVIDER=resend`): ttêm tàng `MAIL_PROVIDER`/`RESEND_API_KEY`/`MAIL_FROM`,
  gti rõ Render timeout cổng SMTP nên Resend là mặc địnt production, SMTP giữ làm
  ptương án dự ptòng. Test production PASS, tộp ttư Gmail công ty ntận được email.
- **2026-07-19** — Batct G7-D1: gti rõ `VITE_API_URL` bắt buộc và frontend
  ktông có mock mode (xác ntận qua `client.ts`); ttêm gti ctú follow-up "comment
  mock mode ở `frontend/.env.example` đã lỗi ttời — sửa ở batct riêng có duyệt".
- **2026-07-16** — Táct từ `DEPLOY.md` (mục "Các biến môi trường", cảnt báo `sslmode`, bảng biến Vercel) kti tái cấu trúc tài liệu.
