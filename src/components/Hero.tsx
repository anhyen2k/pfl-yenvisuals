/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowDown, Aperture, Eye, GraduationCap, Check, MessageCircle } from 'lucide-react';
import { PhotoItem } from '../utils/portfolioLogic';
import { SITE_CONFIG } from '../config/site';

interface HeroProps {
  featuredPhoto: PhotoItem;
  onExploreGallery: () => void;
  onSelectPhoto: (photo: PhotoItem) => void;
  onOpenBooking: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  featuredPhoto,
  onExploreGallery,
  onSelectPhoto,
  onOpenBooking,
}) => {

  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-20 border-b border-neutral-200 dark:border-neutral-800">
      {/* Background ambient lighting - warm nostalgia */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-200/30 via-orange-100/20 to-transparent dark:from-amber-950/20 dark:to-transparent pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Split Screen Hero Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Typographic Hierarchy */}
          <div className="lg:col-span-6 space-y-6">
            {/* Clean unboxed kicker metadata */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-medium">
              <span>YÊN PHOTO</span>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span>KỈ YẾU & ÁO DÀI HÀ NỘI</span>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span>SONY A7 MARK III</span>
            </div>

            {/* Headline with balanced wrap */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal tracking-tight text-neutral-900 dark:text-white leading-[1.15] text-balance">
              Lưu giữ thanh xuân trong trẻo & nét duyên tà áo dài Việt.
            </h1>

            {/* Editorial Lead Prose */}
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 font-light leading-relaxed max-w-xl">
              Đồng hành cùng máy ảnh Full-frame <strong>Sony A7 Mark III</strong> trứ danh và sự tận tâm, 
              mình kiên nhẫn hướng dẫn bạn từng góc nghiêng, nụ cười và dáng áo để bắt trọn những khoảnh khắc 
              thanh xuân tự nhiên, rạng rỡ và giàu cảm xúc nhất.
            </p>

            {/* 3 Key Trust Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs text-neutral-700 dark:text-neutral-300">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                <span className="text-amber-600 dark:text-amber-400 font-bold">✓</span>
                <span>Hướng dẫn dáng từ A-Z</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                <span className="text-amber-600 dark:text-amber-400 font-bold">✓</span>
                <span>Trả file gốc trong 24h</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                <span className="text-amber-600 dark:text-amber-400 font-bold">✓</span>
                <span>Giá sinh viên rõ ràng</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onExploreGallery}
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold tracking-wider uppercase text-white bg-neutral-900 hover:bg-neutral-800 dark:text-neutral-900 dark:bg-neutral-100 dark:hover:bg-white rounded-md transition-colors cursor-pointer shadow-xs"
              >
                <span>Xem Album Tác Phẩm</span>
                <ArrowDown className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenBooking}
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold tracking-wider uppercase text-neutral-800 dark:text-neutral-200 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800/60 border border-neutral-300 dark:border-neutral-700 rounded-md transition-colors cursor-pointer"
              >
                <span>Bảng Giá & Đặt Lịch</span>
              </button>

              <a
                href={SITE_CONFIG.zaloUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold tracking-wider uppercase text-neutral-800 dark:text-neutral-200 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800/60 border border-neutral-300 dark:border-neutral-700 rounded-md transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Nhắn Zalo</span>
              </a>
            </div>

            {/* Photographer signature */}
            <div className="pt-2 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              <span className="font-serif italic text-sm text-neutral-900 dark:text-neutral-100 font-semibold">Anh Yên</span>
              <span>— Nhiếp ảnh gia chuyên kỉ yếu & áo dài nghệ thuật Hà Nội</span>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-6">
            <div className="relative group rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 shadow-xl transition-all duration-300">
              {/* Media image */}
              <div
                className="aspect-[16/11] w-full overflow-hidden relative cursor-pointer"
                onClick={() => onSelectPhoto(featuredPhoto)}
              >
                <img
                  src={featuredPhoto.image}
                  alt={featuredPhoto.vietnameseTitle}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-104"
                  referrerPolicy="no-referrer"
                />

                {/* Scrim overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Camera Badge: lay theo anh tieu bieu that, khong cung 85mm */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/20 text-white rounded-md px-3 py-1.5 text-xs font-mono flex items-center gap-2">
                  <Aperture className="w-3.5 h-3.5 text-amber-400" />
                  <span>{featuredPhoto.camera.replace('Sony A7 Mark III', 'Sony A7 III')} · {featuredPhoto.focalLength} {featuredPhoto.aperture}</span>
                </div>

                {/* Interactive click to view */}
                <div className="absolute top-4 left-4 bg-white/15 backdrop-blur-md border border-white/20 text-white rounded-md px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Bấm để phóng to ảnh</span>
                </div>

                {/* Bottom title & metadata overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <div className="text-xs font-mono text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Tác phẩm tiêu biểu · Hà Nội</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif font-medium leading-snug">
                    {featuredPhoto.vietnameseTitle}
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1 line-clamp-1 font-mono">
                    {featuredPhoto.location} · {featuredPhoto.camera} · {featuredPhoto.lens}
                  </p>
                </div>
              </div>

              {/* Clean bottom status bar */}
              <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  ★ Phong cách: Trong trẻo, tự nhiên, tôn nét duyên Việt
                </span>
                <span className="font-mono text-[11px] text-neutral-500">
                  Chụp ngoại cảnh & sân trường
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width statistics & quality commitments */}
        <div className="mt-14 pt-8 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-white">
              Sony A7 III
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Máy Full-Frame Sắc Nét
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-white tabular-nums">
              5–15 bạn
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Nhóm Nhỏ Chụp Kĩ Từng Bạn
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-white">
              24 Giờ
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Trả Toàn Bộ File Gốc Nhanh
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-white">
              Hà Nội
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Chỉ Chụp Ở Hà Nội
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Marquee Divider Ribbon (Mandatory Section Divider from §2.B) —
          chay that bang CSS animation (.animate-marquee trong index.css);
          noi dung nhan doi de chay lien mach (translateX 0 -> -50%). */}
      <div className="mt-12 py-3 bg-neutral-100 dark:bg-neutral-900/60 border-y border-neutral-200 dark:border-neutral-800 overflow-hidden whitespace-nowrap">
        <div className="flex w-max animate-marquee items-center">
          {[0, 1].map((half) => (
            <div
              key={half}
              aria-hidden={half === 1}
              className="flex shrink-0 items-center gap-8 pr-8 text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
            >
              <span>KỈ YẾU HỌC SINH & SINH VIÊN</span>
              <span aria-hidden="true">·</span>
              <span>ÁO DÀI TRẮNG THANH XUÂN</span>
              <span aria-hidden="true">·</span>
              <span>ÁO CỬ NHÂN TỐT NGHIỆP</span>
              <span aria-hidden="true">·</span>
              <span>CỔ PHỤC NHẬT BÌNH & NGŨ THÂN</span>
              <span aria-hidden="true">·</span>
              <span>MÙA THU PHAN ĐÌNH PHÙNG</span>
              <span aria-hidden="true">·</span>
              <span>HOÀNG THÀNH THĂNG LONG</span>
              <span aria-hidden="true">·</span>
              <span>SÂN TRƯỜNG CHU VĂN AN</span>
              <span aria-hidden="true">·</span>
              <span>VĂN MIẾU QUỐC TỬ GIÁM</span>
              <span aria-hidden="true">·</span>
              <span>NẮNG SỚM BỜ HỒ & HƯƠNG SEN TÂY HỒ</span>
              <span aria-hidden="true">·</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
