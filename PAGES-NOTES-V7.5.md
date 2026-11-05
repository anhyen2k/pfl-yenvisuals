# YÊN PHOTO — NOTES V7.5 NHẬP TIỀN ĐÃ THU + TRA CỨU ĐƠN MỌI MÁY (05/11/2026)

Bản v7.5 chỉ thêm 2 việc dưới đây trên nền v7.4, không đổi tính năng hay thiết
kế nào khác (giữ nguyên nút Hero chính Xem Album, mã QR Zalo, SEO, proofing
theo đơn, chỉnh giá, chỉnh nội dung, SĐT 0961230500, admin chỉ
anhyenk26@gmail.com, base '/pfl-yenvisuals/', không có vercel.json).

Kiểm chứng ngày 05/11/2026: `npx tsc --noEmit` PASS (0 lỗi),
`npx tsx --test src/utils/portfolioLogic.test.ts` **47/47 PASS** (43 cũ + 4
mới v7.5), `npm run build` PASS, `dist/index.html` trỏ
`/pfl-yenvisuals/assets/`. Grep `0912` trong src/ + index.html + public/ = 0.

## Việc 1 — Dashboard: nhập tiền Đã thu cho từng đơn

- Vào Dashboard → tab **Khách Đăng Ký**, mỗi đơn (cả bảng desktop lẫn thẻ
  mobile) có mục **"Tiền đã thu"**: hiện Đã thu hiện tại / Tiền cọc / Còn lại.
- Ô nhập là **TỔNG tiền khách đã trả** (không phải trả thêm từng lần): gõ số
  thô, web tự định dạng 650.000 khi gõ. Bấm **"Lưu tiền đã thu"** là lưu.
- 2 nút nhanh: **"Đã nhận đủ cọc"** (điền = tiền cọc) và **"Đã thu đủ"**
  (điền = tổng tiền đơn). Chỉ điền vào ô, vẫn phải bấm Lưu mới lưu.
- Validate: tiền đã thu phải là số nguyên ≥ 0 và ≤ tổng tiền đơn; vượt thì
  báo đỏ "Đã thu không vượt quá tổng tiền đơn" và không lưu.
- Sau khi lưu: toast "Đã lưu tiền đã thu", số Còn lại và các thống kê
  Dashboard (Đã thu / Còn phải thu) cập nhật ngay; khách tra cứu đơn sẽ
  thấy số Đã thu / Còn lại mới.
- Chỉ admin sửa được (Dashboard vốn chỉ admin vào được).

## Việc 2 — Tra cứu đơn chạy mọi máy + nút Drive nổi bật

### Khách tra cứu ra sao
- Vào web → mục **Liên hệ → Tra cứu đơn đã đặt**, nhập **mã đơn (vd KY-...) +
  SĐT đã dùng khi đặt lịch** rồi bấm Tra cứu. Tra được trên **mọi máy**,
  không còn chỉ tra được trên máy đã đặt lịch.
- Kết quả hiện: tên khách, gói, ngày chụp, trạng thái, Tiền cọc / Đã thu /
  Còn lại (số mới nhất sau khi Yen nhập tiền ở Dashboard).
- Link ảnh: khi Yen đã dán link Drive cho đơn thì hiện nút to màu amber
  **"Xem ảnh của bạn trên Google Drive"** (mở tab mới); chưa có thì hiện
  "Chưa có link ảnh — Anh Yên sẽ gửi sau khi trả ảnh xong".
- Nhập sai mã hoặc sai SĐT đều báo chung 1 câu "Không tìm thấy đơn, kiểm tra
  lại mã và SĐT" — không tiết lộ đơn có tồn tại hay không.

### Yen cần làm
1. **Dán link Drive ở đâu:** Dashboard → tab Khách Đăng Ký → cột Link Drive
   của từng đơn, dán link rồi bấm Lưu (như cũ, không đổi).
2. **Đồng bộ tra cứu cho các đơn cũ:** Dashboard → tab **Cài đặt** → mục
   **4. ĐỒNG BỘ TRA CỨU ĐƠN CHO KHÁCH** → bấm **"Đồng bộ lại tra cứu cho
   các đơn cũ"**. Chỉ cần bấm **1 lần** sau khi up v7.5 để các đơn tạo trước
   v7.5 cũng tra được mọi máy; nút báo số đơn đã đồng bộ. Đơn mới tạo hoặc
   vừa sửa (tiền đã thu, link Drive, trạng thái) sẽ **tự đồng bộ**, không
   cần bấm lại.
