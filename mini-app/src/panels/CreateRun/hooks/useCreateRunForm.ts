import { useMemo, useState, useCallback } from 'react';
import { parsePaceToSec } from '../../../utils/parsers';

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseTime(t: string) {
  const m = t.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return null;
  return { h: parseInt(m[1], 10), m: parseInt(m[2], 10) } as const;
}

function combineDateTime(d: Date, t: string): Date | null {
  const tm = parseTime(t);
  if (!tm) return null;
  const x = new Date(d);
  x.setHours(tm.h, tm.m, 0, 0);
  return x;
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.round(totalSeconds / 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m} мин (${mins} мин)`;
  return `${h} ч ${m} мин (${mins} мин)`;
}

export type CreateRunFormState = {
  city?: string;
  district: string;
  desc: string;
  distanceStr: string; // ввод с запятой
  pace: string;        // MM:SS
  date: Date | null;
  timeStr: string;     // HH:MM
};

export function useCreateRunForm() {
  const [state, setState] = useState<CreateRunFormState>({
    city: undefined,
    district: '',
    desc: '',
    distanceStr: '',
    pace: '05:30',
    date: null,
    timeStr: '',
  });

  const [loading, setLoading] = useState(false);

  // Ошибки и "touched"
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);        // NEW
  const [distanceTouched, setDistanceTouched] = useState(false);
  const [dateTouched, setDateTouched] = useState(false);
  const [descTouched, setDescTouched] = useState(false);
  const [timeTouched, setTimeTouched] = useState(false);                  // NEW

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const minDateStr = useMemo(() => toYMD(startOfToday), [startOfToday]);

  // Вспомогательные вычисления
  const paceSec = useMemo(() => parsePaceToSec(state.pace) ?? null, [state.pace]);

  const timeDisplay = useMemo(() => {
    const km = parseFloat(state.distanceStr.replace(',', '.'));
    if (!isFinite(km) || km <= 0 || paceSec == null) return '—';
    const totalSeconds = km * paceSec;
    return formatDuration(totalSeconds);
  }, [state.distanceStr, paceSec]);

  // Валидации
  const validateDistance = useCallback((raw: string): string | null => {
    if (!raw.trim()) return 'Введите дистанцию.';
    const km = parseFloat(raw.replace(',', '.'));
    if (!isFinite(km)) return 'Некорректное число.';
    if (km <= 0) return 'Дистанция должна быть больше 0 км.';
    return null;
  }, []);

  const validateDateNotPast = useCallback((d: Date | null): string | null => {
    if (!d) return 'Выберите дату.';
    const picked = new Date(d);
    picked.setHours(0, 0, 0, 0);
    if (picked < startOfToday) return 'Нельзя выбрать прошедшую дату.';
    return null;
  }, [startOfToday]);

  // NEW: ошибка только для случая "сегодня + время в прошлом"
  const validateTime = useCallback((timeStr: string, date: Date | null): string | null => {
    // если время пустое — не показываем ошибку (валидность контролируется отдельно в isFormValid)
    if (!timeStr) return null;
    const tm = parseTime(timeStr);
    if (!tm) return null; // формат отсечётся в isFormValid, здесь — только требование из ТЗ
    if (!date) return null;

    const now = new Date();
    const candidate = combineDateTime(date, timeStr);
    if (!candidate) return null;

    if (date.toDateString() === now.toDateString() && candidate < now) {
      return 'Нельзя создавать пробежки в прошлом.';
    }
    return null;
  }, []);

  const validateDesc = useCallback((text: string): string | null => {
    if (text.length >= 2000) return 'Достигнут лимит в 2000 символов.';
    return null;
  }, []);

  const isFormValid = useMemo(() => {
    const hasCity = !!state.city;
    const hasDistrict = state.district.trim().length > 0;
    const hasPace = paceSec != null;
    const hasDistance = validateDistance(state.distanceStr) === null;
    const hasDate = validateDateNotPast(state.date) === null;
    const hasTime = parseTime(state.timeStr) !== null;

    if (!(hasCity && hasDistrict && hasPace && hasDistance && hasDate && hasTime)) return false;

    const now = new Date();
    const dt = state.date && combineDateTime(state.date, state.timeStr);
    if (!dt) return false;
    if (state.date!.toDateString() === now.toDateString() && dt < now) return false;

    return true;
  }, [state, paceSec, validateDistance, validateDateNotPast]);

  // Хэндлеры
  const setCity = (city?: string) => setState((s) => ({ ...s, city, district: '' }));
  const setDistrict = (district: string) => setState((s) => ({ ...s, district }));
  const setDesc = (desc: string) => {
    setState((s) => ({ ...s, desc }));
    if (!descTouched) setDescTouched(true);
    setDescError(validateDesc(desc));
  };
  const setDistanceStr = (distanceStr: string) => {
    setState((s) => ({ ...s, distanceStr }));
    if (!distanceTouched) setDistanceTouched(true);
    setDistanceError(validateDistance(distanceStr));
  };
  const setPace = (pace: string) => setState((s) => ({ ...s, pace }));
  const setDate = (value?: Date) => {
    setDateTouched(true);
    const next = value ?? null;
    const err = validateDateNotPast(next);
    if (err) {
      setDateError(err);
    } else {
      setDateError(null);
    }
    // Ре-валидация времени при смене даты
    setTimeError(validateTime(state.timeStr, next));
    setState((s) => ({ ...s, date: next }));
  };
  const setTimeStr = (timeStr: string) => {
    setState((s) => ({ ...s, timeStr }));
    if (!timeTouched) setTimeTouched(true);
    setTimeError(validateTime(timeStr, state.date));
  };

  return {
    state,
    setCity,
    setDistrict,
    setDesc,
    setDistanceStr,
    setPace,
    setDate,
    setTimeStr,

    // UI
    loading,
    setLoading,

    // errors/touched
    distanceError,
    dateError,
    descError,
    timeError,          // NEW
    distanceTouched,
    dateTouched,
    descTouched,
    timeTouched,        // NEW

    // computed
    startOfToday,
    minDateStr,
    timeDisplay,
    paceSec,
    isFormValid,

    // utils
    parseTime,
    combineDateTime,
  } as const;
}
