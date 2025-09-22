// src/features/onboarding.ts
import vkBridge from '@vkontakte/vk-bridge';
import slide1 from '../assets/onboarding/slide1.png';
import slide2 from '../assets/onboarding/slide2.png';

export const ONBOARDING_LS_KEY = 'onboarding_v1_shown';

type Slide = {
  media: { type: 'image'; url: string }; // используем URL вместо blob
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

export async function showOnboardingIfNeeded(): Promise<void> {
  if (localStorage.getItem(ONBOARDING_LS_KEY) === '1') return;

  const slides = buildSlides();

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
  vkBridge.subscribe(handler);

  try {
    // типы метода могут отсутствовать — вызываем через any
    const res = await (vkBridge as any).send('VKWebAppShowSlidesSheet', { slides });
    if (res?.result) localStorage.setItem(ONBOARDING_LS_KEY, '1');
  } catch {
    /* игнор */
  } finally {
    vkBridge.unsubscribe(handler);
  }
}
