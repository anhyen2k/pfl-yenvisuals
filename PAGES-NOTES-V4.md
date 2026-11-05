# YÊN PHOTO — NOTES V4 CHO GITHUB PAGES (05/11/2026)

Bản này làm từ bản Yên Photo Vercel v4 (đã đổi tên Yên Visuals → Yên Photo,
sửa 29 điểm, tối ưu Dashboard, đường dẫn sạch), chỉ đổi phần deploy sang
GitHub Pages. Giữ nguyên toàn bộ nội dung v4: tên Yên Photo, Dashboard tối ưu,
Storage, cọc 30%, proofing theo mã đơn, tra cứu đơn.

## ⚠️ BẢN NÀY CHỈ DÙNG CHO GITHUB PAGES — KHÔNG DÙNG CHO VERCEL

GitHub Pages: **https://anhyen2k.github.io/pfl-yenvisuals/**
Vercel: **https://pfl-yenphoto.vercel.app/** (bản Vercel v4 riêng, đừng up bản này lên Vercel).

## Vì sao bản Vercel v4 up lên Pages bị trắng?

Bản Vercel build với `base: '/'` nên `dist/index.html` trỏ JS/CSS về
`/assets/index-*.js`. Trên Pages, web nằm ở thư mục con `/pfl-yenvisuals/`,
file thật nằm ở `/pfl-yenvisuals/assets/...`, còn `/assets/...` ở gốc
`anhyen2k.github.io` thì 404. Trình duyệt không tải được JS nên trang trắng,
dù file JS thật vẫn có trong repo. Mình kiểm tra trực tiếp lúc 18:15 ngày
05/11/2026: `/assets/index-*.js` → 404, `/pfl-yenvisuals/assets/index-*.js` → 200.

Bản này sửa đúng chỗ đó: `base: '/pfl-yenvisuals/'` nên `dist/index.html` trỏ
`/pfl-yenvisuals/assets/index-*.js` và `/pfl-yenvisuals/assets/*.css` (đã kiểm
chứng sau khi build, xem cuối file).

## Đã đổi gì so với bản Vercel v4?

- `vite.config.ts`: `base` từ `'/'` thành `'/pfl-yenvisuals/'`.
- `src/config/site.ts`: `siteUrl` thành `https://anhyen2k.github.io/pfl-yenvisuals/`.
- `index.html`: `og:url` và `og:image` sang domain Pages, giữ title Yên Photo.
- `public/sitemap.xml` và `public/robots.txt`: toàn bộ URL Vercel sang Pages,
  gồm 6 đường dẫn `/`, `/tac-pham`, `/bo-suu-tap`, `/ve-toi`, `/lien-he`, `/dat-lich`.
- `src/components/AdminLoginModal.tsx`: hướng dẫn lỗi `auth/unauthorized-domain`
  đổi domain Vercel thành `anhyen2k.github.io`.
- `src/utils/portfolioLogic.test.ts`: test email log kiểm tra siteUrl Pages
  thay vì Vercel.
- `vercel.json`: **XOÁ** khỏi bản này. Giữ nguyên `.github/workflows/deploy.yml`
  (GitHub Actions build `dist` cho Pages).

## Đường dẫn sạch trên Pages — xử lý thế nào?

Pages là hosting tĩnh, không có rewrite như `vercel.json` nên mở trực tiếp
`/pfl-yenvisuals/ve-toi` sẽ 404. Bản này dùng mẫu spa-github-pages:

- Thêm `public/404.html` (`pathSegmentsToKeep = 1` vì có 1 đoạn tiền tố
  `/pfl-yenvisuals/`): lưu đường dẫn vào `?/...` rồi redirect về
  `/pfl-yenvisuals/`. Ví dụ `/pfl-yenvisuals/ve-toi` →
  `/pfl-yenvisuals/?/ve-toi`.
