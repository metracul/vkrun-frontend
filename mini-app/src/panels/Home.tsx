// Home.tsx
import { FC, useMemo, useEffect } from 'react';
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
import { useRouteNavigator, useActiveVkuiLocation } from '@vkontakte/vk-mini-apps-router';
import { useGetRunsQuery, usePrefetch, useDeleteRunMutation } from '../store/runnersApi';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import type { RootState } from '../store';
import { DEFAULT_VIEW_PANELS } from '../routes';
import { showBannerAd, hideBannerAd } from '../store/bannerAdSlice';
import vkBridge, { parseURLSearchParamsForGetLaunchParams } from '@vkontakte/vk-bridge';
import { useVkUsers } from '../hooks/useVkUsers';
import { setSelectedCity } from '../store/cityFilterSlice';

import { CitySelect, RunCardItem } from './components';

import { DISTRICTS_BY_CITY } from '../constants/locations';
import { parseCreatorIdFromFallback, parsePaceToSec, parseNumberOrUndefined } from '../utils';
import { setDistrictName as setRunsDistrictName } from '../store/runsFilterSlice';

export interface HomeProps {
  id: string;
  openFilters: () => void;
  openConfirmDelete: (id: number) => void;
}

export const Home: FC<HomeProps> = ({ id, openFilters, openConfirmDelete }) => {
  const routeNavigator = useRouteNavigator();
  const platform = usePlatform();
  const isDesktop = platform === 'vkcom';
  const dispatch = useAppDispatch();
  const { panel: activePanel } = useActiveVkuiLocation();

  const myVkId = useAppSelector((s) => s.user.data?.id);

  // Город — из cityFilter
  const selectedCity = useAppSelector((s) => s.cityFilter.selectedCity) ?? 'Москва';

  // Остальные фильтры — из runsFilter (читает/пишет FiltersModalPage)
  const {
    runDate,
    districtName,
    distanceFromStr,
    distanceToStr,
    paceFrom,
    paceTo,
  } = useAppSelector((s: RootState) => s.runsFilter);

  // Если выбранный район не относится к текущему городу — сбрасываем
  useEffect(() => {
    const list = DISTRICTS_BY_CITY[selectedCity] ?? [];
    if (districtName && !list.includes(districtName)) {
      dispatch(setRunsDistrictName(''));
    }
  }, [selectedCity, districtName, dispatch]);

  // Валидации/преобразования для запроса
  const {
    distFromNum,
    distToNum,
    isDistFromInvalid,
    isDistToInvalid,
    distRangeInvalid,
  } = useMemo(() => {
    const fromNum = parseNumberOrUndefined(distanceFromStr);
    const toNum = parseNumberOrUndefined(distanceToStr);
    const fromInvalid = distanceFromStr?.trim() !== '' && (fromNum === undefined || fromNum <= 0);
    const toInvalid = distanceToStr?.trim() !== '' && (toNum === undefined || toNum <= 0);
    const rangeInvalid =
      !fromInvalid && !toInvalid && fromNum !== undefined && toNum !== undefined && fromNum > toNum;
    return {
      distFromNum: fromNum,
      distToNum: toNum,
      isDistFromInvalid: fromInvalid,
      isDistToInvalid: toInvalid,
      distRangeInvalid: rangeInvalid,
    };
  }, [distanceFromStr, distanceToStr]);

  const { paceFromSec, paceToSec, paceRangeInvalid } = useMemo(() => {
    const pf = parsePaceToSec(paceFrom);
    const pt = parsePaceToSec(paceTo);
    return { paceFromSec: pf, paceToSec: pt, paceRangeInvalid: pf != null && pt != null && pf > pt };
  }, [paceFrom, paceTo]);

  // Формируем фильтры для API
  const filters = useMemo(() => {
    const f: Record<string, string | number> = {};
    if (selectedCity.trim()) f.cityName = selectedCity.trim();
    if (districtName?.trim()) f.districtName = districtName.trim();
    if (!isDistFromInvalid && distFromNum !== undefined && !distRangeInvalid) f.kmFrom = distFromNum;
    if (!isDistToInvalid && distToNum !== undefined && !distRangeInvalid) f.kmTo = distToNum;
    if (!paceRangeInvalid) {
      if (paceFromSec != null) f.paceFrom = paceFromSec;
      if (paceToSec != null) f.paceTo = paceToSec;
    }
    if (runDate) {
      const d = new Date(runDate);
      f.dateFrom = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
      f.dateTo = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();
    }
    return f;
  }, [
    selectedCity,
    districtName,
    isDistFromInvalid,
    isDistToInvalid,
    distRangeInvalid,
    distFromNum,
    distToNum,
    paceFromSec,
    paceToSec,
    paceRangeInvalid,
    runDate,
  ]);

  // Запрос пробежек
  const { data, isLoading, isError, refetch, isFetching } = useGetRunsQuery({
    endpoint: '/api/v1/runs',
    size: 20,
    filters,
  });
  const runs = data?.items ?? [];

  // Профили авторов
  const creatorIds = useMemo(
    () =>
      runs
        .map((r: any) =>
          typeof r.creatorVkId === 'number'
            ? r.creatorVkId
            : parseCreatorIdFromFallback(r.fullName),
        )
        .filter((x): x is number => Number.isFinite(x)),
    [runs],
  );
  const appId = Number(import.meta.env.VITE_VK_APP_ID);
  const vkProfiles = useVkUsers(creatorIds, appId);

  const prefetchRunById = usePrefetch('getRunById', { ifOlderThan: 60 });

  // Удаление пробежки (триггерится модалкой через событие runs:confirm-delete)
  const [deleteRun, { isLoading: isDeleting }] = useDeleteRunMutation();
  const doDeleteNow = async (id: number) => {
    try {
      await deleteRun(id).unwrap();
      window.dispatchEvent(new Event('runs:updated'));
      refetch();
    } catch (err: any) {
      alert(err?.data?.error || 'Не удалось удалить пробежку');
    }
  };

  // Слушаем событие подтверждения удаления; корректные зависимости
  useEffect(() => {
    const handler = (e: Event) => {
      const anyEvt = e as unknown as { detail?: { id?: number } };
      const id = anyEvt?.detail?.id;
      if (typeof id === 'number') {
        void doDeleteNow(id);
      }
    };
    window.addEventListener('runs:confirm-delete', handler);
    return () => window.removeEventListener('runs:confirm-delete', handler);
  }, [doDeleteNow]);

  // Обновление списка по событиям
  useEffect(() => {
    const onUpdated = () => refetch();
    window.addEventListener('runs:updated', onUpdated);
    return () => window.removeEventListener('runs:updated', onUpdated);
  }, [refetch]);

  // Обновление при возврате во вкладку
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [refetch]);

  // Баннеры — используем уже полученный activePanel
  useEffect(() => {
    if (activePanel !== id) return;
    const { vk_platform } = parseURLSearchParamsForGetLaunchParams(window.location.search);
    const inWebView = vkBridge.isWebView();
    if (!inWebView || vk_platform === 'desktop_web') return;
    dispatch(
      showBannerAd({
        minIntervalMs: 180_000,
        params: { banner_location: 'bottom', layout_type: 'resize' },
      }),
    );
    return () => {
      dispatch(hideBannerAd());
    };
  }, [dispatch, activePanel, id]);

  return (
    <Panel id={id}>
      <PanelHeader delimiter="auto">
        <Header size="l">Поиск пробежки</Header>
      </PanelHeader>

      <Group>
        <CitySelect
          value={selectedCity}
          onChange={(next) => dispatch(setSelectedCity(next))}
        />

        <Header size="s">Список пробежек</Header>
        <Spacing size="m" />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 12px' }}>
          <Button
            appearance="accent"
            mode="outline"
            after={<Icon20FilterOutline />}
            onClick={openFilters}
          >
            Фильтры
          </Button>
          <Button mode="secondary" onClick={() => refetch()} disabled={isFetching}>
            Обновить
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
        <Caption level="1" style={{ paddingLeft: 12 }}>Выбери с кем бежать!</Caption>
        <Spacing size="m" />

        {isLoading && <Card mode="shadow">Загрузка…</Card>}
        {isError && <Card mode="shadow">Не удалось получить данные с сервера</Card>}
        {!isLoading && !isError && runs.length === 0 && (
          <Card mode="shadow">Пока пусто. Попробуй изменить фильтры.</Card>
        )}

        {runs.map((r: any) => {
          const vkId = typeof r.creatorVkId === 'number' ? r.creatorVkId : undefined;
          const profile = vkId ? vkProfiles[vkId] : undefined;
          const openDetails = () => {
            prefetchRunById(String(r.id));
            routeNavigator.push(`/run/${String(r.id)}`);
          };
          const isMine = myVkId && vkId && myVkId === vkId;

          return (
            <RunCardItem
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
