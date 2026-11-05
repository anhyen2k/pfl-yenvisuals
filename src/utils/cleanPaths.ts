// Clean paths cho web 1 trang dài — KHÔNG dùng react-router, không thêm dependency.
// GitHub Pages (project site): web nằm ở /pfl-yenvisuals/ nên mọi đường dẫn
// sạch đều có tiền tố base đó, vd /pfl-yenvisuals/ve-toi. import.meta.env.BASE_URL
// là '/pfl-yenvisuals/' (từ vite.config.ts). Vercel dùng base '/' nên cùng code
// này chạy được cả 2 nơi, chỉ khác APP_BASE.
// Khi load trực tiếp /pfl-yenvisuals/ve-toi, Pages trả 404.html; file đó lưu
// đường dẫn vào ?/... rồi redirect về index, script trong index.html khôi
// phục lại đường dẫn rồi App cuộn tới đúng mục. F5 không trắng trang.
// Link cũ dạng #about vẫn chạy: App sẽ đổi nó thành /ve-toi khi load.
export const APP_BASE: string = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');

/** Ghép tiền tố base: withBase('/ve-toi') -> '/pfl-yenvisuals/ve-toi'. */
export function withBase(path: string): string {
  return APP_BASE + path;
}

/** Bỏ tiền tố base để so khớp route: '/pfl-yenvisuals/ve-toi' -> '/ve-toi'. */
export function stripBase(path: string): string {
  if (APP_BASE && path.startsWith(APP_BASE)) {
    const rest = path.slice(APP_BASE.length);
    return rest === '' ? '/' : rest;
  }
  return path;
}

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
  const stripped = stripBase(path || '');
  if (!stripped || stripped === '/') return '/';
  const cleaned = stripped.replace(/\/+$/, '');
  return cleaned === '' ? '/' : cleaned.toLowerCase();
}

export function sectionIdForPath(path: string): string | null {
  return PATH_SECTIONS[normalizePath(path)] ?? null;
}

export function pathForSectionId(sectionId: string): string {
  return withBase(SECTION_PATHS[sectionId] ?? '/');
}

export function pathForHash(hash: string): string | null {
  const id = hash.replace(/^#/, '');
  if (id === '') return withBase('/');
  if (id in SECTION_PATHS) return withBase(SECTION_PATHS[id]);
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
  const home = withBase('/');
  if (window.location.pathname !== home) {
    window.history.pushState(null, '', home);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
