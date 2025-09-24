// App.tsx
import { useEffect } from 'react';
import { View, SplitLayout, SplitCol, ScreenSpinner } from '@vkontakte/vkui';
import { useActiveVkuiLocation } from '@vkontakte/vk-mini-apps-router';
import { Home, CreateRun, RunDetails } from './panels';
import { DEFAULT_VIEW_PANELS } from './routes';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchUser } from './store/userSlice';
import { initMe } from './api/me';
import { useBannerAdEvents } from './hooks/useBannerAdEvents';
import { showOnboardingIfNeeded } from './features/onboarding';

export const App = () => {
  const { panel: activePanel = DEFAULT_VIEW_PANELS.HOME } = useActiveVkuiLocation();
  const dispatch = useAppDispatch();
  const userStatus = useAppSelector((s) => s.user.status);
  useBannerAdEvents();

  useEffect(() => {
    if (userStatus === 'idle') {
      dispatch(fetchUser());
      initMe().catch((e) => console.warn('initMe failed', e));
    }
  }, [dispatch, userStatus]);

  useEffect(() => {
    if (userStatus === 'succeeded') {
      showOnboardingIfNeeded().catch((e) => console.warn('onboarding failed', e));
    }
  }, [userStatus]);

  const popoutNode = userStatus === 'loading' ? <ScreenSpinner /> : null;

  return (
    <SplitLayout popout={popoutNode}>
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
