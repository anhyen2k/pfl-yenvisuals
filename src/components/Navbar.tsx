/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Camera, Sun, Moon, Plus, Menu, X, ShieldCheck, Mail, Lock, LogOut } from 'lucide-react';
import { UserRole } from '../utils/portfolioLogic';
import { navigateHome, navigateToSection, pathForSectionId, withBase } from '../utils/cleanPaths';

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenBooking: () => void;
  onOpenAddPhoto: () => void;
  onOpenProofing: () => void;
  favoritesCount: number;
  onFilterFavorites: () => void;
  showingFavoritesOnly: boolean;
  currentView: 'portfolio' | 'dashboard';
  onToggleView: () => void;
  unreadLeadsCount?: number;
  userRole: UserRole;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenBooking,
  onOpenAddPhoto,
  onOpenProofing,
  favoritesCount,
  onFilterFavorites,
  showingFavoritesOnly,
  currentView,
  onToggleView,
  unreadLeadsCount = 0,
  userRole,
  onOpenAdminLogin,
  onLogoutAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = userRole === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0E0E10]/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand wordmark */}
        <a
          href={withBase('/')}
          onClick={(e) => {
            e.preventDefault();
            if (currentView === 'dashboard') {
              onToggleView();
            } else {
              navigateHome();
            }
          }}
          className="group flex items-center gap-2.5 text-lg font-serif tracking-widest text-neutral-900 dark:text-neutral-100 uppercase whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity"
        >
          <Camera className="w-5 h-5 text-neutral-800 dark:text-neutral-200 transition-transform group-hover:rotate-12" />
          <span className="font-semibold text-lg sm:text-xl tracking-wider">YÊN PHOTO</span>
        </a>

        {/* Zone 2: Navigation links (for guests or admin preview) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {currentView === 'portfolio' ? (
            <>
              <a
                href={pathForSectionId('gallery')}
                onClick={(e) => { e.preventDefault(); navigateToSection('gallery'); }}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Tác Phẩm
              </a>
              <a
                href={pathForSectionId('series')}
                onClick={(e) => { e.preventDefault(); navigateToSection('series'); }}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Bộ Ảnh Triển Lãm
              </a>
              <a
                href={pathForSectionId('about')}
                onClick={(e) => { e.preventDefault(); navigateToSection('about'); }}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Về Tác Giả & Thiết Bị
              </a>
              {/* Nut "Khu Vuc Khach Hang" (Proofing) chi con trong menu mobile;
                  van mo duoc tu ContactSection, khong mat chuc nang. */}
              <a
                href={pathForSectionId('contact')}
                onClick={(e) => { e.preventDefault(); navigateToSection('contact'); }}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Liên Hệ
              </a>
            </>
          ) : (
            <div className="text-xs font-sans tabular-nums text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Chế Độ Quản Trị Website & Tư Vấn Khách</span>
            </div>
          )}
        </nav>

        {/* Zone 3: Actions & utilities */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* ADMIN-ONLY CONTROLS */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-1 sm:p-1.5 rounded-lg">
              {/* Dashboard Switcher */}
              <button
                type="button"
                onClick={onToggleView}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                  currentView === 'dashboard'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-semibold'
                    : 'bg-white text-amber-900 dark:bg-neutral-900 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100/50'
                }`}
                title={currentView === 'dashboard' ? 'Quay lại xem trang portfolio' : 'Mở bảng điều khiển quản lý và xem đơn đăng ký'}
              >
                <span>{currentView === 'dashboard' ? '← Xem Web' : 'Dashboard'}</span>
              </button>

              {/* Add photo button (Admin only) */}
              <button
                type="button"
                onClick={onOpenAddPhoto}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md border border-neutral-300 dark:border-neutral-700 transition-colors cursor-pointer"
                title="Đăng thêm ảnh mới vào portfolio"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Ảnh</span>
              </button>

              {/* Logout button */}
              <button
                type="button"
                onClick={onLogoutAdmin}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-md transition-colors cursor-pointer"
                title="Đăng xuất chế độ Admin (Về chế độ Khách xem)"
                aria-label="Đăng xuất Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          {/* Dark/Light mode toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-1.5 sm:p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
            aria-label={darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            title={darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Primary Action Button: "Đặt Lịch Chụp" (Visible to all clients) */}
          {currentView === 'portfolio' && (
            <button
              type="button"
              onClick={onOpenBooking}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-xs font-semibold tracking-wider uppercase text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Đặt Lịch</span>
              <span className="hidden sm:inline"> Chụp</span>
            </button>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md cursor-pointer ml-0.5"
            aria-label="Mở menu điều hướng"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0E0E10] px-4 pt-3 pb-5 space-y-2">
          {/* Admin Controls in Mobile Menu */}
          {isAdmin && (
            <div className="p-3 mb-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-sans tabular-nums text-amber-800 dark:text-amber-300 font-semibold">
                <span className="flex items-center gap-1">
                  Quản Trị Viên (Anh Yên)
                </span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogoutAdmin();
                  }}
                  className="text-neutral-500 hover:text-rose-600 text-xs flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  Đăng xuất
                </button>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onToggleView();
                  }}
                  className="flex-1 py-1.5 px-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium rounded-md text-center"
                >
                  {currentView === 'dashboard' ? '← Xem Web' : `Dashboard (${unreadLeadsCount})`}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAddPhoto();
                  }}
                  className="py-1.5 px-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-xs font-medium rounded-md text-center"
                >
                  + Thêm Ảnh
                </button>
              </div>
            </div>
          )}

          {/* Standard Navigation Links */}
          <a
            href={pathForSectionId('gallery')}
            onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateToSection('gallery'); }}
            className="block px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
          >
            Tác Phẩm
          </a>
          <a
            href={pathForSectionId('series')}
            onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateToSection('series'); }}
            className="block px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
          >
            Bộ Ảnh Triển Lãm
          </a>
          <a
            href={pathForSectionId('about')}
            onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateToSection('about'); }}
            className="block px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
          >
            Về Tác Giả & Thiết Bị
          </a>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenProofing();
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md flex items-center justify-between"
          >
            <span>Khu Vực Khách Hàng (Proofing)</span>
            <ShieldCheck className="w-4 h-4 text-neutral-400" />
          </button>
          <a
            href={pathForSectionId('contact')}
            onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateToSection('contact'); }}
            className="block px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
          >
            Liên Hệ
          </a>

          {/* Client Booking Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full py-2.5 px-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold uppercase tracking-wider rounded-md text-center"
            >
              Đặt Lịch Chụp Kỉ Yếu & Áo Dài
            </button>
          </div>

          {/* Admin Login Link at bottom for Guest */}
          {!isAdmin && (
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-center">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminLogin();
                }}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 py-1 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Dành Cho Nhiếp Ảnh Gia (Đăng Nhập Quản Trị)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

