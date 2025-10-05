import { FC, useEffect, useState } from 'react';
import {
  Panel,
  PanelHeader,
  Header,
  Button,
  Group,
  Spacing,
  Caption,
  FixedLayout,
  usePlatform,
  Card,
} from '@vkontakte/vkui';
import { Icon20FilterOutline, Icon28AddCircleOutline } from '@vkontakte/icons';
import {
  useRouteNavigator,
  useActiveVkuiLocation,
} from '@vkontakte/vk-mini-apps-router';
import bridge from '@vkontakte/vk-bridge';

import { DEFAULT_VIEW_PANELS } from '../../routes';
import { HomeCitySelect, HomeRunCardItem } from '../components';
import { useHomeFilters } from './hooks/useHomeFilters';
import { useRunsData } from './hooks/useRunsData';
import { useBannerAds } from './hooks/useBannerAds';

import { spendVotes } from '../../store/purchaseSlice';
import type { AppDispatch, RootState } from '../../store';
import { useAppSelector } from '../../store/hooks';
import { useDispatch } from 'react-redux';

export interface HomeProps {
  id: string;
  openFilters: () => void;
  openConfirmDelete: (id: number) => void;
}

export const Home: FC<HomeProps> = ({ id, openFilters, openConfirmDelete }) => {
  const routeNavigator = useRouteNavigator();
  const platform = usePlatform();
  const isDesktop = platform === 'vkcom';
  const { panel: activePanel } = useActiveVkuiLocation();

  const { selectedCity, filters, setCity } = useHomeFilters();
  const {
    runs,
    isLoading,
    isError,
    prefetchRunById,
    isDeleting,
    vkProfiles,
    myVkId,
  } = useRunsData(filters);

  useBannerAds(activePanel, id);

  const dispatch = useDispatch<AppDispatch>();

  const ITEM_ID = 'donation_3';

  const { inProgress, error, lastOrderId } = useAppSelector(
    (s: RootState) => s.purchase,
  );

  // Доступ к контенту по VK Storage
  const [hasDonation3, setHasDonation3] = useState(false);

  useEffect(() => {
    bridge
      .send('VKWebAppStorageGet', { keys: [ITEM_ID] })
      .then((res: any) => {
        const v = res?.keys?.find((k: any) => k.key === ITEM_ID)?.value;
        setHasDonation3(v === '1');
      })
      .catch(() => {});
  }, []);

  const handleSpendVotes = () => {
    dispatch(spendVotes({ itemId: ITEM_ID }));
  };

  const openReward = () => {
    routeNavigator.push(DEFAULT_VIEW_PANELS.REWARD);
  };

  return (
    <Panel id={id}>
      <PanelHeader delimiter="auto">
        <Header size="l">Поиск пробежки</Header>
      </PanelHeader>

      <Group>
        {/* Селектор и кнопки */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '8px 12px',
          }}
        >
          <HomeCitySelect value={selectedCity} onChange={setCity} />
          <div style={{ display: 'flex', gap: 8 }}>
            {hasDonation3 && (
              <Button mode="primary" onClick={openReward}>
                Открыть советы
              </Button>
            )}
            <Button mode="secondary" onClick={handleSpendVotes} loading={inProgress}>
              Потратить голоса
            </Button>
          </div>
        </div>

        {lastOrderId && (
          <Caption style={{ paddingLeft: 12 }}>
            Оплачено. Заказ: {lastOrderId}
          </Caption>
        )}
        {error && (
          <Caption
            style={{
              paddingLeft: 12,
              color: 'var(--vkui--color_text_negative)',
            }}
          >
            Ошибка: {error}
          </Caption>
        )}

        <Header size="s">Список пробежек</Header>
        <Spacing size="m" />

        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            padding: '8px 12px',
          }}
        >
          <Button
            appearance="accent"
            mode="outline"
            after={<Icon20FilterOutline />}
            onClick={openFilters}
          >
            Фильтры
          </Button>
          {isDesktop && (
            <Button
              mode="primary"
              before={<Icon28AddCircleOutline />}
              onClick={() => routeNavigator.push(DEFAULT_VIEW_PANELS.CREATE)}
            >
              Создать пробежку
            </Button>
          )}
        </div>

        <Spacing size="s" />
        <Caption level="1" style={{ paddingLeft: 12 }}>
          Выбери с кем бежать!
        </Caption>
        <Spacing size="m" />

        {isLoading && <Card mode="shadow">Загрузка…</Card>}
        {isError && (
          <Card mode="shadow">Не удалось получить данные с сервера</Card>
        )}
        {!isLoading && !isError && runs.length === 0 && (
          <Card mode="shadow">Пока пусто. Попробуй изменить фильтры.</Card>
        )}

        {runs.map((r: any) => {
          const vkId =
            typeof r.creatorVkId === 'number' ? r.creatorVkId : undefined;
          const profile = vkId ? vkProfiles[vkId] : undefined;
          const openDetails = () => {
            prefetchRunById(String(r.id));
            routeNavigator.push(`/run/${String(r.id)}`);
          };
          const isMine = myVkId && vkId && myVkId === vkId;

          return (
            <HomeRunCardItem
              key={r.id}
              run={r}
              profile={profile}
              isMine={!!isMine}
              isDeleting={isDeleting}
              onOpen={openDetails}
              onDeleteClick={(e) => {
                e.stopPropagation();
                openConfirmDelete(Number(r.id));
              }}
            />
          );
        })}

        {!isDesktop && <Spacing size={72} />}
      </Group>

      {!isDesktop && (
        <FixedLayout vertical="bottom">
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 16 }}>
            <Button
              mode="primary"
              size="l"
              before={<Icon28AddCircleOutline />}
              onClick={() => routeNavigator.push(DEFAULT_VIEW_PANELS.CREATE)}
            >
              Создать пробежку
            </Button>
          </div>
        </FixedLayout>
      )}
    </Panel>
  );
};
