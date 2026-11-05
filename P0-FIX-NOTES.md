# P0-FIX-NOTES — Yên Visuals portfolio (bản nháp, chưa public)

Bản này được tạo ngày 05/11/2026 từ file gốc
`y_n-visuals-_-k_-y_u-_-_o-d_i-portfolio.zip`, chỉ sửa các mục P0 sau.
File gốc không bị thay đổi.

## Đã sửa (đã kiểm chứng: `tsc --noEmit` pass, test 15/15 pass, `vite build` pass)

1. **Bỏ đăng nhập admin bằng PIN** — `src/utils/portfolioLogic.ts`
   - Xoá `ADMIN_CREDENTIALS` (`1998`, `888266`, `anhyen2026`, `admin123`,
     và cả email `anhyenk26@gmail.com` vốn cũng được chấp nhận làm mật khẩu)
     cùng hàm `verifyAdminCredentials`.
   - `src/components/AdminLoginModal.tsx`: bỏ toàn bộ form PIN, nút điền nhanh
     PIN/pass và gợi ý mật khẩu; chỉ còn nút **Đăng nhập với Google
     (anhyenk26@gmail.com)**.
   - `src/App.tsx`: quyền admin không còn đọc cờ `localStorage`
     `yen_admin_auth` khi mở trang nữa — admin chỉ được cấp khi Firebase Auth
     xác nhận đúng email Yen (logic `onAuthStateChanged` đã có sẵn).
     Lưu ý: trình duyệt nào trước đây từng đăng nhập bằng PIN sẽ tự về
     quyền khách khi mở lại, cho tới khi đăng nhập Google.
   - `src/utils/portfolioLogic.test.ts`: test PIN cũ được thay bằng test mới
     khẳng định `verifyAdminCredentials` / `ADMIN_CREDENTIALS` không còn
     được export nữa.

2. **Xoá 3 lead mẫu** — `INITIAL_LEADS` trong `src/utils/portfolioLogic.ts`
   thành mảng rỗng. Dashboard sẽ mở ra trống, không còn tên/SĐT/email mẫu
   (KY-88201, KY-88195, KY-88172) làm sai thống kê.

3. **Siết Firestore rule cho ảnh** — `firestore.rules`
   - `portfolio_photos` create: chỉ admin (`isAdmin()`) mới được tạo ảnh.
     Trước đây bất kỳ ai cũng tạo được ảnh hợp lệ vào web.
   - `email_logs` create: **chưa siết trong bản này**, vì code đặt lịch
     (`BookingModal.tsx:126`, `App.tsx:415`) đang ghi log email từ phía
     khách chưa đăng nhập. Siết rule này ngay sẽ làm hỏng luồng ghi log
     (lỗi bị nuốt lặng trong `catch`). Cần dời việc ghi log lên phía server
     (Cloud Function) trước rồi mới khoá rule — xem mục "Chưa làm" dưới.

## Chưa làm (cần Yen quyết / cần thêm thông tin)

- **Email đặt lịch (Airform `no-cors`, luôn báo success):** chưa sửa, vì cần
  chọn dịch vụ gửi thật (Cloud Function + Resend/Gmail) và cần quyền vào
  Firebase project `ancient-partition-4lczw`. Đơn vẫn được lưu Firestore +
  localStorage nên hiện tại chưa mất đơn, nhưng Yen nên mở Dashboard kiểm
  tra đơn thay vì chờ email.
- **Ảnh portfolio thật:** 12 ảnh vẫn là SVG mẫu. Cần Yen gửi ảnh thật
  (nén WebP) mới thay được.
- **Lịch trống / cọc QR / proofing theo buổi (P1):** chưa làm, theo lộ trình
  đã phân tích ngày 05/11/2026.

## Cách dùng bản này

1. Giải nén, chạy `npm install --legacy-peer-deps` (hoặc `bun install`),
   rồi `npm run build` để kiểm tra.
2. Deploy code mới, sau đó deploy `firestore.rules` mới lên Firebase.
3. Đăng nhập admin lại bằng Google `anhyenk26@gmail.com` để chắc chắn
   vẫn vào được Dashboard trước khi gửi link cho khách.
