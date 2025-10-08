// RunDetails.tsx
import { FC, useState } from 'react';
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
          // ключевое: фон теперь из токена VKUI, который автоматически меняется с темой
          backgroundColor: 'var(--background-panel-color)',
        }}
      >
        {/* Логотип через CSS-переменную --run-logo (её значение меняется по теме) */}
        <div
          style={{
            width: 36.56,
            height: 36.71,
            opacity: 0.5,
            marginTop: 40,
            backgroundImage: 'var(--run-logo)',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            fontStyle: 'normal',
            fontSize: 28,
            lineHeight: '100%',
            letterSpacing: 0,
            marginTop: 24,
          }}
        >
          ТИП ПРОБЕЖКИ
        </div>

        {isLoading && <CreatorCard.Skeleton />}

        {isError && (
          <Placeholder action={<Button mode="secondary" onClick={refetch}>Повторить</Button>}>
            Не удалось получить данные
          </Placeholder>
        )}

        {!isLoading && !isError && !data && <Placeholder>Пробежка не найдена</Placeholder>}

        {!isLoading && !isError && data && (
          <>
            <Spacing size={24} />

            <InfoGroup {...info} />

            <Spacing size={12} />

            <CreatorCard {...creatorCard} />

            <Spacing size={12} />

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

            <Spacing size={12} />
          </>
        )}

        <Button
          mode="secondary"
          onClick={() => routeNavigator.push('/')}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            fontSize: 20,
            lineHeight: '100%',
            letterSpacing: '0',
            textAlign: 'center',
            color: 'var(--vkui--color_text_secondary)',
          }}
        >
          НАЗАД
        </Button>
      </Group>

      {snack}
    </Panel>
  );
};
