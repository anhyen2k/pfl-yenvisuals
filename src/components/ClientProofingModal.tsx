/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Cong duyet anh theo TUNG DON (v6) — thay ban cu chi hien 6 anh mau chung.
// Khach nhap MA DON (KY-...) + 4 SO CUOI SDT dat lich. Mo dung anh cua don
// do (collection proofing_photos, query theo leadId), xac minh phoneSuffix
// luu kem moi anh. Khach chon / danh sao / ghi chu roi bam "Gui lua chon"
// -> ghi proofing_selections len Firestore; ghi Cloud loi thi van luu local
// va bao ro. Khong mo doc booking_leads (bao mat thong tin khach).
// Anh tra goc day du van qua link Drive o muc Tra cuu don (ContactSection).

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
  Send,
  Loader2,
  ZoomIn,
} from 'lucide-react';
import {
  normalizeProofingCode,
  isValidProofingCode,
  type ProofingPhoto,
  type ProofingSelection,
} from '../utils/portfolioLogic';
import {
  fetchProofingPhotos,
  loadProofingSelection,
  saveProofingSelection,
} from '../services/firebase';

interface ClientProofingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** @deprecated v6 khong dung nua (khong hien anh mau chung). Giu de tuong thich. */
  samplePhotos?: unknown;
  /** @deprecated v6 khong dung nua (khong doc booking_leads). Giu de tuong thich. */
  leads?: unknown;
}

interface ProofItem {
  photo: ProofingPhoto;
  selected: boolean;
  rating: number;
  note: string;
}

interface SavedProofing {
  selectedIds: string[];
  ratings: Record<string, number>;
  notes: Record<string, string>;
}

function proofingStorageKey(orderCode: string): string {
  return `proofing_${orderCode.trim()}`;
}

