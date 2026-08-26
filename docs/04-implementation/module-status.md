# Trạng thái module

> **Trạng thái:** Đang dùng
> **Nhóm:** 04 — Implementation
> **Cập nhật:** 2026-08-22 (đồng bộ tài liệu Batch 13E)
> **Nguồn sự thật:** đọc trực tiếp từ code tại `thien-duc-website-backend@9032698`,
> `thien-duc-website-admin@234981c`, `thien-duc-website-frontend@ffb9179`.
> Kế hoạch theo sprint vẫn ở [implementation-plan](implementation-plan.md).

## Quy ước đọc bảng

Hai cột trạng thái tách bạch, **không được lẫn**:

- **Triển khai trong code** — đã có trong repo, có test bao phủ.
- **Xác minh trên production** — đã kiểm chứng trên hạ tầng thật (Render/Vercel/DB).

Một tính năng có thể "đã code xong" mà **chưa** được xác minh production. Tài liệu
này không suy ra cái thứ hai từ cái thứ nhất.

## Bảng trạng thái module

| Module | Triển khai trong code | Hẹn giờ lần đầu | Xác minh production |
|---|---|---|---|
| `auth` | ✅ JWT access + refresh, RolesGuard | — | ✅ đăng nhập Admin đã chạy thật |
| `users` | ✅ CRUD, lời mời tài khoản, đổi hồ sơ có duyệt | — | ⚠️ chưa xác minh lại sau các batch gần đây |
| `news` | ✅ CRUD + duyệt + hẹn giờ | ✅ có | ⚠️ chưa xác minh |
| `projects` | ✅ CRUD + hạng mục + thư viện ảnh + duyệt + hẹn giờ | ✅ có | ⚠️ chưa xác minh |
| `cooperation` | ✅ CRUD + duyệt + hẹn giờ | ✅ có | ⚠️ chưa xác minh |
| `pages` | ✅ CRUD + duyệt + hẹn giờ | ✅ có | ⚠️ chưa xác minh |
| `banners` | ✅ CRUD + **cửa sổ hiển thị** | ❌ **không áp dụng** | ⚠️ chưa xác minh |
| `contact` | ✅ nhận lead + gửi mail (Resend) | — | ✅ đã chạy thật |
| `media` | ✅ upload Cloudinary | — | ✅ đã chạy thật |
| `search` | ✅ full-text + unaccent, lọc theo vị từ công khai | — | ⚠️ chưa xác minh |

> ⚠️ **Xác minh production của bốn migration hẹn giờ + cửa sổ banner phải kiểm
> qua log deploy Render và bảng `_prisma_migrations`.** Tài liệu này KHÔNG khẳng
> định chúng đã được áp trên DB production — xem
> [database-migrations](../07-deployment/database-migrations.md).

## Mô hình xuất bản dùng chung (News · Project · Cooperation · Page)

### Không có enum `SCHEDULED`

Trạng thái lưu trữ vẫn đúng ba giá trị của `ContentStatus`: `DRAFT`, `PENDING`,
`PUBLISHED`. "Đã lên lịch" **không** phải một trạng thái được lưu — nó là tổ hợp
`PENDING` + `scheduledAt`. Chọn như vậy để **fail safe**: mọi truy vấn cũ chỉ lọc
`PUBLISHED` mà lỡ bỏ sót đều tự động giấu nội dung đang chờ đi. Rủi ro của việc
quên là "hiện muộn", không phải "rò rỉ sớm".

### Hai cột mốc thời gian

| Cột | Ý nghĩa |
|---|---|
| `publishedAt` | Mốc công khai **LẦN ĐẦU**. Không bị ghi đè bởi lần đăng lại, cũng không bị thay bằng giờ cron tình cờ chạy. |
| `scheduledAt` | Lịch hẹn đăng đang chờ. Bất biến của lệnh đặt lịch: `scheduledAt != null ⇒ publishedAt = scheduledAt`. |

Tên cột trạng thái **khác nhau giữa các bảng** — đây là nguồn nhầm lẫn thật sự:

| Bảng | Cột bậc thang duyệt | Ghi chú |
|---|---|---|
| `news_posts` | `status` | |
| `pages` | `status` | |
| `projects` | `contentStatus` | `Project.status` là **tình trạng thi công**, không liên quan xuất bản |
| `cooperation_projects` | `contentStatus` | `CooperationProject.status` là **JSONB song ngữ** mô tả bằng chữ |

