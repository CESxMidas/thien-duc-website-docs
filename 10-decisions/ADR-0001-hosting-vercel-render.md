# ADR-0001 — Hosting: Vercel (Frontend) + Render (Backend + PostgreSQL)

- **Trạng thái:** Accepted
- **Ngày:** 2026-07-16 (ghi nhận; quyết định đã có từ trước, xác nhận ở câu 11)
- **Nguồn:** [open-questions](../01-requirements/open-questions.md) câu 11; [deployment-guide](../07-deployment/deployment-guide.md)

## Bối cảnh

Cần chọn hạ tầng cho 3 thành phần: frontend Next.js, backend NestJS, và PostgreSQL. Ưu tiên chi phí thấp giai đoạn đầu, tự động hóa deploy.

## Quyết định

- **Frontend → Vercel** (Git integration; frontend là Next.js nên biến client dùng tiền tố `NEXT_PUBLIC_*`).
- **Backend + PostgreSQL → Render**, region Singapore, dựng bằng `render.yaml` Blueprint (auto-deploy khi push `main`, tự chạy `prisma migrate deploy`).
- Giai đoạn đầu chạy gói **free**.

## Hệ quả

- Deploy tái lập được (IaC qua `render.yaml`), CI lint+build ở cả 2 repo.
- Tại thời điểm quyết định ban đầu, Free-tier làm backend ngủ sau 15 phút và
  PostgreSQL Free có thời hạn; vì vậy kế hoạch yêu cầu nâng database trước go-live.
- Tại thời điểm quyết định ban đầu chưa có bằng chứng backup/monitoring/staging
  (xem [audit-baseline](../08-audits-and-reports/current/2026-07-16-audit-baseline.md) mục 7).

## Cập nhật trạng thái production — 2026-10-19

Quyết định nền tảng không thay đổi, nhưng trạng thái vận hành đã khác giai đoạn
đầu:

- Backend vẫn chạy Render Free; cold start là giới hạn đã biết.
- PostgreSQL production đã chuyển sang plan trả phí `0.1c-256mb` (6 USD/tháng
  theo dashboard tại thời điểm xác minh), PostgreSQL 18, Singapore, storage 1 GB.
- Render managed PITR active với recovery window 3 ngày; logical export được giữ
  ít nhất 7 ngày.
- Restore drill được owner chấp nhận hoãn sang vận hành sau bàn giao.
- Frontend/Admin production environment và domain `thienduccons.vn` đã được xác
  minh bằng dashboard.

Phần mô tả Free-tier phía trên được giữ để phản ánh quyết định ban đầu. Trạng
thái hiện hành xem
[báo cáo readiness cuối](../08-audits-and-reports/current/2026-10-19-final-release-readiness.md).
