const STORAGE_KEY = '__vk_launch_qs';

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
