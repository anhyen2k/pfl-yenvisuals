/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Camera, Award, BookOpen, Aperture, CheckCircle2, Shield, Sparkles, MapPin, Compass, HeartHandshake } from 'lucide-react';
import { GEAR_BAG, ICONIC_LOCATIONS } from '../data/portfolioData';

export const AboutSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bio' | 'locations'>('bio');

  return (
    <section id="about" className="py-16 md:py-24 border-t border-neutral-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-neutral-200 dark:border-neutral-800 gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-medium">
              VỀ NHIẾP ẢNH GIA & CẨM NANG CHỤP
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif text-neutral-900 dark:text-white mt-1">
              Yên Nguyễn — Lưu Giữ Thanh Xuân & Nét Duyên Áo Dài
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
              <div className="space-y-4 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                <p>
                  Xin chào, mình là <strong>Anh Yên</strong>. Mình là một nhiếp ảnh gia tự do tại Hà Nội, 
                  dành trọn niềm đam mê và sự tâm huyết cho những tà áo dài trắng học sinh cùng từng khoảnh khắc kỉ yếu thanh xuân.
                </p>
                <p>
                  Đồng hành cùng máy ảnh Full-frame <strong>Sony A7 Mark III</strong> trứ danh với khả năng lấy nét ánh mắt tức thì (Real-time Eye AF) 
                  và chất màu trong trẻo, chân thật — mình luôn chú trọng vào cảm xúc tự nhiên của bạn thay vì những dáng đứng cứng nhắc.
                </p>
                <p>
                  Với mình, mỗi buổi chụp kỉ yếu hay áo dài không phải là một 'ca làm việc công nghiệp' gượng ép, 
                  mà là một trải nghiệm đồng hành thoải mái, kiên nhẫn và chu đáo nhất để bạn luôn cảm thấy tự tin và có được bộ ảnh ưng ý.
                </p>
              </div>

              {/* Milestones / Service Commitments */}
              <div className="pt-2 space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-neutral-900 dark:text-white font-semibold">
                  Cam Kết Chất Lượng & Dịch Vụ:
                </div>
                <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">A7 III</span>
                    <span>· Máy ảnh Full-frame Sony A7 Mark III sắc nét, dải màu trong trẻo chuẩn thanh xuân</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">100%</span>
                    <span>· Hướng dẫn tạo dáng kiên nhẫn, nhiệt tình từng góc chụp, chụp không giới hạn file</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">24H</span>
                    <span>· Trả toàn bộ ảnh gốc nhanh chóng qua Google Drive, hỗ trợ chọn ảnh cùng bạn</span>
                  </li>
                </ul>
              </div>

              {/* Natural Posing Promise */}
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900 dark:text-white">
                  <HeartHandshake className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Dành Riêng Cho Các Bạn Chưa Từng Chụp Ảnh</span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-normal">
                  Bạn chưa từng đứng trước ống kính máy ảnh? Bạn sợ tạo dáng gượng gạo? 
                  Đừng lo, mình sẽ kiên nhẫn chỉ bạn từng góc nghiêng, cách đặt tay lên tà áo dài, 
                  hướng nhìn và nụ cười tự nhiên nhất. Chúng ta sẽ chụp đến khi bạn thật sự ưng ý mới thôi!
                </p>
              </div>
            </div>

            {/* Right Column: In My Camera Bag (Thiết Bị Kỉ Yếu & Áo Dài) */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                  TRANG THIẾT BỊ CHÂN DUNG & KỈ YẾU
                </div>
                <div className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">
                  Sony Alpha 7 Mark III
                </div>
              </div>

              <div className="space-y-3">
                {GEAR_BAG.map((gear, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] hover:border-amber-400 dark:hover:border-amber-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {gear.name}
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        {gear.category}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-amber-600 dark:text-amber-400 mt-1">
                      {gear.spec}
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 font-light">
                      {gear.role}
                    </div>
                  </div>
                ))}
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
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Kinh nghiệm tích lũy qua nhiều mùa chụp giúp bạn chọn khung giờ vàng đón ánh sáng tự nhiên đẹp nhất.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ICONIC_LOCATIONS.map((loc, i) => (
                <div
                  key={i}
                  className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] space-y-3 hover:border-amber-400 dark:hover:border-amber-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-serif font-semibold text-neutral-900 dark:text-white">
                        {loc.name}
                      </h4>
                      <div className="text-xs font-mono text-neutral-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-500" />
                        <span>{loc.address}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 shrink-0">
                      Top 0{i + 1}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="text-neutral-700 dark:text-neutral-300">
                      <strong className="font-mono text-neutral-500">Khung giờ vàng:</strong> {loc.bestTime}
                    </div>
                    <div className="text-neutral-700 dark:text-neutral-300">
                      <strong className="font-mono text-neutral-500">Concept phù hợp:</strong> {loc.idealConcept}
                    </div>
                    <div className="p-2.5 rounded bg-neutral-50 dark:bg-neutral-900 text-[11px] text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800/80">
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
