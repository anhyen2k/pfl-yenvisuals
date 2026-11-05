# Yên Photo — Pages v7.7: Tải ảnh "tức thì" + tải nhanh nhất

Bản này chỉ sửa trải nghiệm + tốc độ tải ảnh. Giữ nguyên mọi tính năng v7.6
(banner lỗi lý do thật, watchdog kẹt 0%, nút Kiểm tra kết nối Cloud, tiền đã
thu, tra cứu public_orders, QR Zalo, SEO, base '/pfl-yenvisuals/', không
vercel.json). Up giống v7.5/v7.6: Pages-only, lên gốc repo `pfl-yenvisuals`
branch `main`, đợi workflow chạy xong.

## 1. Tải lên "tức thì" là gì (nói thẳng giới hạn)

- Việc đưa file lên máy chủ vẫn cần thời gian theo mạng — không có cách nào
  làm 0 giây thật. 30 ảnh proofing sau nén còn ~10MB: wifi upload 20 Mbps
  thì vài giây, 5 Mbps thì ~20 giây, 1 Mbps thì ~80 giây.
- Cái tức thì được là **trải nghiệm**: Yen bấm Lưu xong là ảnh hiện ngay
  trong Gallery, modal đóng luôn, không ngồi nhìn % nữa. Việc tải lên Cloud
  chạy ngầm phía sau, có chip nhỏ góc dưới phải báo tiến độ. Yen cứ làm
  việc tiếp.
- Nếu tắt tab trình duyệt giữa chừng thì job đang tải sẽ mất (ảnh chỉ có
  trong bộ nhớ) — ảnh chưa đồng bộ xong sẽ không tự hiện lại sau khi tải
  lại trang. Chuyển tab trong web thì không mất.

## 2. Đã làm gì

### Tải nền + hiện ảnh ngay (thêm/sửa ảnh portfolio)
- Bấm Lưu ở "Thêm Tác Phẩm" / "Chỉnh Sửa Thông Tin Bức Ảnh" là đóng modal
  ngay, ảnh hiện ngay trong Gallery bằng ảnh xem trước trên máy, kèm huy
  hiệu "Đang đồng bộ…" (chỉ admin thấy). Xong thì huy hiệu biến mất, ảnh
  đổi sang URL Cloud — Gallery không nhấp nháy tải lại.
- Lỗi hết 3 lần thử lại thì ảnh ở lại Gallery với huy hiệu đỏ "Chưa đồng bộ
  — bấm để thử lại"; bấm vào huy hiệu (hoặc nút "Thử lại" trong chip tiến
  độ) thì tải lại. Banner lỗi đã dịch lý do thật chỉ hiện 1 lần.
- Ảnh chưa đồng bộ xong KHÔNG ghi vào localStorage (URL xem trước trên máy
  sẽ chết sau khi tải lại trang) và không trộn vào danh sách ảnh Cloud (vì
  subscription Firestore thay toàn bộ danh sách bằng bản Cloud nên ảnh lạc
  quan mà trộn vào sẽ bị xóa).
- Sửa ảnh đổi file mới cũng tức thì như thêm ảnh, kèm thumbnail mới (trước
  đây sửa ảnh chỉ đổi ảnh lớn, thumbnail cũ vẫn là ảnh cũ).

### Hàng đợi tải nền dùng chung (`src/services/uploadQueue.ts`)
- Tối đa 4 ảnh tải cùng lúc; mỗi ảnh lỗi thì tự thử lại tối đa 3 lần (lần
  2 sau 2 giây, lần 3 sau 5 giây), chỉ báo lỗi với Yen khi hết 3 lần.
- Chip góc dưới phải: "Đang đồng bộ X/Y ảnh…" + % tổng; bấm vào xem từng
  ảnh (đang chờ/đang tải %/đã xong/lỗi + nút thử lại). Xong hết thì hiện
  "Đã đồng bộ xong" vài giây rồi tự ẩn.
- Hàng đợi sống ở cấp App nên đóng modal hay chuyển tab trong web cũng
  không mất job.

### Up nhiều ảnh proofing nhanh hơn (Dashboard → tab Leads → Ảnh proofing)
- Trước đây tải từng ảnh một (30 ảnh × 3–5 giây = rất lâu). Giờ:
  - Chọn file xong thì **nén ngay lúc chọn**, song song tối đa 4 file,
    thumbnail xem trước hiện ngay trong lưới; bấm "Tải lên X ảnh" thì chỉ
    còn bước tải.
  - Tải song song tối đa 4 ảnh qua hàng đợi chung, hiện "Đã xong X/Y ảnh"
    + % từng ảnh trong lưới.
  - Thumbnail làm từ ảnh **đã nén** (1400px) thay vì giải nén lại file gốc
    6000px — bớt 1 lần giải nén nặng nhất mỗi ảnh.
  - Ảnh proofing thu nhỏ còn **1400px JPEG 0.78** (vẫn đủ nét để khách
    chọn ảnh), nhẹ hơn ~30% so với 1600px 0.82. **Ảnh portfolio giữ nguyên
    1600px 0.82, không đổi.**
  - Ảnh lớn + thumbnail của cùng 1 ảnh tải song song thay vì nối tiếp.

## 3. Kiểm chứng

- `npx tsc --noEmit`: PASS, 0 lỗi.
- `npx tsx --test src/utils/portfolioLogic.test.ts`: **57/57 PASS**
  (52 cũ + 5 mới: chọn job theo giới hạn 4, tiến độ tổng, thử lại tối đa
  3 lần + thời gian chờ 2s/5s, chạy song song giữ đúng thứ tự, gộp ảnh
  lạc quan).
- `npm run build`: PASS; `dist/index.html` trỏ `/pfl-yenvisuals/assets/`;
  không có `vercel.json`; grep `0912` trong src/index/public = 0.

## 4. Yen cần làm sau khi up

- Không cần deploy rules mới cho bản này (rules v7.6 giữ nguyên).
- Thử 1 vòng: thêm 1 ảnh portfolio → ảnh hiện ngay, modal đóng luôn, chip
  góc phải báo đồng bộ xong; up 10–30 ảnh proofing 1 đơn → xem "Đã xong
  X/Y ảnh" chạy nhanh hơn trước bao nhiêu.
- Nếu ảnh báo "Chưa đồng bộ": bấm vào huy hiệu trên ảnh để thử lại; nếu
  vẫn lỗi thì vào Dashboard → Cài đặt → "Kiểm tra kết nối Cloud" xem
  Firestore/Storage báo gì (bản v7.6).
