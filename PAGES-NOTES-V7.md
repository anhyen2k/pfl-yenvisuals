# YÊN PHOTO — NOTES V7 CHO GITHUB PAGES (05/11/2026)

Bản v7 chỉ đổi **thiết kế** (giao diện khách hàng), không đổi tính năng/nghiệp vụ nào
của v6: proofing theo đơn, chỉnh giá, chỉnh nội dung Dashboard, SĐT 0961230500,
đăng nhập admin, tốc độ ảnh, form 3 bước — giữ nguyên hết. Base Pages
`/pfl-yenvisuals/`, không có `vercel.json`. Domain Pages:
**https://anhyen2k.github.io/pfl-yenvisuals/**

Kiểm chứng ngày 05/11/2026: `npx tsc --noEmit` PASS (0 lỗi),
`npx tsx --test src/utils/portfolioLogic.test.ts` **38/38 PASS** (như v6),
`npm run build` PASS, `dist/index.html` trỏ `/pfl-yenvisuals/assets/`.
Grep `Cormorant|Plus Jakarta|JetBrains` trong `src/` + `index.html` = **0**;
grep `0912` = **0**. Đã kiểm tra trực tiếp CSS Google Fonts trả về có 8 khối
`@font-face` subset `vietnamese` cho cả Fraunces và Be Vietnam Pro.

## ⚠️ BẢN NÀY CHỈ DÙNG CHO GITHUB PAGES — KHÔNG DÙNG CHO VERCEL

Up bản này lên GitHub Pages như các bản trước (giải nén, up toàn bộ file lên
gốc repo `pfl-yenvisuals`, branch `main`, đợi workflow chạy xong). Rules
Firestore/Storage đã deploy từ v6 thì không cần deploy lại.

## 1. Hệ chữ mới — vì sao chọn

Trước đây web dùng 3 họ font cùng lúc (Cormorant Garamond + Plus Jakarta Sans
+ JetBrains Mono) và nhiều cỡ chữ 10–12px lẫn lộn — đó là một trong những
nguyên nhân nhìn rối. Bản v7 chỉ còn **2 họ font**, cả 2 đều hỗ trợ tiếng Việt
có dấu đầy đủ (subset `vietnamese` trên Google Fonts, đã kiểm tra thực tế):

- **Fraunces** — tiêu đề/display. Serif biến thể kiểu editorial, đang là xu
  hướng 2025–2026 cho studio ảnh/portfolio (chữ có "cá tính" nhưng vẫn đọc
  rõ tiếng Việt, dấu xếp chồng không bị vỡ). Dùng weight 400–600, italic
  chỉ cho 1–2 từ nhấn. Thay Cormorant Garamond.
- **Be Vietnam Pro** — mọi chữ giao diện/nội dung. Grotesque được thiết kế
  riêng cho tiếng Việt, sạch và hiện đại, đủ weight 400/500/600/700. Thay
  Plus Jakarta Sans.
- **Bỏ JetBrains Mono hoàn toàn.** Số tiền, mã đơn KY, số liệu dùng
  Be Vietnam Pro + `tabular-nums` (số thẳng hàng, vẫn đọc rõ mà không cần
  font mono thứ ba).

Font load qua Google Fonts với `display=swap`, chỉ lấy weight cần thiết
(Fraunces 400/500/600 + italic 400; Be Vietnam Pro 400/500/600/700) kèm
preconnect, để không làm chậm lần tải đầu.

## 2. Hệ thiết kế mới — nguyên tắc chung

1 điểm nhấn mỗi màn hình, khoảng trắng lớn, viền mảnh, bỏ bóng đổ nặng.
Màu amber-600 chỉ dùng cho nút chính và 1 chi tiết nhấn mỗi section.

- **Màu & nền:** nền sáng giấy ấm `#FAF8F5`, dark `#0E0E10` (giữ dark mặc
  định); chữ chính neutral-900/100, chữ phụ neutral-500 (không dùng
  neutral-400 cho chữ đọc được); bỏ nền gradient loè loẹt và viền amber
  trang trí.
- **Thang chữ:** tiêu đề lớn 48–64px desktop (40px mobile), tiêu đề section
  30–36px, nội dung 16–17px/leading 1.7, nhãn eyebrow 12px uppercase
  tracking-widest chỉ 1 dòng/section. Xoá các cỡ 10–11px trong nội dung
  khách hàng.
- **Khoảng cách:** section padding 96px desktop / 64px mobile, container
  `max-w-6xl` (thay vì 7xl) cho nhịp đọc gọn. Card bo góc 16px thống nhất,
  bỏ shadow, chỉ giữ border 1px neutral-200/800.
- **Nút:** 1 kiểu nút chính (amber-600, chữ trắng) + 1 kiểu nút phụ (viền
  outline) dùng thống nhất khắp web, kể cả trong form đặt lịch và proofing.

## 3. Thay đổi theo từng khu vực

