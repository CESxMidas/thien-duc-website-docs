# Hướng dẫn Deploy Production — Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Nhóm:** 07 — Deployment
> **Cập nhật:** 2026-07-19
> **Tài liệu liên quan:** [environment-configuration.md](environment-configuration.md) · [database-migrations.md](database-migrations.md) · [rollback-plan.md](rollback-plan.md)

> 🟠 **Go-live readiness: BLOCKED / DEFERRED (2026-07-19, G7-M1).** Kiểm vận hành
> thủ công mức cao cho thấy hạ tầng **còn Free tier / chưa xác nhận đầy đủ**:
> backend Render còn Free (ngủ), Postgres còn Free, backup/PITR chưa xác nhận,
> restore/rollback drill + Sentry + UptimeRobot chưa làm. **Chưa sẵn sàng go-live.**
> Hoãn có chủ đích (chủ dự án chưa nâng hạ tầng). Nâng plan trả phí (mục 1b) +
> monitoring là **bắt buộc trước go-live cuối**. Chi tiết:
> [G7-M1 verification note](../08-audits-and-reports/current/2026-07-19-g7-m1-manual-ops-verification.md).

> Frontend (Next.js) → **Vercel** · Backend (NestJS + Prisma) + PostgreSQL → **Render**.
> Code đã push đầy đủ lên GitHub (`CESxMidas/thien-duc-website-frontend`, `CESxMidas/thien-duc-website-backend`).

Tài liệu này mô tả **quy trình triển khai**. Chi tiết biến môi trường tách sang
[environment-configuration.md](environment-configuration.md); migration DB xem
[database-migrations.md](database-migrations.md); kế hoạch rollback xem
[rollback-plan.md](rollback-plan.md).

## Kiến trúc & thứ tự triển khai

```
[Vercel] Frontend  ──NEXT_PUBLIC_API_URL──►  [Render] Backend  ──DATABASE_URL──►  [Render] PostgreSQL
                    ◄──────CORS_ORIGIN───────
```

**Làm Backend trước** (để có URL API), rồi cấu hình Frontend trỏ vào.

### Thứ tự triển khai (bắt buộc theo đúng thứ tự này)

Lý do thứ tự: frontend **build** cần API sống (xem cảnh báo sitemap cuối tài liệu),
còn `CORS_ORIGIN`/`ADMIN_APP_URL` chỉ biết được **sau khi** đã có domain thật.

| # | Việc | Ghi chú |
|---|---|---|
| 1 | Tạo PostgreSQL production | Render Blueprint tự tạo `thien-duc-db` |
| 2 | Tạo/deploy backend trên Render | `render.yaml` → New → Blueprint |
| 3 | Nhập biến môi trường backend | Checklist ở [environment-configuration.md](environment-configuration.md) |
| 4 | Chạy migration production | `prisma migrate deploy` (đã nằm trong `startCommand`) — xem [database-migrations.md](database-migrations.md) |
| 5 | Seed tài khoản quản trị đầu tiên | `npm run prisma:seed` với `ADMIN_EMAIL`/`ADMIN_PASSWORD`, **đổi mật khẩu ngay** sau lần đăng nhập đầu |
| 6 | **Xác minh API sống** | `…/api` trả 200, `…/api/docs` mở được |
| 7 | Cấu hình Cloudinary | Cloud name phải **khớp** allowlist `next.config.ts` |
| 8 | Test upload một ảnh trong Admin | Thiếu Cloudinary → 503 |
| 9 | (Tùy chọn) Cấu hình Resend | Bỏ qua được ở lần deploy đầu |
| 10 | **Đánh thức `…/api`** rồi deploy Frontend lên Vercel | ⚠️ Bắt buộc nếu backend còn Free tier — tránh build đỏ ở `/sitemap.xml` |
| 11 | Gắn custom domain cho Frontend | Chốt redirect `www` ↔ apex |
| 12 | Deploy Admin lên Vercel | Preset Vite, output `dist`, `vercel.json` đã có sẵn |
| 13 | Gắn subdomain admin | vd. `admin.example.com` |
| 14 | **Cập nhật `CORS_ORIGIN`** = domain frontend + admin thật | Không để lại origin localhost |
| 15 | **Cập nhật `ADMIN_APP_URL`** = domain admin (HTTPS) | http bị từ chối khi `NODE_ENV=production` |
| 16 | Redeploy backend | Để 14 + 15 có hiệu lực |
| 17 | Cập nhật `NEXT_PUBLIC_SITE_URL` + redeploy Frontend | Biến `NEXT_PUBLIC_*` nướng lúc build |
| 18 | Verify: web công khai, đăng nhập Admin, upload ảnh | |
| 19 | Verify: form liên hệ (+ email nếu đã bật) | Lead phải vào DB |
| 20 | Verify: `/sitemap.xml`, `/robots.txt`, canonical URL | Kiểm URL sinh ra đúng domain thật |

