/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Users,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  Settings,
  Image as ImageIcon,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Trash2,
  Copy,
  Send,
  Eye,
  Camera,
  GraduationCap,
  LogOut,
  Loader2,
} from 'lucide-react';
import {
  BookingLead,
  BookingStatus,
  EmailNotificationLog,
  PhotoItem,
  filterLeads,
  calculateDashboardStats,
  calculateDepositAmount,
  formatStatusLabel,
  formatVND,
  timeSlotLabel,
  exportLeadsToCsv,
  exportLeadsToExcel,
  getPackageDetails,
  sendBookingEmailReal,
  DEFAULT_PACKAGE_PRICES,
  validatePackagePrices,
  type PackagePrices,
} from '../utils/portfolioLogic';
import { SITE_CONFIG } from '../config/site';
import { ProofingManager } from './ProofingManager';
import {
  DEFAULT_SITE_CONTENT,
  CONTENT_FIELD_LIMITS,
  CONTENT_FIELD_LABELS,
  mergeSiteContent,
  validateSiteContent,
  type SiteContent,
  type PackageId,
} from '../config/content';

interface DashboardViewProps {
  leads: BookingLead[];
  onUpdateLeadStatus: (leadId: string, status: BookingStatus) => void;
  onUpdateLead?: (leadId: string, updates: Partial<BookingLead>) => void;
  onUpdateLeadNotes: (leadId: string, notes: string) => void;
  onDeleteLead: (leadId: string) => void;
  onAddManualLead: (lead: Omit<BookingLead, 'id' | 'createdAt' | 'emailSentAt' | 'emailSentTo'>) => void;
  emailLogs: EmailNotificationLog[];
  onSendTestEmail: () => void;
  photographerEmail: string;
  onUpdatePhotographerEmail: (email: string) => void;
  photos: PhotoItem[];
  onToggleFeaturedPhoto: (photoId: string) => void;
  onDeletePhoto: (photoId: string) => void;
  onOpenAddPhoto: () => void;
  onExitDashboard: () => void;
  onLogoutAdmin?: () => void;
  currentUser?: any;
  onGoogleLogin?: () => void;
  /** Bang gia hien hanh (tu App / Firestore); khong truyen thi dung gia mac dinh. */
  packagePrices?: PackagePrices;
  /** Thoi gian luu bang gia lan cuoi (chuoi vi-VN); khong co thi khong hien. */
  pricingUpdatedAt?: string;
  /** Luu bang gia moi (App ghi Firestore + setState); khong truyen thi nut Luu bao loi. */
  onSavePackagePrices?: (prices: PackagePrices) => Promise<void>;
  /**
   * (v6) CHI ADMIN moi thay/nhan duoc cac prop nay. Dashboard chi render khi
   * userRole la admin (App), nhung neu co duong nao mo duoc Settings thi
   * cac muc Noi dung / Bang gia van bi chan o day (isAdmin=false -> chi xem
   * + nut Luu bao loi, khong goi Firestore). Mac dinh false = chan.
   */
  isAdmin?: boolean;
  /** Noi dung giao dien hien hanh (tu App / Firestore); khong truyen thi dung mac dinh. */
  siteContent?: SiteContent;
  /** Thoi gian luu noi dung lan cuoi (chuoi vi-VN); khong co thi khong hien. */
  contentUpdatedAt?: string;
  /** Luu noi dung moi (App ghi Firestore + setState); khong truyen thi nut Luu bao loi. */
  onSaveSiteContent?: (content: SiteContent) => Promise<void>;
}

/* ---- Helpers nội bộ cho Dashboard (chỉ dùng trong file này) ---- */

// Ngày hôm nay theo giờ địa phương (Hà Nội), dạng YYYY-MM-DD.
// Không dùng todayISO() UTC của portfolioLogic vì ở Hà Nội 0h–7h sáng
// ngày UTC vẫn là hôm trước, sẽ lệch 1 ngày cho "quá hạn / sắp chụp".
function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// createdAt được lưu dạng chuỗi vi-VN "HH:mm, DD/MM/YYYY" (xem createBookingLead),
// không sort trực tiếp được nên parse ra timestamp; chuỗi ISO vẫn parse được,
// chuỗi lạ thì fallback Date.parse, cuối cùng là 0 (giữ nguyên thứ tự gốc).
function parseCreatedAtMs(value: string): number {
  if (!value) return 0;
  const m = value.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?[^0-9]*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const [, hh, mm, ss, dd, mo, yyyy] = m;
    return new Date(
      Number(yyyy),
      Number(mo) - 1,
      Number(dd),
      Number(hh),
      Number(mm),
      Number(ss || 0)
    ).getTime();
  }
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
}

// Tiền còn lại: ưu tiên trường balance đã lưu, fallback đúng công thức
// đã dùng ở bảng + calculateDashboardStats: estimatedPrice - paidAmount.
function leadBalance(lead: BookingLead): number {
  return lead.balance ?? Math.max(0, (lead.estimatedPrice || 0) - (lead.paidAmount || 0));
}

// SĐT chuẩn hoá cho tel:/zalo.me: chỉ giữ số, đầu 84 -> 0 (như normalizePhone).
function leadPhoneDigits(phone: string): string {
  let digits = (phone || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('84')) digits = '0' + digits.slice(2);
  return digits;
}

// ---- Form sua bang gia (tab Settings, muc 2) ----
// Ten + mo ta hien thi cua tung goi. Luu y: PackagePrices chi co gia
// (khong co truong desc) nen mo ta chi de hien thi, khong sua/luu.
const PACKAGE_FORM_META: { id: BookingLead['packageType']; name: string; desc: string }[] = [
  { id: 'aodai-solo', name: 'Áo Dài Nàng Thơ & Cá Nhân', desc: '1.5 - 2h chụp, hướng dẫn tạo dáng, 15 ảnh chỉnh da' },
  { id: 'kiyieu-lop', name: 'Kỉ Yếu Nhóm Bạn Thân (5-15 bạn)', desc: 'Chụp kĩ từng bạn, trả 100% file gốc, 30 ảnh chỉnh màu' },
  { id: 'cophuc-heritage', name: 'Áo Dài Cổ Phục & Mùa Thu', desc: 'Chụp di tích Hoàng Thành, Văn Miếu, tặng mượn nón lá' },
  { id: 'photobook-print', name: 'Gói Rửa Ảnh & Set Để Bàn', desc: 'In 20 ảnh lụa mini + 1 khung ảnh để bàn 15x21cm' },
];

// (v6) Nhom truong sua noi dung giao dien (tab Cai dat, muc 2).
// Gioi han ky tu lay tu CONTENT_FIELD_LIMITS (config/content.ts).
type ContentTextField = keyof Omit<SiteContent, 'packageDescriptions'>;
const CONTENT_FORM_GROUPS: { title: string; fields: { key: ContentTextField; multiline?: boolean; hint?: string }[] }[] = [
  {
    title: 'Hero — Tiêu đề, mô tả & nút bấm',
    fields: [
      { key: 'heroTitle', multiline: true },
      { key: 'heroSubtitle', multiline: true },
      { key: 'heroPrimaryCta', hint: 'Nút chính — bấm vào sẽ mở form đặt lịch.' },
      { key: 'heroSecondaryCta', hint: 'Nút phụ — bấm vào sẽ cuộn xuống xem album.' },
      { key: 'marqueeText', multiline: true },
    ],
  },
  {
    title: 'Về tôi — Tên, vai trò & giới thiệu',
    fields: [
      { key: 'aboutName' },
      { key: 'aboutRole' },
      { key: 'aboutBioShort', multiline: true },
      { key: 'aboutBioLong', multiline: true },
    ],
  },
  {
    title: 'Liên hệ — Khu vực, giờ làm việc & ghi chú',
    fields: [
      { key: 'contactAreas', multiline: true },
      { key: 'contactHours' },
      { key: 'contactNote', multiline: true },
    ],
  },
  {
    title: 'Footer — Tagline cuối trang',
    fields: [{ key: 'footerTagline', multiline: true }],
  },
];

// "650000" -> "650.000" (hien trong o nhap gia); nhap so tho, dinh dang khi go.
function formatPriceText(vnd: number): string {
  return new Intl.NumberFormat('vi-VN').format(vnd);
}

function parsePriceText(text: string): number {
  const digits = (text || '').replace(/[^0-9]/g, '');
  return digits ? Number(digits) : 0;
}

// Gia rut gon kieu "650k" / "1.200k" (option chon goi, ghi chu phu phi).
function formatPriceK(vnd: number): string {
  return `${formatPriceText(Math.round(vnd / 1000))}k`;
}

function formatPriceDrafts(prices: PackagePrices): Record<BookingLead['packageType'], string> {
  return {
    'aodai-solo': formatPriceText(prices['aodai-solo']),
    'kiyieu-lop': formatPriceText(prices['kiyieu-lop']),
    'cophuc-heritage': formatPriceText(prices['cophuc-heritage']),
    'photobook-print': formatPriceText(prices['photobook-print']),
  };
}

// Quá hạn gọi lại: có hẹn gọi lại trước hôm nay và vẫn đang chờ tư vấn.
function isOverdueFollowUp(lead: BookingLead, today: string): boolean {
  return Boolean(
    lead.nextFollowUpAt &&
      lead.nextFollowUpAt < today &&
      (lead.status === 'new' || lead.status === 'consulting')
  );
}

// Cần gọi (hẹn gọi lại đến hôm nay trở về trước, vẫn đang chờ tư vấn).
// Tương đương filter 'due-today' của portfolioLogic, nhưng so với ngày địa phương.
function isDueCall(lead: BookingLead, today: string): boolean {
  return Boolean(
    lead.nextFollowUpAt &&
      lead.nextFollowUpAt <= today &&
      (lead.status === 'new' || lead.status === 'consulting')
  );
}

