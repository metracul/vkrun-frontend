import { FC } from 'react';
import { Panel, PanelHeader, Group, Div, Button } from '@vkontakte/vkui';

export const RewardPhoto: FC<{ id: string; url: string }> = ({ id, url }) => {
  return (
    <Panel id={id}>
      <PanelHeader>Подарок</PanelHeader>
      <Group>
        <Div style={{ display: 'flex', justifyContent: 'center' }}>
          <img src={url} alt="reward" style={{ maxWidth: '100%', borderRadius: 8 }} />
        </Div>
        <Div>
          <Button size="l" mode="secondary" href={url} target="_blank" rel="noopener noreferrer">
            Открыть в новой вкладке
          </Button>
        </Div>
      </Group>
    </Panel>
  );
};
