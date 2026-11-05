# VERCEL NOTES — Yên Visuals Portfolio (bản Vercel v3)

Bản này làm từ FIXED-v2 (đã sửa 29 điểm, giữ nguyên toàn bộ), chỉ đổi phần deploy
sang Vercel + đường dẫn sạch. Ngày làm: 05/11/2026. Domain Vercel:
**https://pfl-yenphoto.vercel.app/**

## Đã đổi gì so với FIXED-v2

- `vite.config.ts`: `base` từ `'/pfl-yenvisuals/'` thành `'/'` (Vercel phục vụ ở root).
- Thêm `vercel.json`: `framework: vite`, rewrite mọi đường dẫn về `/index.html`
  (`{ "source": "/(.*)", "destination": "/index.html" }`). Không có serverless/API.
- Đường dẫn sạch, không thêm dependency (không dùng react-router), dùng
  `window.location.pathname` + `history.pushState` trong `src/utils/cleanPaths.ts`:
  `/` trang chủ, `/tac-pham` → #gallery, `/bo-suu-tap` → #series,
  `/ve-toi` → #about, `/lien-he` → #contact, `/dat-lich` → mở BookingModal.
  Bấm Navbar đổi URL sang đường dẫn sạch; load trực tiếp `/ve-toi` thì cuộn
  tới đúng mục; bấm Back/Forward cũng cuộn/mở đúng; link cũ `#about` vẫn chạy
  (tự đổi thành `/ve-toi`). Mở BookingModal đổi URL thành `/dat-lich`,
  đóng modal thì về đường dẫn trước đó. Lightbox, Gallery, Booking, Admin
  không đổi hành vi.
- `src/config/site.ts`: `siteUrl` thành `https://pfl-yenphoto.vercel.app/`.
- `index.html`: thêm `og:url`, `og:image` thành
  `https://pfl-yenphoto.vercel.app/assets/aistudio/image_2abc7389.png`.
- `public/sitemap.xml`: 6 URL trên domain Vercel (`/`, `/tac-pham`,
  `/bo-suu-tap`, `/ve-toi`, `/lien-he`, `/dat-lich`).
  `public/robots.txt`: Sitemap trỏ về domain Vercel.
- `AdminLoginModal.tsx`: hướng dẫn lỗi `auth/unauthorized-domain` đổi thành
  domain `pfl-yenphoto.vercel.app`.
- Không còn hardcode `/pfl-yenvisuals/` trong `src/`, `index.html`, `public/`
  (chỉ còn trong các file ghi chú cũ FIX-NOTES-V2.md / DEPLOY-FIX-NOTES.md và
  comment giải thích trong `vite.config.ts`).

## ⚠️ CẢNH BÁO — KHÔNG up bản này lên GitHub Pages

**Bản này build với `base: '/'` nên KHÔNG được up bản này lên GitHub Pages nữa,
chỉ dùng cho Vercel.**

GitHub Pages (project site) phục vụ web ở `anhyen2k.github.io/pfl-yenvisuals/`,
cần `base: '/pfl-yenvisuals/'`. Nếu up bản này lên Pages, asset sẽ trỏ về
`/assets/...` và trang sẽ lỗi/trắng. File `.github/workflows/deploy.yml`
vẫn còn trong repo (không xoá theo yêu cầu) — nghĩa là **đẩy bản này lên
nhánh `main` sẽ kích hoạt luôn workflow Pages và làm hỏng link Pages cũ
`anhyen2k.github.io/pfl-yenvisuals/`**. Đó là hệ quả đã biết và chấp nhận
được nếu Yen chuyển hẳn sang Vercel: từ giờ chỉ dùng
`https://pfl-yenphoto.vercel.app/`, bỏ link Pages cũ.
Muốn giữ cả 2 nơi cùng chạy thì đừng đẩy bản này lên `main`: đẩy lên nhánh
riêng (vd `vercel`) và đặt Vercel Production Branch là nhánh đó, giữ `main`
ở bản FIXED-v2 cho Pages.

## Cách deploy lên Vercel (theo đúng màn hình Yen đang thấy)

1. Up bản này lên GitHub repo `anhyen2k/pfl-yenvisuals` nhánh `main` trước
   (giải nén, copy toàn bộ nội dung bên trong, kể cả thư mục ẩn `.github`,
   đè lên gốc repo, commit + push). Xem cảnh báo ở trên trước khi làm bước này.
2. Vào `vercel.com` → **Add New → Project** → Import repo
   `anhyen2k/pfl-yenvisuals`, nhánh `main`.
3. Điền đúng như sau (theo ảnh Yen gửi, chỉ sửa 3 chỗ đã sai trước đó):
   - **Vercel Team:** YENPHOTO — **Hobby**
   - **Project Name:** `pfl-yenphoto` → link `https://pfl-yenphoto.vercel.app/`
   - **Root Directory:** `./` (KHÔNG phải `public`)
   - **Framework Preset:** **Vite** (KHÔNG phải `Other`)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install --legacy-peer-deps`
     (bắt buộc: `npm install` thường lỗi xung đột peer esbuild 0.25 / Vite 8)
   - Environment Variables: không cần.
4. Bấm **Deploy**, chờ chạy xong màu xanh, mở link Vercel kiểm tra.

## Sau khi deploy — Firebase (bắt buộc, không thì đăng nhập admin lỗi)

Vào `console.firebase.google.com` → project `ancient-partition-4lczw`:
- **Authentication → Sign-in method:** bật nhà cung cấp **Google** (nếu chưa bật).
- **Authentication → Cài đặt (tab cuối) → Authorized domains → Add domain:**
  `pfl-yenphoto.vercel.app` (không `https://`, không `/` ở cuối).
  Giữ nguyên `anhyen2k.github.io` trong danh sách nếu Yen vẫn muốn Pages cũ
  chạy song song (không bắt buộc nếu đã bỏ Pages).
- Deploy `firestore.rules` và `storage.rules` vẫn phải làm riêng như bản
  FIXED-v2 (Firebase CLI hoặc dán vào Console) — code web không tự deploy rules.

## Kiểm chứng bản này (05/11/2026)

- `npx tsc --noEmit`: PASS
- `npx tsx --test src/utils/portfolioLogic.test.ts`: 21/21 PASS
- `npm run build`: PASS; `dist/index.html` không còn trỏ `/pfl-yenvisuals/assets/`.
