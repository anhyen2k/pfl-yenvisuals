# YÊN PHOTO — NOTES V7.4 MÃ QR ZALO (05/11/2026)

Bản v7.4 chỉ thêm mã QR Zalo trên nền v7.3, không đổi tính năng hay thiết kế
nào khác (giữ nguyên SEO, nút Hero chính Xem Album, chỉnh giá, proofing theo
đơn, chỉnh nội dung, SĐT 0961230500, đăng nhập admin, font Fraunces +
Be Vietnam Pro, base '/pfl-yenvisuals/', không có vercel.json).

Kiểm chứng ngày 05/11/2026: `npx tsc --noEmit` PASS (0 lỗi),
`npx tsx --test src/utils/portfolioLogic.test.ts` **43/43 PASS** (như v7.3),
`npm run build` PASS, `dist/index.html` trỏ `/pfl-yenvisuals/assets/`,
`dist/assets/zalo-qr.png` có mặt và giải mã ra đúng link. Grep `0912`
trong src/ + index.html + public/ = 0.

## 1. Mã QR Zalo

- File: `public/assets/zalo-qr.png` (396x396, nền trắng), tạo từ link
  `https://zalo.me/0961230500` — đã kiểm chứng giải mã ra đúng link đó,
  cả ở file nguồn lẫn file trong `dist/` sau khi build.
- **Nếu Yen có mã QR chính thức từ app Zalo:** chỉ cần thay file
  `public/assets/zalo-qr.png` bằng file đó (giữ nguyên tên file), up lại
  web là xong, không cần sửa code.

## 2. Nút "Nhắn Zalo" giờ mở modal QR

- Component mới `src/components/ZaloQrModal.tsx`: modal giữa màn hình, nền
  mờ, nút đóng X; bên trong có ảnh QR, tiêu đề "Quét mã để nhắn Zalo",
  tên Yên Photo + SĐT 0961 230 500, và link "Mở Zalo trực tiếp"
  (https://zalo.me/0961230500) cho người đang dùng điện thoại.
- Đóng modal khi bấm X, bấm nền mờ, hoặc bấm phím Escape.
- Các nút đã đổi sang mở modal: Hero (nút phụ Nhắn Zalo), Liên hệ (thẻ
  Nhắn Zalo), và nút Zalo trong màn hình xác nhận đặt lịch (modal QR hiện
  phía trên modal đặt lịch, đóng QR xong vẫn quay lại màn hình đặt lịch).
- Trạng thái mở modal quản lý chung ở `App.tsx` (1 state `isZaloQrOpen`).
- Nút "Gọi điện" vẫn là `tel:` như cũ, không đổi.

## 3. Giữ nguyên link trực tiếp ở 2 chỗ (cố ý, không phải quên)

- **Gallery — gửi danh sách ảnh yêu thích qua Zalo:** mở thẳng link
  `zalo.me` kèm tin nhắn soạn sẵn (danh sách ảnh khách đã thích), vì mở
  modal QR sẽ làm mất tin nhắn đó.
- **Dashboard (admin):** các nút Zalo nhắn cho từng khách vẫn mở thẳng
  `zalo.me/<số khách>` như cũ, không đổi.

## 4. Cách up

Up giống v7.3, Pages-only, lên gốc repo `pfl-yenvisuals` branch `main`,
đợi workflow chạy xong. Rules Firestore/Storage đã deploy từ v6 thì
không cần deploy lại.
