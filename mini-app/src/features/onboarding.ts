import vkBridge from '@vkontakte/vk-bridge';

export const ONBOARDING_LS_KEY = 'onboarding_v7_shown';

type Slide = {
  media: { type: 'image'; url: string };
  title: string;
  subtitle?: string;
};

async function showSlidesSheet(slides: Slide[]) {
  const res = await (vkBridge as any).send('VKWebAppShowSlidesSheet', { slides });
  return Boolean(res?.result);
}

async function showImagesFallback(urls: string[]) {
  await vkBridge.send('VKWebAppShowImages', { images: urls });
  return true;
}

export async function showOnboardingIfNeeded(): Promise<void> {
  if (localStorage.getItem(ONBOARDING_LS_KEY) === '1') return;

  let SLIDE1_DATA_URL: string;
  let SLIDE2_DATA_URL: string;
  try {
    const mod = await import('./onboardingImages');
    SLIDE1_DATA_URL = mod.SLIDE1_DATA_URL;
    SLIDE2_DATA_URL = mod.SLIDE2_DATA_URL;
  } catch (e) {
    console.warn('[onboarding] failed to load images', e);
    return;
  }

  const slides: Slide[] = [
    {
      media: { type: 'image', url: SLIDE1_DATA_URL },
      title: 'Совместные пробежки',
      subtitle: 'Выбирай дистанцию, темп и время. Присоединяйся к пробежкам рядом.',
    },
    {
      media: { type: 'image', url: SLIDE2_DATA_URL },
      title: 'Создавай и зови друзей',
      subtitle: 'Укажи город, район и темп — мы покажем желающим.',
    },
  ];
  const urls = slides.map((s) => s.media.url);

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

  try {
    if (await vkBridge.supportsAsync('VKWebAppShowSlidesSheet')) {
      vkBridge.subscribe(handler);
      try {
            shown = await showSlidesSheet(slides);
          } catch (e: any) {
            console.warn('[onboarding] ShowSlidesSheet error', {
              type: e?.error_type,
              code: e?.error_data?.error_code,
              msg: e?.error_data?.error_reason || e?.error_data?.message,
              raw: e,
            });
          }
    }
  } catch (e) {
    console.warn('[onboarding] supportsAsync error', e);
  }

  if (!shown) {
    try {
          await showImagesFallback(urls);
        } catch (e: any) {
          console.warn('[onboarding] ShowImages fallback error', {
            type: e?.error_type,
            code: e?.error_data?.error_code,
            msg: e?.error_data?.error_reason || e?.error_data?.message,
            raw: e,
          });
        }
  }
}
