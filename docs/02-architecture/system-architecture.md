# Kiến trúc hệ thống — Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Nhóm:** 02 — Architecture
> **Cập nhật:** 2026-08-22 (đồng bộ tài liệu Batch 13E)
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
- **Enum nguồn sự thật** khai ở `prisma/schema.prisma`: `Role`, `ContentStatus`, `ProjectStatus` (`DA_BAN_GIAO`, `DANG_THI_CONG`), `SubmissionStatus`, `ProfileChangeStatus`.
- **Thời gian:** lưu UTC, hiển thị quy đổi giờ VN (UTC+7).
- **Secret** chỉ nằm ở backend — không đặt tiền tố client (`NEXT_PUBLIC_` cho frontend Next.js, `VITE_` cho admin Vite) cho secret.

## Backend — module theo domain

`auth`, `users`, `projects`, `news`, `pages`, `banners`, `cooperation`, `contact`, `media`, `search`. Global prefix `/api`; Swagger tại `/api/docs`. Bảo vệ bằng `JwtAuthGuard` + `RolesGuard` + `@Roles(...)`. Route công khai trả nội dung
**đủ điều kiện hiển thị xét lúc truy vấn** — KHÔNG chỉ `PUBLISHED`; xem
[Ba lớp xuất bản](#ba-lớp-xuất-bản--news--project--cooperation--page) bên dưới.

- Xác thực & phân quyền: [authentication-and-authorization](authentication-and-authorization.md)
- Thiết kế DB (16 model): [database-design](database-design.md)

## Ba lớp xuất bản — News · Project · Cooperation · Page

Ba mối quan tâm dưới đây **tách bạch** và không được lẫn vào nhau. Phần lớn nhầm
lẫn về cơ chế hẹn giờ đến từ việc gộp lớp 2 vào lớp 3.

### Lớp 1 — Vòng đời trạng thái (thứ được LƯU)

`DRAFT` → `PENDING` → `PUBLISHED`, cộng hai cột mốc `scheduledAt` + `publishedAt`.

**Không có enum `SCHEDULED`.** "Đã lên lịch" là tổ hợp `PENDING` + `scheduledAt`.

### Lớp 2 — Đủ điều kiện hiển thị (xét lúc TRUY VẤN — đây là nguồn sự thật)

```
status = PUBLISHED
HOẶC (status = PENDING AND scheduledAt IS NOT NULL AND scheduledAt <= now)
```

**Vì sao bắt buộc xét lúc truy vấn:** backend chạy trên Render và **có thể đang
ngủ**. Với một website doanh nghiệp ít traffic, ngủ là trạng thái *bình thường*,
nên lượt cron lúc 08:00 có thể **không bao giờ chạy**. Nếu tính đúng đắn phụ
thuộc cron, bài hẹn 08:00 sẽ nằm im tới khi có người tình cờ đánh thức tiến
trình. Đánh giá điều kiện lúc truy vấn làm tính đúng đắn **hết phụ thuộc vào
cron**: request đầu tiên sau giờ hẹn đã thấy bài, kể cả khi tiến trình vừa thức.

Hệ quả trực tiếp: **nội dung đã tới hạn mà reconciler chưa chạm tới vẫn công
khai** — đúng thiết kế.

### Lớp 3 — Reconciler (chuẩn hoá thứ đã LƯU — THỨ YẾU)

Bốn reconciler độc lập (News, Project, Cooperation, Page), chạy **mỗi 5 phút**,
đổi `PENDING` đã tới hạn thành `PUBLISHED`.

> Reconciler **KHÔNG** phải cơ chế bảo đảm tính đúng đắn. Nó chỉ dọn cho trạng
> thái lưu trữ khớp với thực tế đã hiển thị. Tắt hẳn cả bốn reconciler thì
> website công khai **vẫn đúng**; chỉ có cột `status` trong DB là lạc hậu.

### Luồng

```
Lệnh của Admin
   → ghi trạng thái + hai cột mốc            (lớp 1)
   → truy vấn công khai tự đánh giá điều kiện (lớp 2 — quyết định thứ người dùng thấy)
   → reconciler sau đó chuẩn hoá PENDING đã tới hạn thành PUBLISHED (lớp 3)
```

### Vì sao SQL của reconciler viết tường minh cho từng bảng

Bốn reconciler dùng SQL thô riêng, không gộp thành một hàm generic. Đây là **chủ
ý**: tên bảng và tên cột trạng thái là **định danh**, không tham số hoá được qua
bind parameter của SQL. Ba bảng dùng `content_status`, hai bảng dùng `status`; và
ở `projects` thì `status` lại là *tình trạng thi công*, ở `cooperation_projects`
thì `status` là *JSONB song ngữ*. Một lớp trừu tượng nhận tên cột dạng chuỗi sẽ
vứt bỏ đúng thứ đang bảo vệ ta — kiểu của Prisma bắt lỗi nhắm nhầm cột ngay lúc
biên dịch.

### UTC — vì sao SQL thô phải viết `AT TIME ZONE 'utc'`

Prisma khai cột mốc là `timestamp(3) **without** time zone`, chứa giờ UTC. Còn
`NOW()` của PostgreSQL trả `timestamptz`. So trực tiếp hai kiểu đó thì Postgres
quy đổi theo `TimeZone` **của phiên** — trên phiên đặt `Asia/Bangkok`, kết quả
lệch đúng 7 tiếng, tức bài đăng sớm/muộn 7 tiếng mà không có lỗi nào.

Vì vậy SQL của reconciler **bắt buộc** dùng:

```sql
scheduled_at <= (NOW() AT TIME ZONE 'utc')
updated_at   = (NOW() AT TIME ZONE 'utc')
```

`NOW()` trần **không** được chấp nhận trong SQL của reconciler. Hồi quy được
khoá bằng `test/scheduler-utc.e2e-spec.ts`.

> **Metadata cũ:** các giá trị `updated_at` ghi trong khoảng thời gian trước khi
> sửa lỗi này có thể lệch đúng bằng offset múi giờ. **Không** xác định được tất
> định hàng nào bị ảnh hưởng nên không sửa ngược. Đây là sai lệch **metadata**;
> nó **không** điều khiển hiển thị công khai (lớp 2 dùng `Date` của tiến trình
> Node đi qua bind parameter, luôn là instant tuyệt đối).

### Đồng hồ dùng ở lớp 2

Mốc so sánh là `Date` của tiến trình Node truyền vào từ lời gọi, **không** phải
`NOW()` của DB — `where` của Prisma chỉ nhận giá trị JS. Host và Postgres cùng
region, lệch dưới một giây, trong khi độ chính xác đăng bài tính bằng phút.

**Mỗi thao tác chỉ tạo `now` một lần** rồi truyền xuống mọi truy vấn con — đặc
biệt cặp `count` + `findMany` của phân trang. Gọi `new Date()` hai lần có thể làm
tổng số bài và nội dung trang bất đồng đúng tại giây đáo hạn.

## Banner — luồng riêng, KHÔNG có lớp 3

Banner **không** dùng mô hình trên và cố ý không có reconciler.

```
Admin sửa isActive / cửa sổ hiển thị
   → truy vấn công khai đánh giá: isActive AND [displayFrom, displayUntil)
   → (không có reconciler, không cron, không mutation tại mốc đáo hạn)
```

Banner **không có** `scheduledAt`/`publishedAt`, không có vòng đời
`DRAFT → PENDING → PUBLISHED`, không có "Xuất bản ngay". Thuật ngữ đúng là
**"Thời gian hiển thị"**. Chi tiết: [functional-requirements](../01-requirements/functional-requirements.md) mục YC-BN.

## Tài liệu kiến trúc chi tiết

Các file trong thư mục này ([backend-architecture](backend-architecture.md), [frontend-architecture](frontend-architecture.md), [database-design](database-design.md), [authentication-and-authorization](authentication-and-authorization.md)) hiện là **khung** — trỏ về nguồn sự thật (`AGENTS.md`, `schema.prisma`, code). Bổ sung dần khi cần.
