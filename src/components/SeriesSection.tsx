/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, CalendarCheck, X } from 'lucide-react';
import { PHOTO_SERIES, INITIAL_PHOTOS, PhotoSeries } from '../data/portfolioData';
import { SERIES_PACKAGE, getPackageDetails, BookingInquiry, PhotoItem, DEFAULT_PACKAGE_PRICES, describePhotoAlt, type PackagePrices } from '../utils/portfolioLogic';
import { DEFAULT_SITE_CONTENT, type SiteContent } from '../config/content';

interface SeriesSectionProps {
  onSelectSeries: (seriesId: string) => void;
  onOpenBooking?: (pkg: BookingInquiry['packageType']) => void;
  selectedSeriesId?: string | null;
  onClearSeries?: () => void;
  /** Anh dang hien thi (tu Cloud + anh mau); khong truyen thi dung INITIAL_PHOTOS. */
  photos?: PhotoItem[];
  /** Bang gia hien hanh (tu App / Firestore); khong truyen thi dung gia mac dinh. */
  packagePrices?: PackagePrices;
  /** Noi dung giao dien (tu App / Firestore); khong truyen thi dung mac dinh. */
  content?: SiteContent;
}

export const SeriesSection: React.FC<SeriesSectionProps> = ({
  onSelectSeries,
  onOpenBooking,
  selectedSeriesId,
  onClearSeries,
  photos,
  packagePrices,
  content,
}) => {
  const effectivePrices = packagePrices ?? DEFAULT_PACKAGE_PRICES;
  const c = content ?? DEFAULT_SITE_CONTENT;
  return (
    <section id="series" className="py-16 md:py-24 border-t border-neutral-200 dark:border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">
              Gợi ý concept & địa điểm chụp
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-neutral-900 dark:text-white">
              Bộ sưu tập concept được yêu thích
            </h2>
            <p className="text-base text-neutral-500 dark:text-neutral-400 mt-3 max-w-xl leading-relaxed">
              Những phong cách kỉ yếu và áo dài ấn tượng nhất tại Hà Nội — giúp bạn và lớp dễ chọn concept ưng ý.
            </p>
          </div>
          {selectedSeriesId && onClearSeries && (
            <button
              type="button"
              onClick={onClearSeries}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xem tất cả</span>
            </button>
          )}
        </div>

        {/* Series Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          {PHOTO_SERIES.map((series, index) => {
            // Dem that so anh thuoc series tu anh dang hien thi (Cloud + mau);
            // = 0 thi dung so trong data lam fallback.
            const sourcePhotos = photos ?? INITIAL_PHOTOS;
            const realCount = sourcePhotos.filter((photo) => photo.seriesId === series.id).length;
            const displayCount = realCount > 0 ? realCount : series.photoCount;
            const packageType = SERIES_PACKAGE[series.id];
            const packageDetails = packageType ? getPackageDetails(packageType, effectivePrices) : null;
            const isSelected = selectedSeriesId === series.id;
            const isFeatured = index === 0;
            return (
            <div
              key={series.id}
              className={`group rounded-2xl overflow-hidden border bg-white dark:bg-[#0c0c0e] transition-colors duration-300 flex flex-col ${
                isSelected
                  ? 'border-amber-600 dark:border-amber-500 ring-1 ring-amber-600/50'
                  : isFeatured
                    ? 'border-amber-600/60 dark:border-amber-500/50'
                    : 'border-neutral-200 dark:border-neutral-800'
              }`}
            >
              {/* Cover media */}
              <div
                className="aspect-[16/9] w-full overflow-hidden relative cursor-pointer"
                onClick={() => onSelectSeries(series.id)}
              >
                <img
                  src={series.coverImage}
                  alt={describePhotoAlt(series)}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Unboxed clean metadata overlay */}
                {isFeatured && (
                  <div className="absolute top-4 left-4 text-xs font-semibold text-white bg-amber-600 px-2.5 py-1 rounded-md">
                    Được chọn nhiều nhất
                  </div>
                )}

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs font-sans tabular-nums text-neutral-300 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{series.location}</span>
                    <span aria-hidden="true">·</span>
                    <span>{displayCount} ảnh tiêu biểu</span>
                  </div>
                </div>
              </div>

              {/* Series Details */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-serif text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {series.vietnameseTitle}
                  </h3>
                  <div className="text-xs font-sans tabular-nums text-neutral-500 dark:text-neutral-400 mt-1 italic">
                    {series.title}
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-3 leading-relaxed">
                    {series.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-500 dark:text-neutral-400 italic">
                    {series.curatorNote}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  {packageDetails && packageType && (
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">Giá gói tương ứng</div>
                        <div className="font-serif text-2xl font-medium text-neutral-900 dark:text-white mt-0.5 tabular-nums">
                          {packageDetails.formattedPrice}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                          {c.packageDescriptions[packageType]}
                        </div>
                      </div>
                      {onOpenBooking && (
                        <button
                          type="button"
                          onClick={() => onOpenBooking(packageType)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                            isFeatured
                              ? 'text-white bg-amber-600 hover:bg-amber-700'
                              : 'text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <CalendarCheck className="w-4 h-4" />
                          <span>Đặt lịch</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
