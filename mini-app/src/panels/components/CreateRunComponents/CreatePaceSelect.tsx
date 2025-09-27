import { FC } from 'react';
import { Select } from '@vkontakte/vkui';
import { PACE_OPTIONS } from '../../../constants/pace';

export const CreatePaceSelect: FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => (
  <Select value={value} onChange={(e) => onChange((e.target as HTMLSelectElement).value)} options={PACE_OPTIONS} />
);