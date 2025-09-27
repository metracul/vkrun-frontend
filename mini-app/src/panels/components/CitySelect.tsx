import { FC } from 'react';
import { SimpleCell, CustomSelect, CustomSelectOption } from '@vkontakte/vkui';
import { Icon20LocationMapOutline } from '@vkontakte/icons';
import { CITY_OPTIONS } from '../../constants/locations';

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export const CitySelect: FC<Props> = ({ value, onChange }) => (
  <SimpleCell>
    <CustomSelect
      before={<Icon20LocationMapOutline />}
      options={CITY_OPTIONS}
      style={{ width: 200 }}
      value={value}
      onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
      placeholder="Выберите город"
      renderOption={({ option, ...restProps }) => (
        <CustomSelectOption {...restProps} description={(option as any).country} />
      )}
    />
  </SimpleCell>
);
