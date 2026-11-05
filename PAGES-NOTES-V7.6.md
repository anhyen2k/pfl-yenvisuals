# YÊN PHOTO — NOTES V7.6 CHO GITHUB PAGES (05/11/2026)

Bản v7.6 chỉ sửa 2 lỗi Yen gặp, không đổi tính năng hay thiết kế nào của v7.5
(tiền đã thu, tra cứu public_orders, nút Hero, QR Zalo, SEO, font).
Base Pages '/pfl-yenvisuals/', không có vercel.json.

Kiểm chứng ngày 05/11/2026: `npx tsc --noEmit` PASS (0 lỗi),
`npx tsx --test src/utils/portfolioLogic.test.ts` **52/52 PASS** (47 cũ + 5 mới:
dịch lỗi Cloud, update/create, strip undefined, isUploadStalled), `npm run build` PASS,
`dist/index.html` trỏ `/pfl-yenvisuals/assets/index-*.js`.
Grep `0912` trong src/ + index.html + public/ = **0**.

## ⚠️ BẢN NÀY CHỈ DÙNG CHO GITHUB PAGES — KHÔNG DÙNG CHO VERCEL

## 1. Lỗi 1 — Lưu thay đổi đơn: banner đỏ "Lưu thay đổi đơn lên đám mây thất bại"

**Vì sao:** khi Yen bấm Lưu trạng thái đơn, trạng thái chỉ đổi trên máy Yen
(localStorage), không lên được Cloud nên không đồng bộ sang máy khác / tra
cứu khách / public_orders. Trước đây banner chỉ hiện câu chung chung, lỗi
thật chỉ nằm trong Console (F12) nên Yen không biết vì sao.

**Nguyên nhân khả thi nhất, theo thứ tự:**
1. **Chưa deploy firestore.rules, HOẶC deploy nhầm database.** Web dùng
   database Firestore có tên riêng
   `ai-studio-ynvisualskyuodip-af887cea-4565-4122-a978-d91796b3a4eb`
   (xem firebase-applet-config.json), KHÔNG phải database `(default)`.
   Rules deploy lên `(default)` sẽ không áp dụng cho web này.
2. **Đơn Yen sửa chỉ có trên máy** (chưa từng lên Cloud): ghi bằng setDoc
   merge bị rule tính là CREATE và phải qua validate isValidBookingLead
   (vd email trống / groupSize sai kiểu là bị chặn).
3. **Phiên đăng nhập Google admin hết hạn.**

**Đã sửa trong code:**
- **Banner hiện lý do thật:** mọi lỗi lưu (đơn, ảnh, giá, nội dung, đồng bộ
  tra cứu) giờ hiện kèm mã lỗi + hướng dẫn cụ thể, vd:
  `permission-denied` → "rules chưa được deploy, hoặc deploy nhầm
  database — chọn database ai-studio-ynvisualskyuodip-... ở ô chọn phía
  trên tab Rules rồi dán lại firestore.rules"; `unavailable` → "Mất mạng
  hoặc Cloud chưa phản hồi"; `unauthenticated` → "đăng nhập lại bằng
  anhyenk26@gmail.com". Nút "Đã hiểu" vẫn tắt được banner.
- **Lưu đúng cách theo doc đã có/chưa có:** `saveBookingLeadToCloud` kiểm
  tra doc đã tồn tại chưa — có rồi thì `updateDoc` (rule update chỉ cần
  admin, không qua validate create), chưa có thì `setDoc` như cũ; đồng
  thời loại bỏ field `undefined` trước khi ghi (Firestore ném lỗi cả ở
  setDoc merge lẫn updateDoc nếu gặp undefined).
- **Nút tự chẩn đoán:** Dashboard → tab Cài đặt → mục 5 "KIỂM TRA KẾT NỐI
  CLOUD": bấm 1 nút là kiểm tra cả 2 mục, hiện kết quả riêng từng dòng:
  `Firestore: OK/Lỗi <mã>` (đọc thử settings/pricing từ server) và
  `Storage: OK/Lỗi <mã>` (tải thử 1 file nhỏ 1KB lên `diagnostics/` rồi
  xoá ngay — xem mục 2). Không ghi thêm dữ liệu thật nào lên Cloud khi
  kiểm tra.

