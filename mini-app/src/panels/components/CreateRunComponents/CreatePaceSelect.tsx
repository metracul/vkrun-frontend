import { FC } from 'react';
import { Select } from '@vkontakte/vkui';
import { Icon28SpeedometerStartOutline } from '@vkontakte/icons';
import { PACE_OPTIONS } from '../../../constants/pace';
import base from '../CreateRunComponentsCss/FieldBase.module.css';
import styles from '../CreateRunComponentsCss/CreatePaceField.module.css';

export const CreatePaceSelect: FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => (
  <div className={`${base.root} ${base.pad10} ${styles.wrap}`}>
    {/* иконка слева */}
    <span className={styles.icon}>
      <Icon28SpeedometerStartOutline />
    </span>

    <Select
      value={value}
      onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
      options={PACE_OPTIONS}
    />
  </div>
);
