# 10 — Nhật ký quyết định kiến trúc (ADR)

> **Trạng thái:** Đang dùng (index ADR)
> **Cập nhật:** 2026-07-16

Thư mục ghi lại các **quyết định kiến trúc/kỹ thuật đã chốt** (Architecture Decision Records). Mỗi quyết định một file `ADR-XXXX-<tiêu-đề>.md`.

## Quy ước

- Đánh số tăng dần, không tái sử dụng số.
- Mỗi ADR gồm: **Bối cảnh · Quyết định · Hệ quả · Trạng thái** (Proposed / Accepted / Superseded).
- Không sửa nội dung ADR đã Accepted; nếu đổi hướng, tạo ADR mới và đánh dấu ADR cũ `Superseded by`.

## Danh sách

| ADR | Quyết định | Trạng thái |
|---|---|---|
| [ADR-0001](ADR-0001-hosting-vercel-render.md) | Hosting: Vercel (FE) + Render (BE + Postgres) | Accepted |
| [ADR-0002](ADR-0002-rbac-three-roles.md) | Phân quyền 3 vai trò SUPER_ADMIN/ADMIN/EDITOR | Accepted |
| [ADR-0003](ADR-0003-single-production-environment.md) | Một môi trường production duy nhất (chưa tách staging) | Accepted |
| [ADR-0004](ADR-0004-bilingual-jsonb-locale-routing.md) | Song ngữ JSONB {vi,en} + locale routing (VI không tiền tố) | Accepted |

> Các quyết định trên đều đã được ghi rải rác trong tài liệu gốc; ADR ở đây gom lại thành nguồn tra cứu tập trung.
