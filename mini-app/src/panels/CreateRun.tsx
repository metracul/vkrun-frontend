import { FC, useMemo, useState } from 'react';
import {
  NavIdProps, Panel, PanelHeader, PanelHeaderBack, Header, Select, InfoRow, Button, DateInput,
  Group, CustomSelectOption, Textarea, Spacing, CustomSelect, Input
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
    // округа
    'Западный адм. округ',
    'Карасунский адм. округ',
    'Прикубанский адм. округ',
    'Центральный адм. округ',
    // микрорайоны/топонимы
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

// ===== компонент =====
export const CreateRun: FC<NavIdProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();

  const [city, setCity] = useState<string | undefined>(undefined);
  const [district, setDistrict] = useState<string>('');         // теперь это выбранное значение из списка
  const [districtQuery, setDistrictQuery] = useState<string>(''); // текст фильтра для районов

  const [desc, setDesc] = useState('');
  const [distanceStr, setDistanceStr] = useState('');
  const [pace, setPace] = useState('05:30');
  const [date, setDate] = useState<Date | null>(null);
  const [timeStr, setTimeStr] = useState('');
  const [loading, setLoading] = useState(false);

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

  // Список районов для выбранного города с фильтром по началу названия (без учёта регистра)
  const districtOptions = useMemo(() => {
    const list = city ? DISTRICTS[city as keyof typeof DISTRICTS] ?? [] : [];
    const q = districtQuery.trim().toLowerCase();
    const filtered = q
      ? list.filter((name) => name.toLowerCase().startsWith(q))
      : list;
    return filtered.map((name) => ({ value: name, label: name }));
  }, [city, districtQuery]);

  // Валидация формы
  const isFormValid = useMemo(() => {
    const hasCity = !!city;
    const hasDistrict = district.trim().length > 0; // выбран из списка
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

  // Сброс района и строки поиска при смене города
  const onCityChange = (value: string) => {
    setCity(value);
    setDistrict('');
    setDistrictQuery('');
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
        <Header>Выберите район (список зависит от города)</Header>

        {/* Поле для фильтрации списка районов по началу названия */}
        <Input
          placeholder="Начните вводить название района"
          value={districtQuery}
          onChange={(e) => setDistrictQuery(e.target.value)}
          disabled={!city}
        />
        <Spacing size="s" />

        <CustomSelect
          options={districtOptions}
          value={district}
          onChange={(e) => setDistrict((e.target as HTMLSelectElement).value)}
          placeholder={city ? 'Выберите район' : 'Сначала выберите город'}
          disabled={!city}
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
          disabled={!isFormValid || loading}
          onClick={handleSubmit}
        >
          {loading ? 'Создание...' : 'Создать'}
        </Button>
      </Group>
    </Panel>
  );
};
