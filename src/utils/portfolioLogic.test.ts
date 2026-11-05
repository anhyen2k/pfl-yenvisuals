/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterPhotos,
  formatExifString,
  describePhotoAlt,
  calculatePortfolioStats,
  validateBookingInquiry,
  getPackageDetails,
  createBookingLead,
  filterLeads,
  calculateDashboardStats,
  exportLeadsToCsv,
  exportLeadsToExcel,
  generateWebGmailUrl,
  generateDirectMailtoUrl,
  getRolePermissions,
  normalizePhone,
  isValidVietnamesePhone,
  calculateEstimatedPrice,
  calculateDepositAmount,
  tomorrowISO,
  todayISO,
  generateEmailNotification,
  DEFAULT_PACKAGE_PRICES,
  validatePackagePrices,
  type PackagePrices,
  PhotoItem,
} from './portfolioLogic.js';
import * as portfolioLogicModule from './portfolioLogic.js';
import {
  DEFAULT_SITE_CONTENT,
  mergeSiteContent,
  validateSiteContent,
  sanitizePlainText,
  splitMarqueeItems,
} from '../config/content.js';
import {
  normalizeProofingCode,
  isValidProofingCode,
  extractPhoneSuffix,
  matchesPhoneSuffix,
  MAX_PROOFING_PHOTOS_PER_LEAD,
  PROOFING_QUERY_LIMIT,
  buildPublicOrder,
  validatePaidAmount,
  matchesPublicOrderPhone,
  getFirestoreErrorCode,
  translateCloudError,
  decideLeadWriteMode,
  stripUndefinedFields,
  isUploadStalled,
  FIRESTORE_DATABASE_ID,
  mergeOptimisticPhotos,
} from './portfolioLogic.js';
import {
  selectJobsToStart,
  computeQueueProgress,
  shouldRetryJob,
  retryDelayMs,
  mapWithConcurrency,
  MAX_CONCURRENT_UPLOADS,
  MAX_UPLOAD_ATTEMPTS,
  type UploadJob,
} from '../services/uploadQueue.js';

const mockPhotos: PhotoItem[] = [
  {
    id: 'photo-1',
    title: 'Pure White Youth',
    vietnameseTitle: 'Tà Áo Trắng Sân Trường',
    category: 'aodai-trang',
    year: '2026',
    location: 'Trường THPT Chu Văn An, Hà Nội',
    camera: 'Sony A7 Mark III',
    lens: 'Sony FE 85mm f/1.8',
    focalLength: '85mm',
    aperture: 'f/1.8',
    shutterSpeed: '1/1000s',
    iso: 100,
    description: 'Nụ cười trong veo của nữ sinh trong tà áo dài trắng ngày bế giảng',
    story: 'Ánh nắng sớm xuyên qua tán lá bàng sân trường',
    image: 'data:image/svg+xml,...',
    aspectRatio: '3:4',
    orientation: 'portrait',
    tags: ['áo dài', 'kỉ yếu', 'học sinh', 'thanh xuân'],
  },
  {
    id: 'photo-2',
    title: 'Heritage Elegance',
    vietnameseTitle: 'Nét Cổ Kính Nhật Bình',
    category: 'cophuc',
    year: '2026',
    location: 'Hoàng Thành Thăng Long, Hà Nội',
    camera: 'Sony A7 Mark III',
    lens: 'Sony FE 50mm f/1.8',
    focalLength: '50mm',
    aperture: 'f/1.8',
    shutterSpeed: '1/500s',
    iso: 100,
    description: 'Cổ phục áo Nhật Bình thêu hoa văn ngũ hành cung đình',
    story: 'Khắc họa vẻ đẹp đoan trang bên tường gạch rêu phong',
    image: 'data:image/svg+xml,...',
    aspectRatio: '4:3',
    orientation: 'landscape',
    tags: ['cổ phục', 'nhật bình', 'hoàng thành', 'di sản'],
  },
  {
    id: 'photo-3',
    title: 'Graduation Toss',
    vietnameseTitle: 'Tung Bay Mũ Cử Nhân',
    category: 'kiyieu-nhom',
    year: '2025',
    location: 'Đại Học Quốc Gia Hà Nội',
    camera: 'Sony A7 Mark III',
    lens: 'Sony FE 28-70mm f/3.5-5.6',
    focalLength: '35mm',
    aperture: 'f/4.0',
    shutterSpeed: '1/2000s',
    iso: 200,
    description: 'Khoảnh khắc cả lớp cùng tung mũ tốt nghiệp lên nền trời xanh',
    story: 'Tiếng cười rộn rã khép lại 4 năm đại học',
    image: 'data:image/svg+xml,...',
    aspectRatio: '16:9',
    orientation: 'landscape',
    tags: ['kỉ yếu', 'tốt nghiệp', 'nhóm lớp', 'áo cử nhân'],
  },
];

test('filterPhotos returns all photos when category is all', () => {
  const result = filterPhotos(mockPhotos, 'all');
  assert.equal(result.length, 3);
});

test('filterPhotos filters by specific aodai category', () => {
  const result = filterPhotos(mockPhotos, 'aodai-trang');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'photo-1');
});

test('filterPhotos matches search query in title, tags, and location', () => {
  const resultLocation = filterPhotos(mockPhotos, 'all', 'Hoàng Thành');
  assert.equal(resultLocation.length, 1);
  assert.equal(resultLocation[0].id, 'photo-2');

  const resultTag = filterPhotos(mockPhotos, 'all', 'thanh xuân');
  assert.equal(resultTag.length, 1);
  assert.equal(resultTag[0].id, 'photo-1');
});

test('formatExifString formats EXIF fields cleanly', () => {
  const str = formatExifString(mockPhotos[0]);
  assert.equal(str, '85mm · f/1.8 · 1/1000s · ISO 100');
});

