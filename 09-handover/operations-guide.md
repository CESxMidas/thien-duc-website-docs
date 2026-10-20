# Hướng dẫn vận hành Website Thiên Đức

> **Trạng thái:** Đang dùng
> **Cập nhật:** 2026-10-19

## 1. Phạm vi hệ thống

| Thành phần | Repository | Nền tảng production |
|---|---|---|
| Website công khai | `thien-duc-website-frontend` | Vercel |
| Admin CMS | `thien-duc-website-admin` | Vercel |
| API | `thien-duc-website-backend` | Render, Singapore |
| Cơ sở dữ liệu | Render PostgreSQL 18 | Render, Singapore |
| Media | Cloudinary | Dịch vụ ngoài |
| Email | Resend | Dịch vụ ngoài |

URL công khai chính: `https://www.thienduccons.vn/`. Admin được phục vụ dưới
đường dẫn `/admin`; API production chạy trên Render.

## 2. Kiểm tra hằng ngày

1. Mở trang chủ tiếng Việt và tiếng Anh; kiểm menu, banner, tin tức và dự án.
2. Kiểm tra Admin đăng nhập được và các trang nội dung tải bình thường.
3. Kiểm tra Render service ở trạng thái Live và không có deploy lỗi mới.
4. Kiểm tra Vercel deployment production hiện hành của Frontend và Admin.
5. Theo dõi lead liên hệ, lịch đăng tin và lỗi email nếu có.
6. Không ghi token, request body chứa dữ liệu cá nhân hoặc chuỗi kết nối vào
   ticket công khai.

Backend dùng plan Free và có thể cold-start sau thời gian không hoạt động. Nếu
request đầu chậm, kiểm tra trạng thái service và Render logs trước khi kết luận
ứng dụng lỗi.

## 3. Xuất bản nội dung

- Nội dung được tạo và duyệt trong Admin theo quyền được cấp.
- Kiểm tra đủ tiếng Việt; chỉ publish tiếng Anh khi nội dung EN đã hoàn chỉnh.
- Kiểm tra slug, ảnh, ngày đăng và link tham khảo trước khi publish.
- Với nội dung hẹn giờ, theo dõi trạng thái sau thời điểm xuất bản dự kiến.
- Không sửa dữ liệu trực tiếp trong PostgreSQL cho tác vụ nội dung thông thường.

## 4. Theo dõi CI và deployment

- Mỗi repository có workflow GitHub Actions riêng.
- Push/merge vào `main` có thể kích hoạt CI và provider auto-deploy độc lập.
- Chỉ xác nhận release thành công khi GitHub Actions và deployment tương ứng đều
  đạt; không suy trạng thái CI từ Vercel/Render.
- Ghi lại commit SHA, deployment URL và người xác nhận cho mỗi release.

Quy trình chi tiết: [CI/CD](../07-deployment/ci-cd.md) và
[deployment guide](../07-deployment/deployment-guide.md).

## 5. Database, backup và recovery

- PostgreSQL production: phiên bản 18, storage 1 GB.
- Render managed PITR đang hoạt động với recovery window 3 ngày.
- Manual logical export khả dụng và được giữ tối thiểu 7 ngày.
- Không chạy restore trực tiếp vào production khi chưa có phê duyệt.
- Restore drill chưa hoàn thành; owner đã chấp nhận thực hiện sau bàn giao.

Khi diễn tập, phải khôi phục vào đích cô lập, xác minh checksum/dữ liệu và ghi
RPO/RTO. Xem [backup and restore](../07-deployment/backup-and-restore.md).

## 6. Sự cố và rollback

1. Ghi thời điểm, URL, commit và lỗi quan sát được.
2. Kiểm GitHub Actions, Vercel Logs và Render Events/Logs.
3. Nếu chỉ lỗi ứng dụng, rollback deployment tốt gần nhất.
4. Nếu liên quan migration/dữ liệu, dừng thao tác ghi và làm theo runbook; rollback
   code không tự rollback schema.
5. Chỉ dùng PITR khi đã xác định mốc phục hồi và chấp nhận mất dữ liệu sau mốc đó.

Chi tiết: [rollback plan](../07-deployment/rollback-plan.md).

## 7. Domain và quyền sở hữu

- Domain: `thienduccons.vn`.
- Provider/DNS: Công ty TNHH Phương Nam Vina.
- Hết hạn: 25/03/2029.
- Auto-renew chưa được dashboard xác nhận.
- Người vận hành phải kiểm tra trạng thái gia hạn định kỳ và duy trì quyền truy
  cập account của tổ chức.

## 8. Theo dõi sau bàn giao

- Thực hiện restore drill trên môi trường cô lập.
- Rà soát rule PostgreSQL `0.0.0.0/0`; không coi là đã xử lý cho đến khi có
  evidence dashboard mới.
- Theo dõi cold start và cân nhắc nâng plan Backend nếu SLA yêu cầu.
- Xác minh định kỳ Sentry/alert nếu monitoring được bật và kiểm soát quyền owner.
