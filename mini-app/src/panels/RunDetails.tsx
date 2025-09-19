// src/panels/RunDetails.tsx
import { FC, useMemo } from 'react';
import {
  Panel,
  PanelHeader,
  Group,
  Card,
  RichCell,
  Spacing,
  Avatar,
  Footnote,
  Placeholder,
  Button,
  SimpleCell,
  Header,
  Caption,
  NavIdProps,
} from '@vkontakte/vkui';
import { Icon24User } from '@vkontakte/icons';
import { useRouteNavigator, useParams } from '@vkontakte/vk-mini-apps-router';
import { useGetRunByIdQuery } from '../store/runnersApi';
import { useVkUsers } from '../hooks/useVkUsers';

// --- utils ---
function formatDate(dateISO?: string) {
  if (!dateISO) return '';
  const d = new Date(dateISO);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function formatTime(dateISO?: string) {
  if (!dateISO) return '';
  const d = new Date(dateISO);
  if (isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// ожидаем плейсхолдер "id{vkId}" в RunCard.fullName
function parseVkIdFromFullName(fullName?: string): number | undefined {
  if (!fullName) return undefined;
  const m = /^id(\d+)$/.exec(fullName.trim());
  return m ? Number(m[1]) : undefined;
}

// "M:SS /км" -> секунд/км (терпимо к пробелам и суффиксу)
function parsePaceToSec(pace?: string): number | undefined {
  if (!pace) return undefined;
  const m = /^\s*(\d+):(\d{2})(?:\s*\/?\s*км)?\s*$/i.exec(pace.trim());
  if (!m) return undefined;
  const min = Number(m[1]);
  const sec = Number(m[2]);
  if (Number.isNaN(min) || Number.isNaN(sec)) return undefined;
  return min * 60 + sec;
}

function minutesToHhMm(totalMin?: number) {
  if (totalMin == null || totalMin <= 0) return '—';
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
}

export const RunDetails: FC<NavIdProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();
  const params = useParams<'id'>();
  const runId = params?.id as string | undefined;

  const { data, isLoading, isError, refetch } = useGetRunByIdQuery(runId!, {
    skip: !runId,
});

  // 1) из fullName достаём VK ID создателя (строго по шаблону "id{vkId}")
  const creatorVkId = useMemo(
    () => parseVkIdFromFullName(data?.fullName),
    [data?.fullName]
  );

  // 2) грузим профиль через ваш useVkUsers(userIds, appId)
  const appId = Number(import.meta.env.VITE_VK_APP_ID);
  const profilesMap = useVkUsers(creatorVkId ? [creatorVkId] : [], appId);
  const creatorProfile = creatorVkId ? profilesMap[creatorVkId] : undefined;

  // 3) город и район из объединённого поля "Москва, Центральный"
  const { cityName, districtName } = useMemo(() => {
    const cd = data?.cityDistrict || '';
    const [city, district] = cd.split(',').map((s) => s.trim());
    return { cityName: city || '', districtName: district || '' };
  }, [data?.cityDistrict]);

  // 4) длительность считаем как distanceKm * pace
  const durationText = useMemo(() => {
    if (!data?.distanceKm || !data?.pace) return '—';
    const paceSec = parsePaceToSec(data.pace);
    if (!paceSec) return '—';
    const totalMin = (data.distanceKm * paceSec) / 60;
    return minutesToHhMm(totalMin);
  }, [data?.distanceKm, data?.pace]);

  return (
    <Panel id={id}>
      <PanelHeader delimiter="auto">Пробежка</PanelHeader>

      <Group>
        {isLoading && (
          <Card mode="shadow"><RichCell multiline>Загрузка…</RichCell></Card>
        )}

        {isError && (
          <Placeholder
            action={<Button mode="secondary" onClick={() => refetch()}>Повторить</Button>}
          >
            Не удалось получить данные
          </Placeholder>
        )}

        {!isLoading && !isError && !data && (
          <Placeholder>Пробежка не найдена</Placeholder>
        )}

        {!isLoading && !isError && data && (
          <>
            {/* Аватар + имя/фамилия создателя */}
            <Card mode="shadow">
              <RichCell
                before={
                  <Avatar
                    size={56}
                    src={creatorProfile?.avatarUrl || data.avatarUrl}
                    fallbackIcon={<Icon24User />}
                  />
                }
                multiline
              >
                {creatorProfile?.fullName || data.fullName}
                {data.notes ? <Footnote style={{ marginTop: 4 }}>{data.notes}</Footnote> : null}
              </RichCell>
            </Card>

            <Spacing size={16} />

            <Group header={<Header>Информация о пробежке</Header>}>
              <SimpleCell>
                <Caption level="1">Дата</Caption>
                {formatDate(data.dateISO)}
              </SimpleCell>
              <SimpleCell>
                <Caption level="1">Время</Caption>
                {formatTime(data.dateISO)}
              </SimpleCell>
              {data.notes ? (
                <SimpleCell>
                  <Caption level="1">Описание</Caption>
                  {data.notes}
                </SimpleCell>
              ) : null}
              <SimpleCell>
                <Caption level="1">Город</Caption>
                {cityName || '—'}
              </SimpleCell>
              <SimpleCell>
                <Caption level="1">Район</Caption>
                {districtName || '—'}
              </SimpleCell>
              <SimpleCell>
                <Caption level="1">Темп</Caption>
                {data.pace || '—'}
              </SimpleCell>
              <SimpleCell>
                <Caption level="1">Дистанция</Caption>
                {Number.isFinite(data.distanceKm) ? `${data.distanceKm} км` : '—'}
              </SimpleCell>
              <SimpleCell>
                <Caption level="1">Длительность</Caption>
                {durationText}
              </SimpleCell>
            </Group>

            <Spacing size={16} />
          </>
        )}

        <Button mode="secondary" onClick={() => routeNavigator.back()}>
          Назад
        </Button>
      </Group>
    </Panel>
  );
};
