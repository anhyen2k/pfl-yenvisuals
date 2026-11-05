// Clean paths cho web 1 trang dài — KHÔNG dùng react-router, không thêm dependency.
// GitHub Pages cần file 404.html vì hosting tĩnh không hiểu /ve-toi; Vercel thì
// vercel.json đã rewrite mọi đường dẫn về /index.html nên /ve-toi load thẳng được.
// Link cũ dạng #about vẫn chạy: App sẽ đổi nó thành /ve-toi khi load.
export const SECTION_PATHS: Record<string, string> = {
  gallery: '/tac-pham',
  series: '/bo-suu-tap',
  about: '/ve-toi',
  contact: '/lien-he',
};

export const PATH_SECTIONS: Record<string, string> = {
  '/tac-pham': 'gallery',
  '/bo-suu-tap': 'series',
  '/ve-toi': 'about',
  '/lien-he': 'contact',
};

export const BOOKING_PATH = '/dat-lich';

export function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  const cleaned = path.replace(/\/+$/, '');
  return cleaned === '' ? '/' : cleaned.toLowerCase();
}

export function sectionIdForPath(path: string): string | null {
  return PATH_SECTIONS[normalizePath(path)] ?? null;
}

export function pathForSectionId(sectionId: string): string {
  return SECTION_PATHS[sectionId] ?? '/';
}

export function pathForHash(hash: string): string | null {
  const id = hash.replace(/^#/, '');
  if (id === '') return '/';
  if (id in SECTION_PATHS) return SECTION_PATHS[id];
  return null;
}

/** Ma anh tu link chia se dang #photo-<id> (Lightbox copy link). */
export function photoIdForHash(hash: string): string | null {
  const id = hash.replace(/^#/, '');
  if (id.startsWith('photo-')) return id;
  return null;
}

export function scrollToSectionId(sectionId: string, behavior: ScrollBehavior = 'smooth'): boolean {
  const el = document.getElementById(sectionId);
  if (!el) return false;
  el.scrollIntoView({ behavior, block: 'start' });
  return true;
}

/** Đổi URL bằng history.pushState rồi cuộn tới mục — không reload trang. */
export function navigateToSection(sectionId: string): void {
  const path = pathForSectionId(sectionId);
  if (window.location.pathname !== path) {
    window.history.pushState(null, '', path);
  }
  // Cuộn sau 1 nhịp render để chắc section đã có trong DOM.
  requestAnimationFrame(() => {
    if (!scrollToSectionId(sectionId)) {
      window.setTimeout(() => scrollToSectionId(sectionId), 150);
    }
  });
}

export function navigateHome(): void {
  if (window.location.pathname !== '/') {
    window.history.pushState(null, '', '/');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
