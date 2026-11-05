/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Camera,
  X,
  Pencil,
  Trash2,
  MessageCircle,
  Copy,
  Check,
} from 'lucide-react';
import { PhotoItem, PhotoCategory } from '../utils/portfolioLogic';
import { SITE_CONFIG } from '../config/site';

interface GalleryProps {
  photos: PhotoItem[];
  selectedCategory: string;
  onSelectCategory: (cat: PhotoCategory) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  favoriteIds: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onSelectPhoto: (photo: PhotoItem) => void;
  showingFavoritesOnly: boolean;
  onClearFavoritesFilter: () => void;
  isAdmin?: boolean;
  onEditPhoto?: (photo: PhotoItem) => void;
  onDeletePhoto?: (photoId: string) => void;
}

export const Gallery: React.FC<GalleryProps> = ({
  photos,
  selectedCategory,
  onSelectCategory,
  favoriteIds,
  onToggleFavorite,
  onSelectPhoto,
  showingFavoritesOnly,
  onClearFavoritesFilter,
  isAdmin = false,
  onEditPhoto,
  onDeletePhoto,
}) => {
  const [copiedFavorites, setCopiedFavorites] = useState(false);

  // (v6) Chi render 8 anh dau, nut "Xem them" tai them 8 anh/lan — khong
  // render het 1 luc. Doi loc/tim kiem thi reset ve 8 anh dau.
  const [visibleCount, setVisibleCount] = useState(8);
  useEffect(() => {
    setVisibleCount(8);
  }, [selectedCategory, showingFavoritesOnly]);
  const visiblePhotos = photos.slice(0, visibleCount);

  // 'aodai-pho' (2 anh) + 'nang-tho' (2 anh) gop thanh 1 tab 'aodai-pho-nang-tho'
  // (moi tab cu deu < 3 anh); key gop duoc filterPhotos() map sang 2 key cu
  // nen loc van dung — xem ghi chu o filterPhotos trong portfolioLogic.ts.
  // v7 — toi da 4 chip loc: chip 'Ao Dai' gop 3 category ao dai
  // (filterPhotos map key 'aodai' sang 3 key that).
  const categories: { key: PhotoCategory; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'aodai' as PhotoCategory, label: 'Áo dài' },
    { key: 'kiyieu-nhom', label: 'Kỉ yếu nhóm' },
    { key: 'cophuc', label: 'Cổ phục' },
  ];

  // Anh yeu thich hien co trong danh sach anh dang hien thi (theo favoriteIds).
  const favoritePhotos = photos.filter((photo) => favoriteIds.includes(photo.id));

  const buildFavoritesMessage = (): string => {
    const lines = favoritePhotos.map((photo) => `- ${photo.vietnameseTitle} (ID: ${photo.id})`);
    return [
      `Chào ${SITE_CONFIG.photographerName}, em gửi danh sách ảnh yêu thích từ Yên Photo:`,
      ...lines,
      '',
      'Nhờ Anh tư vấn giúp em nhé!',
    ].join('\n');
  };

  const handleShareFavoritesViaZalo = () => {
    if (favoritePhotos.length === 0) return;
    const url = `${SITE_CONFIG.zaloUrl}?text=${encodeURIComponent(buildFavoritesMessage())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyFavoritesToClipboard = async () => {
    if (favoritePhotos.length === 0) return;
    const text = buildFavoritesMessage();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFavorites(true);
    } catch {
      // Fallback cho trinh duyet khong ho tro Clipboard API.
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopiedFavorites(true);
      } catch {
        // Khong copy duoc: giu nguyen trang thai, khong bao loi gia.
      } finally {
        document.body.removeChild(textarea);
      }
    }
    window.setTimeout(() => setCopiedFavorites(false), 2000);
  };

  return (
    <section id="gallery" className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">
            Hình ảnh thực tế · Sony A7 III
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-medium text-neutral-900 dark:text-white">
            Album kỉ yếu & áo dài
          </h2>
          <p className="text-base text-neutral-500 dark:text-neutral-400 mt-3 max-w-xl leading-relaxed">
            Ảnh chụp bằng máy Full-frame Sony A7 III — màu trong trẻo, tự nhiên.
          </p>
        </div>
      </div>

      {/* Chi loc bang chip — bo o tim kiem o thanh cong cu (v7) */}
      <div className="py-6 flex flex-wrap items-center gap-3">
        {/* Interactive Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                onSelectCategory(cat.key);
                if (showingFavoritesOnly) onClearFavoritesFilter();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat.key && !showingFavoritesOnly
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* Chia se danh sach yeu thich — chi hien khi co anh yeu thich trong
          danh sach dang hien thi (dung so luong that se gui, khong dung tong
          favoriteIds vi co the bi loc boi category/series). */}
      {favoritePhotos.length > 0 && (
        <div className="pb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Danh sách yêu thích ({favoritePhotos.length} ảnh):
          </span>
          <button
            type="button"
            onClick={handleShareFavoritesViaZalo}
            className="px-2.5 py-1.5 text-xs font-medium text-white bg-[#0068ff] rounded-md flex items-center gap-1.5 hover:opacity-85 transition-opacity cursor-pointer"
            title="Gửi danh sách ảnh yêu thích qua Zalo cho Anh Yên"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Gửi qua Zalo</span>
          </button>
          <button
            type="button"
            onClick={copyFavoritesToClipboard}
            className="px-2.5 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md flex items-center gap-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            title="Sao chép danh sách ảnh yêu thích vào clipboard"
          >
            {copiedFavorites ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedFavorites ? 'Đã copy danh sách' : 'Copy danh sách'}</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="py-20 text-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl my-8">
          <Camera className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
          <h3 className="text-lg font-serif font-medium text-neutral-900 dark:text-white">
            Không tìm thấy tác phẩm phù hợp
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            Hãy thử chọn một danh mục khác.
          </p>
          <button
            type="button"
            onClick={() => {
              onSelectCategory('all');
              if (showingFavoritesOnly) onClearFavoritesFilter();
            }}
            className="mt-4 px-4 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Hiển thị lại toàn bộ album
          </button>
        </div>
      )}

      {/* Gallery Layout: Bento Mode */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visiblePhotos.map((photo, idx) => {
            const isWide = (idx % 5 === 0 || idx % 7 === 0) && photo.orientation === 'landscape';

            return (
              <div
                key={photo.id}
                className={`group relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 transition-all duration-300 hover:border-neutral-300 dark:hover:border-neutral-700 ${
                  isWide ? 'md:col-span-2' : 'col-span-1'
                }`}
              >
                {/* Media Container */}
                <div
                  className={`w-full overflow-hidden relative cursor-pointer ${
                    isWide ? 'aspect-[16/9]' : photo.orientation === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]'
                  }`}
                  onClick={() => onSelectPhoto(photo)}
                >
                  <img
                    src={photo.thumbUrl || photo.image}
                    alt={photo.vietnameseTitle}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-104"
                    referrerPolicy="no-referrer"
                  />

                  {/* Scrim Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Top Right Actions */}
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-20">
                    {isAdmin && onEditPhoto && onDeletePhoto && (
                      <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full p-0.5 border border-amber-500/40">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPhoto(photo);
                          }}
                          className="p-1.5 rounded-full hover:bg-amber-600 text-amber-200 hover:text-white transition-colors cursor-pointer"
                          title="Sửa thông tin ảnh (Admin)"
                          aria-label="Sửa ảnh"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePhoto(photo.id);
                          }}
                          className="p-1.5 rounded-full hover:bg-red-600 text-red-300 hover:text-white transition-colors cursor-pointer"
                          title="Xoá ảnh (Admin)"
                          aria-label="Xoá ảnh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => onToggleFavorite(photo.id, e)}
                      className="p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-colors cursor-pointer"
                      title={favoriteIds.includes(photo.id) ? 'Bỏ thích' : 'Lưu vào danh sách thích'}
                      aria-label="Thích ảnh"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          favoriteIds.includes(photo.id) ? 'fill-rose-500 text-rose-500' : 'text-white'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Chi hien tieu de khi hover — khong de nhieu chu de len anh (v7) */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
                    <h3 className="text-lg font-serif font-medium leading-snug line-clamp-1">
                      {photo.vietnameseTitle}
                    </h3>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* (v6) Xem them 8 anh/lan */}
      {photos.length > visibleCount && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 8)}
            className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            Xem thêm {Math.min(8, photos.length - visibleCount)} ảnh ({visibleCount}/{photos.length})
          </button>
        </div>
      )}

    </section>
  );
};
