// Cau hinh chung duy nhat cho Yen Photo — chi lam o Ha Noi.
// Doi email / SDT o day thi doi o 1 cho, khong can sua rac khap code.
export const SITE_CONFIG = {
  photographerName: 'Anh Yên',
  photographerEmail: 'anhyenk26@gmail.com',
  phone: '0961230500',
  phoneDisplay: '0961 230 500',
  zaloUrl: 'https://zalo.me/0961230500',
  city: 'Hà Nội',
  siteUrl: 'https://anhyen2k.github.io/pfl-yenvisuals/',
  brandName: 'Yên Photo',
} as const;

// Email quan tri duy nhat duoc vao Dashboard — co dinh, khong lay tu
// email nhan don (photographerEmail, sua duoc trong Dashboard Settings).
export const ADMIN_EMAIL = 'anhyenk26@gmail.com';

export function generateZaloUrl(phone: string): string {
  return `https://zalo.me/${phone.replace(/[^0-9]/g, '')}`;
}
