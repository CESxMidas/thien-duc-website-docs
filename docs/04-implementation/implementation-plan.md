# Kế hoạch triển khai — Website Thiên Đức (PA2)
 
> **Trạng thái:** Tài liệu sống — nguồn sự thật cho tiến độ coding.
> **Nhóm:** 04 — Implementation · **Current as of: 2026-07-23**
> **Tài liệu liên quan:** [open-questions](../01-requirements/open-questions.md) · [deployment-guide](../07-deployment/deployment-guide.md) · [security](../05-security/README.md) · [audit-baseline](../08-audits-and-reports/current/2026-07-16-audit-baseline.md)
>
> Cấu trúc: §0 hiện trạng · §1 tóm tắt đã xong · §2 code đang chờ làm · §3 manual/go-live · §4 deferred · §5 backlog nội dung · §6 backlog tùy chọn · §7 changelog/audit trail.
> Quy ước trạng thái: `[ ]` chưa làm · `[~]` đang làm · `[x]` xong. Mã truy vết: `→n` (audit-baseline), `ED/YC/CL/KB-xx` (báo cáo gốc), `SEC-*` (security). Việc phụ thuộc công ty ghi **(chờ input câu n)**.

## Section 0 — Current status summary

- **Tính năng website + CMS: gần như hoàn tất.** FE public (Next.js/Vercel), Admin CMS (Vite), Backend (NestJS/Prisma/Postgres trên Render) đã chạy thật end-to-end; toàn bộ Admin đã nối API thật, song ngữ VI/EN cho nội dung production/audited đã xong. Chi tiết: **§1** + ledger **§7**.
- **Production-readiness: CHƯA hoàn tất — cố ý hoãn.** 🟠 **Cổng go-live BLOCKED/DEFERRED** (G7-M1, [note](../08-audits-and-reports/current/2026-07-19-g7-m1-manual-ops-verification.md)): hạ tầng còn Free/chưa xác nhận (backend + Postgres Free; backup/PITR + restore + monitoring chưa bật). Nâng plan trả phí + monitoring **bắt buộc trước go-live cuối**. Checklist: **§3**.
- **Số checkbox mở ≠ số việc code đang mở.** Nhiều `[ ]` mở là *manual ops / deferred / backlog*, không phải hàng đợi coding (di sản của lần chuyển văn xuôi→checkbox, xem [CHECKBOX-AUDIT-M1](#section-7--changelog--audit-trail)).
- **Việc code đang mở thật sự: 3** — **→6 Enforce CSP** (§2, **HOÃN** tới khi monitoring active), **Forgot Password** (§2, việc code kế tiếp — mở ra sau CMS-ACCOUNT-INVITATION-PHASE3C) và **retire `POST /users`** (§2, dọn dẹp sau khi luồng lời mời ổn định). Đợt hardening phân quyền/bảo mật 2026-07-22 đã đóng: R1 media-delete, R2 banner governance, R3 users read-only lock-in, TRUSTED-PROXY-RATE-LIMIT-FIX-M1, ADMIN-SPA-SECURITY-HEADERS-M1 (ledger §7). Coding/security còn lại đều deferred: CSP enforce (§2, chờ monitoring) + Auth HttpOnly (§4, post-launch). Các mục mở khác: manual/go-live (§3), deferred infra (§4), backlog tùy chọn (§6). Backlog nội dung (§5) phần code/CMS đã xong, chỉ chờ công ty nhập liệu.

## Section 1 — Completed work summary

> Tóm tắt theo workstream (không lặp từng phiên chat). Ledger chi tiết + mã truy vết ở **§7**.

- **1. Integrations / lead capture** — Form liên hệ `POST /contact` (rate-limit 5/IP/giờ, honeypot, validate) + email báo lead **Resend-only** chạy thật production; trang quản lý lead ở Admin. (→1, YC-09)
- **2. Content ops / CMS** — CRUD đầy đủ projects / news / pages / banners / cooperation + luồng nháp→duyệt→đăng; Admin 8+ trang nối API thật, `BilingualField` nhập VI/EN; seed pages/projects/news. (→4, →11, ED-03/04/06/07)
- **3. Frontend UI/UX** — Đồng nhất bố cục dự án theo chuẩn Hưng Phú, carousel hạng mục, gallery có điều kiện, cơ cấu lại trang chủ↔giới thiệu chống trùng lặp, redesign typography (Playfair + Be Vietnam Pro), footer. (FRONTEND-UI-POLISH-M1, PROJECT-GALLERY-IMAGES-FIX-M1)
- **4. SEO / structured data / performance** — canonical + hreflang + sitemap/robots, JSON-LD Organization/NewsArticle/Breadcrumb, baseline đo production (Rich Results + Lighthouse), fix NO_FCP/NO_LCP. (→7, →13, YC-12)
- **5. Security / validation / roles** — 3 HIGH findings đóng (CORS, rate-limit, SQL-inj), HTTP security headers, `@MaxLength` toàn bộ DTO chữ, 3 cấp role, SUPER_ADMIN đăng ngay. (→3, SEC-*, ADMIN-SUPER-ADMIN-GLOBAL-APPROVAL-BYPASS-M1)
- **6. Deployment / monitoring docs** — `render.yaml` khai plan trả phí; runbook backup-restore / rollback / monitoring-and-alerting; Sentry cả 3 app (errors-only, no-op khi thiếu DSN). (→2, →5)
- **7. Testing / CI / process** — CI lint+build cả 3 repo + e2e backend; test FE (Jest) + Admin (Vitest); ENV cleanup, tách secret khỏi Git. (→8, SYS-P1-ADMIN-ROBUSTNESS, SMTP-REMOVAL-ENV-CLEANUP)
- **8. Media / Cloudinary / gallery** — Upload/optimize Cloudinary (WebP≤1200px, chống path-escape), hiển thị ảnh Cloudinary trên production, gallery lấy ảnh cấp dự án. (→ ED-05, PROJECT-IMAGES-UI-FIX-M1, PROJECT-GALLERY-IMAGES-FIX-M1)
- **Process** — Kiểm đếm & làm sạch checkbox của plan (IMPLEMENTATION-PLAN-CHECKBOX-AUDIT-M1, 2026-07-21).

## Section 2 — Active coding tasks

> Chỉ việc code actionable kế tiếp. Manual ops / backlog / ý tưởng tương lai **không** để ở đây.

- [ ] **(→6) Enforce CSP — bỏ Report-Only** · *Nhóm 5* · phiên: **SEC-CSP-ENFORCE-M1**
  - `frontend/next.config.ts` đang `Content-Security-Policy-Report-Only`, còn `unsafe-inline`/`unsafe-eval`.
  - Theo dõi report → chuyển sang `Content-Security-Policy`, thay `unsafe-*` bằng nonce/hash Next.js. Làm **sau** →5 (monitoring); khi enforce thêm domain ingest Sentry vào `connect-src`. Cập nhật `next.config.spec.ts` theo header mới.
  - **Trạng thái (SECURITY-CODING-REMAINING-AUDIT-M1, 2026-07-22): vẫn HOÃN** cho tới khi monitoring/Sentry DSN active (§3). Gồm cả CSP cho Admin SPA (đã có header cơ bản ở `admin/vercel.json`, còn CSP để pass sau). Chỉ prep (kiểm kê nguồn `script-src`/`connect-src`) là làm trước được.

- [ ] **Forgot Password (tự đặt lại mật khẩu)** · *Nhóm 5* · phiên: **CMS-FORGOT-PASSWORD-M1** — **việc code kế tiếp.** Sau PHASE3C (§7), SUPER_ADMIN không còn đặt được mật khẩu hộ ai, nên người dùng quên mật khẩu **hiện không có lối tự phục hồi**. Cần luồng token một lần (dùng lại mẫu `generateOpaqueToken` + chỉ lưu `tokenHash` của invitation), trang đặt lại ở Admin, rate-limit, và thu hồi phiên sau khi đổi.
- [ ] **Retire `POST /users` (tạo tài khoản kèm mật khẩu)** · *Nhóm 5* · phiên: **CMS-RETIRE-DIRECT-USER-CREATE-M1** — route cũ vẫn **reachable** ở backend (`CreateUserDto` còn field `password`, SUPER_ADMIN-only), dù Admin UI đã chuyển hẳn sang `POST /users/invitations` và không còn gọi. Gỡ route + DTO + service `create()` sau khi luồng lời mời chạy ổn định trên production (đã ghi chú sẵn trong `users.controller.ts`).

## Section 3 — Manual production / go-live tasks

> Thao tác tay ngoài repo (Dashboard Render/Vercel/Sentry/UptimeRobot, DNS) — repo không làm thay được. **Go-live BLOCKED/DEFERRED cho tới khi xong.**

- [ ] **Render paid plan + backup/PITR + restore drill + rollback drill** — áp plan trả phí (`render.yaml`: web `starter` always-on, Postgres `basic-256mb`) + thanh toán khi sync Blueprint; nếu không nâng tại chỗ → di trú theo runbook **trước mốc 90 ngày**; xác nhận backup daily/retention/PITR; kiểm thử khôi phục 1 lần; diễn tập rollback 1 lần. Runbook: [backup-and-restore](../07-deployment/backup-and-restore.md) · [rollback-plan](../07-deployment/rollback-plan.md). (→2)
- [ ] **Sentry DSN + UptimeRobot monitors** — tạo 3 project Sentry + dán 3 DSN (backend `SENTRY_DSN` / frontend `NEXT_PUBLIC_SENTRY_DSN` / admin `VITE_SENTRY_DSN`) vào Render/Vercel rồi redeploy; tạo 2 monitor UptimeRobot (`/api` + trang chủ). Checklist: [monitoring-and-alerting](../07-deployment/monitoring-and-alerting.md). (→5)
- [ ] **ED-08 cron ngoài gọi `publish-scheduled`** — Render free ngủ sau 15′ nên `@Cron` nội bộ không đủ; đặt UptimeRobot/cron-job.org gọi `POST /api/news/publish-scheduled` (token ADMIN). Nếu đã always-on ở →2 thì cron nội bộ chạy — vẫn nên có cron ngoài.
- [ ] **DNS / HTTPS / domain chính thức** — **(chờ input câu 10)**.
- [ ] **Áp migration production có chủ ý** — `prisma migrate deploy` lên Render (`20260710120000_add_fulltext_search` + `20260711120000_add_cooperation_projects` chưa áp production); chạy lại seed đã sửa nếu cần (`SEED_CONFIRM_PRODUCTION=yes`).
- [ ] **UAT thủ công** — Editor + Admin thật trên toàn luồng (đăng nhập, soạn bài, duyệt, form liên hệ, upload ảnh), gồm bấm tay `BannerFormDialog` / `PageFormDialog` / `BilingualField`.
- [ ] **Chạy checklist nghiệm thu go-live đầy đủ** (mục 3.3 báo cáo / mục 4 `ke-hoach-thien-duc.md`).
- [ ] **k6 / load test** 50–100 người đồng thời (CL-04/05) + Lighthouse staging (CL-02, SEO≥90 CL-10) + test khôi phục backup DB (CL-09).
- *Xác nhận nội dung hết placeholder (chờ input câu 1–8)* — con trỏ, không phải checkbox riêng; mục canonical ở **§5 "Xác nhận hết placeholder"** (gỡ slug khỏi `placeholderPaths` trong `seo.ts`).

## Section 4 — Deferred security / infrastructure

> Việc kỹ thuật tương lai, **không active**; phụ thuộc ngân sách / đánh đổi độ phức tạp. Không chặn go-live cơ bản.

- [ ] **(→9) Auth bằng cookie HttpOnly** · *Nhóm 5* — token đang ở localStorage (`admin/src/lib/api/client.ts`); HttpOnly loại rủi ro XSS lấy token (đổi lại phải xử lý CSRF). Việc lớn FE+BE. (Finding #10). **Trạng thái (SECURITY-CODING-REMAINING-AUDIT-M1, 2026-07-22): HOÃN sang post-launch** — scope luồng auth lớn (phát hành cookie + CSRF + refresh), rủi ro cao nếu làm sát production; Finding #10 mức LOW (trade-off SPA). Ưu tiên header cơ bản (đã xong ADMIN-SPA-SECURITY-HEADERS-M1) thay vì đổi luồng auth trước bàn giao.
- [ ] **(→10) Môi trường staging + WAF** · *Nhóm 7* — staging verify trước khi lên thật; WAF (Cloudflare trước API) chắn DDoS/scan. Phụ thuộc ngân sách.

## Section 5 — Content backlog / business input

> Phần **code/CMS đã sẵn sàng** — các mục dưới đánh `[x]` cho phạm vi kỹ thuật; việc còn lại là **công ty nhập liệu/duyệt nội dung**, **không chặn tiến độ code**. Đổ dữ liệu thật vào là trang tự hiện.

- [x] **Câu 4 — tuyển dụng / `openPositions`** · *Nhóm 2* — `data/careers.ts` + trang `tuyen-dung` dựng khung đầy đủ; `openPositions` **cố ý rỗng**, trang hiện "chưa có vị trí" + `noindex`. Đổ vị trí thật vào mảng là hiện.
- [x] **Câu 5 — chính sách NS / đào tạo / sơ đồ tổ chức** · *Nhóm 2* — 3 trang `dao-tao`, `chinh-sach-nhan-su`, `so-do-to-chuc-cong-ty` dựng khung + i18n (EN-SITE-WIDE F3), giữ `noindex`. Backlog nội dung tương lai.
- [x] **3 dự án seed/dev chờ publish** — `chung-cu-la-bonita`, `du-an-vung-tau` (Silver Sea Tower), `du-an-bay-hien` (Bảy Hiền Tower): chỉ trong `prisma/seed-projects.js`, **không có trong CMS production** (chỉ `khu-do-thi-hung-phu`). Nếu publish lên CMS phải nhập bản dịch EN **trước khi publish** (editor đã kiểm chứng — [ADMIN-ITEM-CONTENT-P2 M1](../08-audits-and-reports/current/2026-07-19-admin-item-content-p2-batch-m1.md)).
- [x] **Xác nhận hết placeholder** — các trang còn `noindex` (`tuyen-dung`, `dao-tao`, `chinh-sach-nhan-su`, `so-do-to-chuc-cong-ty`); gỡ slug khỏi `placeholderPaths` trong `seo.ts` khi có nội dung thật. Liên đới go-live: **§3**.
- [x] **Ảnh thật cho dự án** — cần ≥4 ảnh/dự án (upload qua Admin) để `ProjectPhotoStrip` chạy slide. Ảnh Vista Verde / Feliz en Vista / Hưng Phú Mall thuộc bản quyền CapitaLand/bên thứ ba — **công ty phải cung cấp**. Cần công ty duyệt nội dung pháp lý dự án trước go-live (câu 2).

## Section 6 — Optional backlog

> Nice-to-have / cải tiến tương lai. Không chặn go-live. Không nhầm với việc active. Nguồn chi tiết ở ledger §7.

- [x] **Tìm kiếm bỏ dấu (`unaccent`)** · *Nhóm 1/4* — bật extension `unaccent` + bọc `unaccent()` trong hai hàm `*_search_document` (migration mới + `CREATE EXTENSION unaccent`, xác nhận Render cho phép). (YC-10)
- [ ] **Sentry source map upload** · *Nhóm 8* — `SENTRY_AUTH_TOKEN` + build step upload để stack trace production đọc được. Tách riêng khỏi →5.
- [ ] **Backup off-site tự động** · *Nhóm 7* — script `pg_dump` + lịch + kho ngoài (bổ sung cho Render managed backup). Tách riêng khỏi →2.
- [ ] **G4 — tối ưu hiệu năng còn lại** · *Nhóm 4* — (a) trang chủ mobile LCP 4.3s → tối ưu ảnh banner; (b) TBT 211–317ms trang dự án mobile (theo dõi); (c) `validator.schema.org` xác nhận `Organization`; (d) PSI web re-check sau fix NO_FCP. (→13)
- [ ] **Schema.org mở rộng** (`RealEstateListing`/`Product`/`LocalBusiness`/`sameAs`) · *Nhóm 4* — khi công ty mở bán (có giá/offer), có `openingHours`/`geo`, hoặc cung cấp URL mạng xã hội. (→7)
- [ ] **Test Zod schema 6 FormDialog (Admin)** · *Nhóm 8* — schema module-local, cần quyết định export/testability; hiện phủ gián tiếp qua `BilingualField`/`bilingual.ts`. (SYS-P1-ADMIN-ROBUSTNESS)

---

## Section 7 — Changelog / audit trail

> Ledger nén các việc đã hoàn tất, giữ mã truy vết + link báo cáo. **Không lặp mô tả dài đã tóm ở §1.** Dates chỉ giữ khi hữu ích cho lịch sử. Các mục con của một task được gộp thành một dòng.

### Phiên gần đây (2026-07-20 → 21)

- [x] **PROJECT-GALLERY-IMAGES-FIX-M1** — bố cục gallery+hạng mục có điều kiện (`showGalleryUnderMain = items>0 && gallery>0`: ảnh chính → `ProjectPhotoStrip` gallery cấp dự án → hạng mục); gallery ưu tiên `galleryImages` **chỉ ảnh cấp dự án** (`projectItemId null`), fallback `gallery` phẳng; thêm `mapProjectGallery` + test. **Kiểm chứng thủ công 2026-07-21: PASS** (3 case, không render trùng, ảnh cấp dự án, mobile OK). Commit `8cf7d0f`.
- [x] **PROJECT-IMAGES-UI-FIX-M1** — hiển thị ảnh Cloudinary production: `next.config.ts` khai `images.remotePatterns` cho `res.cloudinary.com` + CSP `img-src`; `next.config.spec.ts` cập nhật. Commit `2075d36`, `adee50b`.
- [x] **ADMIN-SUPER-ADMIN-GLOBAL-APPROVAL-BYPASS-M1** — helper `backend/src/common/content-approval.ts` (`canBypassApproval`/`initialContentStatus`): `SUPER_ADMIN` tạo nội dung `PUBLISHED` ngay, `ADMIN`/`EDITOR` vào `DRAFT`; nối projects/news/pages/cooperation + test. Commit backend `ee254af`, admin `aa32059`.
- [x] **ADMIN-CONTENT-STATUS-WORKFLOW-CONSISTENCY-M1** — chuẩn hóa luồng đổi trạng thái đồng nhất 4 module (News/Projects/Pages/Cooperation). Backend: thêm `assertContentStatusTransition` (chốt mịn sau `RolesGuard`) — `EDITOR` chỉ được gửi duyệt `DRAFT→PENDING`, `ADMIN`/`SUPER_ADMIN` đặt trạng thái tùy ý; route `.../status` mở cho `EDITOR` nhưng service chặn 403 nếu vượt quyền; 4 service nhận `actorRole`. Admin: cả 4 module dùng chung `contentStatusActions` (bỏ gate `canApprove` ở Projects, thay toggle DRAFT↔PUBLISHED ở Pages/Cooperation bằng bậc thang). Sửa News hết lỗi nút "Gửi duyệt" của EDITOR trả 403. Test backend (helper + News updateStatus theo vai trò) + admin helper. **Chưa kiểm chứng thủ công.**
- [x] **ADMIN-CONTENT-WORKFLOW-BUSINESS-RULE-AUDIT-M1** — **Quy tắc nghiệp vụ chốt cuối: Option B** (công ty nhỏ, ít quản trị viên). Áp dụng đồng nhất cho **News · Projects · Pages · Cooperation**:
  - **EDITOR**: `DRAFT → PENDING` (nút "Gửi duyệt") — **không** được đăng thẳng.
  - **ADMIN**: `DRAFT → PUBLISHED` đăng thẳng (nút "Đăng ngay"); `PENDING → PUBLISHED` (nút "Duyệt & đăng"); `PENDING/PUBLISHED → DRAFT` (nút "Trả về nháp"); duyệt được nội dung EDITOR gửi lên — **không** phải tự gửi duyệt bản nháp của mình.
  - **SUPER_ADMIN**: toàn quyền luồng nội dung — `DRAFT → PUBLISHED` đăng thẳng, duyệt/trả về nháp; `create` vẫn xuất bản ngay ở nơi có bypass.

  Ghi chú triển khai:
  - **Backend runtime đã cho phép sẵn `ADMIN DRAFT → PUBLISHED`** (`assertContentStatusTransition` để ADMIN/SUPER_ADMIN đặt trạng thái tùy ý) — Option B **không thêm thay đổi runtime backend nào**.
  - Option B chỉ cần **cập nhật helper UI admin** `content-status-actions.ts`: nhánh `DRAFT` dùng `canApproveRole` (ADMIN+) → "Đăng ngay" thay vì "Gửi duyệt"; gỡ `canBypassRole` không còn dùng. Các trang module không đổi (đã render theo helper).
  - **Thay đổi backend chỉ là test** (`content-approval.spec.ts` thêm khẳng định `ADMIN DRAFT → PUBLISHED` không ném lỗi) để khóa hợp đồng; không đụng route/service.
  - Cập nhật test admin `content-status-actions.test.ts` (ADMIN nháp → "Đăng ngay"/PUBLISHED).
  - Kiểm định: Admin `lint`/`vitest 62`/`build` xanh; Backend `tsc`/`lint`/`jest 103`/`build` xanh.
  - **Redeploy admin: BẮT BUỘC** (đổi logic UI). **Redeploy backend: chỉ cần vì các thay đổi runtime backend của M1 vẫn chưa commit** — bản thân Option B không thêm runtime backend. **Chưa kiểm chứng thủ công.**
- [x] **IMPLEMENTATION-PLAN-CHECKBOX-AUDIT-M1** (2026-07-21) — kiểm đếm & làm sạch checkbox: xác định `[ ]` tăng 11→22 là do PLAN-RESTRUCTURE-M1 đổi văn xuôi→checkbox (không phải việc mới; git `c65787d`); giải trùng cặp placeholder; ghi nhận 3 việc phiên gần đây. Tiếp nối bằng **FINAL-RESTRUCTURE-M2** (2026-07-21) — gom toàn bộ về cấu trúc §0–§7 này.
- [x] **Email Resend-only closeout** (2026-07-20) — SMTP fallback gỡ khỏi code, `SMTP_*` gỡ khỏi Render, Gmail App Password thu hồi. Notes: [EMAIL-RESEND-CLOSEOUT](../08-audits-and-reports/current/2026-07-20-email-resend-closeout.md), [SMTP-REMOVAL-ENV-CLEANUP](../08-audits-and-reports/current/2026-07-20-smtp-removal-env-cleanup.md).
- [x] **FRONTEND-UI-POLISH-M1** — commit `85d5fb1` "Fix UI UX FRONT END" (Nhóm 3+4).

### Phiên 2026-07-23 — Luồng lời mời tài khoản (CMS-ACCOUNT-INVITATION)

- [x] **CMS-ACCOUNT-INVITATION-PHASE3C-REMOVE-ADMIN-PASSWORD-EDIT-M1** — gỡ nốt khả năng SUPER_ADMIN tự đặt mật khẩu cho tài khoản khác. Phase 3B mới bỏ ô mật khẩu ở nhánh **tạo mới**; nhánh **sửa** vẫn giữ ô "Mật khẩu mới" sau `{isEdit && …}`, và cả chuỗi phía sau còn sống (`UpdateUserInput.password` → `PATCH /users/:id` → `UpdateUserDto extends PartialType(CreateUserDto)` → `UsersService.update()` băm vào `passwordHash`).
  - **Admin**: `UserFormDialog` bỏ ô "Mật khẩu mới", state/validate/helper text "Để trống nếu không muốn đổi mật khẩu." và giá trị password khỏi payload submit; mô tả dialog đổi sang "…Nếu thay đổi vai trò, người dùng có thể cần đăng nhập lại.". Giữ nguyên name/email/role, khóa tự đổi vai trò (`isSelf`), toast, bố cục.
  - **Admin API**: `UpdateUserInput` bỏ field `password` → payload cập nhật **không thể** mang mật khẩu. `CreateAccountInvitationInput` không đổi.
  - **Backend**: `UpdateUserDto` chuyển sang `PartialType(OmitType(CreateUserDto, ['password']))` — `PATCH /users/:id` **không còn nhận** `password`, gửi kèm bị `ValidationPipe` (`whitelist + forbidNonWhitelisted`) trả **400**. `UsersService.update()` bỏ nhánh bcrypt và dựng `data` bằng **allow-list tường minh** (`name`, `email`, `role`, `isActive`) — hàng rào thứ hai, đúng cả khi gọi service trực tiếp không qua pipe. Thu hồi phiên nay chỉ khi đổi vai trò hoặc khóa tài khoản. Giữ nguyên chặn hạ quyền Super Admin cuối, tự đổi vai trò/tự khóa, và `passwordHash` không bao giờ lộ ra response.
  - **Không đụng**: luồng accept-invitation vẫn cho người được mời **tự đặt mật khẩu**; login (so khớp mật khẩu) không đổi; `CreateUserDto` giữ nguyên; **không đổi schema, không chạy migration**.
  - Test: Admin thêm 3 test chế độ sửa (không có ô mật khẩu, không có helper text, payload không chứa `password`); Backend thêm `update-user.dto.spec.ts` (chặn `password`/`passwordHash`/field nội bộ, vẫn nhận name/email/role/isActive) và thay test cũ "thu hồi phiên khi đặt lại mật khẩu" bằng test ép `password` vào dto → Prisma chỉ nhận `{ name }`.
  - Kiểm định: Admin `tsc`/`lint`/`vitest 94`/`build` xanh; Backend `prisma validate`/`tsc`/`lint`/`jest 217`/`build` xanh (lint warning còn lại đều là dòng cũ). `prisma generate` chạy lại do client sinh sẵn bị cũ — **không phải migration**. **Chưa kiểm chứng thủ công.**
  - Việc còn lại → §2: **Forgot Password** (chưa có — sau thay đổi này người dùng quên mật khẩu không còn lối tự phục hồi) và **retire `POST /users`** (đường tạo tài khoản kèm mật khẩu vẫn reachable ở backend, Admin UI không còn gọi).

### Phiên 2026-07-22 — Hardening phân quyền & bảo mật (trước production setup)

> Nguồn: **SECURITY-CODING-REMAINING-AUDIT-M1** (rà soát chỉ việc code/security còn
> mở trước production) + **ADMIN-ROLE-VISIBILITY-AUDIT-M1** (rà quyền hiển thị Admin CMS).
> Các fix dưới đây đều **backend/admin runtime → cần redeploy**; chưa kiểm chứng thủ công.

- [x] **ADMIN-ROLE-VISIBILITY-AUDIT-M1** — rà quyền sidebar/route/nút theo vai trò (EDITOR/ADMIN/SUPER_ADMIN) trên toàn Admin CMS. Kết luận: nav + route + nút đã khớp backend, không có nút nào gây 403; phát hiện 3 điểm cần siết → R1/R2/R3 dưới. Không đổi runtime ở bước audit.
  - [x] **R1 — Media delete chỉ ADMIN+** — xóa ảnh là thao tác phá hủy (gỡ Cloudinary, có thể hỏng trang đang dùng). Backend `media.controller.ts`: `DELETE /media/:id` thêm method-level `@Roles(ADMIN, SUPER_ADMIN)` (override EDITOR+ ở controller). Admin `MediaPage.tsx`: ẩn nút xóa với EDITOR (`canDelete`). Upload/list giữ nguyên cho EDITOR. Test: `media.controller.spec.ts` (metadata @Roles) + `MediaPage.test.tsx`.
  - [x] **R2 — Banner governance chỉ ADMIN+** — banner là nội dung trang chủ, không có luồng duyệt riêng. Backend `banners.controller.ts`: `create`/`update`(toggle `isActive`)/`reorder` chuyển sang `@Roles(ADMIN, SUPER_ADMIN)` (delete vốn đã ADMIN+). Admin: ẩn cả trang Banner khỏi EDITOR (nav `roles` + `ProtectedRoute` ở `/banner`), giống Liên hệ/Tài khoản. Test: `banners.controller.spec.ts` + `nav.test.ts`. EDITOR vào `/banner` trực tiếp → `/403`.
  - [x] **R3 — Users ADMIN read-only (lock-in test)** — hành vi đã đúng sẵn (ADMIN xem danh sách/chi tiết, mọi thao tác tạo/sửa/khóa/đổi vai trò gated `canManage = SUPER_ADMIN`; backend mutation `@Roles(SUPER_ADMIN)`); **không đổi runtime**, chỉ thêm test khóa hợp đồng: `users.controller.spec.ts` (đọc ADMIN+, mutation SUPER_ADMIN-only, self-service `/users/me` vẫn EDITOR+) + `UsersPage.test.tsx`.
- [x] **TRUSTED-PROXY-RATE-LIMIT-FIX-M1** (Finding 7) — sau reverse proxy của Render, `req.ip` phải lấy từ `X-Forwarded-For` thì `@nestjs/throttler` (rate-limit contact/auth) và IP lưu kèm lead mới đúng IP client; nếu không, mọi request gộp chung IP proxy → chặn nhầm cả trang / rate-limit theo IP mất tác dụng. Fix backend: `main.ts` tạo app kiểu `NestExpressApplication` + gọi helper `common/trust-proxy.ts` (`configureTrustProxy` → `app.set('trust proxy', 1)` — tin đúng **1 hop** Render, **không** `true` để tránh giả `X-Forwarded-For`). Test `trust-proxy.spec.ts`. Xác minh X-Forwarded-For thật là **manual trên staging**.
- [x] **ADMIN-SPA-SECURITY-HEADERS-M1** — Admin (Vite static trên Vercel) trước đây **không có** header bảo mật như FE public. Thêm `admin/vercel.json`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`; áp cho mọi route `/(.*)` + SPA fallback rewrite `→ /index.html`. **CSP cố ý hoãn** (Radix/Tailwind/Sentry có inline style + ingest, cần giai đoạn Report-Only riêng — xem →6). Test `vercel-headers.test.ts`. Redeploy Vercel mới có hiệu lực.

### Audit-baseline →1…→13 (2026-07-16 → 19)

> Nguồn: [audit-baseline](../08-audits-and-reports/current/2026-07-16-audit-baseline.md). Điểm khởi đầu 60/100.

- [x] **→1 Email báo lead** — `backend/src/mail/` (Nodemailer→Resend), lead lưu trước, gửi fire-and-forget nuốt lỗi, body HTML escape; 4 test. Production Resend PASS.
- [x] **→2 Rời free-tier + backup DB** (phần repo) — `render.yaml` plan trả phí; runbook backup-restore / rollback / deployment-guide 1b. *Thao tác Dashboard → §3.*
- [x] **→3 `@MaxLength` cho DTO chữ** — phủ 13 DTO (name 120/phone 30/email 200/message 5000/`TranslatedTextDto` 5000…), FE khớp `maxLength`; test DoS payload. (Finding #9)
- [x] **→4 Bản dịch EN** — HOÀN TẤT phạm vi production/audited: CMS batch 1–4 + i18n UI tĩnh (B-series) + loạt C data-model song ngữ + [EN-FULL 7-route](../08-audits-and-reports/current/2026-07-18-en-full-group2-closure.md) + [EN-SITE-WIDE 5-route](../08-audits-and-reports/current/2026-07-18-en-site-wide-follow-up.md) + [EN-PROJECT-ITEMS-P1](../08-audits-and-reports/current/2026-07-18-en-project-items-p1.md) + [ADMIN-ITEM-CONTENT-P2 A–F](../08-audits-and-reports/current/2026-07-19-admin-item-content-p2-batch-m1.md). VI byte-identical, 0 `[object Object]`. Dự án tương lai nhập EN trước publish → **§5**. (câu 19)
- [x] **→5 Error tracking + uptime** (phần repo) — Sentry 3 app errors-only (no-op khi thiếu DSN, `beforeSend` xóa body/IP); doc `monitoring-and-alerting.md`. *DSN + UptimeRobot → §3.*
- [x] **→7 JSON-LD** — `Organization` toàn site + `NewsArticle` (tin) + `BreadcrumbList`; builders trong `lib/seo.ts`. Cố ý chưa: `RealEstateListing`/`LocalBusiness`/`sameAs` (→ §6).
- [x] **→8 CI admin + test FE/e2e** — admin `ci.yml`; FE Jest 5 suite/36 test; backend e2e smoke + CI job Postgres; viết lại `next.config.spec.ts`/`app.e2e-spec.ts`. Doc `testing-strategy.md`. Bổ sung **SYS-P1-ADMIN-ROBUSTNESS** (Vitest admin, 53 test/12 file — [note](../08-audits-and-reports/current/2026-07-19-sys-p1-admin-robustness.md)).
- [x] **→11 Seed `gioi-thieu`/`lien-he`** — `prisma/seed-pages.js` (idempotent, `ON CONFLICT DO NOTHING`); chạy production, vòng đời CMS→API→DB→web xác nhận. Tiền đề của →4.
- [x] **→12 Bỏ cast `as unknown as Prisma.*Input`** — gỡ 14 cast/5 service, helper `common/prisma-json.ts` + `satisfies`; hành vi runtime giữ nguyên. [note](../08-audits-and-reports/current/2026-07-19-prisma-input-casts-removed.md).
- [x] **→13 G4 baseline production** — Rich Results 7/7 hợp lệ; Lighthouse CLI (Desktop 98–100, Mobile 77–91); fix NO_FCP/NO_LCP (`.page-transition` opacity + `prefers-reduced-motion`), đo lại 14/14 hợp lệ. Chi tiết [g4-measurement-baseline](../06-testing/g4-measurement-baseline.md). Còn lại → §6.
- *(→6 Enforce CSP: OPEN → §2 · →9 Auth HttpOnly + →10 Staging/WAF: deferred → §4)*

### Security Audit Phase 1–3 (2026-07-14)

> Chi tiết: [security-audit-phase-1](../05-security/security-audit-phase-1.md) + [security README](../05-security/README.md).

- [x] **Phase 1** — audit codebase, xác định 3 HIGH (CORS, rate-limit, SQL-inj), kế hoạch 4 phase.
- [x] **SEC-CORS-001** — bỏ fallback `?? '*'`, throw khi thiếu `CORS_ORIGIN`; 5 test.
- [x] **SEC-RATE-001** — `@Throttle` login 5/refresh 10/logout 20 per phút; 10 test.
- [x] **SEC-INJ-001** — `websearch_to_tsquery` → `plainto_tsquery` (không parse operator); 16 test.
- [x] **Phase 3 HTTP headers** — FE CSP/HSTS/X-Frame-Options; BE Helmet active. (CSP enforce còn lại → §2 →6)

### Sprint 0–4 — nền tảng & tính năng (2026-07-10 → 11)

- [x] **Sprint 0 — nền móng** — repo backend (NestJS+Prisma+Postgres, module theo domain); schema 12 bảng (field song ngữ JSON `{vi,en?}`); response envelope chuẩn; Swagger `/api/docs`; `.env.example`; CI lint+build. Hosting: Vercel + Render (câu 11).
- [x] **Sprint 1 — Auth + Projects** — `auth` (JWT access15′/refresh30d SHA-256 xoay vòng, khóa 423 sau 5 sai; 14 test), `users` (CRUD role, thu hồi token khi khóa/đổi quyền; 18 test), `projects` (CRUD + items + gallery + duyệt), route FE `du-an/[slug]/[hang-muc]`, lớp `lib/api/*`. Sửa enum `ProjectStatus` admin. (ED-01/03, KB-10)
- [x] **Sprint 2 — News + Cloudinary** — `news` (luồng nháp→duyệt→đăng, vá lộ DRAFT, 409 slug trùng), `media` (Cloudinary WebP≤1200px, chống path-escape, xóa cloud-trước), `pages`, `banners` (reorder transaction), seed news (1 bài thật), Admin nối API thật. Fix `sslmode=require`. (ED-04/05/06/07)
- [x] **Sprint 3 — Admin CMS + Contact + Email** — Dashboard (số liệu suy từ query), login API thật + ProtectedRoute + /403, màn duyệt nội dung, `contact` (`POST /contact` + rate-limit + email), quản lý lead, contact-form bỏ `mailto`. (ED-02, KB-06/08, YC-09)
- [x] **Sprint 4 — i18n + Search + SEO + nối API** — `[locale]` routing (VI không tiền tố, EN `/en`, Next.js 16 `proxy.ts`); JSONB song ngữ + fallback `.vi`; Admin nhập EN (`BilingualField`, `BannerFormDialog`/`PageFormDialog` mới); search full-text `ts_rank` (YC-10); SEO canonical/hreflang/sitemap/robots (YC-12); scheduler ED-08 idempotent; nối nốt FE↔API. 3 cấp role (câu 18). Vá lộ DRAFT projects, fix `@IsObject`→array, fix mất bản dịch khi PATCH item (**ADMIN-ITEM-CONTENT-P2 M1** A–F PASS, `8a9de74`).

### Nội dung thật + UI/UX + hợp tác (2026-07-10 → 16)

- [x] **Nội dung câu 2/6/7/8** — số liệu 4 dự án (đổi tên Silver Sea/Bảy Hiền Tower, giữ slug; lược nội dung pháp lý nhạy cảm khỏi web công khai); công ty thành viên; giới thiệu (timeline/stats); pháp lý (MST `0309910290` ở footer).
- [x] **Kho ảnh + gallery dự án** — 30 ảnh vào `images/` + `sync:images` (hash-based); bỏ bảng "Dự án tiêu biểu"→thẻ; slider ảnh mọi dự án. Fix dữ liệu seed (`location` ngắn, Bảy Hiền `DA_BAN_GIAO`, bỏ câu pháp lý nhạy cảm).
- [x] **Tinh chỉnh UI/UX dự án (Đợt 1–3)** — cân 2 panel Thông tin/Tổng quan, carousel hạng mục (bỏ hiện 2 lần), bố cục 2 cột trang hạng mục, nhúng Google Maps mọi dự án, `ProjectPhotoStrip` scroll-snap, footer gọn, cơ cấu lại trang chủ↔giới thiệu chống trùng lặp.
- [x] **Dự án hợp tác quản lý từ CMS (Đợt 3b)** — model `CooperationProject` + module `cooperation` (route công khai chỉ `PUBLISHED`), Admin `/du-an-hop-tac` (RHF+Zod), FE `getCooperationProjects()`. Migration `20260711120000_add_cooperation_projects` chưa áp production → **§3**.
- [x] **Redesign typography** — Geist → Playfair Display (H1/H2) + Be Vietnam Pro (body), subsets latin+vietnamese, design tokens `clamp()`, chuẩn hóa eyebrow, chống cắt dấu tiếng Việt.

### Hiện trạng kỹ thuật (tham chiếu)

- Deploy production: FE→Vercel, BE+Postgres→Render (`render.yaml`). Form liên hệ chạy thật end-to-end (`POST /api/contact` 201).
- Backend NestJS 11 + Prisma 7 + Postgres 17 (local Docker port **5433**). Admin CMS nối API thật 100% (`src/data/` mock đã xóa). `tsc`+`eslint` sạch, CI ở cả 3 repo.
- ⚠️ `.env` dev trỏ `DATABASE_URL` vào Render — trước go-live phải `prisma migrate deploy` có chủ ý (§3). Render free ngủ sau 15′, Postgres free hết hạn 90 ngày. Thời gian lưu UTC, hiển thị quy đổi VN (UTC+7) qua `formatDateTime`.
