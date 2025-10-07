// src/panels/RunDetails/components/RunDescription.tsx
type Props = { text?: string };

export const RunDescription = ({ text }: Props) => {
  if (!text) return null;

  return (
    <div
      style={{
        border: '1.15px solid rgba(224, 224, 224, 1)',
        borderRadius: 20,
        padding: 12,
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 400,
        fontSize: 14,
        lineHeight: '13px',
        letterSpacing: 0,
        color: 'rgba(10, 16, 6, 0.5)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {text}
    </div>
  );
};
