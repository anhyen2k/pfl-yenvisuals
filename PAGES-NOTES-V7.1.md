# YÊN PHOTO — NOTES V7.1 CHO GITHUB PAGES (05/11/2026)

Bản vá v7.1 chỉ sửa 1 lỗi nút bấm ở Hero, không đổi tính năng hay thiết kế
nào khác của v7. Domain Pages: **https://anhyen2k.github.io/pfl-yenvisuals/**

Kiểm chứng ngày 05/11/2026: `npx tsc --noEmit` PASS (0 lỗi),
`npx tsx --test src/utils/portfolioLogic.test.ts` **41/41 PASS** (38 cũ + 3
mới cho lỗi này), `npm run build` PASS, `dist/index.html` trỏ
`/pfl-yenvisuals/assets/index-*.js` và `*.css`. Grep `0912` trong src/ +
index.html + public/ = **0**; không có `vercel.json`.

## ⚠️ BẢN NÀY CHỈ DÙNG CHO GITHUB PAGES — KHÔNG DÙNG CHO VERCEL

Base `/pfl-yenvisuals/`. Up bản Vercel (`base: '/'`) lên Pages sẽ trắng trang.

## Lỗi: bấm nút cam "Xem Album Tác Phẩm" lại mở form đặt lịch

Nguyên nhân: nhãn và hành động của 2 nút Hero bị đảo nhau từ khi v6 chuyển
chữ Hero vào `DEFAULT_SITE_CONTENT` (`src/config/content.ts`):

- Nút chính màu cam trong `Hero.tsx` nối `onClick={onOpenBooking}` (mở form
  đặt lịch), nhưng nhãn mặc định lại ghi "Xem Album Tác Phẩm".
- Nút phụ nối `onClick={onExploreGallery}` (cuộn xuống xem album), nhưng
  nhãn mặc định lại ghi "Bảng Giá & Đặt Lịch".

Kết quả: khách bấm nút cam "Xem Album Tác Phẩm" thì mở form đặt lịch, bấm
nút "Bảng Giá & Đặt Lịch" thì lại cuộn xuống xem album. Lỗi ở chữ, không
phải ở hành động của nút — hành động vốn đã đúng vị trí (nút chính = đặt
lịch, nút phụ = xem album).

## Đã sửa gì trong v7.1

1. **Giá trị mặc định** (`src/config/content.ts`): `heroPrimaryCta` thành
   **"Đặt Lịch Chụp"** (nút chính, mở form đặt lịch), `heroSecondaryCta`
   thành **"Xem Album Tác Phẩm"** (nút phụ, cuộn xuống xem album). Sửa luôn
   comment sai ngữ nghĩa ở interface `SiteContent`.
2. **Migration cho dữ liệu đã lưu** (`mergeSiteContent`, cùng file): nếu
   phát hiện đúng cặp giá trị cũ bị đảo — primary là "Xem Album Tác Phẩm"
   và secondary là "Bảng Giá & Đặt Lịch" — thì tự đổi lại đúng trước khi
   trả về. Cần bước này vì Yen có thể đã lưu nội dung v6 lên Firestore
   `settings/content` / cache localStorage; chỉ sửa default trong code thì
   web vẫn đọc giá trị cũ đã lưu và lỗi vẫn còn.
3. **Gợi ý trong Dashboard** (tab Cài đặt → mục Nội dung giao diện): ngay
   dưới 2 ô "Nút chính Hero" và "Nút phụ Hero" có thêm dòng gợi ý nhỏ —
   nút chính = "(mở form đặt lịch)", nút phụ = "(cuộn xuống xem album)" —
   để Yen sửa chữ sau này không đảo lại nữa. Chỉ thêm chữ gợi ý, không đổi
   layout hay quyền (vẫn chỉ admin sửa được).
4. **Test mới** (3 test): default có primary chứa "Đặt Lịch" và secondary
   chứa "Album"; `mergeSiteContent` với cặp cũ bị đảo thì trả về cặp đã sửa
   đúng; `mergeSiteContent` với cặp đúng thì giữ nguyên.

## Cách up

Giống v7: giải nén zip, up toàn bộ file lên gốc repo `pfl-yenvisuals`
branch `main`, đợi workflow GitHub Actions chạy xong rồi mở lại link Pages.
**Rules Firestore/Storage đã deploy từ v6 thì không cần deploy lại.**
