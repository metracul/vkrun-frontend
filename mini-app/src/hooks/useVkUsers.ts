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
};

export type VkProfile = { fullName: string; avatarUrl?: string };

const LP = '[useVkUsers]';

/** clientId → реальный numeric id пользователя (на будущее, сейчас не используется) */
const VK_ID_NUMERIC_MAP: Record<number, number> = {
  // пример: 1234567: 42,
};

/** clientId → alias сообщества */
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

/** resolve screen name → { type, object_id } */
async function resolveScreenName(alias: string, access_token: string) {
  try {
    const resp = await bridge.send('VKWebAppCallAPIMethod', {
      method: 'utils.resolveScreenName',
      params: {
        screen_name: alias,
        v: '5.199',
        access_token,
      },
    });
    const obj = resp?.response;
    if (!obj) return null;
    return { type: obj.type as string, object_id: Number(obj.object_id) };
  } catch (e) {
    console.warn(LP, 'utils.resolveScreenName failed', { alias, error: e });
    return null;
  }
}

/**
 * Загружает профили VK и возвращает { [clientId]: { fullName, avatarUrl } }.
 * - Обычные id → users.get
 * - clientId из VK_ID_NUMERIC_MAP → users.get(realId), результат кладём под clientId
 * - clientId из VK_ID_GROUP_ALIAS → utils.resolveScreenName → groups.getById(group_id=numeric), кладём под clientId
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

    const missingClientIds = ids.filter((id) => !map[id]);
    if (!missingClientIds.length) {
      console.debug(LP, 'skip: no missing ids; all cached');
      return;
    }

    const missingGroupAlias: number[] = [];
    const missingUserNumericMap: number[] = [];
    const missingPlainUser: number[] = [];

    for (const cid of missingClientIds) {
      if (VK_ID_GROUP_ALIAS[cid]) missingGroupAlias.push(cid);
      else if (VK_ID_NUMERIC_MAP[cid]) missingUserNumericMap.push(cid);
      else missingPlainUser.push(cid);
    }

    const realToClient = new Map<number, number[]>();
    const realIds: number[] = [];
    const addMap = (cid: number, rid: number) => {
      const arr = realToClient.get(rid) ?? [];
      arr.push(cid);
      realToClient.set(rid, arr);
    };

    for (const cid of missingPlainUser) { addMap(cid, cid); realIds.push(cid); }
    for (const cid of missingUserNumericMap) { const rid = VK_ID_NUMERIC_MAP[cid]!; addMap(cid, rid); realIds.push(rid); }

    const uniqueRealIds = Array.from(new Set(realIds));

    const startedAt = Date.now();
    console.info(LP, 'start', {
      totalIds: ids.length,
      missing: missingClientIds.length,
      usersPlain: missingPlainUser.length,
      usersNumericMap: missingUserNumericMap.length,
      groupsAlias: missingGroupAlias.length,
      uniqueUserRealIds: uniqueRealIds.length,
    });

    (async () => {
      try {
        if (!tokenRef.current) {
          console.debug(LP, 'auth: requesting token');
          const { access_token } = await bridge.send('VKWebAppGetAuthToken', { app_id: appId, scope: '' });
          tokenRef.current = access_token;
          console.debug(LP, 'auth: token acquired');
        } else {
          console.debug(LP, 'auth: token from cache');
        }
        const access_token = tokenRef.current!;
        const next: Record<number, VkProfile> = {};

        // === users.get для numeric realIds
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
                  user_ids: batch.join(','),
                  fields: 'photo_200,photo_100',
                  v: '5.199',
                  access_token,
                },
              });
              const users: VkUser[] = Array.isArray(resp?.response) ? resp.response : [];
              const profByReal = new Map<number, VkProfile>();
              for (const u of users) {
                profByReal.set(u.id, {
                  fullName: `${u.first_name} ${u.last_name}`.trim(),
                  avatarUrl: u.photo_200 || u.photo_100,
                });
              }
              for (const rid of batch) {
                const prof = profByReal.get(rid);
                const cids = realToClient.get(rid) ?? [];
                if (!prof) {
                  if (cids.length) console.warn(LP, 'users.get: no profile for realId', { rid, clientIds: cids });
                  continue;
                }
                for (const cid of cids) next[cid] = prof;
              }
            } catch (e) {
              console.warn(LP, 'users.get failed for batch', { batchIndex: i, error: e });
            } finally {
              console.timeEnd(tLabel);
            }
          }
        }

        // === groups.getById для alias: resolve → getById(group_id=numeric)
        for (const cid of missingGroupAlias) {
          const alias = VK_ID_GROUP_ALIAS[cid];
          const tLabel = `${LP} group ${cid} (${alias})`;
          console.time(tLabel);
          try {
            // 1) resolve alias
            const resolved = await resolveScreenName(alias, access_token);
            if (!resolved) {
              console.warn(LP, 'resolve: empty', { clientId: cid, alias });
              continue;
            }
            if (!['group', 'page', 'public'].includes(resolved.type)) {
              console.warn(LP, 'resolve: not a group/page', resolved);
              continue;
            }
            const groupId = resolved.object_id;
            if (!Number.isFinite(groupId)) {
              console.warn(LP, 'resolve: invalid object_id', resolved);
              continue;
            }
            // 2) get group by numeric id
            const resp = await bridge.send('VKWebAppCallAPIMethod', {
              method: 'groups.getById',
              params: {
                group_id: String(groupId),       // ВАЖНО: numeric id
                fields: 'photo_200,photo_100',
                v: '5.199',
                access_token,
              },
            });
            const arr: VkGroup[] = Array.isArray(resp?.response) ? resp.response : [];
            if (!arr.length) {
              console.warn(LP, 'groups.getById: empty response AFTER resolve', { clientId: cid, alias, groupId });
            } else {
              const g = arr[0];
              next[cid] = {
                fullName: g.name,
                avatarUrl: g.photo_200 || g.photo_100,
              };
              console.debug(LP, 'group mapped', { clientId: cid, alias, groupId, name: g.name, hasAvatar: !!(g.photo_200 || g.photo_100) });
            }
          } catch (e) {
            console.warn(LP, 'groups.getById flow failed', { clientId: cid, alias, error: e });
          } finally {
            console.timeEnd(tLabel);
          }
        }

        if (Object.keys(next).length) {
          setMap((prev) => ({ ...prev, ...next }));
          console.info(LP, 'state: updated', { added: Object.keys(next).length, total: Object.keys({ ...map, ...next }).length, tookMs: Date.now() - startedAt });
        } else {
          console.debug(LP, 'state: nothing to update', { tookMs: Date.now() - startedAt });
        }
      } catch (e) {
        console.warn(LP, 'top-level error', e);
      }
    })();

    return () => { /* no-op */ };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, appId]);

  return map;
}
