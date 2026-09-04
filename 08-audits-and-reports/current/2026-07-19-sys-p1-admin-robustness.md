# SYS-P1-ADMIN-ROBUSTNESS — Nền tảng test cho Admin CMS

> **Ngày:** 2026-07-19
> **Nhóm:** 08 — Audits & Reports (chính: nhóm 4 Cross-cutting quality; bổ trợ →8)
> **Trạng thái:** ✅ HOÀN TẤT (repo, đã push) — `npm run lint` PASS, `npm test` PASS.
> **Liên quan:** [implementation-plan.md](../../04-implementation/implementation-plan.md) (→8) · [DOCS-TASK-CLASSIFICATION-P1] audit trước đó.

## Mục đích

→8 đã dựng CI cho admin (`lint + build`) nhưng admin **chưa có test tự động nào** — khoảng trống chất lượng lớn nhất còn lại của công cụ biên tập viên dùng hằng ngày. SYS-P1-ADMIN-ROBUSTNESS dựng **nền tảng test + phủ đường đi trọng yếu**, thuần code, không đụng hạ tầng/secret/production.

## Kết quả

- **Harness:** thêm Vitest + React Testing Library (jsdom) vào repo `thien-duc-website-admin`.
  - `vitest.config.ts` (jsdom, alias `@`, `setupFiles`), `src/test/setup.ts` (jest-dom matchers + cleanup).
  - Script mới: `test` = `vitest run`, `test:watch` = `vitest`. **Không** đổi `dev`/`build`/`lint`.
  - Dev deps mới: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`.
- **Kiểm chứng:** `npm run lint` **PASS** (0 lỗi; 1 cảnh báo có sẵn ở `form.tsx`, không do batch này), `npm test` **PASS** — **53 test / 12 file**.

## Phạm vi phủ

| Nhóm | File | Nội dung |
|---|---|---|
| Lib helpers (34 test) | `src/lib/*.test.ts` | `bilingual` (fallback/trim/bỏ EN rỗng), `jwt` (decode + dấu tiếng Việt, malformed→null, hết hạn), `api-error-message`, `auth-error-message` (mọi status, 401 chung), `asset-url`, `labels` (nhãn enum + quy đổi UTC→UTC+7 kể cả qua nửa đêm), `utils/cn` |
| BilingualField | `src/components/ui/BilingualField.test.tsx` | VI hiện trước, chuyển EN, chấm vàng "chưa dịch" hiện/ẩn đúng, `onChange` |
| ProtectedRoute | `src/components/ProtectedRoute.test.tsx` | loading→null, chưa đăng nhập→login, sai quyền→/403, đủ quyền→children, không yêu cầu role→mọi user đã đăng nhập |
| AuthContext | `src/context/AuthContext.test.tsx` | throw ngoài provider, mặc định đăng xuất, login đặt user, logout xóa user |
| LoginPage | `src/pages/LoginPage.test.tsx` | render form khi chưa đăng nhập |
| Page smoke | `src/pages/pages.smoke.test.tsx` | Projects/News/Pages/Contact render `<h1>` với API mock (empty-state), vai trò ADMIN |

## Follow-up hoãn lại

- **Test trực tiếp schema Zod của 6 FormDialog** — hoãn. Các schema (`projectSchema`, `newsSchema`…) là **module-local, chưa export**; test trực tiếp cần thêm `export` vào file nguồn = quyết định testability/nguồn riêng, nằm ngoài phạm vi batch (đã dừng-và-hỏi theo quy tắc). Validation song ngữ bắt buộc hiện được phủ **gián tiếp** qua `BilingualField` + `bilingual.ts`. Cần quyết định có export schema để test trực tiếp không.

## Không làm trong đợt này

Không đổi hành vi runtime; không sửa file nguồn admin (chỉ thêm file test + config harness + `package.json`/lockfile). Không đụng backend/frontend/docs-code, không CI YAML, không production/secret. Ghi chú harness (test-only): mock `@/lib/api/queries` trả `data: undefined` (trang list mặc định `[]`, hook single-entity giữ undefined để `?.` short-circuit) và chặn `then`/symbol trên module mock để tránh Vitest hiểu nhầm là thenable.
