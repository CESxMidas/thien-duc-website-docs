# Chiến lược kiểm thử

> **Trạng thái:** Đang áp dụng (dựng ở task →8)
> **Nhóm:** 06 — Testing
> **Cập nhật:** 2026-07-16

## Ma trận test + CI hiện tại

| Repo | Lint | Typecheck | Unit/Component | E2E | CI (GitHub Actions) |
| --- | --- | --- | --- | --- | --- |
| **backend** | ✅ eslint | ✅ (trong `nest build`) | ✅ Jest — 8 suite / 77 test (auth, users, search, contact, DTO →3…) | ✅ smoke `test/app.e2e-spec.ts` | `ci.yml`: lint → build → unit; job `e2e` riêng với Postgres service container |
| **frontend** | ✅ eslint | ✅ `tsc --noEmit` | ✅ Jest + Testing Library — 5 suite / 36 test | — (phủ qua e2e backend) | `ci.yml`: lint → test → build |
| **admin** | ✅ eslint | ✅ (`tsc -b` trong build) | — (chưa có, xem "Định hướng") | — | `ci.yml`: lint → build (thêm ở →8) |

## Cách chạy local

```bash
# Backend
npm run lint && npm run build && npm test   # unit — không cần DB
npm run test:e2e                            # cần Postgres sống + admin đã seed (xem dưới)

# Frontend
npm run lint && npx tsc --noEmit && npm test
npm run build   # không cần API: thiếu NEXT_PUBLIC_API_URL → bỏ prerender /[locale] + sitemap tĩnh

# Admin
npm run lint && npm run build
```

## E2E smoke backend (task →8)

Luồng: `GET /api` sống → ghi không token bị 401 → đăng nhập tài khoản seed →
tạo bài nháp → nháp **không** lộ ra route public → duyệt đăng → hiện ở public
→ xóa dọn → payload vượt trần `@MaxLength` (→3) bị 400.

Yêu cầu môi trường (CI tự dựng — xem job `e2e` trong `backend/.github/workflows/ci.yml`):

- `DATABASE_URL` trỏ Postgres **dùng một lần** (CI: service container `postgres:17`,
  credentials vứt đi khai ngay trong workflow). **Không bao giờ** trỏ DB production.
- `prisma migrate deploy` + `npm run prisma:seed` (cần `ADMIN_EMAIL`/`ADMIN_PASSWORD`
  giả, test đăng nhập bằng đúng cặp này).
- `JWT_ACCESS_SECRET` bất kỳ. SMTP/Cloudinary/Sentry bỏ trống — no-op an toàn.

Máy dev không có Postgres/Docker thì dựa vào CI để chạy e2e.

## `next build` không cần API sống

`NEXT_PUBLIC_API_URL` không đặt (CI, máy dev offline) → `isApiConfigured`
(`lib/api/client.ts`) tắt prerender: `generateStaticParams` của `[locale]`
layout + 3 trang chi tiết trả rỗng, sitemap chỉ gồm route tĩnh. Trang render
on-demand lúc chạy (ISR `revalidate 60` sẵn có). Production (Vercel, env đã
đặt) giữ nguyên full SSG — đây là fix cho hạn chế prerender từng ghi ở →5.

## Nguyên tắc

- **Test FE mock toàn bộ API** (`jest.mock`) — không gọi mạng thật, không cần backend chạy.
- **Unit backend mock Prisma/MailService** — không đụng DB/SMTP thật, không lộ secret.
- **Không đưa secret thật vào test/CI** — mọi credential trong workflow là giá trị dùng một lần.
- `next.config.spec.ts` assert header bảo mật từ config **thật** — khi làm task →6
  (enforce CSP) phải cập nhật test này theo.

## Định hướng bổ sung (chưa làm)

- Component test cho admin (form CMS trọng yếu) — cân nhắc Vitest vì admin dùng Vite.
- E2E xuyên app (admin UI → backend → FE) — chỉ khi có nhu cầu thật, chi phí CI cao.

**Nguồn tham khảo:** [audit-baseline](../08-audits-and-reports/current/2026-07-16-audit-baseline.md) mục 8; [implementation-plan →8](../04-implementation/implementation-plan.md).
