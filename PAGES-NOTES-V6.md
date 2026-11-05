# YÊN PHOTO — PAGES v6 (GitHub Pages)

Bản v6 gộp 3 việc vào 1 bản, giữ nguyên toàn bộ v5.1 (chỉnh giá Dashboard lưu
Firestore `settings/pricing`, SĐT 0961230500, đăng nhập admin Google
`anhyenk26@gmail.com`, giao diện v5, tối ưu lưu ảnh v5.1: nén ngay khi chọn file,
upload resumable có % tiến độ).

**File này:** `yen-photo-portfolio-PAGES-v6.zip` — up toàn bộ source trong zip lên
repo `pfl-yenvisuals` (nhánh main) như các bản Pages trước. Base
`/pfl-yenvisuals/`, KHÔNG có `vercel.json`, KHÔNG up bản này lên Vercel.

**Kiểm chứng trước khi gửi:** `npx tsc --noEmit` PASS 0 lỗi ·
`npx tsx --test src/utils/portfolioLogic.test.ts` PASS **38/38** (30 cũ + 8 mới:
4 proofing + 4 nội dung) · `npm run build` PASS · `dist/index.html` trỏ
`/pfl-yenvisuals/assets/` · không có `vercel.json` · grep `0912` trong
`src/` + `index.html` + `public/` = 0.

---

## 0. BẮT BUỘC: deploy lại rules trước khi dùng tính năng mới

Code web mới chỉ chạy đủ khi **cả 2 file rules** đã deploy lên Firebase
(project `ancient-partition-4lczw`). Chưa deploy thì proofing up ảnh sẽ báo lỗi,
nội dung/giá mới không lưu được lên Cloud.

**Cách 1 — Firebase CLI (máy đã cài Firebase CLI, đã login):**

```bash
firebase deploy --only firestore:rules,storage
```

**Cách 2 — Firebase Console (không cần CLI):**

