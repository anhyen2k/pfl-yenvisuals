/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Quan ly anh proofing cua 1 don, dung trong Dashboard (tab Leads).
// CHI ADMIN thay duoc component nay (Dashboard chi render khi userRole
// la admin; cac ham upload/xoa trong firebase.ts con chan lai bang
// requireAdmin + firestore.rules/storage.rules).
// - Chon nhieu file 1 luc (toi da 30 anh/don, moi file <= 8MB), nen ve
//   1600px JPEG 0.82 + thumb 600px WebP, upload resumable co % tung anh.
// - Luoi thumbnail da up, nut xoa tung anh (xoa ca doc Firestore + file
//   Storage + thumb), hien so anh va so anh khach da chon (doc tu
//   proofing_selections cua don) kem sao/ghi chu khach de lai.

import React, { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Loader2, Image as ImageIcon, CheckCircle2, Star } from 'lucide-react';
import {
  MAX_PROOFING_PHOTOS_PER_LEAD,
  MAX_PROOFING_FILE_BYTES,
  extractPhoneSuffix,
  type BookingLead,
  type ProofingPhoto,
  type ProofingSelection,
} from '../utils/portfolioLogic';
import {
  fetchProofingPhotos,
  uploadProofingPhoto,
  deleteProofingPhoto,
  loadProofingSelection,
} from '../services/firebase';

interface ProofingManagerProps {
  lead: BookingLead;
  onToast: (msg: string) => void;
}

