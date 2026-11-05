# YÊN PHOTO — NOTES V7.2 CHO GITHUB PAGES (05/11/2026)

Bản vá nhỏ trên nền v7.1, chỉ sửa nút Hero theo quyết định cuối của Yen.
Không đổi tính năng hay thiết kế nào khác của v7 (font Fraunces + Be Vietnam
Pro, proofing theo đơn, chỉnh giá/nội dung Dashboard, SĐT 0961230500).

Kiểm chứng ngày 05/11/2026: `npx tsc --noEmit` PASS (0 lỗi),
`npx tsx --test src/utils/portfolioLogic.test.ts` **42/42 PASS**
(41 cũ + 1 test mới ròng: 3 test v7.1 viết lại thành 4 test v7.2),
`npm run build` PASS, `dist/index.html` trỏ
`/pfl-yenvisuals/assets/index-*.js`. Không có `vercel.json`.
Grep `0912` trong src/ + index.html + public/ = **0**.

## ⚠️ BẢN NÀY CHỈ DÙNG CHO GITHUB PAGES — KHÔNG DÙNG CHO VERCEL

Base `/pfl-yenvisuals/`, chỉ up lên GitHub Pages (repo `pfl-yenvisuals`,
branch `main`). Up bản Vercel (`base: '/'`) lên Pages sẽ trắng trang.

## 1. Yen quyết: nút chính Hero là "Xem Album Tác Phẩm"

Bản v7.1 đã sửa sai hướng khi đổi nút chính thành "Đặt Lịch Chụp".
Yen nói rõ: trên web đã có quá nhiều nút đặt lịch rồi (Navbar, thẻ gói,
nút phụ Hero), nên nút cam chính ở Hero phải là nút xem album.

**Sau v7.2, 2 nút Hero làm đúng việc của nhãn:**
- Nút chính màu cam **"Xem Album Tác Phẩm"** → cuộn xuống xem album
  (Gallery). Nhãn lấy từ `heroPrimaryCta`.
- Nút phụ nhỏ dưới ảnh **"Đặt Lịch Chụp"** → mở form đặt lịch.
  Nhãn lấy từ `heroSecondaryCta`.
- Nút **Nhắn Zalo** giữ nguyên.

## 2. Đã sửa gì trong code

- `src/components/Hero.tsx`: đổi hành động của 2 nút (không đổi nhãn):
  nút chính `onClick` thành `onExploreGallery`, nút phụ thành
  `onOpenBooking`. Sửa comment đầu file cho đúng.
- `src/config/content.ts`:
  - `DEFAULT_SITE_CONTENT`: `heroPrimaryCta: 'Xem Album Tác Phẩm'`,
    `heroSecondaryCta: 'Đặt Lịch Chụp'`; sửa comment ở interface
    `SiteContent` cho đúng ngữ nghĩa từng nút.
  - Migration trong `mergeSiteContent` cho dữ liệu đã lưu trên Firestore
    `settings/content` hoặc localStorage:
    - Cặp v7.1 (primary "Đặt Lịch Chụp" + secondary "Xem Album Tác
      Phẩm"): hoán đổi 2 giá trị. Logic tổng quát: nếu primary chứa
      "Đặt Lịch" và secondary chứa "Album" thì hoán đổi.
    - Cặp v6 (primary "Xem Album Tác Phẩm" + secondary "Bảng Giá &
      Đặt Lịch"): secondary đổi thành "Đặt Lịch Chụp", primary giữ
      nguyên. Các trường khác không động vào.
- `src/components/DashboardView.tsx` (Cài đặt → Nội dung giao diện):
  sửa gợi ý dưới 2 ô nút Hero cho đúng: nút chính "(cuộn xuống xem
  album)", nút phụ "(mở form đặt lịch)" — để Yen sửa chữ sau này
  không đảo lại nữa. Vẫn chỉ admin sửa được.
- Test mới: default primary chứa "Album" và secondary chứa "Đặt Lịch";
  merge cặp v7.1 → trả về cặp đúng mới; merge cặp v6 → secondary thành
  "Đặt Lịch Chụp"; merge cặp đúng → giữ nguyên.

## 3. Cách up

Giống v7.1: giải nén zip, up toàn bộ file lên gốc repo `pfl-yenvisuals`
branch `main`, đợi workflow GitHub Actions chạy xong rồi mở lại link
Pages `https://anhyen2k.github.io/pfl-yenvisuals/` và bấm thử nút cam
Hero — phải cuộn xuống album, không mở form đặt lịch.

Rules Firestore/Storage đã deploy từ v6 thì **không cần deploy lại**.
