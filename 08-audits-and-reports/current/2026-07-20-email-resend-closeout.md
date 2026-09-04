# EMAIL-RESEND-CLOSEOUT — Email thông báo lead chạy thật trên production (Resend)

> **Ngày:** 2026-07-20
> **Nhóm:** 08 — Audits & Reports (chính: 07 Deployment; phụ: 04 Implementation)
> **Trạng thái:** ✅ **XONG** — kiểm thử production PASS, đóng hạng mục cấu hình email.
> **Liên quan:** [implementation-plan.md](../../04-implementation/implementation-plan.md) · [environment-configuration.md](../../07-deployment/environment-configuration.md) · [open-questions.md](../../01-requirements/open-questions.md) (câu 9).
> **Superseded (phần SMTP fallback):** ghi nhận bên dưới "SMTP còn nguyên / retained" phản ánh trạng thái **tại thời điểm chốt 2026-07-20**. Ngay sau đó SMTP fallback đã **gỡ khỏi code + Render** (email nay là **Resend-only**) — xem [SMTP-REMOVAL-ENV-CLEANUP](2026-07-20-smtp-removal-env-cleanup.md). `MAIL_PROVIDER=smtp` không còn hiệu lực.

## Phạm vi

Đóng hạng mục **[MANUAL-OPS]** cuối của Sprint 3: cấu hình gửi email thông báo
lead trên production. Đây là **task vận hành thủ công của chủ dự án** (nhập cấu
hình ở dashboard Render + gửi form thử), **không phải task code**. Không truy cập
secret/credential; note này chỉ ghi lại kết quả đã redact.

## Bối cảnh

- Backend đã sẵn `MailService.sendContactNotification` (gọi non-blocking trong
  `contact.service.ts`; thiếu cấu hình mail thì no-op, lead vẫn lưu).
- Ban đầu định dùng **Gmail SMTP** nhưng **bỏ** vì kết nối SMTP outbound trên
  Render **timeout** (Render chặn/không ổn định cổng SMTP).
- Backend hỗ trợ hai nhà cung cấp qua `MAIL_PROVIDER=smtp | resend`. Production
  chuyển sang **Resend** (gọi HTTPS API, không vướng cổng SMTP).

## Kết quả kiểm (production, 2026-07-20)

| Hạng mục | Trạng thái | Ghi chú (đã redact) |
|---|---|---|
| Cấu hình provider | ✅ PASS | Production đặt `MAIL_PROVIDER=resend`. |
| Gửi form liên hệ thử | ✅ PASS | Submit form → `POST /api/contact` → lead lưu + kích hoạt gửi mail. |
| Resend gửi email | ✅ PASS | Resend gửi thông báo lead thành công. |
| Hộp thư nhận | ✅ PASS | Hộp thư Gmail công ty **nhận được** email. |
| Phương án dự phòng | ✅ Giữ | SMTP còn nguyên, bật lại bằng `MAIL_PROVIDER=smtp`. |

## Ghi nhận hoàn thành

- **provider:** Resend
- **production test:** passed
- **email received:** yes (hộp thư Gmail công ty)
- **fallback:** SMTP retained (`MAIL_PROVIDER=smtp`)

## Quy tắc redaction

Không ghi giá trị thật: `RESEND_API_KEY`, `MAIL_FROM`, `SMTP_PASSWORD`,
`CONTACT_NOTIFY_TO`, `DATABASE_URL`, JWT secret, Cloudinary secret. Giá trị thật
nhập trực tiếp ở Render Dashboard (`sync: false`), không lưu trong Git.
