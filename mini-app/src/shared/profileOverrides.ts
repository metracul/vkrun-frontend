// Единая таблица подмен профилей VK.
// Можно расширять без изменений логики.
export type ProfileOverride = {
  fullName: string;
  avatarUrl?: string;
};

// Ключ — vk user id
export const PROFILE_OVERRIDES: Record<number, ProfileOverride> = {
  9999999: {
    fullName: 'Имя Фамилия', // <-- подставьте нужные значения
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  // 123456: { fullName: '...', avatarUrl: '...' },
};

export function getProfileOverride(id: number): ProfileOverride | undefined {
  return PROFILE_OVERRIDES[id];
}
