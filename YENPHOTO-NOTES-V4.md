# YÊN PHOTO — NOTES V4 (bản Vercel, 05/11/2026)

Bản này làm từ Vercel v3 (đã sửa 29 điểm + đường dẫn sạch), chỉ rà soát lại toàn bộ,
đổi thương hiệu Yên Visuals → Yên Photo và tối ưu Dashboard. Domain Vercel:
**https://pfl-yenphoto.vercel.app/**

Kiểm chứng: `npx tsc --noEmit` PASS (0 lỗi), `npx tsx --test
src/utils/portfolioLogic.test.ts` **25/25 PASS** (21 cũ + 4 mới), `npm run build`
PASS (JS 1.374 kB, chỉ cảnh báo chunk lớn có từ trước), `dist/index.html` không
còn `/pfl-yenvisuals/assets/`, grep "Visuals" trong src/ + index.html + public/ = **0**.

## 1. Rà soát v4 — đã sửa thêm

### Lỗi làm mất ảnh mẫu (nghiêm trọng nhất, v3)
- `src/services/firebase.ts`: thêm `seedMissingPortfolioPhotos()` — seed từng ảnh
  mẫu còn thiếu thay vì chỉ seed khi collection rỗng; thêm `deletePhotoFromStorage()`
  để xoá file gốc trên Storage khi xoá ảnh.
- `src/App.tsx`: gọi seed khi admin đăng nhập (1 lần/trình duyệt, cờ
  `yen_photo_seed_v1`). Trước đây `seedPortfolioPhotosIfEmpty` không được gọi ở
  đâu: chỉ cần cloud có 1 ảnh là subscription thay toàn bộ 12 ảnh mẫu bằng mỗi
  ảnh đó.
- `src/App.tsx` `handleSaveEditedPhoto`: ghim featured 1 ảnh thì bỏ ghim các ảnh
  khác cả local lẫn Cloud (trước đây Firestore có thể có nhiều ảnh cùng featured).
- `src/App.tsx` `handleUpdateLeadNotes`: thêm guard đơn không tồn tại (trước đây
  vẫn `saveBookingLeadToCloud({id, notes})` tạo document rác).
- `src/App.tsx` `handleConfirmDeletePhoto`: gọi thêm `deletePhotoFromStorage`.

### Bảo mật admin
- `src/components/AdminLoginModal.tsx`: **trước đây bất kỳ tài khoản Google nào
  đăng nhập xong cũng thành admin**. Nay kiểm tra
  `user.email === photographerEmail` (anhyenk26@gmail.com), sai thì `logoutUser()`
  + báo lỗi rõ tài khoản nào. Sửa toàn bộ chữ không dấu trong modal
  ("Chi tai khoan Google…" → "Chỉ tài khoản Google…").
- `src/App.tsx` auth listener: tài khoản Google khác đăng nhập thì hạ quyền về
  `guest` + xoá cờ `yen_admin_auth`.

### Ngày/giờ + validate + tiền
- `src/utils/portfolioLogic.ts` `todayISO()/tomorrowISO()`: dùng ngày giờ địa
  phương thay vì `toISOString()` (UTC) — sáng sớm ở VN hàm cũ trả về ngày hôm
  trước, validate cho lọt ngày đã qua và date-picker `min` lệch 1 ngày.
- `validateBookingInquiry`: yêu cầu ngày **từ ngày mai trở đi** (khớp
  `min=tomorrowISO()` của date input); thêm kiểm tra gói kỉ yếu tối thiểu 5 bạn;
  thông báo lỗi SĐT dùng `SITE_CONFIG.phoneDisplay`.
- Giá kỉ yếu "(Chỉ ~80k - 150k/bạn)" **sai** (1.200k/5 bạn = 240k) → sửa thành
  "~80k - 240k/bạn".
- `src/components/BookingModal.tsx`: stepper số người min 5 cho gói kỉ yếu; hộp
  "Tổng tiền + cọc 30%" hiện cả gói photobook; placeholder SĐT sai "01212320"
  (8 số) → dùng `SITE_CONFIG.phoneDisplay`; màn xác nhận gói photobook không còn
  nói "nhắc lịch trước 1 ngày" mà là "báo khi ảnh in xong".

### Email Airform (chỉ sửa text, không bịa dịch vụ mới)
- `generateEmailNotification`: footer email ghi link cụt `"https://ais-dev-..."`
  → dùng `SITE_CONFIG.siteUrl`; `fromEmail` hardcode → dùng email nhận truyền vào
  (trong code log là `anhyenk26@gmail.com`, không bịa domain mới).
- `exportLeadsToExcel`: mảng độ rộng cột chỉ có 14 cho 21 cột → bổ sung đủ 21.

