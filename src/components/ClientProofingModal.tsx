/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Star,
  CheckCircle2,
  Copy,
  Lock,
  Download,
  Check,
  MessageSquare,
  Eye,
} from 'lucide-react';
import { PhotoItem } from '../utils/portfolioLogic';

interface ClientProofingModalProps {
  isOpen: boolean;
  onClose: () => void;
  samplePhotos: PhotoItem[];
}

interface ProofItem {
  id: string;
  photo: PhotoItem;
  selected: boolean;
  rating: number;
  note: string;
}

export const ClientProofingModal: React.FC<ClientProofingModalProps> = ({
  isOpen,
  onClose,
  samplePhotos,
}) => {
  const [pinCode, setPinCode] = useState('');
  const [unlocked, setUnlocked] = useState(true); // Open by default for instant client preview!
  const [copied, setCopied] = useState(false);

  // Initialize proof items from sample photos
  const [proofs, setProofs] = useState<ProofItem[]>(() =>
    samplePhotos.slice(0, 6).map((photo, i) => ({
      id: `proof-${photo.id}`,
      photo,
      selected: i < 3, // Pre-select first 3 as demo
      rating: i === 0 ? 5 : i === 1 ? 5 : 4,
      note: i === 0 ? 'Ảnh bìa photobook kỉ yếu cả lớp, chỉnh da trong trẻo tự nhiên' : i === 1 ? 'Ảnh ném mũ cử nhân phóng to treo lớp' : '',
    }))
  );

  const [activePhotoForNote, setActivePhotoForNote] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setProofs((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const setRating = (id: string, stars: number) => {
    setProofs((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rating: stars } : item
      )
    );
  };

  const updateNote = (id: string, note: string) => {
    setProofs((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, note } : item
      )
    );
  };

  const selectedCount = proofs.filter((p) => p.selected).length;

  const handleExportList = () => {
    const selected = proofs.filter((p) => p.selected);
    const summary = [
      `=== DANH SÁCH ẢNH KỈ YẾU & ÁO DÀI ĐÃ DUYỆT ===`,
      `Lớp / Khách hàng: Lớp 12A1 Chuyên Chu Văn An - Niên Khóa 2023-2026`,
      `Số lượng ảnh chọn: ${selected.length}/${proofs.length}`,
      `Thời gian: ${new Date().toLocaleDateString('vi-VN')}`,
      `---------------------------------------`,
      ...selected.map(
        (s, i) =>
          `${i + 1}. [${s.photo.vietnameseTitle}] (${s.photo.camera}) - Đánh giá: ${s.rating}★${
            s.note ? ` - Ghi chú retouch: "${s.note}"` : ''
          }`
      ),
    ].join('\n');

    navigator.clipboard?.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cổng duyệt ảnh khách hàng"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in"
    >
      <div className="bg-white dark:bg-[#0c0c0e] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-medium">
                DUYỆT ẢNH KỈ YẾU & RETOUCH LỚP HỌC
              </div>
              <h3 className="text-lg font-serif font-medium text-neutral-900 dark:text-white">
                Dự Án: Kỉ Yếu & Áo Dài Lớp 12A1 Chuyên Chu Văn An (2023 - 2026)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 font-mono">
            <span>Đại diện lớp: <strong>Bí thư Mai Linh & Lớp 12A1</strong></span>
            <span aria-hidden="true">·</span>
            <span>Đã chọn: <strong className="text-amber-600 dark:text-amber-400 font-semibold">{selectedCount}</strong>/{proofs.length} ảnh</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportList}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-medium transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép danh sách!' : 'Sao chép danh sách chọn'}</span>
            </button>
          </div>
        </div>

        {/* Proofing Photo Grid */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Click vào nút "Chọn ảnh" hoặc đánh dấu số sao để duyệt ảnh cần retouch. Bạn có thể thêm ghi chú chi tiết cho từng bức ảnh.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {proofs.map((item) => (
              <div
                key={item.id}
                className={`group rounded-xl overflow-hidden border transition-all duration-200 flex flex-col ${
                  item.selected
                    ? 'border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20 dark:bg-amber-950/10'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121214]'
                }`}
              >
                {/* Photo frame */}
                <div className="aspect-[4/3] w-full overflow-hidden relative">
                  <img
                    src={item.photo.image}
                    alt={item.photo.vietnameseTitle}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />

                  {/* Selection Checkmark Button */}
                  <button
                    type="button"
                    onClick={() => toggleSelect(item.id)}
                    className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                      item.selected
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-black/40 text-neutral-300 hover:bg-black/70'
                    }`}
                    title={item.selected ? 'Bỏ chọn ảnh' : 'Chọn ảnh này'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white">
                    {item.photo.camera}
                  </div>
                </div>

                {/* Proof card controls */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-xs font-serif font-medium text-neutral-900 dark:text-white truncate">
                      {item.photo.vietnameseTitle}
                    </h4>
                    <div className="text-[10px] font-mono text-neutral-500">
                      ID: {item.photo.id} · {item.photo.focalLength}
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(item.id, star)}
                          className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              star <= item.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-neutral-300 dark:text-neutral-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActivePhotoForNote(
                          activePhotoForNote === item.id ? null : item.id
                        )
                      }
                      className="text-[11px] font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{item.note ? 'Sửa note' : 'Ghi chú'}</span>
                    </button>
                  </div>

                  {/* Note input field */}
                  {activePhotoForNote === item.id && (
                    <div className="pt-2">
                      <input
                        type="text"
                        placeholder="Ghi chú retouch (vd: xóa vết xước, tăng tương phản)..."
                        value={item.note}
                        onChange={(e) => updateNote(item.id, e.target.value)}
                        className="w-full text-xs p-2 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden"
                      />
                    </div>
                  )}

                  {item.note && activePhotoForNote !== item.id && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-1.5 rounded italic">
                      "{item.note}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 flex items-center justify-between">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Dữ liệu duyệt ảnh được đồng bộ bảo mật cho buổi chụp.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            Đóng Cổng Duyệt
          </button>
        </div>
      </div>
    </div>
  );
};