---

## 1. Backend + Database trên Render

Repo đã có sẵn `render.yaml` (Blueprint) — Render tự dựng cả web service lẫn Postgres.

1. Render Dashboard → **New → Blueprint**.
2. Kết nối GitHub, chọn repo **`thien-duc-website-backend`**, nhánh `main`.
3. Render đọc `render.yaml`, hiện: 1 database `thien-duc-db` + 1 web service `thien-duc-website-backend`. Bấm **Apply**.
4. Chờ build (`npm ci && npm run build`) → khi start sẽ tự chạy `prisma migrate deploy` (tạo 12 bảng). Xem [database-migrations.md](database-migrations.md).
5. Xong sẽ có URL, dạng: `https://thien-duc-website-backend.onrender.com`.
   - Kiểm tra: mở `…/api` → trả về "Hello World!"; mở `…/api/docs` → Swagger.

**Biến môi trường**: `render.yaml` đã set sẵn phần lớn; các giá trị cần nhập tay
(Cloudinary secret, Resend…) xem [environment-configuration.md](environment-configuration.md).

### 1b. Nâng lên plan production (task →2 — bắt buộc trước go-live)

> 🟠 **Trạng thái hiện tại (2026-08-10): `render.yaml` đang khai `plan: free` cho
> CẢ HAI thành phần** — cố ý, để deploy/kiểm thử ban đầu mà không cần gắn thẻ
> thanh toán. **Đây KHÔNG phải hạ tầng production.** Phải nâng plan trước go-live.

**Giới hạn của Free tier (phải biết trước khi dùng):**

| Thành phần | Giới hạn Free |
|---|---|
| Web service | **Ngủ sau ~15 phút** không có traffic · request đánh thức mất **~1 phút** · **750 giờ** instance/workspace/tháng · **không có disk bền** |
| PostgreSQL | **1 GB** lưu trữ · **chỉ MỘT** Postgres Free mỗi workspace · **HẾT HẠN sau 30 ngày** (mất dữ liệu) · **KHÔNG có backup**, không PITR |

Hệ quả thực tế khi còn ở Free:

- Form liên hệ có thể **timeout** ở request đầu (frontend hủy ở 10s, cold start lâu hơn).
- Cron đăng bài (`@Cron`) **không chạy đáng tin** vì service ngủ.
- Backend ngủ đúng lúc Vercel build → frontend build **ĐỎ ở `/sitemap.xml`**
  (xem đính chính cuối tài liệu). Đánh thức `…/api` ngay trước khi build frontend.
- Postgres Free hết hạn 30 ngày → **dữ liệu production thật KHÔNG được để ở đây**.

**Mục tiêu khi nâng plan (bắt buộc trước go-live):**

| Thành phần | Plan đề xuất | Mục đích |
|---|---|---|
| Web service | `starter` | Always-on: không ngủ, cron đăng bài (`@Cron`) chạy đáng tin, không cần UptimeRobot để "giữ thức" |
| PostgreSQL | `basic-256mb` | Lưu trữ bền (không hết hạn), backup daily + PITR nếu plan hỗ trợ |

> ⚠️ **Tên plan, giá, retention backup và PITR phải kiểm tra lại ở Render
> Dashboard tại thời điểm nâng** — Render đổi tên/giá plan theo thời gian, tài
> liệu này không hardcode giá làm sự thật vĩnh viễn.