### Khách xem / Gallery / Series / Lightbox
- `src/data/portfolioData.ts`: `photoCount` sai so với ảnh thật:
  `series-nien-thieu` 4→5, `series-ha-noi-thu` 3→2.
- `src/components/SeriesSection.tsx` + `src/App.tsx`: SeriesSection nhận thêm
  prop `photos` (ảnh Cloud đang hiển thị) để đếm theo series; trước đây chỉ đếm
  từ `INITIAL_PHOTOS` nên ảnh Yen thêm sau không làm tăng số đếm.
- `src/components/Gallery.tsx`: chip "Đang lọc ảnh yêu thích (N)" và thanh chia sẻ
  dùng tổng số yêu thích trong khi danh sách Zalo/copy chỉ gồm ảnh đang hiển thị
  → đổi sang số ảnh yêu thích thật trong danh sách hiển thị; thanh chia sẻ chỉ
  hiện khi có ảnh yêu thích đang hiển thị.
- `src/components/Hero.tsx`: badge "Sony A7 III · 85mm f/1.8" hardcode → lấy theo
  ảnh tiêu biểu thật; `App.tsx` thêm fallback để Hero không crash khi danh sách
  ảnh rỗng.
- `src/components/LightboxModal.tsx`: ảnh mở từ Hero có thể không nằm trong danh
  sách đang lọc — trước đây hiện "0 / N" và nút "tiếp" nhảy sai; nay hiện
  "1 / N", "tiếp" về ảnh đầu danh sách. Nút copy link chỉ báo "đã copy" khi copy
  thật sự thành công. Bỏ 4 import không dùng.
- `src/App.tsx` + `src/utils/cleanPaths.ts`: thêm mở lightbox khi load link
  `#photo-<id>`; trước đây link copy từ Lightbox mở ra chỉ là trang chủ.
- `src/components/Footer.tsx`: **xoá 4 link mạng xã hội** (Instagram/Behance/VSCO/
  500px) vì chỉ trỏ về trang chủ chung, không phải tài khoản của Yen. Yen cho
  handle thật thì thêm lại.
- `src/components/ContactSection.tsx`: SĐT hardcode → dùng
  `SITE_CONFIG.phoneDisplay`; nhãn kết quả tra cứu "Ngày chụp" → "Ngày nhận ảnh"
  với gói photobook; thông báo tra cứu thất bại nói rõ chỉ tra được đơn đặt trên
  thiết bị/trình duyệt này, đặt ở máy khác thì nhắn Zalo.
- `src/components/ClientProofingModal.tsx`: mã đơn chuẩn hoá về chữ hoa khi mở
  khoá (input `uppercase` chỉ đổi hiển thị, giá trị gõ thường làm lệch khoá
  localStorage theo mã đơn).
- `src/services/firebase.ts`: 3 hàm subscribe gọi `handleFirestoreError()` (throw)
  trong callback lỗi của `onSnapshot` → thành uncaught exception; nay chỉ log +
  gọi `onError`. `uploadPhotoToStorage`: phần mở rộng file lấy theo blob thật sau
  khi nén (ảnh nén ra JPEG phải là `.jpg`, trước đây file PNG gốc vẫn ghi `.png`
  dù nội dung là JPEG).
- `src/components/AddPhotoModal.tsx`: thêm chọn Series; tự đọc kích thước ảnh
  upload để đặt đúng `orientation`/`aspectRatio` (trước đây mọi ảnh mới đều bị
  gán landscape 4:3); reset toàn bộ form khi đóng/thêm xong.
- `src/components/EditPhotoModal.tsx`: thêm chọn Series; đổi URL ảnh thì reset cờ
  ảnh hỏng; đổi `aspectRatio` thì đổi `orientation` theo; placeholder sai
  "FE 85mm f/1.4 GM" → "FE 85mm f/1.8" (Yen không có ống f/1.4 GM), năm "2024" →
  "2026".

### Test cập nhật
- `src/utils/portfolioLogic.test.ts`: thêm 4 test (ngày giờ địa phương + không đặt
  trong ngày, kỉ yếu tối thiểu 5 bạn, khoảng 80k–240k/bạn, email log dùng siteUrl
  thật/không còn `ais-dev`); test `due-today` dùng `todayISO()` thay vì
  `toISOString()`.

## 2. Đổi tên thương hiệu Yên Visuals → Yên Photo

