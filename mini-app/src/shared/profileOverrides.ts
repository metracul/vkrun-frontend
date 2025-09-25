// src/shared/profileOverrides.ts
// Единая таблица подмен профилей VK.

export type ProfileOverride = {
  fullName: string;
  avatarUrl?: string;
  linkUrl?: string;
  nameSuffix?: string;
};

// импорт локального изображения (Vite вернёт URL-строку)
import veterccAvatar from '../assets/logos/vetercc.jpg';
import skuratovAvatar from '../assets/logos/skuratov.jpg';

// Ключ — vk user id
export const PROFILE_OVERRIDES: Record<number, ProfileOverride> = {
  9999999: {
    fullName: 'Veter.cс',      
    avatarUrl: veterccAvatar,      
    linkUrl: 'https://vk.com/vetercc',
    nameSuffix: 'Форма для велоспорта, бега и триатлона',
  },
  99999991: {
    fullName: 'Skuratov Coffee',      
    avatarUrl: skuratovAvatar,      
    linkUrl: 'https://t.me/skuratovrunclubspb',
  },
};

export function getProfileOverride(id: number): ProfileOverride | undefined {
  return PROFILE_OVERRIDES[id];
}
