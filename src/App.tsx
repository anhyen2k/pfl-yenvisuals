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
import { BookingModal } from './components/BookingModal';
import { ClientProofingModal } from './components/ClientProofingModal';
import { DashboardView } from './components/DashboardView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Lock } from 'lucide-react';
import { INITIAL_PHOTOS } from './data/portfolioData';
import {
  PhotoItem,
  PhotoCategory,
  filterPhotos,
  BookingInquiry,
  BookingLead,
  BookingStatus,
  EmailNotificationLog,
  INITIAL_LEADS,
  createBookingLead,
  generateEmailNotification,
  sendBookingEmailReal,
  UserRole,
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
  subscribeToPortfolioPhotos,
  logoutUser,
  auth,
  onAuthStateChanged,
  loginWithGoogle,
  type User,
} from './services/firebase';

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
    return localStorage.getItem('yen_photographer_email') || 'anhyenk26@gmail.com';
  });

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
    return INITIAL_LEADS.map((l) => generateEmailNotification(l, 'anhyenk26@gmail.com'));
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
      return saved ? JSON.parse(saved) : ['photo-1', 'photo-4'];
    } catch {
      return ['photo-1', 'photo-4'];
    }
  });

  // User role state: 'guest' (default for clients) vs 'admin' (photographer Anh Yên)
  // Admin chi duoc cap qua Firebase Auth (Google dung email Yen) trong
  // onAuthStateChanged ben duoi. Khong doc co localStorage 'yen_admin_auth'
  // nua, vi co nay truoc day co the duoc dat boi dang nhap PIN da bi go.
  const [userRole, setUserRole] = useState<UserRole>('guest');

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Modal states
  const [selectedPhotoForLightbox, setSelectedPhotoForLightbox] = useState<PhotoItem | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [isProofingOpen, setIsProofingOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<PhotoItem | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);

  // Real-time synchronization of portfolio photos from Cloud Firestore
  useEffect(() => {
    let isMounted = true;
    const unsub = subscribeToPortfolioPhotos((cloudPhotos) => {
      if (!isMounted) return;
      if (cloudPhotos && cloudPhotos.length > 0) {
        setPhotos(cloudPhotos);
        try {
          localStorage.setItem('portfolio_all_photos', JSON.stringify(cloudPhotos));
        } catch {}
      }
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Monitor Firebase Auth state changes
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email?.toLowerCase() === photographerEmail.toLowerCase()) {
        setUserRole('admin');
        try {
          localStorage.setItem('yen_admin_auth', 'true');
          localStorage.setItem('yen_admin_google_email', user.email || '');
        } catch {}
      }
    });
    return () => unsubAuth();
  }, [photographerEmail]);

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
      currentUser.email?.toLowerCase() === photographerEmail.toLowerCase() ||
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
  }, [currentUser, userRole, photographerEmail]);

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
  const displayedPhotos = filterPhotos(
    photos,
    selectedCategory,
    searchQuery,
    showingFavoritesOnly,
    favoriteIds
  );

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleEditPhoto = (photo: PhotoItem) => {
    setEditingPhoto(photo);
  };

  const handleSaveEditedPhoto = (updatedPhoto: PhotoItem) => {
    setPhotos((prev) => {
      const updated = prev.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p));
      localStorage.setItem('portfolio_all_photos', JSON.stringify(updated));
      return updated;
    });

    if (selectedPhotoForLightbox?.id === updatedPhoto.id) {
      setSelectedPhotoForLightbox(updatedPhoto);
    }

    savePhotoToCloud(updatedPhoto).catch((err) => {
      console.warn('Cloud Firestore photo update error:', err);
    });
  };

  const handleRequestDeletePhoto = (photoId: string) => {
    const target = photos.find((p) => p.id === photoId);
    if (target) {
      setDeletingPhoto(target);
    }
  };

  const handleConfirmDeletePhoto = (photoId: string) => {
    setPhotos((prev) => {
      const updated = prev.filter((p) => p.id !== photoId);
      localStorage.setItem('portfolio_all_photos', JSON.stringify(updated));
      return updated;
    });

    if (selectedPhotoForLightbox?.id === photoId) {
      setSelectedPhotoForLightbox(null);
    }

    deletePhotoFromCloud(photoId).catch((err) => {
      console.warn('Cloud Firestore photo delete error:', err);
    });
  };

  const handleAddCustomPhoto = (newPhoto: PhotoItem) => {
    setPhotos((prev) => {
      const updated = [newPhoto, ...prev];
      localStorage.setItem('portfolio_all_photos', JSON.stringify(updated));
      return updated;
    });
    savePhotoToCloud(newPhoto).catch((err) => {
      console.warn('Cloud Firestore photo save error:', err);
    });
    setSelectedCategory('all');
    setShowingFavoritesOnly(false);
  };

  const handleToggleFeaturedPhoto = (photoId: string) => {
    setPhotos((prev) => {
      const updated = prev.map((p) => ({
        ...p,
        featured: p.id === photoId,
      }));
      localStorage.setItem('portfolio_all_photos', JSON.stringify(updated));
      return updated;
    });
    updatePhotoInCloud(photoId, { featured: true }).catch((err) => {
      console.warn('Cloud Firestore photo feature error:', err);
    });
  };

  const handleDeletePhoto = (photoId: string) => {
    handleRequestDeletePhoto(photoId);
  };

  const handleSelectSeries = (seriesId: string) => {
    // Filter gallery by matching series
    const seriesPhoto = photos.find((p) => p.seriesId === seriesId);
    if (seriesPhoto) {
      setSelectedCategory(seriesPhoto.category);
    }
    const element = document.getElementById('gallery');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Lead and Consultation Handlers
  const handleBookingSubmit = (
    inquiry: BookingInquiry,
    existingLead?: BookingLead,
    existingEmailLog?: EmailNotificationLog
  ) => {
    const lead = existingLead || createBookingLead(inquiry, photographerEmail).lead;
    const emailLog = existingEmailLog || generateEmailNotification(lead, photographerEmail);

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
      sendBookingEmailReal(lead, photographerEmail).catch((e) =>
        console.warn('Background email send error', e)
      );
    }
  };

  const handleUpdateLeadStatus = (leadId: string, status: BookingStatus) => {
    setLeads((prev) => {
      const updated = prev.map((l) => (l.id === leadId ? { ...l, status } : l));
      localStorage.setItem('yen_portfolio_leads', JSON.stringify(updated));
      return updated;
    });
    updateLeadStatusInCloud(leadId, status).catch((e) =>
      console.warn('Firestore updateLeadStatus error', e)
    );
  };

  const handleUpdateLeadNotes = (leadId: string, notes: string) => {
    setLeads((prev) => {
      const updated = prev.map((l) => (l.id === leadId ? { ...l, notes } : l));
      localStorage.setItem('yen_portfolio_leads', JSON.stringify(updated));
      return updated;
    });
    // Update notes in Firestore
    saveBookingLeadToCloud({
      ...(leads.find((l) => l.id === leadId) || {}),
      id: leadId,
      notes,
    } as BookingLead).catch((e) => console.warn('Firestore updateNotes error', e));
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
    const lead: BookingLead = {
      ...newLeadData,
      id: `KY-${Date.now().toString().slice(-6)}`,
      createdAt: now,
      emailSentTo: photographerEmail,
      emailSentAt: now,
    };
    const emailLog = generateEmailNotification(lead, photographerEmail);

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
    saveEmailLogToCloud(emailLog).catch((e) =>
      console.warn('Firestore manual email log save error', e)
    );
  };

  const handleSendTestEmail = () => {
    const testLead: BookingLead = {
      id: `TEST-${Date.now().toString().slice(-4)}`,
      clientName: 'Khách Đăng Ký Mẫu (Test Email)',
      phone: '0912 888 266',
      email: 'khachhang.test@gmail.com',
      packageType: 'aodai-solo',
      preferredDate: 'Thứ Bảy tuần này',
      location: 'Đường Phan Đình Phùng, Ba Đình, Hà Nội',
      groupSize: '1 bạn',
      message: 'Đây là email thử nghiệm gửi về hộp thư Anh Yên để kiểm tra hệ thống thông báo form tự động!',
      createdAt: new Date().toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      status: 'new',
      notes: 'Email kiểm tra hệ thống hoạt động tốt.',
      source: 'web_form',
      estimatedPrice: 650000,
      emailSentTo: photographerEmail,
      emailSentAt: new Date().toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    };
    const testEmail = generateEmailNotification(testLead, photographerEmail);
    setEmailLogs((prev) => {
      const updated = [testEmail, ...prev];
      localStorage.setItem('yen_email_logs', JSON.stringify(updated));
      return updated;
    });

    // Real HTTP dispatch to FormSubmit for Anhyenk26@gmail.com activation
    sendBookingEmailReal(testLead, photographerEmail).then((res) => {
      console.log('Test email dispatch result:', res);
    });
  };

  const handleUpdatePhotographerEmail = (email: string) => {
    setPhotographerEmail(email);
    localStorage.setItem('yen_photographer_email', email);
  };

  const featuredPhoto = photos.find((p) => p.featured) || photos[0];
  const unreadLeadsCount = leads.filter((l) => l.status === 'new').length;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
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

      {currentView === 'dashboard' ? (
        /* Management Dashboard View (Dasboah) - Strictly protected for Admin */
        userRole === 'admin' ? (
          <DashboardView
            leads={leads}
            onUpdateLeadStatus={handleUpdateLeadStatus}
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
            <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-[#111115] border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
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
              onExploreGallery={() => {
                const el = document.getElementById('gallery');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onSelectPhoto={(photo) => setSelectedPhotoForLightbox(photo)}
              onOpenBooking={() => setIsBookingOpen(true)}
            />

            {/* Gallery Archive with Multi-Layout & Unboxed Metadata */}
            <Gallery
              photos={displayedPhotos}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
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
            />

            {/* Curated Monographs & Exhibitions Series */}
            <SeriesSection onSelectSeries={handleSelectSeries} />

            {/* About the Artist & In My Camera Bag Gear */}
            <AboutSection />

            {/* Consultation & Studio Contact */}
            <ContactSection onOpenBooking={() => setIsBookingOpen(true)} />
          </main>

          {/* Minimalist Footer with discreet Admin Entry */}
          <Footer
            isAdmin={userRole === 'admin'}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
            onToggleDashboard={handleToggleView}
            onLogoutAdmin={handleLogoutAdmin}
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
        onClose={() => setDeletingPhoto(null)}
        onConfirm={handleConfirmDeletePhoto}
      />

      {/* Booking & Consultation Modal (For Clients) */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBookingSubmitted={handleBookingSubmit}
        photographerEmail={photographerEmail}
      />

      {/* Add Custom Photography Modal (Admin only) */}
      <AddPhotoModal
        isOpen={isAddPhotoOpen}
        onClose={() => setIsAddPhotoOpen(false)}
        onAddPhoto={handleAddCustomPhoto}
      />

      {/* Client Proofing Portal Modal */}
      <ClientProofingModal
        isOpen={isProofingOpen}
        onClose={() => setIsProofingOpen(false)}
        samplePhotos={photos}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        photographerEmail={photographerEmail}
      />
    </div>
  );
}
