import { FC } from 'react';
import { Input, Footnote } from '@vkontakte/vkui';

export const CreateTimeField: FC<{
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  touched?: boolean;
}> = ({ value, onChange, error, touched }) => (
  <>
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      status={touched && error ? 'error' : 'default'}
    />
    {touched && error && (
      <Footnote style={{ color: 'var(--vkui--color_text_negative)' }}>
        {error} Пожалуйста, выберите время в будущем.
      </Footnote>
    )}
  </>
);
