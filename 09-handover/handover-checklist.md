# Checklist bàn giao — Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Cập nhật:** 2026-10-19

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
- [ ] Thành viên mới mặc định chỉ cần quyền đọc repo; quyền push, deploy,
  dashboard provider, production secret hoặc production database chỉ cấp khi có
  phê duyệt rõ ràng.

## 8. Trạng thái xác minh khi bàn giao

- [ ] GitHub protect `main`, cấm force-push/xóa nhánh; required checks: Backend
  `CI / lint-build-test` + `CI / e2e`; Admin `CI / lint-build` +
  `E2E Full-stack (Playwright) / e2e`; Frontend `CI / lint-build`; Docs
  `CI tài liệu / validate-docs`.
- [ ] Quyết định cấp management/team: có bắt buộc PR trước merge hay tiếp tục
  cho phép push trực tiếp `main`.
- [ ] Vercel Frontend/Admin: production branch `main`, đúng repo/root/build/env;
  required Deployment Checks/GitHub checks trước promote production.
- [x] Render Backend: đúng repo/`main`, region Singapore, Auto-Deploy, service
  Live và release gần nhất thành công.
- [x] Backend E2E local trên DB `thien_duc_test`: 7/7 suite, 107/107 test.
- [x] Admin full-stack E2E: 189/189 pass, 0 fail, 0 skip trên DB test cô lập
  (2026-09-11).
- [x] Frontend GitHub CI: commit
  `8f9d5bcb443274294bbe9d97280e0059d8581ae0` đạt lint, typecheck, test và build;
  production `/` và `/en` không còn hydration mismatch.
- [x] Render plan production và PostgreSQL 18 đã xác minh; managed PITR active,
  recovery window 3 ngày, logical export giữ ít nhất 7 ngày.
- [ ] Restore drill: owner đã chấp nhận hoãn sang vận hành sau bàn giao; phải chạy
  ở đích cô lập và ghi RPO/RTO. Rollback drill vẫn là follow-up vận hành.
- [ ] Ba Sentry project, source maps và alert rules.
- [ ] Backend/frontend uptime monitors.
- [ ] Kho off-site, mã hóa và lịch chạy backup nếu tổ chức yêu cầu lớp backup bổ
  sung ngoài Render managed recovery.

## 9. Production ownership đã xác minh

- [x] Production environment bắt buộc hiện diện trên Vercel/Render; chỉ bàn giao
  giá trị qua password manager hoặc dashboard.
- [x] Domain `thienduccons.vn` do Công ty TNHH Phương Nam Vina quản lý; tổ chức
  chịu trách nhiệm là Công ty TNHH Đầu tư Xây dựng Thương mại Thiên Đức.
- [x] Domain hết hạn 25/03/2029; `www` định tuyến tới Vercel.
- [ ] Auto-renew không hiển thị trên dashboard; owner cần xác nhận trước kỳ gia hạn.
- [ ] Rà soát rule PostgreSQL `0.0.0.0/0`; chưa được coi là đã khắc phục.
