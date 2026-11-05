/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { SITE_CONFIG } from '../config/site';

// --- Bang dung chung (diem 2, 5, 8, 9) — chi Ha Noi, khong them Sai Gon ---
export const CATEGORY_LABELS: Record<Exclude<PhotoCategory, 'all'>, string> = {
  'aodai-trang': 'Áo Dài Trắng',
  'kiyieu-nhom': 'Kỉ Yếu Nhóm Lớp',
  'cophuc': 'Cổ Phục Di Sản',
  'aodai-pho': 'Áo Dài Dạo Phố',
  'nang-tho': 'Nàng Thơ Cận Cảnh',
};

export const HANOI_LOCATIONS: string[] = [
  'Hoàng Thành Thăng Long',
  'Văn Miếu - Quốc Tử Giám',
  'Phan Đình Phùng',
  'Hồ Tây / Đầm Sen',
  'Phố Cổ',
  'Trường học (ghi rõ tên trường)',
  'Khác',
];

export const TIME_SLOTS: { id: string; label: string }[] = [
  { id: 'sang-7-9', label: 'Sáng 7h – 9h' },
  { id: 'sang-9-11', label: 'Sáng 9h – 11h' },
  { id: 'chieu-14-16', label: 'Chiều 14h – 16h' },
  { id: 'chieu-16-18', label: 'Chiều 16h – 18h' },
];

export function timeSlotLabel(id?: string): string {
  return TIME_SLOTS.find((t) => t.id === id)?.label || id || '';
}

// Series -> goi co san (khong bia goi moi). Dung de hien gia o SeriesSection.
export const SERIES_PACKAGE: Record<string, BookingInquiry['packageType']> = {
  'series-nien-thieu': 'kiyieu-lop',
  'series-ha-noi-thu': 'aodai-solo',
  'series-co-phuc': 'cophuc-heritage',
  'series-sen-tay-ho': 'aodai-solo',
};

function localISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return localISODate(d);
}

export function todayISO(): string {
  // Dung ngay theo gio dia phuong (VN UTC+7), KHONG dung toISOString (UTC)
  // vi sang som o VN toISOString van la ngay hom truoc.
  return localISODate(new Date());
}

// --- SDT Viet Nam (diem 13) ---
export function normalizePhone(raw: string): string {
  let digits = (raw || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('84')) digits = '0' + digits.slice(2);
  return digits;
}

export function isValidVietnamesePhone(raw: string): boolean {
  const digits = normalizePhone(raw);
  return /^0(3|5|7|8|9)[0-9]{8}$/.test(digits);
}


export type PhotoCategory =
  | 'all'
  | 'aodai-trang'
  | 'kiyieu-nhom'
  | 'cophuc'
  | 'aodai-pho'
  | 'nang-tho';

export interface PhotoItem {
  id: string;
  title: string;
  vietnameseTitle: string;
  category: PhotoCategory;
  year: string;
  location: string;
  camera: string;
  lens: string;
  focalLength: string;
  aperture: string;
  shutterSpeed: string;
  iso: number;
  description: string;
  story: string;
  image: string;
  aspectRatio: '16:9' | '4:3' | '3:4' | '1:1';
  orientation: 'landscape' | 'portrait' | 'square';
  featured?: boolean;
  seriesId?: string;
  tags: string[];
  edition?: string;
  conceptNote?: string;
}

export interface BookingInquiry {
  clientName: string;
  email: string;
  phone: string;
  packageType: 'aodai-solo' | 'kiyieu-lop' | 'cophuc-heritage' | 'photobook-print';
  preferredDate: string;
  location: string;
  groupSize?: string;
  groupCount?: number;
  timeSlot?: string;
  message: string;
}

// Tinh gia uoc tinh: goi nhom 5-15 ban gia goc 1.200k, vuot 15 thi +80k/nguoi vuot.
export function calculateEstimatedPrice(packageType: BookingInquiry['packageType'], groupCount?: number): number {
  const base = getPackageDetails(packageType).basePriceVND;
  if (packageType === 'kiyieu-lop' && groupCount && groupCount > 15) {
    return base + (groupCount - 15) * 80000;
  }
  return base;
}

