# YÊN PHOTO — NOTES V7.3 SEO (05/11/2026)

Bản v7.3 chỉ thêm tối ưu SEO trên nền v7.2, không đổi tính năng hay thiết kế
nào khác (giữ nguyên proofing theo đơn, chỉnh giá, chỉnh nội dung, SĐT
0961230500, đăng nhập admin, font Fraunces + Be Vietnam Pro,
base '/pfl-yenvisuals/', không có vercel.json).

Kiểm chứng ngày 05/11/2026: `npx tsc --noEmit` PASS (0 lỗi),
`npx tsx --test src/utils/portfolioLogic.test.ts` **43/43 PASS** (42 cũ + 1 test
mới cho alt text), `npm run build` PASS, `dist/index.html` trỏ
`/pfl-yenvisuals/assets/`, JSON-LD trong dist đã trích ra và JSON.parse thành
công, `dist/` có `sitemap.xml` + `robots.txt` + `assets/og-image.jpg`.
Grep `0912` trong src/ + index.html + public/ = 0.

## 1. Title + description mới (theo từ khoá khách hay tìm)

- Title (48 ký tự): `Chụp Kỷ Yếu Hà Nội | Yên Photo — Áo Dài, Cổ Phục`
- Description (132 ký tự): `Chụp kỷ yếu, áo dài, cổ phục tại Hà Nội — giá từ
  650k, trả file gốc trong 24h, Sony A7 Mark III. Nhắn Zalo 0961 230 500 để
  đặt lịch.`
- og:title / og:description / twitter:title / twitter:description đồng bộ theo
  title và description trên.

## 2. Canonical + meta bổ sung (index.html)

- `<link rel="canonical" href="https://anhyen2k.github.io/pfl-yenvisuals/">`
- `<meta name="robots" content="index, follow">`
- `og:locale` vi_VN, `og:site_name` Yên Photo, `twitter:card`
  summary_large_image + `twitter:image` / `twitter:image:alt`.

## 3. JSON-LD structured data (1 script application/ld+json trong index.html)

- `@type: LocalBusiness` + `additionalType: https://schema.org/Photographer`
- name Yên Photo, description như trên, url, telephone +84961230500, email
  anhyenk26@gmail.com, areaServed Hà Nội, priceRange 650000 - 1200000 VND,
  openingHours Mo-Su 08:00-20:00 (theo giờ làm việc đã công bố).
- hasOfferCatalog với đúng 4 gói thật: Áo dài solo 650.000, Kỉ yếu nhóm
  1.200.000, Cổ phục 850.000, Rửa ảnh/Photobook 450.000 (VND).
- **KHÔNG có trong JSON-LD (không bịa):** không có aggregateRating / review /
  số sao (chưa có review thật), không có địa chỉ cụ thể (chỉ có Hà Nội),
  không có sameAs / Instagram / Facebook (chưa có link thật).

## 4. Ảnh + tiêu đề

- H1 duy nhất ở Hero; các section còn lại dùng H2, không nhảy bậc H1→H3.
- Mọi ảnh Gallery / Hero / Lightbox / Series / Dashboard đều có alt mô tả
  thật qua hàm mới `describePhotoAlt()` (tiêu đề tiếng Việt + địa điểm chụp,
  không lặp địa điểm nếu tiêu đề đã nhắc tới), ví dụ: "Hương Sen Bách Diệp —
  Tây Hồ, Hà Nội". Alt của ảnh proofing giữ dạng "Ảnh proofing #N — đơn KY-…"
  vì đó là ảnh theo đơn, không có tiêu đề riêng.
- **og:image mới:** `public/assets/og-image.jpg` (1200×630, ~124KB) — ảnh nữ
  sinh áo dài trắng cầm mũ cử nhân trên phố Hà Nội mùa thu. Đây là ảnh tạo
  bằng AI làm ảnh chia sẻ tạm thời, **Yen nên thay bằng 1 ảnh thật của mình
  sau khi chụp** (giữ đúng tên file og-image.jpg và kích thước 1200×630 thì
  không cần sửa code).
- **Đã xoá ảnh og cũ:** file `public/assets/aistudio/image_2abc7389.png`
  (cùng 2 ảnh screenshot giao diện khác trong thư mục đó) đã bị xoá khỏi bản
  này — ảnh cũ thực chất là screenshot form đặt lịch, còn lộ cả tên/SĐT/email
  của khách trong ảnh, tuyệt đối không nên làm ảnh đại diện khi chia sẻ link.
  Không còn file nào trong code trỏ tới các ảnh đó nữa.

## 5. Sitemap + robots

- `public/sitemap.xml`: thêm `<lastmod>2026-11-05</lastmod>` cho cả 6 URL.
  Không thêm `<image:image>` vì web chưa có ảnh thật (ảnh portfolio hiện là
  SVG vẽ bằng code); khi Yen thêm ảnh thật thì thêm image sitemap sau.
- `public/robots.txt`: giữ nguyên (Allow / + Sitemap). Không thêm Disallow vì
  Dashboard không có URL riêng — nó chỉ mở bằng nút trong app khi đã đăng
  nhập admin, Google không thu thập được nên không cần chặn.

## 6. Sau khi up bản v7.3, Yen làm thêm để Google nhận diện

1. Up zip lên gốc repo `pfl-yenvisuals` branch `main` như mọi lần, đợi
   workflow chạy xong.
2. Mở Google Search Console (search.google.com/search-console), đăng nhập
   đúng tài khoản Google của Yen → Add property → nhập
   `https://anhyen2k.github.io/pfl-yenvisuals/` → xác minh quyền sở hữu theo
   hướng dẫn của Google (thường là thêm 1 file HTML hoặc thẻ meta — hỏi
   assistant nếu tới bước này).
3. Trong Search Console → Sitemaps → gửi
   `https://anhyen2k.github.io/pfl-yenvisuals/sitemap.xml`.
4. Đợi Google thu thập lại, thường mất vài ngày tới vài tuần mới thấy thay
   đổi trên kết quả tìm kiếm. **Không cam kết lên top ngay** — SEO cần thời
   gian, ảnh thật và review khách thật sau này sẽ giúp nhiều hơn mọi thẻ meta.
