// Единая таблица подмен профилей VK.
// Можно расширять без изменений логики.
export type ProfileOverride = {
  fullName: string;
  avatarUrl?: string;
};

import veterccAvatar from '../assets/logos/vetercc.jpg';

// Ключ — vk user id
export const PROFILE_OVERRIDES: Record<number, ProfileOverride> = {
  9999999: {
    fullName: 'Veter.cc',
    avatarUrl: veterccAvatar,
  },
};

export function getProfileOverride(id: number): ProfileOverride | undefined {
  return PROFILE_OVERRIDES[id];
}
