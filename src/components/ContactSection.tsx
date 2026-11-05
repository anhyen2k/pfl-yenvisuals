/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mail, MapPin, Clock, ArrowRight, Instagram, Phone, Sparkles, GraduationCap } from 'lucide-react';

interface ContactSectionProps {
  onOpenBooking: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onOpenBooking }) => {
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
            Yên Visuals luôn sẵn sàng lắng nghe ý tưởng của bạn, tư vấn địa điểm đẹp và tạo bầu không khí thoải mái, vui vẻ nhất.
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
              href="tel:0912888266"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-xs font-semibold tracking-wider uppercase text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded-md transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Gọi / Zalo: 0912.888.266</span>
            </a>
          </div>
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
              Số điện thoại / Zalo: <strong className="text-neutral-900 dark:text-white font-mono text-sm">+84 (0) 912 888 266</strong>
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 font-light">
              Email nhận ảnh: <span className="font-mono text-neutral-900 dark:text-white">anhyenk26@gmail.com</span>
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
