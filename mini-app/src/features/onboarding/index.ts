// features/onboarding/index.ts
import bridge from '@vkontakte/vk-bridge';
import { SLIDES_SHEETS } from './slides';

export const ONBOARDING_LS_KEY = 'onboarding_v7_shown';

export async function showOnboardingIfNeeded(): Promise<void> {
  if (localStorage.getItem(ONBOARDING_LS_KEY) === '1') return;

  try {
    if (await bridge.supportsAsync('VKWebAppShowSlidesSheet')) {
      const res = await bridge.send('VKWebAppShowSlidesSheet', {
        slides: SLIDES_SHEETS,
      });
      if (res?.result) {
        localStorage.setItem(ONBOARDING_LS_KEY, '1');
      }
    } else {
      console.warn('[onboarding] SlidesSheet not supported on this platform');
    }
  } catch (e) {
    console.warn('[onboarding] ShowSlidesSheet error', e);
  }
}
