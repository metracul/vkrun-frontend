import { useEffect, useState } from 'react';
import { View, SplitLayout, SplitCol, ScreenSpinner } from '@vkontakte/vkui';
import { useActiveVkuiLocation } from '@vkontakte/vk-mini-apps-router';
import { Home, CreateRun, RunDetails } from './panels';
import { DEFAULT_VIEW_PANELS } from './routes';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchUser } from './store/userSlice';
import { initMe } from './api/me';
import { useBannerAdEvents } from './hooks/useBannerAdEvents';
import { ONBOARDING_LS_KEY } from './features/onboarding'; // ключ уже есть у вас
import { OnboardingModal, OnbSlide } from './features/onboarding/ui/OnboardingModal';

export const App = () => {
  const { panel: activePanel = DEFAULT_VIEW_PANELS.HOME } = useActiveVkuiLocation();
  const dispatch = useAppDispatch();
  const userStatus = useAppSelector((s) => s.user.status);
  useBannerAdEvents();

  const [showOnb, setShowOnb] = useState(false);
  const [slides, setSlides] = useState<OnbSlide[]>([]);

  useEffect(() => {
    if (userStatus === 'idle') {
      dispatch(fetchUser());
      initMe().catch((e) => console.warn('initMe failed', e));
    }
  }, [dispatch, userStatus]);

  // ленивый импорт base64 и показ модалки
  useEffect(() => {
    if (userStatus !== 'succeeded') return;
    if (localStorage.getItem(ONBOARDING_LS_KEY) === '1') return;

    (async () => {
      try {
        const mod = await import('./features/onboarding/onboardingImages');
        setSlides([
          {
            url: mod.SLIDE1_DATA_URL,
            title: 'Совместные пробежки',
            subtitle: 'Выбирай дистанцию, темп и время. Присоединяйся к пробежкам рядом.',
          },
          {
            url: mod.SLIDE2_DATA_URL,
            title: 'Создавай и зови друзей',
            subtitle: 'Укажи город, район и темп — мы покажем желающим.',
          },
        ]);
        setShowOnb(true);
      } catch (e) {
        console.warn('[onboarding] import images failed', e);
      }
    })();
  }, [userStatus]);

  const popoutNode = userStatus === 'loading' ? <ScreenSpinner /> : null;

  return (
    <SplitLayout
      popout={popoutNode}
      modal={
        showOnb ? (
          <OnboardingModal
            slides={slides}
            onClose={() => {
              localStorage.setItem(ONBOARDING_LS_KEY, '1');
              setShowOnb(false);
            }}
          />
        ) : null
      }
    >
      <SplitCol>
        <View activePanel={activePanel}>
          <Home id={DEFAULT_VIEW_PANELS.HOME} />
          <CreateRun id={DEFAULT_VIEW_PANELS.CREATE} />
          <RunDetails id={DEFAULT_VIEW_PANELS.RUN} />
        </View>
      </SplitCol>
    </SplitLayout>
  );
};
