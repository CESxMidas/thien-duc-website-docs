# EN-FULL Group 2 Closure — Seven Audited Routes

> **Ngày:** 2026-07-18
> **Nhóm:** 08 — Audits & Reports
> **Trạng thái:** ĐÓNG cho **7 route audited** (KHÔNG phải toàn site — xem cảnh báo cuối)

## Phạm vi (7 route audited)

- `/en`
- `/en/gioi-thieu`
- `/en/lien-he`
- `/en/du-an`
- `/en/du-an/khu-do-thi-hung-phu`
- `/en/tin-tuc`
- `/en/tin-tuc/le-khoi-cong-fancy-tower-khu-do-thi-hung-phu`

## Phương pháp kiểm chứng

- **Build production mới** của frontend chạy trên **dữ liệu live đã backfill đầy đủ** (Render API), prerender các route tĩnh.
- **Quét chuỗi hiển thị** (đã lược bỏ payload RSC `self.__next_f`, class, ref) trên HTML prerender để bắt tiếng Việt còn *nhìn thấy*.
- **Đối chiếu route VI** cùng slug để chắc chắn tiếng Việt không đổi và bản EN không rò sang VI.
- **Xác nhận qua API/dữ liệu** cho 2 route danh sách SSR (`/en/du-an`, `/en/tin-tuc`) — thẻ card phân giải theo locale qua mapper, dữ liệu có đủ `.en` (title/summary/location/category/news category name).

## Kết quả

| Kiểm tra | Kết quả |
|---|---|
| Tiếng Việt hiển thị trên 7 route audited | **0 (không có)** |
| Route VI | Giữ nguyên (nhãn/quickFacts/heading tiếng Việt) |
| `[object Object]` | **Không có** |
| Nhãn overlay bản đồ | **27/27 song ngữ, hiển thị tiếng Anh trên `/en`** |
| Visual QA nhãn bản đồ EN | Chấp nhận được (chủ dự án xác nhận) |

## Tóm tắt công việc đã hoàn thành (loạt C)

- **C1/C2** — data-model + backfill song ngữ: project `location`/`category`, news `category.name`.
- **C3** — project `quickFacts` song ngữ (label + value) + backfill.
- **C4** — hiển thị byline tác giả tin theo locale ("Thiên Đức" → "Thien Duc" trên `/en`); không đổi schema.
- **C5a** — `mapLocation` prose (`heading`/`description`/`address`) song ngữ + backfill.
- **C5b** — 27 nhãn `mapLocation.labels[].text` song ngữ + backfill bằng script.

**Bất biến:** VI byte-identical; không `[object Object]` (mapper lùi về `vi`); dùng cột **JSONB** sẵn có → **không phát sinh Prisma migration** cho C3/C5a/C5b; nhãn C5b do **script/seed** quản lý (không có editor Admin).

## Vận hành dữ liệu (data-ops) — nhãn bản đồ C5b

- Script tồn tại: **`thien-duc-website-backend/prisma/backfill-map-labels.js`** (idempotent).
- **Chạy dry-run trước:** `npm run prisma:backfill:map-labels -- --dry-run` (chỉ đọc, in kế hoạch).
- **Áp thật lên production:** cần `SEED_CONFIRM_PRODUCTION=yes` (chốt an toàn) — vd. `SEED_CONFIRM_PRODUCTION=yes npm run prisma:backfill:map-labels`.
- Nhãn bản đồ **do script/seed quản lý — không có editor nhãn trong Admin**.
- **Môi trường mới** có thể cần chạy lại các backfill loạt C nếu dữ liệu seed chưa được đồng bộ (hiện `prisma/seed-projects.js` vẫn còn prose/nhãn tiếng Việt thuần; không sửa trong đợt này để tránh ghi đè bản backfill EN thủ công).
- Tham chiếu chính: [database-migrations.md](../../07-deployment/database-migrations.md#seed-dữ-liệu).

## Backlog ngoài phạm vi (chưa xử lý — theo dõi riêng)

a. **Route hạng mục `[hang-muc]`** — `/en/du-an/khu-do-thi-hung-phu/{fancy-tower, hung-phu-mall, khu-nha-o-thap-tang}` còn tiếng Việt cho item `description`/`highlights`/`quickFacts` (title/summary đã có EN; `quickFacts` đã *có khả năng* song ngữ nhờ C3 nhưng chưa nhập EN).
b. **Các trang `/en` ngoài 7 route audited vẫn còn tiếng Việt hiển thị:**
   - `/en/cong-ty-thanh-vien`
   - `/en/dao-tao`
   - `/en/so-do-to-chuc-cong-ty`
   - `/en/tuyen-dung`
   - `/en/chinh-sach-nhan-su`
c. **Token thương hiệu ở tiêu đề 404** — `notFoundTitle` chứa "Thiên Đức" (chỉ xuất hiện ở `<title>` trang 404; là tên thương hiệu).
d. **Tiếng Việt không hiển thị nhưng còn trong payload** — field item ngoài phạm vi (theo (a)) vẫn nằm trong payload RSC của carousel ở trang chi tiết dự án (không render).

## ⚠️ Cảnh báo

**KHÔNG diễn giải đây là "tiếng Anh toàn site đã hoàn tất".** Kết luận "0 tiếng Việt hiển thị" chỉ áp dụng cho **7 route audited** liệt kê ở trên. Backlog EN toàn site (mục a–d) được theo dõi tách biệt.

## Tham chiếu

- [implementation-plan.md — task →4](../../04-implementation/implementation-plan.md) (nhánh nội dung EN, loạt C).
- [database-migrations.md — Seed dữ liệu](../../07-deployment/database-migrations.md#seed-dữ-liệu) (script backfill).
