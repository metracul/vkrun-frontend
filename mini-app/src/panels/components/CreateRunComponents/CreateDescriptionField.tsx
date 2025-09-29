import { FC } from 'react';
import { Textarea } from '@vkontakte/vkui';

export const CreateDescriptionField: FC<{
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  touched?: boolean;
}> = ({ value, onChange, error, touched }) => (
  <div>
    <Textarea
      name="text"
      placeholder="Опишите свою пробежку (необязательно)"
      value={value}
      maxLength={2000}
      onChange={(e) => onChange(e.target.value)}
      style={
        touched && error
          ? { backgroundColor: '#fff2b2' }
          : undefined
      }
    />
    {touched && error && (
      <div style={{ marginTop: 6, fontSize: 13, color: '#8a6d3b' }}>
        {error}
      </div>
    )}
  </div>
);
