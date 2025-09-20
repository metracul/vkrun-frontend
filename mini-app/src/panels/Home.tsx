// src/panels/Home.tsx
import { FC, useMemo, useState, useEffect, useRef } from 'react';
import {
  Panel, PanelHeader, Header, Button, Group, Avatar, NavIdProps, ModalRoot, ModalPage, Placeholder, ButtonGroup, ModalCard,
  Card, RichCell, Spacing, SimpleCell, Caption, Footnote, FixedLayout, usePlatform, FormItem, Input, CustomSelect, CustomSelectOption
} from '@vkontakte/vkui';
import { Icon20FilterOutline, Icon24User, Icon28AddCircleOutline, Icon20LocationMapOutline } from '@vkontakte/icons';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { useGetRunsQuery, usePrefetch } from '../store/runnersApi';
import { DEFAULT_VIEW_PANELS } from '../routes';
import bridge from '@vkontakte/vk-bridge';

export interface HomeProps extends NavIdProps {}

type ModalId = 'filters' | 'modal2' | null;

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

// варианты темпа
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

// вытащить "MM:SS" из строки темпа вида "5:30 /км" или "05:30 /км"
function extractMmSs(pace?: string) {
  if (!pace) return '';
  const m = pace.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : '';
}

// ---------- hook: batch users.get ----------
type VkUser = {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
  photo_100?: string;
};
type VkProfile = { fullName: string; avatarUrl?: string };

function uniqueFinite(ids: Array<number | undefined | null>) {
  const set = new Set<number>();
  for (const id of ids) if (Number.isFinite(id as number)) set.add(Number(id));
  return Array.from(set.values());
}
function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Загружает профили VK и возвращает мапу { [id]: { fullName, avatarUrl } }.
 * Требует VITE_VK_APP_ID.
 */
