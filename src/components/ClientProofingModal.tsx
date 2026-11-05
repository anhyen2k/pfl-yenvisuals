/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Star,
  CheckCircle2,
  Copy,
  Lock,
  Check,
  MessageSquare,
} from 'lucide-react';
import { PhotoItem, BookingLead } from '../utils/portfolioLogic';

interface ClientProofingModalProps {
  isOpen: boolean;
  onClose: () => void;
  samplePhotos: PhotoItem[];
  /** Don da load (App truyen xuong). Neu co du lieu thi ma don phai khop 1 lead moi mo. */
  leads?: BookingLead[];
}

interface ProofItem {
  id: string;
  photo: PhotoItem;
  selected: boolean;
  rating: number;
  note: string;
}

interface SavedProofing {
  selectedIds: string[];
  ratings: Record<string, number>;
  notes: Record<string, string>;
}

const PROOFING_CODE_PREFIX = 'KY-';

function isValidProofingCode(code: string): boolean {
  const trimmed = code.trim();
  return trimmed.startsWith(PROOFING_CODE_PREFIX) && trimmed.length >= 5;
}

function proofingStorageKey(orderCode: string): string {
  return `proofing_${orderCode.trim()}`;
}

function loadSavedProofing(orderCode: string): SavedProofing | null {
  try {
    const raw = localStorage.getItem(proofingStorageKey(orderCode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedProofing;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      selectedIds: Array.isArray(parsed.selectedIds) ? parsed.selectedIds : [],
      ratings: parsed.ratings && typeof parsed.ratings === 'object' ? parsed.ratings : {},
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
    };
  } catch {
    return null;
  }
}

function buildProofItems(photos: PhotoItem[], saved: SavedProofing | null): ProofItem[] {
  return photos.slice(0, 6).map((photo) => ({
    id: `proof-${photo.id}`,
    photo,
    // Mac dinh: tat ca chua chon, chua danh sao, chua ghi chu.
    selected: saved ? saved.selectedIds.includes(photo.id) : false,
    rating: saved ? saved.ratings[photo.id] || 0 : 0,
    note: saved ? saved.notes[photo.id] || '' : '',
  }));
}

export const ClientProofingModal: React.FC<ClientProofingModalProps> = ({
  isOpen,
  onClose,
  samplePhotos,
  leads = [],
}) => {
  const [pinCode, setPinCode] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  const [proofs, setProofs] = useState<ProofItem[]>(() => buildProofItems(samplePhotos, null));
  const [activePhotoForNote, setActivePhotoForNote] = useState<string | null>(null);

  // Moi lan mo modal: chi hien form nhap ma, khong hien anh nao truoc khi mo khoa.
  useEffect(() => {
    if (isOpen) {
      setPinCode('');
      setOrderCode('');
      setUnlocked(false);
      setCodeError('');
      setCopied(false);
      setCopyError('');
      setActivePhotoForNote(null);
      setProofs(buildProofItems(samplePhotos, null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Luu lua chon / danh sao / ghi chu vao localStorage theo ma don.
  useEffect(() => {
    if (!unlocked || !orderCode) return;
    const data: SavedProofing = {
      selectedIds: proofs.filter((p) => p.selected).map((p) => p.photo.id),
      ratings: Object.fromEntries(proofs.map((p) => [p.photo.id, p.rating])),
      notes: Object.fromEntries(proofs.map((p) => [p.photo.id, p.note])),
    };
    try {
      localStorage.setItem(proofingStorageKey(orderCode), JSON.stringify(data));
    } catch {
      // Bo qua loi luu localStorage (vd: che do an danh chan luu tru).
    }
  }, [proofs, unlocked, orderCode]);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const code = pinCode.trim();
    if (!isValidProofingCode(code)) {
      setCodeError('Mã không đúng định dạng, mã đơn bắt đầu bằng KY-...');
      return;
    }
    // Ma don phai khop voi 1 lead da load (khong phan biet hoa/thuong).
    // Neu danh sach lead chua load duoc (khach chua dang nhap, leads rong)
    // thi tam chap nhan ma dung dinh dang de cong van mo duoc — han che nay
    // ghi trong FIX-NOTES-V2.md (can mo read cong khai booking_leads moi
    // kiem tra chat duoc, nhung se lo thong tin khach hang).
    if (leads.length > 0) {
      const found = leads.some((l) => l.id.trim().toUpperCase() === code.toUpperCase());
      if (!found) {
        setCodeError('Không tìm thấy đơn với mã này, kiểm tra lại mã đơn.');
        return;
      }
    }
    setCodeError('');
    setOrderCode(code);
    setProofs(buildProofItems(samplePhotos, loadSavedProofing(code)));
    setUnlocked(true);
  };

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

  const handleExportList = async () => {
    const selected = proofs.filter((p) => p.selected);
    const summary = [
      `=== DANH SÁCH ẢNH ĐÃ DUYỆT - YÊN VISUALS ===`,
      `Mã đơn / mã buổi: ${orderCode}`,
      `Số lượng ảnh chọn: ${selected.length}/${proofs.length}`,
      `Thời gian: ${new Date().toLocaleDateString('vi-VN')}`,
      `---------------------------------------`,
      ...(selected.length === 0
        ? ['(Chưa chọn ảnh nào)']
        : selected.map(
            (s, i) =>
              `${i + 1}. [${s.photo.vietnameseTitle || s.photo.title}] (${s.photo.camera}) - Đánh giá: ${
                s.rating > 0 ? `${s.rating}★` : 'chưa đánh sao'
              }${s.note ? ` - Ghi chú: "${s.note}"` : ''}`
          )),
    ].join('\n');

    try {
      await navigator.clipboard?.writeText(summary);
      setCopied(true);
      setCopyError('');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError('Không sao chép được, vui lòng thử lại.');
    }
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
                DUYỆT ẢNH KỈ YẾU & ÁO DÀI
              </div>
              <h3 className="text-lg font-serif font-medium text-neutral-900 dark:text-white">
                Cổng Duyệt Ảnh Khách Hàng
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

        {!unlocked ? (
          /* Form nhap ma: chua mo khoa thi khong hien anh nao */
          <div className="p-6 sm:p-10 flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h4 className="text-base font-serif font-medium text-neutral-900 dark:text-white">
              Nhập mã đơn để xem ảnh của bạn
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
              Mã đơn / mã buổi được Anh Yên gửi sau khi đặt lịch (bắt đầu bằng KY-, ví dụ
              KY-12345).
            </p>
            <form onSubmit={handleUnlock} className="w-full max-w-sm mt-6 space-y-3">
              {codeError && (
                <div className="p-3 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-900 text-left">
                  {codeError}
                </div>
              )}
              <input
                type="text"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="Mã đơn / mã buổi (vd: KY-12345)"
                autoFocus
                className="w-full text-sm px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono text-center uppercase"
              />
              <button
                type="submit"
                className="w-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 rounded-md transition-colors cursor-pointer"
              >
                Mở ảnh của tôi
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Status Bar */}
            <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 font-mono">
                <span>
                  Mã đơn: <strong className="text-neutral-900 dark:text-white">{orderCode}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Đã chọn:{' '}
                  <strong className="text-amber-600 dark:text-amber-400 font-semibold">
                    {selectedCount}
                  </strong>
                  /{proofs.length} ảnh
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportList}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-medium transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? 'Đã sao chép danh sách!' : 'Copy danh sách gửi Anh Yên'}</span>
                </button>
              </div>
            </div>
            {copyError && (
              <div className="px-6 pt-3 text-xs text-rose-600 dark:text-rose-400">{copyError}</div>
            )}

            {/* Proofing Photo Grid */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Click vào nút &quot;Chọn ảnh&quot; hoặc đánh dấu số sao để duyệt ảnh cần retouch.
                Bạn có thể thêm ghi chú chi tiết cho từng bức ảnh. Lựa chọn của bạn được lưu
                trên thiết bị này theo mã đơn.
              </p>

              {proofs.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-10">
                  Chưa có ảnh nào cho mã đơn này.
                </p>
              ) : (
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
                            &quot;{item.note}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 flex items-center justify-between">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {unlocked
              ? 'Dữ liệu duyệt ảnh được lưu trên thiết bị của bạn theo mã đơn.'
              : 'Nhập đúng mã đơn để xem ảnh buổi chụp của bạn.'}
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
