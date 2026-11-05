/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { PhotoItem } from '../utils/portfolioLogic';

interface DeletePhotoModalProps {
  isOpen: boolean;
  photo: PhotoItem | null;
  onClose: () => void;
  onConfirm: (photoId: string) => void;
}

export const DeletePhotoModal: React.FC<DeletePhotoModalProps> = ({
  isOpen,
  photo,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !photo) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(photo.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xác nhận xoá ảnh"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="bg-white dark:bg-[#111115] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 text-neutral-900 dark:text-white space-y-4">
        {/* Header Icon */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-300 dark:border-red-800/80">
            <Trash2 className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
            Xác Nhận Xoá Bức Ảnh Này?
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
            Hành động này sẽ gỡ bỏ bức ảnh vĩnh viễn khỏi Portfolio và cơ sở dữ liệu Cloud Firestore. Khách hàng sẽ không còn thấy ảnh này trên website nữa.
          </p>
        </div>

        {/* Photo Preview Mini-Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0">
            <img
              src={photo.image}
              alt={photo.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
              {photo.title}
            </h4>
            {photo.vietnameseTitle && (
              <p className="text-[11px] text-neutral-500 truncate">{photo.vietnameseTitle}</p>
            )}
            <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400 font-mono">
              <span>{photo.location}</span>
              <span>·</span>
              <span>{photo.camera}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-2.5 rounded-lg">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Thao tác này đồng bộ ngay lập tức và không thể hoàn tác.</span>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Huỷ bỏ
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Đang xoá...' : 'Xoá Vĩnh Viễn'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
