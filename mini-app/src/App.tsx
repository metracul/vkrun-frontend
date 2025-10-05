import { useEffect, useState } from 'react';
import {
  View,
  SplitLayout,
  SplitCol,
  ScreenSpinner,
  ModalRoot,
} from '@vkontakte/vkui';
import { useActiveVkuiLocation, useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { Home, CreateRun, RunDetails } from './panels';
import { DEFAULT_VIEW_PANELS } from './routes';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchUser } from './store/userSlice';
import { initMe } from './api/me';
import { useBannerAds } from './panels/Home/hooks/useBannerAds';
import { showOnboardingIfNeeded } from './features/onboarding';
import { hydrateCityFromStorage } from './store/cityFilterSlice';

// Модалки
import {
  HomeFiltersModalPage,
  HomeDeleteConfirmModalPage,
} from './panels/components';

import bridge from '@vkontakte/vk-bridge';
import { purchaseFailed, purchaseSucceeded } from './store/purchaseSlice';

import { RewardTips } from './panels/RewardTips/RewardTips';

type ModalId = 'filters' | 'confirm-delete' | null;

export const App = () => {
  const { panel: activePanel = DEFAULT_VIEW_PANELS.HOME } =
    useActiveVkuiLocation();
  const routeNavigator = useRouteNavigator();
  const dispatch = useAppDispatch();
  const userStatus = useAppSelector((s) => s.user.status);


  useBannerAds();

  useEffect(() => {
    dispatch(hydrateCityFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (userStatus === 'idle') {
      dispatch(fetchUser());
      initMe().catch((e) => console.warn('initMe failed', e));
    }
  }, [dispatch, userStatus]);

  useEffect(() => {
    if (userStatus === 'succeeded') {
      showOnboardingIfNeeded().catch((e) =>
        console.warn('onboarding failed', e),
      );
    }
  }, [userStatus]);

  // === Подписка на платёжные события VK Bridge
  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail;
      if (!detail) return;
      const { type, data } = detail;

      if (type === 'VKWebAppShowOrderBoxResult' && data?.success) {
        // 1) Фиксируем право доступа в VK Storage
        bridge
          .send('VKWebAppStorageSet', { key: 'donation_3', value: '1' })
          .catch(() => {});

        // 2) Сохраняем в redux инфо об успешной оплате
        dispatch(purchaseSucceeded({ order_id: data.order_id }));

        // 3) Открываем экран с советами
        routeNavigator.push(DEFAULT_VIEW_PANELS.REWARD);
      } else if (type === 'VKWebAppShowOrderBoxFailed') {
        const msg =
          data?.error_data?.error_reason ||
          data?.error?.error_msg ||
          'Purchase failed';
        dispatch(purchaseFailed(msg));
      }
    };

    bridge.subscribe(handler);
    return () => {
      bridge.unsubscribe(handler);
    };
  }, [dispatch, routeNavigator]);

  const popoutNode = userStatus === 'loading' ? <ScreenSpinner /> : null;

  // ===== Модалки
  const [activeModal, setActiveModal] = useState<ModalId>(null);
  const [runIdToDelete, setRunIdToDelete] = useState<number | null>(null);

  const openFilters = () => setActiveModal('filters');
  const openConfirmDelete = (id: number) => {
    setRunIdToDelete(id);
    setActiveModal('confirm-delete');
  };
  const closeModal = () => setActiveModal(null);

  const resetFilters = () => {
    window.dispatchEvent(new Event('runs:updated'));
  };

  const onConfirmDelete = () => {
    if (runIdToDelete == null) return;
    const ev = new CustomEvent('runs:confirm-delete', {
      detail: { id: runIdToDelete },
    });
    window.dispatchEvent(ev);
    closeModal();
  };

  return (
    <SplitLayout
      popout={popoutNode}
      modal={
        <ModalRoot activeModal={activeModal} onClose={closeModal}>
          <HomeFiltersModalPage
            id="filters"
            onClose={closeModal}
            onReset={resetFilters}
          />
          <HomeDeleteConfirmModalPage
            id="confirm-delete"
            onClose={closeModal}
            onConfirm={onConfirmDelete}
            isDeleting={false}
          />
        </ModalRoot>
      }
    >
      <SplitCol>
        <View activePanel={activePanel}>
          <Home
            id={DEFAULT_VIEW_PANELS.HOME}
            openFilters={openFilters}
            openConfirmDelete={openConfirmDelete}
          />
          <CreateRun id={DEFAULT_VIEW_PANELS.CREATE} />
          <RunDetails id={DEFAULT_VIEW_PANELS.RUN} />
          {/* Панель с советами, доступ по VK Storage */}
          <RewardTips id={DEFAULT_VIEW_PANELS.REWARD} />
        </View>
      </SplitCol>
    </SplitLayout>
  );
};
