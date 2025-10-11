import { FC } from 'react';
import { Input } from '@vkontakte/vkui';
import { Icon24Recent } from '@vkontakte/icons';
import base from '../CreateRunComponentsCss/FieldBase.module.css';
import styles from '../CreateRunComponentsCss/CreateTimeField.module.css';

export const CreateTimeField: FC<{
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  touched?: boolean;
}> = ({ value, onChange, error, touched }) => {
  const hasValue = !!value;

  return (
    <>
      <div className={`${base.root} ${base.pad10} ${styles.wrap} ${hasValue ? styles.hasValue : ''}`}>
        <span className={styles.icon}><Icon24Recent /></span>
        <span className={styles.ph}>Время</span>
        <Input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          status={touched && error ? 'error' : 'default'}
          step={60}
        />
      </div>
    </>
  );
};
