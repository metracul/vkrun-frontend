// src/panels/Home.tsx
import { FC, useMemo, useState, useEffect } from 'react';
import {
  Panel, PanelHeader, Header, Button, Group, Avatar, NavIdProps, ModalRoot, ModalPage, Placeholder, ButtonGroup,
  Card, RichCell, Spacing, SimpleCell, Caption, Footnote, FixedLayout, usePlatform, FormItem, Input, CustomSelect, CustomSelectOption
} from '@vkontakte/vkui';
import { Icon20FilterOutline, Icon24User, Icon28AddCircleOutline, Icon20LocationMapOutline } from '@vkontakte/icons';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { useGetRunsQuery, usePrefetch, useDeleteRunMutation } from '../store/runnersApi';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { DEFAULT_VIEW_PANELS } from '../routes';
import { showBannerAd, hideBannerAd } from '../store/bannerAdSlice';
import vkBridge, { parseURLSearchParamsForGetLaunchParams } from '@vkontakte/vk-bridge';
import { useActiveVkuiLocation } from '@vkontakte/vk-mini-apps-router';
import { useVkUsers } from '../hooks/useVkUsers';
import { setSelectedCity } from '../store/cityFilterSlice';

export interface HomeProps extends NavIdProps {}

type ModalId = 'filters' | 'modal2' | 'confirm-delete' | null;

const CITY_OPTIONS = [
  { value: 'Москва', label: 'Москва', country: 'Россия' },
  { value: 'Санкт-Петербург', label: 'Санкт-Петербург', country: 'Россия' },
  { value: 'Казань', label: 'Казань', country: 'Россия' },
  { value: 'Уфа', label: 'Уфа', country: 'Россия' },
  { value: 'Омск', label: 'Омск', country: 'Россия' },
  { value: 'Новосибирск', label: 'Новосибирск', country: 'Россия' },
  { value: 'Екатеринбург', label: 'Екатеринбург', country: 'Россия' },
  { value: 'Самара', label: 'Самара', country: 'Россия' },
  { value: 'Нижний Новгород', label: 'Нижний Новгород', country: 'Россия' },
  { value: 'Краснодар', label: 'Краснодар', country: 'Россия' },
];

const PACE_OPTIONS = [
  '02:00','02:30','03:00','03:30','04:00','04:30',
  '05:00','05:30','06:00','06:30','07:00','07:30',
  '08:00','08:30','09:00','09:30',
].map((label) => ({ value: label, label }));

function formatDate(dateISO?: string) {
  if (!dateISO) return '';
  const d = new Date(dateISO);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}
function parseCreatorIdFromFallback(fullName?: string): number | undefined {
  if (!fullName) return undefined;
  const m = /^id(\d+)$/.exec(fullName.trim());
  return m ? Number(m[1]) : undefined;
}
function parsePaceToSec(mmss: string) {
  if (!mmss) return undefined;
  const m = /^(\d{1,2}):([0-5]\d)$/.exec(mmss.trim());
  if (!m) return undefined;
  const min = Number(m[1]);
  const sec = Number(m[2]);
  return min * 60 + sec;
}
function parseNumberOrUndefined(s: string): number | undefined {
  const t = s.trim();
  if (t === '') return undefined;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}