1. **Hero:** ảnh full-bleed 1 ảnh lớn làm chủ đạo, tiêu đề Fraunces + 1 dòng
   phụ ngắn, tối đa 2 nút (Đặt lịch = chính, Nhắn Zalo = phụ outline). Bỏ
   4 ô số liệu dưới Hero (3 thông tin tin cậy chuyển gọn vào mục Về tôi
   dạng 1 dòng: "Sony A7 III · Trả file gốc trong 24h · Nhóm nhỏ 5–15 bạn ·
   Chỉ chụp ở Hà Nội"), bỏ 3 ô tin cậy, bỏ badge máy ảnh / "bấm để phóng
   to" / thanh trạng thái. Dải chữ cuối Hero giữ lại nhưng chỉ 1 dòng mảnh,
   nhỏ và mờ hơn.
2. **Navbar:** cao gọn 64px, nền mờ blur khi cuộn; chỉ logo + 4 mục
   (Tác Phẩm, Bộ Ảnh Triển Lãm, Về Tác Giả & Thiết Bị, Liên Hệ) + nút
   Đặt Lịch (amber). Bỏ nút tim yêu thích, bỏ badge "Admin" và badge số
   đơn chưa đọc (chức năng lọc yêu thích vẫn còn trong Gallery, Dashboard
   vẫn đếm đơn trong đó). Điều khiển admin (Dashboard/Thêm ảnh/Đăng xuất)
   và chuyển dark/light giữ nguyên.
3. **Gallery:** bỏ ô tìm kiếm ở thanh công cụ (khách vẫn lọc bằng chip),
   chỉ còn tối đa **4 chip lọc** (Tất cả / Áo dài / Kỉ yếu nhóm / Cổ phục —
   chip Áo dài gộp 3 nhóm áo dài cũ, lọc vẫn đúng). Mỗi ảnh chỉ hiện tiêu
   đề khi hover, không còn chữ đè lên ảnh (bỏ tag concept, bỏ dòng
   địa điểm/năm/EXIF/mô tả luôn hiện). Lưới ảnh giữ thumbnail + lazy load
   như v6.
4. **Bảng giá (Series):** 4 thẻ, chỉ 1 gói nổi bật duy nhất (thẻ đầu tiên:
   viền amber + nhãn "Được chọn nhiều nhất"), các gói còn lại phẳng. Giá
   hiển thị to rõ bằng Fraunces, mô tả ngắn 1–2 dòng, mỗi thẻ chỉ 1 nút
   (Đặt lịch — gói nổi bật dùng nút amber, gói khác dùng nút outline).
   Bỏ link "Xem các tác phẩm trong bộ" (bấm vào ảnh bìa là xem được bộ),
   bỏ nhãn "Concept Hot", bỏ dòng tiêu đề tiếng Anh và ghi chú curator.
5. **Về tôi:** 2 cột gọn — trái là tiểu sử + dòng tin cậy 1 dòng + 2 cam
   kết ngắn, phải là 1 thẻ thiết bị gọn ("Sony A7 Mark III · FE 50mm f/1.8
   · FE 85mm f/1.8") thay cho danh sách thẻ gear dài. Tab gợi ý địa điểm
   giữ nguyên nội dung, chỉ gọn lại (bỏ badge "Top 0X").
6. **Liên hệ:** chỉ còn 3 kênh (Nhắn Zalo / Gọi điện / Email) dạng 3 thẻ
   gọn + form tra cứu đơn + 1 dòng ghi chú (khu vực, giờ làm việc). Bỏ
   3 thẻ thông tin dài (khu vực / đạo cụ / liên hệ trực tiếp).
7. **Footer:** 1 hàng duy nhất (thương hiệu + tagline + Lên đầu trang +
   Cổng quản trị). Bỏ dòng "PHOTOGRAPHY ARCHIVE" và các cột link thừa.
8. **BookingModal / ProofingModal:** giữ nguyên flow 3 bước và proofing
   theo đơn, chỉ chuẩn hoá: tiêu đề modal Fraunces 24px, nút chính amber,
   nút phụ outline, bỏ badge/icon trang trí thừa.
9. **Dashboard:** không thiết kế lại (giữ nguyên bố cục v6), chỉ hưởng
   font mới và màu amber thống nhất.

## 4. Lưu ý quan trọng

Font và khoảng trắng chỉ là khung. Yếu tố quyết định cảm giác cao cấp vẫn
là **ảnh thật của Yen**: khi Yen thay ảnh SVG mẫu bằng ảnh chụp thật (đặc
biệt là ảnh Hero full-bleed và 4 ảnh bìa concept), giao diện mới sẽ "lên"
rất nhiều. Ảnh mẫu hiện tại vẫn là ảnh vẽ bằng code/SVG như đã biết — Yen
up ảnh thật qua Dashboard (tab Ảnh) hoặc up ảnh proofing theo đơn là thấy
khác ngay.