### Hẹn giờ là hẹn LẦN CÔNG KHAI ĐẦU TIÊN

Cả bốn module chỉ hỗ trợ hẹn giờ cho lần đăng **đầu tiên**. Nội dung đã từng công
khai thì **không** hẹn giờ lại được (trả 409), kể cả sau khi gỡ về nháp. Lý do:
ghi lịch mới sẽ ghi đè `publishedAt`, mà mốc đó luôn có nghĩa "lần công khai đầu
tiên" — ghi đè là âm thầm định nghĩa lại field thành "lần đăng gần nhất".

**Không có** lịch đăng lại (republish scheduling), **không có** lịch theo phiên
bản (version scheduling). Đăng lại theo lịch là nghiệp vụ khác, kéo theo hàng
loạt câu hỏi (thứ tự trang, `lastModified` của sitemap, mốc nào dùng xếp hạng)
mà schema hiện không trả lời được.

## Dọn trùng lặp helper hẹn giờ — ghi chú Batch 13D · 13I · 13K

`projects.service.ts` trước đây giữ bản sao cục bộ của bảy đơn vị luật hẹn
giờ/xuất bản. Batch 13D (2026-08-22) đã xoá bản sao đó; Dự án nay dùng thẳng
`src/common/publication-schedule.ts` như ba module còn lại:

`ScheduleState` · `clearedSchedule` · `editorMayEditScheduled` ·
`hasHistoricalPublication` · `isActiveFutureSchedule` · `publishedAtFor`

Thuần dọn dẹp, **không đổi hành vi** — 75 suite / 1254 test giữ nguyên kết quả.

**Batch 13I** (2026-08-25, commit `4bb665a`) làm nốt phần còn lại cho
`news.service.ts`: bản sao cục bộ (`clearedSchedule`, `hasBeenPublic`,
`isActiveFutureSchedule`, `hasHistoricalPublication`, `publishedAtFor` +
`type SchedulableState`) đã bị xoá. **Cả bốn module nội dung — Bài viết, Dự án,
Trang, Dự án hợp tác — nay dùng chung một nguồn sự thật duy nhất** là
`src/common/publication-schedule.ts`. Bài viết chỉ giữ lại một hàm chuyển kiểu
mỏng (`toScheduleState`) vì cột bậc thang duyệt của nó tên `status` chứ không
phải `contentStatus` — đó là phép đổi tên trường, không phải luật nghiệp vụ.

**Batch 13K** (commit `de871d2`) xoá `editorMayEditUnpublished` khỏi
`src/common/content-editing.ts` sau khi xác nhận không còn caller nào; backend
không còn tham chiếu nào tới nó. `assertContentEditAllowed` là chốt quyền sửa
nội dung duy nhất còn lại.

## Banner — KHÔNG phải hẹn giờ xuất bản

Banner cố ý **không** dùng lại mô hình trên. Thuật ngữ đúng là **"Thời gian hiển
thị"**, không phải "Lên lịch xuất bản".

| Banner **KHÔNG** có | |
|---|---|
| `scheduledAt` / `publishedAt` | vòng đời `DRAFT → PENDING → PUBLISHED` |
| reconciler / cron | nút "Xuất bản ngay" |

Chi tiết luật cửa sổ hiển thị: xem
[functional-requirements](../01-requirements/functional-requirements.md) mục YC-BN.

## Giám sát & SEO

| Hạng mục | Trạng thái |
|---|---|
| Sentry (backend) | ✅ có trong code; DSN nhập tay ở Render — thiếu DSN = tắt, app vẫn chạy |
| UptimeRobot / cảnh báo | ⚠️ chưa dựng — xem [monitoring-and-alerting](../07-deployment/monitoring-and-alerting.md) |
| Structured data / Rich Results | ✅ đã đo trên production — xem [g4-measurement-baseline](../06-testing/g4-measurement-baseline.md) |
| `sitemap.xml` | ✅ dùng `publishedAt` làm `lastModified`; bản ghi thiếu mốc thì bỏ trống field đó |

## Tài liệu liên quan

- Yêu cầu chức năng: [functional-requirements](../01-requirements/functional-requirements.md)
- Kiến trúc ba lớp xuất bản: [system-architecture](../02-architecture/system-architecture.md)
- Ma trận case: [test-cases](../06-testing/test-cases.md)
