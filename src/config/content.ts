/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Noi dung giao dien khach hang ma Yen sua duoc trong Dashboard
// (tab Cai dat > "Noi dung giao dien"), KHONG can sua code.
// Luu o Firestore doc `settings/content` { content, updatedAt, updatedBy },
// cache localStorage `yen_photo_site_content` (xem services/firebase.ts).
// CHI ADMIN duoc ghi (firestore.rules + kiem tra client-side truoc khi goi
// saveSiteContent); khach chi doc. Render dang text thuan — khong cho HTML
// de tranh chen ma (sanitizePlainText loai bo the <...>).

import type { BookingInquiry } from '../utils/portfolioLogic';

export type PackageId = BookingInquiry['packageType'];

export interface SiteContent {
  /** Hero: dong tieu de chinh. */
  heroTitle: string;
  /** Hero: dong mo ta ngan duoi tieu de. */
  heroSubtitle: string;
  /** Hero: nhan nut chinh (xem album). */
  heroPrimaryCta: string;
  /** Hero: nhan nut phu (bang gia & dat lich). */
  heroSecondaryCta: string;
  /** Marquee: dong chu chay cuoi Hero; cac muc cach nhau bang '·'. */
  marqueeText: string;
  /** Ve toi: ten hien thi. */
  aboutName: string;
  /** Ve toi: vai tro / dong mo ta ngan sau ten. */
  aboutRole: string;
  /** Ve toi: doan gioi thieu ngan (doan 1). */
  aboutBioShort: string;
  /** Ve toi: doan gioi thieu dai (doan 2 + 3, cach nhau bang dong trong). */
  aboutBioLong: string;
  /** Bang gia: mo ta ngan cho tung goi (ten goi + gia lay tu settings/pricing). */
  packageDescriptions: Record<PackageId, string>;
  /** Lien he: khu vuc hoat dong. */
  contactAreas: string;
  /** Lien he: gio lam viec. */
  contactHours: string;
  /** Lien he: ghi chu ngan (phan hoi tin nhan...). */
  contactNote: string;
  /** Footer: dong tagline / ban quyen. */
  footerTagline: string;
}

/** Gioi han ky tu moi truong (xem PAGES-NOTES-V6.md). */
export const CONTENT_FIELD_LIMITS: Record<string, number> = {
  heroTitle: 200,
  heroSubtitle: 500,
  heroPrimaryCta: 100,
  heroSecondaryCta: 100,
  marqueeText: 500,
  aboutName: 100,
  aboutRole: 200,
  aboutBioShort: 500,
  aboutBioLong: 500,
  packageDescription: 200,
  contactAreas: 500,
  contactHours: 200,
  contactNote: 500,
  footerTagline: 200,
} as const;

export const CONTENT_FIELD_LABELS: Record<string, string> = {
  heroTitle: 'Tiêu đề chính Hero',
  heroSubtitle: 'Mô tả ngắn Hero',
  heroPrimaryCta: 'Nút chính Hero',
  heroSecondaryCta: 'Nút phụ Hero',
  marqueeText: 'Dòng chữ chạy (marquee)',
  aboutName: 'Tên hiển thị (Về tôi)',
  aboutRole: 'Vai trò / dòng sau tên',
  aboutBioShort: 'Giới thiệu ngắn',
  aboutBioLong: 'Giới thiệu dài',
  packageDescription: 'Mô tả gói',
  contactAreas: 'Khu vực hoạt động',
  contactHours: 'Giờ làm việc',
  contactNote: 'Ghi chú liên hệ',
  footerTagline: 'Tagline footer',
} as const;