Đã đổi khắp nơi khách nhìn thấy: `src/` (Navbar, Hero, Footer, Gallery,
ContactSection, BookingModal, ClientProofingModal, DashboardView, AdminLoginModal,
LightboxModal, portfolioLogic, portfolioData, site.ts), `index.html` (title
"Yên Photo — Kỉ Yếu & Áo Dài Photography Portfolio", og:title, og:image:alt),
`public/sitemap.xml`, `public/robots.txt`, `metadata.json`, `README.md`,
`src/config/site.ts` (thêm `brandName: 'Yên Photo'`).
- `fromEmail` trong log email đổi từ `noreply@yenvisuals.vn` thành
  `anhyenk26@gmail.com` (email thật của Yen, không bịa domain `yenphoto.vn`).
- Footer "© 2026 Yên Nguyễn Visuals" → "© 2026 Yên Photo".
- KHÔNG đổi: email anhyenk26@gmail.com, SĐT/Zalo 0912 888 266, tên repo GitHub
  `pfl-yenvisuals`, domain `pfl-yenphoto.vercel.app`, các file ghi chú lịch sử
  (P0-FIX-NOTES.md, FIX-NOTES-V2.md, DEPLOY-FIX-NOTES.md, VERCEL-NOTES.md).
- Grep "Visuals" trong src/ + index.html + public/ = 0. Còn sót ở chỗ kỹ thuật
  không hiện cho khách, liệt kê rõ: tên repo `pfl-yenvisuals` trong comment của
  `.github/workflows/deploy.yml` và `vite.config.ts`; `firestoreDatabaseId`
  `ai-studio-ynvisualskyuodip-...` trong `firebase-applet-config.json` (ID của
  Firebase, không đổi được); file plan cũ trong `.aistudio/artifacts/...`
  (lịch sử AI Studio).

## 3. Dashboard đã tối ưu (src/components/DashboardView.tsx, ~1.932 dòng)

- **(a) Sắp xếp:** mặc định mới nhất trước; dropdown "Sắp xếp": Mới nhất / Cũ
  nhất / Ngày chụp gần nhất / Tiền còn lại nhiều nhất. `createdAt` lưu dạng
  chuỗi vi-VN nên có helper parse riêng; tiền còn lại dùng
  `balance ?? max(0, estimatedPrice − paidAmount)`.
- **(b) Tìm kiếm:** ô search có sẵn trước đây không tìm được mã đơn; nay tìm cả
  tên, SĐT, mã đơn KY-... (gõ `KY12345` không dấu `-` vẫn khớp), email, địa điểm,
  ghi chú, lời nhắn; SĐT khớp cả dạng có khoảng trắng/đầu 84 hay 0.
- **(c) Bộ lọc:** thêm chip "Sắp chụp ≤ 7 ngày", "Chưa cọc", "Chưa trả ảnh",
  "Việc cần làm", mỗi chip có badge đếm; các chip trạng thái cũ giữ nguyên.
  Điều kiện (theo giờ địa phương Hà Nội, không dùng UTC): sắp chụp trong
  [hôm nay, hôm nay+7] và chưa huỷ/hoàn thành; chưa cọc khi
  `paidAmount < depositAmount` và chưa huỷ; chưa trả ảnh khi đã tới ngày chụp,
  chưa huỷ/hoàn thành và `driveLink` trống.
- **(d) Nổi bật:** đơn quá hạn gọi lại (`nextFollowUpAt` < hôm nay, trạng thái
  new/consulting) tô nền hồng + badge "Quá hạn"; đơn sắp chụp chưa cọc có badge
  vàng "Sắp chụp chưa cọc".
- **(e) Thẻ "Việc cần làm hôm nay":** đếm số đơn duy nhất thuộc ≥1 nhóm (cần gọi
  lại + sắp chụp chưa cọc + chưa trả ảnh), hiện chi tiết từng nhóm; bấm thẻ thì
  lọc luôn danh sách, bấm lại để bỏ lọc.
- **(f) Nút nhanh:** Gọi `tel:` và Zalo đã có — nay chuẩn hoá số qua
  `normalizePhone` (đầu 84 → 0); mới thêm nút "Sao chép mã" cạnh mã đơn và hàng
  nút icon Gọi / Zalo / Sao chép mã / Mở Drive (Drive chỉ hiện khi có link);
  copy có fallback, báo toast kèm mã đơn.
- **(g) Xuất CSV/Excel:** giờ chỉ xuất `filteredLeads` (đơn đang lọc + tìm kiếm +
  sắp xếp) thay vì toàn bộ; nhãn nút ghi rõ "Xuất File Excel (N đơn đang lọc)"
  và "CSV (N đơn đang lọc)".
- Giữ nguyên các tab leads/emails/photos/settings và mọi trường
  (`depositAmount`, `paidAmount`, `driveLink`, `nextFollowUpAt`, `cancelReason`);
  không đổi schema Firestore.

## 4. Điểm vẫn chưa sửa — cần Yen quyết

