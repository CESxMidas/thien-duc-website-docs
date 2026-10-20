# Cấu hình môi trường

> **Trạng thái:** Đang dùng
> **Cập nhật:** 2026-10-19
> **Nguyên tắc:** Tài liệu chỉ ghi tên biến và nơi quản lý, không ghi giá trị.

## 1. Môi trường production

| Thành phần | Nền tảng | Phạm vi |
|---|---|---|
| Frontend | Vercel | Production |
| Admin | Vercel | Production; một số biến Sentry áp dụng thêm Preview |
| Backend | Render | Production service `thien-duc-website-backend` |
| Database | Render PostgreSQL | Production database `thien-duc-db` |

Các biến bắt buộc dưới đây đã được owner xác minh hiện diện trên dashboard ngày
2026-10-19. Việc xác minh không đọc hoặc sao chép giá trị.

## 2. Frontend

| Biến | Bắt buộc | Loại | Trạng thái production |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Có | Public build/runtime config | Present |
| `NEXT_PUBLIC_SITE_URL` | Có | Public canonical/site URL | Present |

Frontend Sentry không được bật trong bộ biến production đã cung cấp; không coi
đó là blocker của release hiện hành. Nếu bật sau này, dùng biến được định nghĩa
trong `.env.example` và cập nhật CSP/monitoring runbook tương ứng.

## 3. Backend

### Biến bắt buộc

| Biến | Mục đích | Trạng thái production |
|---|---|---|
| `DATABASE_URL` | Kết nối PostgreSQL | Present |
| `CORS_ORIGIN` | Danh sách origin Frontend/Admin được phép | Present |
| `JWT_ACCESS_SECRET` | Ký access token | Present |
| `ADMIN_APP_URL` | URL công khai của Admin | Present |

### Nhóm vận hành đã xác minh

| Nhóm | Tên biến quan sát được | Trạng thái |
|---|---|---|
| JWT | `JWT_ACCESS_EXPIRES_IN` | Present |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Present |
| Resend/email | `RESEND_API_KEY`, `MAIL_FROM`, `CONTACT_NOTIFY_TO` | Present |
| Runtime | `NODE_VERSION` | Present |

Backend Sentry không được bật trong bộ biến production đã cung cấp. Nếu bật,
không đưa DSN hoặc token vào Git/tài liệu và phải xác minh event/alert thật.

## 4. Admin

| Biến | Bắt buộc | Phạm vi dashboard | Trạng thái |
|---|---|---|---|
| `VITE_API_URL` | Có | Production | Present |
| `VITE_SITE_URL` | Có | Production | Present |
| `VITE_SENTRY_DSN` | Khi bật monitoring | Production và Preview | Present |
| `SENTRY_AUTH_TOKEN` | Khi upload source map | Production và Preview | Present |
| `SENTRY_ORG` | Khi upload source map | Production và Preview | Present |
| `SENTRY_PROJECT` | Khi upload source map | Production và Preview | Present |
| `SENTRY_RELEASE` | Khi upload source map | Production và Preview | Present |

Mọi biến `VITE_*` có thể xuất hiện trong bundle trình duyệt. Không đặt secret,
database credential hoặc token quản trị dưới tiền tố này.

## 5. Biến local, test và thao tác

- Dùng `.env.example` của từng repository làm danh sách chuẩn cho local.
- E2E dùng credential giả và PostgreSQL cục bộ `thien_duc_test`.
- Không đặt biến test như `MAIL_FAKE_TRANSPORT`, tài khoản fixture hoặc
  `FRONTEND_URL` vào production.
- Biến seed/import/backup chỉ được đặt trong phiên thao tác được phê duyệt.
- Không chạy test hoặc restore bằng `DATABASE_URL` production.

## 6. Quy tắc bảo mật

- Secret chỉ nhập trực tiếp vào Render/Vercel hoặc password manager được duyệt.
- Không gửi secret qua email/chat thông thường và không chụp màn hình giá trị.
- Không commit `.env*` ngoài template, private key, service-account JSON,
  `*.dump*`, token, DSN bí mật hoặc log chứa dữ liệu cá nhân.
- Khi bàn giao, cấp quyền theo vai trò và thu hồi quyền người không còn phụ trách.
- Rotation phải có kế hoạch rollback và redeploy các service phụ thuộc.

## 7. Thay đổi cấu hình production

1. Ghi lý do, owner và các component bị ảnh hưởng.
2. Xác định biến public hay secret; không ghi giá trị vào ticket.
3. Cập nhật dashboard đúng environment.
4. Redeploy component cần thiết.
5. Chạy smoke test và kiểm log.
6. Ghi commit/deployment và thời điểm xác nhận.

## 8. Domain và URL

- Site URL: `https://www.thienduccons.vn`.
- Admin public path: `/admin` trên site domain.
- `www` được định tuyến tới Vercel.
- API URL do Render quản lý; chỉ ghi endpoint công khai trong runbook khi cần,
  không ghi chuỗi kết nối database.

Xem thêm [deployment guide](deployment-guide.md),
[monitoring and alerting](monitoring-and-alerting.md) và
[handover checklist](../09-handover/handover-checklist.md).
