/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Gallery } from './components/Gallery';
import { LightboxModal } from './components/LightboxModal';
import { SeriesSection } from './components/SeriesSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AddPhotoModal } from './components/AddPhotoModal';
import { EditPhotoModal } from './components/EditPhotoModal';
import { DeletePhotoModal } from './components/DeletePhotoModal';
import { UploadQueueChip } from './components/UploadQueueChip';
import { uploadQueue } from './services/uploadQueue';
import { BookingModal } from './components/BookingModal';
import { ClientProofingModal } from './components/ClientProofingModal';
import { ZaloQrModal } from './components/ZaloQrModal';
import { DashboardView } from './components/DashboardView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Lock } from 'lucide-react';
import { INITIAL_PHOTOS, PHOTO_SERIES } from './data/portfolioData';
import { SITE_CONFIG } from './config/site';
import {
  BOOKING_PATH,
  navigateToSection,
  withBase,
  normalizePath,
  pathForHash,
  photoIdForHash,
  scrollToSectionId,
  sectionIdForPath,
} from './utils/cleanPaths';
import {
  PhotoItem,
  PhotoCategory,
  filterPhotos,
  BookingInquiry,
  BookingLead,
  BookingStatus,
  EmailNotificationLog,
  INITIAL_LEADS,
  calculateDepositAmount,
  calculateEstimatedPrice,
  createBookingLead,
  generateEmailNotification,
  getPackageDetails,
  sendBookingEmailReal,
  isAdminEmail,
  translateCloudError,
  mergeOptimisticPhotos,
  type PhotoSyncStatus,
  type PendingPhotoUpload,
  UserRole,
  DEFAULT_PACKAGE_PRICES,
  type PackagePrices,
} from './utils/portfolioLogic';
import {
  saveBookingLeadToCloud,
  subscribeToBookingLeads,
  updateLeadStatusInCloud,
  deleteBookingLeadFromCloud,
  saveEmailLogToCloud,
  subscribeToEmailLogs,
  savePhotoToCloud,
  updatePhotoInCloud,
  deletePhotoFromCloud,
  deletePhotoFromStorage,
  uploadPhotoWithThumbnail,
  seedMissingPortfolioPhotos,
  subscribeToPortfolioPhotos,
  loadPackagePrices,
  loadPackagePricesMeta,
  savePackagePrices,
  subscribeToPackagePrices,
  loadCachedSiteContent,
  loadSiteContentMeta,
  saveSiteContent,
  subscribeToSiteContent,
  savePublicOrder,
  syncAllPublicOrders,
  deletePublicOrder,
  SITE_CONTENT_CACHE_KEY,
  SITE_CONTENT_UPDATED_AT_KEY,
  logoutUser,
  auth,
  onAuthStateChanged,
  loginWithGoogle,
  type User,
} from './services/firebase';
import { DEFAULT_SITE_CONTENT, type SiteContent } from './config/content';

