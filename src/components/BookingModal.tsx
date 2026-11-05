/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  X,
  Mail,
  Calendar,
  CheckCircle2,
  Sparkles,
  Camera,
  MapPin,
  Clock,
  GraduationCap,
  Users,
  MessageSquare,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  BookingInquiry,
  BookingLead,
  EmailNotificationLog,
  validateBookingInquiry,
  getPackageDetails,
  sendBookingEmailReal,
  generateEmailNotification,
  TIME_SLOTS,
  HANOI_LOCATIONS,
  tomorrowISO,
  timeSlotLabel,
  calculateEstimatedPrice,
  calculateDepositAmount,
  normalizePhone,
  formatVND,
} from '../utils/portfolioLogic';
import { SITE_CONFIG } from '../config/site';
import { saveBookingLeadToCloud, saveEmailLogToCloud } from '../services/firebase';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingSubmitted?: (
    inquiry: BookingInquiry,
    lead?: BookingLead,
    emailLog?: EmailNotificationLog
  ) => void;
  photographerEmail?: string;
  existingLeads?: BookingLead[];
  initialPackage?: BookingInquiry['packageType'];
}

const SCHOOL_OPTION = 'Trường học (ghi rõ tên trường)';
const OTHER_OPTION = 'Khác';

function defaultGroupCount(packageType: BookingInquiry['packageType']): number {
  return packageType === 'kiyieu-lop' ? 5 : 1;
}

function maxGroupCount(packageType: BookingInquiry['packageType']): number {
  return packageType === 'kiyieu-lop' ? 30 : 2;
}

function minGroupCount(packageType: BookingInquiry['packageType']): number {
  // Goi kiyieu nhom ap dung tu 5 ban (ten goi "5 - 15 ban"); cac goi khac tu 1.
  return packageType === 'kiyieu-lop' ? 5 : 1;
}

