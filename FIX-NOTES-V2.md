# FIX NOTES V2 — Yên Visuals Portfolio (29 điểm)

Bản sửa toàn bộ 29 điểm, làm trên nền bản P0-pages-fix (đã bỏ PIN admin, xoá lead
mẫu, siết `firestore.rules`, `base '/pfl-yenvisuals/'`, workflow GitHub Actions).
Ngày sửa: 05/11/2026. Đã kiểm chứng: `npx tsc --noEmit` PASS,
`npx tsx --test src/utils/portfolioLogic.test.ts` **21/21 PASS**,
`npm run build` PASS (Vite build ra `dist/` bình thường).

## Tóm tắt 29 điểm — tất cả đều đã sửa

| # | Điểm | Trạng thái |
|---|------|-----------|
| 1 | Series lọc theo `seriesId`, `photoCount` đếm thật | ✅ Xong. `App.handleSelectSeries` lọc theo `selectedSeriesId`; `SeriesSection` đếm thật từ ảnh. Lưu ý: 2 series đổi số so với ghi tay cũ — `series-nien-thieu` 4 → **5**, `series-ha-noi-thu` 3 → **2**. |
| 2 | Bảng `CATEGORY_LABELS` dùng chung | ✅ Xong. `src/utils/portfolioLogic.ts` export `CATEGORY_LABELS`; Gallery / AddPhoto / EditPhoto đều dùng. |
| 3 | Yêu thích: Zalo + copy danh sách, bỏ mặc định photo-1/photo-4 | ✅ Xong. Mặc định `[]` khi chưa có dữ liệu. Nút "Gửi qua Zalo" mở `zalo.me/0912888266` kèm danh sách, nút "Copy danh sách". Lưu ý: danh sách gửi được dựng từ ảnh đang hiển thị sau lọc/tìm kiếm (Gallery không nhận toàn bộ ảnh). |
| 4 | Tìm kiếm theo seriesId/series title/tên gói | ✅ Xong. `filterPhotos` nhận thêm `seriesTitleById`, khớp cả tên gói qua `SERIES_PACKAGE`. |
| 5 | Meta chỉ Hà Nội, bỏ "& Sài Gòn" | ✅ Xong. `index.html` + `metadata.json`. |
| 6 | Giá + nút đặt lịch ở series | ✅ Xong. `SeriesSection` hiện giá gói tương ứng (`SERIES_PACKAGE`, chỉ dùng 4 gói có sẵn) + nút "Đặt lịch gói này" mở BookingModal với gói đó; series đang xem được highlight + nút "Xem tất cả". |
| 7 | Firebase Storage cho ảnh, không base64 vào Firestore | ✅ Xong. `src/services/firebase.ts`: `getStorage` + `uploadPhotoToStorage` (resize tối đa 1600px → JPEG 0.85, giới hạn 8MB giữ nguyên, trả downloadURL). AddPhoto/EditPhoto upload lên Storage, lỗi thì báo rõ "Tải ảnh lên Storage thất bại…" và KHÔNG lưu. Thêm `storage.rules` (public read, chỉ admin write, < 8MB, `image/*`). **Phải deploy `storage.rules` riêng** (xem mục Deploy bên dưới) — chưa deploy thì upload sẽ lỗi và báo rõ, không lưu lặng. |
| 8 | Đặt lịch: `min` = ngày mai, chặn ngày quá khứ, 4 khung giờ | ✅ Xong. Khung: Sáng 7–9h, 9–11h, Chiều 14–16h, 16–18h; lưu vào lead, hiện ở Dashboard và voucher. |
| 9 | Địa điểm dropdown Hà Nội | ✅ Xong. Hoàng Thành Thăng Long, Văn Miếu, Phan Đình Phùng, Hồ Tây / Đầm Sen, Phố Cổ, Trường học (ghi rõ tên trường), Khác (nhập tay). |
| 10 | Trùng lịch: cùng SĐT + ngày + khung giờ → cảnh báo xác nhận | ✅ Xong. Hiện cảnh báo trong modal, nút "Vẫn đặt" / "Quay lại sửa" — không chặn cứng. Bỏ qua đơn đã huỷ; photobook không kiểm tra khung giờ. |
| 11 | Số người bộ đếm, vượt 15 người +80k/người, tổng tiền live | ✅ Xong. `kiyieu-lop` mặc định 5 (tối đa 30, vượt 15 tính +80k/người vượt), solo/cổ phục mặc định 1 (tối đa 2). Hiện tổng tiền ước tính + cọc + còn lại live trong form. |
| 12 | Gói photobook-print ẩn ngày chụp/địa điểm | ✅ Xong. Chỉ giữ "Ngày muốn nhận ảnh" (dùng lại `preferredDate`, nhãn khác), ẩn khung giờ/địa điểm/số người; validate tương ứng. |
| 13 | SĐT chuẩn VN 10 số, đầu 03/05/07/08/09 | ✅ Xong. `normalizePhone` (bỏ khoảng trắng/ký tự, `84` → `0`) + `isValidVietnamesePhone`, dùng ở validate, tra cứu đơn, kiểm tra trùng. |
| 14 | Email Airform: không báo "đã gửi email" | ✅ Xong. Sau đặt lịch chỉ báo "đơn đã lưu, Anh Yên sẽ liên hệ qua Zalo/SĐT trong ngày". Log email Airform no-cors đổi status `'pending'` (không còn `'delivered'` giả), có ghi chú rõ trong code. Không bịa dịch vụ gửi mới. |
| 15 | Cọc 30% + còn lại, nhắn Zalo nhận STK | ✅ Xong. `depositAmount` = 30% `estimatedPrice` (làm tròn), `balance`; hiện ở voucher + Dashboard. Ghi đúng câu "Vui lòng nhắn Zalo 0912 888 266 để nhận STK chuyển cọc" — **không bịa STK, tên ngân hàng, QR**. |
| 16 | Tra cứu đơn + nhắc Zalo trước 1 ngày | ✅ Xong. Mục "Tra cứu đơn đã đặt" ở ContactSection: nhập mã `KY-...` + SĐT → hiện trạng thái, ngày + khung giờ, gói, cọc/đã thu/còn lại, link Drive (nếu có). Voucher ghi "Anh Yên sẽ nhắn Zalo nhắc lịch trước 1 ngày." Đọc từ leads đã load, không backend mới. |
| 17 | Proofing theo mã đơn, bỏ demo/hardcode | ✅ Xong. Bỏ `unlocked=true` mặc định, bỏ tên lớp/đại diện ghi cứng (12A1 Chu Văn An, Bí thư Mai Linh), bỏ chọn sẵn 3 ảnh. Chưa nhập mã chỉ hiện form nhập mã, không hiện ảnh. Mã `KY-...` khớp với lead đã load thì mở, không khớp báo "Không tìm thấy đơn với mã này…". Lựa chọn/sao/ghi chú lưu localStorage theo mã đơn, có nút copy danh sách. **Hạn chế đã biết:** khách chưa đăng nhập thì danh sách leads không load được (Firestore `booking_leads` chỉ admin đọc — xem ghi chú cuối), nên khi leads rỗng, mã đúng định dạng vẫn được mở tạm. Muốn kiểm tra chặt 100% cần mở read công khai cho `booking_leads`, nhưng sẽ lộ thông tin khách hàng — nên KHÔNG làm trong bản này. |
| 18 | Trả ảnh gắn đơn: `driveLink` | ✅ Xong. `BookingLead.driveLink` (mặc định `''`); Dashboard nhập/sửa link Drive theo đơn + nút "Mở Drive"; khách tra cứu đơn thấy link khi có, chưa có thì ghi "Chưa có link ảnh, Anh Yên sẽ gửi sau khi trả ảnh". |
| 19 | EditPhoto upload file lên Storage, bỏ Unsplash fallback | ✅ Xong. EditPhotoModal upload file mới lên Storage như AddPhoto; ảnh lỗi/rỗng hiện khung "Chưa có ảnh" (cả Edit/Delete modal). |
| 20 | Ghim nổi bật update Firestore ảnh cũ về `false` | ✅ Xong. `handleToggleFeaturedPhoto` update ảnh cũ về `featured:false` trên Firestore trước khi set ảnh mới `true`. |
| 21 | Xoá ảnh cảnh báo featured/series, không hoàn tác | ✅ Xong. DeletePhotoModal cảnh báo nếu ảnh featured ("…trang chủ sẽ dùng ảnh khác") hoặc thuộc series (hiện tên series), luôn ghi "Không hoàn tác được sau khi xoá"; giữ xác nhận 2 bước. |
| 22 | Lỗi lưu cloud hiện thông báo rõ, không ghi đè local | ✅ Xong. Lưu/sửa/xoá ảnh hoặc lead lỗi Firestore → `window.alert` + state lỗi trong App, không ghi đè local như đã đồng bộ. |
| 23 | Tiền thật Dashboard + form lead tay có ô cọc đã thu | ✅ Xong. `calculateDashboardStats` trả `totalDeposited`/`totalPaid`/`totalBalance`; Dashboard hiện 3 thẻ Đã thu / Tiền cọc / Còn phải thu; bảng leads thêm cột khung giờ, cọc, còn lại, Drive; form thêm lead tay có ô "Tiền cọc đã thu (VNĐ)" (tự tính `depositAmount` = 30% giá gói). |
| 24 | Follow-up + lý do huỷ + lọc "Cần gọi hôm nay" | ✅ Xong. `nextFollowUpAt`, `cancelReason` trong `BookingLead`; Dashboard: đổi trạng thái thì chọn trước, hiện ô ngày hẹn gọi lại + nút Lưu; chọn `cancelled` bắt buộc nhập lý do (trống thì báo lỗi đỏ, không đổi); tab lọc "Cần gọi hôm nay" dựa trên `nextFollowUpAt` (kèm badge đếm). |
| 25 | Test email không tạo lead giả, không bẩn emailLogs chính | ✅ Xong. `handleSendTestEmail` viết lại: chỉ gửi mail thử và báo kết quả bằng alert, không tạo lead, không thêm vào `emailLogs` chính. |
| 26 | `src/config/site.ts` + thay hardcode email/SĐT | ✅ Xong. `SITE_CONFIG { photographerEmail: 'anhyenk26@gmail.com', phone: '0912888266', phoneDisplay: '0912 888 266', zaloUrl: 'https://zalo.me/0912888266', photographerName: 'Anh Yên' }`; đã thay literal ở ContactSection, BookingModal, DashboardView, AdminLoginModal, App, portfolioLogic. Còn lại: chuỗi hiển thị "0912.888.266" (ContactSection) và ví dụ SĐT trong thông báo lỗi validate — giữ nguyên vì là định dạng hiển thị/ví dụ, không phải dữ liệu. |
| 27 | Lỗi Google login hiện mã thật `err.code` + hướng dẫn | ✅ Xong. `auth/unauthorized-domain` → hướng dẫn thêm domain vào Authorized domains; `auth/operation-not-allowed` → bật Google trong Sign-in method; `auth/popup-blocked` → cho phép popup; mã khác hiện mã đó; tự đóng popup thì không hiện lỗi (như cũ). |
| 28 | App: loading/error khi subscribe ảnh, Firestore là nguồn chính | ✅ Xong. Thêm state `photosLoading`/`photosError`/`syncError`: hiện "Đang tải ảnh…" khi đang tải, "Không tải được ảnh, đang dùng bản lưu trên máy" khi lỗi; Firestore là nguồn chính, localStorage chỉ cache. Không refactor toàn bộ App. |
| 29 | SEO: og:image, robots.txt, sitemap.xml | ✅ Xong. `og:image` = `https://anhyen2k.github.io/pfl-yenvisuals/assets/aistudio/image_2abc7389.png` (+ `og:image:alt`); `public/robots.txt` và `public/sitemap.xml` cho `https://anhyen2k.github.io/pfl-yenvisuals/`. |

