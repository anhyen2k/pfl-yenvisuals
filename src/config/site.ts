// Cau hinh chung duy nhat cho Yen Visuals — chi lam o Ha Noi.
// Doi email / SDT o day thi doi o 1 cho, khong can sua rac khap code.
export const SITE_CONFIG = {
  photographerName: 'Anh Yên',
  photographerEmail: 'anhyenk26@gmail.com',
  phone: '0912888266',
  phoneDisplay: '0912 888 266',
  zaloUrl: 'https://zalo.me/0912888266',
  city: 'Hà Nội',
  siteUrl: 'https://anhyen2k.github.io/pfl-yenvisuals/',
} as const;

export function generateZaloUrl(phone: string): string {
  return `https://zalo.me/${phone.replace(/[^0-9]/g, '')}`;
}
