/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/* v7 — Hero toi gian: 1 tieu de Fraunces, 1 dong phu, toi da 2 nut
   (v7.2: Xem Album = chinh, Nhan Zalo = phu; nut phu duoi anh mo form
   dat lich), anh full-bleed 1 anh lon lam chu dao. Bo 4 o so lieu, bo 3
   o tin cay, bo badge may anh / phong to / thanh trang thai — 3 thong tin
   tin cay chuyen gon vao About dang 1 dong. */

import React from 'react';
import { ArrowDown, MessageCircle } from 'lucide-react';
import { PhotoItem, describePhotoAlt } from '../utils/portfolioLogic';
import { DEFAULT_SITE_CONTENT, splitMarqueeItems, type SiteContent } from '../config/content';

interface HeroProps {
  featuredPhoto: PhotoItem;
  onExploreGallery: () => void;
  onSelectPhoto: (photo: PhotoItem) => void;
  onOpenBooking: () => void;
  /** Mo modal ma QR Zalo (v7.4) thay vi mo thang link zalo.me. */
  onOpenZaloQr: () => void;
  /** Noi dung giao dien (tu App / Firestore); khong truyen thi dung mac dinh. */
  content?: SiteContent;
}

export const Hero: React.FC<HeroProps> = ({
  featuredPhoto,
  onExploreGallery,
  onSelectPhoto,
  onOpenBooking,
  onOpenZaloQr,
  content,
}) => {
  const c = content ?? DEFAULT_SITE_CONTENT;
  const marqueeItems = splitMarqueeItems(c.marqueeText);

  return (
    <section className="relative overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-10 md:pb-14">
        {/* Eyebrow — 1 dong duy nhat */}
        <p className="text-xs font-medium uppercase tracking-widest text-amber-700 dark:text-amber-400">
          Yên Photo · Kỉ yếu & Áo dài · Hà Nội
        </p>

        {/* Tieu de chinh Fraunces 48–64px */}
        <h1 className="mt-4 text-[40px] leading-[1.1] sm:text-5xl lg:text-6xl font-serif font-medium tracking-tight text-neutral-900 dark:text-white text-balance max-w-3xl">
          {c.heroTitle}
        </h1>

        {/* Dong phu ngan */}
        <p className="mt-5 text-base sm:text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl">
          {c.heroSubtitle}
        </p>

        {/* Toi da 2 nut: Xem Album (chinh, amber) + Nhan Zalo (phu, outline).
            Yen quyet nut chinh la Xem Album (cuon xuong Gallery) vi tren web
            da co nhieu nut dat lich (Navbar, the goi, nut phu duoi anh). */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExploreGallery}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer"
          >
            <span>{c.heroPrimaryCta}</span>
          </button>

          <button
            type="button"
            onClick={onOpenZaloQr}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Nhắn Zalo</span>
          </button>
        </div>

        {/* Anh full-bleed 1 anh lon lam chu dao */}
        <figure className="mt-10 md:mt-12">
          <div
            className="group relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 cursor-pointer"
            onClick={() => onSelectPhoto(featuredPhoto)}
          >
            <img
              src={featuredPhoto.image}
              alt={describePhotoAlt(featuredPhoto)}
              className="w-full aspect-[16/10] sm:aspect-[16/8] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            <figcaption className="absolute bottom-0 left-0 right-0 p-5 md:p-6 flex items-end justify-between gap-4 text-white">
              <span className="font-serif text-xl md:text-2xl font-medium leading-snug">
                {featuredPhoto.vietnameseTitle}
              </span>
              <span className="hidden sm:block text-xs text-white/80 shrink-0">
                {featuredPhoto.location}
              </span>
            </figcaption>
          </div>

          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={onOpenBooking}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <span>{c.heroSecondaryCta}</span>
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </figure>
      </div>

      {/* Dai chu chay: chi 1 dong manh, nho, mo */}
      <div className="py-2 border-t border-neutral-200 dark:border-neutral-800 overflow-hidden whitespace-nowrap">
        <div className="flex w-max animate-marquee items-center">
          {[0, 1].map((half) => (
            <div
              key={half}
              aria-hidden={half === 1}
              className="flex shrink-0 items-center gap-6 pr-6 text-xs uppercase tracking-widest text-neutral-500/70 dark:text-neutral-500"
            >
              {marqueeItems.map((item, i) => (
                <React.Fragment key={i}>
                  <span>{item}</span>
                  <span aria-hidden="true">·</span>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
