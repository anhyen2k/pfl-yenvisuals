# YÊN PHOTO — NOTES V5 CHO GITHUB PAGES (05/11/2026)

Bản v5 gộp tất cả vào **1 zip duy nhất** để Yen up 1 lần: (a) chỉnh giá 4 gói trong
Dashboard, (b) đổi SĐT thành 0961230500 khắp web, (c) sửa lỗi đăng nhập admin,
(d) chỉnh giao diện 7 điểm, (e) base Pages '/pfl-yenvisuals/', không có
`vercel.json`. Domain Pages: **https://anhyen2k.github.io/pfl-yenvisuals/**

Kiểm chứng ngày 05/11/2026: `npx tsc --noEmit` PASS (0 lỗi),
`npx tsx --test src/utils/portfolioLogic.test.ts` **30/30 PASS** (25 cũ + 4 test
giá động + 1 test admin), `npm run build` PASS (JS 1.382 kB, chỉ cảnh báo chunk
lớn có từ trước), `dist/index.html` trỏ `/pfl-yenvisuals/assets/index-*.js` và
`/pfl-yenvisuals/assets/*.css`. Grep `0912` trong src/ + index.html + public/ =
**0**; grep tên thương hiệu cũ "Yên Visuals" (dạng từ riêng) = **0** — chỉ còn
chuỗi `pfl-yenvisuals` là tên repo GitHub (đổi tên repo sẽ đổi luôn link Pages
nên giữ nguyên).

## ⚠️ BẢN NÀY CHỈ DÙNG CHO GITHUB PAGES — KHÔNG DÙNG CHO VERCEL

Bản Vercel v4 (`base: '/'`) up lên Pages sẽ trắng trang. Bản này `base:
'/pfl-yenvisuals/'`, chỉ up lên GitHub Pages. Project Vercel `pfl-yenphoto`
cứ để đó, chưa deploy cũng không sao.

## 1. Dashboard bao quát hết chưa? (rà lại v5)

| Tab | Đã có | Thiếu cho vận hành 1 người |
|---|---|---|
| Đơn đặt lịch (Leads) | Tìm theo tên/SĐT/mã KY/email/địa điểm/ghi chú; sắp xếp mới nhất / ngày chụp / tiền còn lại; lọc trạng thái, sắp chụp ≤7 ngày, chưa cọc, chưa trả ảnh, việc cần làm; thẻ "Việc cần làm hôm nay" bấm là lọc; đơn quá hạn gọi lại tô hồng + badge; đơn sắp chụp chưa cọc badge vàng; tiền thật đã thu/cọc/còn lại; ngày hẹn gọi lại + lý do huỷ bắt buộc; link Drive theo đơn; nút Gọi/Zalo/sao chép mã; thêm đơn tay; xuất CSV/Excel theo đơn đang lọc; dạng thẻ gọn cho mobile (mới v5) | Thống kê theo tháng (doanh thu tháng này / tháng trước, số buổi đã chụp); lịch trống theo ngày/giờ để khỏi nhận trùng; nhắc lịch tự động (hiện chỉ ghi chú nhắn Zalo trước 1 ngày, chưa tự gửi) |
| Email | Log email, xem trước nội dung, gửi lại, gửi mail thử (không tạo lead giả) | Email thật có xác nhận đã gửi (hiện vẫn Airform `no-cors`, log `pending`) — cần Yen chọn Resend/Gmail + quyền Firebase |
| Ảnh | Thêm/sửa/xoá ảnh (upload Storage), ghim nổi bật, chọn Series, xem theo category | Quản lý proofing theo từng đơn (ảnh của đơn nào, khách đã chọn ảnh nào) — hiện proofing chỉ là 6 ảnh mẫu chung + lựa chọn lưu localStorage theo mã đơn |
| Cài đặt | Email nhận đơn, **chỉnh giá 4 gói (mới v5)**, SĐT/Zalo studio (chỉ xem), thông tin hệ thống | Đánh giá/review khách sau buổi chụp; quản lý lịch trống; đổi tên thương hiệu/mô tả web (hiện sửa trong code) |

Kết luận: Dashboard đã bao quát tốt việc **theo dõi đơn + tiền + gọi lại trong
ngày**. Chưa bao quát: thống kê theo tháng, lịch trống, review, proofing theo
đơn, email thật — các mục này cần Yen quyết / làm ở bản sau, không làm trong v5.

## 2. Chỉnh giá 4 gói trong Dashboard (mới v5)

