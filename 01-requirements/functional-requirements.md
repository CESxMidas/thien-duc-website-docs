# Yêu cầu chức năng

> **Trạng thái:** Đang dùng
> **Nhóm:** 01 — Requirements
> **Cập nhật:** 2026-08-22 (đồng bộ tài liệu Batch 13E)
> **Nguồn sự thật:** hành vi mô tả ở đây đọc trực tiếp từ code
> `thien-duc-website-backend@9032698` + `thien-duc-website-admin@234981c`.
> Ánh xạ việc theo sprint: [implementation-plan](../04-implementation/implementation-plan.md);
> báo cáo gốc: [technical-proposal-pa2.docx](technical-proposal-pa2.docx).

Tài liệu này mô tả **hành vi người dùng và hệ thống**. Chi tiết code nằm ở
[module-status](../04-implementation/module-status.md).

---

## YC-XB — Xuất bản nội dung có hẹn giờ

Áp dụng cho **Tin tức**, **Dự án**, **Dự án hợp tác**, **Trang nội dung**.
KHÔNG áp dụng cho Banner (xem YC-BN).

### YC-XB-01 — Bậc thang duyệt

Nội dung đi qua ba trạng thái: `DRAFT` (nháp) → `PENDING` (chờ duyệt) →
`PUBLISHED` (đã đăng).

- Nội dung **mới tạo luôn là nháp**, với **mọi** vai trò — kể cả SUPER_ADMIN.
  Quyền được đăng và hành động đăng là hai việc tách bạch; bấm "Tạo" không bao
  giờ đẩy nội dung chưa ai đọc lên website.
- Việc công khai chỉ xảy ra qua lệnh tường minh (`PATCH …/status` hoặc
  `PATCH …/schedule`).

### YC-XB-02 — Hiển thị công khai xét lúc truy vấn

Một bản ghi hiện trên website công khai khi:

```
status = PUBLISHED
HOẶC (status = PENDING AND scheduledAt IS NOT NULL AND scheduledAt <= now)
```

- Nhánh hai **bắt buộc** kèm `PENDING`. Bỏ ràng buộc đó thì một hàng dị dạng
  `DRAFT` + `scheduledAt` quá khứ sẽ lọt ra công khai.
- **Nội dung đã tới hạn nhưng reconciler chưa chạm tới vẫn hiện công khai** —
  đây là hành vi ĐÚNG theo thiết kế, không phải lỗi.
- **DRAFT + `scheduledAt` quá khứ luôn riêng tư**, ở mọi thời điểm.

### YC-XB-03 — Không có trạng thái "đã lên lịch" được lưu

Hệ thống **không** có enum `SCHEDULED`. "Đã lên lịch" là tổ hợp `PENDING` +
`scheduledAt`, không phải một giá trị lưu trong DB.

### YC-XB-04 — Đặt lịch đăng (chỉ lần đầu)

| Nội dung | |
|---|---|
| **Ai được làm** | ADMIN, SUPER_ADMIN |
| **EDITOR** | KHÔNG được đặt lịch |
| **Route** | `PATCH /news/:slug/schedule` · `PATCH /projects/:slug/schedule` · `PATCH /pages/:slug/schedule` · `PATCH /cooperation/:id/schedule` |
| **Kết quả** | ghi nguyên tử `status = PENDING`, `scheduledAt = X`, `publishedAt = X` |

Ràng buộc mốc thời gian:

- Bắt buộc kèm **múi giờ tường minh** (`Z` hoặc `±HH:MM`). Chuỗi không có múi giờ
  bị từ chối.
- Cách hiện tại **tối thiểu 60 giây**. Sát hơn thì đã có "Xuất bản ngay".
- Xa nhất **730 ngày (2 năm)** — chủ yếu để bắt lỗi gõ nhầm năm.

Đặt lịch **KHÔNG** chạm nội dung (`title`, `slug`, `content`).

### YC-XB-05 — Chỉ hẹn được LẦN CÔNG KHAI ĐẦU TIÊN

- Nội dung đang `PUBLISHED` → từ chối (409).
- Nội dung **đã từng công khai thật** → từ chối (409), kể cả khi đã gỡ về nháp.
- **Không hỗ trợ** lịch đăng lại, **không hỗ trợ** lịch theo phiên bản.

### YC-XB-06 — Đổi lịch

Đổi lịch dùng chính lệnh đặt lịch. Cả `scheduledAt` **và** `publishedAt` cùng
nhận mốc mới.

