import { useEffect, useMemo, useRef, useState } from 'react';
import bridge from '@vkontakte/vk-bridge';

type VkUser = {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
  photo_100?: string;
};

export type VkProfile = { fullName: string; avatarUrl?: string };

function uniqueFinite(ids: number[]) {
  const set = new Set<number>();
  for (const id of ids) if (Number.isFinite(id)) set.add(id);
  return Array.from(set.values());
}

function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Загружает профили VK по массиву userIds и возвращает мапу { [id]: { fullName, avatarUrl } }.
 * Требует appId. Токен запрашивается один раз и кешируется внутри хука.
 */
export function useVkUsers(userIds: number[], appId: number | undefined) {
  const [map, setMap] = useState<Record<number, VkProfile>>({});
  const tokenRef = useRef<string | null>(null);

  const ids = useMemo(() => uniqueFinite(userIds), [userIds]);

  useEffect(() => {
    if (!ids.length) return;
    if (!appId || Number.isNaN(appId)) {
      console.warn('VITE_VK_APP_ID не задан — пропускаю загрузку профилей');
      return;
    }

    const missing = ids.filter((id) => !map[id]);
    if (!missing.length) return;

    let cancelled = false;

    (async () => {
      try {
        // 1) токен (кешируем, чтобы не спрашивать каждый раз)
        if (!tokenRef.current) {
          const { access_token } = await bridge.send('VKWebAppGetAuthToken', {
            app_id: appId,
            scope: '' // для users.get обычно пусто
          });
          tokenRef.current = access_token;
        }

        const access_token = tokenRef.current!;
        // 2) users.get батчами (консервативно по 100 id на запрос)
        const CHUNK_SIZE = 100; // если id много, можно увеличить, но лимиты уточняй в док-ментации
        const batches = chunk(missing, CHUNK_SIZE);

        const next: Record<number, VkProfile> = {};

        for (const batch of batches) {
          const resp = await bridge.send('VKWebAppCallAPIMethod', {
            method: 'users.get',
            params: {
              user_ids: batch.join(','),
              fields: 'photo_200,photo_100',
              v: '5.199',
              access_token
            }
          });

          const users: VkUser[] = resp?.response || [];
          for (const u of users) {
            next[u.id] = {
              fullName: `${u.first_name} ${u.last_name}`.trim(),
              avatarUrl: u.photo_200 || u.photo_100
            };
          }
        }

        if (!cancelled && Object.keys(next).length) {
          setMap((prev) => ({ ...prev, ...next }));
        }
      } catch (e) {
        // Не роняем UI — останутся плейсхолдеры
        console.warn('users.get via vk-bridge failed', e);
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, appId]); // map нарочно не добавляем, чтобы не зациклить

  return map;
}
