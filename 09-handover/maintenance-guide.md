# Hướng dẫn bảo trì Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Cập nhật:** 2026-10-19

## 1. Nguyên tắc

- Mỗi thay đổi đi qua repository tương ứng, review và CI.
- Không sửa migration đã áp dụng; tạo migration mới và review SQL.
- Không dùng production database cho unit test hoặc E2E.
- Không commit `.env`, token, DSN, chuỗi kết nối, dump hoặc dữ liệu cá nhân.
- Không thay đổi plan, DNS hoặc production env khi chưa có phê duyệt.

## 2. Validation trước release

### Frontend

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

### Backend

```bash
npm run lint:check
npm run typecheck
npm test
npm run prisma:validate
npm run build
```

Chỉ chạy `npm run test:e2e` với PostgreSQL test cục bộ đã qua preflight.

### Admin

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

Full-stack E2E yêu cầu ba ứng dụng và database test cô lập.

## 3. Migration database

1. Tạo migration bằng Prisma trên local.
2. Review SQL, lock, data loss và khả năng tương thích ngược.
3. Chạy Prisma validate, test và build.
4. Trước migration rủi ro, xác minh PITR và tạo logical export khi cần.
5. Deploy bằng `prisma migrate deploy`; không dùng `migrate reset` trên production.
6. Kiểm `_prisma_migrations`, health API và luồng liên quan sau deploy.

Xem [database migrations](../07-deployment/database-migrations.md).

## 4. Bảo trì định kỳ

### Hằng tuần

- Kiểm deployment lỗi, log 5xx và dung lượng PostgreSQL.
- Kiểm các luồng đăng nhập, tải ảnh, gửi form và xuất bản nội dung.
- Kiểm trạng thái recovery/PITR trên Render.

### Hằng tháng

- Review quyền GitHub, Vercel, Render, Cloudinary, Resend và domain.
- Review dependency advisory; nâng phiên bản có kiểm thử, không chạy
  `npm audit fix` tự động trên production branch.
- Kiểm tra expiry/domain renewal và thông tin người chịu trách nhiệm.
- Theo dõi cold-start Backend và quyết định nâng plan nếu ảnh hưởng vận hành.

### Hằng quý

- Thực hiện restore drill vào môi trường cô lập.
- Review rule truy cập database, đặc biệt rule `0.0.0.0/0` nếu còn tồn tại.
- Diễn tập rollback ứng dụng và cập nhật danh sách liên hệ sự cố.

## 5. Trách nhiệm

| Vai trò | Trách nhiệm chính |
|---|---|
| Developer | Code, test, review migration, hỗ trợ release |
| Người vận hành | Dashboard, env, backup/recovery, logs và rollback |
| Owner hệ thống | Quyền tài khoản, chi phí, domain, phê duyệt thay đổi production |
| Biên tập viên | Nội dung, hình ảnh, lịch đăng và kiểm tra song ngữ |

## 6. Hồ sơ cần lưu

- Commit và deployment tương ứng.
- Kết quả CI/smoke test.
- Migration đã áp dụng.
- Recovery point hoặc logical export dùng trước thay đổi rủi ro.
- Kết quả restore/rollback drill.
- Thay đổi quyền, env, DNS và plan; chỉ ghi tên biến, không ghi giá trị.