### YC-XB-07 — Huỷ lịch

| Nội dung | |
|---|---|
| **Route** | `DELETE …/schedule` |
| **Chỉ áp dụng** | lịch **CHƯA** tới hạn |
| **Kết quả** | `status = DRAFT`, `scheduledAt = null`, `publishedAt = null` |

Từ chối trong ba ca:

1. **Không có lịch nào** → 409.
2. **Lịch đã tới hạn** (`scheduledAt <= now`) → 409. Lúc đó nội dung **đã đang
   hiển thị công khai**; thao tác không còn là "huỷ việc chưa xảy ra" mà là "gỡ
   nội dung đang công khai" — dùng "Trả về nháp".
3. **Lịch tương lai nhưng bản ghi từng công khai thật** → 409. Xoá sẽ xoá mất
   lịch sử xuất bản thật.

Huỷ lịch **thu hồi luôn phê duyệt** (về `DRAFT`) — cố ý: hệ thống không có trạng
thái "đã duyệt nhưng chưa lên lịch".

### YC-XB-08 — Xuất bản ngay

Đổi trạng thái thủ công sang `PUBLISHED`. Khi bấm từ một bản đang hẹn lịch chưa
tới hạn: `scheduledAt` bị xoá, `publishedAt` nhận **thời điểm thật lúc bấm** —
lần công khai theo lịch kia đã không xảy ra.

### YC-XB-09 — Ngữ nghĩa `publishedAt`

| Tình huống | `publishedAt` sau thao tác |
|---|---|
| Đăng ngay lần đầu | thời điểm đăng **thật** |
| Đăng theo lịch lần đầu | **bằng** `scheduledAt` |
| Đổi lịch trước lần đăng đầu | theo `scheduledAt` **mới** |
| Huỷ lịch tương lai | `null` |
| "Xuất bản ngay" từ lịch tương lai | thời điểm **thật** lúc bấm |
| Đăng lại bản từng công khai thật | **giữ nguyên** mốc gốc |
| Trả về nháp bản từng công khai thật | **giữ nguyên** mốc gốc (không xoá lịch sử) |

> **Giới hạn lịch sử đã biết.** Bản ghi được đăng rồi gỡ về nháp **trước** các
> migration thêm cột mốc (`20260819120000_project_publication_schedule`,
> `20260819130000_cooperation_publication_schedule`,
> `20260819140000_page_publication_schedule`) có `publishedAt = null` và **không còn dấu vết trong
> DB**. Không có cách backfill tất định nào từ `createdAt`/`updatedAt`: suy đoán
> sẽ sai với mọi bản ghi từng được sửa sau khi đăng, và sai theo hướng khó phát
> hiện. Tài liệu này **không bịa ra lịch sử xuất bản**.
>
> Hệ quả đã được xử lý ở tầng ứng dụng: bản ghi đang `PUBLISHED` vẫn luôn bị coi
> là đã công khai nhờ chính cột trạng thái, không cần `publishedAt`.

### YC-XB-10 — Quyền sửa nội dung của EDITOR

EDITOR chỉ được sửa nội dung **chắc chắn chưa từng ra công khai**:

| Trạng thái bản ghi | EDITOR sửa được? |
|---|---|
| `DRAFT`, chưa từng công khai (`publishedAt = null`) | Có |
| `PENDING`, **chưa** hẹn giờ (`scheduledAt = null`, `publishedAt = null`) | Có |
| `PENDING` + lịch tương lai đang chờ | Không |
| Lịch **đã tới hạn** | Không |
| `PUBLISHED` | Không |
| `DRAFT` nhưng **từng công khai** (`publishedAt != null`) | Không |

Vì sao siết tới mức này — lỗ hổng 07:59:

```
07:00  ADMIN hẹn đăng lúc 08:00   (PENDING + scheduledAt)
07:59  EDITOR sửa nội dung
08:00  bản ĐÃ SỬA tự ra công khai — không ai duyệt lại
```

Luật không cần đồng hồ: lệnh đặt lịch ghi `publishedAt = scheduledAt`, nên chỉ
cần *sự tồn tại* của mốc là đủ để biết bản ghi đã rời khâu biên tập.

**Nội dung con** (hạng mục dự án, thư viện ảnh) thừa hưởng đúng luật của bản ghi
cha — không có đường vòng sửa nội dung công khai qua nội dung con.

ADMIN / SUPER_ADMIN giữ nguyên quyền rộng hơn.

### YC-XB-11 — Múi giờ

