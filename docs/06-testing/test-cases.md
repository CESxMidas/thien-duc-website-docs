# Test cases

> **Trạng thái:** Đang dùng
> **Nhóm:** 06 — Testing
> **Cập nhật:** 2026-08-22 (đồng bộ tài liệu Batch 13E)
> **Nguồn sự thật:** ma trận dưới đây đối chiếu với test thật trong
> `thien-duc-website-backend@9032698` và `thien-duc-website-admin@234981c`.
> Chiến lược và cách chạy: [testing-strategy](testing-strategy.md).

Tài liệu này liệt kê **case nghiệp vụ cần được khoá bằng test**, không phải danh
sách file test.

> Case đăng nhập/phân quyền cơ bản **chưa có tài liệu riêng**. Bản đặc tả gốc
> từng được trỏ tới (`prompts/development/admin-authentication-module.md`) chưa
> bao giờ được đưa vào repo — nguồn sự thật hiện tại là chính bộ test trong
> `src/auth/` và `src/users/` của backend.

---

## 1. Xuất bản có hẹn giờ — lệnh đặt/huỷ lịch

Áp dụng cho cả bốn module: Tin tức, Dự án, Dự án hợp tác, Trang.

| # | Case | Tiền điều kiện | Kỳ vọng |
|---|---|---|---|
| XB-01 | Đặt lịch cho bản **nháp** | `DRAFT`, chưa từng công khai | `PENDING` + `scheduledAt = X` + `publishedAt = X` |
| XB-02 | Đặt lịch cho bản **chờ duyệt chưa hẹn giờ** | `PENDING`, `scheduledAt = null` | như XB-01 |
| XB-03 | **Đổi lịch** | đang giữ lịch tương lai hợp lệ | `scheduledAt` **và** `publishedAt` cùng nhận mốc mới |
| XB-04 | **Huỷ lịch tương lai** | `scheduledAt > now`, lịch hợp lệ | `DRAFT` + `scheduledAt = null` + `publishedAt = null` |
| XB-05 | **Huỷ lịch đã tới hạn** | `scheduledAt <= now` | **409** — hướng dẫn dùng "Trả về nháp" |
| XB-06 | Huỷ khi **không có lịch** | `scheduledAt = null` | **409** |
| XB-07 | Huỷ lịch trên bản **từng công khai thật** | `publishedAt != scheduledAt` | **409** — không xoá lịch sử |
| XB-08 | Đặt lịch cho bản **đang PUBLISHED** | `PUBLISHED` | **409** |
| XB-09 | Đặt lịch cho bản **từng công khai thật** | có lịch sử xuất bản | **409** |
| XB-10 | **Xuất bản ngay** từ lịch tương lai | `PENDING` + lịch tương lai | `PUBLISHED`, `scheduledAt = null`, `publishedAt = now` **thật** |
| XB-11 | **Đăng ngay lần đầu** (không qua lịch) | `DRAFT`/`PENDING`, `publishedAt = null` | `publishedAt = now` thật |
| XB-12 | **Đăng lại** bản từng công khai | `publishedAt` là lịch sử thật | **giữ nguyên** `publishedAt` gốc |
| XB-13 | **Trả về nháp** bản từng công khai | `publishedAt` là lịch sử thật | `DRAFT`, **giữ nguyên** `publishedAt` |
| XB-14 | Lịch **sát ngưỡng dưới** | cách hiện tại < 60 giây | **400** |
| XB-15 | Lịch **vượt trần** | cách hiện tại > 730 ngày | **400** |
| XB-16 | Chuỗi thời gian **thiếu múi giờ** | ISO không có `Z`/`±HH:MM` | **400** |
| XB-17 | **EDITOR đặt lịch** | vai trò EDITOR | **403** |

## 2. Hiển thị công khai lúc truy vấn

| # | Case | Trạng thái bản ghi | Kỳ vọng |
|---|---|---|---|
| HT-01 | Đã đăng | `PUBLISHED` | **hiện** |
| HT-02 | Lịch **tương lai** | `PENDING`, `scheduledAt > now` | **ẩn** (404 ở route chi tiết) |
| HT-03 | Lịch **đúng mốc đáo hạn** | `scheduledAt == now` | **hiện** (`<=` là bao gồm) |
| HT-04 | Lịch **đã tới hạn, reconciler CHƯA chạy** | `PENDING`, `scheduledAt <= now` | **hiện** — đúng thiết kế |
| HT-05 | **Dị dạng**: nháp + lịch quá khứ | `DRAFT`, `scheduledAt <= now` | **ẩn** — chốt bảo mật |
| HT-06 | Nháp thường | `DRAFT`, `scheduledAt = null` | **ẩn** |
| HT-07 | Chờ duyệt chưa hẹn giờ | `PENDING`, `scheduledAt = null` | **ẩn** |
| HT-08 | Đếm + phân trang **cùng một `now`** | tập có bản đúng mốc đáo hạn | tổng số và nội dung trang **không lệch nhau** |
| HT-09 | Tìm kiếm (SQL thô) | như HT-01…HT-05 | cùng kết quả với route danh sách |

## 3. Quyền sửa nội dung của EDITOR

| # | Trạng thái | Kỳ vọng |
|---|---|---|
| ED-01 | `DRAFT`, chưa từng công khai | **cho sửa** |
| ED-02 | `PENDING`, chưa hẹn giờ | **cho sửa** |
| ED-03 | `PENDING` + lịch tương lai | **403** |
| ED-04 | Lịch **đã tới hạn** | **403** |
| ED-05 | `PUBLISHED` | **403** |
| ED-06 | `DRAFT` nhưng **từng công khai** | **403** |
| ED-07 | ADMIN / SUPER_ADMIN ở mọi trạng thái trên | **cho sửa** |
| ED-08 | **Nội dung con** (hạng mục, thư viện ảnh) khi cha bị chặn | **403**, thông điệp nói rõ hạng mục/ảnh |
| ED-09 | Nội dung con khi cha là nháp | **cho sửa** |

