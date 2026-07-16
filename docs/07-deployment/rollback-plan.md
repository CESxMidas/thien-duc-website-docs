# Kế hoạch rollback — Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Nhóm:** 07 — Deployment
> **Cập nhật:** 2026-07-16
> **Tài liệu liên quan:** [deployment-guide.md](deployment-guide.md) · [backup-and-restore.md](backup-and-restore.md) · [database-migrations.md](database-migrations.md) · [audit-baseline](../08-audits-and-reports/current/2026-07-16-audit-baseline.md)

Quy trình rollback 3 lớp cho hạ tầng Render + Vercel (task →2). Nguyên tắc chung:
**rollback ứng dụng trước, rollback DB là phương án cuối** — khôi phục DB luôn
kèm rủi ro mất dữ liệu ghi sau thời điểm backup.

> Các bước bấm-ở-Dashboard dưới đây dựa trên giao diện Render/Vercel tại thời
> điểm viết — tên menu có thể thay đổi; **kiểm chứng lại một lần khi diễn tập**
> (xem checklist cuối file).

---

## 0. Tiêu chí quyết định rollback

| Tình huống | Hành động |
|---|---|
| Trang lỗi hiển thị / JS hỏng sau deploy FE | Rollback **Frontend** (lớp 1) |
| API trả 5xx hàng loạt / crash loop sau deploy BE | Rollback **Backend** (lớp 1) |
| Deploy BE kèm **migration** làm hỏng dữ liệu/schema | **Forward-fix** (lớp 2), cân nhắc lớp 3 |
| Dữ liệu bị xóa/ghi đè nhầm (thao tác người, bug ghi) | **Khôi phục DB** từ backup/PITR (lớp 3) |

Ai quyết: người vận hành trực (dev chính). Trước khi rollback, chụp lại triệu
chứng (log Render, screenshot, response lỗi) để truy vết sau.

---

## Lớp 1 — Rollback ứng dụng (không đụng DB)

### Frontend (Vercel)

1. Vercel → project `thien-duc-website-frontend` → **Deployments**.
2. Chọn bản deploy **tốt gần nhất** → menu **⋯ → Instant Rollback** (hoặc
   **Promote to Production**).
3. Kiểm tra: mở trang chủ + `/lien-he`, F12 Console không lỗi.

Đặc điểm: tức thời, không mất dữ liệu, đảo ngược được.

### Backend (Render)

1. Render → service `thien-duc-website-backend` → **Deploys** (tab Events/Deploys).
2. Tìm deploy tốt gần nhất → **Rollback to this deploy** (hoặc **Manual Deploy →
   Deploy a specific commit** và chọn commit cũ).
3. Cách khác qua Git: `git revert <commit hỏng>` rồi push `main` — `autoDeploy: true`
   sẽ tự deploy bản revert (chậm hơn vì build lại, nhưng giữ lịch sử Git sạch).
4. Kiểm tra: `…/api` trả "Hello World!", `…/api/docs` mở được, gửi thử form.

> ⚠️ **Bẫy migration khi rollback code:** `startCommand` chạy `prisma migrate deploy`
> mỗi lần deploy. Rollback **code** không rollback **schema** — nếu bản hỏng đã áp
> migration mới, code cũ chạy trên schema mới. Thường vẫn ổn (thêm bảng/cột mới
> không phá code cũ), nhưng nếu migration **đổi/xóa** cột thì code cũ có thể lỗi →
> phải xử lý theo lớp 2, không chỉ rollback code.

---

## Lớp 2 — Sự cố migration: chiến lược forward-fix

**Prisma không sinh script `down`** — không có "migrate xuống" tự động. Nguyên tắc:

1. **Không sửa tay schema production** ngoài luồng migration.
2. Migration hỏng nhẹ (logic sai, thiếu cột…) → viết **migration mới sửa tiếp**
   (forward-fix): `npx prisma migrate dev --name fix-<mô-tả>` ở local, test, rồi
   push để `migrate deploy` áp lên production.
3. Migration hỏng nặng (mất/hỏng dữ liệu) → dừng ghi (tạm scale service về 0 hoặc
   maintenance), rồi khôi phục DB theo lớp 3.
4. **Phòng ngừa:** trước mọi migration rủi ro (đổi kiểu cột, xóa cột, backfill),
   chạy `pg_dump` thủ công trước — xem [backup-and-restore.md](backup-and-restore.md) mục 3.

Chi tiết vận hành migration: [database-migrations.md](database-migrations.md).

---

## Lớp 3 — Khôi phục cơ sở dữ liệu (phương án cuối)

Toàn bộ runbook nằm ở [backup-and-restore.md](backup-and-restore.md):

- **PITR** (nếu plan có): Render Dashboard → database → Recovery → chọn mốc thời
  gian ngay **trước** sự cố → repoint `DATABASE_URL`.
- **Daily backup / dump thủ công**: `pg_restore` vào DB mới (Cách A) → xác minh →
  repoint `DATABASE_URL`.

> ⚠️ Mọi dữ liệu ghi **sau** mốc khôi phục sẽ mất (lead mới, bài viết mới). Trước
> khi restore, nếu DB còn đọc được, `pg_dump` bản hiện tại để cứu dữ liệu chênh
> lệch (diff tay bảng `contact_submissions` nếu cần).

---

## Điều kiện tiên quyết để kế hoạch này có hiệu lực

- [x] Quy trình rollback bằng văn bản (file này — task →2).
- [ ] **Postgres plan trả phí + backup đã bật** — không có backup thì lớp 3 vô nghĩa
      (xem [backup-and-restore.md](backup-and-restore.md) mục 6).
- [ ] **Diễn tập một lần trước go-live**: rollback FE + BE bản vô hại, restore thử
      DB (checklist ở [backup-and-restore.md](backup-and-restore.md) mục 5), xác
      nhận tên menu Dashboard còn đúng.
- [ ] Staging để thử migration trước production — **ngoài phạm vi task →2** (xem
      task →10, [ADR-0003](../10-decisions/ADR-0003-single-production-environment.md)
      hiện chốt một môi trường duy nhất).
- [ ] Monitoring/alert phát hiện sự cố sớm — **task →5**, chưa làm.

---

## Document history

- **2026-07-16** — Task →2: thay khung bằng quy trình rollback 3 lớp chính thức
  (app / migration forward-fix / DB restore), kèm tiêu chí quyết định và bẫy
  migration-khi-rollback-code. Giải quyết TODO "CẦN XÁC NHẬN" của bản khung.
- **2026-07-16** — Tạo mới khi tách `DEPLOY.md`. Khung chờ hoàn thiện.
