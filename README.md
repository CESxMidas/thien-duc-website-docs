# Tài liệu dự án — Website Thiên Đức

Repository **nguồn sự thật về tài liệu** cho hệ thống Website + Admin CMS Thiên Đức
đang vận hành production (3 project: `thien-duc-website-frontend`,
`thien-duc-website-admin`, `thien-duc-website-backend`).
Đây là kho *tài liệu*, không chứa mã nguồn ứng dụng.

> **Người mới bắt đầu ở đây:** [00-overview/project-overview.md](00-overview/project-overview.md)
> → [09-handover/handover-checklist.md](09-handover/handover-checklist.md).

## Phạm vi repository này

Repo này chỉ chứa tài liệu của **hệ thống Thiên Đức hiện tại**: website doanh nghiệp
công khai, Admin CMS, backend, kiến trúc production, bảo mật, triển khai, giám sát,
sao lưu và lịch sử audit.

> 🔀 **Tài liệu dự án Fancy Tower đã được tách sang repository riêng:**
> [`../thien-duc-website-fancy-tower-docs/`](../thien-duc-website-fancy-tower-docs/)
>
> Đó là sản phẩm MỚI — website giới thiệu và bán căn hộ chung cư.
> **Không** duy trì bản sao tài liệu Fancy Tower trong repo này.

⚠️ **Lưu ý phân biệt:** hệ thống Thiên Đức hiện tại có một dự án tên *Fancy Tower*
(chung cư thuộc Khu đô thị Hưng Phú). Tài liệu về **nội dung dự án đó trên website
công ty** vẫn thuộc repo này. Chỉ tài liệu về **sản phẩm bán căn hộ mới** mới thuộc
repository kia.

## Cấu trúc thư mục

```
thien-duc-website-docs/
├── README.md                     ← file này (điều hướng trung tâm)
├── documentation-conventions.md  quy ước đặt tên, cập nhật, lưu trữ
├── 00-overview/                  tổng quan, phạm vi, thuật ngữ
├── 01-requirements/              yêu cầu + câu hỏi mở + báo cáo PA2 (.docx)
├── 02-architecture/              kiến trúc + sơ đồ (diagrams/)
├── 03-ui-ux/                     hand-off UI/UX, design system
├── 04-implementation/            kế hoạch coding, quy ước, module
├── 05-security/                  audit bảo mật + findings + khắc phục
├── 06-testing/                   chiến lược & tiêu chí kiểm thử
├── 07-deployment/                deploy, biến môi trường, migration, rollback
├── 08-audits-and-reports/        báo cáo (current/ + archive/)
├── 09-handover/                  bàn giao, vận hành, bảo trì
├── 10-decisions/                 nhật ký quyết định (ADR)
├── prompts/                      prompt cho AI agent/đội dev
└── archive/                      tài liệu lịch sử (legacy-docs/)
```

## Liên kết tài liệu chính

| Chủ đề | Tài liệu |
|---|---|
| Tổng quan dự án | [00-overview/project-overview.md](00-overview/project-overview.md) |
| Yêu cầu & câu hỏi mở | [01-requirements/](01-requirements/README.md) · [open-questions](01-requirements/open-questions.md) |
| Kiến trúc | [02-architecture/system-architecture.md](02-architecture/system-architecture.md) |
| UI/UX | [03-ui-ux/ui-ux-handoff.md](03-ui-ux/ui-ux-handoff.md) |
| Kế hoạch triển khai | [04-implementation/implementation-plan.md](04-implementation/implementation-plan.md) |
| Trạng thái module | [04-implementation/module-status.md](04-implementation/module-status.md) |
| Bảo mật | [05-security/](05-security/README.md) |
| Kiểm thử | [06-testing/](06-testing/README.md) |
| CI/CD & bàn giao deploy | [07-deployment/ci-cd.md](07-deployment/ci-cd.md) |
| Triển khai | [07-deployment/deployment-guide.md](07-deployment/deployment-guide.md) |
| Báo cáo & audit | [08-audits-and-reports/](08-audits-and-reports/README.md) |
| Bàn giao | [09-handover/handover-checklist.md](09-handover/handover-checklist.md) |
| Quyết định (ADR) | [10-decisions/](10-decisions/README.md) |

## Nguồn thông tin chuẩn (single source of truth)

Để tránh mâu thuẫn, mỗi loại thông tin chỉ có **một** nguồn chuẩn:

| Loại | Nguồn chuẩn |
|---|---|
| Quy ước code + hợp đồng chung 3 project | `AGENTS.md` (workspace root, **ngoài** repo này) |
| Trạng thái công việc theo sprint | [implementation-plan.md](04-implementation/implementation-plan.md) |
| Trạng thái từng module | [module-status.md](04-implementation/module-status.md) |
| Việc chờ công ty xác nhận | [open-questions.md](01-requirements/open-questions.md) |
| Trạng thái bảo mật **hiện hành** | [audit-baseline mới nhất](08-audits-and-reports/current/2026-07-16-audit-baseline.md) mục 5 (audit 2026-07-14 là mốc lịch sử) |
| Schema DB / enum | `thien-duc-website-backend/prisma/schema.prisma` |
| Bảng màu / token thiết kế | `globals.css` (frontend), `index.css` (admin) |
| **Dự án bán căn hộ Fancy Tower** | **repo riêng** — [`../thien-duc-website-fancy-tower-docs/`](../thien-duc-website-fancy-tower-docs/) |

> Các file *khung/stub* trong repo (đánh dấu "Trạng thái: Khung") **trỏ về** nguồn chuẩn,
> không tự tuyên bố là nguồn chuẩn.

## Lưu ý về báo cáo phương án kỹ thuật PA2

[01-requirements/technical-proposal-pa2.docx](01-requirements/technical-proposal-pa2.docx)
là **báo cáo gốc** định nghĩa các mã yêu cầu `YC-xx` vẫn đang được tham chiếu.

⚠️ **Phần số liệu tiến độ trong đó đã lỗi thời** (mô tả backend/CMS ở trạng thái chưa
xây dựng). Hiện trạng đúng lấy từ [module-status.md](04-implementation/module-status.md)
và [implementation-plan.md](04-implementation/implementation-plan.md).

## Quy ước

Xem [documentation-conventions.md](documentation-conventions.md) — quy ước đặt tên,
quy trình cập nhật, quy tắc lưu trữ và quy tắc xoá tài liệu.

## Ghi chú

- Mỗi thư mục con có `README.md` mô tả mục đích + danh sách + thứ tự đọc.
- Secret/token/mật khẩu **không bao giờ** được đưa vào repo này
  (xem [environment-configuration](07-deployment/environment-configuration.md)).
- Lịch sử tái cấu trúc kho tài liệu:
  [2026-07-16](08-audits-and-reports/current/2026-07-16-tai-cau-truc-tai-lieu.md) (lần đầu)
  · 2026-09-04 (tách tài liệu Fancy Tower sang repository riêng).
