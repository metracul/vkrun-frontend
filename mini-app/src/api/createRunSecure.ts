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
  const payload = `body_sha256=${bodySha256}`; // payload == request_id

  const { sign, ts } = await bridge.send<'VKWebAppCreateHash'>('VKWebAppCreateHash', { payload });

  const launchQs = getFrozenLaunchQueryString();
  if (!launchQs) throw new Error('No VK launch params');

  return {
    'X-VK-Params': launchQs,
    'X-VK-Request-Id': payload,
    'X-VK-Sign': sign,
    'X-VK-Sign-Ts': String(ts),
  } as const;
}

/** Ошибка с HTTP-статусом */
export class HttpError extends Error {
  status: number;
  /** произвольные данные бэкенда, если есть */
  details?: unknown;
  raw?: string;
  constructor(status: number, message: string, opts?: { details?: unknown; raw?: string }) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = opts?.details;
    this.raw = opts?.raw;
  }
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
  const bodyJson = JSON.stringify(body);
  const signHeaders = await buildVkSignedHeaders(bodyJson);
  const base = import.meta.env.VITE_API_BASE_URL ?? '';

  const res = await fetch(`${base}/api/v1/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...signHeaders,
    },
    body: bodyJson,
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text) as { error?: string; code?: string; details?: unknown };
      const msg = json?.error || json?.code || `HTTP ${res.status}`;
      throw new HttpError(res.status, msg, { details: json?.details, raw: text });
    } catch {
      // не JSON
      throw new HttpError(res.status, text || `HTTP ${res.status}`, { raw: text });
    }
  }

  const id = await res.json(); // number (Long)
  return id as number;
}
