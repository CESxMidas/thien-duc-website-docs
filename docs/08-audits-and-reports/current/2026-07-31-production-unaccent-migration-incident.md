# Sự cố production — migration tìm kiếm bỏ dấu

> **Mã phiên:** THIEN-DUC-PRODUCTION-UNACCENT-MIGRATION-RECOVERY-M1
> **Ngày:** 2026-07-31
> **Trạng thái:** **RESOLVED — production recovery đã hoàn tất**
> **Migration:** `20260731120000_search_unaccent`

## Tóm tắt

Render production đã chạy migration `20260731120000_search_unaccent` và ghi nhận
**một lần áp dụng thất bại**. Vì vậy các deploy sau dừng với Prisma `P3009`.
Khẳng định trước đây rằng migration này "chưa deploy ở đâu" / production chưa
chạy migration là **không đúng** — đây là bài học chính của sự cố.

Recovery ban đầu **dừng ở cổng backup** (xem §1 chronology). Sau khi cổng backup
được thoả mãn bằng một bản backup production tạo tay và kiểm chứng được, recovery
đã tiến hành có kiểm soát và **hoàn tất thành công**: failed row được inspect,
migration hỏng được đánh dấu rolled-back, bản migration đã sửa được deploy, và
Prisma xác nhận *Database schema is up to date*.

**Không** dùng `prisma migrate reset`, **không** sửa tay `_prisma_migrations`,
**không** đánh dấu migration là applied.

## 0. Phân loại bằng chứng

Tài liệu này trộn hai hạng bằng chứng khác nhau. Đọc đúng hạng là bắt buộc:

| Hạng | Nội dung | Mức tin cậy |
|---|---|---|
| **Repo-verified** | Phần implementation: nội dung migration, schema qualification, `migrate deploy` 11/11 từ DB rỗng, CI PostgreSQL 17, test E2E search | Kiểm chứng lại được từ repository bất cứ lúc nào |
| **Session-attested** | Toàn bộ thao tác trên production ở §2 — backup, restore drill, inspection, resolve, deploy, migrate status | Xác nhận từ phiên vận hành, **chưa** lưu bằng chứng thô trong repo |

> Các bước recovery production dưới đây được xác nhận từ phiên vận hành ngày
> 2026-07-31; repository hiện chưa lưu raw transcript tương ứng.

Khoảng trống bằng chứng này **không** làm sự cố quay lại trạng thái blocked:
recovery vận hành đã hoàn tất thành công. Việc lưu trữ transcript là hành động
theo dõi **không chặn** (xem §5).

---

## 1. Chronology — trạng thái BLOCKED ban đầu (giữ nguyên làm lịch sử)

Phần này ghi lại đúng những gì **đã đúng tại thời điểm đó**. Không viết lại.

Phiên recovery dừng ở cổng backup. Không có quyền truy cập Render Dashboard
trong phiên, local `.env` chỉ trỏ tới `thien_duc_test`, và workspace không có
Render CLI/token, PostgreSQL client hay bản dump production. Bằng chứng cũ gần
nhất (G7-M1 ngày 2026-07-19) cho biết Postgres còn Free, backup/PITR chưa xác
nhận và restore drill chưa làm. Vì không thể chứng minh một backup production
hiện hành, usable và có phương thức restore, **không được phép thay đổi lịch sử
migration hoặc chạy lại deploy**.

Trạng thái các mục tại thời điểm BLOCKED:

| Mục | Kết quả lúc đó |
|---|---|
| Timestamp / trạng thái / retention backup | **CHƯA XÁC MINH** |
| Phương thức restore khả dụng | Runbook có sẵn; chưa chứng minh bằng backup production hiện hành |
| Failed migration row | Chưa truy vấn được production |
| Partial objects | **UNKNOWN** — không được suy ra từ migration file |
| Recovery path | **CHƯA CHỌN** |
| `migrate resolve` / `migrate deploy` | **không chạy** |

Kết luận cổng backup lúc đó: **FAIL / BLOCKED**. Quyết định dừng này là **đúng**
— nó chính là thứ buộc phải tạo backup thật trước khi chạm vào production.

### Bằng chứng preflight cục bộ (repo-verified)

- Backend branch `main`, commit `28abb816c2cda35924fe80a7d24520a865071c0c`
  (`fix(search): qualify unaccent functions in migration`); `origin/main` cùng commit.
- Migration hiện hành SHA-256:
  `cab17daa9062eba73f38ce746fd3619b4ca5d2a1cf5d0a0ebec0c8e1974cf398`.
