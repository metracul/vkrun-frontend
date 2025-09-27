import { FC } from 'react';
import { Input } from '@vkontakte/vkui';

export const CreateTimeField: FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => (
  <Input type="time" value={value} onChange={(e) => onChange(e.target.value)} />
);