test('calculatePortfolioStats computes correct aggregates for kỉ yếu & áo dài', () => {
  const stats = calculatePortfolioStats(mockPhotos);
  assert.equal(stats.total, 3);
  assert.equal(stats.categoryCounts['aodai-trang'], 1);
  assert.equal(stats.categoryCounts['cophuc'], 1);
  assert.equal(stats.categoryCounts['kiyieu-nhom'], 1);
});

test('getPackageDetails returns correct pricing for kỉ yếu & áo dài packages', () => {
  const solo = getPackageDetails('aodai-solo');
  assert.equal(solo.basePriceVND, 650000);
  assert.ok(solo.deliverables.length >= 4);

  const kiyieu = getPackageDetails('kiyieu-lop');
  assert.equal(kiyieu.basePriceVND, 1200000);
  assert.ok(kiyieu.deliverables.some((d) => d.includes('Sony A7 Mark III')));
});

test('validateBookingInquiry validates client booking inputs', () => {
  const invalid = { clientName: '' };
  assert.equal(validateBookingInquiry(invalid).isValid, false);

  const valid = {
    clientName: 'Lớp 12A1 Chuyên Sư Phạm',
    email: 'lop12a1@gmail.com',
    phone: '0987654321',
    packageType: 'kiyieu-lop' as const,
    preferredDate: '2026-11-25',
    timeSlot: 'sang-9-11',
    location: 'Trường ĐH Sư Phạm Hà Nội & Hoàng Thành Thăng Long',
    message: 'Lớp 40 người cần chụp kỉ yếu áo dài và áo cử nhân',
  };
  assert.equal(validateBookingInquiry(valid).isValid, true);

  // User scenario: short note 'hi' like in the screenshot
  const validWithShortMessage = {
    clientName: 'Kim chi',
    email: 'kimchi@gmail.com',
    phone: '0961234500',
    packageType: 'aodai-solo' as const,
    preferredDate: '2027-02-01',
    timeSlot: 'chieu-14-16',
    location: 'công viên',
    groupSize: '1',
    message: 'hi',
  };
  const resultShort = validateBookingInquiry(validWithShortMessage);
  assert.equal(resultShort.isValid, true);
  assert.equal(Object.keys(resultShort.errors).length, 0);

  // Note/Concept can also be empty
  const validEmptyMessage = {
    clientName: 'Nguyễn Thu Trang',
    email: 'thutrang@gmail.com',
    phone: '0988776655',
    packageType: 'aodai-solo' as const,
    preferredDate: '2026-12-01',
    timeSlot: 'sang-7-9',
    message: '',
  };
  assert.equal(validateBookingInquiry(validEmptyMessage).isValid, true);
});

test('createBookingLead generates lead and formatted email notification to anhyenk26@gmail.com', () => {
  const inquiry = {
    clientName: 'Hoàng Lan',
    email: 'hoanglan@gmail.com',
    phone: '0961234500',
    packageType: 'aodai-solo' as const,
    preferredDate: '2026-11-18',
    location: 'Phan Đình Phùng',
    message: 'Chụp áo dài trắng với xe đạp hoa mùa thu',
  };

  const { lead, emailLog } = createBookingLead(inquiry, 'anhyenk26@gmail.com');
  assert.ok(lead.id.startsWith('KY-'));
  assert.equal(lead.status, 'new');
  assert.equal(lead.emailSentTo, 'anhyenk26@gmail.com');
  assert.equal(emailLog.toEmail, 'anhyenk26@gmail.com');
  assert.ok(emailLog.subject.includes('Hoàng Lan'));
  assert.ok(emailLog.fullBody.includes('Sony Alpha 7 Mark III'));
  assert.ok(emailLog.fullBody.includes('0961234500'));
});

test('filterLeads filters by status and search terms', () => {
  const testLeads: any[] = [
    {
      id: 'KY-1',
      clientName: 'Lê Mai',
      phone: '0911',
      email: 'lemai@gmail.com',
      status: 'new',
      location: 'Hà Nội',
      notes: '',
    },
    {
      id: 'KY-2',
      clientName: 'Nguyễn Tuấn',
      phone: '0922',
      email: 'tuan@gmail.com',
      status: 'consulting',
      location: 'Chu Văn An',
      notes: 'Thích phong cách retro 90s',
    },
  ];

  const filteredStatus = filterLeads(testLeads, 'new');
  assert.equal(filteredStatus.length, 1);
  assert.equal(filteredStatus[0].id, 'KY-1');

  const filteredQuery = filterLeads(testLeads, 'all', 'retro 90s');
  assert.equal(filteredQuery.length, 1);
  assert.equal(filteredQuery[0].id, 'KY-2');
});

test('calculateDashboardStats computes correct revenue and conversion', () => {
  const testLeads: any[] = [
    { id: '1', status: 'new', estimatedPrice: 650000 },
    { id: '2', status: 'consulting', estimatedPrice: 850000 },
    { id: '3', status: 'deposited', estimatedPrice: 1200000 },
    { id: '4', status: 'completed', estimatedPrice: 1200000 },
  ];

  const stats = calculateDashboardStats(testLeads, 12);
  assert.equal(stats.totalLeads, 4);
  assert.equal(stats.newLeads, 1);
  assert.equal(stats.consultingLeads, 1);
  assert.equal(stats.depositedLeads, 1);
  assert.equal(stats.completedLeads, 1);
  assert.equal(stats.estimatedRevenue, 2400000);
  assert.equal(stats.potentialRevenue, 1500000);
  assert.equal(stats.conversionRate, 50);
});

test('exportLeadsToCsv generates valid CSV string with headers', () => {
  const testLeads: any[] = [
    {
      id: 'KY-99',
      createdAt: '03/11/2026',
      clientName: 'Trịnh Linh',
      phone: '0988776655',
      email: 'linh@gmail.com',
      packageType: 'aodai-solo',
      estimatedPrice: 650000,
      preferredDate: '2026-11-20',
      location: 'Hồ Tây',
      status: 'new',
      notes: 'Cần hỗ trợ hoa tươi',
    },
  ];

  const csv = exportLeadsToCsv(testLeads);
  assert.ok(csv.includes('Mã Yêu Cầu,Thời Gian,Họ Tên'));
  assert.ok(csv.includes('Trịnh Linh'));
  assert.ok(csv.includes('0988776655'));
});