**`render.yaml` một mình KHÔNG đủ** — các việc phải làm tay ở Dashboard:

- [ ] Render Dashboard → xác nhận/áp plan mới khi sync Blueprint + gắn thanh toán
      (đổi YAML không tự trừ tiền).
- [ ] **Postgres free → paid có thể không nâng tại chỗ được** (free là tier riêng).
      Nếu Dashboard không cho đổi plan trực tiếp → theo **"Đường di trú free →
      paid"** trong [backup-and-restore.md](backup-and-restore.md) mục 6 (tạo DB
      trả phí mới → `pg_dump`/`pg_restore` → repoint `DATABASE_URL`). Làm **trước
      mốc 30 ngày** hết hạn của Postgres Free (mốc 90 ngày ghi trước đây đã cũ —
      xác nhận lại ở Render Dashboard vì Render đổi chính sách theo thời gian).
- [ ] Sau khi nâng: xác nhận backup daily + retention + PITR, điền *Nhật ký xác
      nhận* trong [backup-and-restore.md](backup-and-restore.md).
- [ ] Kiểm thử khôi phục một lần ([backup-and-restore.md](backup-and-restore.md) mục 5).
- [ ] Diễn tập rollback một lần ([rollback-plan.md](rollback-plan.md)).
- [ ] (Khuyến nghị) Vẫn đặt UptimeRobot ping `…/api` — không còn để "giữ thức" mà
      để **cảnh báo downtime** (đầy đủ hơn ở task →5 monitoring).
- [ ] Sau khi luồng luôn-thức chạy ổn: bỏ ghi chú "ping giữ backend thức" khỏi
      quy trình vận hành (mục 5 dưới đã cập nhật theo hướng này).

---

## 2. Frontend trên Vercel

Project đã tồn tại: `https://vercel.com/cesxmidas-projects/thien-duc-website-frontend`.

Chỉ cần thêm **Environment Variables** (xem [environment-configuration.md](environment-configuration.md)) rồi redeploy:

1. Vercel → project → **Settings → Environment Variables**, thêm `NEXT_PUBLIC_API_URL` và `NEXT_PUBLIC_SITE_URL` cho cả 3 scope (Production/Preview/Development).
2. **Deployments → Redeploy** (bản mới nhất) để env có hiệu lực.
3. Kiểm tra: mở trang `/lien-he` → gửi thử form → phải trả về thành công thật.

> ⚠️ Frontend là **Next.js** — biến client dùng tiền tố `NEXT_PUBLIC_` và được "nướng" vào lúc build; đặt xong **bắt buộc Redeploy** mới có hiệu lực.

---

## 2b. Admin CMS (Vite static)

Admin là app **Vite + React** (build tĩnh `npm run build` → thư mục `dist/`), tách
repo `thien-duc-website-admin`. **Không** nằm trong `render.yaml`, và CI
(`.github/workflows/ci.yml`) chỉ lint + build (không tự deploy).

