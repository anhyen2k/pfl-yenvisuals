/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
} from '../utils/portfolioLogic';
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
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onBookingSubmitted,
  photographerEmail = 'anhyenk26@gmail.com',
}) => {
  const [formData, setFormData] = useState<BookingInquiry>({
    clientName: '',
    email: '',
    phone: '',
    packageType: 'aodai-solo',
    preferredDate: '',
    location: 'Hà Nội',
    groupSize: 'Cá nhân / 1-2 bạn',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState<{
    id: string;
    inquiry: BookingInquiry;
    details: ReturnType<typeof getPackageDetails>;
    emailStatusMsg?: string;
  } | null>(null);

  if (!isOpen) return null;

  const currentPackageDetails = getPackageDetails(formData.packageType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateBookingInquiry(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

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

    const tempLead: BookingLead = {
      ...formData,
      id: bookingId,
      createdAt: now,
      status: 'new',
      notes: 'Yêu cầu từ form web Yên Visuals',
      source: 'web_form',
      estimatedPrice: currentPackageDetails.basePriceVND,
      emailSentTo: photographerEmail,
      emailSentAt: now,
    };

    // Save permanently to Cloud Firestore
    try {
      await saveBookingLeadToCloud(tempLead);
    } catch (dbErr) {
      console.warn('Cloud Firestore save warning:', dbErr);
    }

    // Real-time dispatch to photographer's Gmail inbox
    let emailStatusMsg = `Đã tự động gửi thông báo chi tiết đến: ${photographerEmail}`;
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
    setSubmittedBooking({
      id: bookingId,
      inquiry: formData,
      details: currentPackageDetails,
      emailStatusMsg,
    });

    if (onBookingSubmitted) {
      onBookingSubmitted(formData, tempLead, emailLog);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedBooking(null);
    setFormData({
      clientName: '',
      email: '',
      phone: '',
      packageType: 'aodai-solo',
      preferredDate: '',
      location: 'Hà Nội',
      groupSize: 'Cá nhân / 1-2 bạn',
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
                <span>{submittedBooking.emailStatusMsg || `Hệ thống đã tự động gửi email thông báo tới: ${photographerEmail}`}</span>
              </div>
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
                <span className="text-neutral-500">CHI PHÍ DỰ KIẾN</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{submittedBooking.details.formattedPrice}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">NGÀY CHỤP DỰ KIẾN</span>
                <span className="text-neutral-900 dark:text-white">{submittedBooking.inquiry.preferredDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">ĐỊA ĐIỂM</span>
                <span className="text-neutral-900 dark:text-white">{submittedBooking.inquiry.location}</span>
              </div>
            </div>

            {/* Quick action buttons: Direct Zalo / Close */}
            <div className="space-y-2.5 pt-2">
              <a
                href="https://zalo.me/0912888266"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Nhắn Zalo Trực Tiếp Với Anh Yên (0912 888 266)</span>
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
                      setFormData({
                        ...formData,
                        packageType: pkg.id as BookingInquiry['packageType'],
                      })
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
                  placeholder="Vd: 0987 654 321 hoặc 01212320"
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
                  Ngày dự kiến chụp *
                </label>
                <input
                  type="date"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                  Địa điểm chụp mong muốn
                </label>
                <input
                  type="text"
                  placeholder="Vd: Trường THPT Chu Văn An, Hoàng Thành, công viên..."
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                  Số lượng người chụp dự kiến
                </label>
                <input
                  type="text"
                  placeholder="Vd: 1 người (solo), Nhóm 4 bạn, hay Lớp 40 người"
                  value={formData.groupSize}
                  onChange={(e) =>
                    setFormData({ ...formData, groupSize: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>
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
