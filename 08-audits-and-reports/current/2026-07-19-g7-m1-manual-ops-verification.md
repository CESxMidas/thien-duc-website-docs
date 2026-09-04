# G7-M1 — Kiểm chứng vận hành production thủ công (owner-run)

> **Ngày:** 2026-07-19
> **Nhóm:** 08 — Audits & Reports (chính: 07 Deployment; phụ: 05 Reliability, 08 Process)
> **Trạng thái:** 🟠 **BLOCKED / DEFERRED** — runbook đã chuẩn bị, kiểm ở mức cao; **CHƯA sẵn sàng go-live**.
> **Liên quan:** [deployment-guide.md](../../07-deployment/deployment-guide.md) · [backup-and-restore.md](../../07-deployment/backup-and-restore.md) · [rollback-plan.md](../../07-deployment/rollback-plan.md) · [monitoring-and-alerting.md](../../07-deployment/monitoring-and-alerting.md) · [implementation-plan.md](../../04-implementation/implementation-plan.md).

## Phạm vi

G7-M1 là **task vận hành thủ công của chủ dự án** (owner-run dashboard verification), **không phải task code**. Claude/Codex **không** truy cập dashboard, database production, secret hay credential; chỉ chuẩn bị runbook + template pass/fail và ghi lại kết quả (đã redact) do chủ dự án cung cấp.

Runbook đầy đủ (9 hạng mục M1-1…M1-9 + template + quy tắc redaction + stop conditions) đã được chuẩn bị và bàn giao cho chủ dự án chạy.

## Kết quả kiểm (mức cao, 2026-07-19)

| Hạng mục | Trạng thái | Ghi chú (đã redact) |
|---|---|---|
| M1-1 Backend plan/billing | ❌ FAIL | Render web service **còn Free** — cảnh báo spin-down khi không hoạt động; billing chưa gắn/không rõ. |
| M1-2 Postgres plan/backup | ❌ FAIL | Postgres **còn Free**; backup daily / retention / PITR **chưa xác nhận**. |
| M1-3 Restore test | ⚠️ CHƯA làm | Phụ thuộc Postgres trả phí + backup (chưa có). |
| M1-4 Rollback drill | ⚠️ CHƯA làm | Menu **Rollback** tồn tại ở Render Deploys; drill FE/BE chưa thực hiện. |
| M1-5 Sentry (3 project) | ⚠️ CHƯA làm | Chưa tạo/verify 3 project; chưa có test event / alert rule. |
| M1-6 UptimeRobot | ⚠️ CHƯA làm | Chưa cấu hình monitor BE-health / FE-home; chưa có kênh alert / recovery test. |
| M1-7 Env verification | ⚠️ PENDING | FE/BE/Admin env chưa xác nhận hiện diện (không ghi giá trị). |
| M1-8 Admin actual host | ⚠️ MANUAL-REQUIRED | Host thật của Admin CMS chưa xác nhận (README ghi *"Vercel static — dự kiến"*). |
| M1-9 Full-text search | ⚠️ CHƯA test | `GET /api/search?q=…` chưa kiểm chức năng trên production. |

## Điều kiện dừng đã kích hoạt (stop conditions)

- 🔴 **Postgres Free vẫn hoạt động** (nguy cơ hết hạn 90 ngày → mất dữ liệu).
- 🔴 **Backend Free** — vẫn ngủ sau 15 phút (cold start ~30–50s làm form liên hệ timeout ở FE 10s; cron đăng bài kém tin cậy).
- 🔴 **Backup/PITR chưa xác nhận** → lớp khôi phục DB (rollback Lớp 3) chưa có nền.

## Phân tích phụ thuộc

Phần lớn hạng mục PENDING **bị chặn bởi cùng một gốc**: chưa nâng hạ tầng Render lên trả phí (kích hoạt thủ công của task →2). Restore test (M1-3) và backup/PITR (M1-2) **không thể** xác nhận trên Free. Sentry/UptimeRobot/env/Admin host/search độc lập với plan nhưng ưu tiên thấp hơn việc gỡ chặn nền tảng.

**Đường tới go-live (đề xuất, chưa thực hiện):**

1. **G7-M1a — Nâng Render lên trả phí + di trú Postgres free→paid** (thao tác dashboard + dữ liệu; theo [backup-and-restore.md §6](../../07-deployment/backup-and-restore.md), làm **trước mốc 90 ngày**).
2. Re-run **M1-2 → M1-3** (xác nhận backup/PITR + restore test) trên DB trả phí.
3. Song song/sau: **M1-5/M1-6/M1-7/M1-8/M1-9** (monitoring, env, Admin host, search).

## Quyết định của chủ dự án

Trạng thái **BLOCKED / DEFERRED được chấp nhận ở thời điểm hiện tại** vì chủ dự án **chưa nâng hạ tầng trước go-live**. Đây là hoãn có chủ đích, **không phải** kết luận "sẵn sàng". Hạ tầng trả phí + monitoring vẫn là **việc bắt buộc trước go-live cuối cùng**.

## Không làm trong đợt này

Không sửa backend/frontend/admin/code/config/env/seed. Không truy cập production/database/secret. Không điền "Nhật ký xác nhận" trong backup-and-restore.md (bảng đó chỉ điền khi có giá trị plan trả phí thật). Không ghi URL thật, token, DSN, DATABASE_URL, API key, SMTP credential hay chi tiết thanh toán.
