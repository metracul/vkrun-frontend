// src/api/createRunSecure.ts
import bridge from '@vkontakte/vk-bridge';
import { getFrozenLaunchQueryString } from '../shared/vkParams';

/** SHA-256 от сырых байт (Web Crypto API в браузере), hex в нижнем регистре */
async function sha256HexUtf8(str: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const view = new Uint8Array(hashBuf);
  return Array.from(view).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Собираем заголовки подписи для VKWebAppCreateHash */
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
  } as const;
}

/** Склейка базового URL и пути с нормализацией слешей */
function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/** Запрос создания пробежки на ваш бэкенд */
export async function createRunSecure(body: {
  cityName?: string;
  districtName?: string;
  startAt: string;           // ISO OffsetDateTime
  durationMinutes: number;   // 5..600
  distanceKm: number;        // > 0
  paceSecPerKm?: number;
  description?: string;
}) {
  const rawBase = import.meta.env.VITE_API_BASE_URL;
  if (!rawBase) throw new Error('VITE_API_BASE_URL is not set');
  const API_BASE = rawBase.replace(/\/+$/, '');

  const bodyJson = JSON.stringify(body);
  const signHeaders = await buildVkSignedHeaders(bodyJson);

  const res = await fetch(joinUrl(API_BASE, '/api/v1/runs'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...signHeaders,
    },
    body: bodyJson, // тело должно в точности соответствовать тому, что хэшировали
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }

  const id = await res.json();
  return id as number;
}
