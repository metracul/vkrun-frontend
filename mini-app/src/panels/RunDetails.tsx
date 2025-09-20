import { FC, useMemo, useState } from 'react';
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
  Subhead,
} from '@vkontakte/vkui';
import { Icon24User } from '@vkontakte/icons';
import { useRouteNavigator, useParams } from '@vkontakte/vk-mini-apps-router';
import { useGetRunByIdQuery, useJoinRunMutation } from '../store/runnersApi';
import { useVkUsers } from '../hooks/useVkUsers';
import { useAppSelector } from '../store/hooks';

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

// "M:SS /км" -> секунд/км
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

  const [joinRun, { isLoading: isJoining }] = useJoinRunMutation();
  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // мой vk user id из стора
  const myVkId = useAppSelector((s) => s.user.data?.id);

  // ids для профилей: создатель + участники
  const creatorVkId = data?.creatorVkId;
  const participantVkIds = useMemo(
    () => (data?.participants?.map((p) => p.vkUserId) ?? []),
    [data?.participants]
  );

  const allVkIds = useMemo(() => {
    const set = new Set<number>();
    if (typeof creatorVkId === 'number') set.add(creatorVkId);
    for (const id of participantVkIds) if (Number.isFinite(id)) set.add(id);
    return Array.from(set.values());
  }, [creatorVkId, participantVkIds]);

  const appId = Number(import.meta.env.VITE_VK_APP_ID);
  const profilesMap = useVkUsers(allVkIds, appId);

  const creatorProfile = typeof creatorVkId === 'number' ? profilesMap[creatorVkId] : undefined;

  // город / район
  const { cityName, districtName } = useMemo(() => {
    const cd = data?.cityDistrict || '';
    const [city, district] = cd.split(',').map((s) => s.trim());
    return { cityName: city || '', districtName: district || '' };
  }, [data?.cityDistrict]);

  // длительность = distance * pace
  const durationText = useMemo(() => {
    if (!data?.distanceKm || !data?.pace) return '—';
    const paceSec = parsePaceToSec(data.pace);
    if (!paceSec) return '—';
    const totalMin = (data.distanceKm * paceSec) / 60;
    return minutesToHhMm(totalMin);
  }, [data?.distanceKm, data?.pace]);

  const alreadyParticipant = useMemo(() => {
    if (!myVkId) return false;
    return participantVkIds.includes(myVkId);
  }, [participantVkIds, myVkId]);

  const onJoin = async () => {
    setJoinError(null);
    if (!runId) return;
    try {
      await joinRun(runId).unwrap();
      setJoined(true);
      refetch();
      window.dispatchEvent(new Event('runs:updated'));
    } catch (e: any) {
      setJoinError(e?.data?.error || 'Не удалось записаться');
    }
  };

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

            {/* Участники */}
            <Spacing size={12} />
            <Group header={<Header>Участники ({participantVkIds.length})</Header>}>
              {participantVkIds.length === 0 ? (
                <SimpleCell>
                  <Subhead>Пока никого</Subhead>
                </SimpleCell>
              ) : (
                participantVkIds.map((vkId) => {
                  const prof = profilesMap[vkId];
                  const name = prof?.fullName ?? 'Получаю данные…'; // ← без засвета vkId
                  return (
                    <SimpleCell
                      key={vkId}
                      before={
                        <Avatar
                          size={40}
                          src={prof?.avatarUrl}
                          fallbackIcon={<Icon24User />}
                        />
                      }
                    >
                      {name}
                    </SimpleCell>
                  );
                })
              )}
            </Group>

            <Spacing size={12} />

            {/* Кнопка записи */}
            <Button
              size="l"
              appearance="accent"
              disabled={isJoining || joined || alreadyParticipant}
              onClick={onJoin}
            >
              {alreadyParticipant || joined
                ? 'Вы записаны'
                : isJoining
                ? 'Записываю…'
                : 'Побегу'}
            </Button>

            {joinError && (
              <>
                <Spacing size={8} />
                <Footnote style={{ color: 'var(--vkui--color_text_negative)' }}>
                  {joinError}
                </Footnote>
              </>
            )}

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