Vào **Dashboard → tab Cài đặt → mục 2 "Bảng giá"**:
- Mỗi gói 1 dòng: tên gói + ô nhập giá VNĐ (nhập số thô, tự định dạng 650.000
  khi gõ) + mô tả hiển thị. Thêm 1 dòng phí vượt người cho gói Kỉ Yếu (trên
  15 bạn, mặc định 80.000đ/người).
- Nút **Lưu giá**: lưu cả 4 gói + phí vượt người cùng lúc. Giá sai (≤0, dưới
  50.000đ, trên 10.000.000đ, phí vượt người ngoài 0–500.000đ) hiện đỏ, không lưu.
- Nút **Khôi phục giá mặc định**: 650.000 / 1.200.000 / 850.000 / 450.000đ,
  phí vượt 80.000đ (có xác nhận trước khi lưu).
- Hiện "Lưu lần cuối: …" (lấy từ Firestore, chính xác cả khi đổi giá ở máy
  khác). Cảnh báo: **"Giá mới áp dụng ngay cho đơn đặt mới, đơn cũ giữ giá
  lúc đặt."**
- Giá động áp dụng khắp nơi: BookingModal (giá live, cọc 30% live, còn lại
  live, voucher), SeriesSection, form thêm đơn tay, email thông báo (giá gói
  trong mail cũng theo giá mới), Dashboard stats cho đơn mới.

Lưu ở đâu: Firestore document `settings/pricing` =
`{ prices, updatedAt, updatedBy }` + cache localStorage
`yen_photo_package_prices` (dùng khi chưa load được Cloud). Đọc giá: public
(cần cho khách xem giá/đặt lịch). Ghi giá: chỉ admin. **Phải deploy lại
`firestore.rules` mới** (đã thêm rule `settings`: `get/list` public,
`create/update/delete` chỉ admin + kiểm tra giá trong giới hạn) — xem mục 6.

## 3. Đổi số điện thoại: 0912 888 266 → 0961230500 (mới v5)

- `src/config/site.ts`: `phone: '0961230500'`, `phoneDisplay: '0961 230 500'`,
  `zaloUrl: 'https://zalo.me/0961230500'`.
- Đã đổi khắp nơi khách/admin thấy: nút Nhắn Zalo ở Hero (mới v5) / Contact /
  Dashboard, link `tel:`, placeholder SĐT trong BookingModal (`Vd:
  0961 230 500`), ô SĐT/Zalo ở Dashboard Settings, Footer, About, voucher sau
  đặt lịch, thông báo "nhắn Zalo … để nhận STK". Số cũ chỉ còn trong file ghi
  chú lịch sử này và các file notes cũ (để đối chiếu). Grep `0912` trong src/ +
  index.html + public/ = 0 (kể cả test — các số test đã đổi sang 0961...).

## 4. Sửa lỗi đăng nhập admin (mới v5)

Nguyên nhân: trước đây `AdminLoginModal` và `App.tsx` dùng `photographerEmail`
(email nhận đơn, Yen sửa được trong Dashboard Settings, lưu localStorage
`yen_photographer_email`) làm danh sách trắng admin. Nếu giá trị đó bị đổi /
có khoảng trắng / gõ sai thì tài khoản Google đúng `anhyenk26@gmail.com` vẫn
bị chặn, mà thông báo lỗi hiện 2 email giống nhau nên rất khó hiểu.

Đã sửa:
- Thêm `export const ADMIN_EMAIL = 'anhyenk26@gmail.com'` trong
  `src/config/site.ts`, **không cho sửa từ Dashboard**.
- Mọi kiểm tra admin dùng `isAdminEmail(email)` (chuẩn hoá
  `.trim().toLowerCase()` cả 2 bên) so với `ADMIN_EMAIL`.
  `photographerEmail` chỉ còn dùng cho email nhận đơn.
- Thông báo lỗi hiện rõ: `Tài khoản đã đăng nhập là "X", tài khoản quản trị
  là "anhyenk26@gmail.com".` + gợi ý xoá cài đặt email cũ nếu 2 email nhìn
  giống nhau mà vẫn lỗi.
- Dashboard Settings, ô Email nhận đơn thêm ghi chú: "Đổi email này chỉ đổi
  nơi nhận đơn, không đổi tài khoản quản trị (luôn là anhyenk26@gmail.com)."

**Nếu Yen còn bị kẹt đăng nhập:** mở trang web, bấm F12 → tab Console, gõ
`localStorage.removeItem('yen_photographer_email');` rồi Enter, tải lại trang
(F5) và đăng nhập lại bằng `anhyenk26@gmail.com`.

