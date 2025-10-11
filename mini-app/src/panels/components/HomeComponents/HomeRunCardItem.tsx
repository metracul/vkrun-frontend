import { FC, useMemo, useState, useEffect } from 'react';
import { Card, Avatar, Snackbar } from '@vkontakte/vkui';
import { Icon24User, Icon12ErrorCircleFillYellow } from '@vkontakte/icons';
import { formatDate } from '../../../utils';
import { useAppSelector } from '../../../store/hooks';
import {
  useJoinRunMutation,
  useLeaveRunMutation,
  useGetRunByIdQuery,
  type JoinRunResponse,
} from '../../../store/runnersApi';
import { ActionButton } from '../../../components/ActionButton';
import '../HomeComponentsCss/HomeRunCardItem.css';

type Profile = { fullName?: string; nameSuffix?: string; avatarUrl?: string };

type Props = {
  run: any;
  profile?: Profile;
  isMine: boolean;
  isDeleting: boolean;
  onOpen: () => void;
};

export const HomeRunCardItem: FC<Props> = ({ run: r, profile, onOpen }) => {
  const baseName = profile?.fullName ?? '';
  const avatar = profile?.avatarUrl;

  const districtOnly = useMemo(() => {
    const s = r?.cityDistrict ?? '';
    const i = s.indexOf(',');
    return i >= 0 ? s.slice(i + 1).trim() : s.trim();
  }, [r?.cityDistrict]);

  const paceText = useMemo(() => {
    if (!r?.pace) return '';
    return r.pace.replace(' мин', '');
  }, [r?.pace]);

  const myVkId = useAppSelector((s) => s.user.data?.id);

  // 1) Участие по данным списка (приведение типов)
  const serverParticipantFromList = useMemo(() => {
    if (myVkId == null) return false;
    const myIdNum = Number(myVkId);
    if (!Number.isFinite(myIdNum)) return false;
    const list: Array<{ vkUserId: number | string }> = Array.isArray(r?.participants) ? r.participants : [];
    return list.some((p) => Number(p?.vkUserId) === myIdNum);
  }, [r?.participants, myVkId]);

  // 2) Если участников в списке нет — лениво тянем детали
  const needDetails =
    !serverParticipantFromList && !(Array.isArray(r?.participants) && r.participants.length > 0);
  const { data: runDetails } = useGetRunByIdQuery(r.id, { skip: !needDetails || !r?.id });

  const serverParticipantFromDetails = useMemo(() => {
    if (myVkId == null || !runDetails?.participants) return false;
    const myIdNum = Number(myVkId);
    if (!Number.isFinite(myIdNum)) return false;
    return runDetails.participants.some((p) => Number(p?.vkUserId) === myIdNum);
  }, [runDetails?.participants, myVkId]);

  const serverParticipant = serverParticipantFromList || serverParticipantFromDetails;

  // 3) Локальное состояние
  const [localParticipant, setLocalParticipant] = useState<boolean>(serverParticipant);
  useEffect(() => setLocalParticipant(serverParticipant), [serverParticipant]);

  // 4) Мутации
  const [joinRun, { isLoading: isJoining }] = useJoinRunMutation();
  const [leaveRun, { isLoading: isLeaving }] = useLeaveRunMutation();

  // 5) Snackbar
  const [snack, setSnack] = useState<React.ReactNode>(null);
  const showError = (msg: string) =>
    setSnack(
      <Snackbar
        before={<Icon12ErrorCircleFillYellow fill="var(--vkui--color_icon_negative)" />}
        onClose={() => setSnack(null)}
      >
        {msg}
      </Snackbar>
    );
  const showWarning = (msg: string) =>
    setSnack(
      <Snackbar
        before={<Icon12ErrorCircleFillYellow fill="var(--vkui--color_icon_negative)" />}
        onClose={() => setSnack(null)}
      >
        {msg}
      </Snackbar>
    );

  const handleJoin = async () => {
    try {
      const res: JoinRunResponse = await joinRun(r.id).unwrap();
      setLocalParticipant(true); // оптимистично
      // Инвалидация тегов в runnersApi заставит обновиться и список, и детали
      if (res && res.warning) {
        showWarning('Вы уже записаны на пробежку в это время!');
      }
    } catch (e: any) {
      const msg = e?.data || e?.message || 'Не удалось записаться';
      showError(String(msg));
    }
  };

  const handleLeave = async () => {
    try {
      await leaveRun(r.id).unwrap();
      setLocalParticipant(false); // оптимистично
      // Инвалидация тегов обновит список и детали
    } catch (e: any) {
      const msg = e?.data || e?.message || 'Не удалось отписаться';
      showError(String(msg));
    }
  };

  // 6) UI
  const actionMode: 'join' | 'leave' = localParticipant ? 'leave' : 'join';
  const actionDisabled = actionMode === 'join' ? isJoining : isLeaving;
  const actionLabel =
    actionMode === 'join'
      ? (isJoining ? 'Записываю…' : 'ПОБЕГУ!')
      : (isLeaving ? 'Отписываю…' : 'ОТПИСАТЬСЯ');

  const dateText = formatDate(r.dateISO);
  const startTime = r?.dateISO
    ? new Date(r.dateISO).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="run-card-wrap">
      <Card key={r.id} mode="shadow" onClick={onOpen} className="run-card">
        <div className="run-card__content">
          {/* Левый блок */}
          <div className="run-card__left">
            <Avatar
              size={58.35}
              src={avatar}
              fallbackIcon={<Icon24User />}
              className="run-card__avatar"
            />
            {baseName && (
              <div className="run-card__username">
                {baseName.split(' ').map((part, i) => (
                  <div key={i}>{part}</div>
                ))}
              </div>
            )}
          </div>

          {/* Правый блок */}
          <div className="run-card__right">
            <div className="run-card__title-row">
              <div className="run-card__title">{districtOnly || '—'}</div>
              {r.runTypeName && <div className="run-card__type">{r.runTypeName}</div>}
            </div>

            <div className="run-card__info">
              <div className="run-card__row">
                <div className="run-card__cell">
                  <div className="run-card__label">Дата</div>
                  <div className="run-card__value">{dateText || '—'}</div>
                </div>
                <div className="run-card__cell run-card__cell--right">
                  <div className="run-card__label">Темп</div>
                  <div className="run-card__value">{paceText || '—'}</div>
                </div>
              </div>
              <div className="run-card__row">
                <div className="run-card__cell">
                  <div className="run-card__label">Старт</div>
                  <div className="run-card__value">{startTime || '—'}</div>
                </div>
                <div className="run-card__cell run-card__cell--right">
                  <div className="run-card__label">Путь</div>
                  <div className="run-card__value">
                    {Number.isFinite(r?.distanceKm) ? `${r.distanceKm} км` : '—'}
                  </div>
                </div>
              </div>
            </div>

            <div className="run-card__start-row">
              <div className="run-card__label">Место старта</div>
              <div className="run-card__value">{r.startAddress || '—'}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Кнопка под карточкой: внешний вид из CSS .run-card__pobegu */}
      <ActionButton
        unstyled
        mode={actionMode}
        label={actionLabel}
        disabled={actionDisabled}
        className={`run-card__pobegu ${actionMode === 'leave' ? 'run-card__pobegu--leave' : ''}`}
        onClick={(e) => {
          e.stopPropagation(); // не открывать детали
          if (actionMode === 'join') void handleJoin();
          else void handleLeave();
        }}
      />

      {snack}
    </div>
  );
};