- Repo có 11 migration.
- Local `.env`: database `thien_duc_test`, schema `public`, `sslmode=disable` —
  **không phải** production.

---

## 2. Recovery — đã thực hiện và hoàn tất (session-attested)

Thứ tự dưới đây là thứ tự đã chạy. Mỗi cổng phải qua trước khi sang bước sau.

### 2.1 Cổng backup — ĐÃ QUA

- Tạo được một bản **backup production thủ công**, usable.
- **Checksum của bản backup đã được kiểm chứng.**
- **Diễn tập restore thành công** trên PostgreSQL 18 cục bộ.
- Kiểm tra dữ liệu sau restore: **17 bảng public · 2 user · 18 bài tin**.

Chỉ sau khi cổng này qua, mọi thao tác mutation trên production mới được phép.

### 2.2 Inspection read-only — ĐÃ LÀM

- **Failed Prisma migration row** đã được inspect.
- **Partial database objects** đã được inspect.

Không suy đoán từ migration file; không cleanup mù.

### 2.3 Resolve có kiểm soát + deploy

```bash
npx prisma migrate resolve --rolled-back 20260731120000_search_unaccent
```

Sau đó deploy bản migration đã sửa — **thành công**.

### 2.4 Xác minh sau deploy

| Kiểm tra | Kết quả |
|---|---|
| `prisma migrate status` | **Database schema is up to date** |
| `_prisma_migrations` — lần thất bại gốc | `rolled_back_at` có giá trị, `applied_steps_count = 0` |
| `_prisma_migrations` — lần thay thế thành công | `finished_at` có giá trị, `applied_steps_count = 1` |
| Index GIN | `public.projects_search_idx` **tồn tại** |
| Index GIN | `public.news_posts_search_idx` **tồn tại** |
| Hàm search | dùng schema-qualified `public.immutable_unaccent(...)` |

Lịch sử migration production vì vậy **giữ nguyên dấu vết trung thực**: một lần
thất bại được ghi nhận là rolled back, một lần thành công kế tiếp. Không có row
nào bị xoá hay sửa tay.

### 2.5 Đối chứng repo-verified

- CI PostgreSQL 17 sạch áp **11/11 migration** thành công.
- Test backend E2E `search-unaccent` **pass**.

---

## 3. Phán quyết

**RESOLVED.**

Xác nhận trong toàn bộ quá trình:

- Không dùng `prisma migrate reset`.
- Không xóa table hoặc row production.
- Không sửa thủ công `_prisma_migrations`.
- Không đánh dấu migration là applied (dùng `--rolled-back`, không dùng `--applied`).
- Không in credential hoặc full `DATABASE_URL`; tài liệu này **không** chứa
  connection string, credential hay định danh production nhạy cảm.
- Backup được chứng minh usable **trước** mọi thao tác mutation.

## 4. Bài học

1. **Không bao giờ khẳng định "migration chưa deploy ở đâu" nếu chưa đọc trực
   tiếp `_prisma_migrations` của chính production.** Suy luận từ lịch sử commit
   là không đủ — đây chính là sai lầm đã dẫn tới sự cố này.
2. **Defect chỉ lộ trên CSDL sạch.** Máy dev có sẵn object cũ nên che mất lỗi
   `search_path`; CI dựng Postgres mới mỗi lần mới là thứ bắt được.
3. **Cổng backup có giá trị thật.** Việc dừng ở trạng thái BLOCKED không phải là
   chậm trễ — nó buộc phải có backup kiểm chứng được trước khi sửa lịch sử migration.
4. **`--rolled-back` chứ không phải `--applied`.** Chỉ dùng `--applied` khi đã
   chứng minh mọi effect tồn tại và khớp chính xác; ở đây effect thiếu.

## 5. Hành động theo dõi (không chặn)

- [ ] **Lưu trữ bản transcript recovery đã sanitize** (hoặc bản tóm tắt bằng
  chứng) vào repository để đóng khoảng trống ở §0. **Bắt buộc redact** mọi
  connection string, credential, host và định danh production.
- [ ] Theo dõi hiệu năng index GIN sau khi nâng plan Render (xem
  [implementation-plan §3](../../04-implementation/implementation-plan.md#section-3--manual-production--go-live-tasks)).

Runbook P3009 rút ra từ sự cố này:
[database-migrations §Recovery khi Prisma báo P3009](../../07-deployment/database-migrations.md).
