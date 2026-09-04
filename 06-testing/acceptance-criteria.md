# Tiêu chí nghiệm thu

> **Trạng thái:** Khung — chưa có nội dung riêng (sẽ bổ sung)
> **Nhóm:** 06 — Testing
> **Cập nhật:** 2026-07-16

Checklist nghiệm thu go-live (14 route, LCP ≤2.5s, Lighthouse SEO ≥90) — chờ công ty chốt (câu 20).

## Tiêu chí song ngữ (EN-FULL)

- ✅ **Bảy route audited** (`/en`, `/en/gioi-thieu`, `/en/lien-he`, `/en/du-an`, `/en/du-an/khu-do-thi-hung-phu`, `/en/tin-tuc`, `/en/tin-tuc/le-khoi-cong-fancy-tower-khu-do-thi-hung-phu`) render **0 chuỗi tiếng Việt hiển thị**; route VI giữ nguyên; không `[object Object]`. Đạt 2026-07-18 — xem [closure note](../08-audits-and-reports/current/2026-07-18-en-full-group2-closure.md).
- ✅ **Ba route hạng mục Hưng Phú** (`/en/du-an/khu-do-thi-hung-phu/{fancy-tower,hung-phu-mall,khu-nha-o-thap-tang}`) render **0 tiếng Việt hiển thị** trong text body sau backfill production. Đạt 2026-07-18 — xem [EN-PROJECT-ITEMS-P1 note](../08-audits-and-reports/current/2026-07-18-en-project-items-p1.md).
- ⬜ **Tiếng Anh toàn site** — vẫn cần full crawl/build với backend sống để xác nhận toàn bộ route CMS/tĩnh; không suy ra từ các batch đã đóng.

**Nguồn tham khảo hiện tại:** [open-questions](../01-requirements/open-questions.md) câu 20; [implementation-plan](../04-implementation/implementation-plan.md) mục UAT + Go-live.
