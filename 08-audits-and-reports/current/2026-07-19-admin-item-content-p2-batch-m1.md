# ADMIN-ITEM-CONTENT-P2 Batch M1 — Kiểm chứng runtime nội dung hạng mục + fix Select

> **Ngày:** 2026-07-19
> **Nhóm:** 08 — Audits & Reports
> **Trạng thái:** HOÀN TẤT (kiểm chứng runtime thủ công A–F đều PASS)
> **Liên quan:** [EN-PROJECT-ITEMS-P1](2026-07-18-en-project-items-p1.md) · [implementation-plan.md](../../04-implementation/implementation-plan.md).

## Phạm vi

Kiểm chứng **runtime thủ công** cho luồng nội dung hạng mục dự án trong Admin CMS
(`ProjectItemsTab`) và fix component Select dùng chung (`src/components/ui/select.tsx`).
Toàn bộ thao tác ghi được giới hạn trong **một dự án tạm ở trạng thái DRAFT** (slug
bắt đầu `zz-p2-manual-test-…`), tạo và xóa qua đúng Admin UI, không đụng dữ liệu thật.

Không sửa backend/frontend/admin/schema/migration/package/config trong đợt này. Không
truy cập trực tiếp database production; mọi thao tác đi qua Admin UI + API HTTP thông thường.

## Fix đã kiểm chứng

`src/components/ui/select.tsx` — sửa các tên class Tailwind không hợp lệ (nên trước đó
lớp CSS không sinh ra, dropdown bị hẹp/lệch):

- `min-w-8rem` → `min-w-[8rem]`
- `min-w-var(--radix-select-trigger-width)` → `min-w-[var(--radix-select-trigger-width)]`
- `h-var(--radix-select-trigger-height)` → `h-[var(--radix-select-trigger-height)]`

Trạng thái Git Admin: fix đã **commit + push** lên `origin/main` là `8a9de74 deploy`;
working tree sạch, đồng bộ với remote. Diff của commit trùng khớp từng ký tự với fix
dự kiến ở trên. Đợt tài liệu này **không tạo commit mới** cho Admin.

## Kết quả kiểm chứng thủ công (A–F)

| Nhóm | Nội dung | Kết quả |
|---|---|---|
| A | Tạo hạng mục song ngữ (VI/EN title, summary, description, ≥3 highlights, ≥3 quickFacts) → lưu → hard-reload → mở lại; giá trị VI/EN và thứ tự dòng còn nguyên; không có `[object Object]` | PASS |
| B | Sắp xếp lại (lên/xuống) highlights & quickFacts, xóa dòng giữa; lưu, reload; đúng dòng bị xóa, thứ tự còn lại đúng, không lẫn nội dung giữa các dòng | PASS |
| C | Chỉ sửa title → PATCH **bỏ qua** `description`, `highlights`, `quickFacts`; ba field này còn nguyên sau reload | PASS |
| D | Xóa trắng có chủ đích: `description` xóa và giữ trống; `highlights` gửi `[]` và giữ rỗng; `quickFacts` gửi `[]` và giữ rỗng; không lỗi validation, nội dung cũ không quay lại | PASS |
| E | Select dùng chung (kiểm 2 Select): độ rộng dropdown đúng (không hẹp hơn trigger), không bị cắt, điều hướng bàn phím, focus/blur, viewport hẹp đều OK; không có lỗi console liên quan Select | PASS |
| F | Dự án DRAFT không hiển thị công khai (danh sách + route chi tiết); dọn dẹp hoàn tất | PASS |

### Ghi chú hành vi payload (mô tả, không kèm payload thật)

- Cơ chế "dirty-field": `description` / `highlights` / `quickFacts` chỉ được đưa vào PATCH
  khi đúng vùng đó bị chỉnh trong phiên form hiện tại. Sửa mỗi title → payload không mang
  ba field này, nhờ đó không ghi đè nhầm dữ liệu đang có.
- Xóa trắng gửi đúng dạng rỗng: `description` về chuỗi VI rỗng, `highlights`/`quickFacts`
  về mảng rỗng `[]`; các trường này lưu và giữ rỗng sau reload.

## Chứa DRAFT + dọn dẹp

- Dự án tạm giữ trạng thái **DRAFT** suốt quá trình test.
- Không xuất hiện ở danh sách dự án công khai; route chi tiết công khai không render.
- Xóa hạng mục + xóa toàn bộ dự án tạm qua Admin UI; kiểm lại: vắng mặt ở danh sách Admin
  và vắng mặt ở site công khai.
- Không dùng SQL/kết nối DB trực tiếp để dọn dẹp.

## An toàn dữ liệu

Không xử lý bí mật nào: không đụng `DATABASE_URL`, URL API, token, header, cookie, DSN
hay credential; không in payload đầy đủ (chỉ mô tả hành vi). Không truy cập trực tiếp
database production; mọi ghi đều qua Admin UI trên dự án DRAFT tạm rồi xóa.

## Rủi ro còn lại

- Kiểm chứng chạy trên **một** dự án/hạng mục DRAFT tạm; chưa quét diện rộng nhiều hạng mục.
- Luồng **nhiều hạng mục / media / ảnh** nằm ngoài Batch M1 (trừ phần đã kiểm ở nơi khác).
- Không dùng truy cập trực tiếp database production trong đợt này.

## Kết luận

**ADMIN-ITEM-CONTENT-P2 Batch M1 hoàn tất.** Round-trip nội dung hạng mục, cơ chế bỏ qua
field không đổi trong PATCH, xóa trắng có chủ đích, và hành vi runtime của Select dùng
chung đều được kiểm chứng thủ công (A–F PASS). Fix Select đã có mặt trên `origin/main`
(`8a9de74`).

## Tham chiếu

- [implementation-plan.md — bug ProjectItemsTab song ngữ](../../04-implementation/implementation-plan.md).
- [EN-PROJECT-ITEMS-P1](2026-07-18-en-project-items-p1.md).
