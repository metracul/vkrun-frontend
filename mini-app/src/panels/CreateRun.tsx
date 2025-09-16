import { FC, useMemo, useState } from 'react';
import {
  NavIdProps, Panel, PanelHeader, PanelHeaderBack, Header, Select, InfoRow, Button,
  Group, CustomSelectOption, Textarea, Spacing, CustomSelect, Input
} from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { Icon20LocationMapOutline } from '@vkontakte/icons';

export const CreateRun: FC<NavIdProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();

  const [city, setCity] = useState<string | number | undefined>(undefined);
  const [district, setDistrict] = useState('');
  const [desc, setDesc] = useState('');
  const [distanceStr, setDistanceStr] = useState('');
  const [pace, setPace] = useState('05:30');

  const cityOptions = [
    { value: 0, label: 'Анапа', country: 'Россия' },
    { value: 1, label: 'Бишкек', country: 'Кыргызстан' },
    { value: 2, label: 'Краснодар', country: 'Рай' },
    { value: 3, label: 'Москва', country: 'Россия' },
    { value: 4, label: 'Новосибирск', country: 'Россия' },
    { value: 5, label: 'Омск', country: 'Мордор' },
  ];

  const paceOptions = [
    '02:00','02:30','03:00','03:30','04:00','04:30','05:00','05:30',
    '06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30',
  ].map((label) => ({ value: label, label }));

  const paceToSeconds = (mmss: string): number | null => {
    const m = mmss.match(/^(\d{1,2}):([0-5]\d)$/);
    if (!m) return null;
    const minutes = parseInt(m[1], 10);
    const seconds = parseInt(m[2], 10);
    return minutes * 60 + seconds;
  };

  const formatDuration = (totalSeconds: number): string => {
    const mins = Math.round(totalSeconds / 60);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h <= 0) return `${m} мин (${mins} мин)`;
    return `${h} ч ${m} мин (${mins} мин)`;
  };

  const timeDisplay = useMemo(() => {
    const km = parseFloat(distanceStr.replace(',', '.'));
    const paceSec = paceToSeconds(pace);
    if (!isFinite(km) || km <= 0 || paceSec == null) return '—';
    const totalSeconds = km * paceSec;
    return formatDuration(totalSeconds);
  }, [distanceStr, pace]);

  // Валидация обязательных полей
  const isFormValid = useMemo(() => {
    const hasCity = city !== undefined && city !== '' && city !== null;
    const hasDistrict = district.trim().length > 0;
    const hasPace = !!pace && paceToSeconds(pace) != null;
    const km = parseFloat(distanceStr.replace(',', '.'));
    const hasDistance = isFinite(km) && km > 0;
    return hasCity && hasDistrict && hasPace && hasDistance;
  }, [city, district, pace, distanceStr]);

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
        <Header size="l">Создание пробежки</Header>
      </PanelHeader>

      <Group header={<Header size="s">Настрой свою пробежку</Header>}>
        <Spacing size="m" />

        <Header size="m">Описание</Header>
        <Spacing size="s" />
        <Textarea
          name="text"
          placeholder="Опишите свою пробежку (необязательно)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <Spacing size="s" />
        <Header size="m">Укажите данные о пробежке</Header>

        <CustomSelect
          options={cityOptions}
          value={city}
          onChange={(e) => setCity((e.target as HTMLSelectElement).value)}
          before={<Icon20LocationMapOutline />}
          placeholder="Выберите город"
          allowClearButton
          renderOption={({ option, ...restProps }) => (
            <CustomSelectOption {...restProps} description={(option as any).country} />
          )}
        />

        <Spacing size="s" />
        <Header>Напишите район города, в котором хотите побегать</Header>
        <Input
          name="district"
          placeholder="Введите район пробежки"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
        />

        <Spacing size="s" />
        <Header size="m">Выберите примерный темп бега, мин/км</Header>
        <Select
          value={pace}
          onChange={(e) => setPace((e.target as HTMLSelectElement).value)}
          options={paceOptions}
        />

        <Spacing size="s" />
        <Header size="m">Укажите дистанцию, км</Header>
        <Input
          name="distance"
          placeholder="Введите дистанцию"
          inputMode="decimal"
          type="text"
          value={distanceStr}
          onChange={(e) => setDistanceStr(e.target.value)}
        />

        <Spacing size="m" />
        <InfoRow header="Примерное время бега">
          {timeDisplay}
        </InfoRow>

        <Spacing size="xl" />
        <Button
          appearance="accent"
          mode="primary"
          disabled={!isFormValid}
          onClick={() => {
            // здесь можно собрать полезную нагрузку и отправить на бэкенд
            // пример:
            // const payload = { city, district, desc, distanceKm: parseFloat(distanceStr.replace(',', '.')), pace };
            // submit(payload)
          }}
        >
          Создать
        </Button>
      </Group>
    </Panel>
  );
};
