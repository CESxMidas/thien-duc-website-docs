# Tổng quan dự án — Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Nhóm:** 00 — Overview
> **Cập nhật:** 2026-07-16
> **Nguồn:** tổng hợp từ [open-questions](../01-requirements/open-questions.md) (thông tin công ty đã xác nhận), `AGENTS.md` (stack), [audit-baseline](../08-audits-and-reports/current/2026-07-16-audit-baseline.md). Không thêm dữ kiện ngoài repo.

## Dự án là gì?

Website + hệ quản trị nội dung (CMS) song ngữ Việt/Anh cho **Công ty TNHH Đầu tư Xây dựng Thương mại Thiên Đức** — một doanh nghiệp bất động sản/xây dựng. Mục tiêu: dựng "hồ sơ năng lực trực tuyến", giới thiệu các dự án BĐS, đăng tin tức, và thu thập khách hàng tiềm năng (lead) qua form liên hệ.

## Thông tin công ty (đã xác nhận)

- **Tên pháp nhân:** CÔNG TY TNHH ĐẦU TƯ XÂY DỰNG THƯƠNG MẠI THIÊN ĐỨC
- **Mã số thuế:** 0309910290 · **ĐKKD:** 02/04/2010 · **Cơ quan quản lý:** Cục Thuế TP.HCM
- **Ngành chính:** Xây dựng nhà các loại (mã 4100)
- **Tầm nhìn/sứ mệnh & mốc lịch sử:** thành lập 2010; 2014–2018 hợp tác CapitaLand (Vista Verde, Feliz en Vista); 2018–nay mở rộng sang các tỉnh phía Nam (tiêu biểu Bến Tre).

Chi tiết đầy đủ (và các điểm còn chờ công ty xác nhận) ở [open-questions](../01-requirements/open-questions.md).

## Danh mục dự án (4 dự án trong hệ thống)

| Dự án | Vị trí | Ghi chú |
|---|---|---|
| Khu đô thị Hưng Phú | Bến Tre (11,25 ha) | Fancy Tower là **hạng mục con**, không phải dự án độc lập |
| Silver Sea Tower | Vũng Tàu | slug `du-an-vung-tau` |
| La Bonita | Bình Thạnh, TP.HCM | |
| Bảy Hiền Tower | Tân Bình, TP.HCM | slug `du-an-bay-hien` |

> ⚠️ Một số ghi chú pháp lý nhạy cảm (tranh chấp, sai phạm) **cố ý không đăng công khai** — xem cảnh báo trong [implementation-plan](../04-implementation/implementation-plan.md) mục "Nội dung thật".

## Kiến trúc & stack (tóm tắt)

Ba ứng dụng tách rời + tài liệu — xem [system-architecture](../02-architecture/system-architecture.md):

| Thành phần | Stack | Deploy |
|---|---|---|
| Frontend công khai | Next.js 16 + React 19 + Tailwind v4 | Vercel |
| Admin CMS | Vite + React 19 + shadcn/ui + TanStack Query | (SPA) |
| Backend API | NestJS 11 + Prisma 7 + PostgreSQL 17 | Render |

## Trạng thái hiện tại (mốc 2026-07-16)

- Đã deploy production; luồng form liên hệ chạy thật end-to-end. Admin CMS nối API thật 100%.
- **Điểm audit baseline: 60/100.** Khoảng trống lớn: email thông báo lead (mới là TODO), hạ tầng free-tier, chưa monitoring/backup, test mỏng.
- **Chặn go-live:** nhập bản dịch tiếng Anh (mọi field `.en` còn trống).

## Đọc tiếp theo

1. [Yêu cầu & câu hỏi mở](../01-requirements/) → [open-questions](../01-requirements/open-questions.md)
2. [Kiến trúc](../02-architecture/system-architecture.md)
3. [Kế hoạch triển khai](../04-implementation/implementation-plan.md)
4. [Audit baseline mới nhất](../08-audits-and-reports/current/2026-07-16-audit-baseline.md)
5. [Bàn giao](../09-handover/handover-checklist.md)
