# CI/CD và bàn giao triển khai — Website Thiên Đức

> **Trạng thái:** Nguồn sự thật chi tiết cho CI/CD
> **Cập nhật:** 2026-09-09
> **Phạm vi:** Chỉ hệ thống Thiên Đức tại `https://www.thienduccons.vn`.

## 1. Tổng quan

Luồng hiện tại:

```text
push/PR main
  → GitHub Actions: install → lint → typecheck → test → build
  → merge/push main
  → Vercel tự deploy Frontend và Admin qua Git integration
  → Render tự deploy Backend, chạy prisma migrate deploy rồi start
  → kiểm tra smoke production
```

CI chủ yếu **xác thực mã**; không chứa credential deploy và không chạm database
production. CD dùng tích hợp Git gốc của provider, không được thay bằng script
deploy GitHub Actions nếu không có lý do vận hành rõ ràng.

Giới hạn quan trọng: file trong repo chứng minh được cấu hình dự kiến, nhưng
không chứng minh dashboard provider đang kết nối đúng hoặc đang bắt buộc chờ CI.
Các mục đó được ghi **MANUAL PROVIDER SETUP REQUIRED**.

## 2. Bản đồ repository

| Repository | Vai trò | Production |
|---|---|---|
| `thien-duc-website-backend` | NestJS API, Prisma migrations, backup scripts | Render |
| `thien-duc-website-admin` | Vite SPA, host Playwright full-stack | Vercel project Admin, public qua `/admin` |
| `thien-duc-website-frontend` | Next.js website và proxy `/admin` | Vercel project Frontend |
| `thien-duc-website-docs` | Tài liệu nguồn sự thật | Không deploy ứng dụng |

Mỗi repository độc lập, có lockfile riêng và chạy lệnh trong chính thư mục đó.

## 3. Chiến lược nhánh

- Nhánh production hiện tại: `main` ở cả bốn repository.
- CI chạy khi push lên `main` và pull request nhắm `main`.
- Không có `develop`/`staging`/`release`; không tự tạo thêm nhánh dài hạn.
- Khuyến nghị thủ công trên GitHub: bảo vệ `main`, cấm force-push, yêu cầu review
  và required status checks trước merge.
- Provider có thể bắt đầu auto-deploy ngay khi nhận push. Phải kiểm tra trong
  dashboard xem deployment có chờ GitHub checks hay không; repo không ép được
  điều này.

## 4. Điều kiện cài đặt local

| Công cụ | Phiên bản/yêu cầu |
|---|---|
| Node.js | **22.x LTS** — `.nvmrc` + `package.json#engines` ở ba app |
| Package manager | **npm**, lockfile v3; CI luôn dùng `npm ci` |
| Git | Bản hiện hành có hỗ trợ worktree thông thường |
| Docker Desktop/Compose | Dùng cho PostgreSQL local |
| PostgreSQL client | Chỉ cần cho `pg_dump`/`pg_restore`; phải tương thích server |
| Playwright Chromium | Chỉ cần khi chạy E2E Admin |

Docker Compose của Backend hiện dùng `postgres:18-alpine` trên port host `5433`.
Backend CI và full-stack CI dùng PostgreSQL 17 dùng một lần. Phiên bản PostgreSQL
production là thuộc tính dashboard Render, phải kiểm tra tại thời điểm vận hành;
không suy từ CI.

## 5. Thiết lập local

Clone bốn repository vào cùng một thư mục cha, tên thư mục giữ đúng như bảng ở
mục 2. Sau đó:

```bash
# Backend
cd thien-duc-website-backend
nvm use
npm ci
cp .env.example .env
docker compose up -d
npx prisma migrate dev
npm run start:dev

# terminal khác — Frontend
cd thien-duc-website-frontend
nvm use
npm ci
cp .env.example .env.local
npm run dev

# terminal khác — Admin
cd thien-duc-website-admin
nvm use
npm ci
cp .env.example .env
npm run dev
```

URL local:

- Backend `http://localhost:3001/api`; Swagger dev `/api/docs`.
- Frontend `http://localhost:3000`.
- Admin `http://localhost:5174/admin/`.
- PostgreSQL `localhost:5433`, database `thien_duc`.

## 6. Lệnh xác thực

