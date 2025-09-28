import { FC, useState } from 'react';
import {
  Panel,
  PanelHeader,
  Group,
  Spacing,
  Header,
  PanelHeaderBack,
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
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.push('/')} />}>
        <Header size="l">Пробежка</Header>
      </PanelHeader>

      <Group>
        {isLoading && <CreatorCard.Skeleton />}

        {isError && (
          <Placeholder
            action={<Button mode="secondary" onClick={refetch}>Повторить</Button>}
          >
            Не удалось получить данные
          </Placeholder>
        )}

        {!isLoading && !isError && !data && <Placeholder>Пробежка не найдена</Placeholder>}

        {!isLoading && !isError && data && (
          <>
            <CreatorCard {...creatorCard} />

            <Spacing size={16} />

            <InfoGroup {...info} />

            <Spacing size={12} />

            <ParticipantsGroup {...participants} />

            <Spacing size={12} />

            <ActionButton
              mode={actions.buttonMode}
              label={actions.buttonLabel}
              disabled={actions.buttonMode === 'join' ? actions.isJoining : actions.isLeaving}
              onClick={actions.buttonMode === 'join' ? handleJoin : actions.onLeave}
            />

            <Spacing size={16} />
          </>
        )}

        <Button mode="secondary" onClick={() => routeNavigator.push('/')}>
          Назад
        </Button>
      </Group>

      {snack}
    </Panel>
  );
};
