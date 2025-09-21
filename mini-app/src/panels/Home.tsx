// src/panels/Home.tsx
import { FC, useMemo, useState, useEffect, useRef } from 'react';
import {
  Panel, PanelHeader, Header, Button, Group, Avatar, NavIdProps, ModalRoot, ModalPage, Placeholder, ButtonGroup,
  Card, RichCell, Spacing, SimpleCell, Caption, Footnote, FixedLayout, usePlatform, FormItem, Input, CustomSelect, CustomSelectOption
} from '@vkontakte/vkui';
import { Icon20FilterOutline, Icon24User, Icon28AddCircleOutline, Icon20LocationMapOutline } from '@vkontakte/icons';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { useGetRunsQuery, usePrefetch, useDeleteRunMutation } from '../store/runnersApi';
import { useAppSelector } from '../store/hooks';
import { DEFAULT_VIEW_PANELS } from '../routes';
import bridge from '@vkontakte/vk-bridge';

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

// --- VK users.get хук ---
type VkUser = { id: number; first_name: string; last_name: string; photo_200?: string; photo_100?: string; };
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
          const { access_token } = await bridge.send('VKWebAppGetAuthToken', { app_id: appId, scope: '' });
          tokenRef.current = access_token;
        }
        const access_token = tokenRef.current!;
        const batches = chunk(missing, 100);

        const next: Record<number, VkProfile> = {};
        for (const batch of batches) {
          const resp = await bridge.send('VKWebAppCallAPIMethod', {
            method: 'users.get',
            params: { user_ids: batch.join(','), fields: 'photo_200,photo_100', v: '5.199', access_token }
          });
          const users: VkUser[] = resp?.response || [];
          for (const u of users) {
            next[u.id] = { fullName: `${u.first_name} ${u.last_name}`.trim(), avatarUrl: u.photo_200 || u.photo_100 };
          }
        }
        if (!cancelled && Object.keys(next).length) setMap((prev) => ({ ...prev, ...next }));
      } catch (e) { console.warn('users.get via vk-bridge failed', e); }
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

  // мой VK id для проверки прав удаления
  const myVkId = useAppSelector((s) => s.user.data?.id);

  // фильтры
  const [cityName, setCityName] = useState<string>('Москва');
  const [distanceFromStr, setDistanceFromStr] = useState<string>(''); // "От"
  const [distanceToStr, setDistanceToStr] = useState<string>('');     // "До"
  const [pace, setPace] = useState<string>('');
  const [runDate, setRunDate] = useState<string>('');

  // собираем фильтры под бэкенд
  const filters = useMemo(() => {
    const f: Record<string, string | number> = {};
    if (cityName.trim()) f.cityName = cityName.trim();

    const kmFrom = distanceFromStr.trim() === '' ? NaN : Number(distanceFromStr.replace(',', '.'));
    const kmTo   = distanceToStr.trim() === '' ? NaN : Number(distanceToStr.replace(',', '.'));
    if (!Number.isNaN(kmFrom)) f.kmFrom = kmFrom;
    if (!Number.isNaN(kmTo))   f.kmTo   = kmTo;

    const ps = parsePaceToSec(pace);
    if (ps != null) { f.paceFrom = ps; f.paceTo = ps; }

    if (runDate) {
      const d = new Date(runDate);
      const from = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
      const to   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();
      f.dateFrom = from; f.dateTo = to;
    }
    return f;
  }, [cityName, distanceFromStr, distanceToStr, pace, runDate]);

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

  const vkProfiles = useVkUsers(creatorIds);
  const prefetchRunById = usePrefetch('getRunById', { ifOlderThan: 60 });

  const [activeModal, setActiveModal] = useState<ModalId>(null);
  const close = () => setActiveModal(null);
  const applyFilters = () => { close(); refetch(); };

  const resetFilters = () => {
    setDistanceFromStr('');
    setDistanceToStr('');
    setPace('');
    setRunDate('');
    refetch();
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
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="От"
                value={distanceFromStr}
                onChange={(e) => setDistanceFromStr(e.target.value)}
              />
              <Input
                type="text"
                inputMode="decimal"
                placeholder="До"
                value={distanceToStr}
                onChange={(e) => setDistanceToStr(e.target.value)}
              />
            </div>
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
            <Button appearance="accent" mode="outline" after={<Icon20FilterOutline />} onClick={() => setActiveModal('filters')}>
              Фильтры
            </Button>
            <Button mode="secondary" onClick={() => refetch()} disabled={isFetching}>
              Обновить
            </Button>
            {isDesktop && (
              <Button mode="primary" before={<Icon28AddCircleOutline />}
                onClick={() => routeNavigator.push(DEFAULT_VIEW_PANELS.CREATE)}>
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

          // Имя и аватар:
          const fullName = profile?.fullName ?? (vkId ? 'Получаю данные…' : '');
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
                    {/* Кнопка — в правом нижнем углу */}
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
                          onClick={onDeleteClick} // внутри onDeleteClick уже есть e.stopPropagation()
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
                      // резерв места под кнопку, чтобы текст не наезжал
                      style={{
                        paddingRight: 96,   // ~ ширина кнопки + отступ
                        paddingBottom: 44,  // ~ высота кнопки + отступ
                      }}
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
