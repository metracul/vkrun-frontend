import { useEffect, useMemo, useState } from 'react';
import { useParams } from '@vkontakte/vk-mini-apps-router';
import { useGetRunByIdQuery, useJoinRunMutation, useLeaveRunMutation } from '../../../store/runnersApi';
import { useVkUsers } from '../../../hooks/useVkUsers';
import { useAppSelector } from '../../../store/hooks';
import { formatDate } from '../../../utils';
import { parseNumberOrUndefined } from '../../../utils';
import { tolerantParsePaceToSec, formatTime } from './utils';

type Params = { id: string };

export function useRunDetails() {
  const params = useParams<'id'>() as unknown as Params | undefined;
  const runId = params?.id;

  const { data, isLoading, isError, refetch } = useGetRunByIdQuery(runId!, { skip: !runId });

  const [joinRun, { isLoading: isJoining }] = useJoinRunMutation();
  const [leaveRun, { isLoading: isLeaving }] = useLeaveRunMutation();

  const myVkId = useAppSelector((s) => s.user.data?.id);

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

  const { cityName, districtName } = useMemo(() => {
    const cd = data?.cityDistrict || '';
    const [city, district] = cd.split(',').map((s) => s.trim());
    return { cityName: city || '', districtName: district || '' };
  }, [data?.cityDistrict]);

  const durationText = useMemo(() => {
    if (!data) return '—';
    const paceSec = tolerantParsePaceToSec(data.pace);
    if (!paceSec) return '—';

    const distKm =
      typeof data.distanceKm === 'number'
        ? data.distanceKm
        : typeof data.distanceKm === 'string'
          ? parseNumberOrUndefined(data.distanceKm)
          : undefined;

    if (!distKm || distKm <= 0) return '—';

    const totalMin = (distKm * paceSec) / 60;
    const h = Math.floor(totalMin / 60);
    const m = Math.round(totalMin % 60);
    return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
  }, [data?.distanceKm, data?.pace]);

  const serverParticipant = useMemo(() => {
    if (!myVkId) return false;
    return participantVkIds.includes(myVkId);
  }, [participantVkIds, myVkId]);

  const [localParticipant, setLocalParticipant] = useState<boolean>(serverParticipant);
  useEffect(() => setLocalParticipant(serverParticipant), [serverParticipant]);

  const creatorNameBase = creatorProfile?.fullName || 'Получаю данные…';
  const creatorName = creatorProfile?.nameSuffix
    ? `${creatorNameBase} · ${creatorProfile.nameSuffix}`
    : creatorNameBase;

  const creatorHref = (() => {
    if (creatorProfile?.linkUrl) return creatorProfile.linkUrl;
    if (typeof creatorVkId === 'number') return `https://vk.com/id${creatorVkId}`;
    return undefined;
  })();

  const onLeave = async () => {
    await leaveRun(runId!);
    setLocalParticipant(false);
    refetch();
    window.dispatchEvent(new Event('runs:updated'));
  };

  const onJoin = async () => {
    await joinRun(runId!);
    setLocalParticipant(true);
    refetch();
    window.dispatchEvent(new Event('runs:updated'));
  };

  return {
    isLoading,
    isError,
    data,
    refetch,

    creatorCard: {
      creatorName,
      creatorHref,
      avatarUrl: creatorProfile?.avatarUrl || data?.avatarUrl,
    },

    info: {
      date: formatDate(data?.dateISO),
      time: formatTime(data?.dateISO),
      notes: data?.notes || '',
      cityName,
      districtName,
      pace: data?.pace || '—',
      distance:
        Number.isFinite(
          typeof data?.distanceKm === 'number'
            ? data?.distanceKm
            : Number((data?.distanceKm as any) ?? NaN)
        ) && data?.distanceKm !== undefined
          ? `${data?.distanceKm} км`
          : '—',
      durationText,
    },

    participants: {
      count: participantVkIds.length,
      items: participantVkIds.map((vkId) => {
        const prof = profilesMap[vkId];
        const base = prof?.fullName ?? 'Получаю данные…';
        const name = prof?.nameSuffix ? `${base} · ${prof.nameSuffix}` : base;
        const href = prof?.linkUrl ?? `https://vk.com/id${vkId}`;
        return {
          vkId,
          name,
          href,
          avatarUrl: prof?.avatarUrl,
        };
      }),
    },

    actions: {
      localParticipant,
      isJoining,
      isLeaving,
      buttonLabel: localParticipant ? (isLeaving ? 'Отписываю…' : 'Отписаться') : (isJoining ? 'Записываю…' : 'Побегу'),
      buttonMode: localParticipant ? 'leave' as const : 'join' as const,
      button: null as any, // собирается в UI-слое
      onJoin,
      onLeave,
    },
  };
}
