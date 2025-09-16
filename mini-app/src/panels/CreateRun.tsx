import { FC } from 'react';
import { NavIdProps, Panel, PanelHeader, PanelHeaderBack, Header, Group, Textarea, Spacing } from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';

export const CreateRun: FC<NavIdProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
        <Header size="l">Создание пробежки</Header>
      </PanelHeader>

      <Group header={<Header size="s">Настрой свою пробежку</Header>}>
      <Spacing size="m" />
      <Textarea name="text" placeholder="Опиши свою пробежку" />
      </Group>
    </Panel>
  );
};