| Repo | Lệnh bắt buộc |
|---|---|
| Backend | `npm run lint:check` · `npm run typecheck` · `npm run test` · `npm run build` · `npm run prisma:validate` |
| Admin | `npm run lint` · `npm run typecheck` · `npm run test` · `npm run build` |
| Frontend | `npm run lint` · `npm run typecheck` · `npm run test` · `npm run build` |
| Docs | `node scripts/check-markdown-links.mjs` · `git diff --check` |

`npm run lint` của Backend sửa tự động; CI dùng `lint:check` để một job không thể
“xanh” nhờ tự sửa worktree. Tất cả lint command chặn warning.

## 7. Kiến trúc CI và ma trận audit

| Repo | Trước audit | Sau audit | Chặn mã lỗi? |
|---|---|---|---|
| Backend | install, lint tự sửa, build, unit, Prisma/E2E job | lint check, typecheck, unit, build, Prisma validate và PostgreSQL E2E tách rõ | Có |
| Admin | install, lint, coverage, build; full-stack workflow | thêm typecheck tường minh; giữ coverage/build/Playwright | Có |
| Frontend | install, lint, Jest, build | thêm typecheck tường minh; lint chặn warning | Có |
| Docs | chưa có workflow | whitespace commit + link Markdown nội bộ | Có |

Không có pre-commit hook đang hoạt động. CI là cổng dùng chung, không phụ thuộc
hook riêng trên máy một lập trình viên.

## 8. GitHub Actions

### Backend

`.github/workflows/ci.yml` có hai job:

1. `lint-build-test`: Node 22, `npm ci`, Prisma generate, lint check, typecheck,
   Jest, build, Prisma validate.
2. `e2e`: PostgreSQL 17 service với database `thien_duc_test`; env/test
   credential dùng một lần; preflight chặn host từ xa; migrate, seed hai tài
   khoản test, verify bootstrap rồi chạy E2E.

Không đặt `DATABASE_URL`, JWT, Resend hay Cloudinary production trong GitHub.

### Admin

- `ci.yml`: Node 22, `npm ci`, lint, typecheck, Vitest coverage, build.
- `e2e-fullstack.yml`: checkout ba app, tạo env giả, PostgreSQL 17, cài Chromium,
  dựng ba server và chạy Playwright.
- Nếu ba repo là private, cấu hình `WORKSPACE_TOKEN` chỉ có quyền **read
  contents**. Giá trị fallback `github.token` chỉ dùng được nếu quyền truy cập
  chéo repo cho phép.

### Frontend

`ci.yml`: Node 22, `npm ci`, cache `.next/cache`, lint, typecheck, Jest, build.
Build CI đặt `NEXT_PUBLIC_API_URL` rỗng để kiểm compile độc lập Backend. Vì vậy
CI này không chứng minh prerender dữ liệu thật; đường tích hợp được phủ bởi
full-stack Playwright.

### Docs

`ci.yml` không cài dependency: Node 22 chạy checker link nội bộ và Git kiểm
whitespace commit. Link HTTP bên ngoài không được probe để tránh CI chập chờn.

## 9. Kiến trúc CD

| Thành phần | Repo-configured | Manual dashboard |
|---|---|---|
| Backend | `render.yaml`: branch/build/start/health/autoDeploy/env declarations | Kết nối GitHub, Apply Blueprint, plan, secret/env, deploy policy |
| Frontend | Next.js config và workflow kiểm tra | Import repo, Production Branch `main`, env, domain, Git/CI protection |
| Admin | `vite.config.ts` base/output + `vercel.json` rewrite/headers | Import repo, Production Branch `main`, env, output `dist` |

Không có GitHub Action deploy; không cần Vercel/Render deploy token trong GitHub.

## 10. Vercel — Frontend

Thiết lập cần xác nhận:

- Git repo `thien-duc-website-frontend`, Production Branch `main`.
- Framework Next.js, Root Directory `./`.
- Install `npm ci`, build `npm run build`; output do Next.js/Vercel quản lý.
- Env production: `NEXT_PUBLIC_API_URL` và `NEXT_PUBLIC_SITE_URL`.
- Domain `www.thienduccons.vn` và redirect apex/www theo quyết định vận hành.
- Push `main` kích hoạt deploy nếu Git integration đang bật.