test('exportLeadsToExcel generates valid binary XLSX Uint8Array buffer', () => {
  const testLeads: any[] = [
    {
      id: 'KY-101',
      createdAt: '04/11/2026 10:00',
      clientName: 'Hoàng Yến (Học Viện Ngoại Giao)',
      phone: '0977 123 456',
      email: 'hoangyen@dav.edu.vn',
      packageType: 'aodai-solo',
      estimatedPrice: 650000,
      preferredDate: '2026-11-28',
      location: 'Phố đi bộ Hoàng Thành',
      groupSize: '1 bạn',
      status: 'deposited',
      message: 'Chụp phong cách nhẹ nhàng trong trẻo với hoa cúc họa mi',
      notes: 'Đã cọc 200k qua Momo',
    },
  ];

  const excelBuffer = exportLeadsToExcel(testLeads);
  assert.ok(excelBuffer instanceof Uint8Array);
  assert.ok(excelBuffer.length > 500); // Standard zip header for .xlsx is multiple KBs
  // XLSX files start with PK zip signature: 0x50, 0x4B
  assert.equal(excelBuffer[0], 0x50);
  assert.equal(excelBuffer[1], 0x4b);
});

test('generateWebGmailUrl and generateDirectMailtoUrl generate correct URLs for anhyenk26@gmail.com', () => {
  const testLead: any = {
    id: 'KY-777',
    clientName: 'Ngọc Ánh',
    phone: '0933445566',
    email: 'ngocanh@gmail.com',
    packageType: 'aodai-solo',
    preferredDate: '2026-12-05',
    location: 'Hồ Gươm',
    message: 'Áo dài đỏ Tết',
  };

  const gmailUrl = generateWebGmailUrl(testLead, 'anhyenk26@gmail.com');
  assert.ok(gmailUrl.includes('mail.google.com/mail'));
  assert.ok(gmailUrl.includes('to=anhyenk26%40gmail.com'));
  assert.ok(gmailUrl.includes('Ng%E1%BB%8Dc%20%C3%81nh'));

  const mailtoUrl = generateDirectMailtoUrl(testLead, 'anhyenk26@gmail.com');
  assert.ok(mailtoUrl.startsWith('mailto:anhyenk26@gmail.com'));
});

test('admin login is Google-only: no hardcoded PIN credentials remain', () => {
  // verifyAdminCredentials / ADMIN_CREDENTIALS were removed with PIN login.
  // If either is ever re-exported, this test fails.
  assert.equal(
    (portfolioLogicModule as unknown as Record<string, unknown>).verifyAdminCredentials,
    undefined
  );
  assert.equal(
    (portfolioLogicModule as unknown as Record<string, unknown>).ADMIN_CREDENTIALS,
    undefined
  );
});

test('getRolePermissions strictly protects admin actions and allows guest browsing', () => {
  const guestPerms = getRolePermissions('guest');
  assert.equal(guestPerms.canViewDashboard, false);
  assert.equal(guestPerms.canAddPhotos, false);
  assert.equal(guestPerms.canDeletePhotos, false);
  assert.equal(guestPerms.canSetFeaturedPhoto, false);
  assert.equal(guestPerms.canManageLeads, false);
  assert.equal(guestPerms.canBookAndInquire, true);
  assert.equal(guestPerms.canViewGallery, true);
  assert.equal(guestPerms.canFavoritePhotos, true);

  const adminPerms = getRolePermissions('admin');
  assert.equal(adminPerms.canViewDashboard, true);
  assert.equal(adminPerms.canAddPhotos, true);
  assert.equal(adminPerms.canDeletePhotos, true);
  assert.equal(adminPerms.canSetFeaturedPhoto, true);
  assert.equal(adminPerms.canManageLeads, true);
  assert.equal(adminPerms.canBookAndInquire, true);
  assert.equal(adminPerms.canViewGallery, true);
});


test('phone VN: normalize + validate 10 so dau 03/05/07/08/09', () => {
  assert.equal(normalizePhone('0961 230 500'), '0961230500');
  assert.equal(normalizePhone('+84 961 230 500'), '0961230500');
  assert.equal(isValidVietnamesePhone('0961230500'), true);
  assert.equal(isValidVietnamesePhone('01212320'), false);
  assert.equal(isValidVietnamesePhone('1234567890'), false);
  assert.equal(validateBookingInquiry({ clientName: 'A B', email: 'a@b.com', phone: '01212320', packageType: 'aodai-solo', preferredDate: tomorrowISO(), timeSlot: 'sang-7-9' }).isValid, false);
});

test('validate chan ngay qua khu va bat khung gio tru photobook', () => {
  const base: any = { clientName: 'A B', email: 'a@b.com', phone: '0961234500', packageType: 'aodai-solo', preferredDate: tomorrowISO(), timeSlot: 'sang-7-9' };
  assert.equal(validateBookingInquiry(base).isValid, true);
  assert.equal(validateBookingInquiry({ ...base, preferredDate: '2020-01-01' }).isValid, false);
  assert.equal(validateBookingInquiry({ ...base, timeSlot: undefined }).isValid, false);
  assert.equal(validateBookingInquiry({ ...base, packageType: 'photobook-print', timeSlot: undefined }).isValid, true);
});

test('ngay dung gio dia phuong, khong dat lich trong ngay hom nay', () => {
  const now = new Date();
  const expectedToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  assert.equal(todayISO(), expectedToday);
  const base: any = { clientName: 'A B', email: 'a@b.com', phone: '0961234500', packageType: 'aodai-solo', preferredDate: todayISO(), timeSlot: 'sang-7-9' };
  assert.equal(validateBookingInquiry(base).isValid, false);
  assert.ok(validateBookingInquiry(base).errors.preferredDate);
  assert.equal(validateBookingInquiry({ ...base, preferredDate: tomorrowISO() }).isValid, true);
});

