import { FC } from 'react';
import { CustomSelect, CustomSelectOption } from '@vkontakte/vkui';
import { Icon20LocationMapOutline } from '@vkontakte/icons';
import { CITY_OPTIONS } from '../../../constants/locations';
import styles from '../../Home/css/Home.module.css';

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export const HomeCitySelect: FC<Props> = ({ value, onChange }) => (
  <div className={styles.citySelect}>
    <CustomSelect
      before={<Icon20LocationMapOutline />}
      options={CITY_OPTIONS}
      value={value}
      onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
      placeholder="Выберите город"
      renderOption={({ option, ...restProps }) => (
        <CustomSelectOption
          {...restProps}
          description={(option as any).country}
        />
      )}
    />
  </div>
);