// ---------- component ----------
export const Home: FC<HomeProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();
  const platform = usePlatform();
  const isDesktop = platform === 'vkcom';
  const dispatch = useAppDispatch();
  const { panel: activePanel } = useActiveVkuiLocation();

  // мой VK id для проверки прав удаления
  const myVkId = useAppSelector((s) => s.user.data?.id);

  // фильтры
  const selectedCity = useAppSelector((s) => s.cityFilter.selectedCity);
  const [cityName, setCityName] = useState<string>(selectedCity ?? 'Москва');
  const [distanceFromStr, setDistanceFromStr] = useState<string>(''); 
  const [distanceToStr, setDistanceToStr] = useState<string>('');
  const [paceFrom, setPaceFrom] = useState<string>('');
  const [paceTo, setPaceTo] = useState<string>(''); 
  const [runDate, setRunDate] = useState<string>('');

  // Валидация дистанции
  const {
    distFromNum, distToNum,
    isDistFromInvalid, isDistToInvalid,
    distRangeInvalid,
  } = useMemo(() => {
    const fromNum = parseNumberOrUndefined(distanceFromStr);
    const toNum   = parseNumberOrUndefined(distanceToStr);

    const fromInvalid = distanceFromStr.trim() !== '' && (fromNum === undefined || fromNum <= 0);
    const toInvalid   = distanceToStr.trim()   !== '' && (toNum   === undefined || toNum   <= 0);

    const rangeInvalid =
      !fromInvalid && !toInvalid &&
      fromNum !== undefined && toNum !== undefined &&
      fromNum > toNum;

    return {
      distFromNum: fromNum,
      distToNum: toNum,
      isDistFromInvalid: fromInvalid,
      isDistToInvalid: toInvalid,
      distRangeInvalid: rangeInvalid,
    };
  }, [distanceFromStr, distanceToStr]);

  // Валидация темпа (диапазон только; сами значения из выпадашки валидны)
  const { paceFromSec, paceToSec, paceRangeInvalid } = useMemo(() => {
    const pf = parsePaceToSec(paceFrom);
    const pt = parsePaceToSec(paceTo);
    return {
      paceFromSec: pf,
      paceToSec: pt,
      paceRangeInvalid: pf != null && pt != null && pf > pt,
    };
  }, [paceFrom, paceTo]);


  // собираем фильтры под бэкенд
  const filters = useMemo(() => {
    const f: Record<string, string | number> = {};
    if (cityName.trim()) f.cityName = cityName.trim();

    // Дистанция — только валидные и при корректном диапазоне
    if (!isDistFromInvalid && distFromNum !== undefined && !distRangeInvalid) f.kmFrom = distFromNum;
    if (!isDistToInvalid   && distToNum   !== undefined && !distRangeInvalid) f.kmTo   = distToNum;

    // Темп — только при корректном диапазоне
    if (!paceRangeInvalid) {
      if (paceFromSec != null) f.paceFrom = paceFromSec;
      if (paceToSec   != null) f.paceTo   = paceToSec;
    }

    if (runDate) {
      const d = new Date(runDate);
      const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
      const to   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();
      f.dateFrom = from; f.dateTo = to;
    }
    return f;
  }, [
    cityName,
    isDistFromInvalid, isDistToInvalid, distRangeInvalid, distFromNum, distToNum,
    paceFromSec, paceToSec, paceRangeInvalid,
    runDate
  ]);


  const { data, isLoading, isError, refetch, isFetching } = useGetRunsQuery({
    endpoint: '/api/v1/runs',
    size: 20,
    filters,
  });
  const runs = data?.items ?? [];

  const creatorIds = useMemo(() => {
    return runs
      .map((r: any) => (typeof r.creatorVkId === 'number' ? r.creatorVkId : parseCreatorIdFromFallback(r.fullName)))
      .filter((x): x is number => Number.isFinite(x));
  }, [runs]);

  // общий хук с поддержкой overrides
  const appId = Number(import.meta.env.VITE_VK_APP_ID);
  const vkProfiles = useVkUsers(creatorIds, appId);

  const prefetchRunById = usePrefetch('getRunById', { ifOlderThan: 60 });

  const [activeModal, setActiveModal] = useState<ModalId>(null);
  const close = () => setActiveModal(null);
  const applyFilters = () => { close(); refetch(); };

  const resetFilters = () => {
    setDistanceFromStr('');
    setDistanceToStr('');
    setPaceFrom('');
    setPaceTo('');
    setRunDate('');
    refetch();
  };

  useEffect(() => {
    if ((selectedCity ?? 'Москва') !== cityName) {
      setCityName(selectedCity ?? 'Москва');
    }
  }, [selectedCity]);

  useEffect(() => {
    const onUpdated = () => refetch();
    window.addEventListener('runs:updated', onUpdated);
    return () => window.removeEventListener('runs:updated', onUpdated);
  }, [refetch]);

  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') refetch(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [refetch]);

  // мутация удаления
  const [deleteRun, { isLoading: isDeleting }] = useDeleteRunMutation();

  // состояние подтверждения удаления
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

  const modalRoot = (
    <ModalRoot activeModal={activeModal} onClose={close}>
      <ModalPage id="filters" onClose={close} header={<Header>Фильтры</Header>}>
        <Group>
          <FormItem top="Дата пробежки">
            <Input type="date" value={runDate} onChange={(e) => setRunDate((e.target as HTMLInputElement).value)} />
          </FormItem>

          {/* Дистанция: два поля От/До */}
          <FormItem top="Дистанция (км)">
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="От"
                  value={distanceFromStr}
                  onChange={(e) => setDistanceFromStr(e.target.value)}
                  status={(isDistFromInvalid || distRangeInvalid) ? 'error' : 'default'}
                />
                {isDistFromInvalid && (
                  <Caption level="1" style={{ color: 'var(--vkui--color_text_negative)', marginTop: 4 }}>
                    Введите положительное число &gt; 0 (км)
                  </Caption>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="До"
                  value={distanceToStr}
                  onChange={(e) => setDistanceToStr(e.target.value)}
                  status={(isDistToInvalid || distRangeInvalid) ? 'error' : 'default'}
                />
                {isDistToInvalid && (
                  <Caption level="1" style={{ color: 'var(--vkui--color_text_negative)', marginTop: 4 }}>
                    Введите положительное число &gt; 0 (км)
                  </Caption>
                )}
              </div>
            </div>

            {distRangeInvalid && (
              <Caption level="1" style={{ color: 'var(--vkui--color_text_negative)', marginTop: 6 }}>
                Диапазон задан некорректно: «От» больше «До». Пожалуйста, исправьте.
              </Caption>
            )}
          </FormItem>


          <FormItem top="Темп (мин/км)">
            <div style={{ display: 'flex', gap: 8 }}>
              <CustomSelect
                placeholder="От"
                options={PACE_OPTIONS}
                value={paceFrom}
                onChange={(e) => setPaceFrom((e.target as HTMLSelectElement).value)}
                allowClearButton
                status={paceRangeInvalid ? 'error' : 'default'}
              />
              <CustomSelect
                placeholder="До"
                options={PACE_OPTIONS}
                value={paceTo}
                onChange={(e) => setPaceTo((e.target as HTMLSelectElement).value)}
                allowClearButton
                status={paceRangeInvalid ? 'error' : 'default'}
              />
            </div>

            {paceRangeInvalid && (
              <Caption level="1" style={{ color: 'var(--vkui--color_text_negative)', marginTop: 6 }}>
                Диапазон темпа задан некорректно: «От» больше «До». Пожалуйста, исправьте.
              </Caption>
            )}
          </FormItem>


          <Spacing size={12} />
          <ButtonGroup mode="vertical" align="center" gap="s">
            <Button size="l" appearance="accent" onClick={applyFilters}>Применить</Button>
            <Button size="l" mode="secondary" onClick={resetFilters}>Сбросить</Button>
            <Button size="l" mode="tertiary" onClick={close}>Закрыть</Button>
          </ButtonGroup>
        </Group>
      </ModalPage>

      <ModalPage id="modal2" onClose={close} header={<Header>Инфо</Header>}>
        <Group>
          <Placeholder action={
            <ButtonGroup mode="vertical" align="center">
              <Button onClick={() => setActiveModal('filters')}>Вернуться к фильтрам</Button>
              <Button onClick={close}>Закрыть</Button>
            </ButtonGroup>
          } />
        </Group>
      </ModalPage>

      {/* Подтверждение удаления — безопасно для iOS */}
      <ModalPage id="confirm-delete" onClose={close} header={<Header>Удалить пробежку?</Header>}>
        <Group>
          <Caption level="1">Действие необратимо.</Caption>
          <Spacing size="m" />
          <ButtonGroup mode="vertical" align="center" gap="s">
            <Button size="l" appearance="negative" loading={isDeleting} onClick={doDeleteNow}>
              Удалить
            </Button>
            <Button size="l" mode="secondary" disabled={isDeleting} onClick={close}>
              Отмена
            </Button>
          </ButtonGroup>
        </Group>
      </ModalPage>
    </ModalRoot>
  );

  useEffect(() => {
    if (activePanel !== id) return;

    const { vk_platform } = parseURLSearchParamsForGetLaunchParams(window.location.search);
    const inWebView = vkBridge.isWebView();

    if (!inWebView || vk_platform === 'desktop_web') return;

    dispatch(showBannerAd({
      minIntervalMs: 180_000,
      params: {
        banner_location: 'bottom',
        layout_type: 'resize',
      },
    }));

    return () => {
      dispatch(hideBannerAd());
    };
  }, [dispatch, activePanel, id]);

  return (
    <Panel id={id}>
      <PanelHeader delimiter="auto">
        <Header size="l">Поиск пробежки</Header>
      </PanelHeader>

      {modalRoot}

      <Group>
        <SimpleCell>
          <CustomSelect
            before={<Icon20LocationMapOutline />}
            options={CITY_OPTIONS}
            style={{ width: 200 }}
            value={cityName}
            onChange={(e) => {
              const next = (e.target as HTMLSelectElement).value;
              setCityName(next);
              dispatch(setSelectedCity(next));
            }}
            placeholder="Выберите город"
            renderOption={({ option, ...restProps }) => (
              <CustomSelectOption {...restProps} description={(option as any).country} />
            )}
          />
        </SimpleCell>

        <Header size="s">Список пробежек</Header>
        <Spacing size="m" />

        <SimpleCell>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button appearance="accent" mode="outline" after={<Icon20FilterOutline />} onClick={() => setActiveModal('filters')}>
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
          <Caption level="1">Выбери с кем бежать!</Caption>
        </SimpleCell>

        <Spacing size="m" />

        {isLoading && (<Card mode="shadow"><RichCell multiline>Загрузка…</RichCell></Card>)}
        {isError && (<Card mode="shadow"><RichCell multiline>Не удалось получить данные с сервера</RichCell></Card>)}
        {!isLoading && !isError && runs.length === 0 && (
          <Card mode="shadow"><RichCell multiline>Пока пусто. Попробуй изменить фильтры.</RichCell></Card>
        )}

        {runs.map((r: any) => {
          const vkId: number | undefined =
            typeof r.creatorVkId === 'number' ? r.creatorVkId : parseCreatorIdFromFallback(r.fullName);

          const profile = vkId ? vkProfiles[vkId] : undefined;

          // Имя + подпись (если есть)
          const baseName = profile?.fullName ?? (vkId ? 'Получаю данные…' : '');
          const displayName = profile?.nameSuffix ? `${baseName} · ${profile.nameSuffix}` : baseName;

          const avatar = profile?.avatarUrl;

          const openDetails = () => {
            prefetchRunById(String(r.id));
            routeNavigator.push(`/run/${String(r.id)}`);
          };

          const isMine = myVkId && vkId && myVkId === vkId;

          const onDeleteClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            confirmDelete(Number(r.id));
          };

          return (
            <Card
              key={r.id}
              mode="shadow"
              style={{ marginTop: 8, position: 'relative' }}
              onClick={openDetails}
            >
              {isMine ? (
                <div
                  style={{
                    position: 'absolute',
                    right: 12,
                    bottom: 12,
                    zIndex: 2,
                  }}
                >
                  <Button
                    size="s"
                    mode="secondary"
                    appearance="negative"
                    disabled={isDeleting}
                    onClick={onDeleteClick}
                  >
                    Удалить
                  </Button>
                </div>
              ) : null}

              <RichCell
                before={<Avatar size={48} src={avatar} fallbackIcon={<Icon24User />} />}
                subtitle={[r.cityDistrict, formatDate(r.dateISO)].filter(Boolean).join(' • ')}
                extraSubtitle={[
                  r.distanceKm ? `${r.distanceKm} км` : null,
                  r.pace ? `${r.pace}` : null,
                ].filter(Boolean).join(' • ')}
                multiline
                style={{
                  paddingRight: 96,
                  paddingBottom: 44,
                }}
              >
                {r.title} — {displayName}
                {r.notes ? <Footnote style={{ marginTop: 4 }}>{r.notes}</Footnote> : null}
              </RichCell>
            </Card>
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
