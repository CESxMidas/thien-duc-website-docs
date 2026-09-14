# Checklist bàn giao — Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Cập nhật:** 2026-09-09

Checklist ngắn cho người tiếp nhận. Nguồn chi tiết là
[CI/CD](../07-deployment/ci-cd.md); không sao chép secret vào file này.

## 1. Máy mới và repository

- [ ] Cài Git, Node.js **22.x LTS**, npm và Docker Desktop/Compose.
- [ ] Cài PostgreSQL client tương thích nếu phụ trách backup/restore.
- [ ] Cài Playwright Chromium nếu chạy E2E full-stack.
- [ ] Có quyền đọc bốn repo Backend, Admin, Frontend và Docs.
- [ ] Clone bốn repo cạnh nhau; chạy `nvm use` và `npm ci` riêng trong từng app.

## 2. Environment

- [ ] Copy `.env.example` thành `.env` (Backend/Admin) hoặc `.env.local`
  (Frontend).
- [ ] Giá trị local dùng localhost theo template.
- [ ] Production env lấy từ password manager/người quản lý và nhập trực tiếp
  vào Render/Vercel; không lấy từ Git.
- [ ] Đối chiếu
  [environment-configuration](../07-deployment/environment-configuration.md).
- [ ] Không commit `.env`, DB URL, JWT, API token, private key hoặc backup dump.

## 3. Chạy local

```bash
# Backend
cd thien-duc-website-backend
docker compose up -d
npx prisma migrate dev
npm run start:dev

# Frontend
cd ../thien-duc-website-frontend
npm run dev

# Admin
cd ../thien-duc-website-admin
npm run dev
```

- [ ] Backend `http://localhost:3001/api` trả 200.
- [ ] Frontend `http://localhost:3000` gọi API thật.
- [ ] Admin `http://localhost:5174/admin/` đăng nhập bằng tài khoản local.

## 4. Test và build

- [ ] Backend: `npm run lint:check`, `npm run typecheck`, `npm run test`,
  `npm run build`, `npm run prisma:validate`.
- [ ] Admin: `npm run lint`, `npm run typecheck`, `npm run test`,
  `npm run build`.
- [ ] Frontend: `npm run lint`, `npm run typecheck`, `npm run test`,
  `npm run build`.
- [ ] Docs: `node scripts/check-markdown-links.mjs` và `git diff --check`.
- [ ] Chỉ chạy E2E với database local `thien_duc_test`; không dùng production.

## 5. Push, deploy và migration

- [ ] Push/PR `main` kích hoạt GitHub Actions của repo tương ứng.
- [ ] Push `main` có thể kích hoạt Vercel/Render qua Git integration.
- [ ] Không giả định thứ tự tuần tự: GitHub CI và provider auto-deploy có thể
  bắt đầu độc lập sau push `main` nếu chưa có provider/branch gate.
- [ ] Xác minh thủ công branch protection, required checks và deploy policy.
- [ ] Đọc [deployment guide](../07-deployment/deployment-guide.md).
- [ ] Migration tạo bằng `prisma migrate dev` ở local, review SQL và commit.
- [ ] Render chạy `prisma migrate deploy` trước khi start; không sửa migration cũ.
- [ ] Có backup đã kiểm chứng trước migration rủi ro.
- [ ] Chạy [smoke test](../07-deployment/ci-cd.md#16-smoke-test-sau-deploy).

## 6. Lỗi, rollback và backup

- [ ] Xem GitHub Actions, Vercel Logs và Render Events/Logs trước.
- [ ] Chỉ coi Sentry/Uptime là active khi dashboard đã được xác minh.
- [ ] Rollback app theo [rollback plan](../07-deployment/rollback-plan.md);
  rollback code không rollback DB.
- [ ] Backup/restore theo [runbook](../07-deployment/backup-and-restore.md);
  ghi retention, vị trí lưu và lần restore gần nhất.

## 7. Quyền cần bàn giao

- [ ] GitHub: bốn repo, branch protection và Actions secrets cần thiết.
- [ ] Vercel: hai project, domain và Environment Variables.
- [ ] Render: Blueprint, web service, PostgreSQL, env, log và backup.
- [ ] Cloudinary, Resend, Sentry và uptime provider nếu đang dùng.
- [ ] DNS/domain registrar và hộp thư nhận cảnh báo.
- [ ] Password manager/kênh secret riêng; bật MFA và thu hồi quyền người cũ.
- [ ] AI agent/new developer mặc định chỉ cần quyền đọc repo và quyền ghi trong
  workspace cho file đã được giao; quyền push, deploy, dashboard provider,
  production secret hoặc production database chỉ cấp khi có phê duyệt rõ ràng.

## 8. Việc thủ công còn phải xác minh

- [ ] GitHub protect `main`, cấm force-push/xóa nhánh; required checks: Backend
  `CI / lint-build-test` + `CI / e2e`; Admin `CI / lint-build` +
  `E2E Full-stack (Playwright) / e2e`; Frontend `CI / lint-build`; Docs
  `CI tài liệu / validate-docs`.
- [ ] Quyết định cấp management/team: có bắt buộc PR trước merge hay tiếp tục
  cho phép push trực tiếp `main`.
- [ ] Vercel Frontend/Admin: production branch `main`, đúng repo/root/build/env;
  required Deployment Checks/GitHub checks trước promote production.
- [ ] Render: đúng repo/`main`, build/start/health/env; xác minh gate CI. Blueprint
  trên `main` đã dùng `autoDeployTrigger: checksPass`; còn phải xác nhận Dashboard
  hiển thị **After CI Checks Pass** và thử gate. Push áp cấu hình đã tạo hai web
  deployment fail cùng một database deployment success; phải review Render logs.
- [x] Backend E2E local trên DB `thien_duc_test`: 7/7 suite, 107/107 test.
- [x] Admin full-stack E2E: 189/189 pass, 0 fail, 0 skip trên DB test cô lập
  (2026-09-11).
- [ ] Frontend GitHub CI: SHA `0f48898` fail ở `typecheck` vì runner sạch thiếu
  generated `PageProps`; bản sửa local `next typegen && tsc --noEmit` đã pass
  Node 22 nhưng chưa push/chạy lại CI.
- [ ] Render plan production, phiên bản PostgreSQL, backup/PITR.
- [ ] Restore drill và rollback drill.
- [ ] Ba Sentry project, source maps và alert rules.
- [ ] Backend/frontend uptime monitors.
- [ ] Kho off-site, mã hóa và lịch chạy backup.
