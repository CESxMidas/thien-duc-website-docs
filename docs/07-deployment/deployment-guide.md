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
[Vercel] Frontend  ──VITE_API_URL──►  [Render] Backend  ──DATABASE_URL──►  [Render] PostgreSQL
                    ◄──────CORS_ORIGIN───────
```

**Làm Backend trước** (để có URL API), rồi cấu hình Frontend trỏ vào.

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
(Cloudinary secret, SMTP…) xem [environment-configuration.md](environment-configuration.md).

### 1b. Nâng lên plan production (task →2 — bắt buộc trước go-live)

`render.yaml` đã khai plan trả phí cho cả hai thành phần (mục tiêu: hết ngủ, hết
cold start ~30–50s làm timeout form liên hệ, hết hạn 90 ngày của Postgres free,
và có backup được quản lý):

| Thành phần | Khai trong `render.yaml` | Mục đích |
|---|---|---|
| Web service | `plan: starter` | Always-on: không ngủ sau 15 phút, cron đăng bài (`@Cron`) chạy đáng tin, không cần UptimeRobot để "giữ thức" |
| PostgreSQL | `plan: basic-256mb` | Lưu trữ bền (không hết hạn 90 ngày), backup daily + PITR nếu plan hỗ trợ |

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
      mốc 90 ngày** hết hạn.
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

1. Vercel → project → **Settings → Environment Variables**, thêm `VITE_API_URL` và `VITE_SITE_URL` cho cả 3 scope (Production/Preview/Development).
2. **Deployments → Redeploy** (bản mới nhất) để env có hiệu lực.
3. Kiểm tra: mở trang `/lien-he` → gửi thử form → phải trả về thành công thật.

> ⚠️ Biến `VITE_*` được "nướng" vào lúc build — đặt xong **bắt buộc Redeploy** mới có hiệu lực.

---

## 2b. Admin CMS (Vite static)

Admin là app **Vite + React** (build tĩnh `npm run build` → thư mục `dist/`), tách
repo `thien-duc-website-admin`. **Không** nằm trong `render.yaml`; **không** có
`vercel.json`/blueprint riêng trong repo, và CI (`.github/workflows/ci.yml`) chỉ
lint + build (không tự deploy).

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
- [ ] `VITE_SITE_URL` đúng → breadcrumb JSON-LD sinh URL chuẩn.
- [ ] (Khi có) domain thật → cấu hình ở Vercel (Domains) + cập nhật `CORS_ORIGIN`, `VITE_SITE_URL`.

## 5. Xử lý sự cố thường gặp

- **Gửi form báo thành công nhưng DB "trống"** — thường không phải lỗi, mà do:
  - Xem sai **tên bảng**: Prisma map model `ContactSubmission` → bảng SQL là `contact_submissions` (chữ thường, số nhiều). Query: `SELECT * FROM contact_submissions ORDER BY created_at DESC;`
  - Frontend chưa gọi đúng backend: kiểm tra `VITE_API_URL` đã đặt và **đã Redeploy** Vercel chưa (biến `VITE_*` nướng vào lúc build). Kiểm tra: F12 → Network → gửi form → phải thấy request POST tới `…/api/contact` trả `201`.
  > ✅ **Đã xác nhận bằng mã nguồn (2026-07-19, không còn "mock mode"):** `src/lib/api/client.ts` đặt `API_BASE_URL = process.env.VITE_API_URL ?? ""` và `apiFetch` luôn gọi `fetch` thật — **không có lớp mock/fallback trả dữ liệu giả**. Nếu thiếu `VITE_API_URL`, base URL rỗng làm mọi lời gọi API hỏng lúc chạy; cờ `isApiConfigured` chỉ để `generateStaticParams`/`sitemap` **bỏ prerender SSG** (trả rỗng) trong môi trường build không có API (vd. CI), **không** phải chế độ giả lập. Kết luận: `VITE_API_URL` là **bắt buộc** ở production — khớp với `AGENTS.md`. Mô tả "chế độ mock" cũ trong `DEPLOY.md`/`frontend/.env.example` đã lỗi thời (đề xuất sửa comment dòng 1 của `frontend/.env.example` — thuộc file code-adjacent, cần duyệt riêng).
- **Kết nối DB từ máy local (pgAdmin / Prisma Studio)** — phải dùng **External Database URL** của Render (có đuôi `.singapore-postgres.render.com`), KHÔNG dùng Internal URL (host cụt, chỉ chạy trong mạng Render → lỗi `P1001`). pgAdmin: đặt **SSL mode = Require** ở tab Parameters. Xem thêm cảnh báo `sslmode` ở [environment-configuration.md](environment-configuration.md).
- **Form thỉnh thoảng đỏ / "Failed to fetch" / timeout** — triệu chứng của backend **còn chạy free tier** (ngủ sau 15 phút; request đầu đợi ~30–50s trong khi FE hủy ở 10s). Cách xử lý đúng: nâng plan always-on theo mục **1b** (đây là task →2). Chữa tạm khi chưa nâng: mở `…/api` cho backend thức trước, hoặc ping định kỳ bằng UptimeRobot. Sau khi đã nâng plan mà vẫn gặp → không phải do ngủ, xem log Render.
- **Giờ hiển thị lệch 7 tiếng** — DB lưu **UTC** (đúng chuẩn). Hiển thị giờ VN (UTC+7) bằng `formatDateTime` trong `src/lib/format.ts` (frontend), hoặc trong SQL: `created_at + interval '7 hour'`.

## Ghi chú

- CI GitHub Actions (lint + build) đã có ở cả 2 repo — chạy tự động khi mở PR.
- Rate-limit form liên hệ: 5 request/IP/giờ (đã cấu hình ở backend).
- Migration mới: xem [database-migrations.md](database-migrations.md).

---

## Document history

- **2026-07-19** — G7-M1 (docs-only): thêm banner "Go-live readiness: BLOCKED /
  DEFERRED" đầu file sau khi kiểm vận hành thủ công mức cao (hạ tầng còn Free /
  chưa xác nhận). Liên kết audit note G7-M1.
- **2026-07-19** — Batch G7-D1 (docs-only): giải quyết TODO "mock mode" ở mục 5
  bằng xác nhận mã nguồn (`client.ts` không có mock; `VITE_API_URL` bắt
  buộc); thêm mục **2b. Admin CMS (Vite static)** — host thật cần xác nhận thủ công.
- **2026-07-16** — Task →2: thêm mục **1b. Nâng lên plan production** (plan trả
  phí khai ở `render.yaml`, checklist việc làm tay ở Dashboard, đường di trú
  Postgres free→paid); cập nhật mục troubleshooting timeout theo hướng nâng plan.
- **2026-07-16** — Tái cấu trúc tài liệu: tách từ `DEPLOY.md` (gốc ở thư mục root) thành 4 file trong `docs/07-deployment/`. File này giữ quy trình deploy + troubleshooting; biến môi trường, migration, rollback tách sang file riêng. Đánh dấu 1 điểm mâu thuẫn "mock mode" cần xác nhận.
