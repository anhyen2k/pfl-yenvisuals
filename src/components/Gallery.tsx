/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Heart,
  Maximize2,
  Camera,
  MapPin,
  X,
  GraduationCap,
  Sparkles,
  Pencil,
  Trash2,
  MessageCircle,
  Copy,
  Check,
} from 'lucide-react';
import { PhotoItem, PhotoCategory, formatExifString, CATEGORY_LABELS } from '../utils/portfolioLogic';
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
  searchQuery,
  onSearchChange,
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

  // Nhan tab danh muc lay tu bang dung chung, chi 'all' la ngoai le (khong co trong CATEGORY_LABELS).
  // 'aodai-pho' (2 anh) + 'nang-tho' (2 anh) gop thanh 1 tab 'aodai-pho-nang-tho'
  // (moi tab cu deu < 3 anh); key gop duoc filterPhotos() map sang 2 key cu
  // nen loc van dung — xem ghi chu o filterPhotos trong portfolioLogic.ts.
  const categories: { key: PhotoCategory; label: string }[] = [
    { key: 'all', label: 'Tất Cả Album' },
    { key: 'aodai-trang', label: CATEGORY_LABELS['aodai-trang'] },
    { key: 'kiyieu-nhom', label: CATEGORY_LABELS['kiyieu-nhom'] },
    { key: 'cophuc', label: CATEGORY_LABELS['cophuc'] },
    { key: 'aodai-pho-nang-tho' as PhotoCategory, label: 'Áo Dài & Nàng Thơ' },
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
    <section id="gallery" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-medium mb-2">
            HÌNH ẢNH THỰC TẾ · SONY A7 MARK III
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-neutral-900 dark:text-white">
            Album Kỉ Yếu & Áo Dài Thực Hiện Bởi Anh Yên
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 max-w-xl">
            Toàn bộ ảnh được chụp bằng máy ảnh Full-frame Sony A7 Mark III với màu sắc trong trẻo, tự nhiên, bắt trọn từng nụ cười rạng rỡ và nét duyên dáng tà áo dài.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

        {/* Search & Favorites active state indicator */}
        <div className="flex items-center gap-3">
          {showingFavoritesOnly && (
            <button
              type="button"
              onClick={onClearFavoritesFilter}
              className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-md flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500" />
              <span>Đang lọc ảnh yêu thích ({photos.length})</span>
              <X className="w-3 h-3 ml-0.5" />
            </button>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kỉ yếu, áo dài, trường, địa điểm..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 whitespace-nowrap tabular-nums">
            {photos.length} tác phẩm
          </div>
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
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            Hãy thử tìm bằng các từ khóa như "áo dài", "kỉ yếu", "cổ phục", "Hoàng Thành", "Chu Văn An"...
          </p>
          <button
            type="button"
            onClick={() => {
              onSelectCategory('all');
              onSearchChange('');
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
          {photos.map((photo, idx) => {
            const isWide = (idx % 5 === 0 || idx % 7 === 0) && photo.orientation === 'landscape';

            return (
              <div
                key={photo.id}
                className={`group relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 transition-all duration-300 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-lg ${
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
                    src={photo.image}
                    alt={photo.vietnameseTitle}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-104"
                    referrerPolicy="no-referrer"
                  />

                  {/* Scrim Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                  {/* Top Right Actions */}
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-20">
                    {isAdmin && onEditPhoto && onDeletePhoto && (
                      <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full p-0.5 border border-amber-500/40 shadow-lg">
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

                  {/* Top Left: Concept Tag Hint */}
                  {photo.conceptNote && (
                    <div className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded bg-black/50 text-amber-300 backdrop-blur-sm text-[11px] font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{photo.conceptNote}</span>
                    </div>
                  )}

                  {/* Bottom Content Metadata */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    {/* Quiet inline metadata with typographic separators */}
                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-300 mb-1">
                      <span>{photo.location.split(',')[0]}</span>
                      <span aria-hidden="true">·</span>
                      <span>{photo.year}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatExifString(photo)}</span>
                    </div>

                    {/* Primary Title */}
                    <h3 className="text-lg sm:text-xl font-serif font-medium leading-snug line-clamp-1">
                      {photo.vietnameseTitle}
                    </h3>

                    {/* Quiet description */}
                    <p className="text-xs text-neutral-300/90 mt-1 line-clamp-1">
                      {photo.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </section>
  );
};
