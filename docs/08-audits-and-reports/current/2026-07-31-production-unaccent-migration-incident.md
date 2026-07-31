# Sự cố production — migration tìm kiếm bỏ dấu

> **Mã phiên:** THIEN-DUC-PRODUCTION-UNACCENT-MIGRATION-RECOVERY-M1  
> **Ngày:** 2026-07-31  
> **Trạng thái:** **BLOCKED — chưa thay đổi production**  
> **Migration:** `20260731120000_search_unaccent`

## Tóm tắt

Render production đã chạy migration `20260731120000_search_unaccent` và ghi
nhận một lần áp dụng thất bại. Vì vậy các deploy sau dừng với Prisma `P3009`.
Khẳng định trước đây rằng migration này “chưa deploy ở đâu” / production chưa
chạy migration là **không đúng**.

Phiên recovery dừng ở cổng backup. Không có quyền truy cập Render Dashboard
trong phiên, local `.env` chỉ trỏ tới `thien_duc_test`, và workspace không có
Render CLI/token, PostgreSQL client hay bản dump production. Bằng chứng cũ gần
nhất (G7-M1 ngày 2026-07-19) cho biết Postgres còn Free, backup/PITR chưa xác
nhận và restore drill chưa làm. Vì không thể chứng minh một backup production
hiện hành, usable và có phương thức restore, **không được phép thay đổi lịch sử
migration hoặc chạy lại deploy**.

## A. Bằng chứng backup

| Mục | Kết quả |
|---|---|
| Timestamp backup | **CHƯA XÁC MINH** |
| Trạng thái backup | **CHƯA XÁC MINH** |
| Retention / nơi lưu | **CHƯA XÁC MINH** |
| Phương thức restore khả dụng | Runbook có sẵn; **chưa chứng minh bằng backup production hiện hành** |

Kết luận cổng backup: **FAIL / BLOCKED**.

## B. Failed migration row

Chưa truy vấn được production. Không ghi giá trị suy đoán. Cần lấy nguyên hàng
qua câu SQL read-only đã chỉ định trong runbook trước khi chọn recovery path.

## C. Partial objects

Chưa kiểm tra được production. Tất cả object vẫn ở trạng thái
**UNKNOWN — không được suy ra từ migration file**:

- `public.unaccent`
- `public.immutable_unaccent(text)`
- `public.project_search_document(jsonb,jsonb,jsonb,jsonb,jsonb)`
- `public.news_search_document(jsonb,jsonb,jsonb,text)`
- `public.projects_search_idx`
- `public.news_posts_search_idx`

## D–H. Recovery

- Recovery path: **CHƯA CHỌN**; mặc định Path A sau khi có backup và inspection,
  trừ khi mọi effect được chứng minh đầy đủ, chính xác.
- Cleanup SQL: **không tạo/chạy trên production**.
- `prisma migrate resolve`: **không chạy**.
- `prisma migrate deploy`: **không chạy**.
- Final migration status: **chưa xác minh**.

## I–J. Search và application health

Chưa chạy smoke test production hoặc health verification sau migration vì
recovery chưa được phép bắt đầu.

## K. Bằng chứng preflight cục bộ

- Backend branch: `main`.
- Backend commit: `28abb816c2cda35924fe80a7d24520a865071c0c`
  (`fix(search): qualify unaccent functions in migration`).
- `origin/main` cùng commit tại thời điểm kiểm tra.
- Migration hiện hành có SHA-256:
  `cab17daa9062eba73f38ce746fd3619b4ca5d2a1cf5d0a0ebec0c8e1974cf398`.
- Repo có 11 migration.
- Local `.env`: database `thien_duc_test`, schema `public` mặc định,
  `sslmode=disable`; đây **không phải** production.
- Render deploy commit, database identity production, PostgreSQL version,
  failed row, migrate status và logs: **chưa xác minh do không có quyền truy
  cập Render/production trong phiên**.

## L. Rủi ro còn lại

- Failed migration record tiếp tục làm mọi deploy sau thất bại với `P3009`.
- Có thể tồn tại object dở dang; không được cleanup khi chưa inspect định nghĩa
  thực tế và dependency.
- Deploy lặp lại trước recovery chỉ tạo thêm downtime/log nhiễu.
- Không có bằng chứng backup usable nên mọi mutation production hiện bị chặn.

## M. Phán quyết

**BLOCKED**

Xác nhận trong phiên:

- Không dùng `prisma migrate reset`.
- Không xóa table hoặc row production.
- Không sửa thủ công `_prisma_migrations`.
- Không đánh dấu migration là applied.
- Không in credential hoặc full `DATABASE_URL`.
- **Chưa chứng minh backup tồn tại trước recovery, vì vậy recovery không được
  phép tiếp tục.**

