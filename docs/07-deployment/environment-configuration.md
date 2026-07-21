# Cấu hình biến môi trường — Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Nhóm:** 07 — Deployment
> **Cập nhật:** 2026-07-20
> **Tài liệu liên quan:** [deployment-guide.md](deployment-guide.md) · [database-migrations.md](database-migrations.md)

> ⚠️ **Không lưu secret thật (mật khẩu, token, API secret, connection string thật) trong tài liệu này hay bất kỳ file nào trong Git.** Chỉ ghi *tên biến*, *nơi nhập*, *ý nghĩa*. Giá trị thật nhập trực tiếp ở dashboard Render/Vercel hoặc file `.env` (đã `.gitignore`).

## Backend (Render — service `thien-duc-website-backend`)

`render.yaml` (Blueprint) đã khai sẵn phần lớn biến. Bảng dưới nêu biến và cách xử lý:

| Biến | Nguồn / cách đặt | Ghi chú |
|---|---|---|
| `DATABASE_URL` | Render tự nối từ Postgres. ✅ không cần làm gì. | Nối từ ngoài Render **bắt buộc `?sslmode=require`** — xem cảnh báo bên dưới. |
| `JWT_ACCESS_SECRET` | Render tự sinh ngẫu nhiên. ✅ | Secret chỉ nằm ở backend. |
| `CORS_ORIGIN` | **Nhập tay** sau khi có domain Vercel thật (mặc định `https://thien-duc-website-frontend.vercel.app`). | Nhiều domain cách nhau bằng dấu phẩy, không khoảng trắng. Backend **từ chối khởi động** nếu thiếu — không fallback wildcard. |
| `CLOUDINARY_CLOUD_NAME` | `thienduc` (công khai — nằm trong URL ảnh). | |
| `CLOUDINARY_API_KEY` | **Nhập tay** ở Render Dashboard → service backend → Environment (`sync: false`). | Lấy tại Cloudinary Dashboard → API Keys, role **Master Admin**. |
| `CLOUDINARY_API_SECRET` | **Nhập tay** (`sync: false`). | Role *Media Library User* KHÔNG gọi được Admin API → lệnh xóa ảnh thất bại. **Không bao giờ** đặt tiền tố client (`NEXT_PUBLIC_` / `VITE_`). |
| `RESEND_API_KEY` | **Nhập tay** (`sync: false`). | Email thông báo lead chạy **Resend-only** (SMTP fallback đã gỡ khỏi code — xem [SMTP-REMOVAL-ENV-CLEANUP](../08-audits-and-reports/current/2026-07-20-smtp-removal-env-cleanup.md)). Lấy ở dashboard Resend. **Không bao giờ** đặt tiền tố client (`NEXT_PUBLIC_` / `VITE_`). Thiếu → bỏ qua gửi mail, lead vẫn lưu. |
| `MAIL_FROM` | **Nhập tay** (`sync: false`). | Địa chỉ gửi, phải thuộc domain đã verify ở Resend. Thiếu → bỏ qua gửi mail, lead vẫn lưu. |
| `CONTACT_NOTIFY_TO` | **Nhập tay** (`sync: false`). | Nơi nhận email báo lead mới. Thiếu → bỏ qua gửi mail, lead vẫn lưu. |
| `SENTRY_DSN` | **Nhập tay** (`sync: false`), tùy chọn. | Error tracking backend (task →5) — DSN project Sentry riêng của backend. Thiếu = tắt tracking, app vẫn chạy. Xem [monitoring-and-alerting.md](monitoring-and-alerting.md). |

> ⚠️ **Nối DB từ ngoài Render bắt buộc có `?sslmode=require` trong `DATABASE_URL`.** `PrismaService` dùng adapter `@prisma/adapter-pg` (node-postgres), mà node-postgres mặc định **không** bật SSL → Render đóng kết nối và mọi route chạm DB trả `500` kèm thông báo đánh lạc hướng `User was denied access on the database`. Prisma CLI (`studio`, `db execute`, `migrate`) có engine riêng tự bật SSL nên vẫn chạy bình thường — **đừng lấy CLI làm bằng chứng rằng DB ổn**. Backend chạy trên Render dùng Internal URL nên không gặp lỗi này; chỉ `.env` máy dev (trỏ External URL) mới cần.

## Frontend (Vercel — project `thien-duc-website-frontend`)

Thêm cho cả 3 scope (Production / Preview / Development):

| Key | Value | Ghi chú |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://thien-duc-website-backend.onrender.com/api` (URL Render + `/api`) | **Bắt buộc.** Frontend **không có mock mode**: thiếu biến này thì base URL rỗng làm mọi lời gọi API hỏng lúc chạy (`isApiConfigured=false` chỉ bỏ prerender SSG trong build không có API, không giả lập dữ liệu). Xem [deployment-guide.md](deployment-guide.md) mục 5. |
| `NEXT_PUBLIC_SITE_URL` | `https://thien-duc-website-frontend.vercel.app` (domain Vercel thật) | Dùng cho canonical/OG + JSON-LD. |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN project Sentry riêng của frontend (task →5), tùy chọn | DSN là khóa **ingest-only** — an toàn nằm trong bundle client, không phải secret. Thiếu = tắt tracking. |

> ⚠️ Frontend là **Next.js** — biến client dùng tiền tố `NEXT_PUBLIC_` (không phải `VITE_`), được **nướng vào lúc build**; đặt/đổi xong bắt buộc **Redeploy** mới có hiệu lực.

## `.env.example`

Cả 3 project (`backend`, `frontend`, `admin`) đều có `.env.example` liệt kê đầy đủ biến cần thiết — dùng làm mẫu khi dựng môi trường mới. Admin CMS dùng `VITE_API_URL` (mặc định `http://localhost:3001/api`) và `VITE_SENTRY_DSN` (tùy chọn, task →5 — DSN project Sentry riêng của admin, ingest-only nên không phải secret).

> 📌 **Follow-up tách batch riêng (chưa làm trong G7-D1):** comment "mock mode" ở dòng đầu `frontend/.env.example` đã **lỗi thời** (frontend không có mock mode — xem [deployment-guide.md](deployment-guide.md) mục 5). `.env.example` là file code-adjacent nên **không sửa trong batch docs-only này**; cần một batch follow-up có duyệt riêng để dọn comment đó.

---

## Document history

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
