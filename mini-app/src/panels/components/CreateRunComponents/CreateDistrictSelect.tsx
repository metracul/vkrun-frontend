import { FC, useMemo } from 'react';
import { CustomSelect } from '@vkontakte/vkui';
import { DISTRICTS_BY_CITY } from '../../../constants/locations';

const filterFn = (q: string, option: { value: string; label: string }) => {
  if (!q) return true;
  return option.label.toLowerCase().startsWith(q.toLowerCase());
};

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
    <CustomSelect
      key={city || 'no-city'}
      options={options}
      value={value}
      onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
      placeholder={city ? 'Начните вводить район' : 'Сначала выберите город'}
      disabled={!city}
      searchable
      filterFn={filterFn}
      allowClearButton
    />
  );
};
