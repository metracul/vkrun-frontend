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
  >
    {label}
  </Button>
);
