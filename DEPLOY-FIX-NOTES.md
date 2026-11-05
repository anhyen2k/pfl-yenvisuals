# Sửa lỗi GitHub Pages chỉ hiện "pfl-yenvisuals"

## Nguyên nhân (đã kiểm chứng lúc 15:10 ngày 05/11/2026)
Trang https://anhyen2k.github.io/pfl-yenvisuals/ trả về HTML của Jekyll,
không phải app React. Nó render README.md thành tiêu đề "pfl-yenvisuals".
Nghĩa là: Yen đã push source code lên nhánh main, GitHub Pages đang ở chế
độ "Deploy from a branch" (Jekyll mặc định). GitHub Pages không tự build
Vite/React — nó chỉ phục vụ file tĩnh có sẵn. Trong repo không có
index.html đã build ở root, nên nó lấy README.md làm trang chủ.

## Đã sửa trong bản này (dựa trên bản P0-fix-DRAFT)
1. `vite.config.ts`: thêm `base: '/pfl-yenvisuals/'`. Nếu không có dòng
   này, file JS/CSS sau khi build sẽ trỏ về `/assets/...` (root domain)
   và lỗi 404 trên Project Pages.
2. `.github/workflows/deploy.yml` (mới): mỗi lần push lên nhánh `main`,
   GitHub Actions tự `npm install --legacy-peer-deps`, `npm run build`,
   rồi deploy thư mục `dist` lên Pages. Không cần push thư mục `dist`
   lên repo nữa.

## Yen cần làm (3 bước, khoảng 5 phút)
1. Giải nén bản này đè lên repo, commit + push lên nhánh `main`.
2. Vào repo GitHub > Settings > Pages > Build and deployment > Source:
   chọn **GitHub Actions** (đừng để "Deploy from a branch").
3. Vào tab Actions, chờ workflow "Deploy to GitHub Pages" chạy xong
   (tích xanh), rồi mở lại https://anhyen2k.github.io/pfl-yenvisuals/
   và hard-refresh (Ctrl+Shift+R). Nếu vẫn thấy trang cũ, chờ thêm
   1-2 phút do cache của GitHub Pages (max-age 600s).

## Lưu ý
- Đừng đổi tên repo, vì `base` đang gắn với `/pfl-yenvisuals/`.
  Đổi tên repo thì phải đổi `base` theo.
- Bản P0 (bỏ PIN admin, xoá lead mẫu, siết firestore.rules) vẫn giữ
  nguyên trong bản này. Nhớ deploy cả `firestore.rules` lên Firebase
  như hướng dẫn trong P0-FIX-NOTES.md.
- Cách làm tay (không khuyên): build ở máy (`npm run build`) rồi copy
  toàn bộ nội dung thư mục `dist` lên nhánh `gh-pages` + thêm file
  rỗng `.nojekyll`. Cách này dễ quên build lại mỗi lần sửa code.