function resolveLocation(
  locationChoice: string,
  schoolName: string,
  customLocation: string
): string {
  if (locationChoice === SCHOOL_OPTION) {
    const name = schoolName.trim();
    if (!name) return locationChoice;
    return /^trường\b/i.test(name) ? name : `Trường ${name}`;
  }
  if (locationChoice === OTHER_OPTION) {
    return customLocation.trim() || OTHER_OPTION;
  }
  return locationChoice;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onBookingSubmitted,
  photographerEmail = SITE_CONFIG.photographerEmail,
  existingLeads = [],
  initialPackage,
}) => {
  const initialPkg = initialPackage ?? 'aodai-solo';
  const initialCount = defaultGroupCount(initialPkg);

  const [formData, setFormData] = useState<BookingInquiry>({
    clientName: '',
    email: '',
    phone: '',
    packageType: initialPkg,
    preferredDate: '',
    location: HANOI_LOCATIONS[0],
    groupSize: `${initialCount} bạn`,
    groupCount: initialCount,
    timeSlot: undefined,
    message: '',
  });

  const [locationChoice, setLocationChoice] = useState<string>(HANOI_LOCATIONS[0]);
  const [schoolName, setSchoolName] = useState('');
  const [customLocation, setCustomLocation] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState<{
    id: string;
    inquiry: BookingInquiry;
    details: ReturnType<typeof getPackageDetails>;
    emailStatusMsg?: string;
    estimatedPrice: number;
    depositAmount: number;
    balance: number;
  } | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingInquiry, setPendingInquiry] = useState<BookingInquiry | null>(null);

  // Khi initialPackage thay đổi / modal mở thì đặt packageType theo nó.
  useEffect(() => {
    if (isOpen && initialPackage) {
      const count = defaultGroupCount(initialPackage);
      setFormData((prev) => ({
        ...prev,
        packageType: initialPackage,
        groupCount: count,
        groupSize: `${count} bạn`,
        timeSlot: initialPackage === 'photobook-print' ? undefined : prev.timeSlot,
      }));
    }
  }, [isOpen, initialPackage]);

  if (!isOpen) return null;

  const isPhotobook = formData.packageType === 'photobook-print';
  const currentPackageDetails = getPackageDetails(formData.packageType);
  const groupCount = formData.groupCount ?? defaultGroupCount(formData.packageType);
  const estimatedPriceLive = calculateEstimatedPrice(formData.packageType, groupCount);
  const depositLive = calculateDepositAmount(estimatedPriceLive);
  const balanceLive = Math.max(0, estimatedPriceLive - 0);

  const handlePackageChange = (pkg: BookingInquiry['packageType']) => {
    const count = defaultGroupCount(pkg);
    setFormData((prev) => ({
      ...prev,
      packageType: pkg,
      groupCount: count,
      groupSize: `${count} bạn`,
      timeSlot: pkg === 'photobook-print' ? undefined : prev.timeSlot,
    }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.timeSlot;
      return copy;
    });
  };

  const handleGroupCountChange = (delta: number) => {
    setFormData((prev) => {
      const current = prev.groupCount ?? defaultGroupCount(prev.packageType);
      const next = Math.min(
        maxGroupCount(prev.packageType),
        Math.max(minGroupCount(prev.packageType), current + delta)
      );
      return { ...prev, groupCount: next, groupSize: `${next} bạn` };
    });
  };

  const buildEffectiveInquiry = (): BookingInquiry => {
    if (isPhotobook) {
      return {
        ...formData,
        location: '',
        groupCount: undefined,
        groupSize: undefined,
        timeSlot: undefined,
      };
    }
    const count = formData.groupCount ?? defaultGroupCount(formData.packageType);
    return {
      ...formData,
      location: resolveLocation(locationChoice, schoolName, customLocation),
      groupCount: count,
      groupSize: `${count} bạn`,
    };
  };

  const proceedBooking = async (inquiry: BookingInquiry) => {
    setErrors({});
    setIsSubmitting(true);

    const bookingId = `KY-${Date.now().toString().slice(-6)}`;
    const now = new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const estimatedPrice = calculateEstimatedPrice(inquiry.packageType, inquiry.groupCount);
    const depositAmount = calculateDepositAmount(estimatedPrice);
    const paidAmount = 0;
    const balance = Math.max(0, estimatedPrice - paidAmount);

    const tempLead: BookingLead = {
      ...inquiry,
      id: bookingId,
      createdAt: now,
      status: 'new',
      notes: 'Yêu cầu từ form web Yên Photo',
      source: 'web_form',
      estimatedPrice,
      depositAmount,
      paidAmount,
      balance,
      emailSentTo: photographerEmail,
      emailSentAt: now,
    };

    // Save permanently to Cloud Firestore
    try {
      await saveBookingLeadToCloud(tempLead);
    } catch (dbErr) {
      console.warn('Cloud Firestore save warning:', dbErr);
    }

    // Real-time dispatch to photographer's Gmail inbox.
    // KHÔNG báo "đã gửi email": chỉ dùng message thật trả về từ
    // sendBookingEmailReal; nếu không có thì dùng câu dự phòng trung thực.
    let emailStatusMsg = 'Đơn đã lưu, Anh Yên sẽ liên hệ qua Zalo/SĐT trong ngày.';
    try {
      const emailResult = await sendBookingEmailReal(tempLead, photographerEmail);
      if (emailResult.message) {
        emailStatusMsg = emailResult.message;
      }
    } catch (err) {
      console.warn('Real email send attempt:', err);
    }

    const emailLog = generateEmailNotification(tempLead, photographerEmail);
    try {
      await saveEmailLogToCloud(emailLog);
    } catch (logErr) {
      console.warn('Cloud Firestore email log warning:', logErr);
    }

    setIsSubmitting(false);
    setShowDuplicateWarning(false);
    setPendingInquiry(null);
    setSubmittedBooking({
      id: bookingId,
      inquiry,
      details: getPackageDetails(inquiry.packageType),
      emailStatusMsg,
      estimatedPrice,
      depositAmount,
      balance,
    });

    if (onBookingSubmitted) {
      onBookingSubmitted(inquiry, tempLead, emailLog);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveInquiry = buildEffectiveInquiry();
    const validation = validateBookingInquiry(effectiveInquiry);
    const nextErrors = { ...validation.errors };

    // Ô nhập thêm khi chọn "Trường học" / "Khác" là bắt buộc để gộp địa điểm.
    if (!isPhotobook && locationChoice === SCHOOL_OPTION && !schoolName.trim()) {
      nextErrors.location = 'Vui lòng nhập tên trường';
    }
    if (!isPhotobook && locationChoice === OTHER_OPTION && !customLocation.trim()) {
      nextErrors.location = 'Vui lòng nhập địa điểm chụp';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    // Trùng lịch: cùng SĐT đã chuẩn hoá + cùng ngày + cùng khung giờ,
    // bỏ qua đơn đã cancelled. Chỉ cảnh báo xác nhận, KHÔNG chặn cứng.
    // Gói photobook không có khung giờ nên không kiểm tra trùng.
    if (!isPhotobook) {
      const isDuplicate = (existingLeads || []).some(
        (lead) =>
          lead.status !== 'cancelled' &&
          normalizePhone(lead.phone) === normalizePhone(effectiveInquiry.phone) &&
          lead.preferredDate === effectiveInquiry.preferredDate &&
          lead.timeSlot === effectiveInquiry.timeSlot
      );
      if (isDuplicate) {
        setPendingInquiry(effectiveInquiry);
        setShowDuplicateWarning(true);
        return;
      }
    }

    await proceedBooking(effectiveInquiry);
  };

  const handleResetAndClose = () => {
    const pkg = initialPackage ?? 'aodai-solo';
    const count = defaultGroupCount(pkg);
    setSubmittedBooking(null);
    setShowDuplicateWarning(false);
    setPendingInquiry(null);
    setLocationChoice(HANOI_LOCATIONS[0]);
    setSchoolName('');
    setCustomLocation('');
    setFormData({
      clientName: '',
      email: '',
      phone: '',
      packageType: pkg,
      preferredDate: '',
      location: HANOI_LOCATIONS[0],
      groupSize: `${count} bạn`,
      groupCount: count,
      timeSlot: undefined,
      message: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Đặt lịch chụp kỉ yếu & áo dài"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in"
    >
      <div className="bg-white dark:bg-[#0c0c0e] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="text-lg font-serif font-medium text-neutral-900 dark:text-white">
                Đặt Lịch Chụp Kỉ Yếu & Áo Dài (Sony A7 Mark III)
              </h3>
              <p className="text-xs text-neutral-500">
                Gói chụp thân thiện giá sinh viên · Chụp không giới hạn file · Hướng dẫn tạo dáng tận tâm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {submittedBooking ? (
          /* Confirmation Success State */
          <div className="p-8 text-center space-y-6 overflow-y-auto flex-1">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                ĐÃ GHI NHẬN LỊCH HẸN THÀNH CÔNG
              </span>
              <h3 className="text-2xl font-serif text-neutral-900 dark:text-white">
                Cảm ơn bạn, {submittedBooking.inquiry.clientName}!
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                Anh Yên đã nhận thông tin và sẽ nhắn tin trực tiếp qua Zalo / Số điện thoại{' '}
                <strong className="text-neutral-900 dark:text-white">{submittedBooking.inquiry.phone}</strong> và gửi báo giá qua email{' '}
                <strong className="text-neutral-900 dark:text-white">{submittedBooking.inquiry.email}</strong> sớm nhất trong ngày.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{submittedBooking.emailStatusMsg}</span>
              </div>
              {submittedBooking.inquiry.packageType !== 'photobook-print' ? (
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Anh Yên sẽ nhắn Zalo nhắc lịch trước 1 ngày.
                </p>
              ) : (
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Anh Yên sẽ nhắn Zalo báo khi ảnh in xong.
                </p>
              )}
            </div>

            {/* Voucher Card */}
            <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-neutral-500">MÃ XÁC NHẬN</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{submittedBooking.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">GÓI DỊCH VỤ</span>
                <span className="text-neutral-900 dark:text-white font-medium">{submittedBooking.details.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">TỔNG TIỀN ƯỚC TÍNH</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{formatVND(submittedBooking.estimatedPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">TIỀN CỌC 30%</span>
                <span className="text-neutral-900 dark:text-white font-medium">{formatVND(submittedBooking.depositAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">CÒN LẠI</span>
                <span className="text-neutral-900 dark:text-white font-medium">{formatVND(submittedBooking.balance)}</span>
              </div>
              {!isPhotobook && submittedBooking.inquiry.timeSlot && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">KHUNG GIỜ</span>
                  <span className="text-neutral-900 dark:text-white">{timeSlotLabel(submittedBooking.inquiry.timeSlot)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">
                  {submittedBooking.inquiry.packageType === 'photobook-print'
                    ? 'NGÀY MUỐN NHẬN ẢNH'
                    : 'NGÀY CHỤP DỰ KIẾN'}
                </span>
                <span className="text-neutral-900 dark:text-white">{submittedBooking.inquiry.preferredDate}</span>
              </div>
              {submittedBooking.inquiry.packageType !== 'photobook-print' && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">ĐỊA ĐIỂM</span>
                  <span className="text-neutral-900 dark:text-white">{submittedBooking.inquiry.location}</span>
                </div>
              )}
              {submittedBooking.inquiry.packageType !== 'photobook-print' && submittedBooking.inquiry.groupSize && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">SỐ NGƯỜI</span>
                  <span className="text-neutral-900 dark:text-white">{submittedBooking.inquiry.groupSize}</span>
                </div>
              )}
              <p className="pt-2 border-t border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                Vui lòng nhắn Zalo {SITE_CONFIG.phoneDisplay} để nhận STK chuyển cọc.
              </p>
            </div>

            {/* Quick action buttons: Direct Zalo / Close */}
            <div className="space-y-2.5 pt-2">
              <a
                href={SITE_CONFIG.zaloUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Nhắn Zalo Trực Tiếp Với Anh Yên ({SITE_CONFIG.phoneDisplay})</span>
              </a>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
              >
                Hoàn Tất & Đóng Cửa Sổ
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Package Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Lựa chọn gói chụp kỉ yếu / áo dài *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'aodai-solo', title: 'Áo Dài Nàng Thơ / Cá Nhân (650k)' },
                  { id: 'kiyieu-lop', title: 'Kỉ Yếu Nhóm Bạn Thân (1.200k)' },
                  { id: 'cophuc-heritage', title: 'Áo Dài Cổ Phục & Phố Cổ (850k)' },
                  { id: 'photobook-print', title: 'Gói Rửa Ảnh & Set Để Bàn (450k)' },
                ].map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() =>
                      handlePackageChange(pkg.id as BookingInquiry['packageType'])
                    }
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      formData.packageType === pkg.id
                        ? 'border-amber-600 dark:border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 text-neutral-900 dark:text-white font-medium ring-1 ring-amber-500'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    <div className="text-xs font-medium">{pkg.title}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Package details summary box */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
              <div className="flex items-center justify-between font-medium">
                <span className="text-neutral-900 dark:text-white font-serif text-sm">
                  {currentPackageDetails.name}
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                  {currentPackageDetails.formattedPrice}
                </span>
              </div>
              <div className="text-neutral-500 text-[11px] font-mono">
                Thời lượng: {currentPackageDetails.duration}
              </div>
              <div className="space-y-1 pt-1 text-neutral-600 dark:text-neutral-400 text-[11px]">
                {currentPackageDetails.deliverables.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-amber-500">✓</span>
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Client info inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                  Họ tên hoặc Tên Lớp/Nhóm *
                </label>
                <input
                  type="text"
                  placeholder="Vd: Nguyễn Mai Linh / Lớp 12A1 Chu Văn An"
                  value={formData.clientName}
                  onChange={(e) => {
                    setFormData({ ...formData, clientName: e.target.value });
                    if (errors.clientName) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.clientName;
                        return copy;
                      });
                    }
                  }}
                  className={`w-full text-xs px-3 py-2 rounded border bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden transition-colors ${
                    errors.clientName
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30'
                      : 'border-neutral-300 dark:border-neutral-700 focus:border-amber-500'
                  }`}
                />
                {errors.clientName && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.clientName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                  Email nhận ảnh & hợp đồng *
                </label>
                <input
                  type="email"
                  placeholder="Vd: mailinh@gmail.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.email;
                        return copy;
                      });
                    }
                  }}
                  className={`w-full text-xs px-3 py-2 rounded border bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden transition-colors ${
                    errors.email
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30'
                      : 'border-neutral-300 dark:border-neutral-700 focus:border-amber-500'
                  }`}
                />
                {errors.email && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                  Số điện thoại / Zalo liên hệ *
                </label>
                <input
                  type="tel"
                  placeholder={`Vd: ${SITE_CONFIG.phoneDisplay}`}
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.phone;
                        return copy;
                      });
                    }
                  }}
                  className={`w-full text-xs px-3 py-2 rounded border bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden transition-colors ${
                    errors.phone
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30'
                      : 'border-neutral-300 dark:border-neutral-700 focus:border-amber-500'
                  }`}
                />
                {errors.phone && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                  {isPhotobook ? 'Ngày muốn nhận ảnh *' : 'Ngày dự kiến chụp *'}
                </label>
                <input
                  type="date"
                  min={tomorrowISO()}
                  value={formData.preferredDate}
                  onChange={(e) => {
                    setFormData({ ...formData, preferredDate: e.target.value });
                    if (errors.preferredDate) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.preferredDate;
                        return copy;
                      });
                    }
                  }}
                  className={`w-full text-xs px-3 py-2 rounded border bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden transition-colors ${
                    errors.preferredDate
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30'
                      : 'border-neutral-300 dark:border-neutral-700 focus:border-amber-500'
                  }`}
                />
                {errors.preferredDate && (
                  <p className="text-[11px] text-rose-500 mt-1">
                    {errors.preferredDate}
                  </p>
                )}
              </div>
            </div>

            {/* Khung giờ — bắt buộc với mọi gói trừ photobook-print */}
            {!isPhotobook && (
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Khung giờ chụp *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Khung giờ chụp">
                  {TIME_SLOTS.map((slot) => (
                    <label
                      key={slot.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        formData.timeSlot === slot.id
                          ? 'border-amber-600 dark:border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 text-neutral-900 dark:text-white font-medium ring-1 ring-amber-500'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="timeSlot"
                        value={slot.id}
                        checked={formData.timeSlot === slot.id}
                        onChange={() => {
                          setFormData({ ...formData, timeSlot: slot.id });
                          if (errors.timeSlot) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.timeSlot;
                              return copy;
                            });
                          }
                        }}
                        className="accent-amber-600"
                      />
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{slot.label}</span>
                    </label>
                  ))}
                </div>
                {errors.timeSlot && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.timeSlot}</p>
                )}
              </div>
            )}

            {/* Địa điểm + Số người — ẩn với gói photobook-print */}
            {!isPhotobook && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                    Địa điểm chụp mong muốn
                  </label>
                  <select
                    value={locationChoice}
                    onChange={(e) => {
                      setLocationChoice(e.target.value);
                      setFormData((prev) => ({ ...prev, location: e.target.value }));
                      if (errors.location) {
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.location;
                          return copy;
                        });
                      }
                    }}
                    className="w-full text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                  >
                    {HANOI_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  {locationChoice === SCHOOL_OPTION && (
                    <input
                      type="text"
                      placeholder="Nhập tên trường, vd: THPT Chu Văn An"
                      value={schoolName}
                      onChange={(e) => {
                        setSchoolName(e.target.value);
                        if (errors.location) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.location;
                            return copy;
                          });
                        }
                      }}
                      className="mt-2 w-full text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                    />
                  )}
                  {locationChoice === OTHER_OPTION && (
                    <input
                      type="text"
                      placeholder="Nhập địa điểm khác tại Hà Nội"
                      value={customLocation}
                      onChange={(e) => {
                        setCustomLocation(e.target.value);
                        if (errors.location) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.location;
                            return copy;
                          });
                        }
                      }}
                      className="mt-2 w-full text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                    />
                  )}
                  {errors.location && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.location}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                    Số lượng người chụp dự kiến
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Giảm số người"
                      onClick={() => handleGroupCountChange(-1)}
                      disabled={groupCount <= minGroupCount(formData.packageType)}
                      className="w-8 h-8 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-500 cursor-pointer"
                    >
                      −
                    </button>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white min-w-16 text-center">
                      {groupCount} bạn
                    </span>
                    <button
                      type="button"
                      aria-label="Tăng số người"
                      onClick={() => handleGroupCountChange(1)}
                      disabled={groupCount >= maxGroupCount(formData.packageType)}
                      className="w-8 h-8 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-500 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    {formData.packageType === 'kiyieu-lop'
                      ? 'Nhóm 5–15 bạn giá gốc 1.200k; vượt 15 người tính thêm 80k/người vượt.'
                      : 'Tối đa 2 bạn cho gói này.'}
                  </p>
                  {errors.groupSize && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.groupSize}</p>
                  )}
                </div>
              </div>
            )}

            {/* Tổng tiền ước tính + cọc 30% live — hien cho ca goi photobook
                (man hinh xac nhan sau do cung hien coc, khong duoc giau o form). */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">TỔNG TIỀN ƯỚC TÍNH</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">{formatVND(estimatedPriceLive)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">TIỀN CỌC 30%</span>
                  <span className="text-neutral-900 dark:text-white font-medium">{formatVND(depositLive)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">CÒN LẠI</span>
                  <span className="text-neutral-900 dark:text-white font-medium">{formatVND(balanceLive)}</span>
                </div>
                {formData.packageType === 'kiyieu-lop' && groupCount > 15 && (
                  <p className="text-[11px] text-neutral-500">
                    Đã tính thêm {(groupCount - 15) * 80000}đ cho {groupCount - 15} người vượt 15 người (80k/người).
                  </p>
                )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono uppercase text-neutral-700 dark:text-neutral-300">
                  Concept & Ý tưởng mong muốn <span className="text-neutral-400 font-normal lowercase">(tùy chọn)</span>
                </label>
                <span className="text-[10px] text-neutral-400 font-mono">Có thể để trống hoặc nhắn tin vắn tắt</span>
              </div>
              <textarea
                rows={3}
                placeholder="Vd: Chụp áo dài trắng nữ sinh hoặc cổ phục, cần hướng dẫn tạo dáng... (Có thể nhắn 'hi' hoặc để trống nếu bạn cần studio gọi tư vấn từ đầu)"
                value={formData.message}
                onChange={(e) => {
                  setFormData({ ...formData, message: e.target.value });
                  if (errors.message) {
                    setErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.message;
                      return copy;
                    });
                  }
                }}
                className={`w-full text-xs p-3 rounded border bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden transition-colors ${
                  errors.message
                    ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30'
                    : 'border-neutral-300 dark:border-neutral-700 focus:border-amber-500'
                }`}
              />
              {errors.message && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.message}</p>
              )}
            </div>

            {/* Cảnh báo trùng lịch — chỉ xác nhận, không chặn cứng */}
            {showDuplicateWarning && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs space-y-3"
              >
                <p className="text-amber-800 dark:text-amber-200 font-medium">
                  Đã có đơn cùng SĐT, ngày và khung giờ này. Bạn vẫn muốn đặt thêm?
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => pendingInquiry && proceedBooking(pendingInquiry)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer disabled:opacity-60"
                  >
                    Vẫn đặt
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDuplicateWarning(false);
                      setPendingInquiry(null);
                    }}
                    className="px-4 py-2 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Quay lại sửa
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 rounded-md transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang Gửi Tới Anh Yên...</span>
                  </>
                ) : (
                  <span>Gửi Yêu Cầu Tư Vấn & Báo Giá</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