function loadSavedProofingLocal(orderCode: string): SavedProofing | null {
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

function buildProofItems(photos: ProofingPhoto[], saved: SavedProofing | null): ProofItem[] {
  return photos.map((photo) => ({
    photo,
    selected: saved ? saved.selectedIds.includes(photo.id) : false,
    rating: saved ? saved.ratings[photo.id] || 0 : 0,
    note: saved ? saved.notes[photo.id] || '' : '',
  }));
}

export const ClientProofingModal: React.FC<ClientProofingModalProps> = ({ isOpen, onClose }) => {
  const [pinCode, setPinCode] = useState('');
  const [phoneSuffix, setPhoneSuffix] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitIsError, setSubmitIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cloudSaved, setCloudSaved] = useState(false);

  const [proofs, setProofs] = useState<ProofItem[]>([]);
  const [activePhotoForNote, setActivePhotoForNote] = useState<string | null>(null);
  const [largePhoto, setLargePhoto] = useState<ProofingPhoto | null>(null);

  // Moi lan mo modal: chi hien form nhap ma, khong hien anh nao truoc khi mo khoa.
  useEffect(() => {
    if (isOpen) {
      setPinCode('');
      setPhoneSuffix('');
      setOrderCode('');
      setUnlocked(false);
      setCodeError('');
      setCopied(false);
      setCopyError('');
      setSubmitMsg('');
      setSubmitIsError(false);
      setIsSubmitting(false);
      setCloudSaved(false);
      setActivePhotoForNote(null);
      setLargePhoto(null);
      setProofs([]);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Luu lua chon / danh sao / ghi chu vao localStorage theo ma don (du phong).
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

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = normalizeProofingCode(pinCode);
    const suffix = phoneSuffix.replace(/[^0-9]/g, '');
    if (!isValidProofingCode(code)) {
      setCodeError('Mã không đúng định dạng, mã đơn bắt đầu bằng KY-... (ví dụ KY-12345).');
      return;
    }
    if (suffix.length !== 4) {
      setCodeError('Vui lòng nhập đúng 4 số cuối của số điện thoại đã dùng khi đặt lịch.');
      return;
    }
    setCodeError('');
    setIsLoading(true);
    try {
      // Query dung anh cua don nay (limit 50, theo thu tu Anh Yen up).
      const photos = await fetchProofingPhotos(code);
      if (photos.length === 0) {
        setCodeError('Chưa có ảnh cho mã đơn này, Anh Yên sẽ up sau khi trả ảnh.');
        return;
      }
      // Xac minh 4 so cuoi SDT luu kem anh dau tien cua don.
      if (photos[0].phoneSuffix && photos[0].phoneSuffix !== suffix) {
        setCodeError('4 số cuối SĐT không khớp với đơn này, kiểm tra lại mã đơn và SĐT đặt lịch.');
        return;
      }
      // Nap lua chon da gui truoc (Cloud) hoac da luu tren may nay (local).
      let saved: SavedProofing | null = null;
      try {
        const cloud = await loadProofingSelection(code);
        if (cloud) {
          saved = { selectedIds: cloud.selectedIds, ratings: cloud.ratings, notes: cloud.notes };
          setCloudSaved(true);
        }
      } catch {
        // Cloud chua doc duoc thi dung ban local, khong chan mo anh.
      }
      if (!saved) saved = loadSavedProofingLocal(code);
      setOrderCode(code);
      setProofs(buildProofItems(photos, saved));
      setUnlocked(true);
    } catch (err) {
      console.warn('Proofing load error:', err);
      setCodeError('Không tải được ảnh, kiểm tra mạng rồi thử lại. (Nếu vẫn lỗi, có thể rules proofing chưa được deploy — nhờ Anh Yên kiểm tra.)');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setProofs((prev) =>
      prev.map((item) =>
        item.photo.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const setRating = (id: string, stars: number) => {
    setProofs((prev) =>
      prev.map((item) =>
        item.photo.id === id ? { ...item, rating: stars } : item
      )
    );
  };

  const updateNote = (id: string, note: string) => {
    setProofs((prev) =>
      prev.map((item) =>
        item.photo.id === id ? { ...item, note } : item
      )
    );
  };

  const selectedCount = proofs.filter((p) => p.selected).length;

  const handleSubmitSelection = async () => {
    if (!orderCode) return;
    setIsSubmitting(true);
    setSubmitMsg('');
    setSubmitIsError(false);
    const selection: ProofingSelection = {
      leadId: orderCode,
      selectedIds: proofs.filter((p) => p.selected).map((p) => p.photo.id),
      ratings: Object.fromEntries(proofs.map((p) => [p.photo.id, p.rating])),
      notes: Object.fromEntries(proofs.map((p) => [p.photo.id, p.note])),
      updatedAt: new Date().toISOString(),
    };
    try {
      await saveProofingSelection(selection);
      setCloudSaved(true);
      setSubmitMsg('Đã gửi lựa chọn cho Anh Yên! Anh Yên sẽ xem và liên hệ lại qua Zalo.');
      setSubmitIsError(false);
    } catch (err) {
      console.warn('Proofing submit error:', err);
      // Ghi Cloud loi: van giu ban local (effect tren da luu) va bao ro.
      setSubmitMsg('Đã lưu trên máy này, chưa gửi được lên Cloud, thử lại khi có mạng.');
      setSubmitIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportList = async () => {
    const selected = proofs.filter((p) => p.selected);
    const summary = [
      `=== DANH SÁCH ẢNH ĐÃ DUYỆT - YÊN PHOTO ===`,
      `Mã đơn / mã buổi: ${orderCode}`,
      `Số lượng ảnh chọn: ${selected.length}/${proofs.length}`,
      `Thời gian: ${new Date().toLocaleDateString('vi-VN')}`,
      `---------------------------------------`,
      ...(selected.length === 0
        ? ['(Chưa chọn ảnh nào)']
        : selected.map(
            (s, i) =>
              `${i + 1}. Ảnh #${s.photo.order + 1} (${s.photo.id}) - Đánh giá: ${
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
      <div className="bg-white dark:bg-[#0c0c0e] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-sans tabular-nums uppercase tracking-wider text-amber-600 dark:text-amber-400 font-medium">
                DUYỆT ẢNH KỈ YẾU & ÁO DÀI
              </div>
              <h3 className="text-2xl font-serif font-medium text-neutral-900 dark:text-white">
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
          /* Form nhap ma + 4 so cuoi SDT: chua mo khoa thi khong hien anh nao */
          <div className="p-6 sm:p-10 flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h4 className="text-base font-serif font-medium text-neutral-900 dark:text-white">
              Nhập mã đơn và 4 số cuối SĐT để xem ảnh của bạn
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
              Mã đơn / mã buổi được Anh Yên gửi sau khi đặt lịch (bắt đầu bằng KY-, ví dụ
              KY-12345). Chỉ người giữ mã đơn và SĐT đặt lịch mới xem được ảnh của đơn đó.
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
                className="w-full text-sm px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans tabular-nums text-center uppercase"
              />
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={phoneSuffix}
                onChange={(e) => setPhoneSuffix(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                placeholder="4 số cuối SĐT đặt lịch (vd: 0500)"
                className="w-full text-sm px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans tabular-nums text-center"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isLoading ? 'Đang tải ảnh...' : 'Mở ảnh của tôi'}</span>
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Status Bar */}
            <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 font-sans tabular-nums">
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
                {cloudSaved && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-600 dark:text-emerald-400">Đã lưu trên Cloud</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmitSelection}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isSubmitting ? 'Đang gửi...' : 'Gửi lựa chọn'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportList}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors cursor-pointer"
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
            {submitMsg && (
              <div
                className={`px-6 pt-3 text-xs ${
                  submitIsError ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {submitMsg}
              </div>
            )}

            {/* Proofing Photo Grid */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Đây là ảnh xem trước của riêng đơn {orderCode} — bấm vào ảnh để xem lớn.
                Click vào nút &quot;Chọn ảnh&quot; hoặc đánh dấu số sao để duyệt ảnh cần retouch.
                Bạn có thể thêm ghi chú chi tiết cho từng bức ảnh, rồi bấm &quot;Gửi lựa chọn&quot;
                để Anh Yên thấy. Ảnh gốc đầy đủ vẫn trả qua link Google Drive.
              </p>

              {proofs.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-10">
                  Chưa có ảnh nào cho mã đơn này.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {proofs.map((item) => (
                    <div
                      key={item.photo.id}
                      className={`group rounded-xl overflow-hidden border transition-all duration-200 flex flex-col ${
                        item.selected
                          ? 'border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20 dark:bg-amber-950/10'
                          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121214]'
                      }`}
                    >
                      {/* Photo frame: load thumbnail truoc, bam de xem anh lon */}
                      <div
                        className="aspect-[4/3] w-full overflow-hidden relative cursor-pointer"
                        onClick={() => setLargePhoto(item.photo)}
                      >
                        <img
                          src={item.photo.thumbUrl || item.photo.url}
                          alt={`Ảnh proofing ${item.photo.order + 1} — đơn ${orderCode}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />

                        {/* Selection Checkmark Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(item.photo.id);
                          }}
                          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                            item.selected
                              ? 'bg-amber-500 text-white shadow-md'
                              : 'bg-black/40 text-neutral-300 hover:bg-black/70'
                          }`}
                          title={item.selected ? 'Bỏ chọn ảnh' : 'Chọn ảnh này'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>

                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-xs font-sans tabular-nums text-white flex items-center gap-1">
                          <ZoomIn className="w-3 h-3" />
                          <span>Ảnh #{item.photo.order + 1} · Bấm để xem lớn</span>
                        </div>
                      </div>

                      {/* Proof card controls */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h4 className="text-xs font-serif font-medium text-neutral-900 dark:text-white">
                            Ảnh #{item.photo.order + 1}
                          </h4>
                          <div className="text-xs font-sans tabular-nums text-neutral-500">
                            {item.selected ? 'Đã chọn ✓' : 'Chưa chọn'}
                          </div>
                        </div>

                        {/* Star Rating */}
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(item.photo.id, star)}
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
                                activePhotoForNote === item.photo.id ? null : item.photo.id
                              )
                            }
                            className="text-xs font-sans tabular-nums text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>{item.note ? 'Sửa note' : 'Ghi chú'}</span>
                          </button>
                        </div>

                        {/* Note input field */}
                        {activePhotoForNote === item.photo.id && (
                          <div className="pt-2">
                            <input
                              type="text"
                              placeholder="Ghi chú retouch (vd: xóa vết xước, tăng tương phản)..."
                              value={item.note}
                              onChange={(e) => updateNote(item.photo.id, e.target.value)}
                              className="w-full text-xs p-2 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden"
                            />
                          </div>
                        )}

                        {item.note && activePhotoForNote !== item.photo.id && (
                          <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-1.5 rounded italic">
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

        {/* Xem anh lon (anh 1600px, chi load khi bam) */}
        {largePhoto && (
          <div
            className="absolute inset-0 z-10 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLargePhoto(null)}
          >
            <button
              type="button"
              onClick={() => setLargePhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer"
              aria-label="Đóng ảnh lớn"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={largePhoto.url}
              alt={`Ảnh proofing ${largePhoto.order + 1} — đơn ${orderCode}`}
              className="max-h-[85vh] max-w-full object-contain rounded-sm"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded bg-black/60 text-white text-xs font-sans tabular-nums">
              Ảnh #{largePhoto.order + 1} · Đơn {orderCode} · Bấm ra ngoài để đóng
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 flex items-center justify-between">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {unlocked
              ? 'Bấm "Gửi lựa chọn" để Anh Yên thấy lựa chọn của bạn trên Dashboard.'
              : 'Nhập đúng mã đơn và 4 số cuối SĐT đặt lịch để xem ảnh buổi chụp của bạn.'}
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
