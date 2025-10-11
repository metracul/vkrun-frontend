import { FC } from 'react';
import { Footnote, Input } from '@vkontakte/vkui';
import { Icon24Location } from '@vkontakte/icons';
import styles from '../CreateRunComponentsCss/CreateDistanceField.module.css';

export const CreateDistanceField: FC<{
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  touched?: boolean;
  maxNote?: boolean;
}> = ({ value, onChange, error, touched, maxNote }) => {
  const hasValue = value?.trim().length > 0;
  const isInvalid = Boolean(touched && error);

  return (
    <div className={styles.field}>
      <div
        className={[
          styles.wrap,
          styles.withLeftIcon,
          hasValue ? styles.hasValue : '',
          isInvalid ? styles.invalid : '',
        ].join(' ')}
      >
        {/* иконка слева */}
        <span className={styles.icon} aria-hidden>
          <Icon24Location />
        </span>

        <Input
          name="distance"
          placeholder="Путь, км"
          inputMode="decimal"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          status={isInvalid ? 'error' : 'default'}
        />
      </div>

      {touched && error && (
        <Footnote className={styles.errorNote}>
          {error}
        </Footnote>
      )}
      {maxNote && !error && (
        <Footnote className={styles.hintNote}>
          Введена максимальная дистанция: 300&nbsp;км.
        </Footnote>
      )}
    </div>
  );
};
