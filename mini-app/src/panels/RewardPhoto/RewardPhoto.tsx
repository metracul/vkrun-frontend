import { FC, useEffect, useState } from 'react';
import { Panel, PanelHeader, Group, Div, Button, Spinner, Caption } from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import bridge from '@vkontakte/vk-bridge';

type Props = {
  id: string;
  // что показываем; по умолчанию ваш товар donation_3
  itemKey?: string;
  // URL картинки на бэке (НЕ в ассетах клиента)
  url: string; // напр. "https://runnear.ru/img/donate.png" или ваш API-эндпоинт
};

export const RewardPhoto: FC<Props> = ({ id, itemKey = 'donation_3', url }) => {
  const routeNavigator = useRouteNavigator();

  const [entitlementChecked, setEntitlementChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    bridge
      .send('VKWebAppStorageGet', { keys: [itemKey] })
      .then((res: any) => {
        const v = res?.keys?.find((k: any) => k.key === itemKey)?.value;
        setAllowed(v === '1');
      })
      .catch(() => setAllowed(false))
      .finally(() => setEntitlementChecked(true));
  }, [itemKey]);

  if (!entitlementChecked) {
    return (
      <Panel id={id}>
        <PanelHeader>Подарок</PanelHeader>
        <Group>
          <Div style={{ display: 'flex', justifyContent: 'center', minHeight: 200 }}>
            <Spinner size="l" />
          </Div>
        </Group>
      </Panel>
    );
  }

  if (!allowed) {
    return (
      <Panel id={id}>
        <PanelHeader>Подарок</PanelHeader>
        <Group>
          <Div style={{ textAlign: 'center' }}>
            <Caption level="1" style={{ color: 'var(--vkui--color_text_negative)' }}>
              Доступ к изображению отсутствует.
            </Caption>
            <Div>
              <Button size="l" mode="primary" onClick={() => routeNavigator.push('/')}>
                Назад
              </Button>
            </Div>
          </Div>
        </Group>
      </Panel>
    );
  }

  return (
    <Panel id={id}>
      <PanelHeader>Подарок</PanelHeader>
      <Group>
        <Div style={{ display: 'flex', justifyContent: 'center' }}>
          <img
            src={url}
            alt="reward"
            style={{ maxWidth: '100%', borderRadius: 8 }}
          />
        </Div>
        <Div>
          <Button size="l" mode="primary" onClick={() => routeNavigator.push('/')}>
            Назад
          </Button>
        </Div>
      </Group>
    </Panel>
  );
};
