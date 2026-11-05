/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';
import { loginWithGoogle, logoutUser } from '../services/firebase';
import { ADMIN_EMAIL } from '../config/site';
import { isAdminEmail } from '../utils/portfolioLogic';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginWithGoogle();
      // Chi dung email quan tri moi duoc vao Dashboard: truoc day bat ky
      // tai khoan Google nao dang nhap xong cung goi onLoginSuccess() va
      // thanh admin. Kiem tra ngay tai day, sai email thi dang xuat luon.
      // So sanh voi ADMIN_EMAIL co dinh (isAdminEmail chuan hoa
      // trim().toLowerCase()), khong dung email nhan don photographerEmail
      // vi gia tri do sua duoc trong Dashboard Settings.
      if (!user || !isAdminEmail(user.email)) {
        await logoutUser().catch(() => {});
        setErrorMsg(
          `Tài khoản đã đăng nhập là "${user?.email || '(không rõ email)'}", tài khoản quản trị là "${ADMIN_EMAIL}". Chỉ tài khoản quản trị mới vào được trang quản trị. Nếu 2 email nhìn giống nhau mà vẫn báo lỗi, có thể do khoảng trắng trong cài đặt email nhận đơn cũ — hãy xoá giá trị đó trong Dashboard > Settings (mục Email nhận đơn) rồi đăng nhập lại.`
        );
        return;
      }
      onLoginSuccess();
    } catch (err: any) {
      console.warn('Google sign-in:', err);
      // Nguoi dung tu dong popup thi khong hien loi; cac loi khac hien ma loi
      // that kem huong dan khac phuc ngan gon tuong ung.
      if (err?.code === 'auth/popup-closed-by-user') {
        // Khong lam gi: nguoi dung tu dong popup.
      } else if (err?.code) {
        const guidanceByCode: Record<string, string> = {
          'auth/unauthorized-domain':
            'Domain anhyenk2k.github.io chưa được thêm vào Firebase Authentication > Settings > Authorized domains.',
          'auth/operation-not-allowed':
            'Chưa bật đăng nhập Google trong Firebase Authentication > Sign-in method.',
          'auth/popup-blocked':
            'Trình duyệt đã chặn popup, hãy cho phép popup cho trang này rồi thử lại.',
        };
        const guidance = guidanceByCode[err.code];
        setErrorMsg(
          guidance
            ? `Không thể đăng nhập bằng tài khoản Google (${err.code}). ${guidance}`
            : `Không thể đăng nhập bằng tài khoản Google (${err.code}). Vui lòng thử lại.`
        );
      } else {
        setErrorMsg('Không thể đăng nhập bằng tài khoản Google. Vui lòng thử lại.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#111115] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-6 sm:p-8 overflow-hidden text-neutral-900 dark:text-neutral-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-login-title"
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Đóng cửa sổ"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800 shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 id="admin-login-title" className="font-serif text-xl sm:text-2xl font-bold tracking-tight">
              Cổng Đăng Nhập Quản Trị
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Dành riêng cho Nhiếp ảnh gia <strong className="text-neutral-800 dark:text-neutral-200">Anh Yên</strong> quản lý đơn kỉ yếu & áo dài
            </p>
          </div>
        </div>

        {/* Form: chi dang nhap Google, khong con PIN */}
        <div className="space-y-4">
          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
            Chỉ tài khoản Google <strong className="text-neutral-800 dark:text-neutral-200">{ADMIN_EMAIL}</strong> mới
            vào được trang quản trị.
          </p>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-2.5 px-4 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleLoading ? 'Đang đăng nhập Google...' : `Đăng nhập với Google (${ADMIN_EMAIL})`}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium text-xs rounded-lg transition-colors cursor-pointer mt-1"
          >
            Trở về giao diện xem ảnh dành cho khách
          </button>
        </div>

        {/* Security footnote */}
        <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 text-center text-xs text-neutral-400">
          Khách hàng thông thường chỉ có quyền xem ảnh, chọn ảnh yêu thích và gửi đơn đăng ký chụp.
        </div>
      </div>
    </div>
  );
};