## Giữ nguyên từ P0 (không khôi phục)

- Không có PIN admin / `ADMIN_CREDENTIALS` / `verifyAdminCredentials` trong code
  (chỉ còn 1 test assert rằng chúng KHÔNG tồn tại). Admin chỉ đăng nhập Google
  `anhyenk26@gmail.com`.
- Không có lead mẫu (`INITIAL_LEADS = []`).
- `firestore.rules`: tạo ảnh chỉ admin.
- `vite.config.ts`: `base '/pfl-yenvisuals/'`; workflow `.github/workflows/deploy.yml` giữ nguyên.
- Không bịa STK, tên ngân hàng, QR, ảnh thật, địa chỉ Sài Gòn, giá gói mới.
  Ảnh portfolio vẫn là SVG placeholder — ảnh thật Yen tự chụp và thêm sau.

## Cách update lên GitHub Pages (nhanh nhất)

1. Giải nén file zip này, copy **toàn bộ nội dung bên trong** (kể cả thư mục ẩn
   `.github`) đè lên repo `anhyen2k/pfl-yenvisuals` nhánh `main`, commit + push.
   ⚠️ Đừng upload cả thư mục ngoài, đừng upload file zip, và đừng để mất thư mục
   `.github` khi kéo-thả (lần trước workflow đã mất vì lý do này).
