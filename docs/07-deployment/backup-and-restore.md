# Sao lưu và khôi phục — Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Nhóm:** 07 — Deployment
> **Cập nhật:** 2026-07-16
> **Tài liệu liên quan:** [deployment-guide.md](deployment-guide.md) · [rollback-plan.md](rollback-plan.md) · [environment-configuration.md](environment-configuration.md) · [audit-baseline](../08-audits-and-reports/current/2026-07-16-audit-baseline.md) mục 7

Tài liệu này đóng khoảng trống "chưa có backup DB tự động" nêu trong Audit
Baseline (task →2). Chiến lược: **backup được quản lý bởi Render** làm lớp chính,
kèm **runbook `pg_dump`/`pg_restore` thủ công** cho tình huống khẩn cấp / xuất dữ
liệu ra ngoài Render.

> Backup off-site tự động (script + lịch chạy + kho lưu trữ ngoài) **cố ý chưa
> làm ở task này** — sẽ tách thành task riêng sau khi chốt nơi lưu, retention,
> secret và chi phí.

---

## 0. Phân định trách nhiệm (repo vs. dashboard)

| Việc | Ở đâu | Được đảm bảo bởi |
|---|---|---|
| Khai báo plan Postgres trả phí | `backend/render.yaml` (`plan: basic-256mb`) | Repo (chỉ **khai báo ý định**) |
| Bật/áp plan trả phí + thanh toán | Render Dashboard | **Thủ công** — `render.yaml` không tự thanh toán |
| Backup tự động hằng ngày + PITR | Render Dashboard (Postgres trả phí) | **Thủ công xác nhận** — xem mục 1 |
| Kiểm thử khôi phục | Thủ công theo runbook mục 3–5 | Con người |
| `pg_dump`/`pg_restore` khẩn cấp | Máy vận hành (dùng External URL) | Con người |

> ⚠️ **`render.yaml` một mình KHÔNG đảm bảo** có backup: nó chỉ khai plan. Backup
> daily/PITR có bật không, retention bao nhiêu ngày là **thuộc tính của plan
> Postgres trả phí** và phải **kiểm tra tận nơi ở Render Dashboard**.

---

## 1. Backup được quản lý bởi Render (lớp chính)

Sau khi Postgres đã nâng lên plan trả phí (xem [deployment-guide.md](deployment-guide.md)
mục "Nâng lên plan production"):

1. Render Dashboard → database `thien-duc-db` → tab **Backups** (hoặc **Recovery**).
2. **Xác nhận tại thời điểm nâng plan** (không hardcode ở đây — Render thay đổi theo thời gian):
   - Backup hằng ngày có tự chạy không?
   - **Retention** (số ngày giữ backup) là bao nhiêu?
   - Có **Point-in-Time Recovery (PITR)** không, cửa sổ PITR bao lâu?
3. Ghi kết quả xác nhận (ngày, plan, retention, PITR) vào *Nhật ký xác nhận* cuối file.

> Nếu plan rẻ nhất **không** có PITR mà chỉ có daily backup, đó vẫn là mức tối
> thiểu chấp nhận được cho go-live; cần RPO chặt hơn thì nâng plan cao hơn.

---

## 2. Điều kiện tiên quyết cho runbook thủ công

- Cài PostgreSQL client trùng **major version** với server (Postgres 17) — `pg_dump`
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

> ⚠️ Khôi phục là thao tác **phá hủy** trên DB đích. Luôn `pg_dump` DB đích
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

**Khôi phục bằng PITR (nếu plan có):** không dùng `pg_restore` — thao tác ở
Render Dashboard → database → **Recovery** → chọn mốc thời gian; Render tạo
instance khôi phục riêng. Sau đó repoint `DATABASE_URL` như Cách A.

---

## 5. Kiểm thử khôi phục (bắt buộc trước go-live)

Backup chưa test = chưa có backup. Ít nhất một lần trước production:

- [ ] Tạo `pg_dump` từ DB thật (mục 3).
- [ ] `pg_restore` vào một DB mới trống (Cách A).
- [ ] Trỏ backend tạm vào DB khôi phục, mở `…/api/docs`, kiểm tra vài bản ghi
      (`contact_submissions`, `projects`) đọc đúng.
- [ ] Ghi thời gian khôi phục thực tế (RTO) vào nhật ký dưới.

---

## 6. Việc phải làm thủ công ở Render Dashboard (repo không tự động hóa được)

- [ ] Nâng Postgres lên plan trả phí + gắn thanh toán.
- [ ] Xác nhận backup daily + retention + PITR (mục 1).
- [ ] (Khi cần khôi phục) chạy runbook mục 3–4 hoặc PITR ở Dashboard.
- [ ] Nếu free→paid không nâng tại chỗ được → theo "Đường di trú" dưới.

### Đường di trú free → paid Postgres (nếu Render không cho nâng tại chỗ)

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

> Làm việc này **trước mốc 90 ngày** hết hạn của Postgres free để không mất dữ liệu.

---

## Nhật ký xác nhận (điền khi nâng plan)

> 🟠 **G7-M1 (2026-07-19):** kiểm mức cao xác nhận Postgres **còn Free** — backup
> daily / retention / PITR **chưa xác nhận**, restore test **chưa làm**. Bảng dưới
> **cố ý để trống** cho tới khi có plan trả phí thật. Xem
> [G7-M1 verification note](../08-audits-and-reports/current/2026-07-19-g7-m1-manual-ops-verification.md).

| Ngày | Plan Postgres | Backup daily? | Retention | PITR? | RTO test | Người xác nhận |
|---|---|---|---|---|---|---|
| _(chưa điền)_ | | | | | | |

---

## Document history

- **2026-07-19** — G7-M1 (docs-only): ghi chú trạng thái trên "Nhật ký xác nhận" —
  Postgres còn Free, backup/PITR chưa xác nhận, restore test chưa làm; bảng để
  trống tới khi có plan trả phí. Liên kết audit note G7-M1.
- **2026-07-16** — Task →2: thay khung bằng runbook backup/restore đầy đủ (Render
  managed backup + `pg_dump`/`pg_restore` thủ công + đường di trú free→paid).
  Nguồn khoảng trống: Audit Baseline mục 7. Backup off-site tự động tách task sau
  (quyết định của chủ dự án 2026-07-16).
