PROMPT CHO ĐỘI DEV: Ưu tiên phát triển phần Đăng nhập Admin/CMS

Đội dev triển khai trước module Đăng nhập cho hệ thống quản trị doanh nghiệp Admin/CMS.BƯỚC NÀO LÀM RỒI CÓ THỂ QUA BƯỚC TIẾP THEO
Tech stack hiện tại: TypeScript + React.
Yêu cầu xử lý lỗi bằng Toast Notification theo toast library đang dùng trong project.

1. Phạm vi chức năng

Triển khai phần đăng nhập cho Admin/CMS gồm:

Màn hình đăng nhập.
Xử lý validate form đăng nhập.
Gọi API đăng nhập.
Lưu trạng thái đăng nhập.
Điều hướng sau khi đăng nhập thành công.
Bảo vệ route Admin/CMS.
Xử lý đăng xuất.
Xử lý lỗi bằng toast.
Không có chức năng đăng ký.
Không có đăng nhập bằng Facebook.
Không có đăng nhập bằng GitHub. 2. Chức năng bắt buộc
2.1. Màn hình đăng nhập

Giao diện login cần có:

Logo hoặc tên hệ thống.
Tiêu đề: Đăng nhập hệ thống quản trị.
Input Email hoặc Tên đăng nhập.
Input Mật khẩu.
Nút hiển thị / ẩn mật khẩu.
Checkbox Ghi nhớ đăng nhập nếu backend có hỗ trợ.
Nút Đăng nhập.
Link Quên mật khẩu? nếu hệ thống có module reset password.
Loading state khi đang gửi request.
Disable button khi form đang submit.
Hỗ trợ nhấn Enter để đăng nhập.
Responsive tốt trên desktop, tablet, mobile.

Không hiển thị:

Nút đăng ký.
Login Facebook.
Login GitHub.
Các social login không được yêu cầu. 3. Nghiệp vụ xử lý đăng nhập

Luồng xử lý chuẩn:

User mở trang /login
|
v
Nếu đã đăng nhập -> redirect về Dashboard
|
v
Nhập email/username + password
|
v
Validate dữ liệu
|
v
Gọi API login
|
+-- Thành công -> lưu auth state -> redirect Dashboard
|
+-- Thất bại -> hiển thị lỗi bằng toast 4. Validate form

Cần validate tối thiểu:

Email / Username
Không được để trống.
Nếu dùng email thì phải đúng định dạng email.
Trim khoảng trắng đầu/cuối.
Không cho submit nếu input không hợp lệ.

Thông báo gợi ý:

"Vui lòng nhập email"
"Email không đúng định dạng"
"Vui lòng nhập tên đăng nhập"
Mật khẩu
Không được để trống.
Tối thiểu 8 ký tự nếu hệ thống đang áp dụng rule password production.
Không trim toàn bộ password nếu backend cho phép ký tự space, nhưng cần xử lý cẩn thận theo rule backend.

Thông báo gợi ý:

"Vui lòng nhập mật khẩu"
"Mật khẩu phải có ít nhất 8 ký tự" 5. Quy chuẩn hiển thị lỗi bằng Toast

Không dùng alert().

Tất cả lỗi nghiệp vụ và lỗi server phải hiển thị bằng toast.

Ví dụ:

toast.error("Email hoặc mật khẩu không đúng");
toast.error("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên");
toast.error("Bạn đăng nhập sai quá nhiều lần. Vui lòng thử lại sau");
toast.error("Không thể kết nối máy chủ. Vui lòng kiểm tra mạng");
toast.error("Có lỗi xảy ra. Vui lòng thử lại sau");
Mapping lỗi API đề xuất
HTTP Status Ý nghĩa Toast message
400 Dữ liệu không hợp lệ Thông tin đăng nhập không hợp lệ
401 Sai tài khoản hoặc mật khẩu Email hoặc mật khẩu không đúng
403 Tài khoản không có quyền vào Admin/CMS Tài khoản không có quyền truy cập hệ thống quản trị
423 Tài khoản bị khóa Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên
429 Đăng nhập sai quá nhiều lần Bạn đăng nhập sai quá nhiều lần. Vui lòng thử lại sau
500 Lỗi server Hệ thống đang gặp lỗi. Vui lòng thử lại sau
Network Error Mất mạng hoặc timeout Không thể kết nối máy chủ. Vui lòng kiểm tra mạng

Lưu ý bảo mật: với lỗi sai tài khoản hoặc mật khẩu, không được báo cụ thể là email tồn tại hay không tồn tại. Chỉ dùng thông báo chung:

"Email hoặc mật khẩu không đúng" 6. UX bắt buộc

Cần xử lý tốt các trạng thái sau:

Khi đang submit, button chuyển thành loading.
Không cho bấm đăng nhập nhiều lần liên tiếp.
Sau khi login lỗi, giữ lại email/username đã nhập.
Không clear mật khẩu nếu lỗi validate client-side.
Có thể clear mật khẩu nếu server trả về lỗi đăng nhập thất bại.
Focus vào input đầu tiên bị lỗi.
Có nút hiện/ẩn mật khẩu.
Toast không bị spam khi user submit liên tục.
Message lỗi ngắn gọn, dễ hiểu, tiếng Việt.
Không để lộ lỗi kỹ thuật như stack trace, exception, SQL error. 7. Luồng điều hướng

Yêu cầu:

Nếu login thành công, redirect về /dashboard hoặc route mặc định của Admin/CMS.
Nếu user truy cập route cần đăng nhập, ví dụ /admin/users, nhưng chưa login:
Redirect về /login.
Sau khi login thành công, redirect lại route ban đầu nếu có lưu redirectUrl.
Nếu user đã login mà truy cập /login, redirect về Dashboard.
Khi logout:
Gọi API logout nếu backend hỗ trợ.
Clear auth state.
Redirect về /login.
Hiển thị toast thành công nếu phù hợp:
toast.success("Đăng xuất thành công"); 8. Bảo vệ route Admin/CMS

