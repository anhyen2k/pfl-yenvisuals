# YÊN PHOTO — NOTES V5.1: VÁ TỐC ĐỘ LƯU ẢNH (05/11/2026)

Bản v5.1 chỉ sửa tốc độ lưu ảnh. **Không đổi nội dung nào khác của v5**:
chỉnh giá 4 gói trong Dashboard, SĐT 0961230500, sửa lỗi đăng nhập admin
(ADMIN_EMAIL cố định), giao diện v5 — tất cả giữ nguyên.

Kiểm chứng ngày 05/11/2026: `npx tsc --noEmit` PASS (0 lỗi),
`npx tsx --test src/utils/portfolioLogic.test.ts` **30/30 PASS** (như v5),
`npm run build` PASS, `dist/index.html` trỏ `/pfl-yenvisuals/assets/`.
Grep `0912` trong `src/` + `index.html` + `public/` = **0**.
Base `/pfl-yenvisuals/`, không có `vercel.json`.

## ⚠️ BẢN NÀY CHỈ DÙNG CHO GITHUB PAGES — KHÔNG DÙNG CHO VERCEL

Up lên gốc repo `pfl-yenvisuals` branch `main` như bản v5, đợi workflow
GitHub Actions chạy xong rồi mở lại
https://anhyen2k.github.io/pfl-yenvisuals/.

## 1. Vì sao lưu ảnh cũ chậm?

Khi Yen bấm nút Lưu, web mới bắt đầu làm tất cả trong 1 lần:
giải mã file gốc (tới 8MB / 6000×4000) → vẽ lại bằng canvas xuống 1600px
→ `uploadBytes` 1 lần (không tiến độ, lỗi giữa chừng phải tải lại từ đầu)
→ lấy downloadURL. Trong lúc đó nút chỉ hiện "ĐANG LƯU..." nên Yen
không biết đang ở bước nào, và toàn bộ thời gian nén + tải đều nằm
trong nút Lưu. Preview ảnh còn dùng `FileReader.readAsDataURL` (base64
nặng hơn file gốc ~33%) nên chọn file xong cũng chậm.

## 2. Đã làm gì trong v5.1? (4 thay đổi)

1. **Nén ngay khi chọn file** — `EditPhotoModal` và `AddPhotoModal` bắt
   đầu nén ngay khi Yen chọn file (trong lúc Yen còn đang sửa tiêu đề,
   mô tả), hiện "Đang nén ảnh...". Khi bấm Lưu chỉ còn upload blob đã
   nén sẵn + lấy downloadURL. Hàm nén tách riêng thành
   `compressImageFile(file)` trong `services/firebase.ts` để 2 modal
   dùng chung.
2. **Nén nhanh hơn** — ưu tiên `createImageBitmap(file, { resizeWidth,
   resizeHeight })` (resize native của trình duyệt, nhanh hơn canvas
   `drawImage`); ảnh rất lớn thì hạ bậc (halve) trước rồi mới resize về
   1600px; trình duyệt không hỗ trợ thì fallback canvas như cũ. Giữ
   max 1600px, JPEG quality 0.82 (trước là 0.85 — dung lượng nhỏ hơn
   một chút, mắt thường không phân biệt được). File gốc đã ≤1600px và
   ≤600KB thì bỏ qua nén, upload thẳng file gốc.
3. **Preview nhẹ hơn** — dùng `URL.createObjectURL(file)` thay cho
   `FileReader.readAsDataURL`; thu hồi bằng `revokeObjectURL` khi huỷ /
   đóng modal để không rò bộ nhớ.
4. **Upload có tiến độ** — dùng `uploadBytesResumable` thay cho
   `uploadBytes`, báo `%` qua `on('state_changed')`. Nút Lưu hiện theo
   giai đoạn: "Đang nén..." (nếu còn nén) → "Đang tải lên 45%..." →
   "Đang lưu thông tin..." rồi đóng modal. Upload lỗi giữa chừng thì
   resumable tự tiếp tục, không tải lại từ đầu.

Giữ nguyên: giới hạn file 8MB, thông báo lỗi khi chưa deploy Storage
rules, tên file Storage `portfolio_photos/<mã ảnh>.jpg`, flow
Firestore/localStorage.

## 3. Mục tiêu 5 giây — áp dụng khi nào?

**Mục tiêu: lưu ảnh thường xong trong 5 giây với file ≤8MB và mạng
wifi bình thường.** Đây là mục tiêu trong điều kiện thường, **không cam
kết cứng** trên mạng yếu / 3G / mạng chập chờn.

- Ảnh ≤600KB: gần như bấm Lưu là xong ngay (không nén, upload nhỏ).
- Ảnh 2–8MB trên wifi tốt: nén xong từ lúc chọn file nên bấm Lưu chỉ
  còn upload blob đã nén (~200–400KB) + lấy link — thường 2–5 giây.
- **Nếu mạng upload của Yen chậm thì bước tải lên vẫn là phần lâu
  nhất** — không có cách nào nén hay tối ưu code bù được tốc độ mạng.
  Lúc đó nút Lưu sẽ hiện rõ % tải lên để Yen biết nó đang chạy chứ
  không bị treo.

## 4. Cách up (giống v5)

Giải nén zip, up toàn bộ file lên gốc repo `pfl-yenvisuals` branch
`main` (ghi đè bản v5), đợi workflow "Deploy to GitHub Pages" chạy
xong rồi mở lại link Pages. File `firestore.rules` / `storage.rules`
đã deploy từ bản v5 thì không cần deploy lại.
