import { FC } from 'react';
import { NavIdProps, Panel, PanelHeader, PanelHeaderBack, Header,
    Group, CustomSelectOption, Textarea, Spacing, CustomSelect, Input } from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import {Icon20LocationMapOutline} from '@vkontakte/icons';

export const CreateRun: FC<NavIdProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
        <Header size="l">Создание пробежки</Header>
      </PanelHeader>

      <Group header={<Header size="s">Настрой свою пробежку</Header>}>
      <Spacing size="m" />
      <Header size="m">Описание</Header>
      <Spacing size="s" />
      <Textarea name="text" placeholder="Опишите свою пробежку" />
      <Spacing size="s" />
      <Header size="m">Укажите данные о пробежке</Header>
      <CustomSelect
        options={[
            { value: 0, label: 'Анапа', country: 'Россия' },
            { value: 1, label: 'Бишкек', country: 'Кыргызстан' },
            { value: 2, label: 'Краснодар', country: 'Рай' },
            { value: 3, label: 'Москва', country: 'Россия' },
            { value: 4, label: 'Новосибирск', country: 'Россия' },
            { value: 5, label: 'Омск', country: 'Мордор' },
        ]}
        before={<Icon20LocationMapOutline />}
        placeholder="Выберите город"
        allowClearButton
        renderOption={({ option, ...restProps }) => (
            <CustomSelectOption {...restProps} description={option.country} />
        )}
        />
      <Spacing size="s" />
      <Input name="input" placeholder="Введите район пробежки" />
      </Group>
    </Panel>
  );
};
