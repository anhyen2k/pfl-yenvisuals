/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/* v7.4 — Modal ma QR Zalo: nut "Nhan Zalo" o Hero / Lien he (va nut
   Zalo trong man hinh xac nhan dat lich) mo modal nay thay vi mo thang
   link zalo.me. Khach quet ma bang Zalo tren dien thoai, hoac bam
   "Mo Zalo truc tiep" khi dang dung dien thoai. File QR:
   public/assets/zalo-qr.png (quet ra https://zalo.me/0961230500);
   neu Yen co ma QR chinh thuc tu app Zalo thi chi can thay file do. */

import React, { useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';
import { withBase } from '../utils/cleanPaths';

interface ZaloQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZaloQrModal: React.FC<ZaloQrModalProps> = ({ isOpen, onClose }) => {
  // Dong bang phim Escape.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="zalo-qr-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xs bg-white dark:bg-[#111115] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-6 text-center text-neutral-900 dark:text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Đóng cửa sổ"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
          <MessageCircle className="w-5 h-5" />
        </div>

        <h2 id="zalo-qr-title" className="mt-4 font-serif text-xl font-medium tracking-tight">
          Quét mã để nhắn Zalo
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Mở Zalo trên điện thoại, quét mã bên dưới để nhắn cho
        </p>
        <p className="mt-1 text-sm font-semibold">
          {SITE_CONFIG.brandName} · <span className="tabular-nums">{SITE_CONFIG.phoneDisplay}</span>
        </p>

        <div className="mt-5 mx-auto w-56 h-56 rounded-xl bg-white p-3 border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <img
            src={withBase('/assets/zalo-qr.png')}
            alt="Mã QR Zalo Yên Photo"
            className="w-full h-full object-contain"
          />
        </div>

        <a
          href={SITE_CONFIG.zaloUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Mở Zalo trực tiếp</span>
        </a>
        <p className="mt-3 text-xs text-neutral-400">
          Đang dùng điện thoại thì bấm nút trên để mở Zalo luôn.
        </p>
      </div>
    </div>
  );
};
