# Báo cáo sẵn sàng bàn giao Website Thiên Đức

> **Trạng thái:** Đã xác minh
> **Ngày chốt:** 2026-10-19
> **Phạm vi:** Frontend, Admin CMS, Backend API, cơ sở dữ liệu và vận hành production

## 1. Kết luận

Website Thiên Đức đã hoàn tất kiểm tra mã nguồn, CI, kiểm thử trình duyệt và xác
minh production. Các lỗi chặn đã biết về Admin E2E và hydration đã được xử lý.
Hạ tầng production, biến môi trường bắt buộc, cơ chế phục hồi cơ sở dữ liệu và
quyền quản lý tên miền đã được đối chiếu bằng dashboard.

**Kết luận:** sẵn sàng chuyển sang đồng bộ tài liệu Word và bàn giao vận hành.

## 2. Phạm vi release

| Thành phần | Commit chốt | Trạng thái |
|---|---|---|
| Frontend | `8f9d5bcb443274294bbe9d97280e0059d8581ae0` | Production hoạt động |
| Admin | `44e3191` | Validation và full-stack E2E đạt |
| Backend | `fa59293` | Render production Live |

Không có thay đổi mã nguồn mới trong giai đoạn xác minh hạ tầng và hoàn thiện
tài liệu này.

## 3. Kết quả kiểm tra

### Frontend

- Jest: đạt, 46/46 suite và 459/459 test.
- Lint, typecheck và build: đạt.
- Kiểm tra accessibility, contrast và các luồng trình duyệt liên quan: đạt.
- Production `/` và `/en`: HTTP 200, điều hướng trực tiếp, tải lại và chuyển đổi
  ngôn ngữ hoạt động bình thường.
- React #418 và hydration mismatch: đã xử lý.
- Ngày tin tức `02/09/2026` và `September 2, 2026` hiển thị nhất quán giữa máy
  chủ và trình duyệt.

### Admin

- Lint, typecheck, coverage và build: đạt.
- Full-stack E2E: 189/189 đạt, không fail, không skip.

### Backend

- Commit release đã triển khai thành công.
- Service production ở trạng thái Live.
- Các thay đổi phân quyền media và cấu hình xác thực đã được kiểm tra trong
  release hiện hành.

## 4. CI và triển khai

- Frontend GitHub Actions cho commit release: đạt toàn bộ các bước cài đặt, lint,
  typecheck, test và build.
- Admin CI và full-stack E2E: đạt.
- Backend deployment trên Render: thành công, nhánh `main`, Auto-Deploy bật.
- Frontend và Admin được triển khai trên Vercel; production environment đã được
  xác minh bằng dashboard.

## 5. Trạng thái production

### Render Backend

- Service: `thien-duc-website-backend`.
- Plan: Free.
- Region: Singapore.
- Branch: `main`.
- Trạng thái: Live.
- Giới hạn vận hành: instance Free có thể ngủ khi không hoạt động; request đầu
  tiên sau thời gian nghỉ có thể chậm khoảng 50 giây hoặc hơn. Đây là giới hạn
  của plan, không phải lỗi deployment.

### PostgreSQL

- Service: `thien-duc-db`.
- PostgreSQL 18, region Singapore.
- Plan trả phí `0.1c-256mb`: 6 USD/tháng theo dashboard tại thời điểm xác minh.
- Compute: 0.1 CPU, 256 MB RAM.
- Storage: 1 GB.
- Render managed Point-in-Time Recovery đang hoạt động.
- Recovery window: 3 ngày.
- Manual logical export khả dụng; tệp export được giữ ít nhất 7 ngày.

### Restore drill

Owner đã chấp nhận waiver: **restore drill được hoãn sang giai đoạn vận hành sau
bàn giao**. Waiver chỉ áp dụng cho diễn tập restore, không tắt PITR và không thay
thế trách nhiệm duy trì backup/recovery.

### Production environment

Các biến bắt buộc đã được xác minh hiện diện trên Vercel và Render. Tài liệu chỉ
ghi tên biến; giá trị được quản lý trong dashboard/password manager.

- Frontend: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`.
- Backend: `DATABASE_URL`, `CORS_ORIGIN`, `JWT_ACCESS_SECRET`,
  `ADMIN_APP_URL`; nhóm Cloudinary và Resend.
- Admin: `VITE_API_URL`, `VITE_SITE_URL`; nhóm Sentry phục vụ runtime/build.

### Domain

- Domain: `thienduccons.vn`.
- Registrar/provider và DNS provider: Công ty TNHH Phương Nam Vina.
- Tổ chức chịu trách nhiệm: Công ty TNHH Đầu tư Xây dựng Thương mại Thiên Đức.
- Ngày đăng ký: 25/03/2026.
- Ngày hết hạn: 25/03/2029.
- `www` được định tuyến tới Vercel.
- Trạng thái auto-renew không hiển thị trên dashboard; không được coi là đã bật.

## 6. Theo dõi sau bàn giao

Các mục dưới đây không chặn bàn giao nhưng phải có owner và thời hạn xử lý:

1. Lập kế hoạch và thực hiện restore drill trên môi trường cô lập; ghi ngày,
   nguồn phục hồi, đích kiểm thử, RPO/RTO và kết quả.
2. Rà soát rule truy cập PostgreSQL đang hiển thị `0.0.0.0/0`; thu hẹp phạm vi
   nếu mô hình kết nối cho phép. Tài liệu này không khẳng định rule đã được sửa.
3. Theo dõi cold start của Backend Free và cân nhắc nâng plan nếu ảnh hưởng SLA.
4. Xác nhận chính sách auto-renew tên miền trước kỳ gia hạn.
5. Duy trì kiểm tra định kỳ CI, dashboard recovery, dung lượng DB và quyền tài
   khoản nhà cung cấp.

## 7. Tài liệu vận hành liên quan

- [Deployment guide](../../07-deployment/deployment-guide.md)
- [Environment configuration](../../07-deployment/environment-configuration.md)
- [Backup and restore](../../07-deployment/backup-and-restore.md)
- [Rollback plan](../../07-deployment/rollback-plan.md)
- [Operations guide](../../09-handover/operations-guide.md)
- [Maintenance guide](../../09-handover/maintenance-guide.md)
- [Handover checklist](../../09-handover/handover-checklist.md)
