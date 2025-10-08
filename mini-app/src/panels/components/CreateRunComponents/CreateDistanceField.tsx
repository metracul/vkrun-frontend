import { FC } from 'react';
import { Footnote, Input } from '@vkontakte/vkui';
import { Icon24Location } from '@vkontakte/icons';
import base from '../CreateRunComponentsCss/FieldBase.module.css';
import styles from '../CreateRunComponentsCss/CreateDistanceField.module.css';

export const CreateDistanceField: FC<{
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  touched?: boolean;
  maxNote?: boolean;
}> = ({ value, onChange, error, touched, maxNote }) => {
  const hasValue = value?.trim().length > 0;

  return (
    <>
      <div
        className={`${base.root} ${base.pad10} ${styles.wrap} ${styles.withLeftIcon} ${
          hasValue ? styles.hasValue : ''
        }`}
      >
        {/* иконка слева */}
        <span className={styles.icon} aria-hidden>
          <Icon24Location />
        </span>

        <Input
          name="distance"
          placeholder="Дистанция"
          inputMode="decimal"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          status={error && touched ? 'error' : 'default'}
        />
      </div>

      {touched && error && (
        <Footnote style={{ color: 'var(--vkui--color_text_negative)' }}>
          {error} Пожалуйста, измените ввод.
        </Footnote>
      )}
      {maxNote && !error && (
        <Footnote style={{ color: 'var(--vkui--color_text_secondary)' }}>
          Введена максимальная дистанция: 300&nbsp;км.
        </Footnote>
      )}
    </>
  );
};