/** Gia tri mac dinh = dung cac chu hardcode cua ban v5.1 (khong doi hien thi). */
export const DEFAULT_SITE_CONTENT: SiteContent = {
  heroTitle: 'Lưu giữ thanh xuân trong trẻo & nét duyên tà áo dài Việt.',
  heroSubtitle:
    'Đồng hành cùng máy ảnh Full-frame Sony A7 Mark III trứ danh và sự tận tâm, mình kiên nhẫn hướng dẫn bạn từng góc nghiêng, nụ cười và dáng áo để bắt trọn những khoảnh khắc thanh xuân tự nhiên, rạng rỡ và giàu cảm xúc nhất.',
  heroPrimaryCta: 'Xem Album Tác Phẩm',
  heroSecondaryCta: 'Bảng Giá & Đặt Lịch',
  marqueeText:
    'KỈ YẾU HỌC SINH & SINH VIÊN · ÁO DÀI TRẮNG THANH XUÂN · ÁO CỬ NHÂN TỐT NGHIỆP · CỔ PHỤC NHẬT BÌNH & NGŨ THÂN · MÙA THU PHAN ĐÌNH PHÙNG · HOÀNG THÀNH THĂNG LONG · SÂN TRƯỜNG CHU VĂN AN · VĂN MIẾU QUỐC TỬ GIÁM · NẮNG SỚM BỜ HỒ & HƯƠNG SEN TÂY HỒ',
  aboutName: 'Yên Nguyễn',
  aboutRole: 'Lưu Giữ Thanh Xuân & Nét Duyên Áo Dài',
  aboutBioShort:
    'Xin chào, mình là Anh Yên. Mình là một nhiếp ảnh gia tự do tại Hà Nội, dành trọn niềm đam mê và sự tâm huyết cho những tà áo dài trắng học sinh cùng từng khoảnh khắc kỉ yếu thanh xuân.',
  aboutBioLong:
    'Đồng hành cùng máy ảnh Full-frame Sony A7 Mark III trứ danh với khả năng lấy nét ánh mắt tức thì (Real-time Eye AF) và chất màu trong trẻo, chân thật — mình luôn chú trọng vào cảm xúc tự nhiên của bạn thay vì những dáng đứng cứng nhắc.\n\nVới mình, mỗi buổi chụp kỉ yếu hay áo dài không phải là một \'ca làm việc công nghiệp\' gượng ép, mà là một trải nghiệm đồng hành thoải mái, kiên nhẫn và chu đáo nhất để bạn luôn cảm thấy tự tin và có được bộ ảnh ưng ý.',
  packageDescriptions: {
    'aodai-solo': '1.5 - 2h chụp, hướng dẫn tạo dáng, 15 ảnh chỉnh da',
    'kiyieu-lop': 'Chụp kĩ từng bạn, trả 100% file gốc, 30 ảnh chỉnh màu',
    'cophuc-heritage': 'Chụp di tích Hoàng Thành, Văn Miếu, tặng mượn nón lá',
    'photobook-print': 'In 20 ảnh lụa mini + 1 khung ảnh để bàn 15x21cm',
  },
  contactAreas: 'Khu vực Tây Hồ, Ba Đình, Hoàn Kiếm, Cầu Giấy và các trường THPT / Đại Học tại Hà Nội',
  contactHours: '8:00 – 20:00 hằng ngày',
  contactNote: 'Phản hồi tin nhắn nhanh chóng, tư vấn concept miễn phí',
  footerTagline: '© 2026 Yên Photo. Mọi quyền được bảo lưu. Kỉ yếu & Áo dài Hà Nội.',
};

/**
 * Loai bo the HTML / script khoi chu nhap vao, chi giu text thuan.
 * - Cat bo moi <...> (ke ca <script>, <img onerror=...>).
 * - Giu lai dau xuong dong (dung tach doan o aboutBioLong).
 * - Cat khoang trang thua o dau/cuoi moi dong.
 */
export function sanitizePlainText(raw: unknown, maxLength: number): string {
  if (typeof raw !== 'string') return '';
  const noTags = raw.replace(/<[^>]*>/g, '');
  const cleaned = noTags
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength).trimEnd() : cleaned;
}

