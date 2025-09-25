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

// numeric id → screen name
const VK_ID_ALIASES: Record<number, string> = {
  9999999: 'vetercc',
};

const LP = '[useVkUsers]';

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
 * Для id из VK_ID_ALIASES дергает users.get по screen name и
 * кладёт результат под исходным numeric id (напр. 9999999).
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
    const missing = ids.filter((id) => !map[id]);
    if (!missing.length) {
      console.debug(LP, 'skip: no missing ids; all cached');
      return;
    }

    const missingWithAlias = missing.filter((id) => VK_ID_ALIASES[id] != null);
    const missingPlain = missing.filter((id) => VK_ID_ALIASES[id] == null);

    let cancelled = false;
    const startedAt = Date.now();
    console.info(LP, 'start', {
      totalIds: ids.length,
      missing: missing.length,
      missingPlain: missingPlain.length,
      missingWithAlias: missingWithAlias.length,
    });

    (async () => {
      try {
        // 1) токен (кешируем)
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

        // 2) Обычные числовые id — батчами
        if (missingPlain.length) {
          const CHUNK_SIZE = 100;
          const batches = chunk(missingPlain, CHUNK_SIZE);
          console.debug(LP, `plain: ${missingPlain.length} ids in ${batches.length} batch(es)`);
          for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const tLabel = `${LP} plain batch ${i + 1}/${batches.length} (size=${batch.length})`;
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
              const users: VkUser[] = resp?.response || [];
              if (!Array.isArray(users)) {
                console.warn(LP, 'plain: unexpected response shape', resp);
              }
              for (const u of users || []) {
                next[u.id] = {
                  fullName: `${u.first_name} ${u.last_name}`.trim(),
                  avatarUrl: u.photo_200 || u.photo_100,
                };
              }
              if ((users?.length ?? 0) !== batch.length) {
                console.debug(LP, 'plain: count mismatch', {
                  requested: batch.length,
                  received: users?.length ?? 0,
                });
              }
            } catch (e: any) {
              console.warn(LP, 'plain: VKWebAppCallAPIMethod failed', { batchIndex: i, error: e });
            } finally {
              console.timeEnd(tLabel);
            }
          }
        } else {
          console.debug(LP, 'plain: none');
        }

        // 3) Alias — по одному, чтобы не зависеть от domain/screen_name в ответе
        if (missingWithAlias.length) {
          console.debug(LP, `alias: ${missingWithAlias.length} id(s)`);
        }
        for (const numericId of missingWithAlias) {
          const alias = VK_ID_ALIASES[numericId];
          if (!alias) {
            console.warn(LP, 'alias: missing mapping for id', numericId);
            continue;
          }
          const tLabel = `${LP} alias ${numericId} (${alias})`;
          console.time(tLabel);
          try {
            const resp = await bridge.send('VKWebAppCallAPIMethod', {
              method: 'users.get',
              params: {
                user_ids: alias, // screen name
                fields: 'photo_200,photo_100',
                v: '5.199',
                access_token,
              },
            });
            const arr: VkUser[] = Array.isArray(resp?.response) ? resp.response : [];
            if (!arr.length) {
              console.warn(LP, 'alias: empty response', { id: numericId, alias });
            } else {
              const u = arr[0];
              next[numericId] = {
                fullName: `${u.first_name} ${u.last_name}`.trim(),
                avatarUrl: u.photo_200 || u.photo_100,
              };
              console.debug(LP, 'alias: mapped', {
                id: numericId,
                alias,
                fullName: next[numericId].fullName,
                hasAvatar: Boolean(next[numericId].avatarUrl),
              });
            }
          } catch (e: any) {
            console.warn(LP, 'alias: VKWebAppCallAPIMethod failed', { id: numericId, alias, error: e });
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
      } catch (e: any) {
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
