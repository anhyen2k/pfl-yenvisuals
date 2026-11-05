/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, BookOpen, MapPin, Calendar, Layers } from 'lucide-react';
import { PHOTO_SERIES, PhotoSeries } from '../data/portfolioData';

interface SeriesSectionProps {
  onSelectSeries: (seriesId: string) => void;
}

export const SeriesSection: React.FC<SeriesSectionProps> = ({ onSelectSeries }) => {
  return (
    <section id="series" className="py-16 md:py-24 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-medium mb-2">
              GỢI Ý CONCEPT & ĐỊA ĐIỂM CHỤP
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif text-neutral-900 dark:text-white">
              Bộ Sưu Tập Concept Được Yêu Thích
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 max-w-xl">
              Tổng hợp những phong cách chụp kỉ yếu học đường và áo dài nghệ thuật ấn tượng nhất tại Hà Nội — giúp bạn và lớp dễ dàng chọn concept ưng ý.
            </p>
          </div>
        </div>

        {/* Series Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          {PHOTO_SERIES.map((series, index) => (
            <div
              key={series.id}
              className="group rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] hover:border-amber-400 dark:hover:border-amber-500/50 transition-all duration-300 flex flex-col"
            >
              {/* Cover media */}
              <div
                className="aspect-[16/9] w-full overflow-hidden relative cursor-pointer"
                onClick={() => onSelectSeries(series.id)}
              >
                <img
                  src={series.coverImage}
                  alt={series.vietnameseTitle}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Unboxed clean metadata overlay */}
                <div className="absolute top-4 left-4 text-xs font-mono text-white/90 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded">
                  CONCEPT 0{index + 1} · {series.year}
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs font-mono text-neutral-300 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{series.location}</span>
                    <span aria-hidden="true">·</span>
                    <span>{series.photoCount} ảnh tiêu biểu</span>
                  </div>
                </div>
              </div>

              {/* Series Details */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-serif text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {series.vietnameseTitle}
                  </h3>
                  <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-1 italic">
                    {series.title}
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-3 leading-relaxed">
                    {series.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-500 dark:text-neutral-400 italic">
                    {series.curatorNote}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onSelectSeries(series.id)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <span>Xem các tác phẩm trong bộ</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                  <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-medium">
                    Concept Hot
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
