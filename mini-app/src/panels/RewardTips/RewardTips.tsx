import { FC, useEffect, useState } from 'react';
import {
  Panel,
  PanelHeader,
  Group,
  Div,
  Spinner,
  Header,
  SimpleCell,
  Button,
} from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import bridge from '@vkontakte/vk-bridge';

type Props = {
  id: string;
  itemKey?: string; // ключ в VK Storage
};

export const RewardTips: FC<Props> = ({ id, itemKey = 'donation_3' }) => {
  const routeNavigator = useRouteNavigator();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    bridge
      .send('VKWebAppStorageGet', { keys: [itemKey] })
      .then((res: any) => {
        if (cancelled) return;
        const v = res?.keys?.find((k: any) => k.key === itemKey)?.value;
        setAllowed(v === '1');
      })
      .catch(() => {
        if (!cancelled) setAllowed(false);
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [itemKey]);

  // Если проверили и нет доступа — уводим на главную
  useEffect(() => {
    if (checked && !allowed) {
      routeNavigator.replace('/'); // не добавляем запись в историю
    }
  }, [checked, allowed, routeNavigator]);

  if (!checked) {
    return (
      <Panel id={id}>
        <PanelHeader>Проверка доступа…</PanelHeader>
        <Group>
          <Div style={{ display: 'flex', justifyContent: 'center', minHeight: 200 }}>
            <Spinner size="l" />
          </Div>
        </Group>
      </Panel>
    );
  }

  // Если allowed=false — мы уже редиректим. Рендерим только при allowed=true.
  return (
    <Panel id={id}>
      <PanelHeader>Советы по бегу</PanelHeader>

      <Group header={<Header >Разминка и техника</Header>}>
        <SimpleCell multiline>5–10 минут лёгкой ходьбы/джоггинга перед стартом.</SimpleCell>
        <SimpleCell multiline>Динамическая разминка: махи ногами, круги руками, выпады.</SimpleCell>
        <SimpleCell multiline>Каденс ~170–180 шагов/мин как ориентир для снижения ударной нагрузки.</SimpleCell>
        <SimpleCell multiline>Постановка стопы под центром тяжести, корпус слегка вперёд.</SimpleCell>
      </Group>

      <Group header={<Header>Нагрузка и прогресс</Header>}>
        <SimpleCell multiline>Правило 10%: недельный объём увеличивайте не более чем на 10%.</SimpleCell>
        <SimpleCell multiline>Чередуйте лёгкие/интенсивные дни; минимум 1 день отдыха.</SimpleCell>
        <SimpleCell multiline>Силовая 2× в неделю: кор, ягодичные, икры.</SimpleCell>
        <SimpleCell multiline>Следите за пульсом и самочувствием; при симптомах перегруза — снизьте объём.</SimpleCell>
      </Group>

      <Group header={<Header>Восстановление</Header>}>
        <SimpleCell multiline>Сон 7–9 часов. Пейте воду до/во время/после бега.</SimpleCell>
        <SimpleCell multiline>Лёгкая растяжка после: квадрицепсы, бицепс бедра, икры.</SimpleCell>
        <SimpleCell multiline>Питание: белок 1.2–1.6 г/кг/сут, углеводы для гликогена.</SimpleCell>
      </Group>

      <Group header={<Header>Экипировка и безопасность</Header>}>
        <SimpleCell multiline>Кроссовки по ноге; меняйте каждые ~500–700 км.</SimpleCell>
        <SimpleCell multiline>Одежда по погоде, отражатели в темноте.</SimpleCell>
        <SimpleCell multiline>Разогрев → ускорения → заминка; избегайте рывков «с места».</SimpleCell>
        <SimpleCell multiline>Маршруты знакомые; сообщайте близким время/трек.</SimpleCell>
      </Group>

      <Group>
        <Div>
          <Button size="l" mode="primary" onClick={() => routeNavigator.push('/')}>
            Назад
          </Button>
        </Div>
      </Group>
    </Panel>
  );
};