- **Tra cứu đơn và Proofing khi leads rỗng vẫn mở tạm mã đúng định dạng:** khách
  đặt ở máy khác không tra/proofing được vì `booking_leads` cấm đọc công khai.
  Sửa đúng cần mở read công khai (lộ thông tin khách) hoặc làm API/proxy kiểm tra
  mã — không tự mở. Cần Yen quyết phương án.
- **Proofing hiện 6 ảnh mẫu chung, không phải ảnh thật của đơn đó:** chưa có dữ
  liệu ảnh theo đơn (chỉ có `driveLink` trong lead). Cần Yen quyết: proofing lấy
  ảnh từ link Drive của đơn, hay admin upload ảnh theo mã đơn.
- **Gallery ghi "HÌNH ẢNH THỰC TẾ" nhưng ảnh vẫn là SVG mẫu:** ảnh thật Yen tự
  chụp và thêm sau; không thay bằng ảnh giả khác.
- **Tên "Yên Nguyễn" ở AboutSection:** chưa có nguồn nào xác nhận họ của Yen là
  Nguyễn (chỉ biết "Anh Yên") — không tự đổi, cần Yen xác nhận họ tên đầy đủ.
- **Gói solo/cổ phục cho tối đa 2 bạn cùng giá 650k/850k:** giữ nguyên vì có thể
  Yen chủ ý cho chụp đôi; nếu chỉ 1 người thì Yen xác nhận lại.
- **Email thật thay Airform:** email đặt lịch vẫn qua Airform `no-cors`, log ở
  trạng thái `pending` (không báo "đã gửi" giả). Muốn gửi thật cần Yen chọn dịch
  vụ (Resend/Gmail) + quyền truy cập Firebase project — chưa làm trong bản này.
- **STK ngân hàng / QR cọc:** vẫn chưa có — voucher chỉ ghi "nhắn Zalo 0912 888
  266 để nhận STK chuyển cọc". Yen cho STK thì thêm.
- **Tên miền riêng:** chưa có — vẫn dùng `pfl-yenphoto.vercel.app` (Yen đã nói
  không muốn mua tên miền riêng).
- **Seed ảnh mẫu:** seed chỉ chạy 1 lần/trình duyệt admin (cờ `yen_photo_seed_v1`).
  Nếu Yen xoá 1 ảnh mẫu rồi đăng nhập ở trình duyệt khác, ảnh đó có thể bị seed
  lại; chấp nhận được, hoặc làm cờ seed trên Cloud sau này.
- **Chưa deploy `firestore.rules` / `storage.rules` lên Firebase:** seed và upload
  Storage chỉ chạy khi rules đã deploy và tài khoản admin là anhyenk26@gmail.com.
  Nhắc Yen kiểm tra bước này khi deploy v4.
- **Đường dẫn sạch khi load trực tiếp `/ve-toi`:** phụ thuộc rewrite của
  `vercel.json` trên Vercel thật, chưa được test bằng một lần deploy thật (chỉ
  kiểm chứng build + bundle).

## 5. Deploy lên Vercel (project pfl-yenphoto)

1. Giải nén zip này, copy **toàn bộ nội dung bên trong** (kể cả thư mục ẩn
   `.github`) đè lên repo `anhyen2k/pfl-yenvisuals` nhánh `main`, commit + push.
   ⚠️ Đừng upload cả file zip, đừng để mất thư mục `.github` khi kéo-thả.
2. Vercel → project **pfl-yenphoto** (Team YENPHOTO, Hobby): Root Directory `./`,
   Framework **Vite**, Build Command `npm run build`, Output Directory `dist`,
   Install Command `npm install --legacy-peer-deps`. Bấm **Deploy**, chờ xanh.
3. Firebase Console → project `ancient-partition-4lczw` → Authentication →
   Sign-in method: bật **Google**; Authentication → Cài đặt → Authorized domains
   → Add domain `pfl-yenphoto.vercel.app` (không `https://`, không `/` ở cuối).
4. Deploy `firestore.rules` và `storage.rules` riêng (Firebase CLI
   `firebase deploy --only firestore:rules,storage` hoặc dán vào Console).

## ⚠️ CẢNH BÁO — bản này chỉ cho Vercel, KHÔNG dùng cho GitHub Pages

Bản này build với `base: '/'`. Up lên GitHub Pages
(`anhyen2k.github.io/pfl-yenvisuals/`) sẽ làm hỏng link Pages cũ vì Pages cần
`base: '/pfl-yenvisuals/'`. File `.github/workflows/deploy.yml` vẫn còn trong
repo — đẩy bản này lên nhánh `main` sẽ kích hoạt workflow Pages và làm hỏng link
Pages cũ. Từ giờ chỉ dùng `https://pfl-yenphoto.vercel.app/`.