- Admin CMS nhập ngày + giờ theo **giờ Việt Nam (GMT+7)**, có nhãn múi giờ hiện
  ngay cạnh ô nhập.
- Quy đổi **không đọc múi giờ của máy** người dùng — dùng offset cố định `+07:00`
  (Việt Nam không có giờ mùa hè từ 1975). CMS mở từ máy đặt sai múi giờ hoặc từ
  nước ngoài vẫn cho cùng kết quả.
- Backend nhận **instant ISO có múi giờ tường minh**; hai chuỗi chỉ cùng một
  instant (vd. `08:00+07:00` và `01:00Z`) phải cho hành vi giống hệt nhau.
- DB lưu UTC; hiển thị quy đổi GMT+7.

---

## YC-BN — Banner: thời gian hiển thị

> **Đây KHÔNG phải lịch xuất bản.** Thuật ngữ dùng thống nhất: **"Thời gian hiển
> thị"**, **"Hiển thị từ"**, **"Hiển thị đến"**.

### YC-BN-01 — Hai biên thời gian

`displayFrom` và `displayUntil`. `NULL` = không có biên tương ứng.

### YC-BN-02 — Vị từ hiển thị công khai

```
isActive = true
AND (displayFrom  IS NULL OR displayFrom  <= now)
AND (displayUntil IS NULL OR displayUntil >  now)
```

`isActive` là **công tắc thủ công giữ quyền phủ quyết**: banner đang tắt thì ẩn
bất kể cửa sổ thời gian. Cửa sổ chỉ **thu hẹp** thêm, không bao giờ mở rộng.

### YC-BN-03 — Khoảng nửa mở `[displayFrom, displayUntil)`

| Thời điểm | Kết quả |
|---|---|
| Đúng `displayFrom` | **HIỆN** |
| Đúng `displayUntil` | **TẮT** |

Chọn nửa mở vì banner thường xếp nối đuôi: A kết thúc đúng lúc B bắt đầu. Với hai
đầu đóng, giây giao nhau có hai banner cùng đủ điều kiện.

### YC-BN-04 — Cả hai biên NULL

Giữ **nguyên hành vi trước khi có tính năng**: chỉ `isActive` quyết định. Mọi
banner cũ không đổi hành vi (migration không backfill).

### YC-BN-05 — Cửa sổ một phía

Hỗ trợ đầy đủ: chỉ có `displayFrom` (hiện từ lúc đó trở đi), hoặc chỉ có
`displayUntil` (hiện tới lúc đó).

### YC-BN-06 — Ràng buộc hợp lệ

Khi có **đủ cả hai** biên: `displayFrom < displayUntil`. Bằng nhau cũng bị từ
chối (cửa sổ rỗng tuyệt đối — gần như chắc chắn là gõ nhầm). Thiếu một biên thì
không có ràng buộc nào.

Ba luật **cố ý KHÔNG áp** cho banner (khác YC-XB-04):

1. Không có ngưỡng tối thiểu 60 giây — "hiện từ bây giờ tới 30 phút nữa" là yêu
   cầu chính đáng cho banner sự kiện.
2. Không có trần 2 năm — banner mùa vụ đặt trước vài năm là bình thường.
3. Không cấm mốc quá khứ — đó chính là cách mô tả banner đã hết hạn nhưng giữ
   lại để dùng lại.

### YC-BN-07 — PATCH kiểm trên trạng thái SAU KHI TRỘN

Sửa banner phải kiểm tính hợp lệ trên **kết quả trộn** giữa giá trị đang lưu và
phần gửi lên, không phải chỉ trên phần gửi lên.

Ví dụ: bản ghi đang `[10/09, 20/09]`, PATCH gửi mỗi `displayFrom = 25/09` — bản
thân DTO không có gì sai, nhưng trạng thái sau khi ghi là `[25/09, 20/09]`, một
cửa sổ không bao giờ hiện.

### YC-BN-08 — Ba ý nghĩa của giá trị gửi lên

| Giá trị | Ý nghĩa |
|---|---|
| không gửi field | **giữ nguyên** giá trị đang lưu |
| `null` tường minh | **xoá** biên |
| chuỗi ISO có múi giờ | **đặt** biên mới |

---

## Tài liệu liên quan

- Trạng thái từng module: [module-status](../04-implementation/module-status.md)
- Kiến trúc ba lớp: [system-architecture](../02-architecture/system-architecture.md)
- Ma trận case kiểm thử: [test-cases](../06-testing/test-cases.md)