1. Vào [Firebase Console](https://console.firebase.google.com/) → project
   `ancient-partition-4lczw` → **Firestore Database → Rules**: copy toàn bộ nội
   dung file `firestore.rules` trong zip này, dán đè, bấm **Publish**.
2. **Storage → Rules**: copy toàn bộ nội dung file `storage.rules`, dán đè,
   bấm **Publish**.

**Kiểm tra đã deploy đúng chưa:** mở Dashboard → tab Leads → bấm "Ảnh proofing"
ở 1 đơn → bấm "Chọn ảnh proofing" up thử 1 ảnh. Up được = rules đã đúng.
Nếu báo lỗi quyền (permission-denied) thì rules chưa lên — làm lại bước trên.

---

## 1. (A) Proofing theo từng đơn — khách chỉ xem được ảnh của đơn mình

### Yen up ảnh proofing cho 1 đơn (Dashboard)

1. Đăng nhập admin (Google `anhyenk26@gmail.com`) → vào **Dashboard → tab
   Khách Đăng Ký (Leads)**.
2. Tìm đơn cần trả ảnh → bấm nút **"Ảnh proofing"** trong cột Hành Động
   (desktop) hoặc trong thẻ đơn (mobile). Một khung mới mở ra ngay dưới đơn đó.
3. Bấm **"Chọn ảnh proofing"** → chọn nhiều file 1 lúc (tối đa **30 ảnh/đơn**,
   mỗi file **≤ 8MB**). Ảnh tự nén về 1600px + tạo thumbnail, upload có % tiến
   độ từng ảnh.
4. Ảnh đã up hiện thành lưới thumbnail. Bấm 🗑 trên 1 ảnh để xoá ảnh đó
   (xoá cả file trên Storage + doc Firestore).
5. Khung này cũng hiện **số ảnh khách đã chọn** (ví dụ "khách đã chọn 12 ảnh"),
   ảnh khách chọn có dấu ✓ vàng, kèm số sao và ghi chú khách để lại ngay dưới
   ảnh. Bấm **"Tải lại"** để xem lựa chọn mới nhất của khách.

> Lưu ý: ảnh proofing chỉ xem được khi khách nhập đúng **mã đơn + 4 số cuối
> SĐT đặt lịch** của đơn đó. SĐT lấy từ đơn (trường `phone`); nếu đơn nhập tay
> mà SĐT sai/thiếu thì khách không mở được — sửa lại SĐT trong đơn rồi up lại
> (ảnh đã up trước đó vẫn giữ 4 số cuối cũ; xoá up lại nếu cần).

### Khách xem và chọn ảnh

1. Khách bấm nút mở **Cổng Duyệt Ảnh** trên web (Navbar) → nhập **mã đơn
   (KY-...)** + **4 số cuối SĐT** đặt lịch → bấm "Mở ảnh của tôi".
2. Nếu đơn chưa có ảnh nào: web báo *"Chưa có ảnh cho mã đơn này, Anh Yên sẽ
   up sau khi trả ảnh"* — không mở lưới trống.
3. Nếu 4 số cuối không khớp: báo không khớp, kiểm tra lại mã đơn và SĐT.
4. Khách thấy đúng ảnh của đơn mình (thumbnail tải nhanh, bấm vào xem ảnh lớn
   1600px), chọn ảnh yêu thích / đánh sao / ghi chú từng ảnh, rồi bấm
   **"Gửi lựa chọn"**. Gửi thành công thì hiện "Đã gửi lựa chọn cho Anh Yên!".
5. Nếu mất mạng lúc gửi: web báo *"Đã lưu trên máy này, chưa gửi được lên
   Cloud, thử lại khi có mạng"* — lựa chọn vẫn nằm trên máy khách, bấm gửi lại
   khi có mạng là được.

### Yen xem lựa chọn của khách ở đâu

- Ngay trong khung "Ảnh proofing của đơn này" ở Dashboard (mục trên): số ảnh
  khách chọn, dấu ✓ trên ảnh, sao và ghi chú dưới mỗi ảnh.
- Dữ liệu lưu ở Firestore collection `proofing_selections` (1 doc / 1 mã đơn)
  và `proofing_photos` (1 doc / 1 ảnh) — xem trong Firebase Console nếu cần.

### Link Drive vẫn là kênh trả ảnh gốc

Proofing trên web chỉ là **ảnh xem trước để chọn**. Ảnh gốc đầy đủ vẫn trả qua
**link Google Drive** như cũ: Yen dán link vào ô Drive của đơn trong Dashboard,
khách xem link đó ở mục **Tra cứu đơn** (ContactSection). Không thay đổi gì ở
luồng Drive.

### ⚠️ Cảnh báo bảo mật proofing

- **Mã đơn KY-... + 4 số cuối SĐT chính là "mật khẩu" xem ảnh.** Đừng đăng mã
  đơn công khai (post Facebook, story, nhóm lớp...). Chỉ gửi riêng cho khách
  của đơn đó qua Zalo/tin nhắn riêng.
- Ai biết cả mã đơn và 4 số cuối SĐT đều xem được ảnh proofing của đơn đó và
  gửi lựa chọn thay khách. Ảnh proofing là ảnh xem trước đã nén — **đừng up
  ảnh gốc chất lượng cao lên proofing**, ảnh gốc chỉ trả qua Drive.
- Rules đã siết: `proofing_photos` chỉ admin mới up/xoá; `proofing_selections`
  khách chỉ ghi đúng doc theo mã đơn của mình, không liệt kê được toàn bộ,
  không xoá được lựa chọn của đơn khác, không đọc được `booking_leads`.

---

## 2. (C) Chỉnh nội dung giao diện trong Dashboard (không cần sửa code)

**Vị trí:** Dashboard → tab **Cài đặt** → mục **"2. NỘI DUNG GIAO DIỆN KHÁCH
HÀNG"** (nằm trên mục "3. CÁC GÓI CHỤP..." — bảng giá).

**Các trường chỉnh được:**

| Nhóm | Trường | Tối đa | Hiện ở đâu trên web |
|---|---|---|---|
| Hero | Tiêu đề chính Hero | 200 | Dòng tiêu đề lớn đầu trang |
| Hero | Mô tả ngắn Hero | 500 | Đoạn dưới tiêu đề |
| Hero | Nút chính Hero | 100 | Nút "Xem Album Tác Phẩm" |
| Hero | Nút phụ Hero | 100 | Nút "Bảng Giá & Đặt Lịch" |
| Hero | Dòng chữ chạy (marquee) | 500 | Dải chữ chạy cuối Hero (các mục cách nhau bằng `·`) |
| Về tôi | Tên hiển thị | 100 | Tiêu đề mục Về tôi |
| Về tôi | Vai trò / dòng sau tên | 200 | Cùng dòng tiêu đề mục Về tôi |
| Về tôi | Giới thiệu ngắn | 500 | Đoạn 1 mục Về tôi |
| Về tôi | Giới thiệu dài | 500 | Đoạn 2 + 3 mục Về tôi (xuống dòng = đoạn mới) |
| Bảng giá | Mô tả ngắn từng gói (4 gói) | 200/gói | Dưới giá gói trong mục Bộ Sưu Tập Concept |
| Liên hệ | Khu vực hoạt động | 500 | Thẻ "Khu vực hoạt động" mục Liên hệ |
| Liên hệ | Giờ làm việc | 200 | Thẻ Zalo & liên hệ, dưới email |
| Liên hệ | Ghi chú liên hệ | 500 | Dòng cuối thẻ Zalo & liên hệ |
| Footer | Tagline footer | 200 | Dòng cuối trang |

**Cách dùng:** sửa chữ trong form → bấm **"Lưu nội dung"** → hiện *"Đã lưu,
khách sẽ thấy nội dung mới khi tải lại trang"*. Bấm **"Khôi phục mặc định"**
(có xác nhận) để về chữ gốc. Dòng "Lưu lần cuối: ..." cho biết lần lưu trước.

**Lưu ý:**

- Nội dung lưu ở Firestore doc **`settings/content`** (+ cache localStorage
  `yen_photo_site_content` để mở trang vẫn hiện chữ ngay cả khi mạng chậm).
  Chưa load xong Cloud thì web hiện nội dung mặc định, không để trống/trắng.
- Chỉ render **text thuần, không cho HTML**: nếu lỡ dán chữ có thẻ
  `<b>`, `<script>`... thì thẻ sẽ bị lược bỏ, chỉ giữ lại chữ.
- Trường để trống sẽ tự dùng lại chữ mặc định (không để trống giao diện).
- Tên gói và giá vẫn chỉnh ở mục Bảng giá (`settings/pricing`) như v5, không
  chỉnh trong mục này.

---

## 3. (B) Tối ưu tốc độ tải/xem ảnh về 2–3 giây

**Đã làm:**

1. **Thumbnail:** khi up ảnh (portfolio + proofing) web tạo thêm bản thumb
   **~600px WebP quality 0.75**, lưu Storage cùng tên + hậu tố `_thumb.webp`,
   lưu `thumbUrl` vào doc ảnh. Gallery và Proofing load thumb trước, chỉ khi
   bấm xem lớn (Lightbox) mới load ảnh 1600px. Ảnh portfolio cũ chưa có thumb
   thì tự dùng ảnh gốc (không cần up lại).
2. **Lazy load:** mọi `<img>` trong Gallery/Proofing có `loading="lazy"`
   `decoding="async"`; Gallery chỉ render **8 ảnh đầu**, nút **"Xem thêm"**
   tải thêm 8 ảnh/lần (không render hết 1 lúc).
3. **Cache:** file upload lên Storage được set
   `cacheControl: public,max-age=31536000,immutable` (cache 1 năm).
4. Giữ nguyên ảnh lớn **1600px JPEG 0.82** cho Lightbox, giới hạn **8MB/file**.

**Bảng tốc độ kỳ vọng (tham khảo, tuỳ mạng — ảnh càng nhiều thì càng cần lazy
load, số dưới đây tính cho lưới 8 ảnh đầu với thumbnail ~40–90KB/ảnh):**

| Mạng | Lưới Gallery/Proofing hiện ảnh (8 thumb đầu) | Xem 1 ảnh lớn (1600px) |
|---|---|---|
| Wifi bình thường (20–50 Mbps) | **~2–3 giây** | ~1–2 giây |
| 4G tốt (10–20 Mbps) | ~3–5 giây | ~2–4 giây |
| 4G yếu / wifi chập chờn (<5 Mbps) | 5–10 giây trở lên, ảnh hiện dần từng cái | 3–8 giây |
| Mạng rất yếu | Ảnh hiện dần theo lazy load; cuộn tới đâu tải tới đó | Có thể lâu, đợi 1 lúc |

**Lưu ý về query proofing:** query lấy tối đa **50 ảnh/đơn**, sắp xếp theo
`order`. Nếu Firestore báo thiếu index (`failed-precondition`, kèm link tạo
index) thì code tự fallback sang sắp xếp ở client nên ảnh vẫn hiện đúng thứ tự
— Yen bấm vào link trong thông báo lỗi của Firebase Console để tạo index cho
lần sau nhanh hơn.

---

## 4. 🔒 Chỉ admin mới được sửa — kiểm tra quyền 3 lớp

Mọi chỉnh sửa **nội dung / giá / proofing** đều yêu cầu **đăng nhập Google
đúng `anhyenk26@gmail.com`**. Khách (guest) chỉ đọc.

| Lớp | Cách chặn |
|---|---|
| **Giao diện** | Dashboard chỉ mở khi `userRole` là admin (App). Trong tab Cài đặt, mục "Nội dung giao diện" và "Bảng giá" chỉ hiện form sửa cho admin: khách xem (nếu mở được) sẽ thấy ô nhập bị mờ/khoá, nút Lưu bị chặn và báo *"Chỉ quản trị viên mới được..."*. Nút "Ảnh proofing" chỉ có trong Dashboard (admin). |
| **Client-side** | Hàm lưu trong Dashboard (`handleSaveSiteContent`, `handleSavePackagePrices`, ...) kiểm tra lại `isAdmin` trước khi ghi; hàm ghi trong `firebase.ts` (`saveSiteContent`, `savePackagePrices`, `uploadProofingPhoto`, `uploadCompressedPhoto`...) kiểm tra lại bằng `requireAdmin()` (so email với `ADMIN_EMAIL`) và throw ngay nếu không phải admin. |
| **Firestore/Storage rules (Cloud)** | `settings/pricing` và `settings/content`: public chỉ read, **chỉ admin** create/update/delete (rule tách riêng 2 doc — rule v5 cũ bắt mọi doc `settings` phải có `prices` nên sẽ chặn doc content). `proofing_photos`: public read, **chỉ admin** write. `proofing_selections`: public chỉ get đúng doc theo mã đơn + create/update khi `leadId` trong dữ liệu == id doc, **không list toàn bộ, không delete**. Storage `proofing/{leadId}/{file}`: public read, **chỉ admin** write (≤8MB, image). `portfolio_photos` giữ như cũ. |

> Nếu thấy báo lỗi *"Chỉ quản trị viên..."* khi đang là Yen: kiểm tra đã đăng
> nhập Google đúng `anhyenk26@gmail.com` chưa (không phải tài khoản Google
> khác), rồi tải lại trang.

---

## 5. Những gì giữ nguyên từ v5.1

- Chỉnh giá 4 gói trong Dashboard, lưu Firestore `settings/pricing`, áp dụng
  cho đơn đặt mới (đơn cũ giữ giá lúc đặt).
- SĐT/Zalo `0961230500` khắp web; admin `ADMIN_EMAIL = anhyenk26@gmail.com`
  cố định, tách khỏi email nhận đơn.
- Giao diện v5 (Hero, Gallery chỉ Bento, form đặt lịch 3 bước, Dashboard
  mobile dạng thẻ...).
- Tối ưu lưu ảnh v5.1: nén ngay khi chọn file, resize native + hạ bậc, preview
  bằng object URL, upload resumable có % tiến độ (mục tiêu lưu trong 5s với
  file ≤8MB trên wifi bình thường, không cam kết cứng trên mạng yếu).

## 6. Còn cần Yen làm / quyết

1. **Deploy lại `firestore.rules` + `storage.rules`** (mục 0) — nếu không,
   proofing và lưu nội dung sẽ lỗi quyền.
2. Up bản v6 lên GitHub (repo `pfl-yenvisuals`, nhánh main) như các bản Pages
   trước, đợi workflow chạy xong rồi mở link Pages kiểm tra.
3. Thử 1 vòng proofing thật: up 2–3 ảnh cho 1 đơn → mở Cổng Duyệt Ảnh bằng mã
   đơn + 4 số cuối SĐT → chọn thử 1 ảnh → gửi → xem Dashboard có hiện lựa chọn
   không.
4. Các việc vẫn chờ Yen quyết từ trước (không làm trong v6): họ tên đầy đủ có
   phải "Yên Nguyễn" không, email thật thay Airform, STK nhận cọc, review
   khách thật, ảnh portfolio thật thay ảnh mẫu SVG.
