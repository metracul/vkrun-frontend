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

const LP = '[useVkUsers]';

/**
 * Мапа «подменённых» id → реальный numeric id VK.
 * 9999999 должен отображаться как профиль vetercc (реальный id = 149873351).
 */
const VK_ID_NUMERIC_MAP: Record<number, number> = {
  9999999: 149873351,
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
 * Загружает профили VK и возвращает { [id]: { fullName, avatarUrl } }.
 * Для id из VK_ID_NUMERIC_MAP запрос делает по реальному numeric id,
 * а результат кладёт под «подменённым» id.
 */
export function useVkUsers(userIds: number[], appId: number | undefined) {
  const [map, setMap] = useState<Record<number, VkProfile>>({});
  const tokenRef = useRef<string | null>(null);

  const ids = useMemo(() => uniqueFinite(userIds), [userIds]);

  useEffect(() => {
    if (!ids.length) {
      console.debug(LP, 'skip: no ids');
      return;
    }
    if (!appId || Number.isNaN(appId)) {
      console.warn(LP, 'skip: appId is not set or NaN');
      return;
    }

    // какие id ещё не загружены
    const missingClientIds = ids.filter((id) => !map[id]);
    if (!missingClientIds.length) {
      console.debug(LP, 'skip: no missing ids; all cached');
      return;
    }

    // Разворачиваем: clientId -> realId (если есть подмена), иначе realId = clientId
    const resolveRealId = (clientId: number) => VK_ID_NUMERIC_MAP[clientId] ?? clientId;

    // Группируем по realId, чтобы не дублировать запросы
    const realIdSet = new Set<number>();
    for (const cid of missingClientIds) realIdSet.add(resolveRealId(cid));
    const missingRealIds = Array.from(realIdSet.values());

    // Нужна обратная мапа realId -> какие clientIds её используют
    const realToClient = new Map<number, number[]>();
    for (const cid of missingClientIds) {
      const rid = resolveRealId(cid);
      const arr = realToClient.get(rid) ?? [];
      arr.push(cid);
      realToClient.set(rid, arr);
    }

    let cancelled = false;
    const startedAt = Date.now();
    console.info(LP, 'start', {
      totalIds: ids.length,
      missingClientIds: missingClientIds.length,
      uniqueRealIds: missingRealIds.length,
    });

    (async () => {
      try {
        // токен
        if (!tokenRef.current) {
          console.debug(LP, 'auth: requesting token');
          const { access_token } = await bridge.send('VKWebAppGetAuthToken', {
            app_id: appId,
            scope: '',
          });
          tokenRef.current = access_token;
          console.debug(LP, 'auth: token acquired');
        } else {
          console.debug(LP, 'auth: token from cache');
        }
        const access_token = tokenRef.current!;
        const nextByRealId = new Map<number, VkProfile>();

        // users.get по realId — батчами
        const CHUNK_SIZE = 100;
        const batches = chunk(missingRealIds, CHUNK_SIZE);
        console.debug(LP, `fetch: ${missingRealIds.length} real id(s) in ${batches.length} batch(es)`);

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          const tLabel = `${LP} batch ${i + 1}/${batches.length} (size=${batch.length})`;
          console.time(tLabel);
          try {
            const resp = await bridge.send('VKWebAppCallAPIMethod', {
              method: 'users.get',
              params: {
                user_ids: batch.join(','), // только numeric id
                fields: 'photo_200,photo_100',
                v: '5.199',
                access_token,
              },
            });
            const users: VkUser[] = Array.isArray(resp?.response) ? resp.response : [];
            if (!users.length) {
              console.warn(LP, 'batch empty response', { batchSize: batch.length, batch });
            }
            for (const u of users) {
              nextByRealId.set(u.id, {
                fullName: `${u.first_name} ${u.last_name}`.trim(),
                avatarUrl: u.photo_200 || u.photo_100,
              });
            }
            if (users.length !== batch.length) {
              console.debug(LP, 'count mismatch', { requested: batch.length, received: users.length });
            }
          } catch (e) {
            console.warn(LP, 'VKWebAppCallAPIMethod failed for batch', { batchIndex: i, error: e });
          } finally {
            console.timeEnd(tLabel);
          }
        }

        // Перекладываем profili realId → во все соответствующие clientId
        const next: Record<number, VkProfile> = {};
        for (const [realId, clientIds] of realToClient.entries()) {
          const prof = nextByRealId.get(realId);
          if (!prof) {
            console.warn(LP, 'no profile for realId', { realId, clientIds });
            continue;
          }
          for (const cid of clientIds) {
            next[cid] = prof;
            // Лог отдельно для «подменённых» id
            if (VK_ID_NUMERIC_MAP[cid]) {
              console.debug(LP, 'alias mapped', { clientId: cid, realId, fullName: prof.fullName, hasAvatar: !!prof.avatarUrl });
            }
          }
        }

        if (!cancelled && Object.keys(next).length) {
          const toUpdate = Object.keys(next).length;
          console.debug(LP, 'state: updating', { count: toUpdate });
          setMap((prev) => {
            const merged = { ...prev, ...next };
            console.info(LP, 'state: updated', {
              added: toUpdate,
              total: Object.keys(merged).length,
              tookMs: Date.now() - startedAt,
            });
            return merged;
          });
        } else if (!cancelled) {
          console.debug(LP, 'state: nothing to update', { tookMs: Date.now() - startedAt });
        }
      } catch (e) {
        console.warn(LP, 'top-level error', e);
      } finally {
        if (cancelled) {
          console.debug(LP, 'effect cancelled', { tookMs: Date.now() - startedAt });
        }
      }
    })();

    return () => { cancelled = true; };
    // map преднамеренно не добавляем
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, appId]);

  return map;
}