3. **⚠️ BẮT BUỘC deploy lại firestore.rules** (bản v7.5, file `firestore.rules`
   trong zip) thì tra cứu mọi máy mới chạy — xem mục "Deploy rules" dưới đây.
   Nếu chưa deploy rules mới, khách tra cứu đơn ở máy khác sẽ vẫn báo không
   tìm thấy (dù Yen đã bấm đồng bộ).

### Bảo mật (mức phù hợp studio 1 người)
- Collection Firestore mới **`public_orders`**, 1 doc / 1 mã đơn (id = mã đơn
  KY-...). Mỗi doc chỉ chứa trường tối thiểu để tra cứu: tên, SĐT (chỉ dùng
  để đối chiếu), gói, trạng thái, ngày + khung giờ, tiền cọc / đã thu /
  còn lại, link Drive, thời gian cập nhật.
- **KHÔNG** chứa email, ghi chú nội bộ, lời nhắn concept, lý do hủy — các
  trường này bị loại ở `buildPublicOrder` (có test chặn) và bị cấm ở
  firestore.rules.
- Public chỉ được **get 1 doc theo mã** (phải biết đúng mã đơn + đúng SĐT
  mới xem được), **KHÔNG list** được — không liệt kê được đơn của người khác.
  Chỉ admin (anhyenk26@gmail.com) mới được tạo/sửa/xóa.
- `booking_leads` vẫn đóng với public như cũ, không mở thêm.

## Deploy rules (làm 1 lần sau khi up v7.5)

1. Mở Firebase Console → project `ancient-partition-4lczw` → Firestore
   Database → tab **Rules**.
2. Copy toàn bộ nội dung file `firestore.rules` trong zip này dán đè lên,
   bấm **Publish**.
3. Kiểm tra: mở web ở máy khác (hoặc trình duyệt ẩn danh), tra cứu 1 đơn
   thật bằng mã + SĐT → phải hiện đúng tên, tiền, trạng thái. Nếu báo không
   tìm thấy thì kiểm tra lại: rules đã Publish chưa, và đã bấm "Đồng bộ lại
   tra cứu cho các đơn cũ" trong Dashboard chưa.

## Cách up

Up giống v7.4, Pages-only, lên gốc repo `pfl-yenvisuals` branch `main`, đợi
workflow chạy xong. Không up bản này lên Vercel (base '/pfl-yenvisuals/' chỉ
dùng cho GitHub Pages).

## File thay đổi so với v7.4

- `src/utils/portfolioLogic.ts`: thêm `PublicOrder`, `buildPublicOrder`,
  `matchesPublicOrderPhone`, `validatePaidAmount`.
- `src/services/firebase.ts`: thêm `savePublicOrder`, `fetchPublicOrder`,
  `syncAllPublicOrders`, `deletePublicOrder`.
- `src/App.tsx`: gọi `savePublicOrder` khi đơn được tạo/cập nhật trạng thái/
  cập nhật (kể cả tiền đã thu, link Drive), xóa `public_orders` khi xóa đơn;
  thêm `handleSyncPublicOrders` truyền xuống Dashboard.
- `src/components/DashboardView.tsx`: mục "Tiền đã thu" ở tab Leads
  (desktop + mobile), mục 4 đồng bộ tra cứu ở tab Cài đặt.
- `src/components/ContactSection.tsx`: tra cứu fallback qua `public_orders`
  khi không thấy đơn cục bộ, nút Drive to màu amber, sửa câu lưu ý cũ.
- `firestore.rules`: thêm `public_orders/{orderId}` (public chỉ get, cấm
  list; chỉ admin ghi; cấm trường email/notes/message/cancelReason).
- `src/utils/portfolioLogic.test.ts`: +4 test v7.5 (buildPublicOrder loại
  trường nhạy cảm, đối chiếu SĐT chuẩn hóa, validatePaidAmount).
- `PAGES-NOTES-V7.5.md`: file này.
