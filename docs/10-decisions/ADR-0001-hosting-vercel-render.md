# ADR-0001 — Hosting: Vercel (Frontend) + Render (Backend + PostgreSQL)

- **Trạng thái:** Accepted
- **Ngày:** 2026-07-16 (ghi nhận; quyết định đã có từ trước, xác nhận ở câu 11)
- **Nguồn:** [open-questions](../01-requirements/open-questions.md) câu 11; [deployment-guide](../07-deployment/deployment-guide.md)

## Bối cảnh

Cần chọn hạ tầng cho 3 thành phần: frontend Next.js, backend NestJS, và PostgreSQL. Ưu tiên chi phí thấp giai đoạn đầu, tự động hóa deploy.

## Quyết định

- **Frontend → Vercel** (Git integration, biến `VITE_*`).
- **Backend + PostgreSQL → Render**, region Singapore, dựng bằng `render.yaml` Blueprint (auto-deploy khi push `main`, tự chạy `prisma migrate deploy`).
- Giai đoạn đầu chạy gói **free**.

## Hệ quả

- ✅ Deploy tái lập được (IaC qua `render.yaml`), CI lint+build ở cả 2 repo.
- ⚠️ Free-tier: backend ngủ sau 15 phút (request đầu 30–50s), Postgres free hết hạn 90 ngày → cần cron ngoài (UptimeRobot) và **nâng plan trước go-live** (ngân sách: câu 13, còn mở).
- ⚠️ Chưa có backup/monitoring/staging (xem [audit-baseline](../08-audits-and-reports/current/2026-07-16-audit-baseline.md) mục 7).
