/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Camera, ArrowUp, Lock, Crown } from 'lucide-react';
import { DEFAULT_SITE_CONTENT, type SiteContent } from '../config/content';

interface FooterProps {
  isAdmin?: boolean;
  onOpenAdminLogin?: () => void;
  onToggleDashboard?: () => void;
  onLogoutAdmin?: () => void;
  /** Noi dung giao dien (tu App / Firestore); khong truyen thi dung mac dinh. */
  content?: SiteContent;
}

export const Footer: React.FC<FooterProps> = ({
  isAdmin = false,
  onOpenAdminLogin,
  onToggleDashboard,
  onLogoutAdmin,
  content,
}) => {
  const c = content ?? DEFAULT_SITE_CONTENT;
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0E0E10] text-neutral-600 dark:text-neutral-400 text-sm py-8 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* v7 — Footer 1 hang duy nhat: thuong hieu + tagline + len dau trang + cong admin */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-2.5">
            <Camera className="w-5 h-5 text-neutral-900 dark:text-white" />
            <span className="font-serif font-semibold text-lg tracking-wider text-neutral-900 dark:text-white uppercase">
              Yên Photo
            </span>
            <span className="hidden lg:inline text-sm text-neutral-500 dark:text-neutral-400">
              — {c.footerTagline}
            </span>
          </div>

          <div className="flex items-center gap-5 text-sm">
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Cuộn lên đầu trang"
            >
              <span>Lên đầu trang</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            {isAdmin ? (
              <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Crown className="w-3.5 h-3.5" />
                <button
                  type="button"
                  onClick={onToggleDashboard}
                  className="hover:underline cursor-pointer"
                >
                  Vào Dashboard
                </button>
                <span className="text-neutral-300 dark:text-neutral-700">·</span>
                <button
                  type="button"
                  onClick={onLogoutAdmin}
                  className="hover:underline text-rose-500 cursor-pointer"
                >
                  Đăng xuất
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Quản trị</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
