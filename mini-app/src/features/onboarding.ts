import vkBridge from '@vkontakte/vk-bridge';
import slide1 from '../assets/onboarding/slide1.webp';
import slide2 from '../assets/onboarding/slide2.webp';

export const ONBOARDING_LS_KEY = 'onboarding_v5_shown';

type Slide = {
  media: { type: 'image'; url: string };
  title: string;
  subtitle?: string;
};

function buildSlides(): Slide[] {
  return [
    {
      media: { type: 'image', url: slide1 },
      title: 'Совместные пробежки',
      subtitle: 'Выбирай дистанцию, темп и время. Присоединяйся к пробежкам рядом.',
    },
    {
      media: { type: 'image', url: slide2 },
      title: 'Создавай и зови друзей',
      subtitle: 'Укажи город, район и темп — мы покажем желающим.',
    },
  ];
}

async function showSlidesSheet(slides: Slide[]) {
  // типы метода могут отсутствовать — вызываем через any
  const res = await (vkBridge as any).send('VKWebAppShowSlidesSheet', { slides });
  return Boolean(res?.result);
}

async function showImagesFallback(urls: string[]) {
  // Галерея изображений — как фоллбэк для desktop_web
  // https://vk.com/dev/vk_bridge_events (обычно поддерживается и на web)
  await vkBridge.send('VKWebAppShowImages', { images: urls });
  return true; // считаем показанным
}

export async function showOnboardingIfNeeded(): Promise<void> {
  if (localStorage.getItem(ONBOARDING_LS_KEY) === '1') return;

  const slides = buildSlides();
  const urls = slides.map(s => s.media.url);

  // Слушатель результата (если SlidesSheet поддержан)
  const handler = (e: any) => {
    const t = e?.detail?.type;
    if (t === 'VKWebAppShowSlidesSheetResult') {
      localStorage.setItem(ONBOARDING_LS_KEY, '1');
      vkBridge.unsubscribe(handler);
    }
    if (t === 'VKWebAppShowSlidesSheetFailed') {
      vkBridge.unsubscribe(handler);
    }
  };

  let shown = false;

  // 1) Пытаемся slides sheet, если поддерживается
  if (vkBridge.supports && vkBridge.supports('VKWebAppShowSlidesSheet')) {
    vkBridge.subscribe(handler);
    try {
      shown = await showSlidesSheet(slides);
      if (shown) localStorage.setItem(ONBOARDING_LS_KEY, '1');
    } catch { /* ignore */ }
    finally {
      vkBridge.unsubscribe(handler);
    }
  }

  // 2) Фоллбэк для desktop_web: галерея изображений
  if (!shown) {
    try {
      await showImagesFallback(urls);
      localStorage.setItem(ONBOARDING_LS_KEY, '1');
    } catch {
      // если даже галерея недоступна — просто не ставим флаг,
      // чтобы можно было попробовать в следующий раз
    }
  }
}
