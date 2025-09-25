import { useEffect, useMemo, useRef, useState } from 'react';
import bridge from '@vkontakte/vk-bridge';

type VkUser = {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
  photo_100?: string;
};

type VkGroup = {
  id: number;
  name: string;
  photo_200?: string;
  photo_100?: string;
  screen_name?: string;
};

export type VkProfile = { fullName: string; avatarUrl?: string };

const LP = '[useVkUsers]';

/**
 * Карта «подменённых» id → реальный numeric id пользователя VK (если нужно).
 * Сейчас пусто; оставлено на будущее.
 */
const VK_ID_NUMERIC_MAP: Record<number, number> = {
  // пример: 1234567: 42,
};

/**
 * Карта «подменённых» id → alias сообщества (screen name).
 * Требование: 9999999 должен отображаться как сообщество https://vk.com/vetercc
 */
const VK_ID_GROUP_ALIAS: Record<number, string> = {
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
 * Загружает профили VK и возвращает { [clientId]: { fullName, avatarUrl } }.
 * - Обычные id → users.get
 * - clientId из VK_ID_NUMERIC_MAP → users.get(realId), кладём под clientId
 * - clientId из VK_ID_GROUP_ALIAS → groups.getById(alias), кладём под clientId
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

    // какие clientId ещё не загружены
    const missingClientIds = ids.filter((id) => !map[id]);
    if (!missingClientIds.length) {
      console.debug(LP, 'skip: no missing ids; all cached');
      return;
    }

    // раскладываем по типам
    const missingUserNumeric: number[] = [];
    const missingGroupAlias: number[] = [];
    const missingPlainUser: number[] = [];

    for (const cid of missingClientIds) {
      if (VK_ID_GROUP_ALIAS[cid]) {
        missingGroupAlias.push(cid);
      } else if (VK_ID_NUMERIC_MAP[cid]) {
        missingUserNumeric.push(cid);
      } else {
        missingPlainUser.push(cid);
      }
    }

    // готовим realId-набор для user-запросов
    const realToClient = new Map<number, number[]>();
    const realIds: number[] = [];
    const addMap = (cid: number, rid: number) => {
      const arr = realToClient.get(rid) ?? [];
      arr.push(cid);
      realToClient.set(rid, arr);
    };

    // plain → realId = clientId
    for (const cid of missingPlainUser) {
      addMap(cid, cid);
      realIds.push(cid);
    }
    // numeric map → realId = VK_ID_NUMERIC_MAP[cid]
    for (const cid of missingUserNumeric) {
      const rid = VK_ID_NUMERIC_MAP[cid]!;
      addMap(cid, rid);
      realIds.push(rid);
    }

    // убираем дубликаты realIds
    const uniqueRealIds = Array.from(new Set(realIds));

    let cancelled = false;
    const startedAt = Date.now();
    console.info(LP, 'start', {
      totalIds: ids.length,
      missing: missingClientIds.length,
      usersPlain: missingPlainUser.length,
      usersNumericMap: missingUserNumeric.length,
      groupsAlias: missingGroupAlias.length,
      uniqueUserRealIds: uniqueRealIds.length,
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
        const next: Record<number, VkProfile> = {};

        // === 1) users.get по numeric realIds (батчи) ===
        if (uniqueRealIds.length) {
          const batches = chunk(uniqueRealIds, 100);
          console.debug(LP, `users.get: ${uniqueRealIds.length} real id(s) in ${batches.length} batch(es)`);
          for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const tLabel = `${LP} users batch ${i + 1}/${batches.length} (size=${batch.length})`;
            console.time(tLabel);
            try {
              const resp = await bridge.send('VKWebAppCallAPIMethod', {
                method: 'users.get',
                params: {
                  user_ids: batch.join(','), // только numeric
                  fields: 'photo_200,photo_100',
                  v: '5.199',
                  access_token,
                },
              });
              const users: VkUser[] = Array.isArray(resp?.response) ? resp.response : [];
              if (!users.length) {
                console.warn(LP, 'users.get empty response', { batch });
              }
              // realId -> профиль
              const profByReal = new Map<number, VkProfile>();
              for (const u of users) {
                profByReal.set(u.id, {
                  fullName: `${u.first_name} ${u.last_name}`.trim(),
                  avatarUrl: u.photo_200 || u.photo_100,
                });
              }
              // размножаем на clientId
              for (const rid of batch) {
                const prof = profByReal.get(rid);
                const cids = realToClient.get(rid) ?? [];
                if (!prof) {
                  if (cids.length) console.warn(LP, 'users.get: no profile for realId', { rid, clientIds: cids });
                  continue;
                }
                for (const cid of cids) {
                  next[cid] = prof;
                }
              }
            } catch (e) {
              console.warn(LP, 'users.get failed for batch', { batchIndex: i, error: e });
            } finally {
              console.timeEnd(tLabel);
            }
          }
        }

        // === 2) groups.getById по alias — по одному (устойчиво к порядку/полям) ===
        for (const cid of missingGroupAlias) {
          const alias = VK_ID_GROUP_ALIAS[cid];
          const tLabel = `${LP} group ${cid} (${alias})`;
          console.time(tLabel);
          try {
            const resp = await bridge.send('VKWebAppCallAPIMethod', {
              method: 'groups.getById',
              params: {
                group_ids: alias,               // screen name сообщества
                fields: 'photo_200,photo_100',  // фото
                v: '5.199',
                access_token,
              },
            });
            const arr: VkGroup[] = Array.isArray(resp?.response) ? resp.response : [];
            if (!arr.length) {
              console.warn(LP, 'groups.getById: empty response', { clientId: cid, alias });
            } else {
              const g = arr[0];
              next[cid] = {
                fullName: g.name,
                avatarUrl: g.photo_200 || g.photo_100,
              };
              console.debug(LP, 'group mapped', {
                clientId: cid,
                alias,
                name: g.name,
                hasAvatar: !!(g.photo_200 || g.photo_100),
              });
            }
          } catch (e) {
            console.warn(LP, 'groups.getById failed', { clientId: cid, alias, error: e });
          } finally {
            console.timeEnd(tLabel);
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
      }
    })();

    return () => { /* отмена эффекта */ };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, appId]);

  return map;
}