test('goi kiyieu nhom toi thieu 5 ban', () => {
  const base: any = { clientName: 'Lop 12A1', email: 'a@b.com', phone: '0961234500', packageType: 'kiyieu-lop', preferredDate: tomorrowISO(), timeSlot: 'sang-7-9', groupCount: 4 };
  assert.equal(validateBookingInquiry(base).isValid, false);
  assert.ok(validateBookingInquiry(base).errors.groupSize);
  assert.equal(validateBookingInquiry({ ...base, groupCount: 5 }).isValid, true);
});

test('gia kiyieu tren dau nguoi dung 80k-240k/ban', () => {
  const kiyieu = getPackageDetails('kiyieu-lop');
  assert.ok(kiyieu.formattedPrice.includes('80k - 240k'));
  assert.equal(Math.round(1200000 / 15), 80000);
  assert.equal(Math.round(1200000 / 5), 240000);
});

test('email log dung siteUrl that va fromEmail dung email nhan', () => {
  const { emailLog } = createBookingLead({ clientName: 'Test', email: 't@x.com', phone: '0961234500', packageType: 'aodai-solo', preferredDate: tomorrowISO(), location: 'Hoàng Thành Thăng Long', message: '' } as any, 'anhyenk26@gmail.com');
  assert.equal(emailLog.fromEmail, 'anhyenk26@gmail.com');
  assert.ok(emailLog.fullBody.includes('https://anhyen2k.github.io/pfl-yenvisuals/'));
  assert.ok(!emailLog.fullBody.includes('ais-dev'));
});

test('gia nhom vuot 15 nguoi +80k/nguoi va coc 30%', () => {
  assert.equal(calculateEstimatedPrice('kiyieu-lop', 15), 1200000);
  assert.equal(calculateEstimatedPrice('kiyieu-lop', 20), 1600000);
  assert.equal(calculateEstimatedPrice('aodai-solo', 1), 650000);
  assert.equal(calculateDepositAmount(650000), 195000);
  assert.equal(calculateDepositAmount(1200000), 360000);
  const { lead } = createBookingLead({ clientName: 'Nhom 20', email: 'n@x.com', phone: '0961234500', packageType: 'kiyieu-lop', preferredDate: tomorrowISO(), location: 'Hoàng Thành Thăng Long', groupCount: 20, timeSlot: 'sang-9-11', message: '' } as any, 'anhyenk26@gmail.com');
  assert.equal(lead.estimatedPrice, 1600000);
  assert.equal(lead.depositAmount, 480000);
  assert.equal(lead.balance, 1600000);
  assert.equal(lead.paidAmount, 0);
});

test('filterPhotos tim theo series va goi', () => {
  const photos: PhotoItem[] = [
    { ...mockPhotos[0], seriesId: 'series-co-phuc' },
    { ...mockPhotos[1], seriesId: 'series-nien-thieu' },
  ];
  const bySeries = filterPhotos(photos, 'all', 'co-phuc', false, [], { 'series-co-phuc': 'Dấu Xưa Ngàn Năm Cổ Phục' });
  assert.equal(bySeries.length, 1);
  assert.equal(bySeries[0].id, 'photo-1');
});

test('filterLeads due-today chi lay don hen goi lai hom nay', () => {
  const today = todayISO();
  const leads: any[] = [
    { id: '1', clientName: 'A', phone: '0911', email: 'a@x.com', status: 'new', nextFollowUpAt: today },
    { id: '2', clientName: 'B', phone: '0922', email: 'b@x.com', status: 'new', nextFollowUpAt: '2099-01-01' },
    { id: '3', clientName: 'C', phone: '0933', email: 'c@x.com', status: 'completed', nextFollowUpAt: today },
  ];
  assert.equal(filterLeads(leads, 'due-today').length, 1);
  assert.equal(filterLeads(leads, 'due-today')[0].id, '1');
});

test('dashboard stats them tien that da thu / con phai thu', () => {
  const stats = calculateDashboardStats([
    { id: '1', status: 'deposited', estimatedPrice: 1200000, depositAmount: 360000, paidAmount: 360000, balance: 840000 },
    { id: '2', status: 'new', estimatedPrice: 650000, depositAmount: 195000, paidAmount: 0, balance: 650000 },
  ] as any, 5);
  assert.equal(stats.totalPaid, 360000);
  assert.equal(stats.totalBalance, 1490000);
});

test('doi gia solo thanh 700k thi getPackageDetails / gia uoc tinh / coc 30% doi theo', () => {
  const prices: PackagePrices = { ...DEFAULT_PACKAGE_PRICES, 'aodai-solo': 700000 };
  const solo = getPackageDetails('aodai-solo', prices);
  assert.equal(solo.basePriceVND, 700000);
  assert.ok(solo.formattedPrice.includes('700.000'));

  assert.equal(calculateEstimatedPrice('aodai-solo', 1, prices), 700000);
  assert.equal(calculateDepositAmount(calculateEstimatedPrice('aodai-solo', 1, prices)), 210000);

  // Don dat lich dung gia moi: coc 30% cua 700k = 210k
  const { lead } = createBookingLead(
    { clientName: 'Gia Moi', email: 'g@x.com', phone: '0961234500', packageType: 'aodai-solo', preferredDate: tomorrowISO(), location: 'Hồ Tây', timeSlot: 'sang-7-9', message: '' } as any,
    'anhyenk26@gmail.com',
    prices
  );
  assert.equal(lead.estimatedPrice, 700000);
  assert.equal(lead.depositAmount, 210000);
  assert.equal(lead.balance, 700000);
});

test('doi phu phi vuot nhom thi gia nhom doi theo', () => {
  const prices: PackagePrices = { ...DEFAULT_PACKAGE_PRICES, extraPerPerson: 100000 };
  // Nhom 20: 1.200.000 + 5 x 100.000 = 1.700.000 (thay vi 1.600.000 voi 80k mac dinh)
  assert.equal(calculateEstimatedPrice('kiyieu-lop', 20, prices), 1700000);
  assert.equal(calculateDepositAmount(1700000), 510000);
  assert.equal(calculateEstimatedPrice('kiyieu-lop', 20), 1600000);
});

