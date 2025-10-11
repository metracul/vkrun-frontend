// src/panels/RunDetails/components/RunDescription.tsx
type Props = { text?: string };

export const RunDescription = ({ text }: Props) => {
  if (!text) return null;

  return (
    <div
      style={{
        border: '1.15px solid rgba(224, 224, 224, 1)',
        borderRadius: 20,
        padding: 15,
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 400,
        fontSize: 14,
        lineHeight: '13px',
        letterSpacing: 0,
        color: 'var(--vkui--color_text_secondary)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {text}
    </div>
  );
};