export default function App() {
  // Theme state: dark mode default for photography portfolio contrast
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('portfolio_theme');
    if (saved) return saved === 'dark';
    return true; // Default dark for luxury photography display
  });

  // Main view switcher: 'portfolio' (public client view) vs 'dashboard' (admin management & counseling)
  const [currentView, setCurrentView] = useState<'portfolio' | 'dashboard'>('portfolio');

  // Photographer email recipient for customer registration notifications
  const [photographerEmail, setPhotographerEmail] = useState<string>(() => {
    return localStorage.getItem('yen_photographer_email') || SITE_CONFIG.photographerEmail;
  });

  // Bang gia goi hien hanh: cache localStorage truoc, Firestore (settings/pricing)
  // la nguon chinh, subscribe live de doi gia o Dashboard la cap nhat ngay.
  const [packagePrices, setPackagePrices] = useState<PackagePrices>(() => {
    try {
      const saved = localStorage.getItem('yen_photo_package_prices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed['aodai-solo'] === 'number' &&
          typeof parsed['kiyieu-lop'] === 'number' &&
          typeof parsed['cophuc-heritage'] === 'number' &&
          typeof parsed['photobook-print'] === 'number' &&
          typeof parsed.extraPerPerson === 'number'
        ) {
          return parsed as PackagePrices;
        }
      }
    } catch (e) {
      console.warn('Failed to parse package prices from storage', e);
    }
    return { ...DEFAULT_PACKAGE_PRICES };
  });

  // Thoi gian luu bang gia lan cuoi (loadPackagePrices / subscribe chi tra
  // gia, khong tra updatedAt) nen ghi lai luc luu thanh cong, cache localStorage.
  const [pricingUpdatedAt, setPricingUpdatedAt] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem('yen_photo_package_prices_updated_at') || undefined;
    } catch {
      return undefined;
    }
  });

  // Tai bang gia tu Firestore khi mo trang + lang nghe live: admin doi gia
  // o Dashboard thi gia hien tren web doi theo, khong can F5.
  useEffect(() => {
    let isMounted = true;
    loadPackagePricesMeta()
      .then((meta) => {
        if (!isMounted || !meta) return;
        setPackagePrices(meta.prices);
        if (meta.updatedAt) {
          const d = new Date(meta.updatedAt);
          if (!isNaN(d.getTime())) {
            const s = d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
            setPricingUpdatedAt(s);
            try { localStorage.setItem('yen_photo_package_prices_updated_at', s); } catch {}
          }
        }
        try {
          localStorage.setItem('yen_photo_package_prices', JSON.stringify(meta.prices));
        } catch {}
      })
      .catch((e) => console.warn('Load package prices warning:', e));
    const unsub = subscribeToPackagePrices((cloud) => {
      if (!isMounted) return;
      setPackagePrices(cloud);
      try {
        localStorage.setItem('yen_photo_package_prices', JSON.stringify(cloud));
      } catch {}
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Dashboard luu gia moi: ghi Firestore truoc, roi setState ngay (khong can F5).
  // (v6) Chan them o App: chi userRole admin moi goi duoc (Dashboard cung
  // chan, firebase.ts requireAdmin chan, rules chan tren Cloud).
  const handleSavePackagePrices = async (prices: PackagePrices) => {
    if (userRole !== 'admin') {
      throw new Error('Chỉ quản trị viên mới được đổi giá. Vui lòng đăng nhập Google bằng anhyenk26@gmail.com.');
    }
    // (v7.6) Loi Firebase thi nem lai da dich sang tieng Viet de Dashboard
    // hien ly do that (vd permission-denied do deploy nham database).
    try {
      await savePackagePrices(prices);
    } catch (e) {
      throw new Error(translateCloudError(e));
    }
    setPackagePrices(prices);
    const nowStr = new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    setPricingUpdatedAt(nowStr);
    try {
      localStorage.setItem('yen_photo_package_prices', JSON.stringify(prices));
      localStorage.setItem('yen_photo_package_prices_updated_at', nowStr);
    } catch {}
  };

  // (v6) Noi dung giao dien: cache localStorage truoc (mo trang hien ngay,
  // khong trang), Firestore (settings/content) la nguon chinh, subscribe
  // live de admin doi noi dung o Dashboard la web cap nhat ngay.
  const [siteContent, setSiteContent] = useState<SiteContent>(() => loadCachedSiteContent());
  const [contentUpdatedAt, setContentUpdatedAt] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem(SITE_CONTENT_UPDATED_AT_KEY) || undefined;
    } catch {
      return undefined;
    }
  });

  useEffect(() => {
    let isMounted = true;
    loadSiteContentMeta()
      .then((meta) => {
        if (!isMounted || !meta) return;
        setSiteContent(meta.content);
        if (meta.updatedAt) {
          const d = new Date(meta.updatedAt);
          if (!isNaN(d.getTime())) {
            const s = d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
            setContentUpdatedAt(s);
            try { localStorage.setItem(SITE_CONTENT_UPDATED_AT_KEY, s); } catch {}
          }
        }
        try {
          localStorage.setItem(SITE_CONTENT_CACHE_KEY, JSON.stringify(meta.content));
        } catch {}
      })
      .catch((e) => console.warn('Load site content warning:', e));
    const unsub = subscribeToSiteContent((cloud) => {
      if (!isMounted) return;
      setSiteContent(cloud);
      try {
        localStorage.setItem(SITE_CONTENT_CACHE_KEY, JSON.stringify(cloud));
      } catch {}
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Dashboard luu noi dung moi: CHI ADMIN (chan o App truoc khi goi
  // firebase.ts requireAdmin + rules tren Cloud). Ghi Firestore truoc,
  // roi setState + cache ngay (khong can F5).
  const handleSaveSiteContent = async (content: SiteContent) => {
    if (userRole !== 'admin') {
      throw new Error('Chỉ quản trị viên mới được sửa nội dung giao diện. Vui lòng đăng nhập Google bằng anhyenk26@gmail.com.');
    }
    // (v7.6) Loi Firebase thi nem lai da dich sang tieng Viet (xem tren).
    try {
      await saveSiteContent(content);
    } catch (e) {
      throw new Error(translateCloudError(e));
    }
    setSiteContent(content);
    const nowStr = new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    setContentUpdatedAt(nowStr);
    try {
      localStorage.setItem(SITE_CONTENT_CACHE_KEY, JSON.stringify(content));
      localStorage.setItem(SITE_CONTENT_UPDATED_AT_KEY, nowStr);
    } catch {}
  };

  // (v7.5) Dashboard -> tab Cai dat: dong bo lai tra cuu cho cac don cu
  // (don tao truoc v7.5 chua co ban ghi public_orders). Chi admin.
  // Tra ve so don da dong bo de Dashboard bao toast.
  const handleSyncPublicOrders = async (): Promise<number> => {
    if (userRole !== 'admin') {
      throw new Error('Chỉ quản trị viên mới được đồng bộ tra cứu. Vui lòng đăng nhập Google bằng anhyenk26@gmail.com.');
    }
    // (v7.6) Loi Firebase thi nem lai da dich sang tieng Viet (xem tren).
    try {
      return await syncAllPublicOrders(leads);
    } catch (e) {
      throw new Error(translateCloudError(e));
    }
  };

  // Leads & Contact Inquiries state
  const [leads, setLeads] = useState<BookingLead[]>(() => {
    try {
      const saved = localStorage.getItem('yen_portfolio_leads');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse leads from storage', e);
    }
    return INITIAL_LEADS;
  });

  // Email Notification Logs state
  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>(() => {
    try {
      const saved = localStorage.getItem('yen_email_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse email logs', e);
    }
    // Generate initial logs from initial leads
    return INITIAL_LEADS.map((l) => generateEmailNotification(l, SITE_CONFIG.photographerEmail));
  });

  // Photos state with local storage persistence and Cloud Firestore sync
  const [photos, setPhotos] = useState<PhotoItem[]>(() => {
    try {
      const allSaved = localStorage.getItem('portfolio_all_photos');
      if (allSaved) return JSON.parse(allSaved);
      const saved = localStorage.getItem('portfolio_custom_photos');
      if (saved) {
        const custom = JSON.parse(saved);
        return [...custom, ...INITIAL_PHOTOS];
      }
    } catch (e) {
      console.warn('Failed to parse custom photos', e);
    }
    return INITIAL_PHOTOS;
  });

  // Active filters and query
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showingFavoritesOnly, setShowingFavoritesOnly] = useState<boolean>(false);

  // Favorites state
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('portfolio_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User role state: 'guest' (default for clients) vs 'admin' (photographer Anh Yên)
  // Admin chi duoc cap qua Firebase Auth (Google dung email Yen) trong
  // onAuthStateChanged ben duoi. Khong doc co localStorage 'yen_admin_auth'
  // nua, vi co nay truoc day co the duoc dat boi dang nhap PIN da bi go.
  const [userRole, setUserRole] = useState<UserRole>('guest');

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // (v7.7) Anh dang dong bo ngam (optimistic UI): anh moi / anh sua hien
  // ngay bang URL xem truoc local, chi ton tai trong bo nho — KHONG ghi
  // vao localStorage (blob URL chet sau khi tai lai trang) va KHONG tron
  // vao `photos` (subscription Firestore thay toan bo danh sach bang ban
  // Cloud nen anh lac quan ma tron vao se bi xoa). pendingUploadFiles giu
  // file goc + blob da nen de bam "thu lai" khi dong bo loi.
  const [pendingPhotos, setPendingPhotos] = useState<PhotoItem[]>([]);
  const [pendingEdits, setPendingEdits] = useState<Record<string, string>>({});
  const [photoSync, setPhotoSync] = useState<
    Record<string, { status: PhotoSyncStatus; error?: string }>
  >({});
  const pendingUploadFiles = React.useRef(
    new Map<string, { upload: PendingPhotoUpload; photo: PhotoItem; isEdit: boolean }>()
  );
  const [bookingPackage, setBookingPackage] = useState<BookingInquiry['packageType'] | undefined>(undefined);

  // Modal states
  const [selectedPhotoForLightbox, setSelectedPhotoForLightbox] = useState<PhotoItem | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isZaloQrOpen, setIsZaloQrOpen] = useState(false);

  // --- Clean paths (GitHub Pages, không dùng react-router) ---
  // /tac-pham -> #gallery, /bo-suu-tap -> #series, /ve-toi -> #about,
  // /lien-he -> #contact, /dat-lich -> mở BookingModal, / -> trang chủ.
  // Link cũ #about vẫn chạy: đổi thành /ve-toi rồi cuộn tới mục.
  const lastPathBeforeBookingRef = React.useRef<string>('/');
  const applyRoute = React.useCallback((path: string, hash: string) => {
    const cleanPath = normalizePath(path);
    if (hash) {
      const mapped = pathForHash(hash);
      if (mapped) {
        window.history.replaceState(null, '', mapped);
        const sectionId = sectionIdForPath(mapped);
        if (sectionId) {
          window.setTimeout(() => scrollToSectionId(sectionId), 150);
          return;
        }
      }
    }
    if (cleanPath === BOOKING_PATH) {
      setCurrentView('portfolio');
      setIsBookingOpen(true);
      return;
    }
    const sectionId = sectionIdForPath(cleanPath);
    if (sectionId) {
      setCurrentView('portfolio');
      // Cuộn sau khi render; thử lại 1 lần vì ảnh/Gallery có thể render chậm.
      window.setTimeout(() => {
        if (!scrollToSectionId(sectionId)) {
          window.setTimeout(() => scrollToSectionId(sectionId), 500);
        }
      }, 150);
      return;
    }
    if (cleanPath === '/') {
      setIsBookingOpen(false);
    }
  }, []);

  // Anh mo tu link chia se #photo-<id> (Lightbox copy link): mo thang
  // lightbox khi load trang. Dung ref de khong phu thuoc vong doi effect.
  const photosRef = React.useRef<PhotoItem[]>(photos);
  photosRef.current = photos;
  useEffect(() => {
    const id = photoIdForHash(window.location.hash);
    if (!id) return;
    const found =
      photosRef.current.find((p) => p.id === id) ||
      INITIAL_PHOTOS.find((p) => p.id === id);
    if (found) setSelectedPhotoForLightbox(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Áp dụng đường dẫn khi load trang lần đầu + khi bấm Back/Forward.
  useEffect(() => {
    applyRoute(window.location.pathname, window.location.hash);
    const onPopState = () => applyRoute(window.location.pathname, window.location.hash);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [applyRoute]);

  // Đồng bộ URL với BookingModal: mở modal -> /dat-lich, đóng -> về đường dẫn trước đó.
  useEffect(() => {
    if (isBookingOpen) {
      if (window.location.pathname !== withBase(BOOKING_PATH)) {
        lastPathBeforeBookingRef.current = window.location.pathname;
        window.history.pushState(null, '', withBase(BOOKING_PATH));
      }
    } else if (window.location.pathname === withBase(BOOKING_PATH)) {
      window.history.replaceState(null, '', lastPathBeforeBookingRef.current || '/');
    }
  }, [isBookingOpen]);

  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [isProofingOpen, setIsProofingOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<PhotoItem | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);

  // Real-time synchronization of portfolio photos from Cloud Firestore.
  // Firestore la nguon chinh, localStorage chi la cache khi offline / loi.
  useEffect(() => {
    let isMounted = true;
    const unsub = subscribeToPortfolioPhotos(
      (cloudPhotos) => {
        if (!isMounted) return;
        setPhotosLoading(false);
        setPhotosError(null);
        if (cloudPhotos && cloudPhotos.length > 0) {
          setPhotos(cloudPhotos);
          try {
            localStorage.setItem('portfolio_all_photos', JSON.stringify(cloudPhotos));
          } catch {}
        }
      },
      (err) => {
        if (!isMounted) return;
        setPhotosLoading(false);
        setPhotosError('Không tải được ảnh từ đám mây, đang dùng bản lưu trên máy.');
        console.warn('Portfolio photos subscription warning:', err);
      }
    );
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Monitor Firebase Auth state changes
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      // Quyen admin chi xet theo ADMIN_EMAIL co dinh (isAdminEmail), khong
      // dung email nhan don photographerEmail (sua duoc trong Settings).
      if (user && isAdminEmail(user.email)) {
        setUserRole('admin');
        try {
          localStorage.setItem('yen_admin_auth', 'true');
          localStorage.setItem('yen_admin_google_email', user.email || '');
        } catch {}
      } else if (user) {
        // Tai khoan Google khac dang nhap (vd: khach bam nut Google): khong
        // duoc giu quyen admin tu phien truoc, ha xuong guest.
        setUserRole('guest');
        try {
          localStorage.removeItem('yen_admin_auth');
          localStorage.removeItem('yen_admin_google_email');
        } catch {}
      }
    });
    return () => unsubAuth();
  }, []);

  // Seed anh mau con thieu len Cloud ngay khi admin dang nhap: neu khong,
  // chi can cloud co 1 anh (Yen them anh that dau tien) la subscription se
  // thay toan bo 12 anh mau bang moi anh do. Chi chay 1 lan / trinh duyet
  // (co localStorage) de khong hoi sinh anh Yen da chu dong xoa.
  const photoSeededRef = React.useRef(false);
  useEffect(() => {
    if (userRole !== 'admin' || !currentUser || photoSeededRef.current) return;
    if (localStorage.getItem('yen_photo_seed_v1')) {
      photoSeededRef.current = true;
      return;
    }
    photoSeededRef.current = true;
    seedMissingPortfolioPhotos(INITIAL_PHOTOS)
      .then(() => {
        try {
          localStorage.setItem('yen_photo_seed_v1', 'done');
        } catch {}
      })
      .catch((e) => console.warn('Seed portfolio photos warning:', e));
  }, [currentUser, userRole]);

  const handleAdminLoginSuccess = () => {
    setUserRole('admin');
    setIsAdminLoginOpen(false);
    setCurrentView('dashboard');
  };

  const handleLogoutAdmin = () => {
    try {
      localStorage.removeItem('yen_admin_auth');
      sessionStorage.removeItem('yen_admin_auth');
      localStorage.removeItem('yen_admin_google_email');
      logoutUser().catch(() => {});
    } catch (e) {
      console.warn('Storage clear error', e);
    }
    setCurrentUser(null);
    setUserRole('guest');
    setCurrentView('portfolio');
  };

  // Real-time synchronization with Cloud Firestore
  // CRITICAL per Firebase Integration Skill guidelines:
  // Only attach onSnapshot listeners if auth is ready and user is authenticated
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const isAuthorized =
      isAdminEmail(currentUser.email) ||
      userRole === 'admin';

    if (!isAuthorized) {
      return;
    }

    let isMounted = true;
    const unsubLeads = subscribeToBookingLeads(
      (cloudLeads) => {
        if (!isMounted) return;
        if (cloudLeads && cloudLeads.length > 0) {
          setLeads(cloudLeads);
          try {
            localStorage.setItem('yen_portfolio_leads', JSON.stringify(cloudLeads));
          } catch {}
        }
      },
      (err) => {
        console.warn('Real-time leads listener notice:', err);
      }
    );

    const unsubLogs = subscribeToEmailLogs(
      (cloudLogs) => {
        if (!isMounted) return;
        if (cloudLogs && cloudLogs.length > 0) {
          setEmailLogs(cloudLogs);
          try {
            localStorage.setItem('yen_email_logs', JSON.stringify(cloudLogs));
          } catch {}
        }
      },
      (err) => {
        console.warn('Real-time email logs listener notice:', err);
      }
    );

    return () => {
      isMounted = false;
      unsubLeads();
      unsubLogs();
    };
  }, [currentUser, userRole]);

  const handleToggleView = () => {
    if (userRole !== 'admin') {
      setIsAdminLoginOpen(true);
    } else {
      setCurrentView(currentView === 'portfolio' ? 'dashboard' : 'portfolio');
    }
  };

  const handleOpenAddPhoto = () => {
    if (userRole !== 'admin') {
      setIsAdminLoginOpen(true);
    } else {
      setIsAddPhotoOpen(true);
    }
  };

  // Sync theme with HTML class
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('portfolio_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('portfolio_theme', 'light');
    }
  }, [darkMode]);

  // Sync favorites to localStorage
  useEffect(() => {
    localStorage.setItem('portfolio_favorites', JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  // Filtered photos computation using decoupled pure logic
  const seriesTitleById: Record<string, string> = {};
  PHOTO_SERIES.forEach((sr) => { seriesTitleById[sr.id] = `${sr.title} ${sr.vietnameseTitle}`; });
  // (v7.7) Anh dang dong bo hien cung danh sach anh Cloud (anh moi len
  // truoc, anh sua hien ban xem truoc moi nhat).
  const allPhotosForDisplay = mergeOptimisticPhotos(photos, pendingPhotos, pendingEdits);
  const seriesFilteredPhotos = selectedSeriesId
    ? allPhotosForDisplay.filter((ph) => ph.seriesId === selectedSeriesId)
    : allPhotosForDisplay;
  const displayedPhotos = filterPhotos(
    seriesFilteredPhotos,
    selectedCategory,
    searchQuery,
    showingFavoritesOnly,
    favoriteIds,
    seriesTitleById
  );

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // (v7.6) Banner do hien LY DO THAT cua loi Cloud (ma loi + huong dan),
  // khong con cau chung chung "vui long thu lai". Loi that truoc day chi
  // nam trong console.warn nen Yen khong biet vi sao luu that bai.
  const reportSyncError = (msg: string, err?: unknown) => {
    const fullMsg = err === undefined ? msg : `${msg} ${translateCloudError(err)}`;
    setSyncError(fullMsg);
    window.alert(fullMsg);
  };

  const handleEditPhoto = (photo: PhotoItem) => {
    setEditingPhoto(photo);
  };

  // (v7.7) Dua viec tai anh portfolio vao hang doi nen: anh da hien ngay
  // trong Gallery bang URL xem truoc local; job chay toi da 4 cung luc,
  // tu thu lai toi da 3 lan. Xong thi doi URL local sang URL Cloud va
  // ghi doc Firestore; loi het 3 lan thi de huy hieu "Chua dong bo" tren
  // anh + bao loi 1 lan (khong spam moi lan thu lai).
  const enqueuePortfolioPhotoUpload = (
    photo: PhotoItem,
    upload: PendingPhotoUpload,
    isEdit: boolean
  ) => {
    pendingUploadFiles.current.set(photo.id, { upload, photo, isEdit });
    setPhotoSync((prev) => ({ ...prev, [photo.id]: { status: 'syncing' } }));
    uploadQueue.enqueue({
      id: `photo-${photo.id}`,
      label: photo.vietnameseTitle || photo.title || 'Ảnh portfolio',
      status: 'queued',
      progress: 0,
      attempts: 0,
      run: async (onProgress) => {
        const uploaded = await uploadPhotoWithThumbnail(
          upload.file,
          photo.id,
          onProgress,
          upload.compressedBlob ?? undefined
        );
        const cloudPhoto: PhotoItem = {
          ...photo,
          image: uploaded.url,
          thumbUrl: uploaded.thumbUrl,
        };
        if (isEdit) {
          setPendingEdits((prev) => {
            const next = { ...prev };
            delete next[photo.id];
            return next;
          });
        }
        // Anh moi xong thi go khoi danh sach lac quan; anh sua ma von la
        // anh moi dang dong bo thi cung go khoi day (vi photos se giu
        // ban Cloud ngay ben duoi) — tranh hien trung 2 anh khi
        // subscription Firestore tra ve doc Cloud.
        setPendingPhotos((prev) => prev.filter((p) => p.id !== photo.id));
        setPhotoSync((prev) => {
          const next = { ...prev };
          delete next[photo.id];
          return next;
        });
        setPhotos((prev) => {
          const exists = prev.some((p) => p.id === photo.id);
          const updated = exists
            ? prev.map((p) => (p.id === photo.id ? cloudPhoto : p))
            : [cloudPhoto, ...prev.filter((p) => p.id !== photo.id)];
          try {
            localStorage.setItem('portfolio_all_photos', JSON.stringify(updated));
          } catch {}
          return updated;
        });
        if (upload.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(upload.previewUrl);
        }
        await savePhotoToCloud(cloudPhoto);
      },
      onError: (err) => {
        setPhotoSync((prev) => ({
          ...prev,
          [photo.id]: { status: 'error', error: translateCloudError(err) },
        }));
        reportSyncError(
          'Tải ảnh lên đám mây thất bại, ảnh vẫn hiện trên web nhưng chưa đồng bộ. Bấm vào ảnh để thử lại.',
          err
        );
        console.warn('Cloud Storage photo background upload error:', err);
      },
    });
  };

  /** Bam vao huy hieu "Chua dong bo" tren anh (hoac nut Thu lai o chip)
   *  de chay lai job tai anh do. */
  const handleRetryPhotoSync = (photoId: string) => {
    const entry = pendingUploadFiles.current.get(photoId);
    if (!entry) return;
    enqueuePortfolioPhotoUpload(entry.photo, entry.upload, entry.isEdit);
  };

  const handleSaveEditedPhoto = (updatedPhoto: PhotoItem, upload?: PendingPhotoUpload) => {
    // Neu anh nay duoc ghim featured thi bo ghim cac anh khac (ca local lan
    // Cloud) — truoc day chi luu anh nay nen Firestore co the co nhieu anh
    // cung featured, Hero se lay anh dau tien mot cach kho doan.
    const previouslyFeatured = updatedPhoto.featured
      ? photos.filter((p) => p.featured && p.id !== updatedPhoto.id)
      : [];
    if (upload) {
      // (v7.7) Doi file moi: hien ngay ban xem truoc local, tai ngam.
      // Chi luu metadata (giu URL anh cu) vao photos/localStorage —
      // URL blob: khong bao gio duoc ghi vao localStorage vi se chet
      // sau khi tai lai trang.
      const metaOnlyPhoto: PhotoItem = {
        ...updatedPhoto,
        image: photos.find((p) => p.id === updatedPhoto.id)?.image ?? updatedPhoto.image,
        thumbUrl: photos.find((p) => p.id === updatedPhoto.id)?.thumbUrl,
      };
      setPendingEdits((prev) => ({ ...prev, [updatedPhoto.id]: upload.previewUrl }));
      setPhotos((prev) => {
        const updated = prev.map((p) => {
          if (p.id === updatedPhoto.id) return metaOnlyPhoto;
          if (updatedPhoto.featured && p.featured) return { ...p, featured: false };
          return p;
        });
        localStorage.setItem('portfolio_all_photos', JSON.stringify(updated));
        return updated;
      });
      if (selectedPhotoForLightbox?.id === updatedPhoto.id) {
        setSelectedPhotoForLightbox({ ...updatedPhoto, image: upload.previewUrl });
      }
      savePhotoToCloud(metaOnlyPhoto).catch((err) => {
        reportSyncError('Lưu thông tin ảnh lên đám mây thất bại, ảnh chỉ mới lưu trên máy này. Vui lòng kiểm tra mạng / đăng nhập Google rồi thử lại.', err);
        console.warn('Cloud Firestore photo update error:', err);
      });
      enqueuePortfolioPhotoUpload(updatedPhoto, upload, true);
    } else {
      setPhotos((prev) => {
        const updated = prev.map((p) => {
          if (p.id === updatedPhoto.id) return updatedPhoto;
          if (updatedPhoto.featured && p.featured) return { ...p, featured: false };
          return p;
        });
        localStorage.setItem('portfolio_all_photos', JSON.stringify(updated));
        return updated;
      });

      if (selectedPhotoForLightbox?.id === updatedPhoto.id) {
        setSelectedPhotoForLightbox(updatedPhoto);
      }

      savePhotoToCloud(updatedPhoto).catch((err) => {
        reportSyncError('Lưu ảnh lên đám mây thất bại, ảnh chỉ mới lưu trên máy này. Vui lòng kiểm tra mạng / đăng nhập Google rồi thử lại.', err);
        console.warn('Cloud Firestore photo update error:', err);
      });
    }
    if (previouslyFeatured.length > 0) {
      Promise.all(previouslyFeatured.map((p) => updatePhotoInCloud(p.id, { featured: false }))).catch((err) => {
        reportSyncError('Bỏ ghim ảnh nổi bật cũ trên đám mây thất bại, vui lòng thử lại.', err);
        console.warn('Cloud Firestore photo unfeature error:', err);
      });
    }
  };

  const handleRequestDeletePhoto = (photoId: string) => {
    const target = photos.find((p) => p.id === photoId);
    if (target) {
      setDeletingPhoto(target);
    }
  };

  const handleConfirmDeletePhoto = (photoId: string) => {
    const target = photos.find((p) => p.id === photoId)
      || pendingPhotos.find((p) => p.id === photoId);
    // (v7.7) Anh dang dong bo ngam ma bi xoa: huy job, go khoi danh sach
    // lac quan, thu hoi URL xem truoc local.
    setPendingPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setPendingEdits((prev) => {
      const next = { ...prev };
      delete next[photoId];
      return next;
    });
    setPhotoSync((prev) => {
      const next = { ...prev };
      delete next[photoId];
      return next;
    });
    uploadQueue.remove(`photo-${photoId}`);
    pendingUploadFiles.current.delete(photoId);
    if (target?.image?.startsWith('blob:')) URL.revokeObjectURL(target.image);
    setPhotos((prev) => {
      const updated = prev.filter((p) => p.id !== photoId);
      localStorage.setItem('portfolio_all_photos', JSON.stringify(updated));
      return updated;
    });

    if (selectedPhotoForLightbox?.id === photoId) {
      setSelectedPhotoForLightbox(null);
    }

    deletePhotoFromCloud(photoId).catch((err) => {
      reportSyncError('Xoá ảnh trên đám mây thất bại, ảnh có thể vẫn còn trên máy khác. Vui lòng thử lại.', err);
      console.warn('Cloud Firestore photo delete error:', err);
    });

    // Xoá luôn file gốc trên Storage (nếu là ảnh đã upload) để khỏi để file mồ côi.
    // URL blob: la anh lac quan chua len Cloud — khong co file de xoa.
    if (target?.image && target.image.startsWith('http')) {
      deletePhotoFromStorage(target.image).catch((err) =>
        console.warn('Cloud Storage photo file delete warning:', err)
      );
    }
  };

  const handleAddCustomPhoto = (newPhoto: PhotoItem, upload?: PendingPhotoUpload) => {
    if (upload) {
      // (v7.7) Them anh tuc thi: anh hien ngay trong Gallery bang URL xem
      // truoc local, tai len chay ngam trong hang doi. Anh lac quan KHONG
      // ghi vao localStorage (blob URL chet sau khi tai lai trang).
      setPendingPhotos((prev) => [newPhoto, ...prev.filter((p) => p.id !== newPhoto.id)]);
      enqueuePortfolioPhotoUpload(newPhoto, upload, false);
    } else {
      // Chi dan URL anh: khong co file de tai, luu thang nhu cu.
      setPhotos((prev) => {
        const updated = [newPhoto, ...prev];
        localStorage.setItem('portfolio_all_photos', JSON.stringify(updated));
        return updated;
      });
      savePhotoToCloud(newPhoto).catch((err) => {
        reportSyncError('Lưu ảnh mới lên đám mây thất bại, ảnh chỉ mới lưu trên máy này. Vui lòng kiểm tra mạng / đăng nhập Google rồi thử lại.', err);
        console.warn('Cloud Firestore photo save error:', err);
      });
    }
    setSelectedCategory('all');
    setShowingFavoritesOnly(false);
  };

  const handleToggleFeaturedPhoto = (photoId: string) => {
    const previouslyFeatured = photos.filter((p) => p.featured && p.id !== photoId);
    setPhotos((prev) => {
      const updated = prev.map((p) => ({
        ...p,
        featured: p.id === photoId,
      }));
      localStorage.setItem('portfolio_all_photos', JSON.stringify(updated));
      return updated;
    });
    // Bo ghim anh cu tren Firestore truoc, roi moi ghim anh moi — neu khong
    // tai lai se co nhieu anh cung featured.
    Promise.all(previouslyFeatured.map((p) => updatePhotoInCloud(p.id, { featured: false })))
      .then(() => updatePhotoInCloud(photoId, { featured: true }))
      .catch((err) => {
        reportSyncError('Đổi ảnh nổi bật trên đám mây thất bại, vui lòng thử lại.', err);
        console.warn('Cloud Firestore photo feature error:', err);
      });
  };

  const handleDeletePhoto = (photoId: string) => {
    handleRequestDeletePhoto(photoId);
  };

  const handleSelectSeries = (seriesId: string) => {
    setSelectedSeriesId(seriesId);
    setSelectedCategory('all');
    setShowingFavoritesOnly(false);
    const element = document.getElementById('gallery');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  const handleOpenBookingForPackage = (pkg: BookingInquiry['packageType']) => {
    setBookingPackage(pkg);
    setIsBookingOpen(true);
  };

  // Lead and Consultation Handlers
  const handleBookingSubmit = (
    inquiry: BookingInquiry,
    existingLead?: BookingLead,
    existingEmailLog?: EmailNotificationLog
  ) => {
    const lead = existingLead || createBookingLead(inquiry, photographerEmail, packagePrices).lead;
    const emailLog = existingEmailLog || generateEmailNotification(lead, photographerEmail, packagePrices);

    setLeads((prev) => {
      const updated = [lead, ...prev.filter((item) => item.id !== lead.id)];
      localStorage.setItem('yen_portfolio_leads', JSON.stringify(updated));
      return updated;
    });
    setEmailLogs((prev) => {
      const updated = [emailLog, ...prev.filter((item) => item.id !== emailLog.id)];
      localStorage.setItem('yen_email_logs', JSON.stringify(updated));
      return updated;
    });

    // Save to Firestore if not already saved in modal
    if (!existingLead) {
      saveBookingLeadToCloud(lead).catch((e) =>
        console.warn('Background Firestore lead save warning', e)
      );
      saveEmailLogToCloud(emailLog).catch((e) =>
        console.warn('Background Firestore log save warning', e)
      );
      sendBookingEmailReal(lead, photographerEmail, packagePrices).catch((e) =>
        console.warn('Background email send error', e)
      );
    }
    // (v7.5) Dong bo ban ghi tra cuu cong khai de khach tra duoc moi may.
    // Chi admin dang nhap moi ghi duoc public_orders (requireAdmin);
    // khach dat lich khi admin chua dang nhap thi bo qua lang, don van
    // duoc dong bo khi admin mo Dashboard bam "Dong bo lai tra cuu".
    savePublicOrder(lead).catch((e) =>
      console.warn('Background public order sync warning', e)
    );
  };

  const handleUpdateLead = (leadId: string, updates: Partial<BookingLead>) => {
    const target = leads.find((l) => l.id === leadId);
    if (!target) return;
    const updatedLead: BookingLead = { ...target, ...updates };
    // Neu doi tien coc da thu thi tinh lai con lai.
    if (updates.paidAmount !== undefined) {
      updatedLead.balance = Math.max(0, updatedLead.estimatedPrice - updatedLead.paidAmount);
    }
    setLeads((prev) => {
      const updated = prev.map((l) => (l.id === leadId ? updatedLead : l));
      localStorage.setItem('yen_portfolio_leads', JSON.stringify(updated));
      return updated;
    });
    saveBookingLeadToCloud(updatedLead).catch((e) => {
      reportSyncError('Lưu thay đổi đơn lên đám mây thất bại, vui lòng thử lại.', e);
      console.warn('Firestore updateLead error', e);
    });
    // (v7.5) Don doi (tien da thu / link Drive / trang thai / ghi chu
    // khong anh huong) -> dong bo lai ban ghi tra cuu cong khai.
    savePublicOrder(updatedLead).catch((e) =>
      console.warn('Public order sync warning', e)
    );
  };

  const handleUpdateLeadStatus = (leadId: string, status: BookingStatus) => {
    const target = leads.find((l) => l.id === leadId);
    setLeads((prev) => {
      const updated = prev.map((l) => (l.id === leadId ? { ...l, status } : l));
      localStorage.setItem('yen_portfolio_leads', JSON.stringify(updated));
      return updated;
    });
    updateLeadStatusInCloud(leadId, status).catch((e) =>
      console.warn('Firestore updateLeadStatus error', e)
    );
    // (v7.5) Trang thai doi -> dong bo lai ban ghi tra cuu cong khai.
    if (target) {
      savePublicOrder({ ...target, status }).catch((e) =>
        console.warn('Public order sync warning', e)
      );
    }
  };

  const handleUpdateLeadNotes = (leadId: string, notes: string) => {
    const target = leads.find((l) => l.id === leadId);
    // Khong co don nay thi dung: truoc day van goi saveBookingLeadToCloud
    // voi object chi co {id, notes} nen tao ra document rac tren Firestore.
    if (!target) return;
    setLeads((prev) => {
      const updated = prev.map((l) => (l.id === leadId ? { ...l, notes } : l));
      localStorage.setItem('yen_portfolio_leads', JSON.stringify(updated));
      return updated;
    });
    // Update notes in Firestore
    saveBookingLeadToCloud({ ...target, notes }).catch((e) =>
      console.warn('Firestore updateNotes error', e)
    );
  };

  const handleDeleteLead = (leadId: string) => {
    setLeads((prev) => {
      const updated = prev.filter((l) => l.id !== leadId);
      localStorage.setItem('yen_portfolio_leads', JSON.stringify(updated));
      return updated;
    });
    deleteBookingLeadFromCloud(leadId).catch((e) =>
      console.warn('Firestore deleteLead error', e)
    );
    // (v7.5) Xoa ca ban ghi tra cuu cong khai cua don nay.
    deletePublicOrder(leadId).catch((e) =>
      console.warn('Public order delete warning', e)
    );
  };

  const handleAddManualLead = (
    newLeadData: Omit<BookingLead, 'id' | 'createdAt' | 'emailSentAt' | 'emailSentTo'>
  ) => {
    const now = new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const estimatedPrice = newLeadData.estimatedPrice || calculateEstimatedPrice(newLeadData.packageType, newLeadData.groupCount, packagePrices);
    const depositAmount = newLeadData.depositAmount ?? calculateDepositAmount(estimatedPrice);
    const paidAmount = newLeadData.paidAmount ?? 0;
    const lead: BookingLead = {
      ...newLeadData,
      id: `KY-${Date.now().toString().slice(-6)}`,
      createdAt: now,
      estimatedPrice,
      depositAmount,
      paidAmount,
      balance: Math.max(0, estimatedPrice - paidAmount),
      driveLink: newLeadData.driveLink || '',
      emailSentTo: photographerEmail,
      emailSentAt: now,
    };
    const emailLog = generateEmailNotification(lead, photographerEmail, packagePrices);

    setLeads((prev) => {
      const updated = [lead, ...prev];
      localStorage.setItem('yen_portfolio_leads', JSON.stringify(updated));
      return updated;
    });
    setEmailLogs((prev) => {
      const updated = [emailLog, ...prev];
      localStorage.setItem('yen_email_logs', JSON.stringify(updated));
      return updated;
    });

    saveBookingLeadToCloud(lead).catch((e) =>
      console.warn('Firestore manual lead save error', e)
    );
    // (v7.5) Don them tay cung dong bo ban ghi tra cuu cong khai.
    savePublicOrder(lead).catch((e) =>
      console.warn('Public order sync warning', e)
    );
    saveEmailLogToCloud(emailLog).catch((e) =>
      console.warn('Firestore manual email log save error', e)
    );
  };

  // Gui mail thu: KHONG tao lead gia, KHONG them vao danh sach emailLogs chinh
  // (truoc day nut nay tao 1 khach 'TEST-...' lam ban du lieu va sai thong ke).
  // Chi gui thu roi bao ket qua; log test co [TEST] chi ghi trong console.
  const handleSendTestEmail = () => {
    const now = new Date().toLocaleString('vi-VN');
    const testLead: BookingLead = {
      id: `TEST-${Date.now().toString().slice(-4)}`,
      clientName: '[TEST] Kiểm tra email',
      phone: SITE_CONFIG.phone,
      email: 'khachhang.test@gmail.com',
      packageType: 'aodai-solo',
      preferredDate: now,
      location: 'Hà Nội',
      groupSize: '1 bạn',
      message: '[TEST] Email thử nghiệm — không phải đơn thật, không tính vào thống kê.',
      createdAt: now,
      status: 'new',
      notes: '[TEST] Email kiểm tra hệ thống.',
      source: 'web_form',
      estimatedPrice: getPackageDetails('aodai-solo', packagePrices).basePriceVND,
      depositAmount: calculateDepositAmount(getPackageDetails('aodai-solo', packagePrices).basePriceVND),
      paidAmount: 0,
      balance: getPackageDetails('aodai-solo', packagePrices).basePriceVND,
      driveLink: '',
      emailSentTo: photographerEmail,
      emailSentAt: now,
    };
    sendBookingEmailReal(testLead, photographerEmail, packagePrices).then((res) => {
      console.log('[TEST] Test email dispatch result:', res);
      window.alert(res.message || 'Đã gửi mail thử (chưa xác nhận được đã gửi qua Airform — hãy kiểm tra hộp thư).');
    });
  };

  const handleUpdatePhotographerEmail = (email: string) => {
    setPhotographerEmail(email);
    localStorage.setItem('yen_photographer_email', email);
  };

  const featuredPhoto = photos.find((p) => p.featured) || photos[0] || INITIAL_PHOTOS[0];
  const unreadLeadsCount = leads.filter((l) => l.status === 'new').length;

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0E0E10] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      {/* Strict 3-zone Top Bar Navigation */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenBooking={() => setIsBookingOpen(true)}
        onOpenAddPhoto={handleOpenAddPhoto}
        onOpenProofing={() => setIsProofingOpen(true)}
        favoritesCount={favoriteIds.length}
        onFilterFavorites={() => setShowingFavoritesOnly(!showingFavoritesOnly)}
        showingFavoritesOnly={showingFavoritesOnly}
        currentView={currentView}
        onToggleView={handleToggleView}
        unreadLeadsCount={unreadLeadsCount}
        userRole={userRole}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
      />

      {syncError && (
        <div className="bg-rose-100 dark:bg-rose-950/60 border-b border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs px-4 py-2 text-center">
          {syncError}{' '}
          <button type="button" onClick={() => setSyncError(null)} className="underline font-semibold">Đã hiểu</button>
        </div>
      )}
      {photosLoading && currentView === 'portfolio' && (
        <div className="bg-neutral-100 dark:bg-neutral-900 text-neutral-500 text-xs px-4 py-2 text-center">Đang tải ảnh...</div>
      )}
      {photosError && currentView === 'portfolio' && (
        <div className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs px-4 py-2 text-center">{photosError}</div>
      )}
      {selectedSeriesId && currentView === 'portfolio' && (
        <div className="bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 text-xs px-4 py-2 text-center">
          Đang xem series: {seriesTitleById[selectedSeriesId] || selectedSeriesId}{' '}
          <button type="button" onClick={() => setSelectedSeriesId(null)} className="underline font-semibold">Xem tất cả ảnh</button>
        </div>
      )}
      {currentView === 'dashboard' ? (
        /* Management Dashboard View (Dasboah) - Strictly protected for Admin */
        userRole === 'admin' ? (
          <DashboardView
            leads={leads}
            onUpdateLeadStatus={handleUpdateLeadStatus}
            onUpdateLead={handleUpdateLead}
            onUpdateLeadNotes={handleUpdateLeadNotes}
            onDeleteLead={handleDeleteLead}
            onAddManualLead={handleAddManualLead}
            emailLogs={emailLogs}
            onSendTestEmail={handleSendTestEmail}
            photographerEmail={photographerEmail}
            onUpdatePhotographerEmail={handleUpdatePhotographerEmail}
            photos={photos}
            onToggleFeaturedPhoto={handleToggleFeaturedPhoto}
            onDeletePhoto={handleDeletePhoto}
            onOpenAddPhoto={handleOpenAddPhoto}
            onExitDashboard={() => setCurrentView('portfolio')}
            onLogoutAdmin={handleLogoutAdmin}
            currentUser={currentUser}
            packagePrices={packagePrices}
            pricingUpdatedAt={pricingUpdatedAt}
            onSavePackagePrices={handleSavePackagePrices}
            isAdmin={userRole === 'admin'}
            siteContent={siteContent}
            contentUpdatedAt={contentUpdatedAt}
            onSaveSiteContent={handleSaveSiteContent}
            onSyncPublicOrders={handleSyncPublicOrders}
            onGoogleLogin={async () => {
              try {
                await loginWithGoogle();
              } catch (e) {
                console.warn('Dashboard Google login:', e);
              }
            }}
          />
        ) : (
          /* Access Restricted Gate for Unauthorized Visitors */
          <div className="flex-1 flex items-center justify-center p-6 text-center py-20">
            <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-[#111115] border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-300 dark:border-amber-800">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold">Khu Vực Quản Trị Nội Bộ</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Trang này chỉ dành cho Nhiếp ảnh gia <strong className="text-neutral-800 dark:text-neutral-200">Anh Yên</strong> quản lý đơn kỉ yếu, áo dài và tư vấn khách hàng. Quý khách hàng vui lòng quay lại xem ảnh hoặc đặt lịch chụp.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminLoginOpen(true)}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Đăng Nhập Quản Trị Viên (Admin)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('portfolio')}
                  className="w-full py-2 px-4 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Quay Lại Trang Xem Ảnh (Khách Hàng)
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        /* Public Client-Facing Portfolio View */
        <>
          <main className="flex-1">
            {/* Split Screen Hero Section */}
            <Hero
              featuredPhoto={featuredPhoto}
              onExploreGallery={() => navigateToSection('gallery')}
              onSelectPhoto={(photo) => setSelectedPhotoForLightbox(photo)}
              onOpenBooking={() => setIsBookingOpen(true)}
              onOpenZaloQr={() => setIsZaloQrOpen(true)}
              content={siteContent}
            />

            {/* Gallery Archive with Multi-Layout & Unboxed Metadata */}
            <Gallery
              photos={displayedPhotos}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setSelectedSeriesId(null);
                setShowingFavoritesOnly(false);
              }}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectPhoto={(photo) => setSelectedPhotoForLightbox(photo)}
              showingFavoritesOnly={showingFavoritesOnly}
              onClearFavoritesFilter={() => setShowingFavoritesOnly(false)}
              isAdmin={userRole === 'admin'}
              onEditPhoto={handleEditPhoto}
              onDeletePhoto={handleRequestDeletePhoto}
              syncStatusByPhotoId={photoSync}
              onRetryPhotoSync={handleRetryPhotoSync}
            />

            {/* Curated Monographs & Exhibitions Series */}
            <SeriesSection onSelectSeries={handleSelectSeries} onOpenBooking={handleOpenBookingForPackage} selectedSeriesId={selectedSeriesId} onClearSeries={() => setSelectedSeriesId(null)} photos={photos} packagePrices={packagePrices} content={siteContent} />

            {/* About the Artist & In My Camera Bag Gear */}
            <AboutSection content={siteContent} />

            {/* Consultation & Studio Contact */}
            <ContactSection onOpenBooking={() => setIsBookingOpen(true)} onOpenZaloQr={() => setIsZaloQrOpen(true)} leads={leads} content={siteContent} />
          </main>

          {/* Minimalist Footer with discreet Admin Entry */}
          <Footer
            isAdmin={userRole === 'admin'}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
            onToggleDashboard={handleToggleView}
            onLogoutAdmin={handleLogoutAdmin}
            content={siteContent}
          />
        </>
      )}

      {/* Lightbox Modal */}
      <LightboxModal
        photo={selectedPhotoForLightbox}
        allPhotos={displayedPhotos}
        onClose={() => setSelectedPhotoForLightbox(null)}
        onNavigate={(photo) => setSelectedPhotoForLightbox(photo)}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        onOpenBooking={() => {
          setSelectedPhotoForLightbox(null);
          setIsBookingOpen(true);
        }}
        isAdmin={userRole === 'admin'}
        onEditPhoto={handleEditPhoto}
        onDeletePhoto={handleRequestDeletePhoto}
      />

      {/* Edit Photo Modal (Admin only) */}
      <EditPhotoModal
        isOpen={Boolean(editingPhoto)}
        photo={editingPhoto}
        onClose={() => setEditingPhoto(null)}
        onSave={handleSaveEditedPhoto}
      />

      {/* Delete Photo Confirmation Modal (Admin only) */}
      <DeletePhotoModal
        isOpen={Boolean(deletingPhoto)}
        photo={deletingPhoto}
        seriesTitle={deletingPhoto?.seriesId ? seriesTitleById[deletingPhoto.seriesId] : undefined}
        onClose={() => setDeletingPhoto(null)}
        onConfirm={handleConfirmDeletePhoto}
      />

      {/* Booking & Consultation Modal (For Clients) */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => { setIsBookingOpen(false); setBookingPackage(undefined); }}
        onBookingSubmitted={handleBookingSubmit}
        photographerEmail={photographerEmail}
        existingLeads={leads}
        initialPackage={bookingPackage}
        packagePrices={packagePrices}
        onOpenZaloQr={() => setIsZaloQrOpen(true)}
      />

      {/* Zalo QR Modal (v7.4: nut "Nhan Zalo" mo modal nay thay vi mo thang zalo.me) */}
      <ZaloQrModal isOpen={isZaloQrOpen} onClose={() => setIsZaloQrOpen(false)} />

      {/* Add Custom Photography Modal (Admin only) */}
      <AddPhotoModal
        isOpen={isAddPhotoOpen}
        onClose={() => setIsAddPhotoOpen(false)}
        onAddPhoto={handleAddCustomPhoto}
      />

      {/* (v7.7) Chip tien do dong bo nen — hien khi co anh dang tai len ngam. */}
      <UploadQueueChip />

      {/* Client Proofing Portal Modal (v6: theo tung don, khong dung anh mau) */}
      <ClientProofingModal
        isOpen={isProofingOpen}
        onClose={() => setIsProofingOpen(false)}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
