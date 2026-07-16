# Dự án — trạng thái công việc

> **Status: Archived**
> **Reason:** Ghi chú trạng thái ngắn ngày 2026-07-09, nội dung đã được gộp và mở rộng trong kế hoạch triển khai theo sprint. Giữ lại làm dấu vết lịch sử.
> **Superseded by:** [docs/04-implementation/implementation-plan.md](../../docs/04-implementation/implementation-plan.md) (mục Sprint 1).
> **Nguồn (di chuyển từ):** `Du an/du an.md`

Đã xong (2026-07-09):

- Admin CMS trang Dự án đã bỏ mock data, nối API `/projects/admin` thật.
- Modal chi tiết có 3 tab **Thông tin / Hình ảnh / Hạng mục** — xử lý ảnh (thêm theo URL, gắn vào hạng mục, đổi thứ tự, xóa) và hạng mục con (thêm/sửa/xóa) đều nằm ở đây.
- `ProjectStatus` trong `admin/src/types/index.ts` đã sửa cho khớp enum backend: chỉ còn `DA_BAN_GIAO`, `DANG_THI_CONG`, `CHUAN_BI_KHOI_CONG` (bỏ `SAP_MO_BAN`, `DANG_MO_BAN` khai báo sai).
- Frontend công khai: thêm route `du-an/[slug]/[hang-muc]`, nối API thay import trực tiếp `src/data/projects.ts`.

Mô hình dữ liệu: có **4 dự án**. Fancy Tower là **hạng mục con** (`project_items`) của Khu đô thị Hưng Phú, không phải dự án độc lập.

Xem [implementation-plan](../../docs/04-implementation/implementation-plan.md) mục Sprint 1 để biết chi tiết. *(Bản gốc trỏ `KE-HOACH-CODING.md`.)*