## 11. Vercel — Admin

- Git repo `thien-duc-website-admin`, Production Branch `main`.
- Framework Vite, Root Directory `./`, install `npm ci`.
- Build `npm run build`, Output Directory `dist`.
- `vite.config.ts` build `base: "/admin/"` và `outDir: "dist/admin"`.
- `vercel.json` redirect gốc sang `/admin/`, SPA rewrite và security headers.
- Frontend rewrite `/admin` sang
  `https://thien-duc-website-admin.vercel.app/admin`.

Không đổi output thành `dist/admin` trong dashboard: Vercel phải publish `dist`
để URL `/admin/*` ánh xạ tới thư mục con đúng.

## 12. Render — Backend

`render.yaml` là bằng chứng cấu hình repo:

- branch `main`, `autoDeploy: true`;
- build `npm ci && npm run build`;
- start `npx prisma migrate deploy && npm run start:prod`;
- health `/api`, region `singapore`, Node `22`;
- `DATABASE_URL` nối từ Render Postgres; JWT do Render sinh;
- các env `sync: false` phải nhập tay.

Dashboard vẫn phải xác minh: repo/branch thực sự được liên kết, plan hiện tại,
auto-deploy đang bật, env có đủ, deploy hook không bị thay đổi và health check
đang xanh.

## 13. Ma trận biến môi trường

Ký hiệu: LR = local required, LO = local optional, PR = production required,
PO = production optional, PM = provider-managed.

### Backend runtime và bootstrap

| Biến | Local | Production | Public/secret | Nguồn |
|---|---|---|---|---|
| `DATABASE_URL` | LR | PR/PM | Secret | local Docker / Render Postgres |
| `PORT` | LO | PM | Server-only | mặc định 3001 / Render cấp |
| `NODE_ENV` | LO | PM | Server-only | development/test / Render production |
| `CORS_ORIGIN` | LR | PR | Không secret | origin FE/Admin |
| `JWT_ACCESS_SECRET` | LR | PR/PM | Secret | tự sinh; Render Blueprint sinh |
| `JWT_ACCESS_EXPIRES_IN` | LO | PO | Không secret | mặc định 15m |
| `CLOUDINARY_CLOUD_NAME` | LO | PO, bắt buộc cho upload | Public | Cloudinary; hiện `ksnntvmu` |
| `CLOUDINARY_API_KEY` | LO | PO, bắt buộc cho upload | Secret/server-only | Cloudinary |
| `CLOUDINARY_API_SECRET` | LO | PO, bắt buộc cho upload/xóa | Secret | Cloudinary |
| `RESEND_API_KEY` | LO | PO, bắt buộc cho email | Secret | Resend |
| `MAIL_FROM` | LO | PO, bắt buộc cho email | Server-only | domain gửi đã verify |
| `CONTACT_NOTIFY_TO` | LO | PO, bắt buộc cho email lead | Server-only | hộp thư công ty |
| `ADMIN_APP_URL` | LO | PR khi dùng mời/reset | Không secret, server-only | URL Admin kèm `/admin` |
| `ADMIN_EMAIL` | LO | thao tác bootstrap | Dữ liệu nhạy cảm | người vận hành |
| `ADMIN_PASSWORD` | LO | thao tác bootstrap | Secret | người vận hành; đổi ngay |
| `ADMIN_NAME` / `ADMIN_ROLE` | LO | bootstrap tùy chọn | Server-only | người vận hành |
| `SENTRY_DSN` | LO | PO | Server-only theo quy ước | Sentry |

Thiếu bộ Resend/Cloudinary/Sentry không ngăn app boot; tính năng tương ứng
degrade/no-op hoặc trả 503 như mô tả trong `.env.example`.

### Frontend

