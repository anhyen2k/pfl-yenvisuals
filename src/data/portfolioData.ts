/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PhotoItem } from '../utils/portfolioLogic';

// Helper to create museum-grade photographic compositions with artistic gradients and forms for Ao Dai & Kỉ Yếu
function createAoDaiArtSvg(
  variant:
    | 'aodai-white-school'
    | 'kiyieu-grad-caps'
    | 'cophuc-nhatbinh'
    | 'aodai-phandinhphung'
    | 'kiyieu-retro-90s'
    | 'aodai-hoangthanh'
    | 'aodai-lotus'
    | 'kiyieu-friends-sun'
    | 'aodai-tet-red'
    | 'aodai-nonla'
    | 'kiyieu-picnic'
    | 'cophuc-couple',
  title: string
): string {
  let content = '';

  switch (variant) {
    case 'aodai-white-school':
      content = `
        <defs>
          <linearGradient id="morningLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fffbeb"/>
            <stop offset="40%" stop-color="#fef3c7"/>
            <stop offset="75%" stop-color="#fed7aa"/>
            <stop offset="100%" stop-color="#fdba74"/>
          </linearGradient>
          <linearGradient id="silkFlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="#f8fafc"/>
            <stop offset="100%" stop-color="#e2e8f0"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#morningLight)"/>
        <!-- Brick arch corridor of French-colonial school -->
        <path d="M 0,0 L 260,0 Q 260,260 0,260 Z" fill="#b45309" opacity="0.15"/>
        <path d="M 800,0 L 540,0 Q 540,260 800,260 Z" fill="#b45309" opacity="0.15"/>
        <!-- Falling yellow leaves of Bang tree -->
        <ellipse cx="220" cy="180" rx="14" ry="7" fill="#f59e0b" transform="rotate(25 220 180)"/>
        <ellipse cx="580" cy="240" rx="12" ry="6" fill="#d97706" transform="rotate(-35 580 240)"/>
        <ellipse cx="320" cy="90" rx="10" ry="5" fill="#f59e0b" transform="rotate(15 320 90)"/>
        <!-- Elegant white Ao Dai silhouette in graceful stride -->
        <path d="M 400,160 Q 430,220 425,320 Q 420,440 450,560 L 375,560 Q 380,440 375,320 Q 370,220 400,160 Z" fill="url(#silkFlow)"/>
        <path d="M 425,320 Q 460,380 495,490 Q 450,520 405,560 Q 430,440 425,320 Z" fill="#ffffff" opacity="0.95"/>
        <circle cx="400" cy="130" r="22" fill="#d6b8a2"/>
        <!-- Flowing hair in breeze -->
        <path d="M 400,110 C 430,120 445,160 440,220 C 425,200 415,160 400,130 Z" fill="#18181b"/>
        <!-- Soft backlight lens flare ring -->
        <circle cx="280" cy="120" r="70" stroke="#fef08a" stroke-width="1.5" fill="none" opacity="0.4"/>
      `;
      break;

    case 'kiyieu-grad-caps':
      content = `
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="60%" stop-color="#7dd3fc"/>
            <stop offset="100%" stop-color="#e0f2fe"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#skyGrad)"/>
        <!-- Tossed graduation caps in the air -->
        <g fill="#0f172a">
          <!-- Main center cap -->
          <polygon points="380,180 440,150 480,190 420,220" transform="rotate(-15 430 185)"/>
          <path d="M 425,185 Q 450,220 460,260" stroke="#ef4444" stroke-width="2.5" fill="none"/>
          <!-- Surrounding caps -->
          <polygon points="220,120 270,100 300,130 250,150" transform="rotate(20 260 125)"/>
          <path d="M 260,125 Q 280,150 285,180" stroke="#f59e0b" stroke-width="2" fill="none"/>
          <polygon points="580,140 630,120 660,150 610,170" transform="rotate(-25 620 145)"/>
          <polygon points="150,220 190,200 220,230 180,250" transform="rotate(-10 185 225)"/>
          <polygon points="650,240 690,220 720,250 680,270" transform="rotate(15 685 245)"/>
        </g>
        <!-- Student silhouettes raising arms in joy -->
        <path d="M 0,540 Q 200,480 400,530 Q 600,480 800,540 L 800,600 L 0,600 Z" fill="#1e293b"/>
        <g stroke="#1e293b" stroke-width="8" stroke-linecap="round">
          <line x1="260" y1="520" x2="230" y2="420"/>
          <line x1="380" y1="510" x2="400" y2="390"/>
          <line x1="430" y1="510" x2="450" y2="395"/>
          <line x1="560" y1="520" x2="590" y2="415"/>
        </g>
      `;
      break;

    case 'cophuc-nhatbinh':
      content = `
        <defs>
          <linearGradient id="ancientWall" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#451a03"/>
            <stop offset="50%" stop-color="#78350f"/>
            <stop offset="100%" stop-color="#292524"/>
          </linearGradient>
          <linearGradient id="nhatBinhRobes" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#991b1b"/>
            <stop offset="60%" stop-color="#b91c1c"/>
            <stop offset="100%" stop-color="#7f1d1d"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#ancientWall)"/>
        <!-- Ancient temple wooden door frame & stone dragon balustrade hint -->
        <rect x="120" y="40" width="560" height="560" stroke="#fef08a" stroke-width="1.5" stroke-opacity="0.3" fill="none"/>
        <!-- Nhat Binh collar embroidery patterns (5 imperial colors: Blue, Yellow, Red, White, Black) -->
        <path d="M 330,220 L 400,320 L 470,220" stroke="#facc15" stroke-width="12" fill="none"/>
        <path d="M 340,220 L 400,310 L 460,220" stroke="#0284c7" stroke-width="8" fill="none"/>
        <path d="M 350,220 L 400,300 L 450,220" stroke="#22c55e" stroke-width="6" fill="none"/>
        <!-- Robe body -->
        <path d="M 320,240 L 260,560 L 540,560 L 480,240 Z" fill="url(#nhatBinhRobes)"/>
        <!-- Traditional gold phoenix headwear / Khan Dong -->
        <circle cx="400" cy="140" r="32" fill="#d97706"/>
        <path d="M 360,135 Q 400,90 440,135 Z" fill="#b45309"/>
        <circle cx="400" cy="115" r="5" fill="#facc15"/>
      `;
      break;

    case 'aodai-phandinhphung':
      content = `
        <defs>
          <linearGradient id="hanoiAutumn" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fef9c3"/>
            <stop offset="40%" stop-color="#fef08a"/>
            <stop offset="100%" stop-color="#a16207"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#hanoiAutumn)"/>
        <!-- Classic Phan Dinh Phung tree canopy dappled light -->
        <path d="M 0,0 Q 200,160 400,40 Q 600,140 800,0 L 800,180 Q 500,240 0,160 Z" fill="#15803d" opacity="0.35"/>
        <!-- Bicycle silhouette with basket of white lilies (hoa loa kèn) -->
        <g stroke="#1e293b" stroke-width="3" fill="none">
          <circle cx="310" cy="460" r="55"/>
          <circle cx="490" cy="460" r="55"/>
          <line x1="310" y1="460" x2="390" y2="460"/>
          <line x1="390" y1="460" x2="470" y2="400"/>
          <line x1="470" y1="400" x2="490" y2="460"/>
          <line x1="390" y1="460" x2="350" y2="370"/>
          <line x1="310" y1="460" x2="350" y2="370"/>
          <line x1="350" y1="370" x2="450" y2="370"/>
          <line x1="450" y1="370" x2="470" y2="400"/>
        </g>
        <!-- White lily basket on back carrier -->
        <rect x="270" y="380" width="50" height="30" fill="#92400e" rx="4"/>
        <circle cx="285" cy="370" r="12" fill="#ffffff"/>
        <circle cx="305" cy="365" r="14" fill="#ffffff"/>
        <circle cx="295" cy="355" r="10" fill="#ffffff"/>
        <!-- Ao dai fluttering in the wind -->
        <path d="M 370,270 Q 410,340 430,460 L 360,460 Q 350,340 370,270 Z" fill="#ffffff"/>
      `;
      break;

    case 'kiyieu-retro-90s':
      content = `
        <defs>
          <linearGradient id="vintageFilm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#451a03"/>
            <stop offset="40%" stop-color="#78350f"/>
            <stop offset="80%" stop-color="#1c1917"/>
            <stop offset="100%" stop-color="#0c0a09"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#vintageFilm)"/>
        <!-- Classroom chalkboard with chalk handwritten "Kỉ Yếu Niên Khóa" -->
        <rect x="100" y="80" width="600" height="340" fill="#064e3b" stroke="#78350f" stroke-width="8" rx="8"/>
        <line x1="160" y1="160" x2="380" y2="160" stroke="#ffffff" stroke-width="2" stroke-dasharray="6 4" opacity="0.7"/>
        <line x1="160" y1="200" x2="480" y2="200" stroke="#ffffff" stroke-width="1.5" opacity="0.5"/>
        <circle cx="560" cy="220" r="45" stroke="#fde047" stroke-width="2" fill="none" opacity="0.6"/>
        <polygon points="560,180 575,210 605,215 580,235 590,265 560,250 530,265 540,235 515,215 545,210" fill="#fde047" opacity="0.5"/>
        <!-- Film grain and warm leak -->
        <circle cx="700" cy="80" r="180" fill="#ea580c" opacity="0.25" filter="blur(30px)"/>
      `;
      break;

    case 'aodai-hoangthanh':
      content = `
        <defs>
          <linearGradient id="doanMonWall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#78350f"/>
            <stop offset="60%" stop-color="#451a03"/>
            <stop offset="100%" stop-color="#1c1917"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#doanMonWall)"/>
        <!-- Famous Doan Mon arched gates of Imperial Citadel -->
        <path d="M 240,560 L 240,320 Q 400,180 560,320 L 560,560 Z" fill="#0c0a09"/>
        <path d="M 270,560 L 270,340 Q 400,220 530,340 L 530,560 Z" stroke="#ca8a04" stroke-width="2" fill="none" opacity="0.4"/>
        <!-- Graceful Ao Dai stepping through the historical gate into light -->
        <path d="M 400,340 Q 415,410 420,500 L 380,500 Q 385,410 400,340 Z" fill="#ffffff"/>
        <circle cx="400" cy="315" r="14" fill="#fde68a"/>
      `;
      break;

    case 'aodai-lotus':
      content = `
        <defs>
          <linearGradient id="westLake" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#dbeafe"/>
            <stop offset="40%" stop-color="#fbcfe8"/>
            <stop offset="80%" stop-color="#f472b6"/>
            <stop offset="100%" stop-color="#064e3b"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#westLake)"/>
        <!-- Large round lotus leaves -->
        <circle cx="160" cy="520" r="90" fill="#047857" opacity="0.85"/>
        <circle cx="680" cy="500" r="110" fill="#065f46" opacity="0.9"/>
        <circle cx="340" cy="560" r="80" fill="#059669" opacity="0.75"/>
        <!-- Blooming pink lotus flower -->
        <g fill="#ec4899">
          <ellipse cx="260" cy="380" rx="18" ry="32" transform="rotate(-20 260 380)"/>
          <ellipse cx="290" cy="380" rx="18" ry="32" transform="rotate(20 290 380)"/>
          <ellipse cx="275" cy="370" rx="14" ry="36"/>
          <circle cx="275" cy="370" r="10" fill="#facc15"/>
        </g>
        <!-- Pale pink silk Ao Dai holding lotus bundle -->
        <path d="M 500,260 Q 530,350 520,520 L 460,520 Q 470,350 500,260 Z" fill="#ffffff" opacity="0.95"/>
        <circle cx="500" cy="225" r="18" fill="#fbcfe8"/>
      `;
      break;

    case 'kiyieu-friends-sun':
      content = `
        <defs>
          <linearGradient id="warmFriendship" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="50%" stop-color="#fdba74"/>
            <stop offset="100%" stop-color="#fb7185"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#warmFriendship)"/>
        <!-- Group of 3 best friends leaning heads together -->
        <circle cx="320" cy="260" r="32" fill="#78350f"/>
        <circle cx="400" cy="245" r="34" fill="#451a03"/>
        <circle cx="480" cy="260" r="32" fill="#78350f"/>
        <!-- Three white Ao Dai silhouettes connected in laughter -->
        <path d="M 280,330 Q 320,380 320,550 L 480,550 Q 480,380 520,330 Z" fill="#ffffff" opacity="0.95"/>
        <!-- Sunburst halo of youth -->
        <circle cx="400" cy="180" r="90" stroke="#ffffff" stroke-width="2" stroke-opacity="0.4" fill="none"/>
      `;
      break;

    case 'aodai-tet-red':
      content = `
        <defs>
          <linearGradient id="tetVibe" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#991b1b"/>
            <stop offset="50%" stop-color="#b91c1c"/>
            <stop offset="100%" stop-color="#450a0a"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#tetVibe)"/>
        <!-- Peach blossom branch (hoa đào) with delicate pink petals -->
        <path d="M 0,80 Q 250,140 500,60 Q 650,120 800,40" stroke="#78350f" stroke-width="4" fill="none"/>
        <circle cx="220" cy="110" r="10" fill="#f43f5e"/>
        <circle cx="280" cy="130" r="8" fill="#fb7185"/>
        <circle cx="420" cy="70" r="11" fill="#f43f5e"/>
        <circle cx="560" cy="90" r="9" fill="#fda4af"/>
        <!-- Red silk Ao Dai with gold embroidery -->
        <path d="M 400,240 Q 440,360 435,560 L 365,560 Q 360,360 400,240 Z" fill="#dc2626"/>
        <circle cx="400" cy="190" r="24" fill="#fed7aa"/>
      `;
      break;

    case 'aodai-nonla':
      content = `
        <defs>
          <linearGradient id="conicalHatLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef3c7"/>
            <stop offset="70%" stop-color="#d97706"/>
            <stop offset="100%" stop-color="#78350f"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="#1c1917"/>
        <!-- Large conical hat (Nón Lá) tilt silhouette casting soft shadow -->
        <polygon points="400,140 180,320 620,320" fill="url(#conicalHatLight)"/>
        <!-- Shadow over gentle face profile -->
        <path d="M 330,320 Q 400,420 470,320 Z" fill="#292524" opacity="0.8"/>
        <circle cx="400" cy="380" r="12" fill="#fbcfe8" opacity="0.6"/>
        <path d="M 370,440 Q 400,560 430,440" fill="#ffffff"/>
      `;
      break;

    case 'kiyieu-picnic':
      content = `
        <defs>
          <linearGradient id="meadowSun" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#bae6fd"/>
            <stop offset="40%" stop-color="#fef08a"/>
            <stop offset="80%" stop-color="#86efac"/>
            <stop offset="100%" stop-color="#15803d"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#meadowSun)"/>
        <!-- Red check picnic mat on grass -->
        <polygon points="240,420 560,420 620,540 180,540" fill="#ef4444" opacity="0.85"/>
        <circle cx="360" cy="460" r="18" fill="#facc15"/>
        <rect x="440" y="440" width="30" height="20" fill="#78350f" rx="3"/>
      `;
      break;

    case 'cophuc-couple':
      content = `
        <defs>
          <linearGradient id="bridgeStone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b"/>
            <stop offset="50%" stop-color="#312e81"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bridgeStone)"/>
        <!-- Couple in royal blue and burgundy Ngu Than heritage robes -->
        <path d="M 340,240 Q 360,340 370,540 L 290,540 Q 300,340 340,240 Z" fill="#1d4ed8"/>
        <path d="M 460,240 Q 480,340 490,540 L 410,540 Q 420,340 460,240 Z" fill="#991b1b"/>
        <circle cx="340" cy="200" r="20" fill="#fef08a"/>
        <circle cx="460" cy="200" r="18" fill="#fed7aa"/>
      `;
      break;
  }

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      ${content}
      <text x="30" y="570" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="500" fill="#ffffff" letter-spacing="1" opacity="0.85">YÊN VISUALS · ${title.toUpperCase()}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

export const INITIAL_PHOTOS: PhotoItem[] = [
  {
    id: 'photo-1',
    title: 'The Pure White Graduation Memory',
    vietnameseTitle: 'Tà Áo Trắng & Nắng Sớm Chu Văn An',
    category: 'aodai-trang',
    year: '2026',
    location: 'Trường THPT Chu Văn An, Tây Hồ, Hà Nội',
    camera: 'Sony A7 Mark III',
    lens: 'Sony FE 85mm f/1.8',
    focalLength: '85mm',
    aperture: 'f/1.8',
    shutterSpeed: '1/1250s',
    iso: 100,
    description: 'Nụ cười trong trẻo của nữ sinh trong tà áo dài lụa trắng truyền thống dưới tán lá bàng cổ thụ.',
    story: 'Một buổi sáng tháng Năm đầy nắng vàng rực rỡ bên bờ hồ Tây. Khoảnh khắc tà áo lụa trắng bay nhẹ trong cơn gió sớm, cảm biến Sony A7 Mark III bắt trọn vẻ đẹp e ấp, thuần khiết nhất của tuổi 18.',
    image: createAoDaiArtSvg('aodai-white-school', 'Tà Áo Trắng Chu Văn An'),
    aspectRatio: '3:4',
    orientation: 'portrait',
    featured: true,
    seriesId: 'series-nien-thieu',
    tags: ['áo dài trắng', 'kỉ yếu', 'học sinh', 'chu văn an', 'thanh xuân', 'sony a7 mark 3'],
    edition: 'Ảnh kỉ yếu lưu niệm niên khóa',
    conceptNote: 'Concept Áo Dài Trắng Học Đường truyền thống',
  },
  {
    id: 'photo-2',
    title: 'Graduation Cap Toss: Skyward Dreams',
    vietnameseTitle: 'Tung Bay Mũ Cử Nhân — Khát Vọng Tuổi Trẻ',
    category: 'kiyieu-nhom',
    year: '2026',
    location: 'Đại Học Quốc Gia Hà Nội, Cầu Giấy',
    camera: 'Sony A7 Mark III',
    lens: 'Sony FE 28-70mm f/3.5-5.6 OSS',
    focalLength: '28mm',
    aperture: 'f/4.5',
    shutterSpeed: '1/2000s',
    iso: 200,
    description: 'Khoảnh khắc cả nhóm cùng tung mũ cử nhân lên nền trời xanh thẳm khép lại những năm tháng thanh xuân.',
    story: 'Không có gì đẹp hơn tiếng reo hò hạnh phúc của các bạn sinh viên khi cùng ném chiếc mũ tốt nghiệp lên trời cao. Tốc độ chụp liên tiếp 10fps của Sony A7 III đã đóng băng trọn vẹn từng chiếc mũ rơi.',
    image: createAoDaiArtSvg('kiyieu-grad-caps', 'Tung Bay Mũ Cử Nhân'),
    aspectRatio: '16:9',
    orientation: 'landscape',
    featured: true,
    seriesId: 'series-nien-thieu',
    tags: ['kỉ yếu', 'cử nhân', 'tốt nghiệp', 'nhóm bạn', 'đại học', 'sony a7 mark 3'],
    edition: 'Ảnh tập thể kỉ yếu nhóm',
    conceptNote: 'Concept Áo Cử Nhân & Bằng Tốt Nghiệp',
  },
  {
    id: 'photo-3',
    title: 'Imperial Elegance: Nhat Binh Heritage',
    vietnameseTitle: 'Nét Cổ Kính Nhật Bình Cung Đình',
    category: 'cophuc',
    year: '2026',
    location: 'Hoàng Thành Thăng Long, Ba Đình, Hà Nội',
    camera: 'Sony A7 Mark III',
    lens: 'Sony FE 50mm f/1.8',
    focalLength: '50mm',
    aperture: 'f/1.8',
    shutterSpeed: '1/800s',
    iso: 100,
    description: 'Cổ phục áo Nhật Bình thêu hoa văn ngũ hành triều Nguyễn tôn vinh vẻ đẹp đài các, đoan trang.',
    story: 'Hoàng Thành Thăng Long với tường gạch cổ rêu phong và ánh nắng chiều xiên. Khẩu độ f/1.8 trên ống kính 50mm tạo độ chuyển mềm mại, tôn lên từng đường chỉ thêu của cổ phục Việt.',
    image: createAoDaiArtSvg('cophuc-nhatbinh', 'Cổ Phục Nhật Bình Hoàng Thành'),
    aspectRatio: '4:3',
    orientation: 'landscape',
    featured: true,
    seriesId: 'series-co-phuc',
    tags: ['cổ phục', 'nhật bình', 'hoàng thành', 'di sản', 'áo dài', 'sony a7 mark 3'],
    edition: 'Bộ ảnh di sản văn hóa',
    conceptNote: 'Concept Cổ Phục Triều Nguyễn Di Tích',
  },
  {
    id: 'photo-4',
    title: 'Autumn Melancholy on Phan Dinh Phung',
    vietnameseTitle: 'Mùa Thu Hà Nội & Giỏ Hoa Loa Kèn',
    category: 'aodai-pho',
    year: '2025',
    location: 'Đường Phan Đình Phùng, Ba Đình, Hà Nội',
    camera: 'Sony A7 Mark III',
    lens: 'Sony FE 85mm f/1.8',
    focalLength: '85mm',
    aperture: 'f/1.8',
    shutterSpeed: '1/1000s',
    iso: 100,
    description: 'Tà áo dài trắng đạp chiếc xe mini cổ chở giỏ hoa loa kèn dưới tán cây sấu rợp bóng mùa thu.',
    story: 'Hà Nội đẹp nhất khi thu về trên phố Phan Đình Phùng. Chiếc xe đạp chở đầy hoa trắng, tà áo bay nhẹ như đưa người xem quay về với ký ức một thời phố cổ mộc mạc.',
    image: createAoDaiArtSvg('aodai-phandinhphung', 'Mùa Thu Phan Đình Phùng'),
    aspectRatio: '4:3',
    orientation: 'landscape',
    featured: true,
    seriesId: 'series-ha-noi-thu',
    tags: ['áo dài', 'mùa thu', 'phan đình phùng', 'xe đạp', 'hà nội', 'sony a7 mark 3'],
    edition: 'Ảnh nghệ thuật mùa thu',
    conceptNote: 'Concept Áo Dài Dạo Phố Thu Hà Nội',
  },
  {
    id: 'photo-5',
    title: 'Lotus Fragrance on West Lake',
    vietnameseTitle: 'Hương Sen Bách Diệp Tây Hồ',
    category: 'nang-tho',
    year: '2025',
    location: 'Đầm Sen Bách Diệp, Quảng An, Tây Hồ',
    camera: 'Sony A7 Mark III',
    lens: 'Sony FE 85mm f/1.8',
    focalLength: '85mm',
    aperture: 'f/2.0',
    shutterSpeed: '1/800s',
    iso: 100,
    description: 'Chân dung nàng thơ áo dài lụa tơ tằm e ấp ôm bó hoa sen hồng đầu mùa thanh khiết.',
    story: 'Chụp vào lúc 5:30 sáng khi những giọt sương mai còn đọng trên búp sen. Ánh sáng dịu dàng của mặt trời vừa ló dạng hòa quyện cùng khả năng bắt nét mắt Real-time Eye AF của Sony A7 III.',
    image: createAoDaiArtSvg('aodai-lotus', 'Hương Sen Bách Diệp'),
    aspectRatio: '3:4',
    orientation: 'portrait',
    featured: true,
    seriesId: 'series-sen-tay-ho',
    tags: ['áo dài', 'hoa sen', 'tây hồ', 'nàng thơ', 'lụa', 'sony a7 mark 3'],
    edition: 'Ảnh nghệ thuật mùa sen',
    conceptNote: 'Concept Nàng Thơ Áo Dài Đầm Sen',
  },
  {
    id: 'photo-6',
    title: 'Retro Class Yearbook 1990s',
    vietnameseTitle: 'Kỉ Yếu Retro Bảng Đen 1990s',
    category: 'kiyieu-nhom',
    year: '2026',
    location: 'Trường THPT Trần Phú, Hoàn Kiếm, Hà Nội',
    camera: 'Sony A7 Mark III',
    lens: 'Sony FE 50mm f/1.8',
    focalLength: '50mm',
    aperture: 'f/2.0',
    shutterSpeed: '1/400s',
    iso: 400,
    description: 'Concept kỉ yếu hoài niệm với bảng đen phấn trắng, đồng phục sơ mi trắng và màu film hoài cổ.',
    story: 'Một phong cách kỉ yếu rất được các bạn học sinh yêu thích: không gượng gạo, tự nhiên như chính những giờ ra chơi thường ngày với bạn bè.',
    image: createAoDaiArtSvg('kiyieu-retro-90s', 'Kỉ Yếu Retro 1990s'),
    aspectRatio: '16:9',
    orientation: 'landscape',
    featured: false,
    seriesId: 'series-nien-thieu',
    tags: ['kỉ yếu', 'retro', 'vintage', 'lớp học', 'bảng đen', 'sony a7 mark 3'],
    edition: 'Bộ ảnh concept kỷ yếu nhóm',
    conceptNote: 'Concept Vintage Film 90s Thanh Xuân',
  },
  {
    id: 'photo-7',
    title: 'Doan Mon Imperial Gateway',
    vietnameseTitle: 'Dạo Bước Cổng Đoan Môn',
    category: 'cophuc',
    year: '2025',
    location: 'Hoàng Thành Thăng Long, Hà Nội',
    camera: 'Sony A7 Mark III',
    lens: 'Sony FE 28-70mm f/3.5-5.6 OSS',
    focalLength: '35mm',
    aperture: 'f/4.0',
    shutterSpeed: '1/800s',
    iso: 100,
    description: 'Tà áo dài bước qua vòm cửa cuốn đá nghìn năm tuổi, tương phản giữa con người và lịch sử.',
    story: 'Cấu trúc cổng vòm đá Đoan Môn tạo nên khung hình hình học tự nhiên bao bọc tà áo truyền thống đầy uy nghiêm và thanh thoát.',
    image: createAoDaiArtSvg('aodai-hoangthanh', 'Cổng Đoan Môn Hoàng Thành'),
    aspectRatio: '4:3',
    orientation: 'landscape',
    featured: false,
    seriesId: 'series-co-phuc',
    tags: ['cổ phục', 'hoàng thành', 'đoan môn', 'áo dài', 'lịch sử', 'sony a7 mark 3'],
    edition: 'Bộ ảnh di tích lịch sử',
    conceptNote: 'Concept Kiến Trúc & Cổ Phục',
  },
  {
    id: 'photo-8',
    title: 'Trio of Laughter on Veranda',
    vietnameseTitle: 'Nụ Cười Thanh Xuân Bên Hành Lang Lớp',
    category: 'kiyieu-nhom',
    year: '2026',
    location: 'Trường THPT Phan Đình Phùng, Hà Nội',
    camera: 'Sony A7 Mark III',
    lens: 'Sony FE 85mm f/1.8',
    focalLength: '85mm',
    aperture: 'f/1.8',
    shutterSpeed: '1/1200s',
    iso: 100,
    description: 'Bộ ba bạn thân tựa đầu vào nhau cười rạng rỡ bên lan can hành lang vàng cổ kính.',
    story: 'Những tình bạn đẹp đẽ nhất đời người được viết nên dưới mái trường này. Nụ cười tự nhiên, không cần tạo dáng gượng ép, là thứ quý giá nhất.',
    image: createAoDaiArtSvg('kiyieu-friends-sun', 'Nụ Cười Thanh Xuân'),
    aspectRatio: '16:9',
    orientation: 'landscape',
    featured: false,
    seriesId: 'series-nien-thieu',
    tags: ['kỉ yếu', 'bạn thân', 'áo dài trắng', 'hành lang', 'nụ cười', 'sony a7 mark 3'],
    edition: 'Ảnh nhóm kỉ yếu bạn thân',
    conceptNote: 'Concept Tình Bạn Thanh Xuân Học Đường',
  },
  {
    id: 'photo-9',
    title: 'Spring Crimson Ao Dai on Old Quarter',
    vietnameseTitle: 'Sắc Đỏ Áo Dài Tết Phố Cổ',
    category: 'aodai-pho',
    year: '2026',
    location: 'Phố Hàng Mã & Ô Quan Chưởng, Hà Nội',
    camera: 'Sony A7 Mark III',
    lens: 'Sony FE 50mm f/1.8',
    focalLength: '50mm',
    aperture: 'f/1.8',
    shutterSpeed: '1/500s',
    iso: 160,
    description: 'Áo dài lụa tơ tằm đỏ thắm đón xuân rộn ràng bên cành đào tươi thắm và đèn lồng truyền thống.',
    story: 'Những ngày giáp Tết Nguyên Đán, phố cổ Hà Nội bừng lên sắc đỏ may mắn. Nụ cười rạng rỡ của người thiếu nữ mang theo lời chúc một năm mới an khang.',
    image: createAoDaiArtSvg('aodai-tet-red', 'Sắc Đỏ Áo Dài Tết'),
    aspectRatio: '3:4',
    orientation: 'portrait',
    featured: false,
    seriesId: 'series-ha-noi-thu',
    tags: ['áo dài tết', 'phố cổ', 'màu đỏ', 'mùa xuân', 'hà nội', 'sony a7 mark 3'],
    edition: 'Bộ ảnh áo dài mùa xuân',
    conceptNote: 'Concept Áo Dài Đón Tết Truyền Thống',
  },
  {
    id: 'photo-10',
    title: 'Conical Hat & Timeless Grace',
    vietnameseTitle: 'Vành Nón Bài Thơ & Nét E Ấp',
    category: 'nang-tho',
    year: '2025',
    location: 'Làng Nón Chuông, Thanh Oai, Hà Nội',
    camera: 'Sony A7 Mark III',
    lens: 'Sony FE 85mm f/1.8',
    focalLength: '85mm',
    aperture: 'f/1.8',
    shutterSpeed: '1/1000s',
    iso: 100,
    description: 'Chân dung cận cảnh nghiêng vành nón lá, ánh sáng lọc qua nan nón vẽ nên những đường nét thanh tú.',
    story: 'Chiếc nón lá truyền thống không chỉ che nắng mà còn là đạo cụ tuyệt vời để tạo nên những khoảng sáng tối mềm mại trên gương mặt người thiếu nữ.',
    image: createAoDaiArtSvg('aodai-nonla', 'Nón Lá E Ấp'),
    aspectRatio: '1:1',
    orientation: 'square',
    featured: false,
    seriesId: 'series-sen-tay-ho',
    tags: ['nón lá', 'nàng thơ', 'e ấp', 'chân dung', 'áo dài', 'sony a7 mark 3'],
    edition: 'Ảnh chân dung nghệ thuật',
    conceptNote: 'Concept Nón Lá & Tà Áo Dài Duyên Dáng',
  },
  {
    id: 'photo-11',
    title: 'Sunlit Picnic Graduation Afternoon',
    vietnameseTitle: 'Kỉ Yếu Dã Ngoại Bãi Đá Sông Hồng',
    category: 'kiyieu-nhom',
    year: '2026',
    location: 'Bãi Đá Sông Hồng, Nhật Tân, Hà Nội',
    camera: 'Sony A7 Mark III',
    lens: 'Sony FE 28-70mm f/3.5-5.6 OSS',
    focalLength: '45mm',
    aperture: 'f/4.5',
    shutterSpeed: '1/1200s',
    iso: 100,
    description: 'Hoàng hôn bãi cỏ lau với thảm dã ngoại, đàn guitar và những tiếng cười vô tư của tuổi trẻ.',
    story: 'Buổi chiều sau khi chụp xong ở trường, nhóm bạn cùng ra bãi cỏ ven sông ngắm hoàng hôn buông xuống. Đó là những thước phim thanh xuân đáng nhớ nhất.',
    image: createAoDaiArtSvg('kiyieu-picnic', 'Kỉ Yếu Dã Ngoại'),
    aspectRatio: '16:9',
    orientation: 'landscape',
    featured: false,
    seriesId: 'series-nien-thieu',
    tags: ['kỉ yếu', 'dã ngoại', 'hoàng hôn', 'sông hồng', 'guitar', 'sony a7 mark 3'],
    edition: 'Bộ ảnh dã ngoại kỉ yếu',
    conceptNote: 'Concept Picnic Hoàng Hôn Thanh Xuân',
  },
  {
    id: 'photo-12',
    title: 'Heritage Ngu Than Couple',
    vietnameseTitle: 'Đôi Lứa Cổ Phục Áo Ngũ Thân',
    category: 'cophuc',
    year: '2026',
    location: 'Văn Miếu - Quốc Tử Giám, Hà Nội',
    camera: 'Sony A7 Mark III',
    lens: 'Sony FE 85mm f/1.8',
    focalLength: '85mm',
    aperture: 'f/1.8',
    shutterSpeed: '1/640s',
    iso: 100,
    description: 'Cặp đôi trong trang phục Cổ Phục ngũ thân tay chẽn thanh tao bên cầu đá hồ Giám.',
    story: 'Giới trẻ ngày nay ngày càng trân trọng trang phục truyền thống của cha ông. Cổ phục không hề già cỗi mà mang vẻ đẹp sang trọng, chuẩn mực.',
    image: createAoDaiArtSvg('cophuc-couple', 'Cổ Phục Đôi Văn Miếu'),
    aspectRatio: '4:3',
    orientation: 'landscape',
    featured: false,
    seriesId: 'series-co-phuc',
    tags: ['cổ phục', 'cặp đôi', 'văn miếu', 'ngũ thân', 'truyền thống', 'sony a7 mark 3'],
    edition: 'Bộ ảnh đôi cổ phục di sản',
    conceptNote: 'Concept Cặp Đôi Cổ Phục Di Sản',
  },
];

export interface PhotoSeries {
  id: string;
  title: string;
  vietnameseTitle: string;
  year: string;
  coverImage: string;
  photoCount: number;
  description: string;
  curatorNote: string;
  location: string;
}

export const PHOTO_SERIES: PhotoSeries[] = [
  {
    id: 'series-nien-thieu',
    title: 'Gửi Thời Niên Thiếu: Kỉ Yếu Sân Trường & Áo Cử Nhân',
    vietnameseTitle: 'Gửi Thời Niên Thiếu: Kỉ Yếu & Áo Cử Nhân',
    year: '2025 - 2026',
    coverImage: createAoDaiArtSvg('kiyieu-grad-caps', 'Series Gửi Thời Niên Thiếu'),
    photoCount: 4,
    description: 'Trọn vẹn cảm xúc mùa bế giảng: từ tà áo dài trắng thướt tha sân trường, ném mũ cử nhân rạng rỡ, đến những giờ ra chơi hoài niệm.',
    curatorNote: 'Thực hiện cùng các thế hệ học sinh sinh viên THPT Chu Văn An, Phan Đình Phùng, ĐHQG Hà Nội.',
    location: 'Hà Nội & Các Giảng Đường',
  },
  {
    id: 'series-ha-noi-thu',
    title: 'Hương Sắc Hà Thành: Áo Dài Trắng Mùa Thu',
    vietnameseTitle: 'Hương Sắc Hà Thành: Áo Dài Mùa Thu Phố Cổ',
    year: '2025 - 2026',
    coverImage: createAoDaiArtSvg('aodai-phandinhphung', 'Series Áo Dài Thu Hà Nội'),
    photoCount: 3,
    description: 'Dạo bước trên những con đường ngập lá vàng rơi Phan Đình Phùng, Hoàng Diệu, Bờ Hồ cùng tà áo dài lụa bay mềm mại.',
    curatorNote: 'Bộ ảnh tôn vinh nét duyên dáng, e ấp đặc trưng của người con gái Tràng An.',
    location: 'Phan Đình Phùng & Phố Cổ',
  },
  {
    id: 'series-co-phuc',
    title: 'Dấu Xưa Ngàn Năm: Cổ Phục Việt Hoàng Thành & Văn Miếu',
    vietnameseTitle: 'Dấu Xưa Ngàn Năm: Cổ Phục Hoàng Thành & Văn Miếu',
    year: '2026',
    coverImage: createAoDaiArtSvg('cophuc-nhatbinh', 'Series Cổ Phục Việt'),
    photoCount: 3,
    description: 'Hành trình tìm về cội nguồn di sản qua trang phục áo Nhật Bình, áo ngũ thân tay chẽn tại các di tích lịch sử ngàn năm tuổi.',
    curatorNote: 'Phục dựng màu film hoài cổ, tôn vinh kỹ thuật may thêu truyền thống cung đình.',
    location: 'Hoàng Thành Thăng Long & Văn Miếu',
  },
  {
    id: 'series-sen-tay-ho',
    title: 'Mùa Sen Tinh Khôi: Áo Dài Lụa & Đầm Sen Bách Diệp',
    vietnameseTitle: 'Mùa Sen Tinh Khôi: Nàng Thơ & Đầm Sen Tây Hồ',
    year: '2025',
    coverImage: createAoDaiArtSvg('aodai-lotus', 'Series Mùa Sen Tây Hồ'),
    photoCount: 2,
    description: 'Ánh nắng bình minh sớm mai trên mặt nước hồ Tây, hương sen ngát dịu và nụ cười dịu dàng của người thiếu nữ.',
    curatorNote: 'Concept nàng thơ chụp trong ánh sáng sương mai tự nhiên êm ái.',
    location: 'Đầm Sen Quảng An, Tây Hồ',
  },
];

export interface GearItem {
  name: string;
  category: 'Body' | 'Lens' | 'Light' | 'Flycam';
  spec: string;
  role: string;
}

export const GEAR_BAG: GearItem[] = [
  {
    name: 'Sony Alpha 7 Mark III (ILCE-7M3)',
    category: 'Body',
    spec: 'Body Full-frame cao cấp · Cảm biến 24.2MP BSI-CMOS · Real-time Eye AF',
    role: 'Máy ảnh chuẩn mực cho kỉ yếu & áo dài: bắt nét tức thì vào ánh mắt, dải tương phản 15 stops giữ trọn chi tiết tà áo trắng dưới nắng',
  },
  {
    name: 'Sony FE 85mm f/1.8',
    category: 'Lens',
    spec: 'Khẩu độ lớn f/1.8 · Xóa phông mượt mà · Tôn dáng thanh thoát',
    role: 'Ống kính chân dung chủ lực: tôn dáng áo dài thướt tha, tách bạch chủ thể khỏi hậu cảnh với bokeh tròn trịa, lung linh',
  },
  {
    name: 'Sony FE 50mm f/1.8',
    category: 'Lens',
    spec: 'Tiêu cự chuẩn mắt nhìn 50mm · Nhẹ nhàng, cơ động',
    role: 'Chụp chân dung bán thân, nụ cười gần gũi trong lớp học và khoảnh khắc dạo bước phố cổ',
  },
  {
    name: 'Sony FE 28-70mm f/3.5-5.6 OSS',
    category: 'Lens',
    spec: 'Chống rung quang học OSS · Dải tiêu cự đa dụng 28-70mm',
    role: 'Bắt trọn khung cảnh nhóm bạn thân, không gian sân trường bế giảng và bãi cỏ dã ngoại',
  },
  {
    name: 'Tấm Hắt Sáng 5-in-1 (110cm) & Ánh Sáng Tự Nhiên',
    category: 'Light',
    spec: 'Mặt bạc / vàng ấm / khuếch tán mềm · Không đèn cồng kềnh',
    role: 'Hắt sáng vào ánh mắt (catchlight) và bắt sáng ven tóc rực rỡ dưới nắng chiều thu Hà Nội',
  },
];

export interface LocationTip {
  name: string;
  address: string;
  bestTime: string;
  idealConcept: string;
  tips: string;
}

export const ICONIC_LOCATIONS: LocationTip[] = [
  {
    name: 'Đường Phan Đình Phùng & Hoàng Diệu',
    address: 'Quận Ba Đình, Hà Nội',
    bestTime: '06:30 – 09:00 hoặc 15:30 – 17:00 (Mùa thu)',
    idealConcept: 'Áo dài trắng nữ sinh, xe đạp chở hoa, nón lá',
    tips: 'Nên chuẩn bị thêm 1 bó hoa sen hoặc hoa loa kèn, ánh nắng xiên qua hàng cây sấu sẽ tạo hiệu ứng ven tóc rất đẹp.',
  },
  {
    name: 'Hoàng Thành Thăng Long & Cổng Đoan Môn',
    address: '19C Hoàng Diệu, Ba Đình, Hà Nội',
    bestTime: '08:00 – 11:00 hoặc 14:00 – 16:30',
    idealConcept: 'Cổ phục Nhật Bình, Áo ngũ thân, Kỉ yếu cử nhân',
    tips: 'Khuôn viên rất rộng với bãi cỏ và tường gạch cổ, rất thích hợp chụp xếp chữ kỷ yếu cả lớp và ảnh nhóm lớn.',
  },
  {
    name: 'Văn Miếu - Quốc Tử Giám',
    address: '58 Quốc Tử Giám, Đống Đa, Hà Nội',
    bestTime: '08:30 – 10:30 (Tránh giờ cao điểm du khách)',
    idealConcept: 'Áo cử nhân tốt nghiệp, Áo dài truyền thống, Cổ phục',
    tips: 'Địa điểm biểu tượng cho học vấn và thi cử. Lưu ý trang phục cần trang trọng, lịch sự và giữ gìn trật tự.',
  },
  {
    name: 'Đầm Sen Bách Diệp Hồ Tây',
    address: 'Ngõ 431 Âu Cơ hoặc đầm Quảng An, Tây Hồ',
    bestTime: '05:30 – 08:00 sáng mùa hè (Tháng 5 – 7)',
    idealConcept: 'Nàng thơ áo dài lụa tơ tằm, áo yếm, hoa sen',
    tips: 'Đi sớm để đón bình minh và những búp sen còn đọng sương mai, tránh nắng gắt trưa.',
  },
];
