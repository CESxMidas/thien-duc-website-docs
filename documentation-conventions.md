# Quy ước tài liệu

> **Chủ sở hữu chuẩn:** `thien-duc-website-docs` (repo này)
> **Trạng thái:** Đang dùng · **Chủ sở hữu:** Kỹ thuật
> **Rà soát gần nhất:** 2026-09-04

Repo tài liệu Fancy Tower có thể tham khảo quy ước này, nhưng **không** phụ thuộc file
này ở mức kỹ thuật — mỗi repo tự chứa đủ những gì nó cần.

## Quy tắc phân định repository

Trước khi tạo tài liệu mới, xác định **repository** sở hữu:

| Repository | Phạm vi |
|---|---|
| **`thien-duc-website-docs`** (repo này) | Website doanh nghiệp đang chạy: frontend công khai, Admin CMS, backend hiện có, kiến trúc production, các module nội dung (dự án / tin tức / trang / banner), bảo mật, triển khai, giám sát, sao lưu, xác thực, lịch sử triển khai |
| **`thien-duc-website-fancy-tower-docs`** | Sản phẩm MỚI — website giới thiệu & bán căn hộ: miền dữ liệu bất động sản, rổ hàng, toà nhà, loại căn hộ, giá, tình trạng bán, vai trò Kinh doanh, khách quan tâm bán hàng, CMS và frontend của sản phẩm bán căn hộ |

> ⚠️ **Bẫy thường gặp:** website Thiên Đức hiện tại có một dự án tên *Fancy Tower*
> (chung cư thuộc Khu đô thị Hưng Phú). Tài liệu về **nội dung dự án đó trên website
> công ty** vẫn thuộc repo này. Chỉ tài liệu về **sản phẩm bán căn hộ mới** mới thuộc
> repository kia.

## Quy ước đặt tên

- Thư mục & file Markdown: **chữ thường, kebab-case, tiếng Anh, không dấu, không khoảng trắng**.
  Ví dụ: `system-architecture.md`, `implementation-plan.md`, `deployment-guide.md`.
- Báo cáo có ngày: `YYYY-MM-DD-ten-bao-cao.md` (VD `2026-07-16-audit-baseline.md`).
- ADR: `ADR-XXXX-tieu-de.md`.
- Báo cáo Word trình lãnh đạo được giữ tên mô tả tiếng Việt đã thiết lập.
- **Cấm** các tên như `final.docx`, `final2.docx`, `latest.docx`, `copy.docx`, `ban-moi (1).docx`.
- Nội dung *bên trong* file viết tiếng Việt.

## Metadata đầu tài liệu

Tài liệu quan trọng nên có header:

```markdown
> **Trạng thái:** Đang dùng / Khung / Lưu trữ
> **Chủ sở hữu:** Kỹ thuật / Kinh doanh / Pháp chế
> **Rà soát gần nhất:** YYYY-MM-DD
```

Không sửa hàng loạt mọi file chỉ để thêm header — thêm khi có lý do chạm vào file.

## Quy trình cập nhật

1. Cập nhật đúng **nguồn chuẩn** của loại thông tin đó — không nhân bản nội dung.
2. Báo cáo có ngày → đặt vào `08-audits-and-reports/current/`;
   khi bị thay thế → chuyển sang `archive/` kèm header `Status: Archived` + `Superseded by`.
3. Tài liệu lỗi thời nhưng còn giá trị lịch sử → `archive/` (**không xoá**).
4. Quyết định kiến trúc mới → thêm ADR vào `10-decisions/`.
5. Khi di chuyển hoặc đổi tên → cập nhật **mọi** tham chiếu, kể cả `AGENTS.md` và
   README của 3 project ứng dụng nằm ngoài repo này.
6. Mâu thuẫn chưa giải quyết → đánh dấu `> TODO: ... cần người phụ trách xác nhận`,
   không tự chọn phe.

## Quy tắc lưu trữ và xoá

**Chỉ xoá** khi đủ **toàn bộ** các điều kiện:

1. Không còn là nguồn sự thật;
2. Đã bị thay thế hoàn toàn;
3. Không chứa quyết định hay bằng chứng độc nhất;
4. Không có giá trị pháp lý hoặc giá trị audit;
5. Không còn tài liệu hiện hành nào tham chiếu tới;
6. Lịch sử Git đã lưu giữ nó;
7. Việc xoá làm kho tài liệu rõ ràng hơn.

Không đủ các điều kiện trên → **LƯU TRỮ**, không xoá.

**Không** xoá một báo cáo chỉ vì nó cũ, vì có báo cáo khác nội dung tương tự,
vì tên có chữ "audit", hoặc vì nó thuộc một giai đoạn đã qua.

## Bảo mật

Secret, token, mật khẩu, chuỗi kết nối cơ sở dữ liệu **không bao giờ** được đưa vào
repo tài liệu — kể cả trong ảnh chụp màn hình và tệp Word.
