# Sao lưu và khôi phục — Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Nhóm:** 07 — Deployment
> **Cập nhật:** 2026-10-19
> **Tài liệu liên quan:** [deployment-guide.md](deployment-guide.md) · [rollback-plan.md](rollback-plan.md) · [environment-configuration.md](environment-configuration.md) · [audit-baseline](../08-audits-and-reports/current/2026-07-16-audit-baseline.md) mục 7

Chiến lược hiện hành: **Render managed recovery/PITR** làm lớp chính, kèm
**logical export** và runbook `pg_dump`/`pg_restore` cho tình huống khẩn cấp hoặc
xuất dữ liệu ra ngoài Render.

> Backup off-site tự động (script + lịch chạy + kho lưu trữ ngoài) **cố ý chưa
> làm ở task này** — sẽ tách thành task riêng sau khi chốt nơi lưu, retention,
> secret và chi phí.

---

## 0. Phân định trách nhiệm (repo vs. dashboard)

| Việc | Ở đâu | Được đảm bảo bởi |
|---|---|---|
| Khai báo hạ tầng | `backend/render.yaml` | Repo; không thay thế trạng thái dashboard |
| Plan PostgreSQL production | Render Dashboard | Đã xác minh plan trả phí `0.1c-256mb`, 6 USD/tháng, 1 GB, PostgreSQL 18 |
| Managed recovery/PITR | Render Dashboard → Recovery | Đã xác minh active, recovery window 3 ngày |
| Kiểm thử khôi phục | Thủ công theo runbook mục 3–5 | Owner chấp nhận hoãn sau bàn giao |
| `pg_dump`/`pg_restore` khẩn cấp | Máy vận hành (dùng External URL) | Con người |

>  **`render.yaml` một mình KHÔNG đảm bảo** có backup: nó chỉ khai plan. Backup
> daily/PITR có bật không, retention bao nhiêu ngày là **thuộc tính của plan
> Postgres trả phí** và phải **kiểm tra tận nơi ở Render Dashboard**.

---

## 1. Backup được quản lý bởi Render (lớp chính)

Dashboard production đã xác minh:

- Database `thien-duc-db`, PostgreSQL 18, region Singapore.
- Managed Point-in-Time Recovery đang active.
- Có thể chọn mốc phục hồi bất kỳ trong 3 ngày gần nhất.
- Restore tạo từ backup/recovery point do Render quản lý.
- Manual logical export khả dụng; tệp export được giữ ít nhất 7 ngày.

Render không hiển thị một lịch sử scheduled backup riêng trong evidence đã cung
cấp. Với plan hiện hành, PITR là cơ chế managed backup/recovery được xác minh.

---

## 2. Điều kiện tiên quyết cho runbook thủ công

- Cài PostgreSQL client trùng **major version** với server (PostgreSQL 18) — `pg_dump`
  bản cũ hơn server sẽ từ chối chạy.
- Dùng **External Database URL** của Render (đuôi `.singapore-postgres.render.com`),
  **KHÔNG** dùng Internal URL (chỉ chạy trong mạng Render → lỗi `P1001`).
- **Bắt buộc `?sslmode=require`** trong URL — xem cảnh báo SSL ở
  [environment-configuration.md](environment-configuration.md). Dạng URL:
  `postgresql://USER:PASSWORD@HOST.singapore-postgres.render.com/thien_duc?sslmode=require`
- Không commit URL/secret vào Git; chỉ đặt tạm qua biến môi trường shell.

---

## 3. Backup thủ công (`pg_dump`) — xuất dữ liệu / trước thay đổi lớn

Dùng khi cần bản chụp cầm tay: trước migration rủi ro, trước khi nâng/đổi plan,
hoặc để mang dữ liệu ra ngoài Render.

```bash
# Đặt URL vào biến môi trường (tránh lộ vào lịch sử shell).
export DATABASE_URL="postgresql://USER:PASSWORD@HOST.singapore-postgres.render.com/thien_duc?sslmode=require"

# Định dạng custom (-Fc) — nén, khôi phục chọn lọc được. Khuyến nghị cho restore.
pg_dump "$DATABASE_URL" -Fc -f thien-duc-$(date +%Y%m%d-%H%M).dump

# (Tùy chọn) bản SQL thuần để đọc/diff bằng mắt:
pg_dump "$DATABASE_URL" --format=plain --no-owner --no-privileges \
  -f thien-duc-$(date +%Y%m%d-%H%M).sql
```

