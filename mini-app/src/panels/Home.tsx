import { FC, useEffect } from 'react';
import {
  Panel,
  PanelHeader,
  Header,
  Button,
  Group,
  Avatar,
  NavIdProps,
  Card,
  RichCell,
  Spacing,
} from '@vkontakte/vkui';
import { Icon20FilterOutline, Icon24User } from '@vkontakte/icons';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadRunnerCard } from '../store/runnerCardSlice';

export interface HomeProps extends NavIdProps {
}

export const Home: FC<HomeProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();
  const dispatch = useAppDispatch();

  const vkUser = useAppSelector((s) => s.user.data);
  const vkUserStatus = useAppSelector((s) => s.user.status);

  const card = useAppSelector((s) => s.runnerCard.data);
  const cardStatus = useAppSelector((s) => s.runnerCard.status);

  useEffect(() => {
    if (vkUser?.id && cardStatus === 'idle') {
      dispatch(loadRunnerCard({ userId: vkUser.id }));
    }
  }, [dispatch, vkUser?.id, cardStatus]);

  const fullName =
    card?.fullName ??
    (vkUser ? `${vkUser.first_name ?? ''} ${vkUser.last_name ?? ''}`.trim() : 'Имя Фамилия');

  const cityDistrict = card?.cityDistrict ?? 'Город район';
  const pace = card?.pace ?? 'Темп км';
  const avatarUrl = card?.avatarUrl ?? vkUser?.photo_100;

  const canShowGroup = Boolean(vkUser || card);

  return (
    <Panel id={id}>
      <PanelHeader delimiter="auto">
        <Header size="l">Поиск пробежки</Header>
      </PanelHeader>

      {canShowGroup && (
        <Group header={<Header size="s">Присоединяйся к другим</Header>}>
          <Spacing size="m" />
          <Button
            appearance="accent"
            mode="outline"
            after={<Icon20FilterOutline />}
            onClick={() => routeNavigator.push('persik')}
          >
            ФИЛЬТРЫ
          </Button>
          <Spacing size="m" />
          <Card mode="shadow">
            <RichCell
              onClick={() => {}}
              before={
                <Avatar
                  size={48}
                  src={avatarUrl}
                  fallbackIcon={<Icon24User />}
                />
              }
              subtitle={cityDistrict}
              extraSubtitle={pace}
              multiline
            >
              {fullName}
            </RichCell>
          </Card>
        </Group>
      )}
    </Panel>
  );
};
