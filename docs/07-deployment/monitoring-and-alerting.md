# Giám sát & cảnh báo — Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Nhóm:** 07 — Deployment
> **Cập nhật:** 2026-07-16
> **Tài liệu liên quan:** [deployment-guide.md](deployment-guide.md) · [environment-configuration.md](environment-configuration.md) · [rollback-plan.md](rollback-plan.md) · [audit-baseline](../08-audits-and-reports/current/2026-07-16-audit-baseline.md)

Task →5: error tracking bằng **Sentry** (3 app) + uptime monitoring bằng
**UptimeRobot** (hoặc tương đương). Cấu hình **errors-only, không PII**:
`tracesSampleRate: 0`, không Session Replay, `sendDefaultPii: false`, backend
xóa request data trước khi gửi (không lộ nội dung lead/token/cookie).

## 0. Phân định trách nhiệm (repo vs. dashboard)

| Việc | Ở đâu |
|---|---|
| Code init Sentry + error boundary (3 app) | ✅ Repo (đã làm — task →5) |
| Tạo tài khoản Sentry + 3 project + lấy 3 DSN | **Thủ công** (Sentry dashboard) |
| Dán DSN vào Render/Vercel env + redeploy | **Thủ công** (Render/Vercel dashboard) |
| Tạo monitor UptimeRobot + kênh alert | **Thủ công** (UptimeRobot dashboard) |

Thiếu DSN → mọi SDK **tự tắt** (no-op), app chạy bình thường — cùng khuôn
degrade với Cloudinary/SMTP.

## 1. Sentry — kiến trúc capture

| App | SDK | Điểm capture | Biến env |
|---|---|---|---|
| Backend | `@sentry/nestjs` | `src/instrument.ts` (init, import đầu tiên ở `main.ts`) + `HttpExceptionFilter` — **chỉ** exception ngoài `HttpException` (500 bất ngờ). 4xx/423/429 chủ đích **không** capture. | `SENTRY_DSN` (Render, `sync: false`) |
| Frontend | `@sentry/nextjs` | `src/instrumentation.ts` (server/edge + `onRequestError`), `src/instrumentation-client.ts` (browser), `app/global-error.tsx` + `app/[locale]/error.tsx` (error boundary kèm capture) | `NEXT_PUBLIC_SENTRY_DSN` (Vercel — DSN ingest-only, không phải secret) |
| Admin | `@sentry/react` | `src/main.tsx` (init) + `Sentry.ErrorBoundary` với `CrashFallback` — hết trắng trang lặng lẽ | `VITE_SENTRY_DSN` |

**Scrubbing PII:** backend `beforeSend` xóa `event.request` (body chứa nội dung
lead — task →1/→3) và IP/email của `event.user`; FE server cũng xóa
`event.request` (header có thể chứa cookie).

### Checklist bật Sentry (thủ công, ~15 phút)

- [ ] Tạo tài khoản Sentry (SaaS free tier — 5k event/tháng).
- [ ] Tạo **3 project riêng**: `thien-duc-backend` (Node/Nest), `thien-duc-frontend`
      (Next.js), `thien-duc-admin` (React) → lấy 3 DSN.
- [ ] Render → service backend → Environment → dán `SENTRY_DSN` → redeploy.
- [ ] Vercel → project frontend → Environment Variables → `NEXT_PUBLIC_SENTRY_DSN`
      (cả 3 scope) → **Redeploy** (biến `NEXT_PUBLIC_*` nướng lúc build).
- [ ] Nơi build/host admin → đặt `VITE_SENTRY_DSN` → build lại.
- [ ] Bật alert rule mặc định (email khi có issue mới) ở cả 3 project.

## 2. UptimeRobot — uptime & cảnh báo downtime

> Sau task →2 (plan always-on), monitor **không còn** đóng vai "ping giữ backend
> thức" — mục đích duy nhất là **báo động khi sập**.

Checklist (thủ công, free tier):

- [ ] Monitor 1 — Backend: HTTP(s), URL `https://…onrender.com/api`, interval 5
      phút. Kết quả mong đợi: HTTP 200 (body envelope `{"success":true,…}`).
- [ ] Monitor 2 — Frontend: HTTP(s), URL trang chủ Vercel, interval 5 phút.
- [ ] Kênh alert: email vận hành (thêm Slack/Telegram nếu có).
- [ ] (Tùy chọn) trang status công khai của UptimeRobot nếu cần minh bạch uptime.

## 3. Kiểm chứng

**Backend (local):** đặt `SENTRY_DSN` vào `.env` → chạy backend với DB tắt →
`GET /api/projects` trả 500 → event hiện trên Sentry. Bật DB lại, gọi route 404
(`GET /api/projects/khong-ton-tai`) → **không** có event (đúng thiết kế chỉ bắt 500).

**Frontend/Admin (local):** đặt DSN → tạo lỗi render chủ đích (ném `throw` tạm
trong một component) → error boundary hiện UI lỗi + event lên Sentry → gỡ throw.

**Production:** sau khi dán DSN + redeploy, mỗi app tạo 1 lỗi thử → xác nhận 3
project đều nhận event, alert email về đúng hộp thư.

**UptimeRobot:** tạm **Suspend** service Render vài phút → nhận alert → Resume →
nhận thông báo phục hồi.

## 4. Liên đới các task sau

- **Task →6 (enforce CSP):** frontend gửi event tới domain ingest của Sentry —
  khi chuyển CSP từ Report-Only sang enforce **phải thêm** domain ingest
  (`*.ingest.sentry.io` hoặc region tương ứng, xem DSN) vào `connect-src` trong
  `next.config.ts`, nếu không event bị chặn. *Đã ghi chú tại đây, chưa làm.*
- **Source map upload** (`SENTRY_AUTH_TOKEN` — secret thật): **hoãn**, tách task
  riêng nếu stack trace minified gây khó đọc.

---

## Document history

- **2026-07-16** — Task →5: tạo mới. Sentry errors-only cho 3 app + runbook
  UptimeRobot + checklist thủ công + ghi chú liên đới CSP (task →6).