test('khong truyen prices thi dung gia mac dinh 650k / 1.200k / 850k / 450k', () => {
  assert.deepEqual(DEFAULT_PACKAGE_PRICES, {
    'aodai-solo': 650000,
    'kiyieu-lop': 1200000,
    'cophuc-heritage': 850000,
    'photobook-print': 450000,
    extraPerPerson: 80000,
  });
  assert.equal(getPackageDetails('aodai-solo').basePriceVND, 650000);
  assert.equal(getPackageDetails('kiyieu-lop').basePriceVND, 1200000);
  assert.equal(getPackageDetails('cophuc-heritage').basePriceVND, 850000);
  assert.equal(getPackageDetails('photobook-print').basePriceVND, 450000);
  assert.equal(calculateEstimatedPrice('aodai-solo'), 650000);
  assert.equal(calculateEstimatedPrice('kiyieu-lop', 20), 1600000);
  assert.equal(calculateDepositAmount(650000), 195000);
});

test('validatePackagePrices bao loi khi gia 0, gia 20.000.000, extraPerPerson -1', () => {
  // Bang gia mac dinh hop le
  assert.deepEqual(validatePackagePrices(DEFAULT_PACKAGE_PRICES), []);

  // Gia goi = 0 (duoi muc toi thieu 50.000)
  const zero = validatePackagePrices({ ...DEFAULT_PACKAGE_PRICES, 'aodai-solo': 0 });
  assert.ok(zero.length > 0);
  assert.ok(zero.some((e) => e.includes('Áo dài solo')));

  // Gia goi = 20.000.000 (vuot muc toi da 10.000.000)
  const tooHigh = validatePackagePrices({ ...DEFAULT_PACKAGE_PRICES, 'kiyieu-lop': 20000000 });
  assert.ok(tooHigh.length > 0);

  // Phu phi am
  const negativeExtra = validatePackagePrices({ ...DEFAULT_PACKAGE_PRICES, extraPerPerson: -1 });
  assert.ok(negativeExtra.length > 0);

  // Gia khong phai so nguyen, phu phi vuot 500.000 cung loi
  assert.ok(validatePackagePrices({ ...DEFAULT_PACKAGE_PRICES, 'cophuc-heritage': 850000.5 }).length > 0);
  assert.ok(validatePackagePrices({ ...DEFAULT_PACKAGE_PRICES, extraPerPerson: 600000 }).length > 0);

  // Bien gioi hop le: 50.000, 10.000.000, extra 0 va 500.000
  assert.deepEqual(validatePackagePrices({ ...DEFAULT_PACKAGE_PRICES, 'aodai-solo': 50000, 'photobook-print': 10000000, extraPerPerson: 0 }), []);
  assert.deepEqual(validatePackagePrices({ ...DEFAULT_PACKAGE_PRICES, extraPerPerson: 500000 }), []);
});

test('isAdminEmail: email quan tri dung du co khoang trang / chu hoa, email khac thi khong', () => {
  const { isAdminEmail } = portfolioLogicModule as unknown as {
    isAdminEmail: (email: string | null | undefined) => boolean;
  };
  assert.equal(isAdminEmail('anhyenk26@gmail.com'), true);
  assert.equal(isAdminEmail('  anhyenk26@gmail.com  '), true);
  assert.equal(isAdminEmail('AnhYenK26@Gmail.Com'), true);
  assert.equal(isAdminEmail('  ANHYENK26@GMAIL.COM '), true);
  assert.equal(isAdminEmail('khach@gmail.com'), false);
  assert.equal(isAdminEmail('anhyenk26@gmail.com.vn'), false);
  assert.equal(isAdminEmail(''), false);
  assert.equal(isAdminEmail(null), false);
  assert.equal(isAdminEmail(undefined), false);
});

test('proofing: normalize + validate ma don KY-...', () => {
  assert.equal(normalizeProofingCode(' ky-12345 '), 'KY-12345');
  assert.equal(normalizeProofingCode('KY-1234567'), 'KY-1234567');
  assert.equal(isValidProofingCode('KY-12345'), true);
  assert.equal(isValidProofingCode('ky-1234567'), true);
  assert.equal(isValidProofingCode('KY-123'), false);
  assert.equal(isValidProofingCode('KY-'), false);
  assert.equal(isValidProofingCode('12345'), false);
  assert.equal(isValidProofingCode(''), false);
  assert.equal(isValidProofingCode('KY-12 34'), false);
});

test('proofing: extractPhoneSuffix lay 4 so cuoi SDT', () => {
  assert.equal(extractPhoneSuffix('0961230500'), '0500');
  assert.equal(extractPhoneSuffix('0961 230 500'), '0500');
  assert.equal(extractPhoneSuffix('+84 961 230 500'), '0500');
  assert.equal(extractPhoneSuffix('0123'), '0123');
  assert.equal(extractPhoneSuffix('123'), '');
  assert.equal(extractPhoneSuffix(''), '');
});

test('proofing: matchesPhoneSuffix chi khop dung 4 so cuoi', () => {
  assert.equal(matchesPhoneSuffix('0961230500', '0500'), true);
  assert.equal(matchesPhoneSuffix('0961 230 500', '0500'), true);
  assert.equal(matchesPhoneSuffix('0961230500', '0501'), false);
  assert.equal(matchesPhoneSuffix('0961230500', '500'), false);
  assert.equal(matchesPhoneSuffix('0961230500', ''), false);
  assert.equal(matchesPhoneSuffix('', '0500'), false);
});

test('proofing: gioi han 30 anh/don va query limit 50', () => {
  assert.equal(MAX_PROOFING_PHOTOS_PER_LEAD, 30);
  assert.equal(PROOFING_QUERY_LIMIT, 50);
});

