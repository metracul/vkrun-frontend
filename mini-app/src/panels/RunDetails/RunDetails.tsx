import { FC, useEffect, useMemo, useState } from 'react';
import {
  Panel,
  PanelHeader,
  Group,
  Card,
  RichCell,
  Spacing,
  Avatar,
  Placeholder,
  Button,
  SimpleCell,
  Header,
  PanelHeaderBack,
  Caption,
  NavIdProps,
  Subhead,
} from '@vkontakte/vkui';
import { Icon24User } from '@vkontakte/icons';
import { useRouteNavigator, useParams } from '@vkontakte/vk-mini-apps-router';
import { useGetRunByIdQuery, useJoinRunMutation, useLeaveRunMutation } from '../../store/runnersApi';
import { useVkUsers } from '../../hooks/useVkUsers';
import { useAppSelector } from '../../store/hooks';

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
  const s = pace.trim().toLowerCase();

  // m:ss  | mm:ss | с разделителями : ' ’ ′ и необязательным "мин/км" или "/км"
  const m = s.match(/^(\d{1,2})[:’'′](\d{1,2})(?:\s*(?:мин)?\s*\/?\s*км)?$/i);
  if (!m) return undefined;

  const min = Number(m[1]);
  const sec = Number(m[2]);
  if (!Number.isFinite(min) || !Number.isFinite(sec) || sec >= 60) return undefined;

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

  const { data, isLoading, isError, refetch } = useGetRunByIdQuery(runId!, { skip: !runId });

  const [joinRun, { isLoading: isJoining }] = useJoinRunMutation();
  const [leaveRun, { isLoading: isLeaving }] = useLeaveRunMutation();

  // мой vk user id из стора
  const myVkId = useAppSelector((s) => s.user.data?.id);

  // ids для профилей: создатель + участники
  const creatorVkId = data?.creatorVkId;
  const participantVkIds = useMemo(() => (data?.participants?.map((p) => p.vkUserId) ?? []), [data?.participants]);

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
    if (!data) return '—';

    const paceSec = parsePaceToSec(data.pace);
    if (!paceSec) return '—';

    // distance может прийти строкой и/или с запятой
    const raw = data.distanceKm as unknown;
    const distKm =
      typeof raw === 'number' ? raw :
      typeof raw === 'string' ? Number(raw.replace(',', '.')) :
      NaN;

    if (!Number.isFinite(distKm) || distKm <= 0) return '—';

    const totalMin = (distKm * paceSec) / 60;
    return minutesToHhMm(totalMin);
  }, [data?.distanceKm, data?.pace]);

  // локальный флаг участия
  const serverParticipant = useMemo(() => {
    if (!myVkId) return false;
    return participantVkIds.includes(myVkId);
  }, [participantVkIds, myVkId]);

  const [localParticipant, setLocalParticipant] = useState<boolean>(serverParticipant);
  useEffect(() => setLocalParticipant(serverParticipant), [serverParticipant]);

  // Вспомогательные вычисления для создателя
  const creatorNameBase = creatorProfile?.fullName || 'Получаю данные…';
  const creatorName = creatorProfile?.nameSuffix
    ? `${creatorNameBase} · ${creatorProfile.nameSuffix}`
    : creatorNameBase;

  const creatorHref = (() => {
    if (creatorProfile?.linkUrl) return creatorProfile.linkUrl;
    if (typeof creatorVkId === 'number') return `https://vk.com/id${creatorVkId}`;
    return undefined;
  })();

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.push('/')} />}>
        <Header size="l">Пробежка</Header>
      </PanelHeader>

      <Group>
        {isLoading && (
          <Card mode="shadow">
            <RichCell multiline>Загрузка…</RichCell>
          </Card>
        )}

        {isError && (
          <Placeholder action={<Button mode="secondary" onClick={() => refetch()}>Повторить</Button>}>
            Не удалось получить данные
          </Placeholder>
        )}

        {!isLoading && !isError && !data && <Placeholder>Пробежка не найдена</Placeholder>}

        {!isLoading && !isError && data && (
          <>
            {/* Создатель — клик по карточке открывает профиль или override-ссылку */}
            <Card mode="shadow">
              <RichCell
                Component={creatorHref ? 'a' as const : 'div' as const}
                href={creatorHref}
                target={creatorHref ? '_blank' : undefined}
                rel={creatorHref ? 'noopener noreferrer' : undefined}
                before={
                  <Avatar
                    size={56}
                    src={creatorProfile?.avatarUrl || data.avatarUrl}
                    fallbackIcon={<Icon24User />}
                  />
                }
                multiline
                role={creatorHref ? 'link' : undefined}
                aria-label={creatorHref ? `Открыть профиль: ${creatorName}` : undefined}
              >
                {creatorName}
              </RichCell>
            </Card>

            <Spacing size={16} />

            <Group header={<Header>Информация о пробежке</Header>}>
              <SimpleCell><Caption level="1">Дата</Caption>{formatDate(data.dateISO)}</SimpleCell>
              <SimpleCell><Caption level="1">Время</Caption>{formatTime(data.dateISO)}</SimpleCell>

              {data.notes ? (
                <SimpleCell>
                  <Caption level="1">Описание</Caption>
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {data.notes}
                  </div>
                </SimpleCell>
              ) : null}

              <SimpleCell><Caption level="1">Город</Caption>{cityName || '—'}</SimpleCell>
              <SimpleCell><Caption level="1">Район</Caption>{districtName || '—'}</SimpleCell>
              <SimpleCell><Caption level="1">Темп</Caption>{data.pace || '—'}</SimpleCell>
              <SimpleCell><Caption level="1">Дистанция</Caption>{Number.isFinite(data.distanceKm) ? `${data.distanceKm} км` : '—'}</SimpleCell>
              <SimpleCell><Caption level="1">Длительность</Caption>{durationText}</SimpleCell>
            </Group>

            {/* Участники */}
            <Spacing size={12} />
            <Group header={<Header>Участники ({participantVkIds.length})</Header>}>
              {participantVkIds.length === 0 ? (
                <SimpleCell><Subhead>Пока никого</Subhead></SimpleCell>
              ) : (
                participantVkIds.map((vkId) => {
                  const prof = profilesMap[vkId];
                  const base = prof?.fullName ?? 'Получаю данные…';
                  const name = prof?.nameSuffix ? `${base} · ${prof.nameSuffix}` : base;

                  const href = prof?.linkUrl ?? `https://vk.com/id${vkId}`;

                  return (
                    <SimpleCell
                      key={vkId}
                      Component="a"
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      before={<Avatar size={40} src={prof?.avatarUrl} fallbackIcon={<Icon24User />} />}
                      role="link"
                      aria-label={`Открыть профиль: ${name}`}
                    >
                      {name}
                    </SimpleCell>
                  );
                })
              )}
            </Group>

            <Spacing size={12} />

            {/* Переключение кнопки */}
            {localParticipant ? (
              <Button
                size="l"
                mode="secondary"
                appearance="negative"
                disabled={isLeaving}
                onClick={async () => {
                  await leaveRun(runId!);
                  setLocalParticipant(false);
                  refetch();
                  window.dispatchEvent(new Event('runs:updated'));
                }}
              >
                {isLeaving ? 'Отписываю…' : 'Отписаться'}
              </Button>
            ) : (
              <Button
                size="l"
                appearance="accent"
                disabled={isJoining}
                onClick={async () => {
                  await joinRun(runId!);
                  setLocalParticipant(true);
                  refetch();
                  window.dispatchEvent(new Event('runs:updated'));
                }}
              >
                {isJoining ? 'Записываю…' : 'Побегу'}
              </Button>
            )}

            <Spacing size={16} />
          </>
        )}

        <Button mode="secondary" onClick={() => routeNavigator.push('/')}>
          Назад
        </Button>
      </Group>
    </Panel>
  );
};
