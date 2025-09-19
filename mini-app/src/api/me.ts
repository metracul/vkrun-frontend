// src/api/me.ts
import bridge from '@vkontakte/vk-bridge';
import { getFrozenLaunchQueryString } from '../shared/vkParams';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

async function buildVkSignedHeaders(payload: string) {
  const { sign, ts } = await bridge.send<'VKWebAppCreateHash'>('VKWebAppCreateHash', { payload });
  const launchQs = getFrozenLaunchQueryString();
  if (!launchQs) throw new Error('No VK launch params');

  return {
    'X-VK-Params': launchQs,
    'X-VK-Request-Id': payload,
    'X-VK-Sign': sign,
    'X-VK-Sign-Ts': String(ts),
  };
}

/**
 * Инициализация пользователя через POST /api/v1/me.
 * vkUserId сервер достанет сам из X-VK-Params после проверки подписи.
 */
export async function initMe() {
  // payload можно сделать любым, например фиксированным
  const payload = 'init_me=1';
  const signHeaders = await buildVkSignedHeaders(payload);

  const res = await fetch(`${API_BASE}/api/v1/me`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...signHeaders,
    },
    body: '', // тело пустое
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }

  // ожидаем UserDto
  return res.json();
}
