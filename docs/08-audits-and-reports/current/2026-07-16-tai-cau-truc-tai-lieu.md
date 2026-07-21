# Báo cáo tái cấu trúc kho tài liệu — Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Ngày tạo:** 2026-07-16
> **Phạm vi:** Repository `thien-duc-website-docs` (+ cập nhật tham chiếu ở `AGENTS.md` và 3 README project)
> **Người thực hiện:** AI agent (tái cấu trúc tài liệu)
> **Tài liệu liên quan:** [../../../README.md](../../../README.md)

## 1. Vấn đề ban đầu

Thư mục gốc chứa quá nhiều file rời rạc, tên không nhất quán (hoa/thường, có dấu, khoảng trắng): `AUDIT-BASELINE-2026-07-16.md`, `KE-HOACH-CODING.md`, `CAU-HOI-CAN-XAC-NHAN.md`, `DEPLOY.md`, `UI-UX-HANDOFF-SPEC.md`, `PROMT.MD`, `Báo cáo...docx`, cùng các thư mục `Du an/`, `FE - Xây dựng module.../`, `diagrams/`, `security-audit/`. Không có README điều hướng, không phân nhóm theo vòng đời, có tài liệu trùng lặp.

## 2. Cấu trúc mới

```
thien-duc-website-docs/
├── README.md                     (điều hướng trung tâm — MỚI)
├── docs/  (00-overview → 10-decisions, mỗi thư mục có README index)
├── prompts/  (development/ review/ archive/)
└── archive/legacy-docs/
```

Chi tiết đầy đủ: [README trung tâm](../../../README.md).

## 3. File đã DI CHUYỂN (giữ nguyên nội dung, dùng `git mv`)

| Cũ | Mới |
|---|---|
| `diagrams/` (21 file) | `docs/02-architecture/diagrams/` |
| `Báo cáo phương án kỹ thuật...docx` | `docs/01-requirements/technical-proposal-pa2.docx` |

## 4. File đã ĐỔI TÊN + di chuyển

| Cũ | Mới | Lý do |
|---|---|---|
| `KE-HOACH-CODING.md` | `docs/04-implementation/implementation-plan.md` | Kebab-case tiếng Anh, đúng nhóm |
| `CAU-HOI-CAN-XAC-NHAN.md` | `docs/01-requirements/open-questions.md` | Chuẩn tên |
| `UI-UX-HANDOFF-SPEC.md` | `docs/03-ui-ux/ui-ux-handoff.md` | Chuẩn tên |
| `AUDIT-BASELINE-2026-07-16.md` | `docs/08-audits-and-reports/current/2026-07-16-audit-baseline.md` | Chuẩn `YYYY-MM-DD-*` |
| `PROMT.MD` | `prompts/development/install-design-skills.md` | Tên rõ nghĩa |
| `FE - Xây dựng module đăng nhập Admin/CMS bằng TypeScript + React.md` | `prompts/development/admin-authentication-module.md` | Bỏ dấu/khoảng trắng |
| `security-audit/SECURITY_AUDIT_PHASE_1.md` | `docs/05-security/security-audit-phase-1.md` | Kebab-case |
| `security-audit/FINDINGS_SUMMARY.md` | `docs/05-security/findings-summary.md` | Kebab-case |
| `security-audit/PHASE_2_VERIFICATION_GATE.md` | `docs/05-security/phase-2-verification-gate.md` | Kebab-case |
| `security-audit/README.md` | `docs/05-security/README.md` | Giữ vai trò index |

## 5. File đã TÁCH (split)

| Nguồn | Kết quả |
|---|---|
| `DEPLOY.md` | `docs/07-deployment/`: `deployment-guide.md` (quy trình + troubleshooting) · `environment-configuration.md` (biến MT) · `database-migrations.md` (migration/seed) · `rollback-plan.md` (khung) |

Không mất nội dung — mỗi file mới có mục *Document history* ghi nguồn.

## 6. File đã LƯU TRỮ (archive)

| Cũ | Mới | Lý do |
|---|---|---|
| `Du an/du an.md` | `archive/legacy-docs/2026-07-09-du-an-trang-thai.md` | Trùng lặp — nội dung đã gộp vào implementation-plan (Sprint 1). Header `Status: Archived` + `Superseded by`. |