export function calculateDepositAmount(estimatedPrice: number): number {
  return Math.round((estimatedPrice * 0.3) / 1000) * 1000;
}

/**
 * Filter photos by category, search query, and favorites list
 */
export function filterPhotos(
  photos: PhotoItem[],
  category: string,
  searchQuery: string = '',
  onlyFavorites: boolean = false,
  favoriteIds: string[] = [],
  seriesTitleById: Record<string, string> = {}
): PhotoItem[] {
  return photos.filter((photo) => {
    // Category check
    if (category !== 'all' && photo.category !== category) {
      return false;
    }

    // Favorites check
    if (onlyFavorites && !favoriteIds.includes(photo.id)) {
      return false;
    }

    // Search query check (title, location, camera, tags)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = photo.title.toLowerCase().includes(q);
      const matchVnTitle = photo.vietnameseTitle.toLowerCase().includes(q);
      const matchLocation = photo.location.toLowerCase().includes(q);
      const matchCamera = photo.camera.toLowerCase().includes(q);
      const matchTags = photo.tags.some((t) => t.toLowerCase().includes(q));
      const seriesTitle = (photo.seriesId ? seriesTitleById[photo.seriesId] || '' : '').toLowerCase();
      const matchSeries = (photo.seriesId || '').toLowerCase().includes(q) || seriesTitle.includes(q);
      const pkgName = photo.seriesId && SERIES_PACKAGE[photo.seriesId]
        ? getPackageDetails(SERIES_PACKAGE[photo.seriesId]).name.toLowerCase()
        : '';
      const matchPackage = pkgName.includes(q);
      if (!matchTitle && !matchVnTitle && !matchLocation && !matchCamera && !matchTags && !matchSeries && !matchPackage) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Format EXIF camera metadata into clean typography string with separators
 */
export function formatExifString(photo: Partial<PhotoItem>): string {
  const parts: string[] = [];
  if (photo.focalLength) parts.push(photo.focalLength);
  if (photo.aperture) parts.push(photo.aperture);
  if (photo.shutterSpeed) parts.push(photo.shutterSpeed);
  if (photo.iso) parts.push(`ISO ${photo.iso}`);
  return parts.join(' · ');
}

/**
 * Calculate portfolio statistics for insights and curatorial overview
 */
export function calculatePortfolioStats(photos: PhotoItem[]) {
  const total = photos.length;
  const categoryCounts: Record<string, number> = {};
  const locations = new Set<string>();
  const cameras: Record<string, number> = {};

  photos.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    if (p.location) locations.add(p.location.split(',')[0].trim());
    if (p.camera) {
      const camShort = p.camera.split(' ')[0] || p.camera;
      cameras[camShort] = (cameras[camShort] || 0) + 1;
    }
  });

  return {
    total,
    categoryCounts,
    uniqueLocationsCount: locations.size,
    cameraBreakdown: cameras,
  };
}

/**
 * Formats price in Vietnamese Dong (VND)
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Estimates quotation and deliverables for Kỉ Yếu & Áo Dài photography packages
 */
export function getPackageDetails(packageType: BookingInquiry['packageType']) {
  switch (packageType) {
    case 'aodai-solo':
      return {
        name: 'Áo Dài Nàng Thơ & Cá Nhân (Giá Sinh Viên — Sony A7 Mark III)',
        basePriceVND: 650000,
        formattedPrice: formatVND(650000),
        duration: '1.5 - 2 giờ chụp thoải mái',
        deliverables: [
          'Chụp bằng máy ảnh Full-frame Sony A7 Mark III sắc nét, màu trong trẻo',
          'Hướng dẫn tạo dáng tỉ mỉ từng góc mặt cho các bạn chưa quen trước ống kính',
          'Chụp thoải mái không giới hạn file tại 1 địa điểm ngoại cảnh yêu thích',
          'Trả toàn bộ 100% file gốc qua Google Drive trong vòng 24 giờ',
          'Chỉnh sửa hậu kỳ 15 ảnh màu film thanh xuân, da sáng mịn màng tự nhiên',
        ],
      };
    case 'kiyieu-lop':
      return {
        name: 'Kỉ Yếu Nhóm Bạn Thân & Nhóm Nhỏ (5 - 15 bạn)',
        basePriceVND: 1200000,
        formattedPrice: `${formatVND(1200000)} (Chỉ ~80k - 240k/bạn)`,
        duration: '2.5 - 3.5 giờ chụp ngoại cảnh',
        deliverables: [
          'Chụp nhóm nhỏ tận tâm, chăm chút từng bạn (không lo bị bỏ quên như đi đoàn đông)',
          'Chụp đủ ảnh tập thể nhóm, ảnh cặp đôi bạn thân và chân dung đơn từng người',
          'Chụp bằng Sony A7 Mark III bắt trọn nụ cười rạng rỡ và khoảnh khắc tự nhiên',
          'Trả toàn bộ file gốc chụp trong ngày, hỗ trợ lọc ảnh cùng lớp/nhóm',
          'Chỉnh màu đồng bộ 25 - 30 ảnh đẹp nhất phong cách thanh xuân tươi sáng',
        ],
      };
    case 'cophuc-heritage':
      return {
        name: 'Áo Dài Cổ Phục & Mùa Thu Hà Nội',
        basePriceVND: 850000,
        formattedPrice: formatVND(850000),
        duration: '2 giờ chụp tại di tích / phố cổ',
        deliverables: [
          'Địa điểm: Hoàng Thành Thăng Long, Văn Miếu hoặc phố Phan Đình Phùng',
          'Hỗ trợ mang theo đạo cụ mộc (nón lá, quạt lụa)',
          'Tone màu hoài cổ (vintage film) ấm áp, tôn vinh nét đẹp truyền thống',
          '15 - 20 ảnh chỉnh sửa chi tiết, sắc nét từng nếp áo lụa',
        ],
      };
    case 'photobook-print':
      return {
        name: 'Gói Rửa Ảnh & Set Ảnh Kỉ Niệm Để Bàn',
        basePriceVND: 450000,
        formattedPrice: formatVND(450000),
        duration: 'In ấn & hoàn thiện 2-3 ngày',
        deliverables: [
          'In 20 ảnh lụa mini 10x15cm kẹp sổ lưu bút hoặc treo dây kẹp gỗ',
          'Tặng kèm 01 ảnh để bàn ép gỗ cao cấp (15x21cm)',
          'Đóng gói hộp quà mộc mạc lưu giữ thanh xuân',
        ],
      };
  }
}

/**
 * Form validation for booking inquiries
 */
export function validateBookingInquiry(inquiry: Partial<BookingInquiry>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!inquiry.clientName || inquiry.clientName.trim().length < 2) {
    errors.clientName = 'Vui lòng nhập họ tên hoặc tên đại diện nhóm/lớp (tối thiểu 2 ký tự)';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!inquiry.email || !emailRegex.test(inquiry.email.trim())) {
    errors.email = 'Vui lòng nhập địa chỉ email hợp lệ nhận ảnh và hợp đồng (vd: example@gmail.com)';
  }

  if (!inquiry.phone || !isValidVietnamesePhone(inquiry.phone)) {
    errors.phone = `Vui lòng nhập số điện thoại Việt Nam 10 số, đầu 03/05/07/08/09 (vd: ${SITE_CONFIG.phoneDisplay})`;
  }

  if (!inquiry.preferredDate) {
    errors.preferredDate = inquiry.packageType === 'photobook-print'
      ? 'Vui lòng chọn ngày muốn nhận ảnh'
      : 'Vui lòng chọn ngày dự kiến chụp kỉ yếu / áo dài';
  } else if (inquiry.preferredDate < tomorrowISO()) {
    // Date input cung min=tomorrow: hom nay tro ve truoc deu khong dat duoc
    // (can thoi gian chuan bi, khong nhan lich chup trong ngay).
    errors.preferredDate = 'Vui lòng chọn ngày từ ngày mai trở đi để Anh Yên có thời gian chuẩn bị.';
  }

  if (inquiry.packageType && inquiry.packageType !== 'photobook-print' && !inquiry.timeSlot) {
    errors.timeSlot = 'Vui lòng chọn khung giờ chụp';
  }

  if (inquiry.packageType === 'kiyieu-lop' && inquiry.groupCount !== undefined && inquiry.groupCount < 5) {
    errors.groupSize = 'Gói kỉ yếu nhóm áp dụng cho nhóm từ 5 bạn trở lên (tối đa 30 bạn).';
  }

  // Note/Concept message is optional so clients can easily ask for consultation or quote even with short notes like "hi"
  // If user enters message, it is always accepted; no arbitrary character limits.

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export type BookingStatus =
  | 'new'
  | 'consulting'
  | 'deposited'
  | 'completed'
  | 'cancelled';

export interface BookingLead extends BookingInquiry {
  id: string;
  createdAt: string;
  status: BookingStatus;
  notes?: string;
  source: 'web_form' | 'manual_entry' | 'quick_contact';
  estimatedPrice: number;
  depositAmount: number;
  paidAmount: number;
  balance: number;
  nextFollowUpAt?: string;
  cancelReason?: string;
  driveLink?: string;
  emailSentTo: string;
  emailSentAt: string;
}

export interface EmailNotificationLog {
  id: string;
  leadId: string;
  toEmail: string;
  fromEmail: string;
  subject: string;
  sentAt: string;
  previewSnippet: string;
  fullBody: string;
  status: 'delivered' | 'pending';
}

/**
 * Filter leads by status and search query (name, phone, email, location)
 */
export function filterLeads(
  leads: BookingLead[],
  statusFilter: string,
  searchQuery: string = ''
): BookingLead[] {
  return leads.filter((lead) => {
    if (statusFilter === 'due-today') {
      const today = todayISO();
      if (!(lead.nextFollowUpAt && lead.nextFollowUpAt <= today && (lead.status === 'new' || lead.status === 'consulting'))) {
        return false;
      }
    } else if (statusFilter !== 'all' && lead.status !== statusFilter) {
      return false;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchName = lead.clientName.toLowerCase().includes(q);
      const matchPhone = lead.phone.toLowerCase().includes(q);
      const matchEmail = lead.email.toLowerCase().includes(q);
      const matchLocation = lead.location.toLowerCase().includes(q);
      const matchNotes = (lead.notes || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchEmail && !matchLocation && !matchNotes) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculate dashboard high-level metrics for revenue, leads and conversion
 */
export function calculateDashboardStats(leads: BookingLead[], photosCount: number) {
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'new').length;
  const consultingLeads = leads.filter((l) => l.status === 'consulting').length;
  const depositedLeads = leads.filter((l) => l.status === 'deposited').length;
  const completedLeads = leads.filter((l) => l.status === 'completed').length;

  const estimatedRevenue = leads
    .filter((l) => l.status === 'deposited' || l.status === 'completed')
    .reduce((sum, l) => sum + (l.estimatedPrice || 0), 0);

  const potentialRevenue = leads
    .filter((l) => l.status === 'new' || l.status === 'consulting')
    .reduce((sum, l) => sum + (l.estimatedPrice || 0), 0);

  const conversionRate = totalLeads > 0
    ? Math.round(((depositedLeads + completedLeads) / totalLeads) * 100)
    : 0;

  const activeLeads = leads.filter((l) => l.status !== 'cancelled');
  const totalPaid = activeLeads.reduce((sum, l) => sum + (l.paidAmount || 0), 0);
  const totalDeposited = activeLeads.reduce((sum, l) => sum + (l.depositAmount || 0), 0);
  const totalBalance = activeLeads.reduce((sum, l) => sum + (l.balance ?? Math.max(0, (l.estimatedPrice || 0) - (l.paidAmount || 0))), 0);

  return {
    totalLeads,
    newLeads,
    consultingLeads,
    depositedLeads,
    completedLeads,
    estimatedRevenue,
    potentialRevenue,
    conversionRate,
    photosCount,
    totalPaid,
    totalDeposited,
    totalBalance,
  };
}

/**
 * Generates email notification payload sent to photographer email
 */
export function generateEmailNotification(
  lead: BookingLead,
  photographerEmail: string = SITE_CONFIG.photographerEmail
): EmailNotificationLog {
  const pkg = getPackageDetails(lead.packageType);
  const now = new Date().toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const subject = `[YÊN PHOTO] 📩 Khách Đăng Ký Mới: ${lead.clientName} - ${pkg.name}`;
  const previewSnippet = `${lead.clientName} vừa đăng ký gói ${pkg.name} (${pkg.formattedPrice}). SĐT: ${lead.phone}`;

  const fullBody = `
======================================================
  YÊN PHOTO — THÔNG BÁO ĐĂNG KÝ CHỤP KỈ YẾU & ÁO DÀI
======================================================

Kính gửi: Anh Yên (${photographerEmail})
Thời gian nhận: ${now}
Mã yêu cầu: #${lead.id}

THÔNG TIN KHÁCH HÀNG:
------------------------------------------------------
- Họ tên: ${lead.clientName}
- Số điện thoại / Zalo: ${lead.phone}
- Email: ${lead.email}
- Số lượng dự kiến: ${lead.groupSize || 'Chưa xác định'}

CHI TIẾT LỊCH CHỤP:
------------------------------------------------------
- Gói dịch vụ: ${pkg.name}
- Giá gói tham khảo: ${pkg.formattedPrice}
- Thiết bị chụp: Sony Alpha 7 Mark III (ILCE-7M3)
- Ngày dự kiến chụp: ${lead.preferredDate}
- Địa điểm mong muốn: ${lead.location}

LỜI NHẮN / CONCEPT MONG MUỐN TỪ KHÁCH:
"${lead.message?.trim() || '(Khách chưa ghi chú concept cụ thể — liên hệ Zalo để tư vấn)'}"

HÀNH ĐỘNG KHUYẾN NGHỊ:
1. Nhắn Zalo hoặc gọi ngay tới SĐT: ${lead.phone}
2. Gửi moodboard concept kỉ yếu/áo dài qua email: ${lead.email}
3. Cập nhật trạng thái tư vấn tại Dashboard quản lý Yên Photo.

======================================================
Hệ thống tự động đồng bộ từ website ${SITE_CONFIG.siteUrl}
  `.trim();

  return {
    id: `EMAIL-${lead.id}-${Math.floor(1000 + Math.random() * 9000)}`,
    leadId: lead.id,
    toEmail: photographerEmail,
    fromEmail: photographerEmail,
    subject,
    sentAt: now,
    previewSnippet,
    fullBody,
    // Airform dung mode no-cors nen khong xac nhan duoc da gui that hay chua.
    // De 'pending' cho dung thuc te, dung bao khach la 'da gui email'.
    status: 'pending',
  };
}

/**
 * Factory to create a new booking lead and automated email log
 */
export function createBookingLead(
  inquiry: BookingInquiry,
  photographerEmail: string = SITE_CONFIG.photographerEmail
): { lead: BookingLead; emailLog: EmailNotificationLog } {
  const pkg = getPackageDetails(inquiry.packageType);
  const now = new Date().toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const leadId = `KY-${Date.now().toString().slice(-5)}${Math.floor(10 + Math.random() * 90)}`;

  const estimatedPrice = calculateEstimatedPrice(inquiry.packageType, inquiry.groupCount);
  const depositAmount = calculateDepositAmount(estimatedPrice);
  const lead: BookingLead = {
    ...inquiry,
    phone: normalizePhone(inquiry.phone),
    id: leadId,
    createdAt: now,
    status: 'new',
    notes: 'Yêu cầu đăng ký từ form website, cần liên hệ tư vấn qua Zalo.',
    source: 'web_form',
    estimatedPrice,
    depositAmount,
    paidAmount: 0,
    balance: estimatedPrice,
    driveLink: '',
    emailSentTo: photographerEmail,
    emailSentAt: now,
  };

  const emailLog = generateEmailNotification(lead, photographerEmail);

  return { lead, emailLog };
}

/**
 * Human-friendly Vietnamese status badge formatters
 */
export function formatStatusLabel(status: BookingStatus) {
  switch (status) {
    case 'new':
      return {
        label: 'Mới Nhận (Cần tư vấn)',
        color: 'text-amber-700 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-950/60',
        border: 'border-amber-300 dark:border-amber-800',
      };
    case 'consulting':
      return {
        label: 'Đang Tư Vấn Zalo',
        color: 'text-sky-700 dark:text-sky-400',
        bg: 'bg-sky-100 dark:bg-sky-950/60',
        border: 'border-sky-300 dark:border-sky-800',
      };
    case 'deposited':
      return {
        label: 'Đã Cọc / Chốt Lịch',
        color: 'text-emerald-700 dark:text-emerald-400',
        bg: 'bg-emerald-100 dark:bg-emerald-950/60',
        border: 'border-emerald-300 dark:border-emerald-800',
      };
    case 'completed':
      return {
        label: 'Đã Chụp & Trả Ảnh',
        color: 'text-purple-700 dark:text-purple-400',
        bg: 'bg-purple-100 dark:bg-purple-950/60',
        border: 'border-purple-300 dark:border-purple-800',
      };
    case 'cancelled':
      return {
        label: 'Đã Hủy / Dời Lịch',
        color: 'text-neutral-600 dark:text-neutral-400',
        bg: 'bg-neutral-100 dark:bg-neutral-900',
        border: 'border-neutral-300 dark:border-neutral-800',
      };
  }
}

/**
 * Exports leads list to clean CSV format for spreadsheet apps
 */
export function exportLeadsToCsv(leads: BookingLead[]): string {
  const headers = [
    'Mã Yêu Cầu',
    'Thời Gian',
    'Họ Tên',
    'Số Điện Thoại',
    'Email',
    'Gói Chụp',
    'Giá Dự Kiến (VNĐ)',
    'Ngày Chụp Dự Kiến',
    'Địa Điểm',
    'Khung Giờ',
    'Tiền Cọc (VNĐ)',
    'Còn Lại (VNĐ)',
    'Link Drive',
    'Trạng Thái',
    'Ghi Chú Tư Vấn',
  ];

  const rows = leads.map((l) => [
    `"${l.id}"`,
    `"${l.createdAt}"`,
    `"${l.clientName.replace(/"/g, '""')}"`,
    `"${l.phone}"`,
    `"${l.email}"`,
    `"${getPackageDetails(l.packageType).name}"`,
    `"${l.estimatedPrice}"`,
    `"${l.preferredDate}"`,
    `"${l.location.replace(/"/g, '""')}"`,
    `"${timeSlotLabel(l.timeSlot)}"`,
    `"${l.depositAmount || 0}"`,
    `"${l.balance ?? ''}"`,
    `"${(l.driveLink || '').replace(/"/g, '""')}"`,
    `"${formatStatusLabel(l.status).label}"`,
    `"${(l.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Exports leads list to native Excel (.xlsx) binary format with styled columns
 */
export function exportLeadsToExcel(leads: BookingLead[]): Uint8Array {
  const rows = leads.map((l, index) => ({
    'STT': index + 1,
    'Mã Lịch Hẹn': l.id,
    'Thời Gian Đăng Ký': l.createdAt,
    'Họ Tên Khách / Lớp': l.clientName,
    'Số Điện Thoại / Zalo': l.phone,
    'Email Khách Hàng': l.email,
    'Gói Dịch Vụ': getPackageDetails(l.packageType).name,
    'Chi Phí Dự Kiến (VNĐ)': l.estimatedPrice,
    'Ngày Chụp Dự Kiến': l.preferredDate,
    'Địa Điểm Mong Muốn': l.location,
    'Số Lượng Dự Kiến': l.groupSize || 'Chưa rõ',
    'Khung Giờ': timeSlotLabel(l.timeSlot),
    'Tiền Cọc (VNĐ)': l.depositAmount || 0,
    'Đã Thu (VNĐ)': l.paidAmount || 0,
    'Còn Lại (VNĐ)': l.balance ?? '',
    'Link Drive': l.driveLink || '',
    'Ngày Hẹn Gọi Lại': l.nextFollowUpAt || '',
    'Lý Do Hủy': l.cancelReason || '',
    'Trạng Thái Tư Vấn': formatStatusLabel(l.status).label,
    'Concept & Lời Nhắn': l.message || '',
    'Ghi Chú Của Anh Yên': l.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set optimal column widths for Excel readability (1 cot / truong).
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 15 }, // Mã Lịch Hẹn
    { wch: 20 }, // Thời Gian Đăng Ký
    { wch: 28 }, // Họ Tên Khách / Lớp
    { wch: 18 }, // Số Điện Thoại
    { wch: 28 }, // Email Khách Hàng
    { wch: 30 }, // Gói Dịch Vụ
    { wch: 22 }, // Chi Phí Dự Kiến
    { wch: 18 }, // Ngày Chụp Dự Kiến
    { wch: 28 }, // Địa Điểm Mong Muốn
    { wch: 18 }, // Số Lượng Dự Kiến
    { wch: 16 }, // Khung Giờ
    { wch: 16 }, // Tiền Cọc
    { wch: 16 }, // Đã Thu
    { wch: 16 }, // Còn Lại
    { wch: 30 }, // Link Drive
    { wch: 18 }, // Ngày Hẹn Gọi Lại
    { wch: 24 }, // Lý Do Hủy
    { wch: 24 }, // Trạng Thái Tư Vấn
    { wch: 38 }, // Concept & Lời Nhắn
    { wch: 35 }, // Ghi Chú Của Anh Yên
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'KhachHang_YenPhoto');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}

/**
 * Sends booking email in real time to photographer's inbox via Airform API
 */
export async function sendBookingEmailReal(
  lead: BookingLead,
  targetEmail: string = SITE_CONFIG.photographerEmail
): Promise<{ success: boolean; message: string; method: 'airform' | 'offline_logged' }> {
  const pkg = getPackageDetails(lead.packageType);

  const cleanEmail = (targetEmail || SITE_CONFIG.photographerEmail).trim().toLowerCase();

  try {
    const payload = {
      _subject: `[YÊN PHOTO] 📩 Đặt Lịch Chụp Mới: ${lead.clientName} - ${pkg.name}`,
      'Mã đặt lịch': `#${lead.id}`,
      'Thời gian đăng ký': lead.createdAt,
      'Họ tên khách hàng / Nhóm': lead.clientName,
      'Số điện thoại / Zalo': lead.phone,
      'Email khách hàng': lead.email,
      'Gói dịch vụ đã chọn': `${pkg.name} (${pkg.formattedPrice})`,
      'Ngày dự kiến chụp': lead.preferredDate,
      'Địa điểm chụp': lead.location,
      'Số lượng người': lead.groupSize || 'Chưa rõ',
      'Concept / Lời nhắn': lead.message?.trim() || '(Khách chưa ghi chú, cần liên hệ tư vấn thêm)',
      'Thiết bị sử dụng': 'Sony Alpha 7 Mark III (ILCE-7M3)',
      'Email studio nhận': cleanEmail,
    };

    // Perform background dispatch to photographer inbox
    fetch(`https://airform.io/${cleanEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors',
    }).catch(() => {
      // Background fallback handled silently
    });

    // Airform no-cors: trinh duyet khong doc duoc ket qua tra ve, nen KHONG
    // duoc bao la 'da gui email'. Don da luu, Yen kiem tra Dashboard / Zalo.
    return {
      success: false,
      message: 'Đơn đã lưu, Anh Yên sẽ liên hệ qua Zalo/SĐT trong ngày. (Email thông báo qua Airform chưa xác nhận được đã gửi.)',
      method: 'airform',
    };
  } catch (error: any) {
    console.warn('Real email dispatch network warning:', error);
    return {
      success: false,
      message: 'Đơn đã lưu, Anh Yên sẽ liên hệ qua Zalo/SĐT trong ngày.',
      method: 'offline_logged',
    };
  }
}

/**
 * Generates direct Mailto URL for native email clients (Outlook, Apple Mail, etc.)
 */
export function generateDirectMailtoUrl(
  lead: BookingLead,
  targetEmail: string = SITE_CONFIG.photographerEmail
): string {
  const pkg = getPackageDetails(lead.packageType);
  const subject = encodeURIComponent(`[YÊN PHOTO] Đặt lịch chụp: ${lead.clientName} - ${pkg.name}`);
  const body = encodeURIComponent(
    `Kính gửi Anh Yên (Yên Photo),\n\n` +
    `Tôi gửi thông tin đặt lịch chụp kỉ yếu / áo dài:\n` +
    `- Mã đặt lịch: #${lead.id}\n` +
    `- Họ tên: ${lead.clientName}\n` +
    `- Số điện thoại / Zalo: ${lead.phone}\n` +
    `- Email nhận ảnh: ${lead.email}\n` +
    `- Gói dịch vụ: ${pkg.name} (${pkg.formattedPrice})\n` +
    `- Ngày dự kiến chụp: ${lead.preferredDate}\n` +
    `- Địa điểm: ${lead.location}\n` +
    `- Số lượng: ${lead.groupSize || '1'}\n` +
    `- Ý tưởng / Lời nhắn: ${lead.message || 'Cần studio tư vấn'}\n` +
    `- Thiết bị: Sony Alpha 7 Mark III\n\n` +
    `Mong nhận được liên hệ tư vấn từ studio!`
  );
  return `mailto:${targetEmail}?subject=${subject}&body=${body}`;
}

/**
 * Generates direct Web Gmail Compose URL (opens Gmail tab with pre-filled content)
 */
export function generateWebGmailUrl(
  lead: BookingLead,
  targetEmail: string = SITE_CONFIG.photographerEmail
): string {
  const pkg = getPackageDetails(lead.packageType);
  const subject = encodeURIComponent(`[YÊN PHOTO] Đặt lịch chụp: ${lead.clientName} - ${pkg.name}`);
  const body = encodeURIComponent(
    `Kính gửi Anh Yên (Yên Photo),\n\n` +
    `Tôi gửi thông tin đặt lịch chụp kỉ yếu / áo dài:\n` +
    `- Mã đặt lịch: #${lead.id}\n` +
    `- Họ tên: ${lead.clientName}\n` +
    `- Số điện thoại / Zalo: ${lead.phone}\n` +
    `- Email nhận ảnh: ${lead.email}\n` +
    `- Gói dịch vụ: ${pkg.name} (${pkg.formattedPrice})\n` +
    `- Ngày dự kiến chụp: ${lead.preferredDate}\n` +
    `- Địa điểm: ${lead.location}\n` +
    `- Số lượng: ${lead.groupSize || '1'}\n` +
    `- Ý tưởng / Lời nhắn: ${lead.message || 'Cần studio tư vấn'}\n\n` +
    `Mong nhận được liên hệ tư vấn từ studio!`
  );
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${subject}&body=${body}`;
}

/**
 * Generates Zalo chat URL
 */
export function generateZaloContactUrl(phone: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `https://zalo.me/${cleanPhone}`;
}

export const INITIAL_LEADS: BookingLead[] = [];
// Lead mau da duoc xoa truoc khi public: khong de thong tin khach hang gia trong source.

export type UserRole = 'admin' | 'guest';

export interface RolePermissions {
  canViewDashboard: boolean;
  canAddPhotos: boolean;
  canDeletePhotos: boolean;
  canSetFeaturedPhoto: boolean;
  canManageLeads: boolean;
  canExportCsv: boolean;
  canConfigureSettings: boolean;
  canBookAndInquire: boolean;
  canViewGallery: boolean;
  canFavoritePhotos: boolean;
}

/**
 * Return strict granular permissions based on active role
 */
export function getRolePermissions(role: UserRole): RolePermissions {
  const isAdmin = role === 'admin';
  return {
    canViewDashboard: isAdmin,
    canAddPhotos: isAdmin,
    canDeletePhotos: isAdmin,
    canSetFeaturedPhoto: isAdmin,
    canManageLeads: isAdmin,
    canExportCsv: isAdmin,
    canConfigureSettings: isAdmin,
    canBookAndInquire: true,
    canViewGallery: true,
    canFavoritePhotos: true,
  };
}

