import { FC } from 'react';
import { DateInput, Footnote } from '@vkontakte/vkui';

export const CreateDateField: FC<{
  value: Date | null;
  onChange: (d?: Date) => void;
  min: string;
  error?: string | null;
  touched?: boolean;
}> = ({ value, onChange, min, error, touched }) => (
  <>
    <DateInput
      value={value ?? undefined}
      onChange={onChange}
      min={min}
      status={error ? 'error' : 'default'}
      onBlur={() => {/* внешний контрол setTouched */}}
    />
    {touched && error && (
      <Footnote style={{ color: 'var(--vkui--color_text_negative)' }}>
        {error} Пожалуйста, измените ввод.
      </Footnote>
    )}
  </>
);
