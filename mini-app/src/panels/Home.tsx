import { FC, useMemo, useState } from 'react';
import {
  Panel, PanelHeader, Header, Button, Group, Avatar, NavIdProps, ModalRoot, ModalPage, Placeholder, ButtonGroup, ModalCard,
  Card, RichCell, Spacing, SimpleCell, Caption, Footnote, FixedLayout, usePlatform, FormItem, Input,
} from '@vkontakte/vkui';
import { Icon20FilterOutline, Icon24User, Icon28AddCircleOutline } from '@vkontakte/icons';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { useGetRunsQuery } from '../store/runnersApi';
import { DEFAULT_VIEW_PANELS } from '../routes';

export interface HomeProps extends NavIdProps {}

type ModalId = 'filters' | 'modal2' | null;

export const Home: FC<HomeProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();
  const platform = usePlatform();
  const isDesktop = platform === 'vkcom';

  // Локальные поля формы фильтров
  const [city, setCity] = useState<string>('');
  const [distanceStr, setDistanceStr] = useState<string>(''); // храним как строку, перед запросом конвертируем
  const [pace, setPace] = useState<string>('');

  // Собираем объект filters только из непустых значений
  const filters = useMemo(() => {
    const f: Record<string, string | number> = {};
    if (city.trim()) f.city = city.trim();
    const km = Number(distanceStr.replace(',', '.'));
    if (!Number.isNaN(km) && distanceStr.trim() !== '') f.minKm = km; // пример: используем ключ minKm
    if (pace.trim()) f.pace = pace.trim();
    return f;
  }, [city, distanceStr, pace]);

  // Пример: грузим из /runs с лимитом 20; фильтры пробрасываются из стейта
  const { data, isLoading, isError, refetch, isFetching } = useGetRunsQuery({
    endpoint: '/runs',
    limit: 20,
    filters,
  });

  const runs = data?.items ?? [];

  const [activeModal, setActiveModal] = useState<ModalId>(null);
  const close = () => setActiveModal(null);

  const applyFilters = () => {
    // Достаточно закрыть модалку — useGetRunsQuery уже подписан на изменения filters (через стейт)
    close();
    // На всякий случай можно принудительно обновить:
    refetch();
  };

  const resetFilters = () => {
    setCity('');
    setDistanceStr('');
    setPace('');
    // После сброса фильтров произойдёт новый запрос; можно дернуть refetch
    refetch();
  };

  const modalRoot = (
    <ModalRoot activeModal={activeModal} onClose={close}>
      <ModalPage id="filters" onClose={close} header={<Header>Фильтры</Header>}>
        <Group>
          <FormItem top="Город">
            <Input
              placeholder="Например: Москва"
              value={city}
              onChange={(e) => setCity(e.target.value)}
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

      {/* Оставил пример второй карточки, если понадобится */}
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

      {/* Модалки можно держать на этом уровне */}
      {modalRoot}

      <Group header={<Header size="s">Список пробежек</Header>}>
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

            {/* На desktop размещаем кнопку рядом с "Обновить" */}
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
              onClick={() => {
                // routeNavigator.push(`/run/${r.id}`)
              }}
            >
              {r.title} — {r.fullName}
              {r.notes ? <Footnote style={{ marginTop: 4 }}>{r.notes}</Footnote> : null}
            </RichCell>
          </Card>
        ))}

        {/* Отступ снизу только на мобильных, чтобы FAB не перекрывал контент */}
        {!isDesktop && <Spacing size={72} />}
      </Group>

      {/* Плавающая кнопка только на мобильных */}
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

function formatDate(dateISO?: string) {
  if (!dateISO) return '';
  const d = new Date(dateISO);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}
