import { FC, useMemo } from 'react';
import {
  ModalPage,
  Header,
  Group,
  FormItem,
  Input,
  CustomSelect,
  Caption,
  ButtonGroup,
  Button,
  Spacing,
  Checkbox,
} from '@vkontakte/vkui';
import { PACE_OPTIONS } from '../../../constants/pace';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  setRunDate,
  setDistrictName,
  setDistanceFromStr,
  setDistanceToStr,
  setPaceFrom,
  setPaceTo,
  resetFilters,
  setJoinedFilter,
} from '../../../store/runsFilterSlice';
import { DISTRICTS_BY_CITY } from '../../../constants/locations';
import { parseNumberOrUndefined, parsePaceToSec } from '../../../utils';

type Props = {
  id: string;       // обязательный id для ModalPage
  onClose: () => void;
  onReset: () => void; // сигнал перезагрузки списка (значения сбрасываются здесь)
};

export const HomeFiltersModalPage: FC<Props> = ({ id, onClose, onReset }) => {
  const dispatch = useAppDispatch();

  // Город берём из cityFilter (используется для списка районов)
  const selectedCity = useAppSelector((s) => s.cityFilter.selectedCity) ?? 'Москва';

  // Фильтры из runsFilter
  const {
    runDate,
    districtName,
    distanceFromStr,
    distanceToStr,
    paceFrom,
    paceTo,
    joinedFilter,
  } = useAppSelector((s: any) => s.runsFilter);

  // Опции районов
  const districtOptions = useMemo(
    () => (DISTRICTS_BY_CITY[selectedCity] ?? []).map((label) => ({ value: label, label })),
    [selectedCity],
  );

  // Валидация дистанции
  const {
    isDistFromInvalid,
    isDistToInvalid,
    distRangeInvalid,
  } = useMemo(() => {
    const fromNum = parseNumberOrUndefined(distanceFromStr);
    const toNum = parseNumberOrUndefined(distanceToStr);
    const fromInvalid = distanceFromStr.trim() !== '' && (fromNum === undefined || fromNum <= 0);
    const toInvalid = distanceToStr.trim() !== '' && (toNum === undefined || toNum <= 0);
    const rangeInvalid =
      !fromInvalid &&
      !toInvalid &&
      fromNum !== undefined &&
      toNum !== undefined &&
      fromNum > toNum;
    return { isDistFromInvalid: fromInvalid, isDistToInvalid: toInvalid, distRangeInvalid: rangeInvalid };
  }, [distanceFromStr, distanceToStr]);

  // Валидация темпа
  const { paceRangeInvalid } = useMemo(() => {
    const pf = parsePaceToSec(paceFrom);
    const pt = parsePaceToSec(paceTo);
    return { paceRangeInvalid: pf != null && pt != null && pf > pt };
  }, [paceFrom, paceTo]);

  // ====== joinedFilter <-> два чекбокса
  const fromJoinedFilter = (jf: 'any' | 'only' | 'exclude') => {
    switch (jf) {
      case 'only':
        return { joined: true, notJoined: false };
      case 'exclude':
        return { joined: false, notJoined: true };
      case 'any':
      default:
        // по умолчанию оба выключены
        return { joined: false, notJoined: false };
    }
  };

  const toJoinedFilter = (joined: boolean, notJoined: boolean): 'any' | 'only' | 'exclude' => {
    if (joined && !notJoined) return 'only';
    if (!joined && notJoined) return 'exclude';
    // оба или ни один
    return 'any';
  };

  const { joined, notJoined } = fromJoinedFilter(joinedFilter);

  // Хэндлеры
  const handleReset = () => {
    dispatch(resetFilters());
    onReset();
  };

  return (
    <ModalPage id={id} onClose={onClose} header={<Header>Фильтры</Header>}>
      <Group>
        <FormItem top="Дата пробежки">
          <Input
            type="date"
            value={runDate}
            onChange={(e) => dispatch(setRunDate((e.target as HTMLInputElement).value))}
          />
        </FormItem>

        <FormItem top="Район">
          <CustomSelect
            placeholder="Выберите район"
            options={districtOptions}
            value={districtName}
            onChange={(e) => dispatch(setDistrictName((e.target as HTMLSelectElement).value))}
            allowClearButton
            disabled={districtOptions.length === 0}
          />
          {districtOptions.length === 0 && (
            <Caption level="1" style={{ marginTop: 6 }}>
              Для выбранного города список районов не задан.
            </Caption>
          )}
        </FormItem>

        <FormItem top="Дистанция (км)">
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="От"
                value={distanceFromStr}
                onChange={(e) => dispatch(setDistanceFromStr(e.target.value))}
                status={(isDistFromInvalid || distRangeInvalid) ? 'error' : 'default'}
              />
              {isDistFromInvalid && (
                <Caption level="1" style={{ color: 'var(--vkui--color_text_negative)', marginTop: 4 }}>
                  Введите положительное число &gt; 0 (км)
                </Caption>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="До"
                value={distanceToStr}
                onChange={(e) => dispatch(setDistanceToStr(e.target.value))}
                status={(isDistToInvalid || distRangeInvalid) ? 'error' : 'default'}
              />
              {isDistToInvalid && (
                <Caption level="1" style={{ color: 'var(--vkui--color_text_negative)', marginTop: 4 }}>
                  Введите положительное число &gt; 0 (км)
                </Caption>
              )}
            </div>
          </div>
          {distRangeInvalid && (
            <Caption level="1" style={{ color: 'var(--vkui--color_text_negative)', marginTop: 6 }}>
              Диапазон задан некорректно: «От» больше «До».
            </Caption>
          )}
        </FormItem>

        <FormItem top="Темп (мин/км)">
          <div style={{ display: 'flex', gap: 8 }}>
            <CustomSelect
              placeholder="От"
              options={PACE_OPTIONS}
              value={paceFrom}
              onChange={(e) => dispatch(setPaceFrom((e.target as HTMLSelectElement).value))}
              allowClearButton
              status={paceRangeInvalid ? 'error' : 'default'}
            />
            <CustomSelect
              placeholder="До"
              options={PACE_OPTIONS}
              value={paceTo}
              onChange={(e) => dispatch(setPaceTo((e.target as HTMLSelectElement).value))}
              allowClearButton
              status={paceRangeInvalid ? 'error' : 'default'}
            />
          </div>
          {paceRangeInvalid && (
            <Caption level="1" style={{ color: 'var(--vkui--color_text_negative)', marginTop: 6 }}>
              Диапазон темпа задан некорректно: «От» больше «До».
            </Caption>
          )}
        </FormItem>

        <FormItem top="Фильтрация по записи:">
          <Checkbox
            checked={joined}
            onChange={(e) => {
              const next = toJoinedFilter(e.target.checked, notJoined);
              dispatch(setJoinedFilter(next));
            }}
          >
            Пробежки, на которые я записан
          </Checkbox>

          <Checkbox
            checked={notJoined}
            onChange={(e) => {
              const next = toJoinedFilter(joined, e.target.checked);
              dispatch(setJoinedFilter(next));
            }}
          >
            Пробежки, на которые я ещё не записан
          </Checkbox>
        </FormItem>

        <Spacing size={12} />
        <ButtonGroup mode="vertical" align="center" gap="s">
          <Button size="l" onClick={onClose}>Показать результат</Button>
          <Button size="l" mode="secondary" onClick={handleReset}>Сбросить</Button>
        </ButtonGroup>
      </Group>
    </ModalPage>
  );
};
