# Chiến lược kiểm thử

> **Trạng thái:** Đang áp dụng
> **Nhóm:** 06 — Testing
> **Cập nhật:** 2026-08-22 (đồng bộ tài liệu Batch 13E)
> **Nguồn sự thật:** số liệu đo trực tiếp trên `thien-duc-website-backend@9032698`
> và `thien-duc-website-admin@234981c`.

## Ma trận test + CI hiện tại

| Repo | Lint | Typecheck | Unit/Component | E2E | CI (GitHub Actions) |
| --- | --- | --- | --- | --- | --- |
| **backend** | ✅ eslint | ✅ `tsc --noEmit` + `nest build` | ✅ Jest | ✅ Jest + PostgreSQL thật (có preflight) | `ci.yml`: lint → build → unit; job `e2e` riêng với Postgres service container |
| **admin** | ✅ eslint | ✅ (`tsc -b` trong build) | ✅ Vitest + Testing Library | — | `ci.yml`: lint → build |
| **frontend** | ✅ eslint | ✅ `tsc --noEmit` | ✅ Jest + Testing Library | — (phủ qua e2e backend) | `ci.yml`: lint → test → build |

### Baseline hiện tại (đo ngày 2026-08-22)

| Bộ test | Baseline |
|---|---|
| Backend unit/integration (`npx jest`) | **75 suite / 1254 test** |
| Admin component/lib (`npx vitest run`) | **56 file / 859 test** |
| Backend E2E PostgreSQL thật (`npm run test:e2e`) | **7 suite / 107 test** |

> Đây là **ảnh chụp tại ngày ghi trên**, không phải cam kết cố định. Con số sẽ
> tăng theo mỗi batch; khi lệch thì cập nhật lại mục này thay vì coi là hồi quy.

> ⚠️ **Cảnh báo môi trường local (Admin).** Vitest nạp `.env.local` của máy dev.
> Nếu file đó đặt `VITE_SITE_URL`, ba test khoá hành vi "khi **không** cấu hình
> site URL" sẽ đỏ (`src/lib/asset-url.test.ts`, `src/pages/BannersPage.test.tsx`).
> Đây là **artefact môi trường**, không phải hồi quy code — trên checkout sạch và
> trên CI cả 859 test đều xanh. Xoá/bỏ trống `VITE_SITE_URL` khi chạy bộ đầy đủ.

## Các lớp kiểm thử

### 1. Unit — luật thuần, không I/O

Vị từ hiển thị, luật lịch, quyền sửa, cửa sổ banner. Đây là nơi khoá **phần tinh
tế nhất** của cơ chế hẹn giờ, đặc biệt phép so `publishedAt === scheduledAt` để
phân biệt một *dự định* chưa xảy ra với *lịch sử xuất bản thật*.

### 2. Integration service — mock Prisma

Toàn bộ lệnh nghiệp vụ (đặt lịch, huỷ lịch, đổi trạng thái, quyền EDITOR) chạy
qua service thật với Prisma mock. Không đụng DB, không đụng mail.

### 3. E2E trên PostgreSQL thật

Chỉ dùng cho thứ **không** mô phỏng được: hành vi múi giờ của chính PostgreSQL,
full-text search + unaccent, ràng buộc/index thật, luồng HTTP đầu-cuối.

### 4. Kiểm thử múi giờ (hồi quy)

`test/scheduler-utc.e2e-spec.ts` chạy reconciler trên phiên DB đặt `TimeZone`
**khác UTC** và khẳng định nội dung vẫn đăng đúng giờ. Đây là hồi quy cho lỗi so
`timestamp without time zone` với `NOW()` (`timestamptz`) — lệch đúng bằng offset
phiên. Xem [system-architecture](../02-architecture/system-architecture.md) mục UTC.

### 5. Đồng hồ đóng băng (Admin)

Test Admin liên quan hẹn giờ đóng băng đồng hồ để mốc "tối thiểu 1 phút" / "tối
đa 2 năm" và phép quy đổi GMT+7 là **tất định**, không phụ thuộc lúc chạy test.

### 6. Khả truy cập (accessibility)

Kiểm tên khả truy cập lấy từ nhãn field thật, `aria-invalid`/`aria-describedby`
được truyền xuống input thật, và tương phản chữ nhỏ đạt WCAG AA. Chi tiết case:
[test-cases](test-cases.md) mục 6.

### 7. Mock API ở tầng client

Test Admin và Frontend **mock toàn bộ API** — không gọi mạng thật, không cần
backend chạy.

## Cách chạy local

```bash
# Backend — unit/integration, KHÔNG cần DB
npm run lint && npx tsc --noEmit && npx jest && npm run build

# Backend — E2E, CẦN PostgreSQL local (xem mục dưới)
npm run test:e2e

# Admin
npm run lint && npx vitest run && npm run build

# Frontend
npm run lint && npx tsc --noEmit && npm test && npm run build
```

