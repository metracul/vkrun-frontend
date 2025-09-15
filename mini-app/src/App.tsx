import { useEffect } from 'react';
import { View, SplitLayout, SplitCol, ScreenSpinner } from '@vkontakte/vkui';
import { useActiveVkuiLocation } from '@vkontakte/vk-mini-apps-router';
import { Persik, Home, CreateRun } from './panels';
import { DEFAULT_VIEW_PANELS } from './routes';

import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchUser } from './store/userSlice';

export const App = () => {
  const { panel: activePanel = DEFAULT_VIEW_PANELS.HOME } = useActiveVkuiLocation();
  const dispatch = useAppDispatch();

  const user = useAppSelector((s) => s.user.data);
  const userStatus = useAppSelector((s) => s.user.status);

  useEffect(() => {
    if (userStatus === 'idle') {
      dispatch(fetchUser());
    }
  }, [dispatch, userStatus]);

  const popoutNode = userStatus === 'loading' ? <ScreenSpinner /> : null;

  return (
    <SplitLayout popout={popoutNode}>
      <SplitCol>
        <View activePanel={activePanel}>
          <Home id="home" />
          <CreateRun id="create" />
          <Persik id="persik" />
        </View>
      </SplitCol>
    </SplitLayout>
  );
};
