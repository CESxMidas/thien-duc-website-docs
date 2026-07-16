# Audit Baseline — Website Thiên Đức vs. tiêu chí "website $10,000"

> **Trạng thái:** Đang dùng (báo cáo hiện hành — mốc baseline mới nhất)
> **Ngày tạo:** 2026-07-16
> **Phạm vi:** Toàn workspace (frontend, admin, backend, docs)
> **Phiên bản đánh giá:** mã nguồn tại 2026-07-16
> **Người thực hiện:** AI audit agent (kết luận dựa trên file thực đọc trong repo)
> **Nguồn (di chuyển từ):** `AUDIT-BASELINE-2026-07-16.md` (thư mục gốc)
> **Tài liệu thay thế/liên quan:** bổ sung cho [security (2026-07-14)](../../05-security/README.md); kế hoạch xử lý ở [implementation-plan](../../04-implementation/implementation-plan.md) mục "Phase tiếp theo — Nâng cấp theo Audit Baseline".

> **Ngày audit:** 2026-07-16
> **Phạm vi:** Toàn workspace (`thien-duc-website-frontend`, `thien-duc-website-admin`, `thien-duc-website-backend`, `thien-duc-website-docs`).
> **Phương pháp:** Mọi kết luận dựa trên file thực đọc trong repo. Chỗ nào không chạy được app (không có DB/browser sống) thì ghi rõ mức độ tin cậy. **Không sửa code** trong lần audit này.
> **Mục đích:** Làm mốc (baseline) cho phase triển khai tiếp theo. Xem checklist việc làm ở [implementation-plan](../../04-implementation/implementation-plan.md) mục "Phase tiếp theo — Nâng cấp theo Audit Baseline".

---

## 1. Executive summary

**Điểm tổng: 60 / 100**

**Có đỡ được định giá $10,000 không? — Có, xét theo phạm vi build; kèm lưu ý về mức độ sẵn sàng production.** Bề mặt kỹ thuật ở đây (ba ứng dụng tách rời, schema quan hệ 13 model, RBAC auth thật với xoay vòng refresh-token, CMS song ngữ đầy đủ, full-text search, đăng bài theo lịch, CI, và cấu hình deploy thật) thực sự nằm trong nhóm $10k+ so với công việc custom của agency. Điểm kéo lại — khiến nó chưa vượt thoải mái ngưỡng $10k — là một số khoảng trống vận hành chưa hoàn thiện hoặc còn ở free-tier: nổi bật nhất là **email thông báo lead mới chỉ là stub**, hạ tầng chạy free-tier ngủ, và chưa có monitoring/backup.

**Điểm mạnh nhất (Verified):**
- Kiến trúc 3 tầng tách rời gọn, API envelope nhất quán và nghiêm ngặt (`backend/src/common/interceptors/response.interceptor.ts`, `backend/src/common/filters/http-exception.filter.ts`).
- Auth nghiêm túc: bcrypt, khóa tài khoản, refresh token hash SHA-256 + xoay vòng + thu hồi, chặn phiên khi tài khoản bị vô hiệu hóa (`backend/src/auth/auth.service.ts`).
- Rò rỉ nội dung nháp/đã đăng đã được vá tường minh ở route công khai (`backend/src/projects/projects.service.ts:64-88`).
- SEO chững chạc: sitemap có `hreflang` alternates, robots `noindex` cho trang mỏng, helper canonical/OG, pipeline `next/image` + Cloudinary WebP.

**Yếu tố kéo giá trị xuống (Verified):**
- **Email thông báo liên hệ chưa cài** — `TODO` ở `backend/src/contact/contact.service.ts:11`. Lead được lưu nhưng không ai được báo.
- **Hạ tầng free-tier**: backend ngủ sau 15 phút, Postgres free hết hạn sau 90 ngày, cron nội bộ không đáng tin (`backend/render.yaml`, [implementation-plan](../../04-implementation/implementation-plan.md)).
- **Chưa có monitoring, error tracking, backup, hay quy trình rollback.**
- **Test tự động mỏng** (chỉ unit test backend; không có FE/admin/e2e).
- **Admin CMS chưa có CI** (chỉ backend + frontend có).

---

## 2. Scored assessment

| # | Hạng mục | Điểm |
|---|----------|------|
| 1 | Architecture & engineering depth | **9 / 10** |
| 2 | Content operations | **9 / 10** |
| 3 | Design & UX quality | **7 / 10** |
| 4 | Performance & SEO | **8 / 10** |
| 5 | Reliability & security | **8 / 10** |
| 6 | Integrations & lead capture | **6 / 10** |
| 7 | Deployment & operations | **6 / 10** |
| 8 | Process & deliverables | **7 / 10** |
| | **Tổng** | **60 / 100** |

