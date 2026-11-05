/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Camera, MapPin, Compass, HeartHandshake } from 'lucide-react';
import { ICONIC_LOCATIONS } from '../data/portfolioData';
import { DEFAULT_SITE_CONTENT, type SiteContent } from '../config/content';

interface AboutSectionProps {
  /** Noi dung giao dien (tu App / Firestore); khong truyen thi dung mac dinh. */
  content?: SiteContent;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ content }) => {
  const c = content ?? DEFAULT_SITE_CONTENT;
  const [activeTab, setActiveTab] = useState<'bio' | 'locations'>('bio');

  return (
    <section id="about" className="py-16 md:py-24 border-t border-neutral-200 dark:border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-neutral-200 dark:border-neutral-800 gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Về nhiếp ảnh gia & cẩm nang chụp
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-neutral-900 dark:text-white mt-2">
              {c.aboutName} — {c.aboutRole}
            </h2>
          </div>

          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('bio')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'bio'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Tiểu Sử & Triết Lý
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('locations')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'locations'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Gợi Ý Địa Điểm Chụp</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Bio, Philosophy & Camera Bag */}
        {activeTab === 'bio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mt-10">
            {/* Left Column: Biography & Visual Philosophy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-4 text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                <p>{c.aboutBioShort}</p>
                {c.aboutBioLong.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {/* Dong tin cay gon — chuyen tu 4 o so lieu duoi Hero (v7) */}
              <p className="pt-2 text-sm text-neutral-900 dark:text-white font-medium">
                Sony A7 III · Trả file gốc trong 24h · Nhóm nhỏ 5–15 bạn · Chỉ chụp ở Hà Nội
              </p>
              <ul className="space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">✓</span>
                  <span>Hướng dẫn tạo dáng kiên nhẫn từng góc chụp, chụp không giới hạn file</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">✓</span>
                  <span>Trả toàn bộ ảnh gốc qua Google Drive, hỗ trợ chọn ảnh cùng bạn</span>
                </li>
              </ul>

              {/* Natural Posing Promise */}
              <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
                  <HeartHandshake className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Dành riêng cho các bạn chưa từng chụp ảnh</span>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Bạn chưa từng đứng trước ống kính máy ảnh? Bạn sợ tạo dáng gượng gạo? 
                  Đừng lo, mình sẽ kiên nhẫn chỉ bạn từng góc nghiêng, cách đặt tay lên tà áo dài, 
                  hướng nhìn và nụ cười tự nhiên nhất. Chúng ta sẽ chụp đến khi bạn thật sự ưng ý mới thôi!
                </p>
              </div>
            </div>

            {/* Right Column: thiet bi gop thanh 1 dong gon (v7), khong liet ke the dai */}
            <div className="lg:col-span-6 space-y-5">
              <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e]">
                <div className="text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                  Trang thiết bị
                </div>
                <p className="mt-3 font-serif text-xl font-medium text-neutral-900 dark:text-white leading-snug">
                  Sony A7 Mark III · FE 50mm f/1.8 · FE 85mm f/1.8
                </p>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Body Full-frame 24.2MP, bắt nét mắt theo thời gian thực — giữ trọn chi tiết tà áo trắng dưới nắng.
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e]">
                <div className="text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                  Phong cách
                </div>
                <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Trong trẻo, tự nhiên, tôn nét duyên Việt — chụp ngoại cảnh và sân trường Hà Nội, khung giờ vàng đón ánh sáng tự nhiên đẹp nhất.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Iconic Locations & Posing Tips */}
        {activeTab === 'locations' && (
          <div className="mt-10 space-y-8">
            <div className="max-w-2xl">
              <h3 className="text-xl font-serif text-neutral-900 dark:text-white">
                Gợi Ý Các Điểm Chụp Kỉ Yếu & Áo Dài Đẹp Nhất Hà Nội
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Kinh nghiệm tích lũy qua nhiều mùa chụp giúp bạn chọn khung giờ vàng đón ánh sáng tự nhiên đẹp nhất.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ICONIC_LOCATIONS.map((loc, i) => (
                <div
                  key={i}
                  className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] space-y-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-serif font-semibold text-neutral-900 dark:text-white">
                        {loc.name}
                      </h4>
                      <div className="text-xs font-sans tabular-nums text-neutral-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-500" />
                        <span>{loc.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="text-neutral-700 dark:text-neutral-300">
                      <strong className="font-sans tabular-nums text-neutral-500">Khung giờ vàng:</strong> {loc.bestTime}
                    </div>
                    <div className="text-neutral-700 dark:text-neutral-300">
                      <strong className="font-sans tabular-nums text-neutral-500">Concept phù hợp:</strong> {loc.idealConcept}
                    </div>
                    <div className="p-2.5 rounded bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800/80">
                      💡 <em>{loc.tips}</em>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
