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
  translateCloudError,
  type BookingLead,
  type ProofingPhoto,
  type ProofingSelection,
} from '../utils/portfolioLogic';
import {
  fetchProofingPhotos,
  uploadProofingPhoto,
  deleteProofingPhoto,
  loadProofingSelection,
  compressImageFile,
  PROOFING_MAX_DIMENSION,
  PROOFING_JPEG_QUALITY,
} from '../services/firebase';
import { uploadQueue, mapWithConcurrency, MAX_CONCURRENT_UPLOADS } from '../services/uploadQueue';

/** 1 file proofing Yen vua chon, dang cho tai len (v7.7): nen ngay khi
 *  chon xong (song song toi da 4 file), hien thumbnail xem truoc ngay;
 *  bam "Tai len" thi chi con buoc tai qua hang doi chung. */
interface PendingProofingFile {
  key: string;
  file: File;
  name: string;
  previewUrl: string;
  compressedBlob: Blob | null;
  status: 'compressing' | 'ready' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}

interface ProofingManagerProps {
  lead: BookingLead;
  onToast: (msg: string) => void;
}

export const ProofingManager: React.FC<ProofingManagerProps> = ({ lead, onToast }) => {
  const [photos, setPhotos] = useState<ProofingPhoto[]>([]);
  const [selection, setSelection] = useState<ProofingSelection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingProofingFile[]>([]);
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
    if (photos.length + pendingFiles.length + files.length > MAX_PROOFING_PHOTOS_PER_LEAD) {
      setUploadError(`Mỗi đơn tối đa ${MAX_PROOFING_PHOTOS_PER_LEAD} ảnh (đơn này đã có ${photos.length} ảnh, đang chờ ${pendingFiles.length} ảnh).`);
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
    // (v7.7) Hien thumbnail xem truoc NGAY, roi NEN NGAY luc chon (song
    // song toi da 4 file) — trong luc Yen xem lai danh sach thi may da
    // nen xong, bam "Tai len" chi con buoc tai.
    const now = Date.now();
    const entries: PendingProofingFile[] = valid.map((file, i) => ({
      key: `${file.name}-${now}-${i}`,
      file,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      compressedBlob: null,
      status: 'compressing',
      progress: 0,
    }));
    setPendingFiles((prev) => [...prev, ...entries]);
    const results = await mapWithConcurrency(
      entries,
      MAX_CONCURRENT_UPLOADS,
      async (entry) => {
        try {
          return await compressImageFile(entry.file, {
            maxDimension: PROOFING_MAX_DIMENSION,
            quality: PROOFING_JPEG_QUALITY,
          });
        } catch {
          return entry.file;
        }
      }
    );
    setPendingFiles((prev) =>
      prev.map((p) => {
        const idx = entries.findIndex((en) => en.key === p.key);
        if (idx < 0) return p;
        const res = results[idx];
        return res.ok
          ? { ...p, compressedBlob: res.value, status: 'ready' as const }
          : { ...p, compressedBlob: p.file, status: 'ready' as const };
      })
    );
  };

  const updatePending = (key: string, patch: Partial<PendingProofingFile>) => {
    setPendingFiles((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  };

  const removePending = (key: string) => {
    setPendingFiles((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.key !== key);
    });
  };

  /** Tai cac anh da nen xong len Cloud qua hang doi chung (song song toi
   *  da 4 anh, moi anh tu thu lai toi da 3 lan). Anh nao xong thi them
   *  ngay vao luoi da up; anh loi thi de lai nut thu lai. */
  const handleUploadPending = () => {
    const ready = pendingFiles.filter((p) => p.status === 'ready' || p.status === 'error');
    if (ready.length === 0) return;
    setUploadError('');
    const baseOrder = photos.length;
    ready.forEach((entry, i) => {
      const order = baseOrder + i;
      updatePending(entry.key, { status: 'uploading', progress: 0, error: undefined });
      uploadQueue.enqueue({
        id: `proofing-${lead.id}-${entry.key}`,
        label: entry.name,
        status: 'queued',
        progress: 0,
        attempts: 0,
        run: async (onProgress) => {
          const uploaded = await uploadProofingPhoto(
            entry.file,
            lead.id,
            phoneSuffix,
            order,
            (pct) => {
              updatePending(entry.key, { progress: pct });
              onProgress(pct);
            },
            entry.compressedBlob
          );
          setPhotos((prev) => [...prev, uploaded].sort((a, b) => a.order - b.order));
          updatePending(entry.key, { status: 'done', progress: 100 });
          URL.revokeObjectURL(entry.previewUrl);
        },
        onError: (err) => {
          updatePending(entry.key, { status: 'error', error: translateCloudError(err) });
          console.warn('Proofing background upload error:', entry.name, err);
        },
      });
    });
    // Don het anh loi: xoa cac anh da xong khoi danh sach cho sau vai giay
    // (chip tien do chung cung tu an khi xong).
    setTimeout(() => {
      setPendingFiles((prev) => prev.filter((p) => p.status !== 'done'));
    }, 5000);
  };

  const pendingReadyCount = pendingFiles.filter((p) => p.status === 'ready' || p.status === 'error').length;
  const pendingCompressingCount = pendingFiles.filter((p) => p.status === 'compressing').length;
  const pendingUploadingCount = pendingFiles.filter((p) => p.status === 'uploading').length;
  const pendingDoneCount = pendingFiles.filter((p) => p.status === 'done').length;

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
            disabled={photos.length + pendingFiles.length >= MAX_PROOFING_PHOTOS_PER_LEAD}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer disabled:opacity-60"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Chọn ảnh proofing</span>
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

      {/* (v7.7) Anh vua chon: hien thumbnail ngay, nen xong thi bam "Tai
          len" de tai song song toi da 4 anh qua hang doi chung. */}
      {pendingFiles.length > 0 && (
        <div className="space-y-2 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-neutral-900 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold text-neutral-900 dark:text-white">
              Ảnh vừa chọn ({pendingFiles.length} ảnh
              {pendingCompressingCount > 0 && ` · đang nén ${pendingCompressingCount}`}
              {pendingUploadingCount > 0 && ` · đang up ${pendingUploadingCount}`} · đã xong{' '}
              {pendingDoneCount}/{pendingFiles.length} ảnh)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPendingFiles((prev) => {
                  prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
                  return [];
                })}
                disabled={pendingUploadingCount > 0}
                className="px-2.5 py-1.5 text-xs font-medium rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer disabled:opacity-60"
              >
                Huỷ tất cả
              </button>
              <button
                type="button"
                onClick={handleUploadPending}
                disabled={pendingReadyCount === 0}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer disabled:opacity-60"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải lên {pendingReadyCount} ảnh</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {pendingFiles.map((entry) => (
              <div key={entry.key} className="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                <div className="aspect-square">
                  <img src={entry.previewUrl} alt={entry.name} className="w-full h-full object-cover" />
                </div>
                <div className="px-1.5 py-1 text-xs leading-tight">
                  <div className="truncate text-neutral-700 dark:text-neutral-300" title={entry.name}>{entry.name}</div>
                  {entry.status === 'compressing' && (
                    <div className="text-neutral-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Đang nén…
                    </div>
                  )}
                  {entry.status === 'ready' && <div className="text-emerald-600">Đã nén xong — chờ tải lên</div>}
                  {entry.status === 'uploading' && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 rounded bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                        <div className="h-full bg-amber-500 transition-all" style={{ width: `${entry.progress}%` }} />
                      </div>
                      <span className="font-sans tabular-nums">{entry.progress}%</span>
                    </div>
                  )}
                  {entry.status === 'done' && (
                    <div className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Đã xong
                    </div>
                  )}
                  {entry.status === 'error' && (
                    <div className="text-rose-600 dark:text-rose-400" title={entry.error}>
                      Lỗi — bấm &quot;Tải lên&quot; để thử lại
                    </div>
                  )}
                </div>
                {(entry.status === 'ready' || entry.status === 'error' || entry.status === 'compressing') && (
                  <button
                    type="button"
                    onClick={() => removePending(entry.key)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                    title="Bỏ ảnh này khỏi danh sách chờ"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Ảnh proofing nén còn 1400px (đủ nét để khách chọn), tải song song tối đa 4 ảnh 1 lúc, lỗi thì tự thử lại.
          </p>
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
