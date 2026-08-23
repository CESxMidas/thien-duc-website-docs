# 06 — Testing

> **Trạng thái:** Đang dùng (index thư mục)
> **Cập nhật:** 2026-08-22

Chiến lược, case và tiêu chí kiểm thử. Hiện trạng (2026-08-22): unit/integration backend
(75 suite / 1254 test) + component Admin Vitest (56 file / 859 test) + E2E backend
trên PostgreSQL thật có preflight an toàn (7 suite / 107 test); cả 3 repo đều có CI.

## Danh sách tài liệu

| Tài liệu | Mô tả | Trạng thái |
|---|---|---|
| [testing-strategy.md](testing-strategy.md) | Ma trận test/CI + cách chạy | Đang dùng |
| [test-cases.md](test-cases.md) | Ma trận case: hẹn giờ, hiển thị lúc truy vấn, quyền EDITOR, múi giờ, cửa sổ banner | Đang dùng |
| [acceptance-criteria.md](acceptance-criteria.md) | Tiêu chí nghiệm thu go-live | Khung |
| [g4-measurement-baseline.md](g4-measurement-baseline.md) | Baseline đo production: Rich Results (✅) + Lighthouse (✅ sau fix NO_FCP/NO_LCP: 14/14 lượt hợp lệ) | Đang dùng |

## Tài liệu liên quan

Bằng chứng hiện trạng: [audit-baseline](../08-audits-and-reports/current/2026-07-16-audit-baseline.md) mục 8.
