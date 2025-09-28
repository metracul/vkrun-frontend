import { FC } from 'react';
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
} from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';

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
              onClick={actions.buttonMode === 'join' ? actions.onJoin : actions.onLeave}
            />

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
