import { FC } from 'react';
import {
  Panel, PanelHeader, Group, Placeholder, Card, RichCell, Spacing, Avatar, Footnote, Button,
} from '@vkontakte/vkui';
import { Icon24User } from '@vkontakte/icons';
import { NavIdProps } from '@vkontakte/vkui';
import { useRouteNavigator, useParams } from '@vkontakte/vk-mini-apps-router';
import { useGetRunByIdQuery } from '../store/runnersApi';
import { DEFAULT_VIEW_PANELS } from '../routes';

function formatDate(dateISO?: string) {
  if (!dateISO) return '';
  const d = new Date(dateISO);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export const RunDetails: FC<NavIdProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();
  const params = useParams<'id'>();
  const runId = params?.id;

  const { data, isLoading, isError, refetch } = useGetRunByIdQuery(runId!, {
    skip: !runId,
  });

  return (
    <Panel id={id}>
      <PanelHeader delimiter="auto">Пробежка</PanelHeader>

      <Group>
        {isLoading && (
          <Card mode="shadow"><RichCell multiline>Загрузка…</RichCell></Card>
        )}

        {isError && (
          <Placeholder action={<Button mode="secondary" onClick={() => refetch()}>Повторить</Button>}>
            Не удалось получить данные
          </Placeholder>
        )}

        {!isLoading && !isError && !data && (
          <Placeholder>Пробежка не найдена</Placeholder>
        )}

        {!isLoading && !isError && data && (
          <>
            <Card mode="shadow">
              <RichCell
                before={<Avatar size={56} src={data.avatarUrl} fallbackIcon={<Icon24User />} />}
                subtitle={[data.cityDistrict, formatDate(data.dateISO)].filter(Boolean).join(' • ')}
                extraSubtitle={[
                  data.distanceKm ? `${data.distanceKm} км` : null,
                  data.pace ? `${data.pace}` : null,
                ].filter(Boolean).join(' • ')}
                multiline
              >
                {data.title} — {data.fullName}
                {data.notes ? <Footnote style={{ marginTop: 4 }}>{data.notes}</Footnote> : null}
              </RichCell>
            </Card>

            <Spacing size={16} />
            {/* Здесь при необходимости можно добавить действия: записаться, чат и т.п. */}
          </>
        )}

        <Spacing size={16} />
        <Button mode="secondary" onClick={() => routeNavigator.push(DEFAULT_VIEW_PANELS.HOME)}>
          Назад
        </Button>
      </Group>
    </Panel>
  );
};
