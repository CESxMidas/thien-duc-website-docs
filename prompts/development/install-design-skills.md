# Prompt — Cài skill thiết kế cho dự án Thiên Đức

> **Trạng thái:** Reference (prompt vận hành)
> **Nguồn (di chuyển từ):** `PROMT.MD` (thư mục gốc)

- **Mục đích:** Cài 2 skill `frontend-design` + `ui-ux-pro-max` (cùng bộ 7 skill kèm theo) vào `~/.claude/skills/` cấp personal.
- **Khi nào dùng:** Khi thiết lập máy mới / môi trường AI agent để làm UI cho `thien-duc-website-admin` hoặc `thien-duc-website-frontend`.
- **Input cần cung cấp:** Quyền cài npm global, truy cập internet.
- **Output mong muốn:** Đủ 8 thư mục skill trong `~/.claude/skills/`, mỗi thư mục có `SKILL.md` frontmatter hợp lệ; memory ghi quy ước dùng skill + palette token.

---

## Prompt hoàn chỉnh

Cài 2 skill sau vào ~/.claude/skills/ (cấp personal, dùng được ở mọi project):

1. frontend-design — từ https://github.com/anthropics/skills/tree/main/skills/frontend-design
   Chỉ gồm SKILL.md + LICENSE.txt. Sparse clone repo anthropics/skills rồi copy
   thư mục skills/frontend-design/ vào ~/.claude/skills/frontend-design/.
   Dọn thư mục tạm sau khi xong.

2. ui-ux-pro-max — từ https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
   Cài bằng npm:
   npm install -g ui-ux-pro-max-cli
   uipro init --ai claude --global

   LƯU Ý: nếu lệnh install báo lỗi EEXIST ở đường dẫn .../npm/uipro, nghĩa là
   máy đang có gói cũ `uipro-cli` (đã stale, README của repo bảo đừng dùng).
   Gỡ nó trước bằng `npm uninstall -g uipro-cli` rồi cài lại. Đừng dùng --force.

   Gói này cài ra 7 skill chứ không phải 1: ui-ux-pro-max, design, design-system,
   ui-styling, brand, banner-design, slides. Kiểm tra xem frontend-design có bị
   ghi đè không (không được ghi đè).

Sau khi cài, xác minh:

- ls ~/.claude/skills/ phải thấy đủ 8 thư mục
- mỗi thư mục có SKILL.md với frontmatter hợp lệ (name + description)

Cuối cùng, ghi memory: khi làm UI cho dự án Thiên Đức (cả thien-duc-website-admin
lẫn thien-duc-website-frontend) thì dùng skill frontend-design + ui-ux-pro-max.
Palette thương hiệu đã chốt và khai báo bằng token trong index.css / globals.css
(text-brand, bg-gold, text-ink, text-slate...) — không gõ mã hex trong component,
không đổi palette.
