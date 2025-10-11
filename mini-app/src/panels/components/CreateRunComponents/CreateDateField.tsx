import { FC } from 'react';
import { DateInput, Footnote } from '@vkontakte/vkui';
import { Icon24CalendarOutline } from '@vkontakte/icons';
import base from '../CreateRunComponentsCss/FieldBase.module.css';
import styles from '../CreateRunComponentsCss/CreateDateField.module.css';

export const CreateDateField: FC<{
  value: Date | null;
  onChange: (d?: Date) => void;
  min: string;
  error?: string | null;
  touched?: boolean;
}> = ({ value, onChange, min, error, touched }) => {
  const hasValue = Boolean(value);
  const isInvalid = Boolean(touched && error);

  return (
    <div className={styles.field}>            {/* ← единый контейнер (один grid-item) */}
      <div
        className={[
          base.root,
          base.pad10,
          styles.wrap,
          hasValue ? styles.hasValue : '',
          isInvalid ? styles.invalid : '',
        ].join(' ')}
      >
        <span className={styles.ph}>
          <Icon24CalendarOutline className={styles.phIcon} />
          Дата
        </span>

        <DateInput
          value={value ?? undefined}
          onChange={onChange}
          min={min}
          status={isInvalid ? 'error' : 'default'}
          placeholder=""
          clearButtonTestId="date-clear-hide"
          clearFieldLabel="Очистить поле"  
          after={null} 
        />
      </div>

      {touched && error && (
        <Footnote className={styles.errorNote}>
          {error}
        </Footnote>
      )}
    </div>
  );
};
