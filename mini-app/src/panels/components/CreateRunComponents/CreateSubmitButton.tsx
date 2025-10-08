// CreateSubmitButton.tsx
import { FC } from 'react';
import { Tappable } from '@vkontakte/vkui';

export const CreateSubmitButton: FC<{
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}> = ({ disabled, loading, onClick }) => {
  const isBlocked = disabled || loading;

  return (
    <Tappable
      Component="button"
      role="button"
      onClick={isBlocked ? undefined : onClick}
      disabled={isBlocked}
      hoverMode="opacity"
      activeMode="opacity"
      style={{
        width: 'calc(100% - 24px)',
        margin: '0 auto',          // растягивается по контейнеру (в макете 366px)
        height: 62,
        boxSizing: 'border-box',
        borderRadius: 22.94,       
        border: '1.15px solid #0A1006',
        background: '#E1FF00',
        padding: '3.44px 8.03px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isBlocked ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,

        // типографика
        fontFamily: 'Montserrat',
        fontWeight: 600,        // жирная кнопка по макету
        fontSize: 20,
        lineHeight: '24px',
        letterSpacing: 0,
        textTransform: 'uppercase',
        color: '#0A1006',
      }}
      aria-disabled={isBlocked}
    >
      {loading ? 'Создание…' : 'Опубликовать!'}
    </Tappable>
  );
};
