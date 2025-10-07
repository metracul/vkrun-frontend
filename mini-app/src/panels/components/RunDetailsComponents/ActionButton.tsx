import { Button } from '@vkontakte/vkui';

type Props = {
  mode: 'join' | 'leave';
  label: string;
  disabled: boolean;
  onClick: () => void;
};

export const ActionButton = ({ mode, label, disabled, onClick }: Props) => (
  <Button
    size="l"
    appearance={mode === 'join' ? 'accent' : 'negative'}
    mode={mode === 'leave' ? 'secondary' : undefined}
    disabled={disabled}
    onClick={onClick}
    style={{
      borderRadius: 22.94,
      border:
        mode === 'join'
          ? '1.15px solid rgba(3, 4, 3, 1)'
          : '1.15px solid rgba(255, 0, 0, 1)',
      backgroundColor:
        mode === 'join'
          ? 'rgba(225, 255, 0, 1)' 
          : 'rgba(246, 246, 246, 1)',
      color:
        mode === 'join'
          ? 'rgba(3, 4, 3, 1)'
          : 'rgba(255, 0, 0, 1)',

      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
      fontSize: 20,
      lineHeight: '100%',
      letterSpacing: '0',
      textAlign: 'center',
    }}
  >
    {label}
  </Button>
);
