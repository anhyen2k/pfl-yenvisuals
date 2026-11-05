/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Camera, ArrowUp, Lock, Crown, LogOut, LayoutDashboard } from 'lucide-react';

interface FooterProps {
  isAdmin?: boolean;
  onOpenAdminLogin?: () => void;
  onToggleDashboard?: () => void;
  onLogoutAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  isAdmin = false,
  onOpenAdminLogin,
  onToggleDashboard,
  onLogoutAdmin,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#09090b] text-neutral-600 dark:text-neutral-400 text-xs py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-2.5">
            <Camera className="w-5 h-5 text-neutral-900 dark:text-white" />
            <span className="font-serif font-semibold text-lg tracking-wider text-neutral-900 dark:text-white uppercase">
              YÊN PHOTO
            </span>
            <span className="text-neutral-400 font-mono text-[11px]">· PHOTOGRAPHY ARCHIVE</span>
          </div>

          {/* Link mang xa hoi: TAM AN — cac link truoc day chi tro ve trang
              chu chung instagram.com / behance.net / vsco.co / 500px.com,
              khong phai tai khoan cua Yen. Yen cung cap handle that thi them
              lai o day. */}
          {/* Back to top */}
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Cuộn lên đầu trang"
          >
            <span>Lên đầu trang</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-col md:flex-row items-center justify-between gap-3 text-neutral-400 font-mono text-[11px]">
          <div>
            © 2026 Yên Photo. Mọi quyền được bảo lưu. Kỉ yếu & Áo dài Hà Nội.
          </div>

          {/* Admin Entry or Active Admin Status */}
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Crown className="w-3.5 h-3.5" />
                <span>Admin: Anh Yên</span>
                <span className="text-neutral-300 dark:text-neutral-700">·</span>
                <button
                  type="button"
                  onClick={onToggleDashboard}
                  className="hover:underline flex items-center gap-1 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                >
                  <LayoutDashboard className="w-3 h-3" />
                  <span>Vào Dashboard</span>
                </button>
                <span className="text-neutral-300 dark:text-neutral-700">·</span>
                <button
                  type="button"
                  onClick={onLogoutAdmin}
                  className="hover:underline text-rose-500 cursor-pointer"
                >
                  Đăng Xuất
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-neutral-400"
              >
                <Lock className="w-3 h-3" />
                <span>Cổng Quản Trị Viên (Admin)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
