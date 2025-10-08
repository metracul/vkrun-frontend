import { FC, useRef, useLayoutEffect } from 'react';

export const CreateDescriptionField: FC<{
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  touched?: boolean;
}> = ({ value, onChange, error, touched }) => {
  const id = 'create-desc-textarea';
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const hasValue = value.trim().length > 0;

  const baseStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 20,
    border: '1.15px solid var(--create-border-color)',
    padding: '16px 16px',
    background: 'transparent',
    resize: 'none',
    outline: 'none',
    WebkitAppearance: 'none',

    fontFamily: 'Montserrat, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    fontWeight: 500,
    fontSize: 20,
    lineHeight: '100%',
    letterSpacing: 0,
    color: hasValue ? 'var(--selector-text-color)' : 'var(--create-text-color)',

    overflow: 'hidden',
    maxHeight: 360,
  };

  const errStyle: React.CSSProperties =
    touched && error ? { borderColor: 'var(--vkui--color_text_negative)' } : {};

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    if (el.scrollHeight <= 360) {
      el.style.height = el.scrollHeight + 'px';
      el.style.overflow = 'hidden';
    } else {
      el.style.height = '360px';
      el.style.overflow = 'auto';
    }
  }, [value]);

  return (
    <div>
      <textarea
        id={id}
        ref={ref}
        value={value}
        placeholder="Комментарий"
        maxLength={2000}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!(touched && error)}
        style={{ ...baseStyle, ...errStyle }}
      />
      <style>
        {`
          #${id}::placeholder { color: var(--create-text-color); opacity: 1; }
          #${id}::-webkit-input-placeholder { color: var(--create-text-color); }
          #${id}:-ms-input-placeholder { color: var(--create-text-color); }
        `}
      </style>

      {touched && error && (
        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--vkui--color_text_negative)' }}>
          {error}
        </div>
      )}
    </div>
  );
};
