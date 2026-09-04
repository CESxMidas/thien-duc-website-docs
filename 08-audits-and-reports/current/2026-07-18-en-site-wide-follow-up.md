# EN-SITE-WIDE Follow-up — Năm route `/en` ngoài phạm vi closure 7-route

> **Ngày:** 2026-07-18
> **Nhóm:** 08 — Audits & Reports
> **Trạng thái:** ĐÓNG cho **5 route liệt kê dưới** (KHÔNG phải toàn site — xem cảnh báo cuối)
> **Tiếp nối:** [EN-FULL Group 2 closure (7 route)](2026-07-18-en-full-group2-closure.md) — **không** thuộc và **không** mở lại phạm vi đó.

## Phạm vi (5 route — ngoài 7 route đã đóng)

Batch **EN-SITE-WIDE**, chia 3 lô nhỏ frontend-only:

| Lô | Route |
|---|---|
| **F1** | `/en/cong-ty-thanh-vien` |
| **F2** | `/en/tuyen-dung` |
| **F3** | `/en/dao-tao` |
| **F3** | `/en/so-do-to-chuc-cong-ty` |
| **F3** | `/en/chinh-sach-nhan-su` |

## Phương pháp kiểm chứng

- **Source audit** trước: 5 trang **không rẽ nhánh theo `locale`** ở phần thân — chuỗi thân là literal hardcode hoặc data tĩnh không song ngữ; chỉ `metadata` (title/description) đã song ngữ sẵn.
- **Render/curl** từng route trên `next dev`: quét token có dấu tiếng Việt trong `<body>` (đã loại `<script>` RSC payload) + đối chiếu chuỗi VI gốc render **nguyên văn**.
- 5 trang **không fetch backend** → render được và kiểm chứng được kể cả khi backend LAN tắt.

## Cách làm (frontend-only)

- Đưa copy hiển thị vào **dictionary song ngữ** `frontend/src/lib/i18n/dictionaries/{vi,en}.json` (đúng pattern `get-dictionary.ts` + các section `about`/`contact` sẵn có); page đọc theo locale.
- **F1** thêm section `memberCompanies`; `data/member-companies.ts` cho `role`/`note` thành `{vi,en}` (helper `localizeBilingual`, lùi an toàn về `vi`); intro người đại diện nội suy `legalDisplayName[locale]` (nhất quán với footer trên các route `/en` đã đóng; `legalDisplayName.vi === legalInfo.legalName` nên VI không đổi).
- **F2** thêm section `careers`; `data/careers.ts` rút gọn còn model `OpenPosition` + `openPositions` (rỗng). Chuỗi process có email nội suy `{email}`.
- **F3** thêm section `hrPages` dùng chung 3 trang; breadcrumb "Home" tái dùng `breadcrumb.home` sẵn có.
- **Không** đổi backend / Admin / CMS / Prisma schema / migration. **Không** biến 3 trang placeholder thành trang CMS; `noIndex` giữ nguyên.

## Kết quả

| Kiểm tra | Kết quả |
|---|---|
| Tiếng Việt hiển thị (body/UI) trên 5 route | **0** — trừ ngoại lệ danh từ riêng/pháp lý ở F1 (xem dưới) |
| `[object Object]` | **Không có** |
| Route VI tương ứng | Giữ nguyên — **byte-identical** (đối chiếu từng chuỗi gốc khi render) |
| Không sửa key dictionary cũ (chỉ thêm mới) | 7-route đã đóng + F1/F2 không bị ảnh hưởng (đã render lại xác nhận) |

**Ngoại lệ cố ý giữ tiếng Việt — `/en/cong-ty-thanh-vien`:** tên pháp nhân đăng ký (`Công ty TNHH …`, `legalInfo.legalName`) và tên người đại diện (`Trần Hữu Nghị`) — danh từ riêng/pháp lý, không phiên âm/dịch (nhất quán quy ước đã chốt ở closure 7-route: tên pháp lý/định danh giữ nguyên).

## Validation

- `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npm test` ✅ (46/46) — chạy lại sạch ở **mỗi** lô F1/F2/F3.
- `npm run build` **không chạy trọn cục bộ**: compile + bước TypeScript trong build **pass**, nhưng bước thu thập dữ liệu fail ở route **không liên quan** `du-an/[hang-muc]` do **backend LAN không truy cập được** (`ECONNREFUSED 192.168.50.14:3001`). Đây là hạn chế môi trường (`.env.local` trỏ backend LAN đang tắt), **không phải** lỗi từ thay đổi của batch (5 trang không fetch backend).

## Backlog còn lại (theo dõi riêng — KHÔNG suy ra toàn site đã xong)

a. ~~**Route hạng mục `[hang-muc]`** — `/en/du-an/khu-do-thi-hung-phu/{fancy-tower, hung-phu-mall, khu-nha-o-thap-tang}` còn tiếng Việt cho item `description`/`highlights`/`quickFacts` (đã nêu trong closure 7-route, backlog (a)).~~ **✅ ĐÃ GIẢI QUYẾT (2026-07-18)** qua EN-PROJECT-ITEMS-P1: backend backfill production 3 hạng mục / 14 field; re-scan 3 route EN sạch text hiển thị. Xem [EN-PROJECT-ITEMS-P1 note](2026-07-18-en-project-items-p1.md).
b. **Nội dung `OpenPosition` tương lai** — nếu thêm vị trí tuyển dụng thật, các field nội dung (`title`/`department`/`responsibilities`…) hiện là `string` đơn ngữ; muốn hiện tiếng Anh cần mô hình dữ liệu song ngữ (quyết định data-model/nhập liệu, chưa cần khi `openPositions` rỗng). Nhãn khung đã locale-ready.
c. **Khẳng định "tiếng Anh toàn site"** vẫn cần **full crawl / `next build` với backend sống** để xác nhận toàn bộ route (gồm các trang fetch CMS) — chưa thực hiện.
d. **Việc hạ tầng thủ công** còn treo (không thuộc batch này) — xem implementation-plan (vd. seed/backfill production loạt C, monitoring DSN…).

## ⚠️ Cảnh báo

**KHÔNG diễn giải đây là "tiếng Anh toàn site đã hoàn tất".** Kết luận "0 tiếng Việt hiển thị" chỉ áp dụng cho **5 route liệt kê ở trên**, cộng với 7 route trong closure trước. Backlog theo dõi tách biệt; mục (a) đã đóng sau đó qua EN-PROJECT-ITEMS-P1.

## Tham chiếu

- [EN-FULL Group 2 closure — 7 route](2026-07-18-en-full-group2-closure.md).
- [EN-PROJECT-ITEMS-P1 — 3 route hạng mục Hưng Phú](2026-07-18-en-project-items-p1.md).
- [implementation-plan.md — bullet EN-SITE-WIDE (F1–F3)](../../04-implementation/implementation-plan.md).
