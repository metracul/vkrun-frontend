import { FC, useMemo, useState, useEffect } from 'react';
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
import {
  useGetRunsQuery,
  usePrefetch,
  useDeleteRunMutation,
} from '../store/runnersApi';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { DEFAULT_VIEW_PANELS } from '../routes';
import { showBannerAd, hideBannerAd } from '../store/bannerAdSlice';
import vkBridge, {
  parseURLSearchParamsForGetLaunchParams,
} from '@vkontakte/vk-bridge';
import { useVkUsers } from '../hooks/useVkUsers';
import { setSelectedCity } from '../store/cityFilterSlice';

import { CitySelect, FiltersModal, RunCardItem, DeleteConfirmModal } from './components';

import { DISTRICTS_BY_CITY } from '../constants/locations';
import {
  parseCreatorIdFromFallback,
  parsePaceToSec,
  parseNumberOrUndefined,
} from '../utils';

export interface HomeProps {
  id: string;
}

type ModalId = 'filters' | 'confirm-delete' | null;

export const Home: FC<HomeProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();
  const platform = usePlatform();
  const isDesktop = platform === 'vkcom';
  const dispatch = useAppDispatch();
  const { panel: activePanel } = useActiveVkuiLocation();

  const myVkId = useAppSelector((s) => s.user.data?.id);

  const selectedCity = useAppSelector((s) => s.cityFilter.selectedCity);
  const [cityName, setCityName] = useState<string>(selectedCity ?? 'Москва');
  const [districtName, setDistrictName] = useState<string>('');
  const [distanceFromStr, setDistanceFromStr] = useState<string>('');
  const [distanceToStr, setDistanceToStr] = useState<string>('');
  const [paceFrom, setPaceFrom] = useState<string>('');
  const [paceTo, setPaceTo] = useState<string>('');
  const [runDate, setRunDate] = useState<string>('');

  // distance validation
  const {
    distFromNum,
    distToNum,
    isDistFromInvalid,
    isDistToInvalid,
    distRangeInvalid,
  } = useMemo(() => {
    const fromNum = parseNumberOrUndefined(distanceFromStr);
    const toNum = parseNumberOrUndefined(distanceToStr);
    const fromInvalid =
      distanceFromStr.trim() !== '' && (fromNum === undefined || fromNum <= 0);
    const toInvalid =
      distanceToStr.trim() !== '' && (toNum === undefined || toNum <= 0);
    const rangeInvalid =
      !fromInvalid &&
      !toInvalid &&
      fromNum !== undefined &&
      toNum !== undefined &&
      fromNum > toNum;
    return {
      distFromNum: fromNum,
      distToNum: toNum,
      isDistFromInvalid: fromInvalid,
      isDistToInvalid: toInvalid,
      distRangeInvalid: rangeInvalid,
    };
  }, [distanceFromStr, distanceToStr]);

  // pace validation
  const { paceFromSec, paceToSec, paceRangeInvalid } = useMemo(() => {
    const pf = parsePaceToSec(paceFrom);
    const pt = parsePaceToSec(paceTo);
    return {
      paceFromSec: pf,
      paceToSec: pt,
      paceRangeInvalid: pf != null && pt != null && pf > pt,
    };
  }, [paceFrom, paceTo]);

  const districtOptions = useMemo(
    () => (DISTRICTS_BY_CITY[cityName] ?? []).map((label) => ({ value: label, label })),
    [cityName],
  );

  const filters = useMemo(() => {
    const f: Record<string, string | number> = {};
    if (cityName.trim()) f.cityName = cityName.trim();
    if (districtName.trim()) f.districtName = districtName.trim();
    if (!isDistFromInvalid && distFromNum !== undefined && !distRangeInvalid)
      f.kmFrom = distFromNum;
    if (!isDistToInvalid && distToNum !== undefined && !distRangeInvalid)
      f.kmTo = distToNum;
    if (!paceRangeInvalid) {
      if (paceFromSec != null) f.paceFrom = paceFromSec;
      if (paceToSec != null) f.paceTo = paceToSec;
    }
    if (runDate) {
      const d = new Date(runDate);
      f.dateFrom = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        0,
        0,
        0,
        0,
      ).toISOString();
      f.dateTo = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        23,
        59,
        59,
        999,
      ).toISOString();
    }
    return f;
  }, [
    cityName,
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

  const { data, isLoading, isError, refetch, isFetching } = useGetRunsQuery({
    endpoint: '/api/v1/runs',
    size: 20,
    filters,
  });
  const runs = data?.items ?? [];

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

  const [activeModal, setActiveModal] = useState<ModalId>(null);
  const close = () => setActiveModal(null);
  const applyFilters = () => {
    close();
    refetch();
  };
  const resetFilters = () => {
    setDistanceFromStr('');
    setDistanceToStr('');
    setPaceFrom('');
    setPaceTo('');
    setRunDate('');
    setDistrictName('');
    refetch();
  };

  useEffect(() => {
    if ((selectedCity ?? 'Москва') !== cityName)
      setCityName(selectedCity ?? 'Москва');
  }, [selectedCity]);
  useEffect(() => {
    if (
      districtName &&
      !(DISTRICTS_BY_CITY[cityName] ?? []).includes(districtName)
    )
      setDistrictName('');
  }, [cityName, districtName]);

  useEffect(() => {
    const onUpdated = () => refetch();
    window.addEventListener('runs:updated', onUpdated);
    return () => window.removeEventListener('runs:updated', onUpdated);
  }, [refetch]);
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [refetch]);

  const [deleteRun, { isLoading: isDeleting }] = useDeleteRunMutation();
  const [runIdToDelete, setRunIdToDelete] = useState<number | null>(null);
  const confirmDelete = (id: number) => {
    setRunIdToDelete(id);
    setActiveModal('confirm-delete');
  };
  const doDeleteNow = async () => {
    if (runIdToDelete == null) return;
    try {
      await deleteRun(runIdToDelete).unwrap();
      setRunIdToDelete(null);
      setActiveModal(null);
      window.dispatchEvent(new Event('runs:updated'));
      refetch();
    } catch (err: any) {
      alert(err?.data?.error || 'Не удалось удалить пробежку');
    }
  };

  useEffect(() => {
    if (activePanel !== id) return;
    const { vk_platform } = parseURLSearchParamsForGetLaunchParams(
      window.location.search,
    );
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

      <FiltersModal
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onApply={applyFilters}
        onReset={resetFilters}
        runDate={runDate}
        setRunDate={setRunDate}
        districtName={districtName}
        setDistrictName={setDistrictName}
        districtOptions={districtOptions}
        distanceFromStr={distanceFromStr}
        setDistanceFromStr={setDistanceFromStr}
        distanceToStr={distanceToStr}
        setDistanceToStr={setDistanceToStr}
        isDistFromInvalid={isDistFromInvalid}
        isDistToInvalid={isDistToInvalid}
        distRangeInvalid={distRangeInvalid}
        paceFrom={paceFrom}
        setPaceFrom={setPaceFrom}
        paceTo={paceTo}
        setPaceTo={setPaceTo}
        paceRangeInvalid={paceRangeInvalid}
      />

      <DeleteConfirmModal
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onConfirm={doDeleteNow}
        isDeleting={isDeleting}
      />

      <Group>
        <CitySelect
          value={cityName}
          onChange={(next) => {
            setCityName(next);
            dispatch(setSelectedCity(next));
          }}
        />

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
            onClick={() => setActiveModal('filters')}
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
        <Caption level="1" style={{ paddingLeft: 12 }}>
          Выбери с кем бежать!
        </Caption>

        <Spacing size="m" />

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
            <RunCardItem
              key={r.id}
              run={r}
              profile={profile}
              isMine={!!isMine}
              isDeleting={isDeleting}
              onOpen={openDetails}
              onDeleteClick={(e) => {
                e.stopPropagation();
                confirmDelete(Number(r.id));
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