## 5. Chỉnh giao diện 7 điểm (mới v5)

1. **Hero:** thêm nút **Nhắn Zalo** (https://zalo.me/0961230500) cạnh 2 nút cũ.
   4 ô dưới Hero bỏ "100%" và "Giá Mềm", thay bằng số thật có sẵn: Sony A7 III,
   trả file gốc 24h, nhóm nhỏ 5–15 bạn, chỉ chụp ở Hà Nội.
2. **Navbar:** gọn còn Tác Phẩm, Bộ Ảnh Triển Lãm, Về Tác Giả & Thiết Bị,
   Liên Hệ + nút **Đặt Lịch** nổi bật. Nút "Khu Vực Khách Hàng" (proofing)
   chuyển vào menu mobile (vẫn mở được từ đó và từ ContactSection).
3. **Gallery:** bỏ 2 kiểu xem thừa, chỉ giữ **Bento** mặc định. Gộp danh mục
   loãng: "Áo Dài & Nàng Thơ" (gộp 2 tab mỗi tab 2 ảnh thành 4 ảnh), lọc vẫn
   đúng.
4. **BookingModal:** chia **3 bước** (1 chọn gói → 2 ngày/giờ/địa điểm/số
   người → 3 thông tin liên hệ), có chỉ báo bước, validate từng bước trước khi
   sang bước sau, nút Quay lại / Tiếp tục / Gửi đơn. Trên mobile có thanh
   ghim cuối màn hình hiện tổng tiền + cọc 30% live. Giá lấy từ PackagePrices
   động, không hardcode.
5. **Dải chữ cuối Hero:** chạy thật bằng CSS marquee animation (36s, lặp liền
   mạch, tắt khi bật giảm chuyển động).
6. **Chữ giá/cọc:** tăng cỡ (11–12px → 14–16px) và độ tương phản (nhãn mờ
   neutral-500 → neutral-700) ở BookingModal và SeriesSection.
7. **Dashboard mobile:** tab Leads thêm dạng **thẻ đơn gọn** (tên, mã, ngày +
   giờ, gói, tiền còn lại nổi bật, trạng thái, nút Gọi/Zalo/sao chép mã).
   Bảng đầy đủ giữ nguyên trên desktop.

KHÔNG làm trong v5: không bịa review/số liệu khách thật, không thay ảnh SVG
bằng ảnh thật (Yen sẽ chụp và thêm sau).

## 6. Cách up lên GitHub Pages (như cũ)

1. Giải nén file zip này, copy **toàn bộ nội dung bên trong** (kể cả thư mục ẩn
   `.github`) đè lên repo `anhyen2k/pfl-yenvisuals` nhánh `main`, commit + push.
   Đừng upload cả file zip, đừng để lồng trong 1 thư mục con, đừng làm mất
   thư mục `.github` khi kéo-thả.
2. Vào repo → Actions: chờ workflow "Deploy to GitHub Pages" chạy xong màu xanh.
3. Kiểm tra Settings → Pages → Source đang là **GitHub Actions**.
4. Mở `https://anhyen2k.github.io/pfl-yenvisuals/` và hard-refresh (Ctrl+Shift+R).
   Thử thêm `https://anhyen2k.github.io/pfl-yenvisuals/ve-toi`.

**Firebase — bắt buộc làm riêng, code không tự deploy:**
- Firebase Console → project `ancient-partition-4lczw` → Firestore Database →
  Rules: dán nội dung file `firestore.rules` (đã thêm rule `settings`) →
  Publish. Storage → Rules: dán `storage.rules` → Publish. Hoặc CLI:
  `firebase deploy --only firestore:rules,storage`.
- Authentication → Sign-in method: bật **Google**. Authentication → Cài đặt
  (tab cuối) → Authorized domains → thêm `anhyen2k.github.io` (nếu chưa có).

## 7. Còn cần Yen quyết (chưa làm trong v5)

- Họ tên đầy đủ có phải "Yên Nguyễn" không (mục About vẫn ghi vậy, chưa xác nhận).
- Email thật thay Airform (Resend/Gmail) + quyền Firebase.
- STK ngân hàng để hiện QR cọc (hiện voucher chỉ ghi nhắn Zalo nhận STK).
- Proofing: lấy ảnh theo đơn từ link Drive hay admin upload ảnh theo mã đơn?
- Ảnh portfolio thật: Yen tự chụp và thêm sau (hiện vẫn ảnh SVG mẫu).
- Tên miền riêng: chưa có, vẫn dùng Pages.