/** Ten cac truong chu don (khong tinh packageDescriptions). */
const TEXT_FIELDS: (keyof Omit<SiteContent, 'packageDescriptions'>)[] = [
  'heroTitle',
  'heroSubtitle',
  'heroPrimaryCta',
  'heroSecondaryCta',
  'marqueeText',
  'aboutName',
  'aboutRole',
  'aboutBioShort',
  'aboutBioLong',
  'contactAreas',
  'contactHours',
  'contactNote',
  'footerTagline',
];

const PACKAGE_IDS: PackageId[] = ['aodai-solo', 'kiyieu-lop', 'cophuc-heritage', 'photobook-print'];

/**
 * Gop noi dung nhap vao (co the thieu truong / chua the HTML / qua dai)
 * voi gia tri mac dinh -> luon tra ve SiteContent day du, an toan de render.
 * Truong rong (sau khi lam sach) thi lay mac dinh, khong de trang giao dien.
 */
export function mergeSiteContent(input: unknown): SiteContent {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const out: SiteContent = { ...DEFAULT_SITE_CONTENT, packageDescriptions: { ...DEFAULT_SITE_CONTENT.packageDescriptions } };
  for (const field of TEXT_FIELDS) {
    const cleaned = sanitizePlainText(src[field], CONTENT_FIELD_LIMITS[field] ?? 500);
    if (cleaned) out[field] = cleaned;
  }
  const descs = src.packageDescriptions;
  if (descs && typeof descs === 'object') {
    const d = descs as Record<string, unknown>;
    for (const id of PACKAGE_IDS) {
      const cleaned = sanitizePlainText(d[id], CONTENT_FIELD_LIMITS.packageDescription ?? 200);
      if (cleaned) out.packageDescriptions[id] = cleaned;
    }
  }
  return out;
}

/**
 * Kiem tra noi dung nhap vao truoc khi luu: tra ve mang loi tieng Viet,
 * rong la hop le. Chi bao loi khi vuot gioi han ky tu hoac sai kieu du lieu
 * (chu khong tu cat ngan o day — mergeSiteContent moi cat khi hien thi).
 */
export function validateSiteContent(input: unknown): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['Nội dung giao diện không hợp lệ.'];
  const src = input as Record<string, unknown>;
  for (const field of TEXT_FIELDS) {
    const value = src[field];
    if (value === undefined) continue;
    if (typeof value !== 'string') {
      errors.push(`${CONTENT_FIELD_LABELS[field]} phải là chuỗi ký tự.`);
      continue;
    }
    const limit = CONTENT_FIELD_LIMITS[field] ?? 500;
    if (sanitizePlainText(value, Number.MAX_SAFE_INTEGER).length > limit) {
      errors.push(`${CONTENT_FIELD_LABELS[field]} tối đa ${limit} ký tự.`);
    }
  }
  const descs = src.packageDescriptions;
  if (descs !== undefined) {
    if (!descs || typeof descs !== 'object') {
      errors.push('Mô tả các gói chụp phải là danh sách theo từng gói.');
    } else {
      const d = descs as Record<string, unknown>;
      for (const id of PACKAGE_IDS) {
        const value = d[id];
        if (value === undefined) continue;
        if (typeof value !== 'string') {
          errors.push(`Mô tả gói ${id} phải là chuỗi ký tự.`);
        } else if (sanitizePlainText(value, Number.MAX_SAFE_INTEGER).length > (CONTENT_FIELD_LIMITS.packageDescription ?? 200)) {
          errors.push(`Mô tả gói ${id} tối đa ${CONTENT_FIELD_LIMITS.packageDescription} ký tự.`);
        }
      }
    }
  }
  return errors;
}

/** Tach marqueeText thanh danh sach muc de render chay vong (cach nhau '·'). */
export function splitMarqueeItems(marqueeText: string): string[] {
  return marqueeText
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);
}
