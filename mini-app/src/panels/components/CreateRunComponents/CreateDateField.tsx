import { FC } from 'react';
import { DateInput, Footnote } from '@vkontakte/vkui';
import base from '../CreateRunComponentsCss/FieldBase.module.css';
import styles from '../CreateRunComponentsCss/CreateDateField.module.css';

export const CreateDateField: FC<{
  value: Date | null;
  onChange: (d?: Date) => void;
  min: string;
  error?: string | null;
  touched?: boolean;
}> = ({ value, onChange, min, error, touched }) => {

  return (
    <>
      <div className={`${base.root} ${base.pad10} ${styles.wrapOptional}`}>

        <DateInput
          value={value ?? undefined}
          onChange={onChange}
          min={min}
          status={error ? 'error' : 'default'}
          placeholder=""
        />
      </div>

      {touched && error && (
        <Footnote style={{ color: 'var(--vkui--color_text_negative)' }}>
          {error} Пожалуйста, измените ввод.
        </Footnote>
      )}
    </>
  );
};
