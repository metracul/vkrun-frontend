import { useEffect, useMemo, useRef, useState } from 'react';
import bridge from '@vkontakte/vk-bridge';
import { getProfileOverride } from '../shared/profileOverrides';

export type VkProfile = {
  fullName: string;
  avatarUrl?: string;
  linkUrl?: string;     // ← добавлено
  nameSuffix?: string;  // ← добавлено
};

type VkUser = {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
  photo_100?: string;
};

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
 * Загружает профили VK по массиву userIds и возвращает мапу { [id]: VkProfile }.
 * Профили из overrides:
 *  - не запрашиваются у VK
 *  - всегда имеют приоритет поверх VK-данных
 */
export function useVkUsers(userIds: number[], appId?: number) {
  const [map, setMap] = useState<Record<number, VkProfile>>({});
  const tokenRef = useRef<string | null>(null);

  const ids = useMemo(() => uniqueFinite(userIds), [userIds]);

  useEffect(() => {
    if (!ids.length) return;

    // 1) Применяем overrides сразу
    const overridesEntries = ids
      .map((id) => [id, getProfileOverride(id)] as const)
      .filter(([, ov]) => !!ov) as Array<[number, VkProfile]>;

    if (overridesEntries.length) {
      setMap((prev) => {
        const next = { ...prev };
        for (const [id, prof] of overridesEntries) next[id] = prof;
        return next;
      });
    }

    // 2) Если appId не задан — хватит overrides
    if (!appId || Number.isNaN(appId)) {
      if (overridesEntries.length === 0) {
        console.warn('VITE_VK_APP_ID не задан — пропускаю загрузку профилей из VK');
      }
      return;
    }

    // 3) Запрашиваем только те id, которых нет в overrides и ещё нет в map
    const overrideIds = new Set(overridesEntries.map(([id]) => id));
    const missing = ids.filter((id) => !overrideIds.has(id) && !map[id]);
    if (!missing.length) return;

    let cancelled = false;

    (async () => {
      try {
        if (!tokenRef.current) {
          const { access_token } = await bridge.send('VKWebAppGetAuthToken', {
            app_id: appId,
            scope: '',
          });
          tokenRef.current = access_token;
        }

        const access_token = tokenRef.current!;
        const batches = chunk(missing, 100);

        const next: Record<number, VkProfile> = {};

        for (const batch of batches) {
          const resp = await bridge.send('VKWebAppCallAPIMethod', {
            method: 'users.get',
            params: {
              user_ids: batch.join(','),
              fields: 'photo_200,photo_100',
              v: '5.199',
              access_token,
            },
          });

          const users: VkUser[] = resp?.response || [];
          for (const u of users) {
            next[u.id] = {
              fullName: `${u.first_name} ${u.last_name}`.trim(),
              avatarUrl: u.photo_200 || u.photo_100,
              // linkUrl/nameSuffix не задаём — это только из overrides
            };
          }
        }

        if (!cancelled && Object.keys(next).length) {
          setMap((prev) => {
            const merged = { ...prev, ...next };
            // Поверх результата ещё раз «прибьём» overrides, чтобы они точно имели приоритет
            for (const [id, prof] of overridesEntries) merged[id] = prof;
            return merged;
          });
        }
      } catch (e) {
        console.warn('users.get via vk-bridge failed', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, appId]);

  return map;
}
