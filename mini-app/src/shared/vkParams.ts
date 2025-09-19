const STORAGE_KEY = '__vk_launch_qs';

function toQS(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}

export function getFrozenLaunchQueryString(): string | null {
  const cached = sessionStorage.getItem(STORAGE_KEY);
  if (cached) return cached;

  let qs = '';
  const raw = window.location.search || '';
  qs = raw.startsWith('?') ? raw.slice(1) : raw;

  if (!qs && import.meta.env?.DEV && import.meta.env.VITE_VK_LAUNCH_QS) {
    qs = String(import.meta.env.VITE_VK_LAUNCH_QS).replace(/^\?/, '');
  }

  if (!qs) return null;
  sessionStorage.setItem(STORAGE_KEY, qs);
  return qs;
}

export function setLaunchQueryString(qs: string) {
  sessionStorage.setItem(STORAGE_KEY, qs.replace(/^\?/, ''));
}

/**
 * Гарантированно кладёт launch QS в sessionStorage.
 * 1) берёт из sessionStorage/URL (как раньше)
 * 2) если пусто — вызывает VKWebAppGetLaunchParams и сам собирает QS
 * Возвращает итоговый QS или кидает ошибку.
 */
export async function ensureLaunchQueryString(bridge: { send: Function }): Promise<string> {
  const existing = getFrozenLaunchQueryString();
  if (existing) return existing;

  // Пытаемся спросить у bridge
  try {
    const lp = await bridge.send('VKWebAppGetLaunchParams');
    // В ответе есть vk_user_id, vk_app_id, и прочие поля
    const qs = toQS(lp || {});
    if (qs) {
      setLaunchQueryString(qs);
      return qs;
    }
  } catch {
    // игнор — пойдём дальше к ошибке
  }

  // В DEV можно позволить пустое, если задан VITE_VK_LAUNCH_QS
  if (import.meta.env?.DEV && import.meta.env.VITE_VK_LAUNCH_QS) {
    const qs = String(import.meta.env.VITE_VK_LAUNCH_QS).replace(/^\?/, '');
    setLaunchQueryString(qs);
    return qs;
  }

  throw new Error('VK launch params are missing');
}
