# Tài liệu dự án — Website Thiên Đức

Repository **nguồn sự thật về tài liệu** cho hệ thống Website + Admin CMS Thiên Đức
(3 project: `thien-duc-website-frontend`, `thien-duc-website-admin`,
`thien-duc-website-backend`). Đây là kho *tài liệu*, không chứa mã nguồn ứng dụng.

> **Người mới bắt đầu ở đây:** [docs/00-overview/project-overview.md](docs/00-overview/project-overview.md) → [docs/09-handover/handover-checklist.md](docs/09-handover/handover-checklist.md).

## Cấu trúc thư mục

```
thien-duc-website-docs/
├── README.md                     ← file này (điều hướng trung tâm)
├── docs/                         ← tài liệu chính, đánh số theo vòng đời
│   ├── 00-overview/              tổng quan, phạm vi, thuật ngữ
│   ├── 01-requirements/          yêu cầu + câu hỏi mở + báo cáo PA2 (.docx)
│   ├── 02-architecture/          kiến trúc + sơ đồ (diagrams/)
│   ├── 03-ui-ux/                 hand-off UI/UX, design system
│   ├── 04-implementation/        kế hoạch coding, quy ước, module
│   ├── 05-security/              audit bảo mật + findings + khắc phục
│   ├── 06-testing/               chiến lược & tiêu chí kiểm thử
│   ├── 07-deployment/            deploy, biến môi trường, migration, rollback
│   ├── 08-audits-and-reports/    báo cáo (current/ + archive/)
│   ├── 09-handover/              bàn giao, vận hành, bảo trì
│   └── 10-decisions/             nhật ký quyết định (ADR)
├── prompts/                      prompt cho AI agent/đội dev (development/ review/ archive/)
└── archive/                      tài liệu lịch sử (legacy-docs/)
```

## Liên kết tài liệu chính

| Chủ đề | Tài liệu |
|---|---|
| Tổng quan dự án | [docs/00-overview/project-overview.md](docs/00-overview/project-overview.md) |
| Yêu cầu & câu hỏi mở | [docs/01-requirements/](docs/01-requirements/README.md) · [open-questions](docs/01-requirements/open-questions.md) |
| Kiến trúc | [docs/02-architecture/system-architecture.md](docs/02-architecture/system-architecture.md) |
| UI/UX | [docs/03-ui-ux/ui-ux-handoff.md](docs/03-ui-ux/ui-ux-handoff.md) |
| Kế hoạch triển khai | [docs/04-implementation/implementation-plan.md](docs/04-implementation/implementation-plan.md) |
| Bảo mật | [docs/05-security/](docs/05-security/README.md) |
| Kiểm thử | [docs/06-testing/](docs/06-testing/README.md) |
| Triển khai | [docs/07-deployment/deployment-guide.md](docs/07-deployment/deployment-guide.md) |
| Báo cáo & audit | [docs/08-audits-and-reports/](docs/08-audits-and-reports/README.md) |
| Bàn giao | [docs/09-handover/handover-checklist.md](docs/09-handover/handover-checklist.md) |
| Quyết định (ADR) | [docs/10-decisions/](docs/10-decisions/README.md) |

## Nguồn thông tin chuẩn (single source of truth)

Để tránh mâu thuẫn, mỗi loại thông tin chỉ có **một** nguồn chuẩn:

| Loại | Nguồn chuẩn |
|---|---|
| Quy ước code + hợp đồng chung 3 project | `AGENTS.md` (workspace root, **ngoài** repo này) |
| Trạng thái công việc theo sprint | [implementation-plan.md](docs/04-implementation/implementation-plan.md) |
| Việc chờ công ty xác nhận | [open-questions.md](docs/01-requirements/open-questions.md) |
| Trạng thái bảo mật **hiện hành** | [audit-baseline mới nhất](docs/08-audits-and-reports/current/2026-07-16-audit-baseline.md) mục 5 (audit 2026-07-14 là mốc lịch sử) |
| Schema DB / enum | `thien-duc-website-backend/prisma/schema.prisma` |
| Bảng màu / token thiết kế | `globals.css` (frontend), `index.css` (admin) |

> Các file *khung/stub* trong `docs/` (đánh dấu "Trạng thái: Khung") **trỏ về** nguồn chuẩn, không tự tuyên bố là nguồn chuẩn.

## Quy ước đặt tên

- Thư mục & tên file: **chữ thường, kebab-case, tiếng Anh, không dấu, không khoảng trắng**.
- Báo cáo có ngày: `YYYY-MM-DD-ten-bao-cao.md` (VD `2026-07-16-audit-baseline.md`).
- ADR: `ADR-XXXX-tieu-de.md`.
- Nội dung *bên trong* file viết tiếng Việt (theo quy ước dự án).

## Quy trình cập nhật tài liệu

1. Cập nhật đúng **nguồn chuẩn** của loại thông tin đó (bảng trên) — không nhân bản.
2. Báo cáo có ngày → đặt vào `docs/08-audits-and-reports/current/`; khi bị thay thế → chuyển sang `archive/` kèm header `Status: Archived` + `Superseded by`.
3. Tài liệu lỗi thời → `archive/legacy-docs/` (không xóa nếu còn giá trị lịch sử).
4. Quyết định kiến trúc mới → thêm ADR trong `docs/10-decisions/`.
5. Khi di chuyển/đổi tên → cập nhật mọi tham chiếu (kể cả `AGENTS.md` + README 3 project ngoài repo).
6. Mâu thuẫn chưa giải quyết → đánh dấu `> TODO: ... cần người phụ trách xác nhận`, không tự chọn phe.

## Ghi chú

- Mỗi thư mục con có `README.md` mô tả mục đích + danh sách + thứ tự đọc.
- Secret/token/mật khẩu **không bao giờ** được đưa vào repo này (xem [environment-configuration](docs/07-deployment/environment-configuration.md)).
- Lịch sử tái cấu trúc kho tài liệu: xem [docs/08-audits-and-reports/current/2026-07-16-tai-cau-truc-tai-lieu.md](docs/08-audits-and-reports/current/2026-07-16-tai-cau-truc-tai-lieu.md).
