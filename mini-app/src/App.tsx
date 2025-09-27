import { useEffect, useState } from 'react';
import {
  View,
  SplitLayout,
  SplitCol,
  ScreenSpinner,
  ModalRoot,
} from '@vkontakte/vkui';
import { useActiveVkuiLocation } from '@vkontakte/vk-mini-apps-router';
import { Home, CreateRun, RunDetails } from './panels';
import { DEFAULT_VIEW_PANELS } from './routes';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchUser } from './store/userSlice';
import { initMe } from './api/me';
import { useBannerAds } from './panels/Home/hooks/useBannerAds';
import { showOnboardingIfNeeded } from './features/onboarding';
import { hydrateCityFromStorage } from './store/cityFilterSlice';

// Модальные страницы (без собственного ModalRoot)
import {
  HomeFiltersModalPage,
  HomeDeleteConfirmModalPage,
} from './panels/components';

type ModalId = 'filters' | 'confirm-delete' | null;

export const App = () => {
  const { panel: activePanel = DEFAULT_VIEW_PANELS.HOME } =
    useActiveVkuiLocation();
  const dispatch = useAppDispatch();
  const userStatus = useAppSelector((s) => s.user.status);

  // Подписка на события баннера (без управления показом/скрытием здесь)
  useBannerAds(); // <-- Вызов без аргументов (аналог прежнего useBannerAdEvents)

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

  // Применение/сброс фильтров — просто сигналим экрану обновиться
  const applyFilters = () => {
    window.dispatchEvent(new Event('runs:updated'));
    closeModal();
  };
  const resetFilters = () => {
    window.dispatchEvent(new Event('runs:updated'));
  };

  // Подтверждение удаления — отправляем событие с id
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
            onApply={applyFilters}
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
        </View>
      </SplitCol>
    </SplitLayout>
  );
};