| Biến | Local | Production | Public/secret |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | LR | PR | Public, build-time |
| `NEXT_PUBLIC_SITE_URL` | LR khuyến nghị | PR | Public, build-time |
| `NEXT_PUBLIC_SENTRY_DSN` | LO | PO | Public ingest-only |
| `SENTRY_AUTH_TOKEN` | LO | PO | **Secret build-only** |
| `SENTRY_ORG` / `SENTRY_PROJECT` | LO | PO | Build-only, không secret |
| `SENTRY_RELEASE` | LO | PO | Build-only |
| `BUILD_REQUIRE_API` | LO | PO | Build-only; thường để trống |
| `NODE_ENV` | PM | PM | Provider/tool-managed |
| `VERCEL_GIT_COMMIT_SHA` / `GITHUB_SHA` | PM | PM | Provider-managed |
| `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` / `NEXT_PUBLIC_VERCEL_URL` | PM | PM | Public/provider-managed |

### Admin

| Biến | Local | Production | Public/secret |
|---|---|---|---|
| `VITE_API_URL` | LR | PR | Public, build-time |
| `VITE_SITE_URL` | LO | Khuyến nghị | Public, build-time |
| `VITE_SENTRY_DSN` | LO | PO | Public ingest-only |
| `SENTRY_AUTH_TOKEN` | LO | PO | **Secret build-only** |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_RELEASE` | LO | PO | Build-only |
| `CI` / `GITHUB_SHA` / `VERCEL_GIT_COMMIT_SHA` | PM | PM | Tool/provider-managed |

### Test, seed và backup

- E2E-only: `MAIL_FAKE_TRANSPORT`, `SUPER_ADMIN_EMAIL`,
  `SUPER_ADMIN_PASSWORD`, `EXPECT_ROLE`, `FRONTEND_URL`. Không đặt trên
  production; password là giả và database bắt buộc local `thien_duc_test`.
- Seed/import-only: `SEED_CONFIRM_PRODUCTION`, `NEWS_IMPORT_STATUS`, `DRY_RUN`.
  Đây là chốt thao tác, không phải runtime env.
- Backup-only: `BACKUP_OUT_DIR`, `BACKUP_UPLOAD_COMMAND`,
  `BACKUP_REMOTE_PREFIX`, `BACKUP_UPLOAD_DRY_RUN`, `BACKUP_DEST`,
  `BACKUP_DEST_URI`, `BACKUP_ENCRYPT_KEY`, `BACKUP_KEEP_DAYS`,
  `BACKUP_KEEP_MIN`, `VERIFY_DATABASE_URL`. Credential và khóa mã hóa là secret;
  xem [backup-and-restore.md](backup-and-restore.md).

Không commit giá trị thật. Các file bị cấm gồm `.env*` ngoài template, backup
`*.dump*`, private key/certificate, service-account/credential JSON, log, token
và output build.

## 14. Quy trình migration database

1. Sửa `prisma/schema.prisma` ở local.
2. Chạy `npx prisma migrate dev --name <ten>` trên DB local.
3. Đọc SQL sinh ra; đánh giá lock, data loss, backfill và tương thích code cũ.
4. Chạy Prisma validate/generate, unit/E2E/build.
5. Commit **schema và thư mục migration mới**; không sửa migration đã áp dụng.
6. Trước migration rủi ro: xác minh backup/restore được và tạo dump thủ công.
7. Merge/push `main`; Render start command chạy `prisma migrate deploy`.
8. Kiểm Render log và bảng `_prisma_migrations`, rồi smoke API.

Không chạy `migrate dev`, `migrate reset` hoặc migration tùy ý từ PR CI vào
production. Nếu migration lỗi thì Backend không start do chuỗi `&&`; theo
[runbook migration](database-migrations.md) và ưu tiên forward-fix.

## 15. Trình tự deploy production

### Pre-deploy

- [ ] Worktree sạch; hai mục ngoài phạm vi nếu có phải được ghi nhận rõ.
- [ ] Đồng bộ `main` và review diff/commit.
- [ ] Lint, typecheck, test, build đều xanh.
- [ ] Prisma validate xanh; migration SQL đã review.
- [ ] Backup đã xác minh nếu có schema/data change.
- [ ] Env mới đã được ghi tên, chủ sở hữu và nơi cấu hình; không ghi giá trị.

### Deploy

- [ ] Push/merge `main` sau phê duyệt.
- [ ] GitHub Actions xanh ở repo bị tác động.
- [ ] Render deploy Backend xanh; migration/health xanh.
- [ ] Vercel Admin/Frontend deploy xanh.
- [ ] Nếu Backend còn sleep/cold start, đánh thức `/api` trước build Frontend.

### Post-deploy

- [ ] Chạy smoke mục 16.
- [ ] Xem log Render/Vercel; xem Sentry nếu đã cấu hình.
- [ ] Ghi commit SHA, deployment URL, migration và người xác nhận.

## 16. Smoke test sau deploy

Chỉ dùng thao tác ghi dữ liệu khi đã thống nhất và có thể dọn an toàn.

- Backend: `GET /api`, `/api/banners`, `/api/news`, `/api/projects`,
  `/api/pages`, `/api/cooperation` trả 200.
- Bảo mật: `GET /api/users` không token trả 401; `/api/docs` và
  `/api/docs-json` trả 404 ở production.
- Frontend: `/`, `/du-an`, `/tin-tuc`, `/lien-he`, `/en/du-an` tải đúng;
  `/sitemap.xml`, `/robots.txt` và canonical đúng domain.
- Admin: `/admin` và hard refresh `/admin/dang-nhap` trả 200; đăng nhập; asset
  JS có MIME JavaScript; API đi tới Render; role protection còn đúng.
- Nếu được phép: gửi một contact test, xác nhận lead vào Admin/DB và email nếu
  Resend đang bật.

## 17. Rollback

- Frontend/Admin: chọn deployment tốt gần nhất trên Vercel và Instant Rollback
  hoặc Promote to Production.
- Backend: Render rollback/deploy commit tốt gần nhất, hoặc tạo commit `git
  revert` có review.
- Rollback code **không rollback schema**.
- DB: ưu tiên forward-fix; chỉ PITR/restore khi dữ liệu/schema hỏng nặng và đã
  chấp nhận RPO. Xem [rollback-plan.md](rollback-plan.md).

## 18. Backup và restore

- Repo có script backup/checksum/encryption/verify/prune và test an toàn.
- Kho off-site, credential, lịch chạy, Render backup/PITR và restore drill vẫn
  là thiết lập thủ công chưa có bằng chứng active.
- Không tuyên bố “đã có backup” cho tới khi có timestamp, retention, vị trí lưu
  và một lần restore thành công.
- Runbook: [backup-and-restore.md](backup-and-restore.md).

## 19. Monitoring và log

| Nguồn | Dùng để xem | Trạng thái bằng chứng |
|---|---|---|
| GitHub Actions | lint/test/build/E2E | Repo-configured |
| Vercel Deployments/Functions logs | build và runtime FE/Admin | Dashboard cần quyền |
| Render Events/Logs/Metrics | build/start/migration/API | Dashboard cần quyền |
| Sentry 3 app | exception ứng dụng | Code ready; dashboard/DSN chưa được chứng minh |
| Uptime monitor | availability FE/API | Chưa được chứng minh active |

Không đưa request body, token hay dữ liệu lead vào ticket/log công khai.

## 20. Lỗi thường gặp

| Triệu chứng | Kiểm tra |
|---|---|
| Frontend không có dữ liệu | `NEXT_PUBLIC_API_URL` có `/api` và đã redeploy |
| Admin login lỗi/CORS | `VITE_API_URL` và `CORS_ORIGIN` đúng origin |
| Admin trắng trang | `base=/admin/`, output `dist/admin`, dashboard publish `dist`, MIME asset |
| Link mời/reset sai | `ADMIN_APP_URL=https://www.thienduccons.vn/admin` |
| Vercel build Frontend lỗi sitemap | Backend Render đang ngủ/không phản hồi |
| Backend P1001 | dùng đúng DB URL; external connection có SSL |
| Prisma P3009 | dừng deploy lặp, backup + read-only inspection + runbook |
| Request đầu timeout | Render free/cold start; kiểm plan và log |
| Sentry không có event | DSN, release/source map và CSP `connect-src` |

