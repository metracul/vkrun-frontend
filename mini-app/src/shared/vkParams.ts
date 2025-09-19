// src/shared/vkParams.ts
const STORAGE_KEY = '__vk_launch_qs';

type BridgeLike = {
  send(method: string, params?: Record<string, unknown>): Promise<any>;
};

/** Собирает querystring из объекта (a=1&b=2), пропуская undefined/null/'' */
function toQS(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}

/** Возвращает закешированные/URL launch-параметры или null */
export function getFrozenLaunchQueryString(): string | null {
  const cached = sessionStorage.getItem(STORAGE_KEY);
  if (cached) return cached;

  const raw = window.location.search || '';
  const qs = raw.startsWith('?') ? raw.slice(1) : raw;

  if (qs) {
    sessionStorage.setItem(STORAGE_KEY, qs);
    return qs;
  }

  if (import.meta.env?.DEV && import.meta.env.VITE_VK_LAUNCH_QS) {
    const devQs = String(import.meta.env.VITE_VK_LAUNCH_QS).replace(/^\?/, '');
    sessionStorage.setItem(STORAGE_KEY, devQs);
    return devQs;
  }

  return null;
}

/** Принудительно сохранить QS в sessionStorage */
export function setLaunchQueryString(qs: string) {
  sessionStorage.setItem(STORAGE_KEY, qs.replace(/^\?/, ''));
}

/**
 * Гарантирует наличие launch QS в sessionStorage.
 * 1) Пытается взять из sessionStorage/URL/DEV.
 * 2) Если пусто — вызывает VKWebAppGetLaunchParams и сам собирает QS.
 * Возвращает QS или кидает ошибку.
 */
export async function ensureLaunchQueryString(bridge: BridgeLike): Promise<string> {
  const existing = getFrozenLaunchQueryString();
  if (existing) return existing;

  try {
    const lp = (await bridge.send('VKWebAppGetLaunchParams')) as Record<string, unknown>;
    const qs = toQS(lp || {});
    if (qs) {
      setLaunchQueryString(qs);
      return qs;
    }
  } catch {
    // no-op
  }

  throw new Error('VK launch params are missing');
}