// Chưa cọc: số tiền đã trả ít hơn tiền cọc theo gói, đơn chưa hủy.
function isUnpaidDeposit(lead: BookingLead): boolean {
  return lead.status !== 'cancelled' && (lead.paidAmount || 0) < (lead.depositAmount || 0);
}

// Sắp chụp trong 7 ngày: ngày chụp từ hôm nay đến hôm nay + 7 ngày,
// đơn chưa hủy và chưa hoàn thành (đã chụp xong thì không còn "sắp chụp").
function isShootingSoon(lead: BookingLead, today: string): boolean {
  if (!lead.preferredDate || lead.status === 'cancelled' || lead.status === 'completed') {
    return false;
  }
  return lead.preferredDate >= today && lead.preferredDate <= addDaysISO(today, 7);
}

// Sắp chụp trong 7 ngày mà chưa cọc.
function isShootingSoonUnpaid(lead: BookingLead, today: string): boolean {
  return isShootingSoon(lead, today) && isUnpaidDeposit(lead);
}

// Chưa trả ảnh: ngày chụp đã tới/quá mà chưa có link Drive, đơn chưa hủy.
// (Trạng thái 'completed' nghĩa là "Đã Chụp & Trả Ảnh" nên chỉ tính đơn
// chưa hoàn thành; đơn tương lai chưa chụp thì chưa đến lúc trả ảnh.)
function isUndeliveredPhotos(lead: BookingLead, today: string): boolean {
  return (
    lead.status !== 'cancelled' &&
    lead.status !== 'completed' &&
    Boolean(lead.preferredDate) &&
    lead.preferredDate <= today &&
    !(lead.driveLink || '').trim()
  );
}

// Việc cần làm hôm nay: cần gọi lại, hoặc sắp chụp chưa cọc, hoặc chưa trả ảnh.
function isTodoLead(lead: BookingLead, today: string): boolean {
  return (
    isDueCall(lead, today) || isShootingSoonUnpaid(lead, today) || isUndeliveredPhotos(lead, today)
  );
}