## 21. Ma trận trách nhiệm

| Bên | Trách nhiệm | Trạng thái |
|---|---|---|
| Developer | code, review migration, test/build, smoke, ghi release | Quy trình đã tài liệu hóa |
| GitHub | source control + CI | Workflow đã cấu hình |
| Vercel | deploy Frontend/Admin + domain | Manual dashboard verification |
| Render | Backend + PostgreSQL + migration khi start | Blueprint có; dashboard verification |
| Cloudinary | media | Code/config ready; credential dashboard |
| Resend | email giao dịch/lead | Code ready; credential/domain dashboard |
| Sentry | error tracking | Code ready; manual setup chưa chứng minh |
| Uptime provider | availability alert | Manual setup chưa chứng minh |
| Người vận hành | backup/restore drill, quyền tài khoản, rollback | Chưa thể tự động xác nhận từ repo |

## 22. Checklist bàn giao

- [ ] Chuyển quyền GitHub cho bốn repo và xác nhận `main`.
- [ ] Chuyển quyền Vercel hai project/domain và Render service/database.
- [ ] Chuyển quyền Cloudinary, Resend, Sentry và uptime provider nếu đang dùng.
- [ ] Bàn giao secret qua password manager/kênh riêng; không qua Git/tài liệu.
- [ ] Xác nhận required checks và auto-deploy policy.
- [ ] Xác nhận toàn bộ production env theo mục 13.
- [ ] Xác nhận plan, backup/PITR, lịch backup off-site và restore drill.
- [ ] Diễn tập một deploy không đổi schema và một rollback.
- [ ] Ghi người chịu trách nhiệm sự cố và kênh cảnh báo.

