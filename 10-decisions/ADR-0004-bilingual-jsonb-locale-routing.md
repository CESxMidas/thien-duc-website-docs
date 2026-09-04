# ADR-0004 — Song ngữ JSONB {vi,en} + locale routing (VI không tiền tố)

- **Trạng thái:** Accepted
- **Ngày:** 2026-07-16 (ghi nhận; xác nhận ở câu 19)
- **Nguồn:** [open-questions](../01-requirements/open-questions.md) câu 19; [implementation-plan](../04-implementation/implementation-plan.md) Sprint 4

## Bối cảnh

Công ty xác nhận **song ngữ Việt/Anh là BẮT BUỘC ở go-live**. Cần lưu nội dung 2 ngôn ngữ và định tuyến URL cho từng ngôn ngữ.

## Quyết định

- **Lưu dữ liệu:** field text trong Prisma là JSON `{ vi, en? }` (`TranslatedTextDto`). Mapper FE đọc theo locale, **tự fallback về `.vi`** khi `.en` trống.
- **Routing:** tiếng Việt **không tiền tố** (`/du-an` giữ URL production), tiếng Anh **có tiền tố** (`/en/du-an`); `/vi/...` redirect 308 về bản không tiền tố (một URL chính tắc).
- **Next.js 16:** logic rewrite/redirect ở `src/proxy.ts` (thay `middleware.ts`).

## Hệ quả

- ✅ Đổi nội dung không cần đổi cấu trúc bảng; SEO có `hreflang` alternates + `x-default`.
- ⚠️ **Chặn go-live:** hạ tầng + công cụ nhập liệu đã xong nhưng **mọi field `.en` trong DB còn trống** → trang `/en/...` đang lùi về tiếng Việt. Cần biên tập viên nhập bản dịch (không tự chế nội dung).
- ⚠️ Tìm kiếm dùng ts config `simple` (không bỏ dấu) — gõ không dấu chưa ra kết quả có dấu (hạn chế đã biết).
