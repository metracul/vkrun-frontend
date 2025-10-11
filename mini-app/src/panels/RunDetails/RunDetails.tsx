// RunDetails.tsx
import { FC, useEffect, useState } from 'react';
import {
  Panel,
  Group,
  Spacing,
  Button,
  NavIdProps,
  Placeholder,
  Snackbar,
} from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { Icon12ErrorCircleFillYellow } from '@vkontakte/icons';

import {
  CreatorCard,
  InfoGroup,
  ParticipantsGroup,
  ActionButton,
  RunDescription,
} from '../components';

import { useRunDetails } from './hooks/useRunDetails';

// ДОБАВЛЕНО: для удаления и синхронизации
import { useDeleteRunMutation } from '../../store/runnersApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { runsUpdated } from '../../store/runsEventsSlice';

export const RunDetails: FC<NavIdProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();
  const {
    isLoading,
    isError,
    data,
    refetch,
    creatorCard,
    info,
    participants,
    actions,
  } = useRunDetails();

  const [snack, setSnack] = useState<React.ReactNode>(null);

  // ДОБАВЛЕНО: состояние и вычисления для удаления
  const dispatch = useAppDispatch();
  const myVkId = useAppSelector((s) => s.user.data?.id);
  const [deleteRun, { isLoading: isDeleting }] = useDeleteRunMutation();

  const isMine =
    !!(data?.creatorVkId && myVkId && data.creatorVkId === myVkId);

  const handleJoin = async () => {
    try {
      const res = await actions.onJoin?.();
      if (res && res.warning) {
        setSnack(
          <Snackbar
            before={<Icon12ErrorCircleFillYellow fill="var(--vkui--color_icon_negative)" />}
            onClose={() => setSnack(null)}
          >
            Вы уже записаны на пробежку в это время!
          </Snackbar>
        );
      }
    } catch (e: any) {
      const msg = e?.data || e?.message || 'Не удалось записаться';
      setSnack(
        <Snackbar
          before={<Icon12ErrorCircleFillYellow fill="var(--vkui--color_icon_negative)" />}
          onClose={() => setSnack(null)}
        >
          Ошибка: {String(msg)}
        </Snackbar>
      );
    }
  };

  // ДОБАВЛЕНО: запросить подтверждение удаления — открыть существующую модалку через событие
  const askDelete = () => {
    if (!data?.id) return;
    const ev = new CustomEvent('runs:open-confirm-delete', {
      detail: { id: Number(data.id) },
    });
    window.dispatchEvent(ev);
  };

  // ДОБАВЛЕНО: обработать подтверждение удаления — выполнить DELETE, обновить ленту и уйти на главную
  useEffect(() => {
    const handler = async (e: Event) => {
      const anyEvt = e as unknown as { detail?: { id?: number } };
      const id = anyEvt?.detail?.id;
      if (!data?.id || id !== Number(data.id)) return;

      try {
        await deleteRun(data.id).unwrap();
        dispatch(runsUpdated());
        routeNavigator.push('/'); // возврат на главную после удаления
      } catch (err: any) {
        const msg = err?.data || err?.message || 'Не удалось удалить пробежку';
        setSnack(
          <Snackbar
            before={<Icon12ErrorCircleFillYellow fill="var(--vkui--color_icon_negative)" />}
            onClose={() => setSnack(null)}
          >
            Ошибка: {String(msg)}
          </Snackbar>
        );
      }
    };

    window.addEventListener('runs:confirm-delete', handler);
    return () => window.removeEventListener('runs:confirm-delete', handler);
  }, [data?.id, deleteRun, dispatch, routeNavigator]);

  return (
    <Panel id={id}>
      <Group
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 12,
          minHeight: '100%',
          boxSizing: 'border-box',
          backgroundColor: 'var(--background-panel-color)',
        }}
      >
        {/* Логотип через CSS-переменную --run-logo (её значение меняется по теме) */}
        <div
          onClick={() => routeNavigator.push('/')}
          style={{
            width: 36.56,
            height: 36.71,
            marginTop: 40,
            backgroundImage: 'var(--run-logo)',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
            cursor: 'pointer',
          }}
        />

        {isLoading && <CreatorCard.Skeleton />}

        {isError && (
          <Placeholder action={<Button mode="secondary" onClick={refetch}>Повторить</Button>}>
            Не удалось получить данные
          </Placeholder>
        )}

        {!isLoading && !isError && !data && <Placeholder>Пробежка не найдена</Placeholder>}

        {!isLoading && !isError && data && (
          <>
            <Spacing size={37} />

            <InfoGroup {...info} />

            <Spacing size={12} />

            <CreatorCard {...creatorCard} />

            <Spacing size={10} />

            <RunDescription text={data?.notes ?? ''} />

            <Spacing size={12} />

            <ParticipantsGroup {...participants} />

            <Spacing size={12} />

            <ActionButton
              mode={actions.buttonMode}
              label={actions.buttonLabel}
              disabled={actions.buttonMode === 'join' ? actions.isJoining : actions.isLeaving}
              onClick={actions.buttonMode === 'join' ? handleJoin : actions.onLeave}
            />

            {/* НОВАЯ КНОПКА "Удалить" — СТРОГО между "ОТПИСАТЬСЯ" и "НАЗАД" */}
            {isMine && (
            <>
              <Spacing size={12} />
              <Button
                disabled={isDeleting}
                onClick={askDelete}
                style={{
                  borderRadius: 22.94,
                  minHeight: 62,
                  border: '1px solid rgba(3, 4, 3, 1)',
                  backgroundColor: 'rgba(255, 0, 0, 1)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 600,
                    fontSize: 20,
                    color: 'rgba(3, 4, 3, 1)',
                  }}
                >
                  {isDeleting ? 'Удаляю…' : 'УДАЛИТЬ'}
                </span>
              </Button>
            </>
          )}
            <Spacing size={12} />
          </>
        )}

        <Button
          mode="secondary"
          onClick={() => routeNavigator.push('/')}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            lineHeight: '100%',
            letterSpacing: '0',
            textAlign: 'center',
            color: 'var(--back-button-color)',
          }}
        >
          <span
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 600,
              fontSize: 20,
            }}
          >
            НАЗАД
          </span>
        </Button>
      </Group>

      {snack}
    </Panel>
  );
};