**Yen kiểm tra rules ĐÚNG DATABASE như sau (quan trọng nhất):**
1. Mở Firebase Console → Firestore Database.
2. Ở ô chọn database phía trên tab Rules, chọn
   `ai-studio-ynvisualskyuodip-af887cea-4565-4122-a978-d91796b3a4eb`
   (KHÔNG để `(default)`).
3. Dán toàn bộ nội dung file `firestore.rules` trong zip vào → Publish.
4. Lưu ý: lệnh `firebase deploy --only firestore:rules` chỉ deploy cho
   database `(default)` nên KHÔNG đủ cho web này — phải dán tay theo
   cách trên.

## 2. Lỗi 2 — Tải 1 ảnh portfolio kẹt mãi ở "ĐANG TẢI LÊN 0%..."

**Vì sao:** Yen dùng wifi rất mạnh mà vẫn kẹt ở 0% — tức KHÔNG phải do
băng thông yếu, mà do phiên tải lên Storage (uploadBytesResumable) không
bắt đầu được: không gửi được byte nào, cũng không báo lỗi, nên promise
upload không bao giờ xong và nút kẹt mãi ở 0%.

**Đã sửa trong code:**
- **Watchdog trong `uploadBlobToStorage`:** nếu sau 20 giây chưa có
  progress event nào (kẹt ở 0%), hoặc sau 120 giây không tiến triển giữa
  chừng, thì huỷ phiên và báo lỗi rõ, không kẹt vô hạn nữa.
- **Tự thử lại 1 lần khi kẹt:** lần 2 dùng `uploadBytes` (PUT 1 lần duy
  nhất, khác đường với resumable) — wifi mạnh mà resumable vẫn kẹt thì
  khả năng cao đường resumable bị chặn, còn PUT 1 lần có thể qua được.
  Vẫn lỗi thì báo lỗi thật (kèm hướng dẫn rules) chứ không kẹt.
- **Nút hiện đúng trạng thái:** trước khi có progress event đầu tiên, nút
  hiện "ĐANG KẾT NỐI STORAGE…" thay vì "ĐANG TẢI LÊN 0%…"; có % rồi mới
  hiện "ĐANG TẢI LÊN X%…". Áp dụng cho cả Thêm ảnh (AddPhotoModal) và
  Sửa ảnh (EditPhotoModal).
- **Chẩn đoán Storage thật:** nút "Kiểm tra kết nối Cloud" giờ test cả
  Storage — tải thử 1KB text lên `diagnostics/test-<timestamp>.txt` rồi
  xoá ngay. Kết quả riêng từng dòng: `Storage: OK` hoặc
  `Storage: Lỗi (storage/unauthorized)` → "Storage rules chưa deploy —
  vào Firebase Console → Storage → Rules, dán storage.rules trong zip
  rồi Publish"; kẹt quá 15 giây không phản hồi → "Không kết nối được tới
  Storage (kẹt) — thử đổi wifi/4G hoặc tắt VPN".

**Yen deploy storage.rules như sau:**
1. Mở Firebase Console → Storage → tab Rules.
2. Dán toàn bộ nội dung file `storage.rules` trong zip vào → Publish.
   (Bản v7.6 thêm rule `diagnostics/{fileName}` cho file test chẩn đoán
   — chỉ admin ghi/xoa, không ai đọc; không có rule này thì test Storage
   báo lỗi quyền.)
3. Lưu ý: rules Storage chưa deploy cũng là 1 nguyên nhân khiến upload
   không chạy được — nút tải ảnh sẽ báo lỗi quyền thay vì kẹt sau bản này.

## 3. Cách up bản v7.6

Up giống v7.5, Pages-only, lên gốc repo `pfl-yenvisuals` branch `main`, đợi
workflow chạy xong. Sau đó: deploy lại `firestore.rules` (đúng database
như mục 1) và `storage.rules` (mục 2), rồi vào Dashboard → Cài đặt → bấm
"Kiểm tra kết nối Cloud" để xem cả 2 dòng đều OK.