test('content: merge dung mac dinh khi thieu truong hoac rong', () => {
  const merged = mergeSiteContent({});
  assert.deepEqual(merged, DEFAULT_SITE_CONTENT);
  const partial = mergeSiteContent({ heroTitle: 'Tieu de moi', aboutName: '' });
  assert.equal(partial.heroTitle, 'Tieu de moi');
  assert.equal(partial.aboutName, DEFAULT_SITE_CONTENT.aboutName);
  assert.equal(partial.heroSubtitle, DEFAULT_SITE_CONTENT.heroSubtitle);
  const withDesc = mergeSiteContent({ packageDescriptions: { 'aodai-solo': 'Mo ta moi' } });
  assert.equal(withDesc.packageDescriptions['aodai-solo'], 'Mo ta moi');
  assert.equal(withDesc.packageDescriptions['kiyieu-lop'], DEFAULT_SITE_CONTENT.packageDescriptions['kiyieu-lop']);
  assert.equal(mergeSiteContent(null).heroTitle, DEFAULT_SITE_CONTENT.heroTitle);
  assert.equal(mergeSiteContent('chuoi lac').footerTagline, DEFAULT_SITE_CONTENT.footerTagline);
});

test('content: sanitize loai bo the HTML, cat chuoi qua dai', () => {
  assert.equal(sanitizePlainText('<b>Xin chao</b> moi nguoi', 200), 'Xin chao moi nguoi');
  assert.equal(sanitizePlainText('<script>alert(1)</script>An toan', 200), 'alert(1)An toan');
  assert.equal(sanitizePlainText('<img src=x onerror=alert(1)>', 200), '');
  assert.equal(sanitizePlainText('a'.repeat(300), 200).length, 200);
  assert.equal(sanitizePlainText(123 as unknown as string, 200), '');
  const merged = mergeSiteContent({ heroTitle: '<script>x</script>Tieu de that' });
  assert.equal(merged.heroTitle, 'xTieu de that');
  assert.ok(!merged.heroTitle.includes('<'));
});

test('content (v7.2): nut Hero mac dinh khop hanh dong — chinh xem album, phu mo dat lich', () => {
  assert.ok(DEFAULT_SITE_CONTENT.heroPrimaryCta.includes('Album'));
  assert.ok(DEFAULT_SITE_CONTENT.heroSecondaryCta.includes('Đặt Lịch'));
});

test('content (v7.2): mergeSiteContent hoan doi cap nhan Hero cua v7.1', () => {
  const fixed = mergeSiteContent({
    heroPrimaryCta: 'Đặt Lịch Chụp',
    heroSecondaryCta: 'Xem Album Tác Phẩm',
  });
  assert.equal(fixed.heroPrimaryCta, 'Xem Album Tác Phẩm');
  assert.equal(fixed.heroSecondaryCta, 'Đặt Lịch Chụp');
});

test('content (v7.2): mergeSiteContent sua cap nhan Hero cua v6 (phu "Bảng Giá & Đặt Lịch")', () => {
  const fixed = mergeSiteContent({
    heroPrimaryCta: 'Xem Album Tác Phẩm',
    heroSecondaryCta: 'Bảng Giá & Đặt Lịch',
  });
  assert.equal(fixed.heroPrimaryCta, 'Xem Album Tác Phẩm');
  assert.equal(fixed.heroSecondaryCta, 'Đặt Lịch Chụp');
});

test('content (v7.2): mergeSiteContent giu nguyen cap nhan Hero dung', () => {
  const kept = mergeSiteContent({
    heroPrimaryCta: 'Xem Album Tác Phẩm',
    heroSecondaryCta: 'Đặt Lịch Chụp',
  });
  assert.equal(kept.heroPrimaryCta, 'Xem Album Tác Phẩm');
  assert.equal(kept.heroSecondaryCta, 'Đặt Lịch Chụp');
});

test('content: validate bao loi khi vuot gioi han, hop le thi rong', () => {
  assert.deepEqual(validateSiteContent(DEFAULT_SITE_CONTENT), []);
  assert.deepEqual(validateSiteContent({}), []);
  const tooLong = validateSiteContent({ heroTitle: 'x'.repeat(201) });
  assert.ok(tooLong.length > 0);
  assert.ok(tooLong.some((e) => e.includes('Tiêu đề chính Hero')));
  const badType = validateSiteContent({ heroTitle: 123 });
  assert.ok(badType.length > 0);
  const badDesc = validateSiteContent({ packageDescriptions: { 'aodai-solo': 'y'.repeat(201) } });
  assert.ok(badDesc.length > 0);
  assert.deepEqual(validateSiteContent({ heroTitle: 'OK', packageDescriptions: { 'kiyieu-lop': 'Mo ta ngan' } }), []);
});

test('content: splitMarqueeItems tach muc theo dau ·', () => {
  const items = splitMarqueeItems(DEFAULT_SITE_CONTENT.marqueeText);
  assert.ok(items.length >= 5);
  assert.equal(items[0], 'KỈ YẾU HỌC SINH & SINH VIÊN');
  assert.deepEqual(splitMarqueeItems('A · B ·  · C'), ['A', 'B', 'C']);
  assert.deepEqual(splitMarqueeItems(''), []);
});

test('seo: describePhotoAlt ghep tieu de + dia diem, khong lap lai dia diem', () => {
  assert.equal(
    describePhotoAlt({ vietnameseTitle: 'Hương Sen Bách Diệp', location: 'Tây Hồ, Hà Nội' }),
    'Hương Sen Bách Diệp — Tây Hồ, Hà Nội'
  );
  assert.equal(
    describePhotoAlt({ vietnameseTitle: 'Tà Áo Trắng Chu Văn An', location: 'Chu Văn An, Hà Nội' }),
    'Tà Áo Trắng Chu Văn An'
  );
  assert.equal(describePhotoAlt({ vietnameseTitle: '', location: 'Văn Miếu' }), 'Ảnh chụp tại Văn Miếu — Yên Photo');
  assert.equal(describePhotoAlt({}), 'Ảnh chụp bởi Yên Photo');
});

// --- v7.5: tra cuu don moi may (public_orders) ---

