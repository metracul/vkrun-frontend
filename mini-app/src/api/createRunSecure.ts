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
  // payload для bridge == request_id для сервера
  const payload = `body_sha256=${bodySha256}`;

  const { sign, ts } = await bridge.send<'VKWebAppCreateHash'>('VKWebAppCreateHash', { payload });

  // launch params вы у себя кэшируете; их нужно приложить всегда
  const launchQs = getFrozenLaunchQueryString();
  if (!launchQs) throw new Error('No VK launch params');

  return {
    'X-VK-Params': launchQs,           // уже есть в проекте
    'X-VK-Request-Id': payload,        // именно строка "body_sha256=<hex>"
    'X-VK-Sign': sign,                 // подпись от bridge
    'X-VK-Sign-Ts': String(ts),        // Unix timestamp от bridge
  } as const;
}

/** Запрос создания пробежки на ваш бэкенд */
export async function createRunSecure(body: {
  cityId?: number;
  districtId?: number;
  cityName?: string;
  districtName?: string;
  startAt: string;           // ISO OffsetDateTime
  durationMinutes: number;   // 5..600
  distanceKm: number;        // > 0
  paceSecPerKm?: number;
  description?: string;
}) {
  const bodyJson = JSON.stringify(body);
  const signHeaders = await buildVkSignedHeaders(bodyJson);

  const res = await fetch('/api/v1/runs', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...signHeaders,
    },
    body: bodyJson, // ВАЖНО: тело должно в точности соответствовать тому, что хэшировали
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  // Бэкенд возвращает ID (Long)
  const id = await res.json(); // number
  return id as number;
}
