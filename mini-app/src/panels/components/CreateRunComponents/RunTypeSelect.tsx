import { FC, useMemo } from 'react';
import { CustomSelect, CustomSelectOption } from '@vkontakte/vkui';
import base from '../CreateRunComponentsCss/FieldBase.module.css';
import styles from '../CreateRunComponentsCss/RunTypeSelect.module.css';

export type RunTypeOption = { label: string; value: string };

type Props = {
  className?: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  options: RunTypeOption[];
  disabled?: boolean;
};

export const RunTypeSelect: FC<Props> = ({
  className,
  value,
  onChange,
  options,
  disabled,
}) => {
  const hasValue = Boolean(value);

  const selectOptions = useMemo(
    () => options.map((o) => ({ label: o.label, value: o.value })),
    [options],
  );

  return (
    <div className={className}>
      <div
        className={[
          base.root,
          base.pad16,
          styles.wrapper, 
          hasValue ? styles.hasValue : '',
        ].join(' ')}
      >
        <CustomSelect
          options={selectOptions}
          value={value ?? ''}
          onChange={(e) => onChange(String((e.target as HTMLSelectElement).value || ''))}
          placeholder="Тип пробежки"
          disabled={disabled}
          renderOption={({ option, ...rest }) => <CustomSelectOption {...rest} />}
        />
      </div>
    </div>
  );
};

export default RunTypeSelect;
