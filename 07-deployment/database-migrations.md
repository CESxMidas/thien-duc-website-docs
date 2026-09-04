# Migration cơ sở dữ liệu — Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Nhóm:** 07 — Deployment
> **Cập nhật:** 2026-07-16
> **Tài liệu liên quan:** [deployment-guide.md](deployment-guide.md) · [environment-configuration.md](environment-configuration.md)

Stack: **Prisma 7 + PostgreSQL 17**. Schema nguồn sự thật ở `thien-duc-website-backend/prisma/schema.prisma`.

## Trên production (Render)

- Khi web service start, Render tự chạy **`prisma migrate deploy`** (cấu hình trong `render.yaml`) — áp mọi migration còn thiếu vào DB. Schema hiện có **16 model**. Danh mục migration đầy đủ + lưu ý vận hành: [deployment-guide.md](deployment-guide.md#hành-vi-migration-khi-deploy).
- Migration mới: commit vào `prisma/migrations/` → Render tự `migrate deploy` ở lần deploy kế tiếp.

### Recovery khi Prisma báo P3009

Không deploy lặp lại. Không dùng `migrate reset`, không xóa dữ liệu và không sửa
tay `_prisma_migrations`.

1. Xác nhận đúng database production bằng tên database, schema, host suffix đã
   redacted và PostgreSQL version; đối chiếu Render deploy commit với commit
   đang vận hành.
2. Tạo hoặc xác minh backup production hiện hành. Bắt buộc có timestamp, trạng
   thái thành công, retention/nơi lưu và phương thức restore khả dụng. Thiếu
   một trong các bằng chứng này thì dừng `BLOCKED`.
3. Chạy inspection read-only: `prisma migrate status`, lấy đúng failed row, đọc
   object/function/index bằng catalog PostgreSQL, `pg_get_functiondef` và
   `pg_get_indexdef`.
4. Mặc định chọn **Path A** nếu effect thiếu hoặc không chính xác: cleanup chỉ
   các function/index thuộc migration bằng exact signature, sau đó:

   ```bash
   npx prisma migrate resolve --rolled-back 20260731120000_search_unaccent
   npx prisma migrate status
   npx prisma migrate deploy
   npx prisma migrate status
   ```

5. Chỉ dùng **Path B** (`--applied`) khi đã chứng minh mọi effect của migration
   tồn tại và khớp chính xác migration hiện hành.
6. Sau deploy, xác minh function volatility/parallel safety, index GIN valid,
   không có invalid index, search có dấu/bỏ dấu/uppercase, nội dung unpublished
   không lộ, backend bind port và health endpoint phản hồi.

Mọi SQL cleanup production phải được hiển thị trước và cần phê duyệt riêng.

Quy trình trên **đã được chạy thật và thành công** trong sự cố
`20260731120000_search_unaccent` (trạng thái **RESOLVED**). Hồ sơ đầy đủ — gồm
chronology lúc còn BLOCKED, cổng backup và các bước resolve/deploy — ở
[2026-07-31-production-unaccent-migration-incident](../08-audits-and-reports/current/2026-07-31-production-unaccent-migration-incident.md).
Dùng làm **tiền lệ tham chiếu**, không phải sự cố đang mở.

## Trên máy dev (local)

Local Postgres chạy Docker ở **port 5433** (`docker compose up -d`) — vì máy dev có Postgres Windows chiếm 5432.

- Đổi schema: `npx prisma migrate dev --name <tên>` rồi `npm run prisma:generate`.
- Xem dữ liệu: `npx prisma studio`.

## ⚠️ Cảnh báo áp migration lên production một cách có chủ ý

`.env` của máy dev có thể đang trỏ `DATABASE_URL` vào **Render (production)**. Vì vậy:

- Mọi lệnh `prisma migrate deploy` / `db execute` phải là **hành động có chủ ý**, xác nhận `DATABASE_URL` đang trỏ đúng đích trước khi chạy.
- **Đã xác minh tới 2026-07-31:** **11 migration đầu tiên** đã được áp lên production; `prisma migrate status` khi đó trả *Database schema is up to date*. Ghi chú cũ rằng `20260710120000_add_fulltext_search` "mới chỉ kiểm chứng trên DB local" **không còn đúng**.
- ⚠️ **Chưa xác minh (tính tới 2026-08-22):** 5 migration thêm vào **sau** mốc trên —
  `20260811120000_news_category_index`,
  `20260819120000_project_publication_schedule`,
  `20260819130000_cooperation_publication_schedule`,
  `20260819140000_page_publication_schedule`,
  `20260821120000_banner_display_window`.
  Chúng **đã có trong code** nhưng tài liệu này **không** khẳng định đã áp trên
  production. Phải xác minh bằng log deploy Render + `_prisma_migrations` (hoặc
  `prisma migrate status` trỏ đúng DB production) rồi mới cập nhật mục này.
- Điều đó **không** có nghĩa mọi lần áp đều trót lọt: `20260731120000_search_unaccent` đã **thất bại một lần trên production** và chỉ trở lại sạch sau recovery có kiểm soát (mục "Recovery khi Prisma báo P3009" ở trên). Bài học: migration production **luôn** cần backup kiểm chứng được → inspection read-only → resolve có kiểm soát → deploy → xác minh sau deploy.

## Seed dữ liệu

Các script seed idempotent (an toàn chạy lại), một số có chốt `SEED_CONFIRM_PRODUCTION=yes`:

- `npm run prisma:seed` — tạo tài khoản `SUPER_ADMIN` đầu tiên.
- `npm run prisma:seed:projects` — 4 dự án (Hưng Phú, La Bonita, Silver Sea Tower, Bảy Hiền Tower).
- `npm run prisma:seed:news` — 3 chuyên mục + 1 bài tin thật.

## Backfill nhãn bản đồ song ngữ (EN-FULL-C5b)

Chuyển `map_location.labels[].text` của dự án Hưng Phú từ chuỗi tiếng Việt sang `{ vi, en }` (giữ nguyên VI + toạ độ/kiểu). Cột `map_location` là **JSONB** nên **không cần Prisma migration**.

- Script: `thien-duc-website-backend/prisma/backfill-map-labels.js` — **idempotent** (chạy lại an toàn, bỏ qua nhãn đã có `en`).
- **Dry-run trước (chỉ đọc, không ghi):** `npm run prisma:backfill:map-labels -- --dry-run`.
- **Áp thật lên production:** cần chốt `SEED_CONFIRM_PRODUCTION=yes` — vd. `SEED_CONFIRM_PRODUCTION=yes npm run prisma:backfill:map-labels`.
- Nhãn bản đồ **do script/seed quản lý — không có editor nhãn trong Admin**.

> **Môi trường mới:** `prisma/seed-projects.js` hiện vẫn giữ prose/nhãn tiếng Việt thuần (không sửa để tránh ghi đè bản backfill EN thủ công ở loạt EN-FULL-C). Env mới có thể cần chạy lại các backfill loạt C — xem [closure note 2026-07-18](../08-audits-and-reports/current/2026-07-18-en-full-group2-closure.md).

## Backfill hạng mục dự án song ngữ (EN-PROJECT-ITEMS-P1)

Chuyển `description`, `highlights`, `quick_facts` của 3 hạng mục Hưng Phú (`fancy-tower`, `hung-phu-mall`, `khu-nha-o-thap-tang`) sang dạng có `.en` cho route `/en/[hang-muc]`. Các cột đều là **JSONB** nên **không cần Prisma migration**.

- Script: `thien-duc-website-backend/prisma/backfill-project-items.js` — **idempotent** (chạy lại an toàn, bỏ qua field đã có `en`).
- **Dry-run trước (chỉ đọc, không ghi):** `npm run prisma:backfill:project-items -- --dry-run`.
- **Áp thật lên production:** cần chốt `SEED_CONFIRM_PRODUCTION=yes` — vd. `SEED_CONFIRM_PRODUCTION=yes npm run prisma:backfill:project-items`.
- Script match exact `.vi`, không ghi đè `.vi`, không sửa seed dự án và không chạm frontend/Admin/schema.

> **Production 2026-07-18:** dry-run 0 unmapped; apply cập nhật 3 hạng mục / 14 field song ngữ; re-scan 3 route EN sạch tiếng Việt hiển thị. Xem [EN-PROJECT-ITEMS-P1 note](../08-audits-and-reports/current/2026-07-18-en-project-items-p1.md).

> Chi tiết trạng thái từng module và các lỗi migration đã xử lý: xem [implementation-plan.md](../04-implementation/implementation-plan.md).

---

## Document history

- **2026-07-31** — Sự cố `20260731120000_search_unaccent` **RESOLVED**: cập nhật
  trạng thái migration production (11/11 đã áp, *Database schema is up to date*),
  gỡ ghi chú cũ "full-text search chưa áp production", chuyển link sự cố thành
  tiền lệ tham chiếu thay vì sự cố đang mở.
- **2026-07-31** — Thêm runbook P3009 sau sự cố production của
  `20260731120000_search_unaccent`; bắt buộc backup + inspection trước resolve.
- **2026-07-18** — Thêm mục "Backfill hạng mục dự án song ngữ (EN-PROJECT-ITEMS-P1)" — script `backfill-project-items.js`, dry-run + chốt production.
- **2026-07-18** — Thêm mục "Backfill nhãn bản đồ song ngữ (EN-FULL-C5b)" — script `backfill-map-labels.js`, dry-run + chốt production.
- **2026-07-16** — Tách từ `DEPLOY.md` + gom các ghi chú migration/seed rải rác trong `KE-HOACH-CODING.md` khi tái cấu trúc tài liệu.