## 4. Múi giờ

| # | Case | Kỳ vọng |
|---|---|---|
| TZ-01 | `08:00+07:00` và `01:00Z` | **cùng một instant** → hành vi giống hệt nhau |
| TZ-02 | Nhập giờ VN trong CMS ở máy đặt múi giờ khác | ra **cùng** instant gửi backend |
| TZ-03 | Round-trip ISO → ô nhập → ISO | **không lệch** |
| TZ-04 | Ngày không có thật (vd. `2026-02-31`) | bị từ chối, **không** tự cuộn sang `03-03` |
| TZ-05 | Reconciler chạy trên phiên DB đặt `TimeZone` khác UTC | vẫn đăng **đúng giờ** (xem `test/scheduler-utc.e2e-spec.ts`) |

## 5. Banner — thời gian hiển thị

> Banner **không** có lịch xuất bản. Các case dưới đây kiểm **cửa sổ hiển thị**.

| # | Case | `isActive` | `displayFrom` | `displayUntil` | Kỳ vọng |
|---|---|---|---|---|---|
| BN-01 | Tắt thủ công | `false` | bất kỳ | bất kỳ | **ẩn** — `isActive` phủ quyết |
| BN-02 | Không đặt cửa sổ | `true` | `null` | `null` | **hiện** (hành vi cũ giữ nguyên) |
| BN-03 | Chỉ có biên dưới, đã qua | `true` | quá khứ | `null` | **hiện** |
| BN-04 | Chỉ có biên dưới, chưa tới | `true` | tương lai | `null` | **ẩn** |
| BN-05 | Chỉ có biên trên, chưa hết | `true` | `null` | tương lai | **hiện** |
| BN-06 | Chỉ có biên trên, đã hết | `true` | `null` | quá khứ | **ẩn** |
| BN-07 | **Đúng mốc `displayFrom`** | `true` | `== now` | tương lai | **HIỆN** (biên đóng) |
| BN-08 | **Đúng mốc `displayUntil`** | `true` | quá khứ | `== now` | **TẮT** (biên mở) |
| BN-09 | Đang trong khoảng | `true` | quá khứ | tương lai | **hiện** |
| BN-10 | Cả cửa sổ ở tương lai | `true` | tương lai | tương lai | **ẩn** |
| BN-11 | Cả cửa sổ ở quá khứ | `true` | quá khứ | quá khứ | **ẩn** |
| BN-12 | **Dị dạng đảo ngược** (sửa tay dưới DB) | `true` | sau `displayUntil` | trước `displayFrom` | **ẩn ở mọi `now`** |
| BN-13 | Hai banner **nối đuôi** tại cùng một mốc | `true` | A kết thúc = B bắt đầu | | **không giây nào chồng lấn, không giây nào trống** |

### 5b. Banner — validate cửa sổ

| # | Case | Kỳ vọng |
|---|---|---|
| BV-01 | Tạo với `displayFrom >= displayUntil` | **400** |
| BV-02 | Tạo với `displayFrom == displayUntil` | **400** (cửa sổ rỗng) |
| BV-03 | Tạo chỉ một biên | **chấp nhận** |
| BV-04 | Tạo với cả hai biên ở **quá khứ** | **chấp nhận** (banner hết hạn giữ lại) |
| BV-05 | Cửa sổ **sát hiện tại** (< 60 giây) | **chấp nhận** — không áp ngưỡng của lịch đăng |
| BV-06 | Cửa sổ **xa hơn 2 năm** | **chấp nhận** — không áp trần của lịch đăng |
| BV-07 | **PATCH gửi một biên** tạo ra cửa sổ đảo ngược khi ghép với biên đang lưu | **400** — kiểm trên trạng thái **sau khi trộn** |
| BV-08 | PATCH **không gửi** field | **giữ nguyên** giá trị đang lưu |
| BV-09 | PATCH gửi `null` tường minh | **xoá** biên |
| BV-10 | PATCH gửi chuỗi ISO | **đặt** biên mới |

## 6. Admin CMS — ổn định & khả dụng

| # | Case | Kỳ vọng |
|---|---|---|
| AD-01 | Tên khả truy cập của `BilingualField` | lấy từ **nhãn field thật**, không phải chuỗi cố định |
| AD-02 | Ngữ cảnh ngôn ngữ (VI/EN) | **mô tả thêm**, không ghi đè `aria-label` |
| AD-03 | Field lỗi | `aria-invalid` + `aria-describedby` được **truyền xuống** input thật |
| AD-04 | Lỗi validate ở field song ngữ lồng nhau | **hiện đúng** dưới field tương ứng |
| AD-05 | Chữ nhỏ trong `SplitModal` | tương phản đạt **WCAG AA** |
| AD-06 | Mở `SchedulePublishDialog` **lồng trong** form tạo | đóng dialog con **không** đóng form cha |

> AD-06 khoá một **race thật trong production**, không phải chỉ một test hay đỏ:
> khi dialog hẹn giờ lồng bên trong đang mở, modal tạo Tin tức/Dự án bỏ qua các
> yêu cầu đóng bị rò ra. Không có chốt này, nội dung biên tập viên đang gõ dở sẽ
> mất trắng.

## Tài liệu liên quan

- Chiến lược & cách chạy: [testing-strategy](testing-strategy.md)
- Luật nghiệp vụ tương ứng: [functional-requirements](../01-requirements/functional-requirements.md)
- Tiêu chí nghiệm thu: [acceptance-criteria](acceptance-criteria.md)
