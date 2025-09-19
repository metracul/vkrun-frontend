import { FC, useMemo, useState } from 'react';
import {
  Panel, PanelHeader, Header, Button, Group, Avatar, NavIdProps, ModalRoot, ModalPage, Placeholder, ButtonGroup, ModalCard,
  Card, RichCell, Spacing, SimpleCell, Caption, Footnote, FixedLayout, usePlatform, FormItem, Input, CustomSelect, CustomSelectOption
} from '@vkontakte/vkui';
import { Icon20FilterOutline, Icon24User, Icon28AddCircleOutline, Icon20LocationMapOutline } from '@vkontakte/icons';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { useGetRunsQuery } from '../store/runnersApi';
import { DEFAULT_VIEW_PANELS } from '../routes';

export interface HomeProps extends NavIdProps {}

type ModalId = 'filters' | 'modal2' | null;

const CITY_OPTIONS = [
  { value: 'Москва', label: 'Москва', country: 'Россия' },
  { value: 'Санкт-Петербург', label: 'Санкт-Петербург', country: 'Россия' },
  { value: 'Новосибирск', label: 'Новосибирск', country: 'Россия' },
  { value: 'Краснодар', label: 'Краснодар', country: 'Россия' },
  { value: 'Екатеринбург', label: 'Екатеринбург', country: 'Россия' },
];

// Формируем границы суток в ISO (локальные сутки → UTC ISO)
function dayRangeToIso(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return { from: '', to: '' };
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

function formatDate(dateISO?: string) {
  if (!dateISO) return '';
  const d = new Date(dateISO);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export const Home: FC<HomeProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();
  const platform = usePlatform();
  const isDesktop = platform === 'vkcom';

  // Город — выпадашка на главной. Дефолт: Москва.
  const [cityName, setCityName] = useState<string>('Москва');

  // Остальные фильтры (в модалке)
  const [distanceStr, setDistanceStr] = useState<string>(''); // км (строка)
  const [pace, setPace] = useState<string>('');               // пока не отправляем
  const [runDate, setRunDate] = useState<string>('');         // YYYY-MM-DD: одна дата

  // Собираем фильтры под бэкенд
  const filters = useMemo(() => {
    const f: Record<string, string | number> = {};

    if (cityName.trim()) f.cityName = cityName.trim();

    const km = Number(distanceStr.replace(',', '.'));
    if (!Number.isNaN(km) && distanceStr.trim() !== '') f.kmFrom = km;

    // Одна дата → весь день: [00:00:00.000; 23:59:59.999]
    if (runDate) {
      const { from, to } = dayRangeToIso(runDate);
      if (from && to) {
        f.dateFrom = from;
        f.dateTo = to;
      }
    }

    return f;
  }, [cityName, distanceStr, runDate]);

  // Грузим список
  const { data, isLoading, isError, refetch, isFetching } = useGetRunsQuery({
    endpoint: '/api/v1/runs',
    size: 20,
    filters,
  });

  const runs = data?.items ?? [];

  const [activeModal, setActiveModal] = useState<ModalId>(null);
  const close = () => setActiveModal(null);

  const applyFilters = () => {
    close();
    refetch();
  };

  const resetFilters = () => {
    setDistanceStr('');
    setPace('');
    setRunDate('');
    refetch();
  };

  const modalRoot = (
    <ModalRoot activeModal={activeModal} onClose={close}>
      <ModalPage id="filters" onClose={close} header={<Header>Фильтры</Header>}>
        <Group>
          {/* Город выбрасываем на главную, в модалке — остальные поля */}

          <FormItem top="Дата пробежки">
            <Input
              type="date"
              value={runDate}
              onChange={(e) => setRunDate((e.target as HTMLInputElement).value)}
            />
          </FormItem>

          <FormItem top="Дистанция (км)">
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Например: 5"
              value={distanceStr}
              onChange={(e) => setDistanceStr(e.target.value)}
            />
          </FormItem>

          <FormItem top="Темп бега">
            <Input
              placeholder="Например: 5:30 /км"
              value={pace}
              onChange={(e) => setPace(e.target.value)}
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
            style={{ width: 200 }} // фиксированная ширина
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

        {!isLoading && !isError && runs.length === 0 && (
          <Card mode="shadow"><RichCell multiline>Пока пусто. Попробуй изменить фильтры.</RichCell></Card>
        )}

        {runs.map((r: any) => (
          <Card key={r.id} mode="shadow" style={{ marginTop: 8 }}>
            <RichCell
              before={<Avatar size={48} src={r.avatarUrl} fallbackIcon={<Icon24User />} />}
              subtitle={[r.cityDistrict, formatDate(r.dateISO)].filter(Boolean).join(' • ')}
              extraSubtitle={[
                r.distanceKm ? `${r.distanceKm} км` : null,
                r.pace ? `${r.pace}` : null,
              ].filter(Boolean).join(' • ')}
              multiline
            >
              {r.title} — {r.fullName}
              {r.notes ? <Footnote style={{ marginTop: 4 }}>{r.notes}</Footnote> : null}
            </RichCell>
          </Card>
        ))}

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
