// src/features/onboarding.ts
import vkBridge from '@vkontakte/vk-bridge';

export const ONBOARDING_LS_KEY = 'onboarding_v4_shown';

// Генерация data URL с SVG, чтобы не хранить/загружать картинки
function svgDataUrl(title: string, emoji: string, bg = '#2D81E0'): string {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg}" />
        <stop offset="100%" stop-color="#1C4DA1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="45%" font-size="200" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">${emoji}</text>
    <text x="50%" y="60%" font-size="56" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">${title}</text>
  </svg>`;

  // Кодируем в base64 через btoa (только для браузера)
  const b64 = window.btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${b64}`;
}


type Slide = {
  media: { blob: string; type: 'image' };
  title: string;
  subtitle?: string;
};

function buildSlides(): Slide[] {
  return [
    {
      media: { blob: svgDataUrl('Находи напарников поблизости', '🏃‍♀️🏃‍♂️'), type: 'image' },
      title: 'Совместные пробежки',
      subtitle: 'Выбирай дистанцию, темп и время. Присоединяйся к пробежкам рядом.',
    },
    {
      media: { blob: svgDataUrl('Создавай свои забеги за 10 сек.', '📅✨', '#5D9C59'), type: 'image' },
      title: 'Создавай и зови друзей',
      subtitle: 'Укажи город, район и темп — мы покажем желающим.',
    },
  ];
}

// Показ слайдов (один раз на устройство/браузер)
export async function showOnboardingIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return;

  // уже показывали ранее
  if (localStorage.getItem(ONBOARDING_LS_KEY) === '1') return;

  // защита от повторных вызовов в рамках одной сессии
  if ((window as any).__onboarding_in_progress__) return;
  (window as any).__onboarding_in_progress__ = true;

  const slides = buildSlides();

  // Подпишемся на результат, чтобы снять флаг и проставить маркер
  const handler = (e: any) => {
    const type = e?.detail?.type;
    if (type === 'VKWebAppShowSlidesSheetResult') {
      localStorage.setItem(ONBOARDING_LS_KEY, '1');
      (window as any).__onboarding_in_progress__ = false;
      vkBridge.unsubscribe(handler);
    } else if (type === 'VKWebAppShowSlidesSheetFailed') {
      // не критично: просто снимаем флаг
      (window as any).__onboarding_in_progress__ = false;
      vkBridge.unsubscribe(handler);
    }
  };
  vkBridge.subscribe(handler);

  try {
    // Типы метода могут отсутствовать — вызываем через any
    const res = await (vkBridge as any).send('VKWebAppShowSlidesSheet', { slides });
    if (res?.result) {
      localStorage.setItem(ONBOARDING_LS_KEY, '1');
    }
  } catch (err) {
    // тихо игнорируем — онбординг не обязателен
    // console.warn('ShowSlidesSheet error', err);
  } finally {
    (window as any).__onboarding_in_progress__ = false;
    vkBridge.unsubscribe(handler);
  }
}
