// src/hooks/useVkUsers.ts
import { useEffect, useMemo, useRef, useState } from 'react';
import vkBridge from '@vkontakte/vk-bridge';

type Profile = { fullName: string; avatarUrl: string | undefined };
type ProfilesMap = Record<number, Profile>;

type CacheLike = {
  read(ids: number[]): Promise<ProfilesMap>;
  write(map: ProfilesMap): Promise<void>;
};

const memoryCache = (() => {
  const store: ProfilesMap = {};
  return {
    async read(ids: number[]) {
      const out: ProfilesMap = {};
      for (const id of ids) if (store[id]) out[id] = store[id];
      return out;
    },
    async write(map: ProfilesMap) {
      try {
        Object.assign(store, map);
      } catch {}
    },
  } as CacheLike;
})();

const GROUP_ALIASES: Record<number, string> = { 9999999: 'vetercc' };

function normalizeUser(u: any): Profile {
  const first = u?.first_name ?? '';
  const last = u?.last_name ?? '';
  const fullName = `${first} ${last}`.trim();
  const avatarUrl = u?.photo_200 || u?.photo_100 || u?.photo_50 || undefined;
  return { fullName, avatarUrl };
}

function normalizeGroup(g: any): Profile {
  const fullName = g?.name ?? '';
  const avatarUrl =
    g?.photo_200 || g?.photo_100 || g?.photo_50 || g?.photo || undefined;
  return { fullName, avatarUrl };
}

type UseVkUsersOptions = {
  accessToken?: string; // <-- добавлено
  apiVersion?: string;  // по умолчанию 5.199
};

export function useVkUsers(
  vkIds: number[],
  _appId: number,
  options?: UseVkUsersOptions
): ProfilesMap {
  const accessToken = options?.accessToken;
  const apiVersion = options?.apiVersion ?? '5.199';

  const [map, setMap] = useState<ProfilesMap>({});
  const prevIdsRef = useRef<string>('');


    const missing = ids.filter((id) => !map[id]);
    if (!missing.length) return;

    let cancelled = false;

    (async () => {
      if (ids.length === 0) {
        setMap({});
        return;
      }

      // без токена вызовы API делать нельзя — просто логируем и отдаём кэш
      if (!accessToken) {
        console.warn('[useVkUsers] accessToken is missing — API calls skipped');
        const cached = await memoryCache.read(ids);
        if (!cancelled) setMap(cached);
        return;
      }

      console.log('[useVkUsers] start', { totalIds: ids.length });

      const cached = await memoryCache.read(ids);
      const missing = ids.filter((id) => !cached[id]);

      const userIds: number[] = [];
      const groupAliasEntries: Array<{ id: number; alias: string }> = [];
      for (const id of missing) {
        const alias = GROUP_ALIASES[id];
        if (alias) groupAliasEntries.push({ id, alias });
        else userIds.push(id);
      }

      const result: ProfilesMap = { ...cached };

      // users.get — пачками
      if (userIds.length) {
        const chunks: number[][] = [];
        const batchSize = 500;
        for (let i = 0; i < userIds.length; i += batchSize) {
          chunks.push(userIds.slice(i, i + batchSize));
        }
        for (const chunk of chunks) {
          const started = performance.now();
          const resp: any = await vkBridge.send('VKWebAppCallAPIMethod', {
            method: 'users.get',
            params: {
              user_ids: chunk.join(','),
              fields: 'photo_200,photo_100,photo_50',
              access_token: accessToken,  // <-- добавлено
              v: apiVersion,              // <-- добавлено
            },
            request_id: `users_${Date.now()}_${Math.random()}`, // чтобы удовлетворить типы
          });
          const took = performance.now() - started;
          console.log('[useVkUsers] users batch', { size: chunk.length, tookMs: took });

          const users = resp?.response ?? [];
          for (const u of users) {
            const pid = Number(u?.id);
            if (!Number.isFinite(pid)) continue;
            result[pid] = normalizeUser(u);
          }
        }
      }

      // groups.getById — по алиасам
      if (groupAliasEntries.length) {
        const started = performance.now();
        const groupIds = groupAliasEntries.map((x) => x.alias).join(',');
        const resp: any = await vkBridge.send('VKWebAppCallAPIMethod', {
          method: 'groups.getById',
          params: {
            group_ids: groupIds,
            fields: 'photo_200,photo_100,photo_50',
            access_token: accessToken,  // <-- добавлено
            v: apiVersion,              // <-- добавлено
          },
          request_id: `groups_${Date.now()}_${Math.random()}`,
        });
        const took = performance.now() - started;
        console.log('[useVkUsers] groups getById', { count: groupAliasEntries.length, tookMs: took });

        const groups = resp?.response ?? [];
        for (const { id: pseudoId, alias } of groupAliasEntries) {
          const g =
            groups.find((gg: any) => (gg?.screen_name || gg?.short_name || '').toLowerCase() === alias.toLowerCase()) ??
            groups.find((gg: any) => String(gg?.id) === String(alias).replace(/^[cg]/i, ''));
          if (g) {
            result[pseudoId] = normalizeGroup(g);
            console.log('[useVkUsers] group mapped', { pseudoId, alias, name: result[pseudoId].fullName });
          } else {
            result[pseudoId] = { fullName: '', avatarUrl: undefined };
            console.warn('[useVkUsers] group NOT FOUND', { pseudoId, alias });
          }
        }
      }

      try {
        await memoryCache.write(result);
      } catch (e: any) {
        const msg = String(e?.message || e);
        if (msg.includes('NO_SPACE')) {
          console.warn('[useVkUsers] cache write skipped (NO_SPACE)');
        } else {
          console.warn('[useVkUsers] cache write error:', e);
        }
      }

      if (!cancelled) {
        setMap(result);
        console.log('[useVkUsers] state: updated', { added: Object.keys(result).length });
      }
    })().catch((e) => {
      console.error('[useVkUsers] unexpected error', e);
    });

    return () => { cancelled = true; };
  }, [ids, accessToken, apiVersion]);

  return map;
}
