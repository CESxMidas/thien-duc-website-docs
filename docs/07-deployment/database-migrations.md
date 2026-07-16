# Migration cơ sở dữ liệu — Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Nhóm:** 07 — Deployment
> **Cập nhật:** 2026-07-16
> **Tài liệu liên quan:** [deployment-guide.md](deployment-guide.md) · [environment-configuration.md](environment-configuration.md)

Stack: **Prisma 7 + PostgreSQL 17**. Schema nguồn sự thật ở `thien-duc-website-backend/prisma/schema.prisma`.

## Trên production (Render)

- Khi web service start, Render tự chạy **`prisma migrate deploy`** (cấu hình trong `render.yaml`) — áp mọi migration còn thiếu vào DB. Lần đầu tạo 12 bảng.
- Migration mới: commit vào `prisma/migrations/` → Render tự `migrate deploy` ở lần deploy kế tiếp.

## Trên máy dev (local)

Local Postgres chạy Docker ở **port 5433** (`docker compose up -d`) — vì máy dev có Postgres Windows chiếm 5432.

- Đổi schema: `npx prisma migrate dev --name <tên>` rồi `npm run prisma:generate`.
- Xem dữ liệu: `npx prisma studio`.

## ⚠️ Cảnh báo áp migration lên production một cách có chủ ý

`.env` của máy dev có thể đang trỏ `DATABASE_URL` vào **Render (production)**. Vì vậy:

- Mọi lệnh `prisma migrate deploy` / `db execute` phải là **hành động có chủ ý**, xác nhận `DATABASE_URL` đang trỏ đúng đích trước khi chạy.
- Ví dụ đã ghi nhận: migration full-text search (`20260710120000_add_fulltext_search`) mới chỉ kiểm chứng trên **DB local**; trước go-live phải `prisma migrate deploy` lên Render một cách có chủ ý.

## Seed dữ liệu

Các script seed idempotent (an toàn chạy lại), một số có chốt `SEED_CONFIRM_PRODUCTION=yes`:

- `npm run prisma:seed` — tạo tài khoản `SUPER_ADMIN` đầu tiên.
- `npm run prisma:seed:projects` — 4 dự án (Hưng Phú, La Bonita, Silver Sea Tower, Bảy Hiền Tower).
- `npm run prisma:seed:news` — 3 chuyên mục + 1 bài tin thật.

> Chi tiết trạng thái từng module và các lỗi migration đã xử lý: xem [implementation-plan.md](../04-implementation/implementation-plan.md).

---

## Document history

- **2026-07-16** — Tách từ `DEPLOY.md` + gom các ghi chú migration/seed rải rác trong `KE-HOACH-CODING.md` khi tái cấu trúc tài liệu.
