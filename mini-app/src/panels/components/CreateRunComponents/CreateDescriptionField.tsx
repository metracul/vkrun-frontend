import { FC } from 'react';
import { Textarea } from '@vkontakte/vkui';

export const CreateDescriptionField: FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => (
  <Textarea
    name="text"
    placeholder="Опишите свою пробежку (необязательно)"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);
