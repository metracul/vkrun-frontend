import { FC } from 'react';
import { Input } from '@vkontakte/vkui';
import styles from '../CreateRunComponentsCss/StartAddressInput.module.css';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
};

export const StartAddressInput: FC<Props> = ({
  value,
  onChange,
  placeholder = 'Адрес старта',
  maxLength = 40,
}) => {
  return (
    <Input
      className={`
        ${styles.startAddressInput} 
        ${styles.pad16} 
        ${value ? styles.filled : ''}
      `}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
    />
  );
};

export default StartAddressInput;