function useVkUsers(userIds: number[]) {
  const [map, setMap] = useState<Record<number, VkProfile>>({});
  const tokenRef = useRef<string | null>(null);
  const ids = useMemo(() => uniqueFinite(userIds), [userIds]);
  const appId = Number(import.meta.env.VITE_VK_APP_ID);

  useEffect(() => {
    if (!ids.length) return;
    if (!appId || Number.isNaN(appId)) {
      console.warn('VITE_VK_APP_ID не задан — пропускаю users.get');
      return;
    }
    const missing = ids.filter((id) => !map[id]);
    if (!missing.length) return;

    let cancelled = false;

    (async () => {
      try {
        if (!tokenRef.current) {
          const { access_token } = await bridge.send('VKWebAppGetAuthToken', {
            app_id: appId,
            scope: ''
          });
          tokenRef.current = access_token;
        }
        const access_token = tokenRef.current!;
        const batches = chunk(missing, 100);

        const next: Record<number, VkProfile> = {};
        for (const batch of batches) {
          const resp = await bridge.send('VKWebAppCallAPIMethod', {
            method: 'users.get',
            params: {
              user_ids: batch.join(','),
              fields: 'photo_200,photo_100',
              v: '5.199',
              access_token
            }
          });
          const users: VkUser[] = resp?.response || [];
          for (const u of users) {
            next[u.id] = {
              fullName: `${u.first_name} ${u.last_name}`.trim(),
              avatarUrl: u.photo_200 || u.photo_100
            };
          }
        }
        if (!cancelled && Object.keys(next).length) {
          setMap((prev) => ({ ...prev, ...next }));
        }
      } catch (e) {
        console.warn('users.get via vk-bridge failed', e);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, appId]);

  return map;
}

// ---------- component ----------
export const Home: FC<HomeProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();
  const platform = usePlatform();
  const isDesktop = platform === 'vkcom';

  // Город — выпадашка на главной. Дефолт: Москва.
  const [cityName, setCityName] = useState<string>('Москва');

  // Остальные фильтры (в модалке)
  const [distanceStr, setDistanceStr] = useState<string>(''); // строгое совпадение distanceKm
  const [pace, setPace] = useState<string>('');               // выбор из списка
  const [runDate, setRunDate] = useState<string>('');         // YYYY-MM-DD

  // Больше не отправляем фильтры на бэк — фильтруем локально
  const { data, isLoading, isError, refetch, isFetching } = useGetRunsQuery({
    endpoint: '/api/v1/runs',
    size: 200, // можно увеличить, чтобы было что фильтровать
  });
  const runs = data?.items ?? [];

  // --- локальная фильтрация ---
  const filteredRuns = useMemo(() => {
    const km = Number(distanceStr.replace(',', '.'));
    const hasKm = !Number.isNaN(km) && distanceStr.trim() !== '';
    const hasPace = !!pace;
    const hasDate = !!runDate;

    return runs.filter((r: any) => {
      // город: r.cityDistrict = "Город, Район" -> берём часть до запятой
      const runCity = (r.cityDistrict || '').split(',')[0].trim();
      if (cityName && runCity !== cityName) return false;

      if (hasKm && Number(r.distanceKm) !== km) return false;

      if (hasPace) {
        const mmss = extractMmSs(r.pace);
        if (mmss !== pace) return false;
      }

      if (hasDate) {
        const d = new Date(r.dateISO);
        if (Number.isNaN(d.getTime())) return false;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const runYmd = `${yyyy}-${mm}-${dd}`;
        if (runYmd !== runDate) return false;
      }

      return true;
    });
  }, [runs, cityName, distanceStr, pace, runDate]);

  // Соберём creatorId для отображения имён/аватаров
  const creatorIds = useMemo(() => {
    return filteredRuns
      .map((r: any) => (typeof r.creatorId === 'number' ? r.creatorId : parseCreatorIdFromFallback(r.fullName)))
      .filter((x): x is number => Number.isFinite(x));
  }, [filteredRuns]);

  const vkProfiles = useVkUsers(creatorIds);

  // PREFETCH деталей пробежки
  const prefetchRunById = usePrefetch('getRunById', { ifOlderThan: 60 });

  const [activeModal, setActiveModal] = useState<ModalId>(null);
  const close = () => setActiveModal(null);

  const applyFilters = () => {
    // локальная фильтрация — достаточно закрыть модалку
    close();
  };

  const resetFilters = () => {
    setDistanceStr('');
    setPace('');
    setRunDate('');
  };

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

  const modalRoot = (
    <ModalRoot activeModal={activeModal} onClose={close}>
      <ModalPage id="filters" onClose={close} header={<Header>Фильтры</Header>}>
        <Group>
          <FormItem top="Дата пробежки">
            <Input
              type="date"
              value={runDate}
              onChange={(e) => setRunDate((e.target as HTMLInputElement).value)}
            />
          </FormItem>

          <FormItem top="Дистанция (км) — точное совпадение">
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Например: 5"
              value={distanceStr}
              onChange={(e) => setDistanceStr(e.target.value)}
            />
          </FormItem>

          <FormItem top="Темп бега">
            <CustomSelect
              placeholder="Выберите темп"
              options={PACE_OPTIONS}
              value={pace}
              onChange={(e) => setPace((e.target as HTMLSelectElement).value)}
              allowClearButton
            />
          </FormItem>

          <Spacing size={12} />
          <ButtonGroup mode="vertical" align="center" gap="s">
            <Button size="l" appearance="accent" onClick={applyFilters}>
              Применить
            </Button>
            <Button size="l" mode="secondary" onClick={resetFilters}>
              Сбросить
            </Button>
            <Button size="l" mode="tertiary" onClick={close}>
              Закрыть
            </Button>
          </ButtonGroup>
        </Group>
      </ModalPage>

      <ModalCard id="modal2" onClose={close}>
        <Placeholder
          action={
            <ButtonGroup mode="vertical" align="center">
              <Button onClick={() => setActiveModal('filters')}>Вернуться к фильтрам</Button>
              <Button onClick={close}>Закрыть</Button>
            </ButtonGroup>
          }
        />
      </ModalCard>
    </ModalRoot>
  );

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
            onChange={(e) => setCityName((e.target as HTMLSelectElement).value)}
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
          <Caption level="1">Выбери с кем бежать!</Caption>
        </SimpleCell>

        <Spacing size="m" />

        {isLoading && (
          <Card mode="shadow"><RichCell multiline>Загрузка…</RichCell></Card>
        )}

        {isError && (
          <Card mode="shadow"><RichCell multiline>Не удалось получить данные с сервера</RichCell></Card>
        )}

        {!isLoading && !isError && filteredRuns.length === 0 && (
          <Card mode="shadow"><RichCell multiline>Пока пусто. Попробуй изменить фильтры.</RichCell></Card>
        )}

        {filteredRuns.map((r: any) => {
          const vkId: number | undefined =
            typeof r.creatorId === 'number' ? r.creatorId : parseCreatorIdFromFallback(r.fullName);

          const profile = vkId ? vkProfiles[vkId] : undefined;
          const fullName = profile?.fullName || r.fullName;
          const avatar = profile?.avatarUrl || r.avatarUrl;

          const openDetails = () => {
            prefetchRunById(String(r.id));
            routeNavigator.push(`/run/${String(r.id)}`);
          };

          return (
            <Card key={r.id} mode="shadow" style={{ marginTop: 8 }} onClick={openDetails}>
              <RichCell
                before={<Avatar size={48} src={avatar} fallbackIcon={<Icon24User />} />}
                subtitle={[r.cityDistrict, formatDate(r.dateISO)].filter(Boolean).join(' • ')}
                extraSubtitle={[
                  r.distanceKm ? `${r.distanceKm} км` : null,
                  r.pace ? `${r.pace}` : null,
                ].filter(Boolean).join(' • ')}
                multiline
              >
                {r.title} — {fullName}
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