Lưu file `.dump` ra nơi an toàn ngoài máy dev (khuyến nghị mã hóa). **Không** để trong repo.

---

## 4. Khôi phục (`pg_restore`) — quy trình khẩn cấp

>  Khôi phục là thao tác **phá hủy** trên DB đích. Luôn `pg_dump` DB đích
> **trước** khi restore đè, và ưu tiên restore vào DB trống/mới rồi mới repoint.

**Cách A — khôi phục vào database mới (an toàn hơn, khuyến nghị):**

```bash
export TARGET_URL="postgresql://USER:PASSWORD@HOST.singapore-postgres.render.com/thien_duc_restore?sslmode=require"

pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname "$TARGET_URL" thien-duc-YYYYMMDD-HHMM.dump
```

Kiểm tra dữ liệu ở DB mới OK → cập nhật `DATABASE_URL` của web service trỏ sang
DB mới (Render Dashboard → service → Environment) → service tự redeploy.

**Cách B — khôi phục đè lên DB hiện tại (chỉ khi bắt buộc):**

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST.singapore-postgres.render.com/thien_duc?sslmode=require"

# Chụp DB hiện tại trước — phòng khi restore hỏng giữa chừng.
pg_dump "$DATABASE_URL" -Fc -f pre-restore-$(date +%Y%m%d-%H%M).dump

pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname "$DATABASE_URL" thien-duc-YYYYMMDD-HHMM.dump
```

**Khôi phục bằng PITR (đã active):** không dùng `pg_restore` — thao tác ở
Render Dashboard → database → **Recovery** → chọn mốc thời gian; Render tạo
instance khôi phục riêng. Sau đó repoint `DATABASE_URL` như Cách A.

---

## 5. Kiểm thử khôi phục

Restore drill chưa hoàn thành. Owner đã chấp nhận hoãn sang giai đoạn vận hành
sau bàn giao. Waiver chỉ áp dụng cho drill; managed PITR vẫn phải duy trì active.
Khi thực hiện:

- [ ] Tạo `pg_dump` từ DB thật (mục 3).
- [ ] `pg_restore` vào một DB mới trống (Cách A).
- [ ] Trỏ backend tạm vào DB khôi phục, kiểm tra vài bản ghi
      (`contact_submissions`, `projects`) đọc đúng qua route công khai
      (`…/api/projects`) hoặc `psql`/Prisma Studio.
      *Chỉ khi backend tạm chạy ở chế độ dev (`NODE_ENV=development`)* mới mở được
      `…/api/docs` — Swagger tắt ở production, xem
      [deployment-guide → Swagger chỉ có ngoài production](deployment-guide.md#swagger-chỉ-có-ngoài-production).
- [ ] Ghi thời gian khôi phục thực tế (RTO) vào nhật ký dưới.

---

## 6. Việc phải làm thủ công ở Render Dashboard (repo không tự động hóa được)

- [x] Xác nhận plan PostgreSQL production và managed PITR (mục 1).
- [x] Xác nhận recovery window 3 ngày và logical export retention tối thiểu 7 ngày.
- [ ] (Khi cần khôi phục) chạy runbook mục 3–4 hoặc PITR ở Dashboard.
- [ ] Thực hiện restore drill sau bàn giao và ghi RPO/RTO.

### Đường di trú free → paid Postgres (nếu Render không cho nâng tại chỗ)

> **Đã hoàn tất về mặt trạng thái production:** PostgreSQL hiện dùng plan trả phí
> `0.1c-256mb`. Phần dưới được giữ làm runbook lịch sử nếu cần di trú một database
> Free khác; không còn là hành động đang chờ của production hiện tại.

Render có thể **không** cho nâng trực tiếp database *free* thành *paid* (free là
tier riêng — có thể phải tạo instance mới). Khi đó:

1. Tạo **database Postgres trả phí mới** ở Render (cùng region `singapore`).
2. `pg_dump` từ DB free hiện tại (mục 3) → `pg_restore` sang DB mới (Cách A).
3. Cập nhật `DATABASE_URL` của web service trỏ sang DB mới (giữ `sslmode=require`
   cho kết nối ngoài).
4. Xác minh app chạy: mở `…/api`, gửi thử form `/lien-he`, soi bảng `contact_submissions`.
5. Chỉ **xóa DB free cũ sau khi** DB mới đã xác minh ổn và có backup.
6. Nếu blueprint (`render.yaml`) vẫn quản lý database, đối chiếu tên/kết nối cho
   khớp — tránh Render tạo lại DB free khi sync blueprint.

> Khi dùng lại runbook này, xác nhận chính sách hiện hành trong Render Dashboard.

---

## Nhật ký xác nhận

| Ngày | Plan Postgres | Cơ chế managed recovery | Retention | PITR | Restore drill | Người xác nhận |
|---|---|---|---|---|---|---|
| 2026-10-19 | `0.1c-256mb`, 1 GB | Render managed recovery | 3 ngày; export ít nhất 7 ngày | Active | Waiver accepted; thực hiện sau bàn giao | Owner |

---

## Document history

- **2026-10-19** — Xác minh plan production, PostgreSQL 18, managed PITR 3 ngày
  và logical export; ghi nhận waiver restore drill sau bàn giao.
- **2026-07-19** — G7-M1 (docs-only): ghi chú trạng thái trên "Nhật ký xác nhận" —
  Postgres còn Free, backup/PITR chưa xác nhận, restore test chưa làm; bảng để
  trống tới khi có plan trả phí. Liên kết audit note G7-M1.
- **2026-07-16** — Task →2: thay khung bằng runbook backup/restore đầy đủ (Render
  managed backup + `pg_dump`/`pg_restore` thủ công + đường di trú free→paid).
  Nguồn khoảng trống: Audit Baseline mục 7. Backup off-site tự động tách task sau
  (quyết định của chủ dự án 2026-07-16).

## 7. Script backup off-site trong repo (THIEN-DUC-OPTIONAL-BACKLOG-REPO-WORK-M1)

> **Trạng thái (cập nhật 2026-08-02): REPO AUTOMATION COMPLETE · EXTERNAL
> STORAGE NOT CONFIGURED · PRODUCTION RESTORE DRILL NOT VERIFIED.** Phần làm
> được trong repo đã xong và có test; **chưa** trỏ tới kho lưu trữ nào và
> **chưa** diễn tập khôi phục trên dữ liệu production. Đây là lớp **bổ sung**
> cho backup do Render quản lý ở §1, không thay thế.

Vị trí: `thien-duc-website-backend/scripts/backup/`

| File | Vai trò |
|---|---|
| `backup.sh` | `pg_dump -Fc -Z6` + tên có timestamp + `.sha256` + mã hóa gpg tùy chọn + adapter upload |
| `verify-restore.sh` | Khôi phục vào DB **dùng-một-lần** (tên **duy nhất mỗi lần chạy**) rồi đếm bảng/hàng |
| `prune.sh` | Dọn theo tuổi, luôn giữ N bản mới nhất, mặc định **chỉ liệt kê** |
| `lib.sh` | Cầu chì đích + mã thoát + adapter upload trung lập + tiện ích chung |
| `backup.env.example` | Mẫu biến — **chỉ tên, không giá trị** |
| `scheduler-examples.md` | Mẫu cron / GitHub Actions / Windows / scheduler ngoài — **chưa kích hoạt** |
| `scheduler-windows.ps1` | Wrapper Task Scheduler: nạp env, ghi log, **xoay vòng log**, lan truyền mã thoát |
| `tests/run-tests.sh` | **20 test an toàn, KHÔNG cần PostgreSQL** (`npm run test:backup`) |

### Yêu cầu môi trường

| Công cụ | Dùng cho | Bắt buộc? |
|---|---|---|
| `bash` (POSIX) | mọi script; trên Windows dùng **Git Bash** | có |
| `pg_dump` | tạo backup | có, khi backup thật |
| `pg_restore`, `psql`, `createdb`, `dropdb` | kiểm chứng khôi phục | có, khi verify |
| `sha256sum` **hoặc** `shasum` | checksum | có |
| `gpg` | mã hóa (tùy chọn) | chỉ khi đặt `BACKUP_ENCRYPT_KEY` |

Client `pg_dump` phải **bằng hoặc mới hơn** server. Bộ **test an toàn** thì
**không** cần công cụ PostgreSQL nào — cố ý, để cầu chì kiểm chứng được ở mọi máy.

### Upload off-site — trung lập nhà cung cấp

Dự án **chưa chọn** nhà cung cấp, nên đường khuyến nghị là một mẫu lệnh do người
vận hành khai, không ràng vào AWS/B2/GCS/R2:

| Biến | Nghĩa |
|---|---|
| `BACKUP_UPLOAD_COMMAND` | mẫu lệnh; `{file}` = file cục bộ, `{remote}` = đích đầy đủ |
| `BACKUP_REMOTE_PREFIX` | tiền tố đích; **bắt buộc** nếu có `BACKUP_UPLOAD_COMMAND` |
| `BACKUP_UPLOAD_DRY_RUN=1` | chỉ **in** lệnh sẽ chạy — diễn tập an toàn, không gửi gì đi |

Không đặt `BACKUP_UPLOAD_COMMAND` → giữ cục bộ, thoát 0. Lệnh upload hỏng →
**lan truyền** lỗi, `backup.sh` thoát mã **7**. Adapter cũ `BACKUP_DEST=s3|b2|gcs`
vẫn dùng được cho cấu hình đã có.

### Dùng nhanh

```bash
cd thien-duc-website-backend
cp scripts/backup/backup.env.example scripts/backup/backup.env   # rồi điền
set -a && . ./scripts/backup/backup.env && set +a