## 7. File đề xuất XÓA nhưng CHƯA xóa

**Không có.** Mọi file đều được giữ, đổi tên, tách hoặc lưu trữ.

## 8. Tài liệu MỚI tạo (từ dữ kiện đã có trong repo, có ghi nguồn)

- Điều hướng: `README.md` (trung tâm), `docs/README.md`, và README index cho mọi thư mục con.
- Tổng hợp: `docs/00-overview/project-overview.md`, `docs/02-architecture/system-architecture.md`, `docs/09-handover/handover-checklist.md`, 4 ADR (`docs/10-decisions/ADR-0001..0004`).
- Khung (stub template, "Trạng thái: Khung", trỏ về nguồn chuẩn): 24 file trong các nhóm 00–09 (scope, glossary, *-requirements, *-architecture, design-system, coding-guidelines, testing-*, backup-and-restore, operations/maintenance-guide, v.v.).

> Các stub **không** tự tuyên bố là nguồn chuẩn — chúng trỏ về nguồn thật (`AGENTS.md`, `schema.prisma`, code, hoặc tài liệu chính đã có).

## 9. Nội dung MÂU THUẪN cần xác nhận

- **"Mock mode"**: `deployment-guide.md` (mục 5) và `ui-ux-handoff.md` (mục 9) vẫn mô tả frontend chạy "chế độ mock khi chưa đặt `VITE_API_URL`", trong khi `AGENTS.md` khẳng định frontend **đã bỏ hoàn toàn lớp mock/fallback**. Đã chèn `> TODO: ... cần người phụ trách xác nhận` tại cả hai chỗ — **không tự chọn phe**.
  > **Ghi chú hiện hành (2026-07-21):** mâu thuẫn này **đã giải quyết** — frontend không có mock mode, và biến đúng là `NEXT_PUBLIC_API_URL` (frontend là Next.js, không phải Vite; tên `VITE_API_URL` ở trên chỉ còn là mô tả lịch sử tại thời điểm audit này). Xem `deployment-guide.md` mục 5 và `environment-configuration.md`.

## 10. Tham chiếu đã cập nhật & còn lại

- ✅ **Trong repo docs:** mọi tham chiếu chéo đã trỏ đúng đường dẫn mới. Kiểm tra tự động: **239 internal link, 0 broken** (sau khi tạo báo cáo này).
- ✅ **Ngoài repo docs (theo yêu cầu):** đã cập nhật `AGENTS.md` (workspace root) + `README.md` của `thien-duc-website-frontend`, `-admin`, `-backend`. Các file này nằm ở thư mục khác (không thuộc git repo docs) → thay đổi của chúng **chưa được commit** ở repo tương ứng của chúng.
- ⚠️ **Tham chiếu tên cũ còn xuất hiện có chủ đích** trong các dòng *"Nguồn (di chuyển từ)"* và *Document history* — đó là ghi chú xuất xứ, không phải link hỏng.
- ⚠️ **Dangling reference có sẵn từ trước** (không do tái cấu trúc tạo ra): `implementation-plan.md` mục UAT nhắc `ke-hoach-thien-duc.md` — file này **chưa từng tồn tại** trong repo. Giữ nguyên, cần người phụ trách làm rõ.

## 11. Kết quả kiểm tra

- [x] Thư mục gốc sạch: chỉ còn `README.md`, `docs/`, `prompts/`, `archive/`, `.gitignore`.
- [x] Không còn file báo cáo/kế hoạch/prompt rời rạc ở root.
- [x] Không có file tên chung chung (`final.md`, `PROMT.MD`…).
- [x] 0 broken internal link (239 link kiểm tra).
- [x] Chỉ một nguồn chuẩn cho mỗi loại thông tin (bảng trong README trung tâm).
- [x] Không thêm secret vào Git.
- [x] `git mv` bảo toàn lịch sử (34 rename được nhận diện).

## 12. Hướng dẫn kiểm tra thay đổi

```bash
cd thien-duc-website-docs
git status --short        # xem rename (R) + file mới (A)
git diff --staged -M      # xem diff kèm nhận diện rename
```

Với tham chiếu ngoài repo: kiểm tra `git status` tại từng project `thien-duc-website-{frontend,admin,backend}` và file `AGENTS.md` ở workspace root.
