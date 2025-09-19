import { FC, useMemo, useState } from 'react';
import {
  NavIdProps, Panel, PanelHeader, PanelHeaderBack, Header, Select, InfoRow, Button, DateInput,
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
  const [date, setDate] = useState<Date | null>(null);
  const [timeStr, setTimeStr] = useState('');

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const minDateStr = toYMD(startOfToday);

  const cityOptions = [
    { value: 0, label: 'Москва', country: 'Россия' },
    { value: 1, label: 'Санкт-Петербург', country: 'Россия' },
    { value: 2, label: 'Новосибирск', country: 'Россия' },
    { value: 3, label: 'Краснодар', country: 'Россия' },
    { value: 4, label: 'Екатеринбург', country: 'Россия' },
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

  const parseTime = (t: string) => {
    const m = t.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!m) return null;
    return { h: parseInt(m[1], 10), m: parseInt(m[2], 10) };
  };
  const combineDateTime = (d: Date, t: string): Date | null => {
    const tm = parseTime(t);
    if (!tm) return null;
    const x = new Date(d);
    x.setHours(tm.h, tm.m, 0, 0);
    return x;
  };

  const isFormValid = useMemo(() => {
    const hasCity = city !== undefined && city !== '' && city !== null;
    const hasDistrict = district.trim().length > 0;
    const hasPace = !!pace && paceToSeconds(pace) != null;
    const km = parseFloat(distanceStr.replace(',', '.'));
    const hasDistance = isFinite(km) && km > 0;
    const hasDate = date instanceof Date && !isNaN(date.getTime()) && date >= startOfToday;
    const hasTime = parseTime(timeStr) !== null;

    if (!(hasCity && hasDistrict && hasPace && hasDistance && hasDate && hasTime)) return false;

    const now = new Date();
    const dt = combineDateTime(date!, timeStr);
    if (!dt) return false;
    if (date!.toDateString() === now.toDateString() && dt < now) return false;

    return true;
  }, [city, district, pace, distanceStr, date, timeStr, startOfToday]);

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
        <Header size="l">Создание пробежки</Header>
      </PanelHeader>

      <Group header={<Header size="s">Настрой свою пробежку</Header>}>
        <Spacing size="m" />

        <Header size="m">Укажите ваш город</Header>
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
        <Header size="m">Выберите дату забега</Header>
        <DateInput
          value={date ?? undefined}
          onChange={(value) => {
            const next = value ?? null;
            if (next && next < startOfToday) return;
            setDate(next);
          }}
          min={minDateStr}
        />

        <Spacing size="s" />
        <Header size="m">Выберите время начала</Header>
        <Input
          type="time"
          value={timeStr}
          onChange={(e) => setTimeStr(e.target.value)}
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

        <Spacing size="s" />
        <Header size="m">Описание</Header>
        <Textarea
          name="text"
          placeholder="Опишите свою пробежку (необязательно)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <Spacing size="xl" />
        <Button
          appearance="accent"
          mode="primary"
          disabled={!isFormValid}
          onClick={() => {
            const km = parseFloat(distanceStr.replace(',', '.'));
            const startAt = date && timeStr ? combineDateTime(date, timeStr) : null;
            const payload = { city, district, startAt, desc, distanceKm: km, pace };
            console.log('Создать пробежку', payload);
            // здесь можно отправить payload на сервер
          }}
        >
          Создать
        </Button>
      </Group>
    </Panel>
  );
};