export const ProofingManager: React.FC<ProofingManagerProps> = ({ lead, onToast }) => {
  const [photos, setPhotos] = useState<ProofingPhoto[]>([]);
  const [selection, setSelection] = useState<ProofingSelection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadError, setUploadError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const phoneSuffix = extractPhoneSuffix(lead.phone);
  const selectedCount = selection ? selection.selectedIds.length : 0;

  const refresh = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [items, sel] = await Promise.all([
        fetchProofingPhotos(lead.id),
        loadProofingSelection(lead.id).catch(() => null),
      ]);
      setPhotos(items);
      setSelection(sel);
    } catch (err) {
      console.warn('Proofing load error:', err);
      setLoadError('Không tải được ảnh proofing, kiểm tra mạng / rules đã deploy chưa rồi thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Reset input de chon lai cung file van chay.
    e.target.value = '';
    if (files.length === 0) return;
    if (photos.length + files.length > MAX_PROOFING_PHOTOS_PER_LEAD) {
      setUploadError(`Mỗi đơn tối đa ${MAX_PROOFING_PHOTOS_PER_LEAD} ảnh (đơn này đã có ${photos.length} ảnh).`);
      return;
    }
    const oversize = files.filter((f) => f.size > MAX_PROOFING_FILE_BYTES);
    if (oversize.length > 0) {
      setUploadError(`Có ${oversize.length} file vượt quá 8MB, bỏ qua các file đó. Chỉ up các file còn lại.`);
    }
    const valid = files.filter((f) => f.size <= MAX_PROOFING_FILE_BYTES && f.type.startsWith('image/'));
    if (valid.length === 0) {
      if (oversize.length === 0) setUploadError('Vui lòng chọn file ảnh (JPEG/PNG/WebP).');
      return;
    }
    if (!phoneSuffix) {
      setUploadError('Đơn này chưa có SĐT hợp lệ nên không xác minh được 4 số cuối — kiểm tra lại SĐT khách.');
      return;
    }
    setUploadError('');
    setIsUploading(true);
    const progress: Record<string, number> = {};
    try {
      // Up tuan tu de tien do % tung anh ro rang, mang yeu khong bi nghen.
      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        const key = `${file.name}-${i}`;
        progress[key] = 0;
        setUploadProgress({ ...progress });
        const uploaded = await uploadProofingPhoto(
          file,
          lead.id,
          phoneSuffix,
          photos.length + i,
          (pct) => {
            progress[key] = pct;
            setUploadProgress({ ...progress });
          }
        );
        setPhotos((prev) => [...prev, uploaded].sort((a, b) => a.order - b.order));
        progress[key] = 100;
        setUploadProgress({ ...progress });
      }
      onToast(`Đã up ${valid.length} ảnh proofing cho đơn ${lead.id}.`);
    } catch (err) {
      console.warn('Proofing upload error:', err);
      setUploadError(
        `Up ảnh thất bại: ${err instanceof Error ? err.message : String(err)} Kiểm tra đã đăng nhập admin và deploy storage.rules/firestore.rules chưa.`
      );
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const handleDelete = async (photo: ProofingPhoto) => {
    if (!window.confirm(`Xoá ảnh #${photo.order + 1} khỏi đơn ${lead.id}? Khách sẽ không xem được ảnh này nữa.`)) return;
    setDeletingId(photo.id);
    try {
      await deleteProofingPhoto(photo);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      onToast('Đã xoá ảnh proofing.');
    } catch (err) {
      console.warn('Proofing delete error:', err);
      onToast('Xoá ảnh thất bại, thử lại sau.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/10 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Ảnh proofing của đơn này</span>
          <span className="font-sans tabular-nums font-normal text-neutral-500">
            ({photos.length}/{MAX_PROOFING_PHOTOS_PER_LEAD} ảnh
            {selection ? ` · khách đã chọn ${selectedCount} ảnh` : ' · khách chưa gửi lựa chọn'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="px-2.5 py-1.5 text-xs font-medium rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer disabled:opacity-60"
          >
            {isLoading ? 'Đang tải...' : 'Tải lại'}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || photos.length >= MAX_PROOFING_PHOTOS_PER_LEAD}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer disabled:opacity-60"
          >
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{isUploading ? 'Đang up...' : 'Chọn ảnh proofing'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
        </div>
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
        Khách mở bằng mã đơn {lead.id} + 4 số cuối SĐT ({phoneSuffix || 'chưa rõ'}). Ảnh up lên đây
        chỉ đơn này xem được. Ảnh gốc đầy đủ vẫn trả qua link Drive bên trên.
      </p>

      {loadError && (
        <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-900">
          {loadError}
        </div>
      )}
      {uploadError && (
        <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-900">
          {uploadError}
        </div>
      )}

      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-1">
          {Object.entries(uploadProgress).map(([key, pct]) => (
            <div key={key} className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
              <span className="truncate max-w-55 font-sans tabular-nums">{key}</span>
              <div className="flex-1 h-1.5 rounded bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div className="h-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="font-sans tabular-nums w-9 text-right">{pct}%</span>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="py-6 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang tải ảnh proofing...</span>
        </div>
      ) : photos.length === 0 ? (
        <div className="py-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg">
          Chưa có ảnh proofing cho đơn này. Bấm &quot;Chọn ảnh proofing&quot; để up (tối đa 30 ảnh).
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {photos.map((photo) => {
            const isSelected = selection?.selectedIds.includes(photo.id) ?? false;
            const rating = selection?.ratings[photo.id] || 0;
            const note = selection?.notes[photo.id] || '';
            return (
              <div
                key={photo.id}
                className={`relative rounded-lg overflow-hidden border bg-neutral-100 dark:bg-neutral-900 ${
                  isSelected ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="aspect-square">
                  <img
                    src={photo.thumbUrl || photo.url}
                    alt={`Ảnh proofing #${photo.order + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-xs font-sans tabular-nums">
                  #{photo.order + 1}
                </div>
                {isSelected && (
                  <div className="absolute top-1 right-8 p-1 rounded-full bg-amber-500 text-white" title="Khách đã chọn ảnh này">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(photo)}
                  disabled={deletingId === photo.id}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors cursor-pointer disabled:opacity-60"
                  title="Xoá ảnh này"
                >
                  {deletingId === photo.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
                {(rating > 0 || note) && (
                  <div className="px-1.5 py-1 bg-white dark:bg-neutral-950 text-xs leading-tight">
                    {rating > 0 && (
                      <div className="flex items-center gap-0.5 text-amber-500">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-sans tabular-nums">{rating}/5</span>
                      </div>
                    )}
                    {note && <div className="text-neutral-600 dark:text-neutral-300 italic truncate" title={note}>&quot;{note}&quot;</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selection && selection.selectedIds.length > 0 && (
        <div className="text-xs text-neutral-600 dark:text-neutral-300 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-2.5">
          <span className="font-semibold text-neutral-900 dark:text-white">
            Khách đã chọn {selection.selectedIds.length} ảnh
          </span>
          {selection.updatedAt && (
            <span className="font-sans tabular-nums text-neutral-500"> · gửi lúc {new Date(selection.updatedAt).toLocaleString('vi-VN')}</span>
          )}
          <span> — ảnh có dấu ✓ vàng là ảnh khách chọn, sao/ghi chú hiện ngay dưới ảnh.</span>
        </div>
      )}
    </div>
  );
};
