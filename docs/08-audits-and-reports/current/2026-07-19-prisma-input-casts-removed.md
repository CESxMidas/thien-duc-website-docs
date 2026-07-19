# →12 — Gỡ cast `as unknown as Prisma.*Input`

> **Ngày:** 2026-07-19
> **Nhóm:** 08 — Audits & Reports (chính: nhóm 1 Architecture & engineering depth)
> **Trạng thái:** ✅ HOÀN TẤT (backend, đã push) — typecheck/build/lint/test PASS.
> **Liên quan:** [implementation-plan.md](../../04-implementation/implementation-plan.md) (→12).

## Mục đích

`as unknown as Prisma.*Input` là ép kiểu **hai tầng** → tắt toàn bộ kiểm tra kiểu của payload (kể cả field scalar) ở ranh giới DB. →12 khôi phục type-safety mà **không đổi hành vi runtime**.

## Nguyên nhân gốc

DTO mang field JSON song ngữ (`TranslatedTextDto {vi; en?}`, mảng đoạn, `Record<string, unknown>`, `unknown[]`) ánh xạ sang cột Prisma `Json`. Prop optional `en?: string` sinh `string | undefined` mà `Prisma.InputJsonValue` **không cho phép** → gán trực tiếp fail → mỗi service né bằng ép cả payload.

## Thay đổi

- **Helper mới `src/common/prisma-json.ts`** — `json()` (overload cho required / optional-nullable) ép **một field JSON** sang `Prisma.InputJsonValue`; đây là **điểm ép kiểu JSON duy nhất**, runtime là **identity**.
- **5 service** (banners, cooperation, news, pages, projects) đổi từ ép cả payload sang:
  `data: { ...dto, <field JSON>: json(dto.<field JSON>) } satisfies Prisma.*Input`.
  - `satisfies` kiểm tra lại **mọi field scalar** và **bắt buộc bọc đúng** các field JSON (thiếu/thừa đều báo lỗi biên dịch).
  - Spread `...dto` giữ **mọi field** (không rớt dữ liệu).
  - `projects.update`: `normalizeJsonNulls(dto)` vẫn chạy **trước**, rồi mới bọc giá trị đã chuẩn hóa → `Prisma.DbNull` (xóa field JSON) đi qua nguyên vẹn.
  - `gallery` (`String[]`, **không** phải `Json`) cố ý **không** bọc.

## Kết quả

- **Cast `as unknown as Prisma.*Input`:** trước **14** (banners 2, cooperation 2, news 4, pages 2, projects 4) → sau **0**.
- **Không đổi** Prisma schema, DTO, frontend, admin, CI. **Không** đổi hành vi runtime.
- **Kiểm chứng:** `tsc -p tsconfig.build.json --noEmit` PASS · `nest build` PASS · `eslint` PASS (0 lỗi; 8 cảnh báo **có sẵn** ở `media/cloudinary.service.ts` + `users.service.spec.ts`, ngoài phạm vi) · `jest` **8 suite / 77 test** PASS.

## Không làm trong đợt này

Không đụng frontend/admin/docs-code, không sửa Prisma schema/DTO, không CI, không production/secret.
