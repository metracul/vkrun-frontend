// Это межэкранная реклама и её мы пока не используем



// src/ads/interstitial.ts
import vkBridge, { EAdsFormats } from '@vkontakte/vk-bridge';

type ShowOptions = {
  /** Минимальный интервал между показами, мс (частотный колпак) */
  minIntervalMs?: number;
  /** Максимальное ожидание, мс, если внезапно нет предзагрузки */
  timeoutMs?: number;
  /** Принудительно игнорировать minInterval */
  force?: boolean;
};

/**
 * В некоторых версиях типов VK Bridge перечисление EAdsFormats может не содержать 'interstitial'.
 * Каст через unknown устраняет конфликт типов, при этом фактическое значение корректно.
 */
const AD_FORMAT: EAdsFormats = 'interstitial' as unknown as EAdsFormats;

let lastShownAt = 0;
let inFlight: Promise<boolean> | null = null;

/** Мягкий прогрев рекламных материалов */
export async function prewarmInterstitial(): Promise<void> {
  try {
    await vkBridge.send('VKWebAppCheckNativeAds', { ad_format: AD_FORMAT });
  } catch {
    // игнор — прогрев не обязателен
  }
}

/** Быстрая проверка готовности */
export async function canShowInterstitial(): Promise<boolean> {
  try {
    const res = await vkBridge.send('VKWebAppCheckNativeAds', { ad_format: AD_FORMAT });
    return Boolean(res?.result);
  } catch {
    return false;
  }
}

/** Показ interstitial с частотным ограничением и таймаутом */
export function showInterstitial(opts: ShowOptions = {}): Promise<boolean> {
  if (inFlight) return inFlight;

  const { minIntervalMs = 90_000, timeoutMs = 2_000, force = false } = opts;

  inFlight = (async () => {
    // 1) частотный колпак
    const now = Date.now();
    if (!force && now - lastShownAt < minIntervalMs) {
      return false;
    }

    // 2) есть ли предзагрузка (быстрый путь)
    const ready = await canShowInterstitial();

    // 3) не зависать без предзагрузки дольше timeoutMs
    const showPromise = vkBridge
      .send('VKWebAppShowNativeAds', { ad_format: AD_FORMAT })
      .then((d: any) => Boolean(d?.result))
      .catch(() => false);

    const timeoutPromise = new Promise<boolean>((resolve) =>
      setTimeout(() => resolve(false), timeoutMs)
    );

    const result = ready ? await showPromise : await Promise.race([showPromise, timeoutPromise]);

    if (result) lastShownAt = Date.now();
    return result;
  })();

  return inFlight.finally(() => {
    inFlight = null;
  });
}