2. Vào repo → Actions: chờ workflow "Deploy to GitHub Pages" chạy xong màu xanh.
3. Kiểm tra Settings → Pages → Source đang là **GitHub Actions** (không phải
   "Deploy from a branch").
4. Mở `https://anhyen2k.github.io/pfl-yenvisuals/` và hard-refresh (Ctrl+Shift+R).

## Deploy rules Firebase — BẮT BUỘC làm riêng, code không tự deploy

`firestore.rules` và `storage.rules` **không tự lên theo code web**. Làm 1 trong 2 cách:

- **Cách A (Firebase CLI):** `firebase deploy --only firestore:rules,storage`
  (chạy trong thư mục repo, đã đăng nhập Firebase project `ancient-partition-4lczw`).
- **Cách B (Console web):** vào `console.firebase.google.com` → project
  `ancient-partition-4lczw` → Firestore Database → Rules: dán nội dung file
  `firestore.rules` → Publish; rồi Storage → Rules: dán nội dung file
  `storage.rules` → Publish.

Nếu chưa deploy `storage.rules`, upload ảnh mới sẽ lỗi và web báo rõ lỗi cho admin
(đây là hành vi cố ý — không lưu lặng).

## Firebase Authentication — nhắc lại (đã hướng dẫn trước đó)

Nếu đăng nhập Google báo `auth/unauthorized-domain`: vào Firebase Console →
project `ancient-partition-4lczw` → Authentication → tab **Cài đặt** (tab cuối) →
Authorized domains → Add domain `anhyen2k.github.io` (không `https://`, không
`/pfl-yenvisuals/`). Và tab **Phương thức kết nối** → bật nhà cung cấp **Google**.
