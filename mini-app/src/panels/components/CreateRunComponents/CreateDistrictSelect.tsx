import { FC, useMemo } from 'react';
import { CustomSelect, CustomSelectOption } from '@vkontakte/vkui';
import { DISTRICTS_BY_CITY } from '../../../constants/locations';
import base from '../CreateRunComponentsCss/FieldBase.module.css';
import styles from '../CreateRunComponentsCss/CreateDistrictSelect.module.css';

const filterFn = (q: string, option: { value: string; label: string }) =>
  !q || option.label.toLowerCase().includes(q.toLowerCase());

export const CreateDistrictSelect: FC<{
  city?: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ city, value, onChange }) => {
  const options = useMemo(() => {
    const list = city ? DISTRICTS_BY_CITY[city] ?? [] : [];
    return list.map((name) => ({ value: name, label: name }));
  }, [city]);

  return (
   <div
  className={`${base.root} ${base.pad16} ${styles.wrap} ${styles.withLeftIcon} ${value ? styles.hasValue : ''}`}
  >
    <span className={styles.icon} aria-hidden />
    <CustomSelect
      key={city || 'no-city'}
      options={options}
      value={value ?? ''}
      onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
      placeholder={city ? 'Начните вводить район' : 'Сначала выберите город'}
      disabled={!city}
      searchable
      filterFn={filterFn}
      allowClearButton
      renderOption={({ option, ...rest }) => <CustomSelectOption {...rest} />}
    />
  </div>


  );
};