- Thêm script khôi phục trong `index.html`: đọc `?/...`, đổi URL lại thành
  `/pfl-yenvisuals/ve-toi`, rồi App cuộn tới đúng mục. Đã kiểm chứng bằng mô
  phỏng: 404 → decode trả lại đúng đường dẫn cho cả `/tac-pham`,
  `/bo-suu-tap`, `/ve-toi`, `/dat-lich`. F5 không trắng trang — tệ nhất cũng
  về trang chủ.
- `src/utils/cleanPaths.ts` viết lại theo base: `APP_BASE` lấy từ
  `import.meta.env.BASE_URL` (`/pfl-yenvisuals` trên Pages, `` trên Vercel),
  `withBase()` ghép tiền tố, `stripBase()` bỏ tiền tố khi so khớp route.
  `navigateToSection` / `navigateHome` / `/dat-lich` đều dùng đường dẫn đầy đủ
  có base.
- Sửa thêm 2 chỗ link gốc tuyệt đối bị sót: `Navbar.tsx` dùng `href="/..."`
  (sẽ nhảy ra khỏi `/pfl-yenvisuals/`) → dùng `pathForSectionId` /
  `withBase`; `LightboxModal.tsx` copy link chỉ dùng `window.location.origin`
  (mất base) → thêm `withBase('/')`.

Không đổi gì khác so với v4. Grep `pfl-yenphoto` trong `src/` + `index.html` +
`public/` = 0 (chỉ còn trong các file ghi chú lịch sử).

## Cách up lên GitHub Pages (như cũ)

1. Giải nén file zip này, copy **toàn bộ nội dung bên trong** (kể cả thư mục ẩn
   `.github`) đè lên repo `anhyen2k/pfl-yenvisuals` nhánh `main`, commit + push.
   Đừng upload cả file zip, đừng để lồng trong 1 thư mục con, đừng làm mất
   thư mục `.github` khi kéo-thả.
2. Vào repo → Actions: chờ workflow "Deploy to GitHub Pages" chạy xong màu xanh.
3. Kiểm tra Settings → Pages → Source đang là **GitHub Actions**.
4. Mở `https://anhyen2k.github.io/pfl-yenvisuals/` và hard-refresh (Ctrl+Shift+R).
   Thử thêm `https://anhyen2k.github.io/pfl-yenvisuals/ve-toi` — phải vào đúng
   mục Về Tác Giả, không được trắng trang.

## Sau khi up — Firebase (bắt buộc, không thì đăng nhập admin lỗi)

Vào `console.firebase.google.com` → project `ancient-partition-4lczw`:
- **Authentication → Sign-in method:** bật nhà cung cấp **Google** (nếu chưa bật).
- **Authentication → Cài đặt (tab cuối) → Authorized domains → Add domain:**
  `anhyen2k.github.io` (không `https://`, không `/pfl-yenvisuals/`).
- Deploy `firestore.rules` và `storage.rules` riêng (Firebase CLI
  `firebase deploy --only firestore:rules,storage` hoặc dán vào Console) —
  code web không tự deploy rules. Chưa deploy thì seed ảnh mẫu và upload ảnh
  mới sẽ lỗi.

## Kiểm chứng bản này (05/11/2026)

- `npx tsc --noEmit`: PASS (0 lỗi)
- `npx tsx --test src/utils/portfolioLogic.test.ts`: **25/25 PASS**
- `npm run build`: PASS (JS 1.374 kB, chỉ cảnh báo chunk lớn có từ trước)
- `dist/index.html`: trỏ `/pfl-yenvisuals/assets/index-*.js` và
  `/pfl-yenvisuals/assets/*.css` — **không còn** `/assets/...` ở gốc.
- `dist/` có `404.html`, `sitemap.xml`, `robots.txt` đúng domain Pages.
- Logic 404 → decode: mô phỏng trả lại đúng đường dẫn cho `/tac-pham`,
  `/bo-suu-tap`, `/ve-toi`, `/dat-lich`.
- Chưa kiểm chứng bằng deploy thật lên Pages (chỉ kiểm chứng build + bundle);
  sau khi Yen up và Actions xanh, mở link `/ve-toi` để xác nhận lần cuối.
