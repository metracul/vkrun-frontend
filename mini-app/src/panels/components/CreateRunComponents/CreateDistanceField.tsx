import { FC } from 'react';
import { Footnote, Input } from '@vkontakte/vkui';

export const CreateDistanceField: FC<{
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  touched?: boolean;
  maxNote?: boolean;
}> = ({ value, onChange, error, touched, maxNote }) => (
  <>
    <Input
      name="distance"
      placeholder="Введите дистанцию"
      inputMode="decimal"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      status={error && touched ? 'error' : 'default'}
      style={
        maxNote
          ? { filter: 'brightness(0.97)' }
          : undefined
      }
    />
    {touched && error && (
      <Footnote style={{ color: 'var(--vkui--color_text_negative)' }}>
        {error} Пожалуйста, измените ввод.
      </Footnote>
    )}
    {maxNote && !error && (
      <Footnote style={{ color: 'var(--vkui--color_text_secondary)' }}>
        Введена максимальная дистанция: 300&nbsp;км.
      </Footnote>
    )}
  </>
);
