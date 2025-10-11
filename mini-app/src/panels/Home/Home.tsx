// Home.tsx
import { FC, useEffect, useState } from 'react';
import {
  Panel,
  Button,
  Group,
  Caption,
  Card,
  usePlatform
} from '@vkontakte/vkui';
import { Icon24AddOutline } from '@vkontakte/icons';
import {
  useRouteNavigator,
  useActiveVkuiLocation,
} from '@vkontakte/vk-mini-apps-router';
import bridge from '@vkontakte/vk-bridge';

import { DEFAULT_VIEW_PANELS } from '../../routes';
import { HomeRunCardItem, FiltersIconButton } from '../components';
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
  openCitySelect: () => void;
}

export const Home: FC<HomeProps> = ({ id, openFilters, openCitySelect }) => {
  const routeNavigator = useRouteNavigator();
  const { panel: activePanel } = useActiveVkuiLocation();
  

  const { selectedCity, filters } = useHomeFilters();
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

  const platform = usePlatform();
  const isIOS = platform === 'ios';
  const isDesktop = platform === 'vkcom';

  const dispatch = useDispatch<AppDispatch>();

  const ITEM_ID = 'donation_3';

  const { inProgress, error, lastOrderId, lastItemId } = useAppSelector(
    (s: RootState) => s.purchase,
  );

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

  useEffect(() => {
    if (lastItemId === ITEM_ID && !hasDonation3) {
      setHasDonation3(true);
    }
  }, [lastItemId, hasDonation3]);

  const handleSpendVotes = () => {
    dispatch(spendVotes({ itemId: ITEM_ID }));
  };

  const openReward = () => {
    routeNavigator.push(DEFAULT_VIEW_PANELS.REWARD);
  };

  return (
    <Panel id={id}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 12,
          minHeight: '100%',
          boxSizing: 'border-box',
          backgroundColor: 'var(--background-panel-color)',
        }}
      >
        <Group mode="plain" separator="hide">  
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingTop: isIOS ? 100 : 40,
              justifyContent: 'space-between',
              overflow: 'hidden',
            }}
          >
            {/* Логотип слева через CSS-переменную --home-logo */}
            <div
              style={{
                width: 36.56,
                height: 36.71,
                backgroundImage: 'var(--home-logo)',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
              }}
            />

            {/* Справа блок: кнопка города + фильтры */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 11.47,
              }}
            >
              <Button
                mode="secondary"
                size="m"
                onClick={openCitySelect}
                style={{
                  minWidth: 126,
                  lineHeight: '100%',
                  letterSpacing: 0,
                  justifyContent: 'center',
                  border: '1.15px solid transparent',
                  borderRadius: 8,
                  backgroundImage: `
                    linear-gradient(var(--city-button-background-color), var(--city-button-background-color)),
                    linear-gradient(90deg,
                      rgba(123,70,248,1) 0%,
                      rgba(206,185,255,1) 33%,
                      rgba(254,170,238,1) 66%,
                      rgba(123,70,248,1) 100%
                    )
                  `,
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                }}
                before={
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      display: 'inline-block',
                      background:
                        'linear-gradient(90deg, rgba(183,152,255,1) 0%, rgba(123,70,248,1) 100%)',
                      WebkitMask:
                        'url(/icons/place_outline_20.svg) center / contain no-repeat',
                      mask: 'url(/icons/place_outline_20.svg) center / contain no-repeat',
                    }}
                  />
                }
              >
                <span
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(185,155,255,1) 0%, rgba(123,70,248,1) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 500,
                    fontSize: 14,
                    }}
                >
                  {selectedCity.toUpperCase()}
                </span>
              </Button>
              <FiltersIconButton onClick={openFilters} />
            </div>
          </div>
        </Group>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            fontStyle: 'normal',
            fontSize: 28,
            lineHeight: '100%',
            letterSpacing: 0,
            marginTop: 37,
          }}
        >
          ЛЕНТА ПРОБЕЖЕК
        </div>

        {/* Кнопка "Создать пробежку" */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <Button
            mode="secondary"
            onClick={() => routeNavigator.push(DEFAULT_VIEW_PANELS.CREATE)}
            style={{
              width: isDesktop ? 366 : '100%',
              borderRadius: 12,
              backgroundColor: 'var(--create-run-button-color)',
              minHeight:48,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                width: '100%',
              }}
            >
              <Icon24AddOutline
                style={{
                  display: 'block',
                  width: 24,
                  height: 24,
                  color: 'var(--vkui--color_text_primary)',
                }}
              />
              <span
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 500,
                  fontSize: 16,
                  lineHeight: '16px',
                  letterSpacing: 0,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  color: 'var(--vkui--color_text_primary)',
                  display: 'block',
                }}
              >
                Создать пробежку
              </span>
            </div>
          </Button>
        </div>

        {/* Кнопки под селектором */}
        <Group mode="plain" separator="hide">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {hasDonation3 ? (
              <Button mode="primary" onClick={openReward}>
                <span
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 500,
                }}
                >
                Открыть советы
                </span>
              </Button>
            ) : (
              <Button mode="secondary" onClick={handleSpendVotes} loading={inProgress}>
                <span
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 500,
                }}
                >
                Купить советы
                </span>
              </Button>
            )}
          </div>
          {lastOrderId && <Caption>
             <span
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 500,
                }}
                >
                   Оплачено. Заказ: {lastOrderId} 
                   </span>
                   </Caption>}
          {error && (
            <Caption style={{ color: 'var(--vkui--color_text_negative)' }}>
              <span
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 500,
                }}
                >
              Ошибка: {error}
              </span>
            </Caption>
          )}
        </Group>

        {/* Список пробежек */}
        <Group mode="plain" separator="hide">
          {isLoading && <Card mode="shadow">Загрузка…</Card>}
          {isError && <Card mode="shadow">Не удалось получить данные с сервера</Card>}
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
              />
            );
          })}
        </Group>
      </div>
    </Panel>
  );
};