Cần có cơ chế bảo vệ route.

Ví dụ logic:

ProtectedRoute
|
+-- Chưa đăng nhập -> redirect /login
|
+-- Đã đăng nhập nhưng không có quyền -> redirect /403
|
+-- Đã đăng nhập và có quyền -> render page

Yêu cầu:

Không chỉ ẩn menu ở frontend.
API backend vẫn phải kiểm tra quyền.
Frontend cần xử lý response 401 và 403.

Khi API trả 401:

toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại");

Sau đó redirect về /login.

Khi API trả 403:

toast.error("Bạn không có quyền thực hiện thao tác này"); 9. Quản lý auth state

Cần thống nhất cách quản lý trạng thái đăng nhập.

Có thể dùng:

React Context.
Zustand.
Redux Toolkit.
Hoặc state management hiện có của project.

Auth state tối thiểu nên có:

type AuthUser = {
id: string;
name: string;
email: string;
role: string;
permissions?: string[];
};

type AuthState = {
user: AuthUser | null;
isAuthenticated: boolean;
isLoading: boolean;
}; 10. API contract đề xuất
Login request
type LoginRequest = {
email: string;
password: string;
rememberMe?: boolean;
};

Hoặc nếu hệ thống dùng username:

type LoginRequest = {
username: string;
password: string;
rememberMe?: boolean;
};
Login response

Ưu tiên backend dùng HttpOnly Secure Cookie để lưu session/token.

Response gợi ý:

type LoginResponse = {
user: {
id: string;
name: string;
email: string;
role: string;
permissions?: string[];
};
};

Nếu backend dùng access token:

type LoginResponse = {
accessToken: string;
refreshToken?: string;
user: {
id: string;
name: string;
email: string;
role: string;
permissions?: string[];
};
};

Lưu ý bảo mật:

Không log password.
Không log token.
Không lưu token vào localStorage nếu có thể tránh.
Ưu tiên HttpOnly Cookie do backend set.
Cookie production cần có HttpOnly, Secure, SameSite. 11. Cấu trúc file đề xuất

Có thể tổ chức như sau:

src/
features/
auth/
pages/
LoginPage.tsx
components/
LoginForm.tsx
PasswordInput.tsx
services/
auth.service.ts
hooks/
useAuth.ts
types/
auth.types.ts
utils/
auth-error-message.ts
routes/
ProtectedRoute.tsx 12. Yêu cầu TypeScript

Code cần đảm bảo:

Không dùng any nếu không cần thiết.
Có type rõ cho request/response.
Có type cho lỗi API.
Component props có interface/type rõ ràng.
Không để warning TypeScript.
Không để console log dữ liệu nhạy cảm.

Ví dụ type lỗi:

type ApiError = {
status?: number;
message?: string;
code?: string;
}; 13. Toast helper

Nên tách helper xử lý message lỗi để dễ maintain.

Ví dụ:

export function getLoginErrorMessage(status?: number): string {
switch (status) {
case 400:
return "Thông tin đăng nhập không hợp lệ";
case 401:
return "Email hoặc mật khẩu không đúng";
case 403:
return "Tài khoản không có quyền truy cập hệ thống quản trị";
case 423:
return "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên";
case 429:
return "Bạn đăng nhập sai quá nhiều lần. Vui lòng thử lại sau";
case 500:
return "Hệ thống đang gặp lỗi. Vui lòng thử lại sau";
default:
return "Có lỗi xảy ra. Vui lòng thử lại sau";
}
} 14. Các case cần test trước khi bàn giao

Dev cần test tối thiểu các case sau:

Case Kết quả mong muốn
Nhập đúng tài khoản/mật khẩu Login thành công, vào Dashboard
Sai mật khẩu Toast báo Email hoặc mật khẩu không đúng
Email không tồn tại Toast báo chung, không lộ email tồn tại hay không
Bỏ trống email Validate lỗi
Bỏ trống mật khẩu Validate lỗi
Email sai định dạng Validate lỗi
Click hiện/ẩn mật khẩu Hoạt động đúng
Bấm Enter Submit form
Submit nhiều lần liên tục Không gửi nhiều request song song
API trả 401 Toast lỗi và không login
API trả 403 Toast không có quyền
API trả 423 Toast tài khoản bị khóa
API trả 429 Toast đăng nhập sai quá nhiều lần
Mất mạng Toast lỗi kết nối
Đã login vào /login Redirect Dashboard
Chưa login vào route admin Redirect /login
Logout Clear session và về login
Session hết hạn Toast hết phiên và về login 15. Definition of Done

Hoàn thành khi:

Login UI đúng thiết kế Admin/CMS.
Không có đăng ký tài khoản.
Không có Facebook/GitHub login.
Validate form đầy đủ.
Gọi API login thành công.
Lỗi nghiệp vụ hiển thị bằng toast.
Có loading state khi submit.
Có protected route.
Có xử lý logout.
Có xử lý session hết hạn.
Code TypeScript sạch, không lỗi type.
Không log password/token.
Đã test các case chính trước khi bàn giao. 16. Ưu tiên triển khai

Làm theo thứ tự:

Tạo UI Login Page.
Tạo form validate.
Tích hợp toast.
Tích hợp API login.
Lưu auth state.
Redirect sau login.
Tạo ProtectedRoute.
Xử lý logout.
Xử lý lỗi 401, 403, 429, network error.
Test toàn bộ flow production.
