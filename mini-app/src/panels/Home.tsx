import { FC } from 'react';
import {
  Panel, PanelHeader, Header, Button, Group, Avatar, NavIdProps,
  Card, RichCell, Spacing, SimpleCell, Caption, Footnote, FixedLayout, usePlatform,
} from '@vkontakte/vkui';
import { Icon20FilterOutline, Icon24User, Icon28AddCircleOutline } from '@vkontakte/icons';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { useGetRunsQuery } from '../store/runnersApi';
import { DEFAULT_VIEW_PANELS } from '../routes';

export interface HomeProps extends NavIdProps {}

export const Home: FC<HomeProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();
  const platform = usePlatform();
  const isDesktop = platform === 'vkcom';

  // Пример: грузим из /runs с лимитом 20; сюда же можно пробросить filters
  const { data, isLoading, isError, refetch, isFetching } = useGetRunsQuery({
    endpoint: '/runs',
    limit: 20,
    // filters: { city: 'Москва', minKm: 5 }
  });

  const runs = data?.items ?? [];

  return (
    <Panel id={id}>
      <PanelHeader delimiter="auto">
        <Header size="l">Поиск пробежки</Header>
      </PanelHeader>

      <Group header={<Header size="s">Список пробежек</Header>}>
        <Spacing size="m" />
        <SimpleCell>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              appearance="accent"
              mode="outline"
              after={<Icon20FilterOutline />}
              onClick={() => routeNavigator.push(DEFAULT_VIEW_PANELS.PERSIK)}
            >
              Фильтры
            </Button>
            <Button mode="secondary" onClick={() => refetch()} disabled={isFetching}>
              Обновить
            </Button>

            {/* На desktop размещаем кнопку в одной линии рядом с "Обновить" */}
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

        {/* Отступ снизу нужен только на мобильных, чтобы FAB не перекрывал контент */}
        {!isDesktop && <Spacing size={72} />}
      </Group>

      {/* На мобильных сохраняем плавающую кнопку в правом нижнем углу */}
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