// Tìm kiếm nội bộ (thay cho phần search của filterLeads vì filterLeads
// không tìm theo mã đơn): tên, SĐT (cả dạng có/không có khoảng trắng,
// đầu 84 hay 0), mã đơn KY-... (cả khi gõ thiếu dấu "-"), email, địa điểm,
// ghi chú, lời nhắn.
function matchesLeadSearch(lead: BookingLead, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const qDigits = q.replace(/[^0-9]/g, '');
  const qFlat = q.replace(/[\s-]/g, '');
  const haystacks = [
    lead.clientName,
    lead.phone,
    lead.email,
    lead.location,
    lead.notes || '',
    lead.message || '',
    lead.id,
  ].map((s) => (s || '').toLowerCase());
  if (haystacks.some((h) => h.includes(q))) return true;
  if (haystacks.some((h) => h.replace(/[\s-]/g, '').includes(qFlat) && qFlat.length > 0)) {
    return true;
  }
  if (qDigits.length >= 3 && leadPhoneDigits(lead.phone).includes(qDigits)) return true;
  return false;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  onUpdateLeadStatus,
  onUpdateLead,
  onUpdateLeadNotes,
  onDeleteLead,
  onAddManualLead,
  emailLogs,
  onSendTestEmail,
  photographerEmail,
  onUpdatePhotographerEmail,
  photos,
  onToggleFeaturedPhoto,
  onDeletePhoto,
  onOpenAddPhoto,
  onExitDashboard,
  onLogoutAdmin,
  currentUser,
  onGoogleLogin,
  packagePrices,
  pricingUpdatedAt,
  onSavePackagePrices,
  isAdmin = false,
  siteContent,
  contentUpdatedAt,
  onSaveSiteContent,
}) => {
  const effectivePrices = packagePrices ?? DEFAULT_PACKAGE_PRICES;

  // --- Form sua bang gia (tab Settings, muc 2) ---
  const [priceDrafts, setPriceDrafts] = useState<Record<BookingLead['packageType'], string>>(() =>
    formatPriceDrafts(effectivePrices)
  );
  const [extraDraft, setExtraDraft] = useState<string>(() => formatPriceText(effectivePrices.extraPerPerson));
  const [priceErrors, setPriceErrors] = useState<string[]>([]);
  const [priceSaveMsg, setPriceSaveMsg] = useState<string | null>(null);
  const [isSavingPrices, setIsSavingPrices] = useState(false);

  // Gia tu App / Firestore ve sau (load async, subscribe live) thi nap lai form.
  useEffect(() => {
    if (!packagePrices) return;
    setPriceDrafts(formatPriceDrafts(packagePrices));
    setExtraDraft(formatPriceText(packagePrices.extraPerPerson));
    setPriceErrors([]);
  }, [packagePrices]);

  const handlePriceInputChange = (key: BookingLead['packageType'], raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    setPriceDrafts((prev) => ({ ...prev, [key]: digits ? formatPriceText(Number(digits)) : '' }));
  };

  const handleExtraInputChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    setExtraDraft(digits ? formatPriceText(Number(digits)) : '');
  };

  const handleSavePackagePrices = async () => {
    // (v6) Chan client-side truoc khi goi Firestore (them lop nua ngoai
    // requireAdmin trong firebase.ts + rules tren Cloud).
    if (!isAdmin) {
      setPriceErrors(['Chỉ quản trị viên mới được đổi giá. Vui lòng đăng nhập Google bằng anhyenk26@gmail.com.']);
      setPriceSaveMsg(null);
      return;
    }
    const candidate: PackagePrices = {
      'aodai-solo': parsePriceText(priceDrafts['aodai-solo']),
      'kiyieu-lop': parsePriceText(priceDrafts['kiyieu-lop']),
      'cophuc-heritage': parsePriceText(priceDrafts['cophuc-heritage']),
      'photobook-print': parsePriceText(priceDrafts['photobook-print']),
      extraPerPerson: parsePriceText(extraDraft),
    };
    const errors = validatePackagePrices(candidate);
    if (errors.length > 0) {
      setPriceErrors(errors);
      setPriceSaveMsg(null);
      return;
    }
    if (!onSavePackagePrices) {
      setPriceErrors(['Chưa cấu hình lưu giá (thiếu onSavePackagePrices) — giá chưa được lưu.']);
      setPriceSaveMsg(null);
      return;
    }
    setPriceErrors([]);
    setPriceSaveMsg(null);
    setIsSavingPrices(true);
    try {
      await onSavePackagePrices(candidate);
      setPriceSaveMsg('Đã lưu bảng giá mới! Giá mới áp dụng ngay cho đơn đặt mới.');
      triggerCopyToast('Đã lưu bảng giá mới!');
    } catch (e: any) {
      setPriceErrors([e?.message || 'Lưu giá thất bại, vui lòng thử lại.']);
    } finally {
      setIsSavingPrices(false);
    }
  };

  const handleResetPackagePrices = async () => {
    if (!isAdmin) {
      setPriceErrors(['Chỉ quản trị viên mới được khôi phục giá mặc định.']);
      setPriceSaveMsg(null);
      return;
    }
    if (!window.confirm('Khôi phục toàn bộ bảng giá về giá mặc định (650k / 1.200k / 850k / 450k, phí vượt người 80k)? Giá mặc định sẽ được lưu và áp dụng ngay cho đơn đặt mới.')) return;
    setPriceDrafts(formatPriceDrafts(DEFAULT_PACKAGE_PRICES));
    setExtraDraft(formatPriceText(DEFAULT_PACKAGE_PRICES.extraPerPerson));
    setPriceErrors([]);
    if (!onSavePackagePrices) {
      setPriceSaveMsg('Đã đặt lại giá mặc định trong form — bấm "Lưu giá" để áp dụng.');
      return;
    }
    setIsSavingPrices(true);
    try {
      await onSavePackagePrices({ ...DEFAULT_PACKAGE_PRICES });
      setPriceSaveMsg('Đã khôi phục giá mặc định!');
      triggerCopyToast('Đã khôi phục giá mặc định!');
    } catch (e: any) {
      setPriceErrors([e?.message || 'Khôi phục giá mặc định thất bại, vui lòng thử lại.']);
    } finally {
      setIsSavingPrices(false);
    }
  };

  // --- (v6) Don dang mo muc proofing (tab Leads, ca desktop + mobile) ---
  const [expandedProofingLeadId, setExpandedProofingLeadId] = useState<string | null>(null);

  // --- (v6) Form sua noi dung giao dien (tab Settings, muc 2) ---
  const [contentDrafts, setContentDrafts] = useState<SiteContent>(() => ({
    ...(siteContent ?? DEFAULT_SITE_CONTENT),
    packageDescriptions: { ...(siteContent ?? DEFAULT_SITE_CONTENT).packageDescriptions },
  }));
  const [contentErrors, setContentErrors] = useState<string[]>([]);
  const [contentSaveMsg, setContentSaveMsg] = useState<string | null>(null);
  const [isSavingContent, setIsSavingContent] = useState(false);

  // Noi dung tu App / Firestore ve sau (load async, subscribe live) thi nap lai form.
  useEffect(() => {
    if (!siteContent) return;
    setContentDrafts({
      ...siteContent,
      packageDescriptions: { ...siteContent.packageDescriptions },
    });
    setContentErrors([]);
  }, [siteContent]);

  const handleContentFieldChange = (field: keyof Omit<SiteContent, 'packageDescriptions'>, value: string) => {
    setContentDrafts((prev) => ({ ...prev, [field]: value }));
  };

  const handlePackageDescChange = (id: PackageId, value: string) => {
    setContentDrafts((prev) => ({
      ...prev,
      packageDescriptions: { ...prev.packageDescriptions, [id]: value },
    }));
  };

  const handleSaveSiteContent = async () => {
    // Chan client-side truoc khi goi Firestore (them lop nua ngoai
    // requireAdmin trong firebase.ts + rules tren Cloud).
    if (!isAdmin) {
      setContentErrors(['Chỉ quản trị viên mới được sửa nội dung giao diện. Vui lòng đăng nhập Google bằng anhyenk26@gmail.com.']);
      setContentSaveMsg(null);
      return;
    }
    const merged = mergeSiteContent(contentDrafts);
    const errors = validateSiteContent(contentDrafts);
    if (errors.length > 0) {
      setContentErrors(errors);
      setContentSaveMsg(null);
      return;
    }
    if (!onSaveSiteContent) {
      setContentErrors(['Chưa cấu hình lưu nội dung (thiếu onSaveSiteContent) — nội dung chưa được lưu.']);
      setContentSaveMsg(null);
      return;
    }
    setContentErrors([]);
    setContentSaveMsg(null);
    setIsSavingContent(true);
    try {
      await onSaveSiteContent(merged);
      setContentDrafts(merged);
      setContentSaveMsg('Đã lưu, khách sẽ thấy nội dung mới khi tải lại trang.');
      triggerCopyToast('Đã lưu nội dung giao diện!');
    } catch (e: any) {
      setContentErrors([e?.message || 'Lưu nội dung thất bại, vui lòng thử lại.']);
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleResetSiteContent = async () => {
    if (!isAdmin) {
      setContentErrors(['Chỉ quản trị viên mới được khôi phục nội dung mặc định.']);
      setContentSaveMsg(null);
      return;
    }
    if (!window.confirm('Khôi phục toàn bộ nội dung giao diện về mặc định? Nội dung hiện tại sẽ bị thay thế.')) return;
    setContentErrors([]);
    if (!onSaveSiteContent) {
      setContentDrafts({ ...DEFAULT_SITE_CONTENT, packageDescriptions: { ...DEFAULT_SITE_CONTENT.packageDescriptions } });
      setContentSaveMsg('Đã đặt lại nội dung mặc định trong form — bấm "Lưu nội dung" để áp dụng.');
      return;
    }
    setIsSavingContent(true);
    try {
      await onSaveSiteContent({ ...DEFAULT_SITE_CONTENT, packageDescriptions: { ...DEFAULT_SITE_CONTENT.packageDescriptions } });
      setContentDrafts({ ...DEFAULT_SITE_CONTENT, packageDescriptions: { ...DEFAULT_SITE_CONTENT.packageDescriptions } });
      setContentSaveMsg('Đã khôi phục nội dung mặc định!');
      triggerCopyToast('Đã khôi phục nội dung mặc định!');
    } catch (e: any) {
      setContentErrors([e?.message || 'Khôi phục nội dung mặc định thất bại, vui lòng thử lại.']);
    } finally {
      setIsSavingContent(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'leads' | 'emails' | 'photos' | 'settings'>('leads');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  // (a) Sắp xếp đơn: mặc định mới nhất trước.
  const [sortBy, setSortBy] = useState<'created-desc' | 'created-asc' | 'shoot-date' | 'balance-desc'>('created-desc');

  // Selected lead for detail/notes modal
  const [editingLead, setEditingLead] = useState<BookingLead | null>(null);
  const [editNotesText, setEditNotesText] = useState<string>('');

  // Selected email log for full preview modal
  const [viewingEmailLog, setViewingEmailLog] = useState<EmailNotificationLog | null>(null);

  // Manual Lead Creation modal
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    clientName: '',
    phone: '',
    email: '',
    packageType: 'aodai-solo' as BookingLead['packageType'],
    preferredDate: '',
    location: 'Hà Nội',
    groupSize: '1 - 2 bạn',
    message: '',
    notes: 'Liên hệ qua Zalo / Facebook',
    estimatedPrice: DEFAULT_PACKAGE_PRICES['aodai-solo'],
    paidAmount: 0,
    status: 'new' as BookingStatus,
    source: 'manual_entry' as const,
  });

  // Per-lead drafts: link Drive, trang thai cho luu, ngay hen goi lai, ly do huy
  const [driveLinkDrafts, setDriveLinkDrafts] = useState<Record<string, string>>({});
  const [pendingStatus, setPendingStatus] = useState<Record<string, BookingStatus>>({});
  const [followUpDates, setFollowUpDates] = useState<Record<string, string>>({});
  const [cancelReasons, setCancelReasons] = useState<Record<string, string>>({});
  const [statusErrors, setStatusErrors] = useState<Record<string, string>>({});

  // Copy toast state
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const stats = calculateDashboardStats(leads, photos.length);

  // (c)(d)(e) Các nhóm đơn cần chú ý — tính theo ngày địa phương (Hà Nội).
  const todayStr = todayLocalISO();
  const dueTodayCount = leads.filter((l) => isDueCall(l, todayStr)).length;
  const shootingSoonCount = leads.filter((l) => isShootingSoon(l, todayStr)).length;
  const noDepositCount = leads.filter((l) => isUnpaidDeposit(l)).length;
  const noPhotosCount = leads.filter((l) => isUndeliveredPhotos(l, todayStr)).length;
  const todoCallCount = dueTodayCount;
  const todoSoonUnpaidCount = leads.filter((l) => isShootingSoonUnpaid(l, todayStr)).length;
  const todoNoPhotoCount = noPhotosCount;
  const todoCount = leads.filter((l) => isTodoLead(l, todayStr)).length;

  // (a)(b)(c) Lọc + tìm kiếm + sắp xếp — làm tại đây (không sửa portfolioLogic):
  // filterLeads chỉ biết các trạng thái gốc và không tìm theo mã đơn KY-...,
  // nên các bộ lọc riêng ('due-today' theo ngày địa phương, 'shooting-7d',
  // 'no-deposit', 'no-photos', 'todo') lọc trực tiếp, còn trạng thái gốc
  // vẫn qua filterLeads với search rỗng; tìm kiếm (kể cả mã đơn) áp dụng
  // sau bằng matchesLeadSearch; cuối cùng sắp xếp theo sortBy.
  const baseLeads: BookingLead[] =
    statusFilter === 'due-today'
      ? leads.filter((l) => isDueCall(l, todayStr))
      : statusFilter === 'shooting-7d'
        ? leads.filter((l) => isShootingSoon(l, todayStr))
        : statusFilter === 'no-deposit'
          ? leads.filter((l) => isUnpaidDeposit(l))
          : statusFilter === 'no-photos'
            ? leads.filter((l) => isUndeliveredPhotos(l, todayStr))
            : statusFilter === 'todo'
              ? leads.filter((l) => isTodoLead(l, todayStr))
              : filterLeads(leads, statusFilter, '');
  const searchedLeads = baseLeads.filter((l) => matchesLeadSearch(l, searchQuery));
  const filteredLeads = [...searchedLeads].sort((a, b) => {
    switch (sortBy) {
      case 'created-asc':
        return parseCreatedAtMs(a.createdAt) - parseCreatedAtMs(b.createdAt);
      case 'shoot-date': {
        // Ngày chụp gần nhất trước; đơn chưa chọn ngày xếp cuối.
        const da = a.preferredDate || '9999-12-31';
        const db = b.preferredDate || '9999-12-31';
        return da < db ? -1 : da > db ? 1 : 0;
      }
      case 'balance-desc':
        return leadBalance(b) - leadBalance(a);
      case 'created-desc':
      default:
        return parseCreatedAtMs(b.createdAt) - parseCreatedAtMs(a.createdAt);
    }
  });

  const triggerCopyToast = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  // (f) Sao chép mã đơn KY-... (có fallback khi clipboard API không khả dụng).
  const handleCopyBookingCode = async (lead: BookingLead) => {
    try {
      await navigator.clipboard.writeText(lead.id);
      triggerCopyToast(`Đã sao chép mã đơn ${lead.id}`);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = lead.id;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        triggerCopyToast(`Đã sao chép mã đơn ${lead.id}`);
      } catch {
        triggerCopyToast(`Mã đơn: ${lead.id} (không sao chép được tự động)`);
      }
    }
  };

  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  // (g) Xuất Excel/CSV chỉ các đơn ĐANG LỌC (filteredLeads đã gồm
  // trạng thái + tìm kiếm + sắp xếp), không phải toàn bộ danh sách.
  const handleExportExcel = () => {
    try {
      const excelBytes = exportLeadsToExcel(filteredLeads);
      const blob = new Blob([excelBytes.buffer as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Danh-sach-khach-hang-YenPhoto-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      triggerCopyToast(`Đã xuất file Excel (.xlsx) ${filteredLeads.length} đơn đang lọc!`);
    } catch (err) {
      console.error('Export Excel error', err);
      triggerCopyToast('Lỗi xuất Excel, vui lòng thử lại');
    }
  };

  const handleExportCsv = () => {
    const csvContent = exportLeadsToCsv(filteredLeads);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh-sach-khach-hang-YenPhoto-${Date.now().toString().slice(-4)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    triggerCopyToast(`Đã tải xuống file CSV ${filteredLeads.length} đơn đang lọc!`);
  };

  const handleResendEmailDirect = async (log: EmailNotificationLog) => {
    const matchingLead = leads.find((l) => l.id === log.leadId);
    if (!matchingLead) {
      triggerCopyToast('Không tìm thấy thông tin khách hàng tương ứng.');
      return;
    }

    setSendingEmailId(log.id);
    try {
      const res = await sendBookingEmailReal(matchingLead, photographerEmail, effectivePrices);
      triggerCopyToast(res.message);
    } catch (err: any) {
      triggerCopyToast('Lỗi gửi mail: ' + (err?.message || 'Thử lại sau'));
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleSaveNotes = () => {
    if (editingLead) {
      onUpdateLeadNotes(editingLead.id, editNotesText);
      setEditingLead(null);
      triggerCopyToast('Đã lưu ghi chú tư vấn thành công!');
    }
  };

  // Luu link Drive cua 1 lead (uu tien onUpdateLead, neu khong co thi bao loi nhe)
  const handleSaveDriveLink = (lead: BookingLead) => {
    const link = (driveLinkDrafts[lead.id] ?? lead.driveLink ?? '').trim();
    if (onUpdateLead) {
      onUpdateLead(lead.id, { driveLink: link });
      triggerCopyToast('Đã lưu link Drive!');
    } else {
      triggerCopyToast('Không lưu được link Drive (chưa có onUpdateLead).');
    }
  };

  // Luu trang thai + ngay hen goi lai (+ ly do huy neu chon cancelled).
  // Trang thai chi duoc doi khi bam Luu; huy ma khong co ly do thi bao loi, khong doi.
  const handleSaveLeadStatus = (lead: BookingLead) => {
    const nextStatus = pendingStatus[lead.id];
    if (!nextStatus) return;
    const nextFollowUpAt = followUpDates[lead.id] ?? lead.nextFollowUpAt ?? '';
    if (nextStatus === 'cancelled') {
      const reason = (cancelReasons[lead.id] ?? lead.cancelReason ?? '').trim();
      if (!reason) {
        setStatusErrors((prev) => ({
          ...prev,
          [lead.id]: 'Vui lòng nhập lý do hủy trước khi đổi trạng thái.',
        }));
        return;
      }
      if (onUpdateLead) {
        onUpdateLead(lead.id, {
          status: nextStatus,
          nextFollowUpAt: nextFollowUpAt || undefined,
          cancelReason: reason,
        });
      } else {
        onUpdateLeadStatus(lead.id, nextStatus);
      }
    } else if (onUpdateLead) {
      onUpdateLead(lead.id, {
        status: nextStatus,
        nextFollowUpAt: nextFollowUpAt || undefined,
      });
    } else {
      onUpdateLeadStatus(lead.id, nextStatus);
    }
    setStatusErrors((prev) => ({ ...prev, [lead.id]: '' }));
    setPendingStatus((prev) => {
      const next = { ...prev };
      delete next[lead.id];
      return next;
    });
    triggerCopyToast('Đã cập nhật trạng thái khách hàng!');
  };

  const handleCreateManualLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.clientName || !newLeadForm.phone) {
      alert('Vui lòng nhập tên khách hàng và số điện thoại!');
      return;
    }
    const pkg = getPackageDetails(newLeadForm.packageType, effectivePrices);
    const paidAmount = Math.max(0, newLeadForm.paidAmount || 0);
    onAddManualLead({
      ...newLeadForm,
      estimatedPrice: pkg.basePriceVND,
      depositAmount: calculateDepositAmount(pkg.basePriceVND),
      paidAmount,
      balance: Math.max(0, pkg.basePriceVND - paidAmount),
    });
    setIsAddLeadModalOpen(false);
    setNewLeadForm({
      clientName: '',
      phone: '',
      email: '',
      packageType: 'aodai-solo',
      preferredDate: '',
      location: 'Hà Nội',
      groupSize: '1 - 2 bạn',
      message: '',
      notes: '',
      estimatedPrice: getPackageDetails('aodai-solo', effectivePrices).basePriceVND,
      paidAmount: 0,
      status: 'new',
      source: 'manual_entry',
    });
    triggerCopyToast('Đã thêm khách hàng mới vào hệ thống!');
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-[#070709] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Top Header of Admin Dashboard */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Left: Back to Portfolio & Admin Badge */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExitDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              title="Quay lại giao diện xem ảnh công khai"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Portfolio</span>
            </button>

            <div className="hidden sm:block h-4 w-px bg-neutral-300 dark:bg-neutral-700" />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base tracking-wide text-neutral-900 dark:text-white">
                  YÊN PHOTO
                </span>
                <span className="text-xs font-sans tabular-nums px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 font-semibold border border-amber-300 dark:border-amber-800">
                  DASHBOARD QUẢN TRỊ
                </span>
                {currentUser ? (
                  <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-sans tabular-nums px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Cloud Firestore ({currentUser.email || 'Lưu vĩnh viễn'})</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onGoogleLogin}
                    className="hidden md:inline-flex items-center gap-1.5 text-xs font-sans tabular-nums px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                    title={`Bấm để đăng nhập tài khoản Google ${SITE_CONFIG.photographerEmail} và kích hoạt đồng bộ đám mây thời gian thực`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Đồng bộ Google Cloud ({SITE_CONFIG.photographerEmail})</span>
                  </button>
                )}
              </div>
              <div className="text-xs text-neutral-500 font-sans tabular-nums hidden sm:block">
                Quản lý lịch chụp, đồng bộ thời gian thực đám mây & xuất file Excel
              </div>
            </div>
          </div>

          {/* Right: User Profile & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick stats indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs font-sans tabular-nums">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-neutral-600 dark:text-neutral-300">{photographerEmail}</span>
              <span className="text-neutral-400">· Sony A7 III</span>
            </div>

            <button
              type="button"
              onClick={() => setIsAddLeadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-500 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thêm Khách Mới</span>
              <span className="sm:hidden">+ Khách</span>
            </button>

            {onLogoutAdmin && (
              <button
                type="button"
                onClick={onLogoutAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                title="Đăng xuất chế độ quản trị viên"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đăng Xuất</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Dashboard Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* KPI Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Leads */}
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] space-y-1">
            <div className="flex items-center justify-between text-xs font-sans tabular-nums text-neutral-500">
              <span>TỔNG YÊU CẦU</span>
              <Users className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 dark:text-white tabular-nums">
              {stats.totalLeads}
            </div>
            <div className="text-xs text-neutral-500">
              Tỷ lệ chốt thành công: <span className="font-sans tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">{stats.conversionRate}%</span>
            </div>
          </div>

          {/* Card 2: New Leads Requiring Consultation */}
          <div className="p-5 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-1">
            <div className="flex items-center justify-between text-xs font-sans tabular-nums text-amber-700 dark:text-amber-400 font-medium">
              <span>CẦN TƯ VẤN GẤP</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-900 dark:text-amber-300 tabular-nums">
              {stats.newLeads}
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-400">
              Khách mới gửi form chưa liên hệ
            </div>
          </div>

          {/* Card 3: Deposited / Booked */}
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] space-y-1">
            <div className="flex items-center justify-between text-xs font-sans tabular-nums text-neutral-500">
              <span>ĐÃ CHỐT / ĐÃ CỌC</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 dark:text-white tabular-nums">
              {stats.depositedLeads + stats.completedLeads}
            </div>
            <div className="text-xs text-neutral-500">
              Đang tư vấn Zalo: <span className="font-sans tabular-nums text-sky-600 dark:text-sky-400">{stats.consultingLeads} khách</span>
            </div>
          </div>

          {/* Card 4: Estimated Revenue */}
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] space-y-1">
            <div className="flex items-center justify-between text-xs font-sans tabular-nums text-neutral-500">
              <span>DOANH THU ĐÃ CHỐT</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {formatVND(stats.estimatedRevenue)}
            </div>
            <div className="text-xs text-neutral-500">
              Tiềm năng: <span className="font-sans tabular-nums">{formatVND(stats.potentialRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Payment Summary Row: da thu / tien coc / con phai thu */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] space-y-1">
            <div className="flex items-center justify-between text-xs font-sans tabular-nums text-neutral-500">
              <span>ĐÃ THU</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {formatVND(stats.totalPaid)}
            </div>
            <div className="text-xs text-neutral-500">Tổng tiền khách đã trả (chưa tính đơn đã hủy)</div>
          </div>

          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] space-y-1">
            <div className="flex items-center justify-between text-xs font-sans tabular-nums text-neutral-500">
              <span>TIỀN CỌC</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 dark:text-white tabular-nums">
              {formatVND(stats.totalDeposited)}
            </div>
            <div className="text-xs text-neutral-500">Tổng tiền cọc theo gói (30% giá gói)</div>
          </div>

          <div className="p-5 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-1">
            <div className="flex items-center justify-between text-xs font-sans tabular-nums text-amber-700 dark:text-amber-400 font-medium">
              <span>CÒN PHẢI THU</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-amber-900 dark:text-amber-300 tabular-nums">
              {formatVND(stats.totalBalance)}
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-400">Tổng số tiền khách còn nợ</div>
          </div>
        </div>

        {/* (e) Việc cần làm hôm nay — bấm vào thẻ thì lọc danh sách xuống đúng các đơn đó */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('leads');
            setStatusFilter((prev) => (prev === 'todo' ? 'all' : 'todo'));
          }}
          title="Bấm để lọc danh sách xuống các đơn cần làm hôm nay (bấm lại để bỏ lọc)"
          className={`w-full text-left p-5 rounded-xl border transition-colors cursor-pointer space-y-2 ${
            statusFilter === 'todo'
              ? 'border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 ring-1 ring-rose-400 dark:ring-rose-700'
              : 'border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:border-rose-400 dark:hover:border-rose-700'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-sans tabular-nums text-rose-700 dark:text-rose-400 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>VIỆC CẦN LÀM HÔM NAY {statusFilter === 'todo' ? '· ĐANG LỌC' : ''}</span>
            </div>
            <span className="text-2xl sm:text-3xl font-serif font-bold text-rose-700 dark:text-rose-300 tabular-nums">
              {todoCount}
            </span>
          </div>
          <div className="text-xs text-rose-700 dark:text-rose-400">
            Cần gọi lại: <span className="font-sans tabular-nums font-semibold">{todoCallCount} đơn</span>
            {' · '}Sắp chụp chưa cọc: <span className="font-sans tabular-nums font-semibold">{todoSoonUnpaidCount} đơn</span>
            {' · '}Chưa trả ảnh: <span className="font-sans tabular-nums font-semibold">{todoNoPhotoCount} đơn</span>
            <span className="text-neutral-500 dark:text-neutral-400"> (một đơn có thể thuộc nhiều nhóm, số tổng đếm mỗi đơn 1 lần)</span>
          </div>
        </button>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <div className="flex items-center gap-1 sm:gap-2 bg-neutral-200/60 dark:bg-neutral-800/60 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('leads')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'leads'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Khách Đăng Ký ({leads.length})</span>
              {stats.newLeads > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-amber-500 text-white font-sans tabular-nums">
                  {stats.newLeads}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('emails')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'emails'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Thông Báo ({emailLogs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('photos')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'photos'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Quản Lý Ảnh ({photos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Cài Đặt & Gói Chụp</span>
            </button>
          </div>

          {/* Quick utility buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-md transition-colors cursor-pointer shadow-xs"
              title={`Xuất ${filteredLeads.length} đơn đang lọc ra file Excel (.xlsx)`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Xuất File Excel ({filteredLeads.length} đơn đang lọc)</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 rounded-md transition-colors cursor-pointer"
              title={`Tải bản dự phòng CSV — chỉ ${filteredLeads.length} đơn đang lọc`}
            >
              <Download className="w-3 h-3" />
              <span className="hidden md:inline">CSV ({filteredLeads.length} đơn đang lọc)</span>
            </button>

            <button
              type="button"
              onClick={onSendTestEmail}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md transition-colors cursor-pointer shadow-xs"
              title="Gửi thử một email thông báo mẫu về hộp thư của bạn"
            >
              <Send className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Gửi Email Test</span>
            </button>
          </div>
        </div>

        {/* TAB 1: LEADS MANAGEMENT (CRM) */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            {/* Search and Filter toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Search box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên khách, SĐT, mã đơn KY-..., trường học, địa điểm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:text-white"
                />
              </div>

              {/* (a) Sắp xếp đơn */}
              <label className="flex items-center gap-2 text-xs text-neutral-500 shrink-0">
                <span className="whitespace-nowrap">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as 'created-desc' | 'created-asc' | 'shoot-date' | 'balance-desc'
                    )
                  }
                  className="px-2 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md dark:text-white cursor-pointer"
                  title="Sắp xếp danh sách đơn đang hiển thị"
                >
                  <option value="created-desc">Mới nhất trước</option>
                  <option value="created-asc">Cũ nhất trước</option>
                  <option value="shoot-date">Ngày chụp gần nhất</option>
                  <option value="balance-desc">Tiền còn lại nhiều nhất</option>
                </select>
              </label>

              {/* Status filter tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'Tất Cả' },
                  { id: 'new', label: 'Mới Nhận' },
                  { id: 'consulting', label: 'Đang Tư Vấn' },
                  { id: 'due-today', label: 'Cần gọi hôm nay' },
                  { id: 'deposited', label: 'Đã Cọc' },
                  { id: 'completed', label: 'Đã Chụp' },
                  { id: 'cancelled', label: 'Đã Hủy' },
                  { id: 'todo', label: 'Việc cần làm' },
                  { id: 'shooting-7d', label: 'Sắp chụp ≤ 7 ngày' },
                  { id: 'no-deposit', label: 'Chưa cọc' },
                  { id: 'no-photos', label: 'Chưa trả ảnh' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatusFilter(s.id)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap font-medium ${
                      statusFilter === s.id
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                        : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {s.label}
                    {s.id === 'due-today' && dueTodayCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-amber-500 text-white font-sans tabular-nums">
                        {dueTodayCount}
                      </span>
                    )}
                    {s.id === 'todo' && todoCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-rose-500 text-white font-sans tabular-nums">
                        {todoCount}
                      </span>
                    )}
                    {s.id === 'shooting-7d' && shootingSoonCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-amber-500 text-white font-sans tabular-nums">
                        {shootingSoonCount}
                      </span>
                    )}
                    {s.id === 'no-deposit' && noDepositCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-amber-500 text-white font-sans tabular-nums">
                        {noDepositCount}
                      </span>
                    )}
                    {s.id === 'no-photos' && noPhotosCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-amber-500 text-white font-sans tabular-nums">
                        {noPhotosCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Leads Table Card — chi desktop (hidden md:block); mobile dung the don o duoi */}
            <div className="hidden md:block rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 font-sans tabular-nums text-xs uppercase">
                      <th className="py-3 px-4 font-semibold">Khách Hàng & Liên Hệ</th>
                      <th className="py-3 px-4 font-semibold">Gói Chụp & Giá</th>
                      <th className="py-3 px-4 font-semibold">Ngày & Địa Điểm</th>
                      <th className="py-3 px-4 font-semibold">Khung Giờ</th>
                      <th className="py-3 px-4 font-semibold">Tiền Cọc</th>
                      <th className="py-3 px-4 font-semibold">Còn Lại</th>
                      <th className="py-3 px-4 font-semibold">Trạng Thái</th>
                      <th className="py-3 px-4 font-semibold">Ghi Chú Tư Vấn</th>
                      <th className="py-3 px-4 font-semibold">Link Drive</th>
                      <th className="py-3 px-4 font-semibold text-right">Hành Động Trực Tiếp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-neutral-400">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p>Không tìm thấy yêu cầu tư vấn nào phù hợp.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => {
                        const statusBadge = formatStatusLabel(lead.status);
                        const cleanPhone = leadPhoneDigits(lead.phone);
                        // (d) Đơn quá hạn gọi lại / sắp chụp chưa cọc.
                        const isOverdue = isOverdueFollowUp(lead, todayStr);
                        const isSoonUnpaid = isShootingSoonUnpaid(lead, todayStr);

                        return (
                          <React.Fragment key={lead.id}>
                          <tr
                            className={`hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors ${
                              isOverdue
                                ? 'bg-rose-50 dark:bg-rose-950/20'
                                : lead.status === 'new'
                                  ? 'bg-amber-50/20 dark:bg-amber-950/10'
                                  : ''
                            }`}
                          >
                            {/* Customer column */}
                            <td className="py-4 px-4 align-top">
                              <div className="font-semibold text-neutral-900 dark:text-white text-sm">
                                {lead.clientName}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-neutral-500 text-xs mt-0.5 font-sans tabular-nums">
                                <span>
                                  Mã: #{lead.id} · {lead.createdAt}
                                </span>
                                {/* (f) Sao chép mã đơn */}
                                <button
                                  type="button"
                                  onClick={() => handleCopyBookingCode(lead)}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                                  title={`Sao chép mã đơn ${lead.id}`}
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Sao chép mã</span>
                                </button>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <a
                                  href={`tel:${cleanPhone}`}
                                  className="inline-flex items-center gap-1 text-xs font-sans tabular-nums text-emerald-600 dark:text-emerald-400 hover:underline"
                                  title="Gọi điện trực tiếp"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{lead.phone}</span>
                                </a>
                                <a
                                  href={`https://zalo.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300 font-medium hover:bg-blue-100"
                                >
                                  Chat Zalo
                                </a>
                              </div>
                            </td>

                            {/* Package column */}
                            <td className="py-4 px-4 align-top">
                              <div className="font-medium text-neutral-800 dark:text-neutral-200">
                                {getPackageDetails(lead.packageType).name}
                              </div>
                              <div className="text-amber-600 dark:text-amber-400 font-sans tabular-nums font-semibold mt-1">
                                {formatVND(lead.estimatedPrice)}
                              </div>
                              <div className="text-neutral-400 text-xs mt-0.5">
                                Quy mô: {lead.groupSize || '1 - 2 bạn'}
                              </div>
                            </td>

                            {/* Date & Location column */}
                            <td className="py-4 px-4 align-top">
                              <div className="flex items-center gap-1 font-sans tabular-nums text-neutral-800 dark:text-neutral-200">
                                <Clock className="w-3 h-3 text-neutral-400" />
                                <span>{lead.preferredDate || 'Chưa chọn ngày'}</span>
                              </div>
                              <div className="text-neutral-600 dark:text-neutral-400 text-xs mt-1 line-clamp-2">
                                {lead.location}
                              </div>
                              {/* (d) Sắp chụp trong 7 ngày mà chưa cọc */}
                              {isSoonUnpaid && (
                                <div className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Sắp chụp chưa cọc</span>
                                </div>
                              )}
                            </td>

                            {/* Time slot column */}
                            <td className="py-4 px-4 align-top">
                              <div className="font-medium text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                                {timeSlotLabel(lead.timeSlot) || 'Chưa chọn'}
                              </div>
                              {lead.nextFollowUpAt && (
                                <div
                                  className={`text-xs mt-1 font-sans tabular-nums whitespace-nowrap ${
                                    isOverdue
                                      ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                      : 'text-amber-600 dark:text-amber-400'
                                  }`}
                                >
                                  Hẹn gọi: {lead.nextFollowUpAt}
                                  {/* (d) Quá hạn gọi lại */}
                                  {isOverdue && (
                                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-semibold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                      Quá hạn
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Deposit column */}
                            <td className="py-4 px-4 align-top">
                              <div className="font-sans tabular-nums font-semibold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                                {formatVND(lead.depositAmount || 0)}
                              </div>
                              <div className="text-neutral-400 text-xs mt-0.5 whitespace-nowrap">
                                Đã thu: {formatVND(lead.paidAmount || 0)}
                              </div>
                            </td>

                            {/* Remaining balance column */}
                            <td className="py-4 px-4 align-top">
                              <div className="font-sans tabular-nums font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                {formatVND(
                                  lead.balance ??
                                    Math.max(0, (lead.estimatedPrice || 0) - (lead.paidAmount || 0))
                                )}
                              </div>
                            </td>

                            {/* Status dropdown column */}
                            <td className="py-4 px-4 align-top">
                              <select
                                value={pendingStatus[lead.id] ?? lead.status}
                                onChange={(e) => {
                                  const next = e.target.value as BookingStatus;
                                  setPendingStatus((prev) => ({ ...prev, [lead.id]: next }));
                                  if (next !== 'cancelled') {
                                    setStatusErrors((prev) => ({ ...prev, [lead.id]: '' }));
                                  }
                                }}
                                className={`px-2 py-1 rounded text-xs font-medium border cursor-pointer ${statusBadge.bg} ${statusBadge.color} ${statusBadge.border}`}
                              >
                                <option value="new">Mới Nhận (Cần gọi)</option>
                                <option value="consulting">Đang Tư Vấn Zalo</option>
                                <option value="deposited">Đã Cọc / Chốt Lịch</option>
                                <option value="completed">Đã Chụp & Trả Ảnh</option>
                                <option value="cancelled">Đã Hủy Lịch</option>
                              </select>
                              {lead.status === 'cancelled' && lead.cancelReason && (
                                <div className="text-xs text-neutral-400 mt-1">
                                  Lý do hủy: {lead.cancelReason}
                                </div>
                              )}
                              {pendingStatus[lead.id] && (
                                <div className="mt-2 space-y-1.5">
                                  <label className="block text-xs text-neutral-500">
                                    Ngày hẹn gọi lại
                                  </label>
                                  <input
                                    type="date"
                                    value={followUpDates[lead.id] ?? lead.nextFollowUpAt ?? ''}
                                    onChange={(e) =>
                                      setFollowUpDates((prev) => ({
                                        ...prev,
                                        [lead.id]: e.target.value,
                                      }))
                                    }
                                    className="w-full px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 dark:text-white"
                                  />
                                  {pendingStatus[lead.id] === 'cancelled' && (
                                    <input
                                      type="text"
                                      placeholder="Lý do hủy (bắt buộc)"
                                      value={cancelReasons[lead.id] ?? lead.cancelReason ?? ''}
                                      onChange={(e) =>
                                        setCancelReasons((prev) => ({
                                          ...prev,
                                          [lead.id]: e.target.value,
                                        }))
                                      }
                                      className="w-full px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 dark:text-white"
                                    />
                                  )}
                                  {statusErrors[lead.id] && (
                                    <div className="text-xs text-rose-600 dark:text-rose-400">
                                      {statusErrors[lead.id]}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleSaveLeadStatus(lead)}
                                    className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer"
                                  >
                                    Lưu
                                  </button>
                                </div>
                              )}
                              <div className="text-xs text-neutral-400 mt-1 font-sans tabular-nums">
                                Email gửi: {lead.emailSentTo}
                              </div>
                            </td>

                            {/* Consultation Notes column */}
                            <td className="py-4 px-4 align-top max-w-xs">
                              {lead.notes ? (
                                <p className="text-neutral-700 dark:text-neutral-300 text-xs italic line-clamp-2">
                                  "{lead.notes}"
                                </p>
                              ) : (
                                <span className="text-neutral-400 text-xs italic">Chưa có ghi chú</span>
                              )}
                              {lead.message && (
                                <div className="text-neutral-500 text-xs mt-1 line-clamp-1">
                                  Lời nhắn: {lead.message}
                                </div>
                              )}
                            </td>

                            {/* Drive link column */}
                            <td className="py-4 px-4 align-top">
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  placeholder="Dán link Google Drive..."
                                  value={driveLinkDrafts[lead.id] ?? lead.driveLink ?? ''}
                                  onChange={(e) =>
                                    setDriveLinkDrafts((prev) => ({
                                      ...prev,
                                      [lead.id]: e.target.value,
                                    }))
                                  }
                                  className="w-40 px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 dark:text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveDriveLink(lead)}
                                  className="px-2 py-1 text-xs font-medium rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer shrink-0"
                                  title="Lưu link Drive cho khách này"
                                >
                                  Lưu
                                </button>
                              </div>
                              {lead.driveLink && (
                                <a
                                  href={lead.driveLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 mt-1 text-xs text-sky-600 dark:text-sky-400 hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Mở Drive</span>
                                </a>
                              )}
                            </td>

                            {/* Actions column */}
                            <td className="py-4 px-4 align-top text-right space-x-1">
                              {/* (f) Nút nhanh: gọi / Zalo / sao chép mã / mở Drive (chỉ khi có dữ liệu) */}
                              <div className="flex items-center justify-end gap-1 mb-1.5">
                                <a
                                  href={`tel:${cleanPhone}`}
                                  className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                                  title={`Gọi ${lead.phone}`}
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={`https://zalo.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                  title={`Nhắn Zalo ${lead.phone}`}
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopyBookingCode(lead)}
                                  className="p-1.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                                  title={`Sao chép mã đơn ${lead.id}`}
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                {lead.driveLink && (
                                  <a
                                    href={lead.driveLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                                    title="Mở link Drive trả ảnh"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLead(lead);
                                  setEditNotesText(lead.notes || '');
                                }}
                                className="px-2.5 py-1 text-xs rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                                title="Xem đầy đủ thông tin & thêm ghi chú tư vấn"
                              >
                                Tư Vấn
                              </button>

                              {/* (v6) Mo muc anh proofing cua don nay */}
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedProofingLeadId((prev) => (prev === lead.id ? null : lead.id))
                                }
                                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                                  expandedProofingLeadId === lead.id
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800'
                                }`}
                                title="Up / xem ảnh proofing riêng cho đơn này"
                              >
                                {expandedProofingLeadId === lead.id ? 'Đóng proofing' : 'Ảnh proofing'}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Bạn có chắc muốn xóa yêu cầu #${lead.id} của khách ${lead.clientName}?`)) {
                                    onDeleteLead(lead.id);
                                    triggerCopyToast('Đã xóa yêu cầu thành công');
                                  }
                                }}
                                className="p-1 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Xóa yêu cầu này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                          {/* (v6) Hang mo rong: anh proofing cua don nay */}
                          {expandedProofingLeadId === lead.id && (
                            <tr>
                              <td colSpan={10} className="py-4 px-4 bg-neutral-50/60 dark:bg-neutral-900/30">
                                <ProofingManager lead={lead} onToast={triggerCopyToast} />
                              </td>
                            </tr>
                          )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* The don dang the — chi mobile (block md:hidden). Dung lai
                filteredLeads (da loc/tim/sap xep) va cac ham/handler da co;
                bang desktop o tren giu nguyen. */}
            <div className="block md:hidden space-y-3">
              {filteredLeads.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>Không tìm thấy yêu cầu tư vấn nào phù hợp.</p>
                </div>
              ) : (
                filteredLeads.map((lead) => {
                  const statusBadge = formatStatusLabel(lead.status);
                  const cleanPhone = leadPhoneDigits(lead.phone);
                  return (
                    <article
                      key={lead.id}
                      className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] p-4 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-neutral-900 dark:text-white truncate">
                            {lead.clientName}
                          </div>
                          <div className="text-xs font-sans tabular-nums text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Mã: #{lead.id} · {lead.createdAt}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.bg} ${statusBadge.color} ${statusBadge.border}`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>
                            {lead.preferredDate || 'Chưa chọn ngày'}
                            {lead.timeSlot ? ` · ${timeSlotLabel(lead.timeSlot)}` : ''}
                          </span>
                        </div>
                        <div>{getPackageDetails(lead.packageType).name}</div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-neutral-500 dark:text-neutral-400">Tiền còn lại</span>
                          <span className="font-sans tabular-nums font-bold text-base text-amber-600 dark:text-amber-400">
                            {formatVND(leadBalance(lead))}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`tel:${cleanPhone}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Gọi</span>
                        </a>
                        <a
                          href={`https://zalo.me/${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Zalo</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyBookingCode(lead)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                          title={`Sao chép mã đơn ${lead.id}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép mã</span>
                        </button>
                      </div>
                      {/* (v6) Anh proofing cua don nay (mobile) */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedProofingLeadId((prev) => (prev === lead.id ? null : lead.id))
                        }
                        className={`w-full px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          expandedProofingLeadId === lead.id
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {expandedProofingLeadId === lead.id ? 'Đóng ảnh proofing' : 'Ảnh proofing của đơn này'}
                      </button>
                      {expandedProofingLeadId === lead.id && (
                        <ProofingManager lead={lead} onToast={triggerCopyToast} />
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EMAIL DISPATCH LOGS */}
        {activeTab === 'emails' && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-serif font-semibold text-neutral-900 dark:text-white">
                  Hộp Thư Thông Báo Khách Đăng Ký
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Mỗi khi có khách điền form trên website, hệ thống sẽ tự động gửi email thông báo về địa chỉ này.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">Email nhận:</span>
                <input
                  type="email"
                  value={photographerEmail}
                  onChange={(e) => onUpdatePhotographerEmail(e.target.value)}
                  className="px-3 py-1.5 text-xs font-sans tabular-nums bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md dark:text-white"
                />
              </div>
            </div>

            {/* Email delivery & activation instruction banner */}
            <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs space-y-2.5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-neutral-900 dark:text-white">
                    Cơ chế gửi kép tự động: Đồng thời lưu Dashboard & gửi email về {photographerEmail}
                  </h4>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    Mỗi khi khách hàng điền xong form và bấm gửi yêu cầu:
                    <br />
                    • <strong>1. Lưu ngay vào Dashboard:</strong> Thông tin khách, số điện thoại, ngày chụp, gói dịch vụ xuất hiện tức thì trong mục <em>"Khách Đăng Ký"</em> để bạn quản lý, gọi điện, nhắn Zalo và xuất file Excel.
                    <br />
                    • <strong>2. Gửi thông báo về Gmail:</strong> Hệ thống tự động kích hoạt gửi trọn bộ thông tin tới <strong>{photographerEmail}</strong> để bạn nhận email và chuông báo trên điện thoại.
                  </p>
                </div>
              </div>

              <div className="pt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onSendTestEmail}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Thử 1 Email Thông Báo Tới {photographerEmail}</span>
                </button>
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(photographerEmail)}&su=${encodeURIComponent('[YÊN PHOTO] Kiểm tra kết nối hòm thư')}&body=${encodeURIComponent('Kiểm tra nhận thông báo lịch chụp kỉ yếu & áo dài thành công!')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-rose-500" />
                  <span>Mở Web Gmail Kiểm Tra Hộp Thư</span>
                </a>
              </div>
            </div>

            {/* Email list */}
            <div className="space-y-3">
              {emailLogs.length === 0 ? (
                <div className="p-12 text-center text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-[#0c0c0e]">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>Chưa có email thông báo nào. Bấm "Gửi Email Test" ở góc trên để gửi thử một email mẫu!</p>
                </div>
              ) : (
                emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] hover:border-amber-400 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-sans tabular-nums font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          ĐÃ GỬI TỚI {log.toEmail}
                        </span>
                        <span className="text-xs font-sans tabular-nums text-neutral-400">
                          {log.sentAt} · #{log.id}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingEmailLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem Nội Dung</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResendEmailDirect(log)}
                          disabled={sendingEmailId === log.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {sendingEmailId === log.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Gửi Lại Tới Gmail</span>
                        </button>

                        <a
                          href={`mailto:${log.toEmail}?subject=${encodeURIComponent(log.subject)}&body=${encodeURIComponent(log.fullBody)}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                          title="Mở ứng dụng mail mặc định trên máy"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Ứng Dụng Mail</span>
                        </a>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {log.subject}
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2 font-sans tabular-nums">
                        {log.previewSnippet}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PHOTOS & CONTENT MANAGEMENT */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-serif font-semibold text-neutral-900 dark:text-white">
                  Kho Tác Phẩm Kỉ Yếu & Áo Dài Trên Website
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Quản lý {photos.length} tác phẩm đang hiển thị ngoài portfolio. Bạn có thể chọn ảnh làm tiêu điểm (featured) hoặc xóa bớt.
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenAddPhoto}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold tracking-wider uppercase text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tải Thêm Ảnh Mới (Sony A7 III)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] overflow-hidden group space-y-3 p-4"
                >
                  <div className="aspect-[4/3] rounded-lg overflow-hidden relative bg-neutral-100 dark:bg-neutral-900">
                    <img
                      src={photo.thumbUrl || photo.image}
                      alt={photo.vietnameseTitle}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    {photo.featured && (
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-sans tabular-nums uppercase bg-amber-500 text-white font-bold shadow-xs">
                        Ảnh Tiêu Điểm Hero
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-sans tabular-nums text-amber-600 dark:text-amber-400">
                      {photo.camera} · {photo.lens}
                    </div>
                    <div className="text-sm font-serif font-semibold text-neutral-900 dark:text-white">
                      {photo.vietnameseTitle}
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-1">
                      {photo.location}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => onToggleFeaturedPhoto(photo.id)}
                      className={`text-xs font-medium cursor-pointer ${
                        photo.featured
                          ? 'text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {photo.featured ? '★ Đang là ảnh Hero' : 'Đặt làm ảnh Hero'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa ảnh "${photo.vietnameseTitle}" khỏi portfolio?`)) {
                          onDeletePhoto(photo.id);
                          triggerCopyToast('Đã xóa tác phẩm khỏi trang web');
                        }
                      }}
                      className="text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Xóa tác phẩm này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS & PRICING */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-4xl">
            <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] space-y-6">
              <div>
                <h3 className="text-lg font-serif font-semibold text-neutral-900 dark:text-white">
                  Cài Đặt Hệ Thống & Bảng Giá Dịch Vụ
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Cấu hình hiển thị và giá gói chụp áp dụng cho học sinh, sinh viên trên website.
                </p>
              </div>

              {/* Photographer Info */}
              <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <div className="text-xs font-sans tabular-nums uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold">
                  1. THÔNG TIN THỢ ẢNH & EMAIL THÔNG BÁO
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-neutral-600 dark:text-neutral-400 mb-1">
                      Họ tên hiển thị:
                    </label>
                    <input
                      type="text"
                      defaultValue="Anh Yên"
                      readOnly
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md font-sans tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-600 dark:text-neutral-400 mb-1">
                      Email nhận đăng ký form:
                    </label>
                    <input
                      type="email"
                      value={photographerEmail}
                      onChange={(e) => onUpdatePhotographerEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md font-sans tabular-nums text-amber-600 font-semibold"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Đổi email này chỉ đổi nơi nhận đơn, không đổi tài khoản quản trị (luôn là anhyenk26@gmail.com).
                    </p>
                  </div>
                  <div>
                    <label className="block text-neutral-600 dark:text-neutral-400 mb-1">
                      Số điện thoại / Zalo tư vấn:
                    </label>
                    <input
                      type="text"
                      defaultValue={SITE_CONFIG.phoneDisplay}
                      readOnly
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md font-sans tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-600 dark:text-neutral-400 mb-1">
                      Thiết bị chính sử dụng:
                    </label>
                    <input
                      type="text"
                      defaultValue="Sony Alpha 7 Mark III (ILCE-7M3)"
                      readOnly
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md font-sans tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* (v6) Noi dung giao dien — CHI ADMIN duoc sua. Neu mo duoc
                  Settings ma khong phai admin thi chi xem, nut Luu bao loi
                  va khong goi Firestore (xem handleSaveSiteContent). */}
              <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                <div className="text-xs font-sans tabular-nums uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold">
                  2. NỘI DUNG GIAO DIỆN KHÁCH HÀNG
                </div>
                <p className="text-xs text-neutral-500">
                  Sửa chữ khách nhìn thấy trên web (Hero, Về tôi, mô tả gói, Liên hệ, Footer) mà
                  không cần sửa code. Chỉ hiển thị text thuần, không cho chèn HTML. Lưu xong khách
                  sẽ thấy nội dung mới khi tải lại trang.
                </p>
                {!isAdmin && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
                    Bạn đang xem với quyền khách — chỉ quản trị viên (anhyenk26@gmail.com) mới được
                    lưu nội dung giao diện.
                  </div>
                )}
                {CONTENT_FORM_GROUPS.map((group) => (
                  <div key={group.title} className="space-y-3">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">{group.title}</div>
                    <div className="grid grid-cols-1 gap-3">
                      {group.fields.map(({ key, multiline, hint }) => (
                        <label key={key} className="block text-xs">
                          <span className="text-neutral-600 dark:text-neutral-400">
                            {CONTENT_FIELD_LABELS[key]} (tối đa {CONTENT_FIELD_LIMITS[key]} ký tự)
                          </span>
                          {multiline ? (
                            <textarea
                              rows={key === 'aboutBioLong' || key === 'heroSubtitle' ? 3 : 2}
                              value={contentDrafts[key]}
                              onChange={(e) => handleContentFieldChange(key, e.target.value)}
                              disabled={!isAdmin}
                              className="mt-1 w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white disabled:opacity-60"
                            />
                          ) : (
                            <input
                              type="text"
                              value={contentDrafts[key]}
                              onChange={(e) => handleContentFieldChange(key, e.target.value)}
                              disabled={!isAdmin}
                              className="mt-1 w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white disabled:opacity-60"
                            />
                          )}
                          {hint && (
                            <span className="mt-1 block text-neutral-500 dark:text-neutral-400">{hint}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-neutral-900 dark:text-white">Bảng giá — Mô tả ngắn từng gói</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PACKAGE_FORM_META.map((p) => (
                      <label key={p.id} className="block text-xs">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {p.name} (tối đa {CONTENT_FIELD_LIMITS.packageDescription} ký tự)
                        </span>
                        <textarea
                          rows={2}
                          value={contentDrafts.packageDescriptions[p.id]}
                          onChange={(e) => handlePackageDescChange(p.id, e.target.value)}
                          disabled={!isAdmin}
                          className="mt-1 w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white disabled:opacity-60"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                {contentErrors.length > 0 && (
                  <div role="alert" className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                    {contentErrors.map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                  </div>
                )}
                {contentSaveMsg && (
                  <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400">{contentSaveMsg}</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveSiteContent}
                    disabled={isSavingContent || !isAdmin}
                    className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-500 rounded-md cursor-pointer disabled:opacity-60"
                  >
                    {isSavingContent ? 'Đang lưu...' : 'Lưu nội dung'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSiteContent}
                    disabled={isSavingContent || !isAdmin}
                    className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md cursor-pointer disabled:opacity-60"
                  >
                    Khôi phục mặc định
                  </button>
                  <span className="text-xs text-neutral-500">
                    {contentUpdatedAt
                      ? `Lưu lần cuối: ${contentUpdatedAt}`
                      : 'Chưa có thông tin lần lưu nội dung cuối.'}
                  </span>
                </div>
              </div>

              {/* Service packages summary — sua duoc gia (luu qua onSavePackagePrices) */}
              <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                <div className="text-xs font-sans tabular-nums uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold">
                  3. CÁC GÓI CHỤP ĐANG CÔNG KHAI TRÊN WEBSITE
                </div>
                <p className="text-xs text-neutral-500">
                  Nhập giá mới (VNĐ, chỉ nhập số — ví dụ 650000 sẽ hiện 650.000), bấm "Lưu giá" để áp dụng cho toàn website.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PACKAGE_FORM_META.map((p) => (
                    <div key={p.id} className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs space-y-2">
                      <div className="font-semibold text-neutral-900 dark:text-white">{p.name}</div>
                      <p className="text-neutral-500">{p.desc}</p>
                      <label className="block">
                        <span className="text-neutral-600 dark:text-neutral-400">Giá gói (VNĐ)</span>
                        <span className="mt-1 flex items-center gap-1.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={priceDrafts[p.id]}
                            onChange={(e) => handlePriceInputChange(p.id, e.target.value)}
                            disabled={!isAdmin}
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md font-sans tabular-nums text-amber-600 dark:text-amber-400 font-semibold disabled:opacity-60"
                          />
                          <span className="text-neutral-500 font-sans tabular-nums shrink-0">đ</span>
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs space-y-1">
                  <label className="block">
                    <span className="font-semibold text-neutral-900 dark:text-white">Phí vượt người — gói Kỉ Yếu Nhóm (trên 15 bạn, tính thêm /người vượt)</span>
                    <span className="mt-1 flex items-center gap-1.5 max-w-xs">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={extraDraft}
                        onChange={(e) => handleExtraInputChange(e.target.value)}
                        disabled={!isAdmin}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md font-sans tabular-nums text-amber-600 dark:text-amber-400 font-semibold disabled:opacity-60"
                      />
                      <span className="text-neutral-500 font-sans tabular-nums shrink-0">đ/người</span>
                    </span>
                  </label>
                  <p className="text-neutral-500">
                    Hiện tại: {formatVND(effectivePrices.extraPerPerson)}/người vượt (mặc định {formatVND(DEFAULT_PACKAGE_PRICES.extraPerPerson)}).
                  </p>
                </div>
                {priceErrors.length > 0 && (
                  <div role="alert" className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                    {priceErrors.map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                  </div>
                )}
                {priceSaveMsg && (
                  <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400">{priceSaveMsg}</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSavePackagePrices}
                    disabled={isSavingPrices || !isAdmin}
                    className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-500 rounded-md cursor-pointer disabled:opacity-60"
                  >
                    {isSavingPrices ? 'Đang lưu...' : 'Lưu giá'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPackagePrices}
                    disabled={isSavingPrices || !isAdmin}
                    className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md cursor-pointer disabled:opacity-60"
                  >
                    Khôi phục giá mặc định
                  </button>
                  <span className="text-xs text-neutral-500">
                    {pricingUpdatedAt
                      ? `Lưu lần cuối: ${pricingUpdatedAt}`
                      : 'Chưa có thông tin lần lưu giá cuối.'}
                  </span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  ⚠️ Giá mới áp dụng ngay cho đơn đặt mới, đơn cũ giữ giá lúc đặt.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: EDIT LEAD NOTES & COUNSELING DETAIL */}
      {editingLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0c0c0e] border border-neutral-200 dark:border-neutral-800 rounded-xl w-full max-w-lg shadow-xl p-6 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
                  Tư Vấn Khách Hàng: {editingLead.clientName}
                </h3>
                <p className="text-xs text-neutral-500 font-sans tabular-nums">
                  Mã #{editingLead.id} · Đăng ký lúc: {editingLead.createdAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingLead(null)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Client summary */}
            <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2 font-sans tabular-nums">
              <div className="flex justify-between">
                <span className="text-neutral-500">Số Điện Thoại / Zalo:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{editingLead.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Email:</span>
                <span className="text-neutral-800 dark:text-neutral-200">{editingLead.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Gói Dịch Vụ:</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  {getPackageDetails(editingLead.packageType).name} ({formatVND(editingLead.estimatedPrice)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Ngày & Địa Điểm:</span>
                <span className="text-neutral-800 dark:text-neutral-200">{editingLead.preferredDate} · {editingLead.location}</span>
              </div>
            </div>

            {editingLead.message && (
              <div className="text-xs space-y-1">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Lời nhắn / Concept của khách:
                </span>
                <p className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 text-neutral-700 dark:text-neutral-300 italic border border-amber-200 dark:border-amber-900/40">
                  "{editingLead.message}"
                </p>
              </div>
            )}

            {/* Quick 1-click Contact Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href={`tel:${editingLead.phone.replace(/[^0-9]/g, '')}`}
                className="flex-1 py-2 text-center text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Gọi Điện</span>
              </a>
              <a
                href={`https://zalo.me/${editingLead.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 text-center text-xs font-semibold rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Nhắn Zalo</span>
              </a>
              <a
                href={`mailto:${editingLead.email}?subject=Yên Photo tư vấn lịch chụp kỉ yếu & áo dài`}
                className="flex-1 py-2 text-center text-xs font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Gửi Mail</span>
              </a>
            </div>

            {/* Edit Notes Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Ghi chú tư vấn nội bộ (Lịch hẹn, thỏa thuận concept, địa điểm đón xe):
              </label>
              <textarea
                rows={3}
                value={editNotesText}
                onChange={(e) => setEditNotesText(e.target.value)}
                placeholder="Ví dụ: Đã gọi khách, hẹn 7:30 sáng thứ Bảy tại cổng trường Chu Văn An, chuẩn bị 2 nón lá..."
                className="w-full p-3 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setEditingLead(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 rounded-md cursor-pointer shadow-xs"
              >
                Lưu Ghi Chú
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FULL EMAIL LOG PREVIEW */}
      {viewingEmailLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0c0c0e] border border-neutral-200 dark:border-neutral-800 rounded-xl w-full max-w-2xl shadow-xl p-6 space-y-4 animate-in fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
                  Chi Tiết Email Thông Báo Gửi Về
                </h3>
                <p className="text-xs text-neutral-500 font-sans tabular-nums">
                  Gửi tới: {viewingEmailLog.toEmail} · {viewingEmailLog.sentAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingEmailLog(null)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 font-sans tabular-nums text-xs">
              <div className="text-neutral-500">TIÊU ĐỀ:</div>
              <div className="font-semibold text-neutral-900 dark:text-white p-2 bg-neutral-100 dark:bg-neutral-900 rounded">
                {viewingEmailLog.subject}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto font-sans tabular-nums text-xs p-4 bg-neutral-50 dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
              {viewingEmailLog.fullBody}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(viewingEmailLog.fullBody);
                  triggerCopyToast('Đã sao chép toàn bộ nội dung email!');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao Chép Nội Dung</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingEmailLog(null)}
                  className="px-4 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded cursor-pointer"
                >
                  Đóng
                </button>
                <a
                  href={`mailto:${viewingEmailLog.toEmail}?subject=${encodeURIComponent(viewingEmailLog.subject)}&body=${encodeURIComponent(viewingEmailLog.fullBody)}`}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-500 rounded cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở Trình Mail Thật</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MANUAL LEAD CREATION */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateManualLeadSubmit}
            className="bg-white dark:bg-[#0c0c0e] border border-neutral-200 dark:border-neutral-800 rounded-xl w-full max-w-lg shadow-xl p-6 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
                Thêm Yêu Cầu Khách Hàng Thủ Công
              </h3>
              <button
                type="button"
                onClick={() => setIsAddLeadModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">
                  Tên khách hàng / Đại diện lớp *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Mai Linh (Lớp 12D Phan Đình Phùng)"
                  value={newLeadForm.clientName}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, clientName: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">
                    Số điện thoại / Zalo *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0961..."
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="mail@gmail.com"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">
                    Gói chụp
                  </label>
                  <select
                    value={newLeadForm.packageType}
                    onChange={(e) =>
                      setNewLeadForm({
                        ...newLeadForm,
                        packageType: e.target.value as BookingLead['packageType'],
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-900 dark:text-white"
                  >
                    <option value="aodai-solo">Áo Dài Nàng Thơ ({formatPriceK(effectivePrices['aodai-solo'])})</option>
                    <option value="kiyieu-lop">Kỉ Yếu Nhóm Bạn ({formatPriceK(effectivePrices['kiyieu-lop'])})</option>
                    <option value="cophuc-heritage">Áo Dài Cổ Phục ({formatPriceK(effectivePrices['cophuc-heritage'])})</option>
                    <option value="photobook-print">Gói Rửa Ảnh ({formatPriceK(effectivePrices['photobook-print'])})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 mb-1">
                    Ngày dự kiến
                  </label>
                  <input
                    type="date"
                    value={newLeadForm.preferredDate}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, preferredDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">
                  Tiền cọc đã thu (VNĐ)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="0"
                  value={newLeadForm.paidAmount}
                  onChange={(e) =>
                    setNewLeadForm({
                      ...newLeadForm,
                      paidAmount: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 mb-1">
                  Địa điểm mong muốn
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phan Đình Phùng, Hoàng Thành, Sân trường..."
                  value={newLeadForm.location}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 mb-1">
                  Ghi chú tư vấn ban đầu
                </label>
                <textarea
                  rows={2}
                  placeholder="Khách nhắn qua Zalo, thích phong cách nhẹ nhàng..."
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsAddLeadModalOpen(false)}
                className="px-4 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-500 rounded shadow-xs"
              >
                Tạo Yêu Cầu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