./scripts/backup/backup.sh --dry-run          # xem sẽ làm gì, không ghi gì
./scripts/backup/backup.sh                    # tạo bản backup + checksum
./scripts/backup/verify-restore.sh --file backups/<tên>.dump
./scripts/backup/prune.sh                     # liệt kê; thêm --apply mới xóa
```

### Kiểm soát an toàn (đã chạy thật, không phải mô tả suông)

| Tình huống | Kết quả |
|---|---|
| Backup `thien_duc_test` | 195.324 byte + `.sha256`, exit 0 |
| `verify-restore.sh` | checksum khớp → 17 bảng, users 2, projects 4, exit 0, DB thử tự xoá |
| Thiếu `DATABASE_URL` | exit **2** |
| Đích không phải localhost | exit **3** |
| Đích tên DB production | exit **3** |
| Đích `*.render.com` | exit **3** |
| Checksum bị sửa | exit **6** |
| Mật khẩu trong log | **0 lần** |

Script **không bao giờ** in `DATABASE_URL` đầy đủ, **không bao giờ** ghi đè
production (chỉ nhận đích `localhost` + tên DB kết thúc `_test`/`_verify`/
`_restore`), và dọn file tạm kể cả khi lỗi.

### Còn phải làm thủ công

1. Chọn nhà cung cấp kho lưu trữ (S3 / B2 / GCS / kho riêng) — **chưa chọn**.
2. Cấp credential cho CLI tương ứng trên máy chạy backup.
3. Đặt `BACKUP_ENCRYPT_KEY` — bản dump chứa dữ liệu cá nhân (email/điện thoại
   người liên hệ), **không được** rời máy khi chưa mã hóa.
4. Bật một lịch chạy trong `scheduler-examples.md`.
5. **Diễn tập khôi phục từ backup production thật** — owner đã chấp nhận hoãn;
   thực hiện sau bàn giao và ghi RPO/RTO vào nhật ký (§5).
6. Máy chạy backup phải có `pg_dump` cùng major hoặc mới hơn server production.
   Xác minh phiên bản server trên Render trước khi cài; repo chỉ chứng minh local
   Docker 18 và CI 17; production đã được dashboard xác minh là PostgreSQL 18.
