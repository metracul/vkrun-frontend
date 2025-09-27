import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';
import { setSelectedCity } from '../../../store/cityFilterSlice';
import { setDistrictName as setRunsDistrictName } from '../../../store/runsFilterSlice';
import { DISTRICTS_BY_CITY } from '../../../constants/locations';
import { parsePaceToSec, parseNumberOrUndefined } from '../../../utils';

export function useHomeFilters() {
  const dispatch = useAppDispatch();
  const selectedCity = useAppSelector((s) => s.cityFilter.selectedCity) ?? 'Москва';
  const {
    runDate,
    districtName,
    distanceFromStr,
    distanceToStr,
    paceFrom,
    paceTo,
  } = useAppSelector((s: RootState) => s.runsFilter);

  // Сброс невалидного района при смене города
  useEffect(() => {
    const list = DISTRICTS_BY_CITY[selectedCity] ?? [];
    if (districtName && !list.includes(districtName)) {
      dispatch(setRunsDistrictName(''));
    }
  }, [selectedCity, districtName, dispatch]);

  // Числа дистанции
  const { distFromNum, distToNum, isDistFromInvalid, isDistToInvalid, distRangeInvalid } = useMemo(() => {
    const fromNum = parseNumberOrUndefined(distanceFromStr);
    const toNum = parseNumberOrUndefined(distanceToStr);
    const fromInvalid = distanceFromStr?.trim() !== '' && (fromNum === undefined || fromNum <= 0);
    const toInvalid = distanceToStr?.trim() !== '' && (toNum === undefined || toNum <= 0);
    const rangeInvalid = !fromInvalid && !toInvalid && fromNum !== undefined && toNum !== undefined && fromNum > toNum;
    return { distFromNum: fromNum, distToNum: toNum, isDistFromInvalid: fromInvalid, isDistToInvalid: toInvalid, distRangeInvalid: rangeInvalid };
  }, [distanceFromStr, distanceToStr]);

  // Пейс
  const { paceFromSec, paceToSec, paceRangeInvalid } = useMemo(() => {
    const pf = parsePaceToSec(paceFrom);
    const pt = parsePaceToSec(paceTo);
    return { paceFromSec: pf, paceToSec: pt, paceRangeInvalid: pf != null && pt != null && pf > pt };
  }, [paceFrom, paceTo]);

  // Собрать фильтры для API
  const filters = useMemo(() => {
    const f: Record<string, string | number> = {};
    if (selectedCity.trim()) f.cityName = selectedCity.trim();
    if (districtName?.trim()) f.districtName = districtName.trim();
    if (!isDistFromInvalid && distFromNum !== undefined && !distRangeInvalid) f.kmFrom = distFromNum;
    if (!isDistToInvalid && distToNum !== undefined && !distRangeInvalid) f.kmTo = distToNum;
    if (!paceRangeInvalid) {
      if (paceFromSec != null) f.paceFrom = paceFromSec;
      if (paceToSec != null) f.paceTo = paceToSec;
    }
    if (runDate) {
      const d = new Date(runDate);
      f.dateFrom = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
      f.dateTo = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();
    }
    return f;
  }, [selectedCity, districtName, isDistFromInvalid, isDistToInvalid, distRangeInvalid, distFromNum, distToNum, paceFromSec, paceToSec, paceRangeInvalid, runDate]);

  const setCity = (next: string) => dispatch(setSelectedCity(next));

  return {
    selectedCity,
    districtName,
    filters,
    // диагностические флаги при необходимости выводить ошибки в UI фильтров
    isDistFromInvalid,
    isDistToInvalid,
    distRangeInvalid,
    paceRangeInvalid,
    setCity,
  } as const;
}