test('v7.5 buildPublicOrder chi giu truong toi thieu, loai email/notes/cancelReason', () => {
  const lead: any = {
    id: 'KY-12345',
    clientName: 'Nguyễn Thu Trang',
    email: 'thutrang@gmail.com',
    phone: '0961 230 500',
    packageType: 'aodai-solo',
    preferredDate: '2026-12-01',
    timeSlot: 'sang-7-9',
    status: 'deposited',
    estimatedPrice: 650000,
    depositAmount: 195000,
    paidAmount: 195000,
    balance: 455000,
    driveLink: 'https://drive.google.com/drive/folders/xyz',
    notes: 'Ghi chu noi bo: khach kho tinh',
    message: 'Concept rieng cua khach',
    cancelReason: 'Ly do huy neu co',
    groupSize: '1 - 2 bạn',
    source: 'web_form',
    emailSentTo: 'anhyenk26@gmail.com',
    emailSentAt: '10:00, 05/11/2026',
  };
  const pub = buildPublicOrder(lead);
  assert.equal(pub.id, 'KY-12345');
  assert.equal(pub.clientName, 'Nguyễn Thu Trang');
  assert.equal(pub.phone, '0961230500');
  assert.equal(pub.packageType, 'aodai-solo');
  assert.equal(pub.status, 'deposited');
  assert.equal(pub.preferredDate, '2026-12-01');
  assert.equal(pub.timeSlot, 'sang-7-9');
  assert.equal(pub.estimatedPrice, 650000);
  assert.equal(pub.depositAmount, 195000);
  assert.equal(pub.paidAmount, 195000);
  assert.equal(pub.balance, 455000);
  assert.equal(pub.driveLink, 'https://drive.google.com/drive/folders/xyz');
  assert.ok(pub.updatedAt.length > 0);
  // Khong co truong nhay cam nao lot sang ban ghi cong khai.
  const keys = Object.keys(pub);
  for (const forbidden of ['email', 'notes', 'message', 'cancelReason', 'groupSize', 'source', 'emailSentTo', 'emailSentAt']) {
    assert.ok(!keys.includes(forbidden), `public order khong duoc co truong ${forbidden}`);
  }
});

test('v7.5 buildPublicOrder tinh lai balance khi lead chua co', () => {
  const pub = buildPublicOrder({
    id: 'KY-99999',
    clientName: 'A B',
    phone: '+84 961 230 500',
    packageType: 'kiyieu-lop',
    preferredDate: '2026-12-05',
    status: 'new',
    estimatedPrice: 1200000,
    depositAmount: 360000,
    paidAmount: 360000,
    balance: undefined,
    driveLink: '',
  } as any);
  assert.equal(pub.phone, '0961230500');
  assert.equal(pub.balance, 840000);
});

test('v7.5 doi chieu SDT tra cuu: chuan hoa ca 2 ben, khac so thi khong khop', () => {
  assert.equal(matchesPublicOrderPhone('0961230500', '0961 230 500'), true);
  assert.equal(matchesPublicOrderPhone('0961230500', '+84 961 230 500'), true);
  assert.equal(matchesPublicOrderPhone('0961 230 500', '0961230500'), true);
  assert.equal(matchesPublicOrderPhone('0961230500', '0961230501'), false);
  assert.equal(matchesPublicOrderPhone('0961230500', '0987654321'), false);
  assert.equal(matchesPublicOrderPhone('0961230500', ''), false);
  assert.equal(matchesPublicOrderPhone('', '0961230500'), false);
});

test('v7.5 validatePaidAmount: am / vuot tong tien thi loi, 0 va bang tong thi hop le', () => {
  assert.equal(validatePaidAmount(-1, 650000), 'Tiền đã thu phải là số nguyên từ 0 VNĐ trở lên.');
  assert.equal(validatePaidAmount(650001, 650000), 'Đã thu không vượt quá tổng tiền đơn');
  assert.equal(validatePaidAmount(1000000, 650000), 'Đã thu không vượt quá tổng tiền đơn');
  assert.equal(validatePaidAmount(195000.5, 650000), 'Tiền đã thu phải là số nguyên từ 0 VNĐ trở lên.');
  assert.equal(validatePaidAmount(0, 650000), null);
  assert.equal(validatePaidAmount(195000, 650000), null);
  assert.equal(validatePaidAmount(650000, 650000), null);
});

test('v7.6 getFirestoreErrorCode: trich ma tu .code, message tieng Anh, JSON-stringified, ma Storage', () => {
  assert.equal(getFirestoreErrorCode({ code: 'firestore/permission-denied' }), 'permission-denied');
  assert.equal(getFirestoreErrorCode({ code: 'permission-denied' }), 'permission-denied');
  assert.equal(
    getFirestoreErrorCode(new Error('FirebaseError: Missing or insufficient permissions.')),
    'permission-denied'
  );
  assert.equal(
    getFirestoreErrorCode(new Error(JSON.stringify({ code: 'permission-denied', error: 'x' }))),
    'permission-denied'
  );
  assert.equal(
    getFirestoreErrorCode(new Error(JSON.stringify({ error: 'FirebaseError: Missing or insufficient permissions.' }))),
    'permission-denied'
  );
  assert.equal(getFirestoreErrorCode({ code: 'storage/unauthorized' }), 'storage/unauthorized');
  assert.equal(
    getFirestoreErrorCode(new Error('FirebaseError: User is not authorized. (storage/unauthorized)')),
    'storage/unauthorized'
  );
  assert.equal(getFirestoreErrorCode(new Error('The client is offline')), 'unavailable');
  assert.equal(getFirestoreErrorCode(new Error('something else entirely')), 'unknown');
  assert.equal(getFirestoreErrorCode(null), 'unknown');
});

