import { FC } from 'react';
import { Button } from '@vkontakte/vkui';

export const CreateSubmitButton: FC<{
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}> = ({ disabled, loading, onClick }) => (
  <Button appearance="accent" mode="primary" disabled={disabled} onClick={onClick}>
    {loading ? 'Создание...' : 'Создать'}
  </Button>
);
