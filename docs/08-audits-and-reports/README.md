# 08 — Audits & Reports

> **Trạng thái:** Đang dùng (index thư mục)
> **Cập nhật:** 2026-08-02

Báo cáo & audit có ngày. `current/` = hiện hành; `archive/` = đã bị thay thế. Đặt tên `YYYY-MM-DD-*.md`.

## Danh sách tài liệu

| Tài liệu | Mô tả | Trạng thái |
|---|---|---|
| [current/2026-07-16-audit-baseline.md](current/2026-07-16-audit-baseline.md) | Audit baseline mới nhất (60/100) | Đang dùng |
| [current/2026-07-16-tai-cau-truc-tai-lieu.md](current/2026-07-16-tai-cau-truc-tai-lieu.md) | Báo cáo tái cấu trúc kho tài liệu | Đang dùng |
| [current/2026-07-18-en-full-group2-closure.md](current/2026-07-18-en-full-group2-closure.md) | EN-FULL Group 2 — đóng tiếng Anh cho 7 route audited | Đang dùng |
| [current/2026-07-18-en-site-wide-follow-up.md](current/2026-07-18-en-site-wide-follow-up.md) | EN-SITE-WIDE (F1–F3) — dọn tiếng Việt 5 route `/en` ngoài phạm vi 7-route | Đang dùng |
| [current/2026-07-18-en-project-items-p1.md](current/2026-07-18-en-project-items-p1.md) | EN-PROJECT-ITEMS-P1 — backfill tiếng Anh cho 3 route hạng mục Hưng Phú | Đang dùng |
| [current/2026-07-19-admin-item-content-p2-batch-m1.md](current/2026-07-19-admin-item-content-p2-batch-m1.md) | ADMIN-ITEM-CONTENT-P2 Batch M1 — kiểm chứng runtime nội dung hạng mục + fix Select | Đang dùng |
| [current/2026-07-27-fullstack-playwright-e2e.md](current/2026-07-27-fullstack-playwright-e2e.md) | Hạ tầng E2E full-stack Playwright (Admin + Frontend + Backend) — có đính chính về kết quả CI | Đang dùng |
| [current/2026-07-29-e2e-ci-red-contrast-overflow-flake-fix.md](current/2026-07-29-e2e-ci-red-contrast-overflow-flake-fix.md) | E2E-CI-RED-FIX-M1 — sửa tương phản huy hiệu, tràn ngang mobile, chập chờn bàn phím banner; CI 109/1/2 → 113/113 | Đang dùng |
| [current/2026-07-30-final-test-case-matrix.md](current/2026-07-30-final-test-case-matrix.md) | FINAL-QUALITY-AUDIT-M1 — ma trận 295 test-case truy vết theo tính năng (224 covered / 39 partial / 27 missing / 4 blocked) | Đang dùng |
| [current/2026-07-30-final-website-quality-audit.md](current/2026-07-30-final-website-quality-audit.md) | FINAL-QUALITY-AUDIT-M1 — audit tự động cuối trước bàn giao; **PARTIALLY GREEN**; 2 defect sản phẩm + 2 defect test đã sửa, +59 test mới | Đang dùng |
| [current/2026-07-30-m2-release-hardening.md](current/2026-07-30-m2-release-hardening.md) | FINAL-RELEASE-HARDENING-M2 - nang Next 16.2.12, **dong XSS luu tru qua JSON-LD**, hang rao URL phia server, validate khoang trang, tran `content[]`, 8 viewport, sua D10 | Dang dung |
| [current/2026-07-31-retire-direct-user-create.md](current/2026-07-31-retire-direct-user-create.md) | CMS-RETIRE-DIRECT-USER-CREATE-M1 — gỡ hẳn `POST /api/users` (tạo tài khoản kèm mật khẩu); lời mời là lối cấp tài khoản duy nhất; +25 test, Playwright 181/181 | Đang dùng |
| [current/2026-07-31-optional-backlog-repo-work.md](current/2026-07-31-optional-backlog-repo-work.md) | THIEN-DUC-OPTIONAL-BACKLOG-REPO-WORK-M1 — backlog §6 phần làm trong repo: **unaccent (checkbox `[x]` cũ là SAI)**, 121 test Zod, chuẩn bị Sentry source map + backup off-site, sửa reduced-motion & `quality={100}`; Playwright 187/187 | Đang dùng |
| [current/2026-07-31-production-unaccent-migration-incident.md](current/2026-07-31-production-unaccent-migration-incident.md) | THIEN-DUC-PRODUCTION-UNACCENT-MIGRATION-RECOVERY-M1 — sự cố `P3009` của `20260731120000_search_unaccent` trên production: cổng backup, restore drill, `migrate resolve --rolled-back` + deploy lại; **RESOLVED**, giữ làm chronology + tiền lệ runbook | Đang dùng (RESOLVED) |
| [current/2026-07-31-ci-flaky-and-warnings-cleanup.md](current/2026-07-31-ci-flaky-and-warnings-cleanup.md) | THIEN-DUC-CI-FLAKY-AND-WARNINGS-CLEANUP-M1 — 4 test chập chờn (cổng hydrate, tái hiện bằng CPU throttling 20×), lint backend 5 cảnh báo → 0, healthcheck Postgres, phân loại log duplicate-key, triage npm audit, Actions v5 | Đang dùng |
| [current/2026-08-02-optional-backlog-coding-completion.md](current/2026-08-02-optional-backlog-coding-completion.md) | THIEN-DUC-OPTIONAL-BACKLOG-CODING-COMPLETION-M2 — hoàn tất phần code §6 không cần DB: Admin Sentry source map (+29 test), adapter backup trung lập + 20 test không cần PostgreSQL (bắt 1 defect thứ tự cầu chì), `npm run analyze` Turbopack-native + 11 hàng rào hiệu năng; ghi rõ phần hoãn vì thiếu DB | Đang dùng |
| [archive/](archive/) | Báo cáo cũ/đã thay thế | Lưu trữ |

## Tài liệu liên quan

Audit **bảo mật** (theo nhóm riêng): [05-security](../05-security/README.md).
