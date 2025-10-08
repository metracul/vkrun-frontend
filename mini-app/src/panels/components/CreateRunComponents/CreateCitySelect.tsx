import { FC } from 'react';
import { CustomSelect, CustomSelectOption } from '@vkontakte/vkui';
import { CITY_OPTIONS } from '../../../constants/locations';
import styles from '../CreateRunComponentsCss/CreateCitySelectGradient.module.css';
import base from '../CreateRunComponentsCss/FieldBase.module.css';

export const CreateCitySelect: FC<{
  value?: string;
  onChange: (v?: string) => void;
}> = ({ value, onChange }) => {
  const hasValue = Boolean(value);

  return (
    <div className={`${base.root} ${base.pad16} ${styles.wrap} ${styles.withLeftIcon} ${hasValue ? styles.hasValue : ''}`}>
      {/* левая иконка, тот же цвет, что и текст (50% #B5B7B4) */}
      <span className={styles.icon} aria-hidden />

      <CustomSelect
        className={styles.select}
        options={CITY_OPTIONS}
        value={value ?? ''}
        onChange={(e) => {
          const v = (e.target as HTMLSelectElement).value;
          onChange(v || undefined);
        }}
        placeholder="Выберите город"
        renderOption={({ option, ...rest }) => (
          <CustomSelectOption {...rest} description={(option as any).country} />
        )}
        searchable
        allowClearButton
      />
    </div>
  );
};