test('v7.6 translateCloudError: dich ma loi sang huong dan tieng Viet cu the', () => {
  const denied = translateCloudError({ code: 'permission-denied' });
  assert.ok(denied.includes('deploy nhầm database'));
  assert.ok(denied.includes(FIRESTORE_DATABASE_ID));
  assert.ok(translateCloudError({ code: 'unavailable' }).includes('Mất mạng'));
  assert.ok(translateCloudError({ code: 'unauthenticated' }).includes('anhyenk26@gmail.com'));
  const storage = translateCloudError({ code: 'storage/unauthorized' });
  assert.ok(storage.includes('Storage rules chưa deploy'));
  const stalled = translateCloudError(Object.assign(new Error('ket'), { code: 'upload-stalled' }));
  assert.ok(stalled.includes('đổi wifi/4G'));
  const other = translateCloudError({ code: 'weird-code' });
  assert.ok(other.includes('weird-code'));
});

test('v7.6 decideLeadWriteMode: doc da co thi update, chua co thi create', () => {
  assert.equal(decideLeadWriteMode(true), 'update');
  assert.equal(decideLeadWriteMode(false), 'create');
});

test('v7.6 stripUndefinedFields: loai undefined, giu 0 / chuoi rong / false', () => {
  assert.deepEqual(stripUndefinedFields({ a: 1, b: undefined, c: 0, d: '', e: false }), {
    a: 1,
    c: 0,
    d: '',
    e: false,
  });
});

test('v7.6 isUploadStalled: qua timeout thi ket, dung timeout thi chua ket', () => {
  assert.equal(isUploadStalled(0, 20001), true);
  assert.equal(isUploadStalled(0, 20000), false);
  assert.equal(isUploadStalled(0, 1000), false);
  assert.equal(isUploadStalled(1000, 121001, 120000), true);
  assert.equal(isUploadStalled(1000, 121000, 120000), false);
});

// --- v7.7: hang doi tai nen + anh lac quan ---

function makeJob(id: string, status: UploadJob['status'], progress = 0, attempts = 1): UploadJob {
  return {
    id,
    label: id,
    status,
    progress,
    attempts,
    run: async () => {},
  };
}

test('v7.7 selectJobsToStart: toi da 4 job cung luc, uu tien job cho truoc', () => {
  assert.equal(MAX_CONCURRENT_UPLOADS, 4);
  const queued = Array.from({ length: 6 }, (_, i) => makeJob(`q${i}`, 'queued'));
  assert.deepEqual(selectJobsToStart(queued).map((j) => j.id), ['q0', 'q1', 'q2', 'q3']);
  const mixed = [
    makeJob('r0', 'uploading'),
    makeJob('r1', 'uploading'),
    makeJob('q0', 'queued'),
    makeJob('q1', 'queued'),
    makeJob('q2', 'queued'),
  ];
  assert.deepEqual(selectJobsToStart(mixed).map((j) => j.id), ['q0', 'q1']);
  const full = Array.from({ length: 4 }, (_, i) => makeJob(`r${i}`, 'uploading'));
  assert.deepEqual(selectJobsToStart([...full, makeJob('q0', 'queued')]), []);
  assert.deepEqual(selectJobsToStart([]), []);
});

test('v7.7 computeQueueProgress: dem xong/tong + % trung binh tien do', () => {
  assert.deepEqual(computeQueueProgress([]), { done: 0, total: 0, percent: 100 });
  const jobs = [
    makeJob('a', 'done', 100),
    makeJob('b', 'uploading', 50),
    makeJob('c', 'queued', 0),
  ];
  assert.deepEqual(computeQueueProgress(jobs), { done: 1, total: 3, percent: 50 });
});

test('v7.7 shouldRetryJob + retryDelayMs: thu lai toi da 3 lan, cho 2s roi 5s', () => {
  assert.equal(MAX_UPLOAD_ATTEMPTS, 3);
  assert.equal(shouldRetryJob(makeJob('a', 'error', 0, 1)), true);
  assert.equal(shouldRetryJob(makeJob('a', 'error', 0, 2)), true);
  assert.equal(shouldRetryJob(makeJob('a', 'error', 0, 3)), false);
  assert.equal(shouldRetryJob(makeJob('a', 'done', 100, 1)), false);
  assert.equal(shouldRetryJob(makeJob('a', 'uploading', 10, 1)), false);
  assert.equal(retryDelayMs(1), 2000);
  assert.equal(retryDelayMs(2), 5000);
  assert.equal(retryDelayMs(3), 5000);
});

test('v7.7 mapWithConcurrency: tra ket qua dung thu tu, loi khong dung ca loat', async () => {
  const out = await mapWithConcurrency([1, 2, 3, 4], 2, async (n) => {
    if (n === 3) throw new Error('hong');
    return n * 10;
  });
  assert.equal(out.length, 4);
  assert.deepEqual(out[0], { ok: true, value: 10 });
  assert.deepEqual(out[1], { ok: true, value: 20 });
  assert.equal(out[2].ok, false);
  assert.deepEqual(out[3], { ok: true, value: 40 });
});

test('v7.7 mergeOptimisticPhotos: anh moi len truoc, anh sua hien ban xem truoc', () => {
  const base = [
    { id: 'a', image: 'cloud-a.jpg', vietnameseTitle: 'A' },
    { id: 'b', image: 'cloud-b.jpg', vietnameseTitle: 'B' },
  ] as PhotoItem[];
  const pending = [{ id: 'new', image: 'blob:preview', vietnameseTitle: 'Moi' }] as PhotoItem[];
  const merged = mergeOptimisticPhotos(base, pending, { a: 'blob:edit-a' });
  assert.deepEqual(merged.map((p) => p.id), ['new', 'a', 'b']);
  assert.equal(merged[1].image, 'blob:edit-a');
  assert.equal(merged[2].image, 'cloud-b.jpg');
  // Mang goc khong bi sua doi.
  assert.equal(base[0].image, 'cloud-a.jpg');
  assert.deepEqual(mergeOptimisticPhotos(base, [], {}), base);
  // Sua anh moi dang dong bo: ban xem truoc moi nhat ap ca len anh lac quan.
  const editedPending = mergeOptimisticPhotos(base, pending, { new: 'blob:edit-new' });
  assert.equal(editedPending[0].image, 'blob:edit-new');
});
