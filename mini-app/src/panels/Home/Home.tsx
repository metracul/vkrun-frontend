import { FC } from 'react';
import {
  Panel,
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
import { DEFAULT_VIEW_PANELS } from '../../routes';
import { HomeCitySelect, HomeRunCardItem } from '../components';
import { useHomeFilters } from './hooks/useHomeFilters';
import { useRunsData } from './hooks/useRunsData';
import { useBannerAds } from './hooks/useBannerAds';

import { spendVotes } from '../../store/purchaseSlice';
import type { AppDispatch, RootState } from '../../store';
import { useAppSelector } from '../../store/hooks';
import { useDispatch } from 'react-redux';

import styles from '../Home/css/Home.module.css';

/* Путь к иконке хедера — укажите свой реальный файл */
import headerIcon from '../../assets/icons/Group10.png';

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

  const handleSpendVotes = () => {
    dispatch(spendVotes({ itemId: ITEM_ID }));
  };

  return (
    <Panel id={id}>

      <div className={styles.canvas}>
        <div className={styles.inner}>
          <Group mode="plain">
            {/* HEADER (иконка слева, справа — пилюля города и иконка фильтров) */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <img src={headerIcon} alt="" className={styles.headerLogo} />
              </div>

              <div className={styles.headerRight}>
                <div className={styles.cityPill}>
                  <HomeCitySelect value={selectedCity} onChange={setCity} />
                </div>

                <button
                  type="button"
                  aria-label="Фильтры"
                  className={styles.iconBtn}
                  onClick={openFilters}
                >
                  <Icon20FilterOutline />
                </button>
              </div>
            </div>

            {/* Кнопка «Потратить голоса» под header */}
            <div className={styles.votesRow}>
              <Button
                mode="secondary"
                onClick={handleSpendVotes}
                loading={inProgress}
              >
                Потратить голоса
              </Button>
            </div>

            {lastOrderId && <Caption>Оплачено. Заказ: {lastOrderId}</Caption>}
            {error && (
              <Caption style={{ color: 'var(--vkui--color_text_negative)' }}>
                Ошибка: {error}
              </Caption>
            )}

            <Header size="s">Список пробежек</Header>
            <Spacing size="m" />

            {/* Вверху списка на десктопе — только «Создать пробежку» */}
            <div className={styles.controls}>
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
            <Caption level="1">Выбери с кем бежать!</Caption>
            <Spacing size="m" />

            {isLoading && <Card mode="shadow">Загрузка…</Card>}
            {isError && <Card mode="shadow">Не удалось получить данные с сервера</Card>}
            {!isLoading && !isError && runs.length === 0 && (
              <Card mode="shadow">Пока пусто. Попробуй изменить фильтры.</Card>
            )}

            <div className={styles.cardsLine}>
              {runs.map((r: any) => {
                const vkId = typeof r.creatorVkId === 'number' ? r.creatorVkId : undefined;
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
            </div>

            {!isDesktop && <Spacing size={72} />}
          </Group>
        </div>
      </div>

      {!isDesktop && (
        <FixedLayout vertical="bottom">
          <div className={styles.fixedBottom}>
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