## E2E backend — an toàn môi trường

`npm run test:e2e` chạy **hai bước**:

```
node prisma/preflight-e2e.js   &&   jest --config ./test/jest-e2e.json
```

Preflight hỏng sớm với thông điệp chỉ đúng biến còn thiếu, thay vì để cả bộ cùng
đỏ ở `beforeAll`. Nó **chỉ in tên biến + lý do** — không in giá trị, không in
`DATABASE_URL`, không in secret.

### Preflight chặn những gì

| Kiểm tra | Yêu cầu |
|---|---|
| Tên database | **bắt buộc** `thien_duc_test` |
| Host | **chỉ** `localhost` hoặc `127.0.0.1` — E2E không được chạm DB từ xa |
| `NODE_ENV` | `test` |
| `MAIL_FAKE_TRANSPORT` | `1` — chặn mọi lời gọi Resend thật |
| `ADMIN_ROLE` | nếu có đặt thì **phải** là `ADMIN` |
| Biến bắt buộc | `DATABASE_URL`, `JWT_ACCESS_SECRET`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` |

> **Cổng phát triển hiện tại là `5432`.** Cấu hình lịch sử `thien_duc` trên cổng
> `5433` **không** hợp lệ cho E2E — preflight sẽ từ chối vì sai tên database.

> **Không bao giờ** trỏ E2E vào DB production. Không đặt secret thật vào biến
> E2E — mọi credential ở đây là giá trị dùng một lần.

### Vì sao `ADMIN_ROLE` phải là `ADMIN`

Có căng thẳng cấu hình đã biết giữa hai luồng:

- Luồng **bootstrap tài khoản đầu tiên** (`prisma/seed.js`) có thể dùng
  `SUPER_ADMIN`.
- **E2E** khẳng định nội dung mới tạo là `DRAFT` — điều này chỉ đúng với `ADMIN`,
  vì SUPER_ADMIN đi tắt qua luồng duyệt.

Cách xử lý: môi trường E2E đặt tường minh `ADMIN_ROLE=ADMIN`. Đây **không** phải
một biến mới; tài liệu này không đề xuất thiết kế lại cơ chế đó.

## E2E trên máy sạch — trình tự

```bash
# 1. Tạo DB test local
createdb thien_duc_test          # hoặc: CREATE DATABASE thien_duc_test;

# 2. Cấu hình biến E2E an toàn — mẫu ở .env.example
#    DATABASE_URL=postgresql://…@localhost:5432/thien_duc_test?schema=public
#    NODE_ENV=test · MAIL_FAKE_TRANSPORT=1 · ADMIN_ROLE=ADMIN
#    + SUPER_ADMIN_EMAIL/PASSWORD, ADMIN_EMAIL/PASSWORD (giá trị dùng một lần)

# 3. Áp schema
npx prisma migrate deploy

# 4. Seed hai tài khoản test
npm run prisma:seed:e2e

# 5. Chạy
npm run test:e2e
```

> **`test:e2e` KHÔNG tự seed.** Bước 4 là bắt buộc và tách riêng — bỏ qua thì bộ
> test sẽ đỏ ở khâu đăng nhập. Có thể chạy riêng preflight bằng
> `npm run e2e:preflight` để kiểm môi trường trước.

> `npx prisma migrate dev` **không** dùng ở đây: nó tự gọi seed, và seed E2E có
> cầu chì chỉ cho chạy trên `thien_duc_test`.

## Nguyên tắc

- **Không có test nào nối vào production.** Không DB production, không mail thật,
  không API bên thứ ba thật.
- **Unit backend mock Prisma/MailService** — không đụng DB/Resend thật.
- **Test client mock toàn bộ API** — không cần backend chạy.
- **Không đưa secret thật vào test/CI** — mọi credential trong workflow là giá
  trị dùng một lần.
- Máy dev không có PostgreSQL thì dựa vào CI để chạy E2E.

## `next build` không cần API sống

`NEXT_PUBLIC_API_URL` không đặt (CI, máy dev offline) → `isApiConfigured`
(`lib/api/client.ts`) tắt prerender: `generateStaticParams` của `[locale]` layout
+ 3 trang chi tiết trả rỗng, sitemap chỉ gồm route tĩnh. Trang render on-demand
lúc chạy (ISR `revalidate 60`). Production (Vercel, env đã đặt) giữ nguyên full SSG.

## Tài liệu liên quan

- Ma trận case nghiệp vụ: [test-cases](test-cases.md)
- Luật được khoá bởi test: [functional-requirements](../01-requirements/functional-requirements.md)
- Kiến trúc ba lớp: [system-architecture](../02-architecture/system-architecture.md)
- Baseline đo production: [g4-measurement-baseline](g4-measurement-baseline.md)