---

## 3. Evidence per category

### 1. Architecture & engineering depth — 9/10 · **Verified**
**Làm tốt:** NestJS API + Vite admin + Next.js frontend tách rời. Backend chia module theo domain gọn gàng (`backend/src/app.module.ts`: auth, users, projects, news, pages, banners, cooperation, contact, media, search). Prisma schema mô hình hóa 13 entity với quan hệ đầy đủ, quy tắc cascade/`SetNull`, `@@index`, `@@unique([projectId, slug])`, và 4 enum làm nguồn sự thật (`backend/prisma/schema.prisma`). 7 migration theo thứ tự. Response envelope + exception filter cho mọi client một hợp đồng duy nhất.
**Yếu/thiếu:** Vài service ép kiểu DTO bằng `as unknown as Prisma.*Input` (`backend/src/projects/projects.service.ts:103`), né type-safety ở ranh giới DB.
**Tác động:** Bảo trì tốt, cho phép làm song song; các cast là rủi ro bug tiềm ẩn nhỏ.

### 2. Content operations — 9/10 · **Verified**
**Làm tốt:** Quy trình biên tập đầy đủ — enum `DRAFT → PENDING → PUBLISHED`, duyệt giới hạn ADMIN+ (`@Patch(':slug/status')`, `backend/src/projects/projects.controller.ts:108-118`). Song ngữ `{ vi, en? }` JSON trên mọi field chữ. Đăng theo lịch bằng cron single-UPDATE idempotent, an toàn đồng thời (`backend/src/news/news-scheduler.service.ts`). Thư viện ảnh, banner, trang, dự án hợp tác đều có CRUD. Docs xác nhận admin đã nối API thật 100%, đã xóa mock.
**Yếu/thiếu:** Bản dịch tiếng Anh **phần lớn chưa nhập** (chặn go-live theo [implementation-plan](../../04-implementation/implementation-plan.md)); trang `gioi-thieu`/`lien-he` chưa seed (FE lùi về copy tĩnh). Đây là khoảng trống nhập liệu, không phải code.
**Tác động:** CMS thật và vận hành được; chỉ là chưa được đổ đầy nội dung.

### 3. Design & UX quality — 7/10 · **Partially Verified**
**Làm tốt:** Bảng màu tokenized qua `@theme` (theo AGENTS.md, không hex trong component), shadcn/ui ở admin, `next/image` dùng ở 16 file với **0 `<img>` thô**, và thuộc tính accessibility hiện diện ở quy mô lớn (42 `aria-hidden`, 30 `aria-label`, 8 `aria-current`, `aria-expanded`, `aria-invalid`). Routing song ngữ qua segment `[locale]`.
**Yếu/thiếu:** **Không thể xác minh chất lượng hiển thị thực tế, hành vi responsive, hay tỉ lệ tương phản màu** nếu không chạy app và soi DOM/CSS — cần browser. `alt=` chỉ xuất hiện ở 16 chỗ; chưa xác nhận được mọi ảnh trang trí vs. thông tin đã xử lý đúng.
**Tác động:** Tín hiệu mạnh về một design system có chủ đích và a11y nền tảng, nhưng câu hỏi "trông và cảm giác có đáng $10k không" thì không verify được bằng code ở đây.

### 4. Performance & SEO — 8/10 · **Verified**
**Làm tốt:** `frontend/src/app/sitemap.ts` phát URL canonical VI kèm `hreflang` alternates và `lastModified` theo từng entity; `frontend/src/app/robots.ts` chặn trang placeholder mỏng ở cả hai locale và trỏ tới sitemap; `buildAlternates`/`buildPageMetadata` gom canonical + OG + Twitter (`frontend/src/lib/seo.ts`); 14 file khai báo metadata; trang mỏng bị `noindex` và loại khỏi sitemap. Ảnh tối ưu hai lớp — Cloudinary transform ≤1200px WebP `quality:auto:good` (`backend/src/media/cloudinary.service.ts:16-20`) cộng `next/image`.
**Yếu/thiếu:** **Structured data tối thiểu** — JSON-LD chỉ có cho `BreadcrumbList` (`frontend/src/components/ui/breadcrumb.tsx:21-37`); chưa có `Organization`, `LocalBusiness`, `Article`, hay `RealEstateListing`. Không có bằng chứng Core Web Vitals runtime (không đo được tĩnh).
**Tác động:** On-page SEO xuất sắc; đang bỏ phí rich-result schema cho một thương hiệu bất động sản.

