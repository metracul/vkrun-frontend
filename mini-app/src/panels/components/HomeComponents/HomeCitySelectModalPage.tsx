import { FC, useMemo } from 'react';
import {
  ModalPage,
  Group,
  Button,
  Spacing
} from '@vkontakte/vkui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setSelectedCity } from '../../../store/cityFilterSlice';
import { CITY_OPTIONS } from '../../../constants/locations';

type Props = {
  id: string;
  onClose: () => void;
};

export const HomeCitySelectModalPage: FC<Props> = ({ id, onClose }) => {
  const dispatch = useAppDispatch();
  const current = useAppSelector((s) => s.cityFilter.selectedCity) ?? 'Москва';

  const options = useMemo(() => CITY_OPTIONS.map(o => o.value), []);

  const selectCity = (name: string) => {
    if (name !== current) {
      dispatch(setSelectedCity(name));
      // остальная логика (пересчёт фильтров) сработает как и раньше
      // persistCityMiddleware сохранит в localStorage
    }
    onClose();
  };

  return (
    <ModalPage id={id} settlingHeight={420} dynamicContentHeight onClose={onClose}>

      <Group mode="plain">
        {options.map((name) => {
          const isCurrent = name === current;
          return (
            <div key={name} style={{ marginBottom: 8 }}>
              <Button
                size="l"
                appearance={isCurrent ? 'accent' : 'neutral'}
                mode={isCurrent ? 'primary' : 'secondary'}
                stretched
                onClick={() => selectCity(name)}
              >
                {name.toUpperCase()}
              </Button>
            </div>
          );
        })}
        <Spacing size={8} />
      </Group>
    </ModalPage>
  );
};
