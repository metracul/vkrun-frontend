// src/panels/CreateRun.tsx
import { FC, useMemo, useState } from 'react';
import {
  NavIdProps, Panel, PanelHeader, PanelHeaderBack, Header, Select, InfoRow, Button, DateInput,
  Group, CustomSelectOption, Textarea, Spacing, CustomSelect, Input, Footnote
} from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { Icon20LocationMapOutline } from '@vkontakte/icons';
import { createRunSecure } from '../api/createRunSecure';

// ---- справочники ----
const CITIES = [
  'Москва',
  'Санкт-Петербург',
  'Казань',
  'Уфа',
  'Омск',
  'Новосибирск',
  'Екатеринбург',
  'Самара',
  'Нижний Новгород',
  'Краснодар',
] as const;

const CITY_OPTIONS = CITIES.map((name) => ({ value: name, label: name, country: 'Россия' }));

const DISTRICTS: Record<(typeof CITIES)[number], string[]> = {
  'Москва': [
    'Центральный адм. округ',
    'Северный адм. округ',
    'Северо-Восточный адм. округ',
    'Восточный адм. округ',
    'Юго-Восточный адм. округ',
    'Южный адм. округ',
    'Юго-Западный адм. округ',
    'Западный адм. округ',
    'Северо-Западный адм. округ',
    'Зеленоградский адм. округ',
    'Троицкий адм. округ',
    'Новомосковский адм. округ',
  ],
  'Санкт-Петербург': [
    'Адмиралтейский район',
    'Василеостровский район',
    'Выборгский район',
    'Калининский район',
    'Кировский район',
    'Колпинский район',
    'Красногвардейский район',
    'Красносельский район',
    'Кронштадтский район',
    'Курортный район',
    'Московский район',
    'Невский район',
    'Петроградский район',
    'Петродворцовый район',
    'Приморский район',
    'Пушкинский район',
    'Фрунзенский район',
    'Центральный район',
  ],
  'Казань': [
    'Авиастроительный район',
    'Вахитовский район',
    'Кировский район',
    'Московский район',
    'Ново-Савиновский район',
    'Приволжский район',
    'Советский район',
  ],
  'Уфа': [
    'Демский район',
    'Калининский район',
    'Кировский район',
    'Ленинский район',
    'Октябрьский район',
    'Орджоникидзевский район',
    'Советский район',
  ],
  'Омск': [
    'Центральный адм. округ',
    'Октябрьский адм. округ',
    'Кировский адм. округ',
    'Ленинский адм. округ',
    'Советский адм. округ',
  ],
  'Новосибирск': [
    'Железнодорожный район',
    'Заельцовский район',
    'Дзержинский район',
    'Калининский район',
    'Кировский район',
    'Ленинский район',
    'Октябрьский район',
    'Первомайский район',
    'Советский район',
    'Центральный район',
  ],
  'Екатеринбург': [
    'Верх-Исетский район',
    'Железнодорожный район',
    'Кировский район',
    'Ленинский район',
    'Октябрьский район',
    'Орджоникидзевский район',
    'Чкаловский район',
  ],
  'Самара': [
    'Железнодорожный район',
    'Кировский район',
    'Красноглинский район',
    'Куйбышевский район',
    'Ленинский район',
    'Октябрьский район',
    'Промышленный район',
    'Самарский район',
    'Советский район',
  ],
  'Нижний Новгород': [
    'Автозаводский район',
    'Канавинский район',
    'Ленинский район',
    'Московский район',
    'Нижегородский район',
    'Приокский район',
    'Советский район',
    'Сормовский район',
  ],
  'Краснодар': [
    'Западный адм. округ',
    'Карасунский адм. округ',
    'Прикубанский адм. округ',
    'Центральный адм. округ',
    'Центральный микрорайон (ЦМР)',
    'Фестивальный микрорайон (ФМР)',
    'Юбилейный микрорайон (ЮМР)',
    'Гидростроительный микрорайон (ГМР)',
    'Энка (п. Жукова)',
    'Славянский микрорайон (СМР)',
    'Авиагородок',
    'Московский микрорайон',
    '40 лет Победы',
    'Немецкая деревня (Европея)',
    'Витаминкомбинат (ВМР)',
    'Кожзавод',
    'Восточно-Кругликовский микрорайон',
    'Калинино (микрорайон)',
  ],
};

