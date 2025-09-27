import { FC } from 'react';
import { CustomSelect, CustomSelectOption } from '@vkontakte/vkui';
import { Icon20LocationMapOutline } from '@vkontakte/icons';
import { CITY_OPTIONS } from '../../../constants/locations';

export const CreateCitySelect: FC<{
  value?: string;
  onChange: (v?: string) => void;
}> = ({ value, onChange }) => (
  <CustomSelect
    options={CITY_OPTIONS}
    value={value}
    onChange={(e) => onChange((e.target as HTMLSelectElement).value || undefined)}
    before={<Icon20LocationMapOutline />}
    placeholder="Выберите город"
    allowClearButton
    renderOption={({ option, ...restProps }) => (
      <CustomSelectOption {...restProps} description={(option as any).country} />
    )}
  />
);