## 23. Checklist lập trình viên mới

1. Đọc README bốn repo, file này và [handover checklist](../09-handover/handover-checklist.md).
2. Cài Node 22, npm, Git, Docker; clone bốn repo cạnh nhau.
3. Lấy env **local** từ template; secret thật từ người quản lý password manager.
4. Khởi động DB → Backend → Frontend/Admin và kiểm ba URL local.
5. Chạy toàn bộ validation mục 6.
6. Chỉ xin quyền provider khi cần vận hành; dùng least privilege.
7. Không chạy seed/migration/backup command vào production khi chưa xác nhận đích.
8. Không push/deploy nếu chưa được phê duyệt.

## 24. Trạng thái cuối audit

| Hạng mục | Trạng thái |
|---|---|
| Backend CI | **IMPLEMENTED AND VERIFIED LOCALLY**: lint, typecheck, 77 suite/1.329 unit test, build, Prisma validate |
| Admin CI | **IMPLEMENTED AND VERIFIED LOCALLY**: lint, typecheck, 59 file/897 test + coverage, build |
| Frontend CI | **IMPLEMENTED AND VERIFIED LOCALLY**: lint, typecheck, 37 suite/445 test, build Next 16.3.3 |
| Docs CI | **IMPLEMENTED AND VERIFIED LOCALLY**: `git diff --check`, 87 tệp Markdown hợp lệ |
| Cú pháp workflow | **VERIFIED LOCALLY**: parse thành công cả 5 tệp YAML |
| Backend/Admin full-stack E2E | **NOT RUN LOCALLY**: Docker daemon không chạy, không có PostgreSQL local/test; không dùng production DB để thay thế |
| Production smoke chỉ-đọc | **VERIFIED 2026-09-09**: Home/Admin/API/Projects/News 200; Swagger production 404; Users không token 401 |
| CD Vercel/Render trong repo | **IMPLEMENTED BUT MANUAL PROVIDER SETUP REQUIRED** |
| Branch protection/required checks | **DOCUMENTED ONLY** |
| Sentry/Uptime dashboard | **IMPLEMENTED BUT MANUAL PROVIDER SETUP REQUIRED** |
| Render backup/PITR và restore drill | **DOCUMENTED ONLY / chưa có bằng chứng active** |
| Backup off-site scheduler/storage | **NOT IMPLEMENTED ở provider; repo tooling sẵn** |
| Staging branch/environment | **NOT APPLICABLE theo ADR hiện tại** |

`npm audit --omit=dev` tại ngày audit còn báo Backend 23 advisory (7 moderate,
16 high), Admin 2 high, Frontend 20 (1 moderate, 19 high). Hai advisory RCE
critical trực tiếp của Next 16.2.12 đã được đóng bằng Next 16.3.3. Phần còn lại
chủ yếu là chuỗi dependency và các direct package mà npm chưa đưa ra bản sửa
tương thích; cần ticket bảo mật riêng để nâng có kiểm thử, không chạy `npm audit
fix` tự động trong batch CI/CD này.
