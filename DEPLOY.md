# Hướng dẫn Deploy Production — Website Thiên Đức

> Frontend (Next.js) → **Vercel** · Backend (NestJS + Prisma) + PostgreSQL → **Render**.
> Code đã push đầy đủ lên GitHub (`CESxMidas/thien-duc-website-frontend`, `CESxMidas/thien-duc-website-backend`).

## Kiến trúc & thứ tự triển khai

```
[Vercel] Frontend  ──NEXT_PUBLIC_API_URL──►  [Render] Backend  ──DATABASE_URL──►  [Render] PostgreSQL
                    ◄──────CORS_ORIGIN───────
```

**Làm Backend trước** (để có URL API), rồi cấu hình Frontend trỏ vào.

---

## 1. Backend + Database trên Render

Repo đã có sẵn `render.yaml` (Blueprint) — Render tự dựng cả web service lẫn Postgres.

1. Render Dashboard → **New → Blueprint**.
2. Kết nối GitHub, chọn repo **`thien-duc-website-backend`**, nhánh `main`.
3. Render đọc `render.yaml`, hiện: 1 database `thien-duc-db` + 1 web service `thien-duc-website-backend`. Bấm **Apply**.
4. Chờ build (`npm ci && npm run build`) → khi start sẽ tự chạy `prisma migrate deploy` (tạo 12 bảng).
5. Xong sẽ có URL, dạng: `https://thien-duc-website-backend.onrender.com`.
   - Kiểm tra: mở `…/api` → trả về "Hello World!"; mở `…/api/docs` → Swagger.

**Các biến môi trường** (`render.yaml` đã set sẵn, chỉ cần chỉnh khi có dữ liệu thật):
- `DATABASE_URL` — Render tự nối từ Postgres. ✅ không cần làm gì.
- `JWT_ACCESS_SECRET` — Render tự sinh ngẫu nhiên. ✅
- `CORS_ORIGIN` — **quay lại sửa** thành domain Vercel thật sau bước 2 (mặc định `https://thien-duc-website-frontend.vercel.app`).
- `CLOUDINARY_CLOUD_NAME` = `thienduc` (công khai — nằm trong URL ảnh). `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` để `sync: false`, **nhập tay** ở Render Dashboard → service backend → Environment. Lấy tại Cloudinary Dashboard → API Keys, chọn role **Master Admin** (role *Media Library User* không gọi được Admin API nên lệnh xóa ảnh sẽ thất bại). Secret chỉ nằm ở backend — không bao giờ đặt tiền tố `NEXT_PUBLIC_` hay `VITE_`.
- `SMTP_*` — để trống tới khi công ty cung cấp (câu 9 trong `CAU-HOI-CAN-XAC-NHAN.md`).

> ⚠️ Free tier: web service ngủ sau 15 phút không request (request đầu tiên chậm ~30s); Postgres free hết hạn sau 90 ngày. Nâng plan khi go-live thật.

> ⚠️ **Nối DB từ ngoài Render bắt buộc có `?sslmode=require` trong `DATABASE_URL`.** `PrismaService` dùng adapter `@prisma/adapter-pg` (node-postgres), mà node-postgres mặc định **không** bật SSL → Render đóng kết nối và mọi route chạm DB trả `500` kèm thông báo đánh lạc hướng `User was denied access on the database`. Prisma CLI (`studio`, `db execute`, `migrate`) có engine riêng tự bật SSL nên vẫn chạy bình thường — **đừng lấy CLI làm bằng chứng rằng DB ổn**. Backend chạy trên Render dùng Internal URL nên không gặp lỗi này; chỉ `.env` máy dev (trỏ External URL) mới cần.

---

## 2. Frontend trên Vercel

Project đã tồn tại: `https://vercel.com/cesxmidas-projects/thien-duc-website-frontend`.

Chỉ cần thêm **Environment Variables** rồi redeploy:

1. Vercel → project → **Settings → Environment Variables**, thêm cho cả 3 scope (Production/Preview/Development):

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://thien-duc-website-backend.onrender.com/api` (URL Render bước 1 + `/api`) |
   | `NEXT_PUBLIC_SITE_URL` | `https://thien-duc-website-frontend.vercel.app` (domain Vercel thật) |

2. **Deployments → Redeploy** (bản mới nhất) để env có hiệu lực.
3. Kiểm tra: mở trang `/lien-he` → gửi thử form → phải trả về thành công thật (không phải mock).

> Nếu **chưa** đặt `NEXT_PUBLIC_API_URL`, frontend chạy chế độ **mock** (form giả lập thành công, không gọi backend) — hữu ích khi backend chưa sẵn sàng.

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
  - Frontend đang chạy **mock**: chưa đặt `NEXT_PUBLIC_API_URL` hoặc đặt rồi mà **chưa Redeploy** Vercel (biến `NEXT_PUBLIC_*` nướng vào lúc build). Kiểm tra: F12 → Network → gửi form → phải thấy request POST tới `…/api/contact` trả `201`.
- **Kết nối DB từ máy local (pgAdmin / Prisma Studio)** — phải dùng **External Database URL** của Render (có đuôi `.singapore-postgres.render.com`), KHÔNG dùng Internal URL (host cụt, chỉ chạy trong mạng Render → lỗi `P1001`). pgAdmin: đặt **SSL mode = Require** ở tab Parameters.
- **Form thỉnh thoảng đỏ / "Failed to fetch" / timeout** — backend Render free **ngủ sau 15 phút**; request đầu tiên đợi ~30–50s trong khi FE hủy ở 10s. Cách xử lý: mở `…/api` cho backend thức trước, hoặc ping định kỳ bằng UptimeRobot, hoặc nâng plan.
- **Giờ hiển thị lệch 7 tiếng** — DB lưu **UTC** (đúng chuẩn). Hiển thị giờ VN (UTC+7) bằng `formatDateTime` trong `src/lib/format.ts` (frontend), hoặc trong SQL: `created_at + interval '7 hour'`.

## Ghi chú

- CI GitHub Actions (lint + build) đã có ở cả 2 repo — chạy tự động khi mở PR.
- Rate-limit form liên hệ: 5 request/IP/giờ (đã cấu hình ở backend).
- Migration mới: commit vào `prisma/migrations/` → Render tự `migrate deploy` ở lần deploy kế tiếp.