export const CreateRun: FC<NavIdProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();

  const [city, setCity] = useState<string | undefined>(undefined);
  const [district, setDistrict] = useState<string>('');

  const [desc, setDesc] = useState('');
  const [distanceStr, setDistanceStr] = useState('');
  const [pace, setPace] = useState('05:30');
  const [date, setDate] = useState<Date | null>(null);
  const [timeStr, setTimeStr] = useState('');
  const [loading, setLoading] = useState(false);

  // --- состояния ошибок для полей ---
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [distanceTouched, setDistanceTouched] = useState(false);
  const [dateTouched, setDateTouched] = useState(false);

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

  const allDistrictOptions = useMemo(() => {
    const list = city ? DISTRICTS[city as keyof typeof DISTRICTS] ?? [] : [];
    return list.map((name) => ({ value: name, label: name }));
  }, [city]);

  // --- валидация дистанции ---
  const validateDistance = (raw: string): string | null => {
    if (!raw.trim()) return 'Введите дистанцию.';
    const km = parseFloat(raw.replace(',', '.'));
    if (!isFinite(km)) return 'Пожалуйста, введите число';
    if (km <= 0) return 'Дистанция должна быть больше 0 км.';
    return null;
  };

  // --- валидация даты (не в прошлом) ---
  const validateDateNotPast = (d: Date | null): string | null => {
    if (!d) return 'Выберите дату.';
    const picked = new Date(d);
    picked.setHours(0, 0, 0, 0);
    if (picked < startOfToday) return 'Нельзя выбрать прошедшую дату.';
    return null;
  };

  const isFormValid = useMemo(() => {
    const hasCity = !!city;
    const hasDistrict = district.trim().length > 0;
    const hasPace = !!pace && paceToSeconds(pace) != null;

    const distErr = validateDistance(distanceStr);
    const hasDistance = distErr === null;

    const dateErr = validateDateNotPast(date);
    const hasDate = dateErr === null;

    const hasTime = parseTime(timeStr) !== null;

    if (!(hasCity && hasDistrict && hasPace && hasDistance && hasDate && hasTime)) return false;

    const now = new Date();
    const dt = date && combineDateTime(date, timeStr);
    if (!dt) return false;
    if (date!.toDateString() === now.toDateString() && dt < now) return false;

    return true;
  }, [city, district, pace, distanceStr, date, timeStr, startOfToday]);

  const handleSubmit = async () => {
    if (!isFormValid) return;

    const km = parseFloat(distanceStr.replace(',', '.'));
    const startAtDate = date && timeStr ? combineDateTime(date, timeStr) : null;
    if (!startAtDate) return;

    const paceSec = paceToSeconds(pace) ?? 0;
    const body = {
      cityName: city,
      districtName: district,
      startAt: startAtDate.toISOString(),
      durationMinutes: Math.max(5, Math.round(km * paceSec / 60)),
      distanceKm: km,
      paceSecPerKm: paceSec,
      description: desc || undefined,
    };

    try {
      setLoading(true);
      const id = await createRunSecure(body);

      const fire = () => window.dispatchEvent(new CustomEvent('runs:updated', { detail: { id } }));
      routeNavigator.back();
      setTimeout(fire, 0);
    } catch (e: any) {
      alert(`Ошибка: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onCityChange = (value: string) => {
    setCity(value);
    setDistrict('');
  };

  const filterFn = (q: string, option: { value: string; label: string }) => {
    if (!q) return true;
    return option.label.toLowerCase().startsWith(q.toLowerCase());
  };

  const handleDistanceChange = (value: string) => {
    setDistanceStr(value);
    if (!distanceTouched) setDistanceTouched(true);
    setDistanceError(validateDistance(value));
  };

  const handleDateChange = (value?: Date) => {
    setDateTouched(true);
    const next = value ?? null;
    const err = validateDateNotPast(next);
    if (err) {
      setDateError(err);
      return;
    }
    setDateError(null);
    setDate(next);
  };

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
        <Header size="l">Создание пробежки</Header>
      </PanelHeader>

      <Group header={<Header size="s">Настрой свою пробежку</Header>}>
        <Spacing size="m" />

        <Header size="m">Укажите ваш город</Header>
        <CustomSelect
          options={CITY_OPTIONS}
          value={city}
          onChange={(e) => onCityChange((e.target as HTMLSelectElement).value)}
          before={<Icon20LocationMapOutline />}
          placeholder="Выберите город"
          allowClearButton
          renderOption={({ option, ...restProps }) => (
            <CustomSelectOption {...restProps} description={(option as any).country} />
          )}
        />

        <Spacing size="s" />
        <Header>Выберите район</Header>
        <CustomSelect
          key={city || 'no-city'}
          options={allDistrictOptions}
          value={district}
          onChange={(e) => setDistrict((e.target as HTMLSelectElement).value)}
          placeholder={city ? 'Начните вводить район' : 'Сначала выберите город'}
          disabled={!city}
          searchable
          filterFn={filterFn}
          allowClearButton
        />

        <Spacing size="s" />
        <Header size="m">Выберите дату забега</Header>
        <DateInput
          value={date ?? undefined}
          onChange={handleDateChange}
          min={minDateStr}
          status={dateError ? 'error' : 'default'}
          onBlur={() => setDateTouched(true)}
        />
        {dateTouched && dateError && (
          <Footnote style={{ color: 'var(--vkui--color_text_negative)' }}>
            {dateError} Пожалуйста, измените ввод.
          </Footnote>
        )}

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
          onChange={(e) => handleDistanceChange(e.target.value)}
          onBlur={() => setDistanceTouched(true)}
          status={distanceError && distanceTouched ? 'error' : 'default'}
        />
        {distanceTouched && distanceError && (
          <Footnote style={{ color: 'var(--vkui--color_text_negative)' }}>
            {distanceError} Пожалуйста, измените ввод.
          </Footnote>
        )}

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
          disabled={!isFormValid || loading}
          onClick={handleSubmit}
        >
          {loading ? 'Создание...' : 'Создать'}
        </Button>
      </Group>
    </Panel>
  );
};