> ✅ **Cập nhật 2026-08-10:** repo admin **đã có `vercel.json`** (khác với ghi chú cũ
> "không có"). File này khai sẵn **SPA rewrite** `/(.*) → /index.html` (bắt buộc cho
> React Router: thiếu nó thì F5 ở route con trả 404) và các security header
> (`X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, HSTS, `Permissions-Policy`).
> **Không cần tạo thêm file cấu hình routing nào.**

Cấu hình khi import vào Vercel:

| Mục | Giá trị |
|---|---|
| Framework Preset | **Vite** (Vercel tự nhận) |
| Root Directory | `./` — repo độc lập, **không** phải monorepo, để mặc định |
| Build Command | `npm run build` (= `tsc -b && vite build`) |
| Output Directory | `dist` |
| Install Command | `npm ci` (mặc định) |

- **Host dự kiến:** README của admin ghi *"Vercel static — `admin.thienduc.vn`
  (dự kiến)"*. Đây là **ý định**, chưa có bằng chứng cấu hình trong repo.
- **Host thật đang chạy: ⚠️ cần xác nhận thủ công** ở dashboard (project/host nào
  đang phục vụ Admin, domain thật). Repo không tự động hóa được bước này — xem
  checklist G7-M1.
- **Biến môi trường** (build-time, "nướng" vào bundle — đặt xong phải build lại):
  `VITE_API_URL` = URL Render + `/api`, `VITE_SITE_URL` = domain website công khai,
  `VITE_SENTRY_DSN` (tùy chọn). Chi tiết: [environment-configuration.md](environment-configuration.md).
- **CORS:** origin thật của Admin **phải** được thêm vào `CORS_ORIGIN` của backend
  trên Render (nhiều origin cách nhau bằng dấu phẩy), nếu không trình duyệt chặn
  request đăng nhập/API.

> Quyết định hosting tổng thể: [ADR-0001](../10-decisions/ADR-0001-hosting-vercel-render.md).
> Nếu chốt được host + domain Admin thật, cập nhật lại mục này (thay "cần xác nhận").

---

## 3. Nối 2 đầu (CORS)

Sau khi có domain Vercel chính thức:
1. Render → service backend → **Environment** → sửa `CORS_ORIGIN` = đúng domain Vercel (nhiều domain cách nhau bằng dấu phẩy, không khoảng trắng).
2. Save → Render tự redeploy.

---

## 4. Checklist sau deploy

- [ ] `…/api/docs` mở được (Swagger).
- [ ] Gửi form `/lien-he` trên Vercel → bản ghi xuất hiện trong DB (Render → Postgres → hoặc `npx prisma studio` với external `DATABASE_URL`).
- [ ] Không có lỗi CORS trong Console trình duyệt khi gửi form.
- [ ] `NEXT_PUBLIC_SITE_URL` đúng → breadcrumb JSON-LD sinh URL chuẩn.
- [ ] (Khi có) domain thật → cấu hình ở Vercel (Domains) + cập nhật `CORS_ORIGIN`, `NEXT_PUBLIC_SITE_URL`.

## 5. Xử lý sự cố thường gặp

- **Gửi form báo thành công nhưng DB "trống"** — thường không phải lỗi, mà do:
  - Xem sai **tên bảng**: Prisma map model `ContactSubmission` → bảng SQL là `contact_submissions` (chữ thường, số nhiều). Query: `SELECT * FROM contact_submissions ORDER BY created_at DESC;`
  - Frontend chưa gọi đúng backend: kiểm tra `NEXT_PUBLIC_API_URL` đã đặt và **đã Redeploy** Vercel chưa (biến `NEXT_PUBLIC_*` nướng vào lúc build). Kiểm tra: F12 → Network → gửi form → phải thấy request POST tới `…/api/contact` trả `201`.
  > ✅ **Đã xác nhận bằng mã nguồn (2026-07-19, không còn "mock mode"):** `src/lib/api/client.ts` đặt `API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ""` và `apiFetch` luôn gọi `fetch` thật — **không có lớp mock/fallback trả dữ liệu giả**. Nếu thiếu `NEXT_PUBLIC_API_URL`, base URL rỗng làm mọi lời gọi API hỏng lúc chạy; cờ `isApiConfigured` chỉ để `generateStaticParams`/`sitemap` **bỏ prerender SSG** (trả rỗng) trong môi trường build không có API (vd. CI), **không** phải chế độ giả lập. Kết luận: `NEXT_PUBLIC_API_URL` là **bắt buộc** ở production — khớp với `AGENTS.md`. Mô tả "chế độ mock" cũ trong `DEPLOY.md`/`frontend/.env.example` đã lỗi thời (đề xuất sửa comment dòng 1 của `frontend/.env.example` — thuộc file code-adjacent, cần duyệt riêng).
- **Kết nối DB từ máy local (pgAdmin / Prisma Studio)** — phải dùng **External Database URL** của Render (có đuôi `.singapore-postgres.render.com`), KHÔNG dùng Internal URL (host cụt, chỉ chạy trong mạng Render → lỗi `P1001`). pgAdmin: đặt **SSL mode = Require** ở tab Parameters. Xem thêm cảnh báo `sslmode` ở [environment-configuration.md](environment-configuration.md).
- **Form thỉnh thoảng đỏ / "Failed to fetch" / timeout** — triệu chứng của backend **còn chạy free tier** (ngủ sau 15 phút; request đầu đợi ~30–50s trong khi FE hủy ở 10s). Cách xử lý đúng: nâng plan always-on theo mục **1b** (đây là task →2). Chữa tạm khi chưa nâng: mở `…/api` cho backend thức trước, hoặc ping định kỳ bằng UptimeRobot. Sau khi đã nâng plan mà vẫn gặp → không phải do ngủ, xem log Render.
- **Giờ hiển thị lệch 7 tiếng** — DB lưu **UTC** (đúng chuẩn). Hiển thị giờ VN (UTC+7) bằng `formatDateTime` trong `src/lib/format.ts` (frontend), hoặc trong SQL: `created_at + interval '7 hour'`.

## Ghi chú

- CI GitHub Actions (lint + build) đã có ở cả 2 repo — chạy tự động khi mở PR.
- Rate-limit form liên hệ: 5 request/IP/giờ (đã cấu hình ở backend).
- Migration mới: xem [database-migrations.md](database-migrations.md).

---

## Document history

- **2026-08-10** — Chuyển `render.yaml` sang `plan: free` cho cả web service lẫn
  Postgres (deploy/kiểm thử ban đầu, không cần gắn thẻ): mục 1b nay ghi rõ trạng
  thái Free + bảng giới hạn (ngủ 15 phút, ~1 phút cold start, 750 giờ/tháng;
  Postgres 1 GB, một instance/workspace, hết hạn 30 ngày, không backup) và tách
  riêng bảng "plan đề xuất khi nâng". Sửa mốc hết hạn 90 → 30 ngày.
- **2026-08-10** — Chuẩn bị bàn giao deploy: thêm **bảng thứ tự triển khai 20 bước**;
  **đính chính** bảng "hợp đồng API lúc build" — tổ hợp "có URL + backend ngủ" làm
  build **ĐỎ ở `/sitemap.xml`** (tái hiện thực tế), kèm nguyên nhân (`sitemap.ts`
  không có try/catch) và follow-up "làm sitemap chịu được backend không phản hồi";
  cập nhật mục 2b — admin **đã có `vercel.json`** (SPA rewrite + security headers),
  bổ sung bảng cấu hình import Vercel cho admin.
- **2026-07-19** — G7-M1 (docs-only): thêm banner "Go-live readiness: BLOCKED /
  DEFERRED" đầu file sau khi kiểm vận hành thủ công mức cao (hạ tầng còn Free /
  chưa xác nhận). Liên kết audit note G7-M1.
- **2026-07-21** — Audit nhất quán tên biến env (docs-only): frontend là Next.js
  nên các tham chiếu Vercel/frontend đổi `VITE_*` → `NEXT_PUBLIC_*`
  (`NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_SITE_URL`); mục **2b. Admin CMS (Vite)** giữ
  nguyên `VITE_*` vì admin là Vite.
- **2026-07-19** — Batch G7-D1 (docs-only): giải quyết TODO "mock mode" ở mục 5
  bằng xác nhận mã nguồn (`client.ts` không có mock; biến API bắt
  buộc); thêm mục **2b. Admin CMS (Vite static)** — host thật cần xác nhận thủ công.
- **2026-07-16** — Task →2: thêm mục **1b. Nâng lên plan production** (plan trả
  phí khai ở `render.yaml`, checklist việc làm tay ở Dashboard, đường di trú
  Postgres free→paid); cập nhật mục troubleshooting timeout theo hướng nâng plan.
- **2026-07-16** — Tái cấu trúc tài liệu: tách từ `DEPLOY.md` (gốc ở thư mục root) thành 4 file trong `docs/07-deployment/`. File này giữ quy trình deploy + troubleshooting; biến môi trường, migration, rollback tách sang file riêng. Đánh dấu 1 điểm mâu thuẫn "mock mode" cần xác nhận.

---

## Hop dong API luc BUILD (AUDIT-M2 / D10)

**Route nao fetch luc build:** `generateStaticParams` cua `[locale]/layout.tsx`,
`tin-tuc/[slug]`, `du-an/[slug]`, `du-an/[slug]/[hang-muc]`, cong voi cac trang
duoc prerender (trang chu, `gioi-thieu`, `lien-he`...). Muc dich: prerender SSG
danh sach slug that.

**Hanh vi khi loi (da kiem du 4 che do):**

| Che do | Ket qua |
|---|---|
| Thieu `NEXT_PUBLIC_API_URL` (CI hien tai) | build **xanh**, khong prerender |
| Co URL + backend song | build **xanh**, **co** prerender |
| Co URL + backend ngu | 🔴 build **ĐỎ** tại `/sitemap.xml` — xem đính chính bên dưới |
| Co URL + backend ngu + `BUILD_REQUIRE_API=1` | build **do** co chu dich |

> 🔴 **ĐÍNH CHÍNH (2026-08-10, đo thực tế — không suy đoán).** Dòng thứ ba trước đây
> ghi "build **xanh** + cảnh báo `ECONNREFUSED`". Điều đó **chỉ đúng với cây trang
> `/[locale]`**, KHÔNG đúng với sitemap. Đã tái hiện được trên máy: có
> `NEXT_PUBLIC_API_URL` + backend tắt → `next build` **thất bại**:
>
> ```
> Error occurred prerendering page "/sitemap.xml"
> [TypeError: fetch failed] … code: 'ECONNREFUSED'
> Export encountered an error on /sitemap.xml/route, exiting the build.
> ```
>
> **Nguyên nhân:** `src/app/sitemap.ts` chỉ rào bằng `isApiConfigured` (biến *đã đặt*
> hay chưa) rồi `await Promise.all([getProjects(...), getNewsPosts(...)])` **không có
> try/catch** — khác với cây trang vốn được bọc bằng `safeGenerateStaticParams`.
> Vì vậy `BUILD_REQUIRE_API` để trống **cũng không cứu được**.
>
> **Vì sao CI không bắt được:** `ci.yml` build với `NEXT_PUBLIC_API_URL: ''` → rơi vào
> dòng 1 của bảng. Tổ hợp "có URL + backend chết" **chưa hề được CI phủ**.
>
> **Hệ quả vận hành:** backend Render Free ngủ sau 15 phút → một lần build/redeploy
> Vercel trúng lúc backend ngủ sẽ **hỏng deploy**. Cách né: **deploy backend trước và
> đánh thức `…/api` ngay trước khi redeploy frontend** (hoặc nâng plan always-on, mục 1b).
>
> **Follow-up (chưa làm, cố ý ngoài phạm vi batch này):** *"Làm sitemap chịu được
> việc backend không phản hồi"* — bọc try/catch quanh lời gọi API trong `sitemap.ts`
> để degrade về sitemap chỉ-route-tĩnh giống cây trang, và thêm một ca CI phủ tổ hợp
> "có URL + backend chết". Cần batch code riêng có duyệt.

**Truoc M2, che do thu ba lam `next build` CHET** (`Failed to collect page data`).
Vi backend dang o **Render Free — ngu sau 15 phut**, mot lan build cua Vercel trung
luc backend ngu se that bai. Nay build van xanh; hanh vi runtime giu nguyen nho ISR
(`revalidate = 60`), chi mat phan tinh hoa.

**Yeu cau moi truong CI:** `frontend/.github/workflows/ci.yml` dat tuong minh
`NEXT_PUBLIC_API_URL: ''` — buoc build cua CI **co y khong** phu prerender phu thuoc
backend. Truoc day no xanh chi vi *tinh co thieu bien*, nen khoang trong nay bi che.

**He qua cho Vercel:** muon **bao dam** trang duoc prerender voi du lieu that thi
phai (a) danh thuc / giu backend always-on, va (b) dat `BUILD_REQUIRE_API=1` de build
do neu API khong phan hoi — thay vi am tham ra ban khong prerender.
