import { FC } from 'react';
import { Footnote, Input } from '@vkontakte/vkui';

export const CreateDistanceField: FC<{
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  touched?: boolean;
}> = ({ value, onChange, error, touched }) => (
  <>
    <Input
      name="distance"
      placeholder="Введите дистанцию"
      inputMode="decimal"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      status={error && touched ? 'error' : 'default'}
    />
    {touched && error && (
      <Footnote style={{ color: 'var(--vkui--color_text_negative)' }}>
        {error} Пожалуйста, измените ввод.
      </Footnote>
    )}
  </>
);
