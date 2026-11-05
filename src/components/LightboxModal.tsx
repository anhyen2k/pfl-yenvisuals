/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  ZoomIn,
  ZoomOut,
  Info,
  Share2,
  Camera,
  Check,
  Pencil,
  Trash2,
} from 'lucide-react';
import { PhotoItem, formatExifString } from '../utils/portfolioLogic';
import { withBase } from '../utils/cleanPaths';

interface LightboxModalProps {
  photo: PhotoItem | null;
  allPhotos: PhotoItem[];
  onClose: () => void;
  onNavigate: (photo: PhotoItem) => void;
  favoriteIds: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onOpenBooking: () => void;
  isAdmin?: boolean;
  onEditPhoto?: (photo: PhotoItem) => void;
  onDeletePhoto?: (photoId: string) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  photo,
  allPhotos,
  onClose,
  onNavigate,
  favoriteIds,
  onToggleFavorite,
  onOpenBooking,
  isAdmin = false,
  onEditPhoto,
  onDeletePhoto,
}) => {
  const [zoomLevel, setZoomLevel] = useState<1 | 1.5 | 2>(1);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [copied, setCopied] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    if (!photo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'i' || e.key === 'I') {
        setShowInfoPanel((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photo, allPhotos]);

  // Reset zoom on photo change
  useEffect(() => {
    setZoomLevel(1);
  }, [photo?.id]);

  if (!photo) return null;

  // Anh mo tu Hero co the khong nam trong danh sach dang loc (displayedPhotos)
  // -> findIndex = -1. Dung vi tri 0 de hien thi / dieu huong thay vi "0 / N".
  const foundIndex = allPhotos.findIndex((p) => p.id === photo.id);
  const currentIndex = foundIndex === -1 ? 0 : foundIndex;
  const hasPrev = foundIndex > 0;
  const hasNext = allPhotos.length > 0 && currentIndex < allPhotos.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      onNavigate(allPhotos[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    // Anh dang xem khong nam trong danh sach loc: "tiep" di ve anh dau tien
    // cua danh sach, khong phai anh thu 2.
    if (foundIndex === -1) {
      if (allPhotos.length > 0) onNavigate(allPhotos[0]);
      return;
    }
    if (hasNext) {
      onNavigate(allPhotos[currentIndex + 1]);
    }
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}${withBase('/')}#photo-${photo.id}`;
    let ok = false;
    try {
      await navigator.clipboard?.writeText(link);
      ok = true;
    } catch {
      // Fallback cho trinh duyet khong co Clipboard API.
      try {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        ok = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        ok = false;
      }
    }
    // Chi bao "da copy" khi copy that su thanh cong.
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFavorited = favoriteIds.includes(photo.id);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết tác phẩm: ${photo.vietnameseTitle}`}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col select-none animate-in fade-in duration-200"
    >
      {/* Top Bar with actions */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-neutral-800 text-neutral-300">
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-neutral-400">
            <span className="text-white font-semibold">{currentIndex + 1}</span> / {allPhotos.length}
          </div>
          <span className="text-neutral-700 hidden sm:inline">|</span>
          <div className="text-xs font-medium text-white truncate max-w-xs hidden sm:block">
            {photo.vietnameseTitle}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Zoom toggle */}
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1))}
            className="p-2 rounded-md hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Thu phóng ảnh (1x / 1.5x / 2x)"
            aria-label="Thu phóng"
          >
            {zoomLevel > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>

          {/* Toggle Info Inspector */}
          <button
            type="button"
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className={`p-2 rounded-md transition-colors cursor-pointer ${
              showInfoPanel ? 'bg-neutral-800 text-white' : 'text-neutral-300 hover:bg-neutral-800'
            }`}
            title="Ẩn / Hiện bảng thông số EXIF (Phím I)"
            aria-label="Thông số kỹ thuật"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Favorite button */}
          <button
            type="button"
            onClick={(e) => onToggleFavorite(photo.id, e)}
            className="p-2 rounded-md hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Thích tác phẩm này"
            aria-label="Yêu thích"
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* Share link button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-2 rounded-md hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Sao chép liên kết tác phẩm"
            aria-label="Chia sẻ"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Admin Controls */}
          {isAdmin && onEditPhoto && onDeletePhoto && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-700">
              <button
                type="button"
                onClick={() => onEditPhoto(photo)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-medium transition-colors cursor-pointer"
                title="Sửa thông tin bức ảnh này"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sửa</span>
              </button>
              <button
                type="button"
                onClick={() => onDeletePhoto(photo.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium transition-colors cursor-pointer"
                title="Xoá bức ảnh này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xoá</span>
              </button>
            </div>
          )}

          {/* Close Lightbox */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white transition-colors cursor-pointer ml-1 sm:ml-2"
            title="Đóng (ESC)"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Navigation Arrows */}
        {hasPrev && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-neutral-700 backdrop-blur-md transition-all cursor-pointer"
            aria-label="Tác phẩm trước đó"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {hasNext && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-neutral-700 backdrop-blur-md transition-all cursor-pointer"
            aria-label="Tác phẩm kế tiếp"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Center Canvas / Image Container */}
        <div
          className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-auto"
          onClick={() => {
            if (zoomLevel > 1) setZoomLevel(1);
          }}
        >
          <div
            className="max-w-full max-h-full flex items-center justify-center transition-transform duration-300 ease-out"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              src={photo.image}
              alt={photo.vietnameseTitle}
              className="max-h-[80vh] max-w-[85vw] object-contain shadow-2xl rounded-sm"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Collapsible Curatorial & EXIF Drawer */}
        {showInfoPanel && (
          <aside className="w-80 md:w-96 border-l border-neutral-800 bg-neutral-950/95 backdrop-blur-md p-6 overflow-y-auto space-y-6 text-neutral-300 shrink-0">
            <div>
              <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1">
                {photo.location} · {photo.year}
              </div>
              <h2 className="text-2xl font-serif text-white font-medium">
                {photo.vietnameseTitle}
              </h2>
              <div className="text-xs font-mono text-neutral-400 mt-1 italic">
                {photo.title}
              </div>
            </div>

            {/* Backstory */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <div className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                Câu Chuyện Tác Phẩm
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed font-light">
                {photo.story || photo.description}
              </p>
            </div>

            {/* Technical EXIF Specifications */}
            <div className="space-y-3 pt-2 border-t border-neutral-800">
              <div className="text-xs font-mono uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-neutral-400" />
                <span>Thông Số Kỹ Thuật (EXIF)</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                  <div className="text-neutral-500 text-[10px]">THÂN MÁY</div>
                  <div className="text-white mt-0.5 truncate">{photo.camera}</div>
                </div>

                <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                  <div className="text-neutral-500 text-[10px]">ỐNG KÍNH</div>
                  <div className="text-white mt-0.5 truncate">{photo.lens}</div>
                </div>

                <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                  <div className="text-neutral-500 text-[10px]">TIÊU CỰ & KHẨU ĐỘ</div>
                  <div className="text-white mt-0.5">
                    {photo.focalLength} · {photo.aperture}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                  <div className="text-neutral-500 text-[10px]">TỐC ĐỘ & ISO</div>
                  <div className="text-white mt-0.5">
                    {photo.shutterSpeed} · ISO {photo.iso}
                  </div>
                </div>
              </div>
            </div>

            {/* Tags (Clean unboxed inline text) */}
            <div className="pt-2 border-t border-neutral-800 text-xs text-neutral-400">
              <span className="font-mono text-[10px] uppercase text-neutral-500 block mb-1">Thẻ Tác Phẩm:</span>
              <div className="flex flex-wrap gap-2 text-neutral-300">
                {photo.tags.map((tag, i) => (
                  <span key={tag}>
                    #{tag}
                    {i < photo.tags.length - 1 ? ' ·' : ''}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom status line */}
      <div className="h-10 px-6 border-t border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-500">
        <div className="flex items-center gap-2">
          <span>Dùng phím ← → để chuyển ảnh</span>
          <span aria-hidden="true">·</span>
          <span>Phím I bật/tắt thông số</span>
          <span aria-hidden="true">·</span>
          <span>Phím ESC để đóng</span>
        </div>
        <div className="hidden sm:block">
          YÊN PHOTO · COPYRIGHT © 2026
        </div>
      </div>
    </div>
  );
};
