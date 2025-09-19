// src/api/me.ts
import bridge from '@vkontakte/vk-bridge';
import { getFrozenLaunchQueryString } from '../shared/vkParams';

const rawBase = import.meta.env.VITE_API_BASE_URL;
if (!rawBase) throw new Error('VITE_API_BASE_URL is not set');
const API_BASE = rawBase.replace(/\/+$/, '');

/** SHA-256 от строки, hex в нижнем регистре */
async function sha256HexUtf8(str: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const view = new Uint8Array(hashBuf);
  return Array.from(view).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function buildVkSignedHeaders(bodyJson: string) {
  const bodySha256 = await sha256HexUtf8(bodyJson);
  const payload = `body_sha256=${bodySha256}`;

  const { sign, ts } = await bridge.send('VKWebAppCreateHash', { payload });
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
 * ВНИМАНИЕ: тело пустое ('') — сервер должен хэшировать ровно пустые байты.
 * Если сервер ожидает '{}', замените body на '{}' и хэшируйте именно '{}'.
 */
export async function initMe() {
  const body = ''; // либо '{}' — но тогда синхронно поменять и серверную проверку
  const signHeaders = await buildVkSignedHeaders(body);

  const res = await fetch(`${API_BASE}/api/v1/me`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...signHeaders,
    },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }

  return res.json();
}