### 5. Reliability & security — 8/10 · **Verified**
**Làm tốt:** `helmet()` bật; **CORS từ chối khởi động nếu không có origin tường minh** (không fallback wildcard — `backend/src/main.ts:16-25`); `ThrottlerGuard` toàn cục (100/phút) cộng throttle theo route (login 5/phút, refresh 10/phút — `backend/src/auth/auth.controller.ts`, contact 5/giờ — `backend/src/contact/contact.controller.ts:27`); `ValidationPipe` với `whitelist + forbidNonWhitelisted`; `$queryRaw` tham số hóa với `plainto_tsquery` vô hiệu hóa injection toán tử FTS (`backend/src/search/search.service.ts`); secret nằm phía server; Cloudinary lùi về 503 thay vì crash khi chưa cấu hình. Đáng chú ý: **các finding trong security-audit của chính repo ([findings-summary](../../05-security/findings-summary.md), 2026-07-14) phần lớn đã được vá** trong code hiện tại (CORS, login throttle, SQLi, CSP đều đã có).
**Yếu/thiếu (Verified, còn mở):**
- **Contact DTO không có `MaxLength`** (`backend/src/contact/dto/create-contact-submission.dto.ts`) → DoS bằng payload lớn (finding #9, còn mở).
- **JWT lưu localStorage** (`admin/src/lib/api/client.ts:8-9`) → XSS có thể lấy token (finding #10; trade-off đã biết của SPA).
- **CSP đang Report-Only và cho phép `unsafe-inline`/`unsafe-eval`** (`frontend/next.config.ts`) → chưa enforce.
- Chưa có WAF, chưa có error tracking runtime.
**Tác động:** Trên mức bảo mật site SMB thông thường; các mục mở là hardening, không phải lỗ hổng mở toang.

### 6. Integrations & lead capture — 6/10 · **Verified**
**Làm tốt:** Contact submission lưu kèm IP, workflow trạng thái (`NEW/IN_PROGRESS/DONE`), và endpoint quản lý cho admin (`backend/src/contact/contact.controller.ts`); docs xác nhận đường POST→DB chạy thật trên production. Tích hợp Cloudinary upload thật, có validate MIME/size và xử lý thư mục chống path-traversal. Full-text search đã có.
**Yếu/thiếu:** **Email thông báo là `TODO`** (`backend/src/contact/contact.service.ts:11`) — biến môi trường SMTP đã khai trong `backend/render.yaml` nhưng chưa có code mailer. Không thấy tích hợp analytics.
**Tác động:** Chi phí kinh doanh trực tiếp — lead gửi vào có thể nằm im tới khi ai đó mở admin. Với site bất động sản hướng bán hàng, đây là khoảng trống giá trị cao nhất.

### 7. Deployment & operations — 6/10 · **Verified**
**Làm tốt:** IaC qua blueprint `backend/render.yaml` (tự tạo Postgres + web service, sinh JWT secret, chạy `prisma migrate deploy` trước khi start, `healthCheckPath: /api`, `autoDeploy`); Vercel cho FE; `.env.example` ở cả ba project; tài liệu ở [deployment-guide](../../07-deployment/deployment-guide.md).
**Yếu/thiếu:** **Free tier** — backend ngủ sau 15 phút (request đầu 30–50s, có thể timeout form FE), Postgres free hết hạn sau 90 ngày, `@Cron` nội bộ không đáng tin nên cần pinger ngoài (đều ghi ở [implementation-plan](../../04-implementation/implementation-plan.md)). **Admin không có CI**, không cấu hình backup DB, không monitoring/log aggregation/error tracking, không quy trình rollback, một môi trường duy nhất (không staging).
**Tác động:** Deploy được và tái lập được, nhưng chưa đạt mức vận hành production-grade cho doanh nghiệp phụ thuộc uptime.

### 8. Process & deliverables — 7/10 · **Verified**
**Làm tốt:** Tài liệu mạnh bất thường — [implementation-plan](../../04-implementation/implementation-plan.md) sống theo sprint, [ui-ux-handoff](../../03-ui-ux/ui-ux-handoff.md), [deployment-guide](../../07-deployment/deployment-guide.md), thư mục security-audit riêng, và báo cáo kỹ thuật `.docx`. CI gate lint+build+test ở backend và lint+build ở frontend. Docs khẳng định `tsc`/`eslint` sạch 0/0.
**Yếu/thiếu:** **Test coverage mỏng và chỉ ở backend** — 7 file `.spec.ts` (auth, users, search, app, main); **không có test component FE, không test admin, e2e chưa dựng** dù script `test:e2e` tồn tại. Admin không có CI job.
**Tác động:** Tài liệu cho người rất tốt và kỷ luật type/lint tốt; an toàn regression tự động còn nhẹ so với quy mô nền tảng.

---

## 4. Technical validation summary

| Khu vực | Kết quả | Confidence |
|---------|---------|-----------|
| Schema / relations / enums / migrations | 13 model, cascade+index+unique, 4 enum, 7 migration | Verified |
| Auth, refresh rotation, lockout, role guards | bcrypt + refresh token hash xoay vòng + revoke + `JwtAuthGuard`/`RolesGuard`/`@Roles` | Verified |
| Draft vs published protection | `publishedOnly` enforce ở mọi route công khai | Verified |
| API validation & error handling | `whitelist+forbidNonWhitelisted`, trùng→409, global filter | Verified |
| CMS + bilingual | Workflow đầy đủ + `{vi,en}` JSON; nội dung EN chưa nhập | Verified |
| Responsive & a11y | aria attrs + `next/image`, không `<img>` thô; visual/contrast không chạy được | Partially Verified |
| Metadata / sitemap / robots / canonical / structured data / image opt | Có đủ trừ rich JSON-LD (chỉ breadcrumb) | Verified |
| CORS / rate limiting / secrets / data exposure | CORS không wildcard, throttle nhiều lớp, secret chỉ ở server | Verified |
| Contact persistence + email | Lưu ✅; **email = TODO** ❌ | Verified |
| CI/CD / envs / backups / monitoring / rollback | CI (BE+FE) + IaC ✅; không admin CI, không backup/monitoring/rollback ❌ | Verified |
| Tests / lint / types / docs | Chỉ unit test backend; docs mạnh; lint/type được gate | Verified |

---

## 5. Prioritized improvement plan

**Critical (trước production):**
1. Cài email thông báo form liên hệ (SMTP mailer) — `backend/src/contact/contact.service.ts:11`.
2. Rời free tier hoặc thêm uptime pinger + Postgres plan thật; cấu hình backup DB tự động.
3. Thêm `@MaxLength` cho mọi DTO chữ tự do (contact và tương tự).
4. Nhập bản dịch tiếng Anh còn thiếu (chặn go-live song ngữ).

**High-value (củng cố định giá $10k):**
5. Thêm error tracking + uptime monitoring (vd. Sentry + health monitor).
6. Enforce CSP (bỏ `unsafe-inline`/`unsafe-eval`, rời Report-Only).
7. Thêm JSON-LD `Organization`/`LocalBusiness` + `Article`/`RealEstateListing`.
8. Thêm CI job cho admin; thêm test frontend + một e2e smoke test mỏng.

**Optional enhancements:**
9. Cân nhắc auth bằng cookie HttpOnly để bỏ rủi ro XSS lấy token khỏi localStorage.
10. Môi trường staging; WAF (Cloudflare) đứng trước API.

**Quick wins:**
11. Seed trang `gioi-thieu`/`lien-he` để vòng CMS→web chạy thật end-to-end.
12. Thay các cast `as unknown as Prisma.*Input` bằng input có kiểu.

---

## 6. Final verdict

- **Định giá hiện tại thực tế: ~$9,000 – $13,000.** Được củng cố bởi phạm vi kỹ thuật đã verify (ba app, auth vững, CMS thật có workflow + i18n + scheduling, SEO mạnh, IaC deploy sống), trừ đi phần thiếu đường thông báo lead, ops free-tier, và coverage test nhẹ.
- **Sau khi vá các gap lớn: ~$15,000 – $22,000.** Email thông báo, hạ tầng trả phí + có monitor, CSP enforce, structured data giàu hơn, và test rộng hơn sẽ đưa nó từ "làm tốt" sang "vận hành đáng tin".
- **Cơ sở bằng chứng:** mọi khẳng định trọng yếu đều trích dẫn file cụ thể; hai kết luận không verify được bằng code (chất lượng hiển thị, performance sống) được đánh dấu Partially Verified và cố ý không tính vào cột nâng điểm.

**Phân loại: một *website custom chuyên nghiệp* đứng ngay ngưỡng của một *nền tảng nghiệp vụ production-grade*.** Rõ ràng **không** phải template — schema, auth, và CMS chứng minh kỹ thuật custom thật. Chưa đạt "production-grade platform" thuần túy vì độ chín vận hành (monitoring, backup, hạ tầng trả phí) và một tích hợp nghiệp vụ chưa xong (email lead), chứ không phải vì kiến trúc.
