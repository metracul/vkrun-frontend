import { FC, useMemo, useState, useEffect } from 'react';
import { Card, Avatar, Snackbar } from '@vkontakte/vkui';
import { Icon24User, Icon12ErrorCircleFillYellow } from '@vkontakte/icons';
import { formatDate } from '../../../utils';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import {
  useJoinRunMutation,
  useLeaveRunMutation,
  type JoinRunResponse,
} from '../../../store/runnersApi';
import { runsUpdated } from '../../../store/runsEventsSlice';
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

export const HomeRunCardItem: FC<Props> = ({
  run: r,
  profile,
  onOpen,
}) => {
  const baseName = profile?.fullName ?? '';
  const avatar = profile?.avatarUrl;

  // район из "Город, Район"
  const districtOnly = useMemo(() => {
    const s = r?.cityDistrict ?? '';
    const i = s.indexOf(',');
    return i >= 0 ? s.slice(i + 1).trim() : s.trim();
  }, [r?.cityDistrict]);

  // pace без " мин"
  const paceText = useMemo(() => {
    if (!r?.pace) return '';
    return r.pace.replace(' мин', '');
  }, [r?.pace]);

  const myVkId = useAppSelector((s) => s.user.data?.id);
  const dispatch = useAppDispatch();

  // участие на основе данных из списка
  const serverParticipant = useMemo(() => {
    if (!myVkId) return false;
    const list: Array<{ vkUserId: number }> = Array.isArray(r?.participants) ? r.participants : [];
    return list.some((p) => p?.vkUserId === myVkId);
  }, [r?.participants, myVkId]);

  // локальное состояние + синхронизация
  const [localParticipant, setLocalParticipant] = useState<boolean>(serverParticipant);
  useEffect(() => setLocalParticipant(serverParticipant), [serverParticipant]);

  // мутации
  const [joinRun, { isLoading: isJoining }] = useJoinRunMutation();
  const [leaveRun, { isLoading: isLeaving }] = useLeaveRunMutation();

  // Snackbar
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
      setLocalParticipant(true);
      dispatch(runsUpdated());
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
      setLocalParticipant(false);
      dispatch(runsUpdated());
    } catch (e: any) {
      const msg = e?.data || e?.message || 'Не удалось отписаться';
      showError(String(msg));
    }
  };

  const actionMode: 'join' | 'leave' = localParticipant ? 'leave' : 'join';
  const actionDisabled = actionMode === 'join' ? isJoining : isLeaving;
  const actionLabel =
    actionMode === 'join'
      ? (isJoining ? 'Записываю…' : 'ПОБЕГУ!')
      : (isLeaving ? 'Отписываю…' : 'ОТПИСАТЬСЯ');

  // данные 2x2
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

      {/* Кнопка под карточкой: внешний вид целиком из CSS .run-card__pobegu */}
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
