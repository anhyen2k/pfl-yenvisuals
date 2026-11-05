/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, MapPin, Clock, ArrowRight, Instagram, Phone, Sparkles, GraduationCap, Search, PackageSearch } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';
import {
  BookingLead,
  formatStatusLabel,
  timeSlotLabel,
  getPackageDetails,
  formatVND,
  normalizePhone,
} from '../utils/portfolioLogic';

interface ContactSectionProps {
  onOpenBooking: () => void;
  leads?: BookingLead[];
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onOpenBooking, leads = [] }) => {
  const [lookupCode, setLookupCode] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupResult, setLookupResult] = useState<BookingLead | null>(null);
  const [lookupDone, setLookupDone] = useState(false);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const code = lookupCode.trim().toLowerCase();
    const phone = normalizePhone(lookupPhone);
    const found =
      code && phone
        ? leads.find(
            (lead) =>
              lead.id.trim().toLowerCase() === code &&
              normalizePhone(lead.phone) === phone
          )
        : undefined;
    setLookupResult(found ?? null);
    setLookupDone(true);
  };

  const lookupStatus = lookupResult ? formatStatusLabel(lookupResult.status) : null;
  const lookupPackage = lookupResult ? getPackageDetails(lookupResult.packageType) : null;

  return (
    <section id="contact" className="py-16 md:py-24 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-100/40 dark:bg-neutral-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-medium flex items-center justify-center gap-1.5">
            <GraduationCap className="w-4 h-4" />
            <span>TƯ VẤN CONCEPT KỈ YẾU & ÁO DÀI</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif text-neutral-900 dark:text-white leading-tight">
            Cùng Viết Nên Cuốn Sách Kỉ Niệm Thanh Xuân
          </h2>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
            Dù là buổi chụp kỉ yếu lưu niệm cả lớp, nhóm bạn thân gắn bó, hay một bộ ảnh áo dài cá nhân dạo phố thu Hà Nội —
            Yên Photo luôn sẵn sàng lắng nghe ý tưởng của bạn, tư vấn địa điểm đẹp và tạo bầu không khí thoải mái, vui vẻ nhất.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenBooking}
              className="inline-flex items-center gap-2 px-7 py-3.5 text-xs font-semibold tracking-wider uppercase text-white bg-neutral-900 hover:bg-neutral-800 dark:text-neutral-900 dark:bg-white dark:hover:bg-neutral-100 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <span>Nhận Tư Vấn & Báo Giá Ưu Đãi</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href={`tel:${SITE_CONFIG.phone}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 text-xs font-semibold tracking-wider uppercase text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded-md transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Gọi / Zalo: {SITE_CONFIG.phoneDisplay}</span>
            </a>
          </div>
        </div>

        {/* Tra cuu don da dat */}
        <div className="max-w-2xl mx-auto mt-12 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] text-left">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <PackageSearch className="w-4 h-4" />
            <h3 className="text-base font-serif font-medium text-neutral-900 dark:text-white">
              Tra cứu đơn đã đặt
            </h3>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            Nhập mã đơn (vd: KY-...) và số điện thoại đã dùng khi đặt lịch để xem trạng thái và link ảnh.
          </p>

          <form onSubmit={handleLookup} className="mt-4 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              placeholder="Mã đơn (vd: KY-12345)"
              aria-label="Mã đơn"
              className="flex-1 px-3 py-2 text-sm rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200"
            />
            <input
              type="tel"
              value={lookupPhone}
              onChange={(e) => setLookupPhone(e.target.value)}
              placeholder="Số điện thoại đặt lịch"
              aria-label="Số điện thoại đặt lịch"
              className="flex-1 px-3 py-2 text-sm rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:text-neutral-900 dark:bg-white dark:hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tra cứu</span>
            </button>
          </form>

          {lookupDone && !lookupResult && (
            <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">
              Không tìm thấy đơn, kiểm tra lại mã và SĐT. Lưu ý: chỉ tra được đơn đặt
              trên thiết bị/trình duyệt này; nếu bạn đặt lịch ở máy khác, nhắn Zalo{' '}
              {SITE_CONFIG.phoneDisplay} để Anh Yên kiểm tra giúp.
            </p>
          )}

          {lookupResult && lookupStatus && lookupPackage && (
            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-sm space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-neutral-500">Mã đơn: {lookupResult.id}</span>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-md border ${lookupStatus.color} ${lookupStatus.bg} ${lookupStatus.border}`}
                >
                  {lookupStatus.label}
                </span>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300">
                <span className="font-medium text-neutral-900 dark:text-white">Khách hàng: </span>
                {lookupResult.clientName}
              </p>
              <p className="text-neutral-700 dark:text-neutral-300">
                <span className="font-medium text-neutral-900 dark:text-white">
                  {lookupResult.packageType === 'photobook-print' ? 'Ngày nhận ảnh: ' : 'Ngày chụp: '}
                </span>
                {lookupResult.preferredDate}
                {lookupResult.timeSlot ? ` · ${timeSlotLabel(lookupResult.timeSlot)}` : ''}
              </p>
              <p className="text-neutral-700 dark:text-neutral-300">
                <span className="font-medium text-neutral-900 dark:text-white">Gói: </span>
                {lookupPackage.name} ({lookupPackage.formattedPrice})
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2 rounded-md bg-neutral-100 dark:bg-neutral-900">
                  <div className="text-neutral-500">Tiền cọc</div>
                  <div className="font-semibold text-neutral-900 dark:text-white mt-0.5">{formatVND(lookupResult.depositAmount || 0)}</div>
                </div>
                <div className="p-2 rounded-md bg-neutral-100 dark:bg-neutral-900">
                  <div className="text-neutral-500">Đã thu</div>
                  <div className="font-semibold text-neutral-900 dark:text-white mt-0.5">{formatVND(lookupResult.paidAmount || 0)}</div>
                </div>
                <div className="p-2 rounded-md bg-neutral-100 dark:bg-neutral-900">
                  <div className="text-neutral-500">Còn lại</div>
                  <div className="font-semibold text-neutral-900 dark:text-white mt-0.5">{formatVND(lookupResult.balance ?? 0)}</div>
                </div>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 pt-1">
                <span className="font-medium text-neutral-900 dark:text-white">Link ảnh: </span>
                {lookupResult.driveLink ? (
                  <a
                    href={lookupResult.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 dark:text-amber-400 underline break-all"
                  >
                    Xem ảnh trên Google Drive
                  </a>
                ) : (
                  'Chưa có link ảnh, Anh Yên sẽ gửi sau khi trả ảnh'
                )}
              </p>
            </div>
          )}
        </div>

        {/* Studio Locations & Direct Channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800 text-xs">
          <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] space-y-2">
            <div className="font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[11px] font-medium">
              KHU VỰC HOẠT ĐỘNG
            </div>
            <div className="font-serif text-base text-neutral-900 dark:text-white font-medium">
              Ngoại Cảnh & Sân Trường Hà Nội
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 font-light">
              Khu vực Tây Hồ, Ba Đình, Hoàn Kiếm, Cầu Giấy và các trường THPT / Đại Học tại Hà Nội
            </p>
            <div className="text-neutral-500 font-mono text-[11px] pt-1">
              Luôn chủ động đến sớm khảo sát góc nắng đẹp trước giờ chụp
            </div>
          </div>

          <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] space-y-2">
            <div className="font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[11px] font-medium">
              ĐẠO CỤ & HỖ TRỢ TRANG PHỤC
            </div>
            <div className="font-serif text-base text-neutral-900 dark:text-white font-medium">
              Phụ Kiện Chụp Mộc Mạc
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 font-light">
              Sẵn sàng chuẩn bị nón lá truyền thống, quạt lụa và hoa chụp ảnh; tư vấn địa chỉ thuê áo dài / cổ phục giá sinh viên
            </p>
            <div className="text-neutral-500 font-mono text-[11px] pt-1">
              Gợi ý tone makeup trong trẻo nhẹ nhàng chuẩn học đường
            </div>
          </div>

          <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] space-y-2">
            <div className="font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[11px] font-medium">
              ZALO & LIÊN HỆ TRỰC TIẾP
            </div>
            <div className="font-serif text-base text-neutral-900 dark:text-white font-medium">
              Trao Đổi Ý Tưởng Cùng Anh Yên
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 font-light">
              Số điện thoại / Zalo: <strong className="text-neutral-900 dark:text-white font-mono text-sm">{SITE_CONFIG.phoneDisplay}</strong>
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 font-light">
              Email nhận ảnh: <span className="font-mono text-neutral-900 dark:text-white">{SITE_CONFIG.photographerEmail}</span>
            </p>
            <div className="text-neutral-500 font-mono text-[11px] pt-1">
              Phản hồi tin nhắn nhanh chóng, tư vấn concept miễn phí
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
