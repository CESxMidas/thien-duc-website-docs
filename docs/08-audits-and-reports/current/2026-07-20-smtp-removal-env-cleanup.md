# SMTP-REMOVAL-ENV-CLEANUP — Gỡ SMTP fallback + dọn ENV (Resend-only)

> **Ngày:** 2026-07-20
> **Nhóm:** 08 — Audits & Reports (chính: 08 Process/deliverables; phụ: 05 Security, 07 Deployment, 04 Implementation)
> **Trạng thái:** ✅ **XONG** — email production chỉ còn Resend; env đã dọn.
> **Supersedes:** phần "phương án dự phòng: SMTP giữ lại" trong [EMAIL-RESEND-CLOSEOUT](2026-07-20-email-resend-closeout.md) (ghi theo trạng thái tại thời điểm chốt, trước khi gỡ SMTP).
> **Liên quan:** [implementation-plan.md](../../04-implementation/implementation-plan.md) · [environment-configuration.md](../../07-deployment/environment-configuration.md).

## Bối cảnh

[EMAIL-RESEND-CLOSEOUT](2026-07-20-email-resend-closeout.md) chốt email liên hệ
production chạy thật bằng **Resend** và **tạm giữ SMTP làm phương án dự phòng**.
Sau khi Resend chạy ổn định, phương án dự phòng SMTP không còn cần thiết và tự
nó là bề mặt rủi ro (secret + code path không dùng) → tiến hành gỡ.

> ⚠️ Note này **chỉ ghi lại kết quả đã redact**, không chứa giá trị secret. Thao
> tác trên dashboard Render + thu hồi Gmail App Password là **việc vận hành thủ
> công của chủ dự án**, ngoài phạm vi sửa code của phiên tài liệu này.

## Việc đã làm

### 1. Gỡ SMTP fallback (email = Resend-only)

- SMTP fallback đã được **gỡ khỏi code backend**; email thông báo lead production
  nay **chỉ dùng Resend** (`MAIL_PROVIDER=resend`).
- Biến `SMTP_*` đã được **gỡ khỏi Render** (không còn cấu hình SMTP trên
  production).
- **Gmail App Password đã thu hồi** — credential SMTP cũ không còn hiệu lực.

### 2. ENV cleanup (Nhóm 8 — Process/deliverables)

- `backend/.gitignore` **siết lại** để bỏ qua `.env*`, **vẫn track `.env.example`**
  (mẫu cấu hình không secret).
- Đã **gỡ file `admin/.env` trùng** ở local (không cần thiết, tránh lệch cấu hình).
- Xác nhận **không có file `.env` / `.env.local` nào bị Git track**.

## Bất biến / phạm vi

- **Không đổi hành vi runtime** ngoài việc email đi qua Resend (đã là đường chính
  từ closeout trước).
- Secret rotation liên quan đang trong tiến trình — theo dõi tách riêng, không
  ghi giá trị vào Git.
- Các mục **cố ý giữ mở** (không thuộc phiên này): →6 Enforce CSP, →9 Auth
  HttpOnly cookie, →10 Staging + WAF, các manual ops Render/Vercel/Postgres/
  Sentry/UptimeRobot, backup restore / rollback drill, Lighthouse/k6 staging,
  checklist nghiệm thu go-live, backlog nội dung chờ công ty.

## Quy tắc redaction

Không ghi giá trị thật: `RESEND_API_KEY`, `MAIL_FROM`, `SMTP_PASSWORD`,
`CONTACT_NOTIFY_TO`, Gmail App Password, `DATABASE_URL`, JWT secret, Cloudinary
secret. Giá trị thật nhập trực tiếp ở Render Dashboard (`sync: false`), không lưu
trong Git.
