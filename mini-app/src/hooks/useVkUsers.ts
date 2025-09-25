import { useEffect, useMemo, useRef, useState } from 'react';
import bridge from '@vkontakte/vk-bridge';

type VkUser = {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
  photo_100?: string;
  domain?: string;
};

export type VkProfile = { fullName: string; avatarUrl?: string };

// alias: какой numeric id подменяем на какой screen name
const VK_ID_ALIASES: Record<number, string> = {
  9999999: 'vetercc',
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
 * Загружает профили VK по массиву userIds и возвращает мапу { [id]: { fullName, avatarUrl } }.
 * Требует appId. Токен запрашивается один раз и кешируется внутри хука.
 * Для id из VK_ID_ALIASES выполняется запрос users.get по screen name и
 * результат сохраняется под исходным numeric id.
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

    // какие id ещё не загружены
    const missing = ids.filter((id) => !map[id]);
    if (!missing.length) return;

    // делим на обычные numeric id и id с alias
    const missingWithAlias = missing.filter((id) => VK_ID_ALIASES[id] != null);
    const missingPlain = missing.filter((id) => VK_ID_ALIASES[id] == null);

    let cancelled = false;

    (async () => {
      try {
        // 1) токен (кешируем)
        if (!tokenRef.current) {
          const { access_token } = await bridge.send('VKWebAppGetAuthToken', {
            app_id: appId,
            scope: '',
          });
          tokenRef.current = access_token;
        }
        const access_token = tokenRef.current!;

        const next: Record<number, VkProfile> = {};

        // 2) users.get для обычных числовых id
        if (missingPlain.length) {
          const CHUNK_SIZE = 100;
          const batches = chunk(missingPlain, CHUNK_SIZE);
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
              };
            }
          }
        }

        // 3) users.get для alias (screen name), мапим обратно на numeric id
        if (missingWithAlias.length) {
          const aliases = Array.from(
            new Set(missingWithAlias.map((id) => VK_ID_ALIASES[id]).filter(Boolean) as string[])
          );
          if (aliases.length) {
            const CHUNK_SIZE = 100;
            const batches = chunk(aliases, CHUNK_SIZE);
            for (const batch of batches) {
              const resp = await bridge.send('VKWebAppCallAPIMethod', {
                method: 'users.get',
                params: {
                  user_ids: batch.join(','), // screen names
                  fields: 'photo_200,photo_100,domain',
                  v: '5.199',
                  access_token,
                },
              });
              const users: VkUser[] = resp?.response || [];

              // строим domain → профиль
              const byDomain = new Map<string, VkProfile>();
              for (const u of users) {
                const prof: VkProfile = {
                  fullName: `${u.first_name} ${u.last_name}`.trim(),
                  avatarUrl: u.photo_200 || u.photo_100,
                };
                if (u.domain) byDomain.set(u.domain.toLowerCase(), prof);
              }

              // записываем под исходными numeric id
              for (const numericId of missingWithAlias) {
                const alias = VK_ID_ALIASES[numericId];
                if (!alias) continue;
                const prof = byDomain.get(alias.toLowerCase());
                if (prof) next[numericId] = prof;
              }
            }
          }
        }

        if (!cancelled && Object.keys(next).length) {
          setMap((prev) => ({ ...prev, ...next }));
        }
      } catch (e) {
        console.warn('users.get via vk-bridge failed', e);
      }
    })();

    return () => { cancelled = true; };
    // map преднамеренно не добавляем
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, appId]);

  return map;
}
