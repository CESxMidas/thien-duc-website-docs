# EN-PROJECT-ITEMS-P1 — Backfill tiếng Anh cho ba route hạng mục Hưng Phú

> **Ngày:** 2026-07-18
> **Nhóm:** 08 — Audits & Reports
> **Trạng thái:** ĐÓNG cho **3 route hạng mục** liệt kê dưới đây
> **Tiếp nối:** [EN-FULL Group 2 closure](2026-07-18-en-full-group2-closure.md) + [EN-SITE-WIDE follow-up](2026-07-18-en-site-wide-follow-up.md).

## Phạm vi

Backlog **EN-PROJECT-ITEMS-P1** xử lý ba route `[hang-muc]` của dự án Hưng Phú:

- `/en/du-an/khu-do-thi-hung-phu/fancy-tower`
- `/en/du-an/khu-do-thi-hung-phu/hung-phu-mall`
- `/en/du-an/khu-do-thi-hung-phu/khu-nha-o-thap-tang`

Mục tiêu: loại bỏ tiếng Việt hiển thị trong `description`, `highlights`, `quickFacts` của ba route EN bằng backfill dữ liệu backend, không sửa frontend/Admin/schema và không sửa seed dự án.

## Cách làm

- Thêm script idempotent `thien-duc-website-backend/prisma/backfill-project-items.js`.
- Thêm npm script `prisma:backfill:project-items`.
- Script chỉ nhắm đúng 3 hạng mục thuộc project `khu-do-thi-hung-phu`.
- Match bản dịch theo exact `.vi`; không đoán, không chuẩn hóa dữ liệu.
- Không ghi đè `.en` đã có; không sửa `.vi`; không đụng field khác.
- Dùng cột JSONB hiện có (`description`, `highlights`, `quick_facts`) nên **không phát sinh Prisma migration**.
- Guard production: dry-run trước; apply production cần `SEED_CONFIRM_PRODUCTION=yes`.

## Production apply

- Dry-run production: **0 unmapped** cho cả 3 hạng mục.
- Apply production: cập nhật **3 hạng mục / 14 field song ngữ**.
- Lỗi apply lần đầu (`invalid input syntax for type json`) đã được sửa bằng cách serialize JSON khi bind tham số vào JSONB; commit fix đã push trước khi chạy lại.

## Re-scan production

Kiểm chứng bằng browser trên production Vercel, lấy `document.body.innerText` (text hiển thị, không tính payload hydrate):

| Route | Kết quả |
|---|---|
| `/en/du-an/khu-do-thi-hung-phu/fancy-tower` | 0 match tiếng Việt mục tiêu; 0 ký tự dấu tiếng Việt trong text hiển thị |
| `/en/du-an/khu-do-thi-hung-phu/hung-phu-mall` | 0 match tiếng Việt mục tiêu; 0 ký tự dấu tiếng Việt trong text hiển thị |
| `/en/du-an/khu-do-thi-hung-phu/khu-nha-o-thap-tang` | 0 match tiếng Việt mục tiêu; 0 ký tự dấu tiếng Việt trong text hiển thị |

Tín hiệu EN xác nhận:

- Fancy Tower: `19 above-ground floors + 1 basement`, `196 apartments`, `Handed over and currently in operation`.
- Hung Phu Mall: `5 floors`.
- Low-rise residential area: `330 units`.

## Kết luận

**EN-PROJECT-ITEMS-P1 đã đóng** cho ba route hạng mục Hưng Phú. Backlog `[hang-muc]` được nêu ở closure 7-route và follow-up site-wide không còn là mục mở.

## Tham chiếu

- [implementation-plan.md — task →4](../../04-implementation/implementation-plan.md).
- [database-migrations.md — Backfill hạng mục dự án song ngữ](../../07-deployment/database-migrations.md).
