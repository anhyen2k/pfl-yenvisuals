/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterPhotos,
  formatExifString,
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
  PhotoItem,
} from './portfolioLogic.js';
import * as portfolioLogicModule from './portfolioLogic.js';

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
    location: 'Trường ĐH Sư Phạm Hà Nội & Hoàng Thành Thăng Long',
    message: 'Lớp 40 người cần chụp kỉ yếu áo dài và áo cử nhân',
  };
  assert.equal(validateBookingInquiry(valid).isValid, true);

  // User scenario: short note 'hi' like in the screenshot
  const validWithShortMessage = {
    clientName: 'Kim chi',
    email: 'kimchi@gmail.com',
    phone: '01212320',
    packageType: 'aodai-solo' as const,
    preferredDate: '2027-02-01',
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
    preferredDate: '2026-12-01',
    message: '',
  };
  assert.equal(validateBookingInquiry(validEmptyMessage).isValid, true);
});

test('createBookingLead generates lead and formatted email notification to anhyenk26@gmail.com', () => {
  const inquiry = {
    clientName: 'Hoàng Lan',
    email: 'hoanglan@gmail.com',
    phone: '0912345678',
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
  assert.ok(emailLog.fullBody.includes('0912345678'));
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

