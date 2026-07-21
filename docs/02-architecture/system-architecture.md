# Kiến trúc hệ thống — Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Nhóm:** 02 — Architecture
> **Cập nhật:** 2026-07-16
> **Nguồn:** tổng hợp từ `AGENTS.md` (hợp đồng chung), [audit-baseline](../08-audits-and-reports/current/2026-07-16-audit-baseline.md), [deployment-guide](../07-deployment/deployment-guide.md). Sơ đồ gốc trong [diagrams/](diagrams/).

## Sơ đồ 3 tầng

```
[Vercel] Frontend (Next.js 16)  ──NEXT_PUBLIC_API_URL──►  [Render] Backend (NestJS 11)  ──DATABASE_URL──►  [Render] PostgreSQL 17
   Admin CMS (Vite SPA)         ──VITE_API_URL──────────────►     │
                                ◄────────CORS_ORIGIN──────────────┘
                                                                  └── Cloudinary (lưu ảnh, WebP ≤1200px)
```

Xem thêm sơ đồ chi tiết: [kiến trúc 3 tầng](diagrams/05-kien-truc-3-tang.png) · [DFD mức 0](diagrams/06-dfd-muc-0.png) · [ERD tóm tắt](diagrams/07-erd-tom-tat.png).

## Ba ứng dụng

| Ứng dụng | Vai trò | Stack | Chi tiết |
|---|---|---|---|
| `thien-duc-website-frontend` | Website công khai | Next.js 16 App Router + React 19 + Tailwind v4 | [frontend-architecture](frontend-architecture.md) |
| `thien-duc-website-admin` | Admin CMS | Vite + React 19 + shadcn/ui + TanStack Query + RHF/Zod | — |
| `thien-duc-website-backend` | API | NestJS 11 + Prisma 7 + PostgreSQL 17 | [backend-architecture](backend-architecture.md) |

## Hợp đồng chung giữa 3 project

Nguồn sự thật đầy đủ: `AGENTS.md` (workspace root). Tóm tắt:

- **Response envelope:** mọi API trả `{ success: true, data, message? }` hoặc `{ success: false, error: { code, message, details? } }`. Client bắt buộc bóc envelope.
- **Nội dung song ngữ:** field text lưu JSON `{ vi, en? }`. Frontend đọc `.vi` qua `src/lib/api/mappers.ts`.
- **Enum nguồn sự thật** khai ở `prisma/schema.prisma`: `Role`, `ContentStatus`, `ProjectStatus` (chỉ `DA_BAN_GIAO`, `DANG_THI_CONG`, `CHUAN_BI_KHOI_CONG`), `SubmissionStatus`.
- **Thời gian:** lưu UTC, hiển thị quy đổi giờ VN (UTC+7).
- **Secret** chỉ nằm ở backend — không đặt tiền tố client (`NEXT_PUBLIC_` cho frontend Next.js, `VITE_` cho admin Vite) cho secret.

## Backend — module theo domain

`auth`, `users`, `projects`, `news`, `pages`, `banners`, `cooperation`, `contact`, `media`, `search`. Global prefix `/api`; Swagger tại `/api/docs`. Bảo vệ bằng `JwtAuthGuard` + `RolesGuard` + `@Roles(...)`. Route công khai chỉ trả nội dung `PUBLISHED`.

- Xác thực & phân quyền: [authentication-and-authorization](authentication-and-authorization.md)
- Thiết kế DB (13 model): [database-design](database-design.md)

## Tài liệu kiến trúc chi tiết

Các file trong thư mục này ([backend-architecture](backend-architecture.md), [frontend-architecture](frontend-architecture.md), [database-design](database-design.md), [authentication-and-authorization](authentication-and-authorization.md)) hiện là **khung** — trỏ về nguồn sự thật (`AGENTS.md`, `schema.prisma`, code). Bổ sung dần khi cần.
