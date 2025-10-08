// CreateBackButton.tsx
import { FC } from 'react';
import { Tappable } from '@vkontakte/vkui';

export const CreateBackButton: FC<{ onClick: () => void }> = ({ onClick }) => (
  <Tappable
    Component="button"
    role="button"
    onClick={onClick}
    hoverMode="opacity"
    activeMode="opacity"
    style={{
      width: 'calc(100% - 24px)',
      margin: '0 auto',
      height: 62,
      boxSizing: 'border-box',
      backgroundColor: 'transparent',   
      border: 'none',
      outline: 'none',     
      padding: '3.44px 8.03px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',

      fontFamily: 'Montserrat',
      fontWeight: 600,
      fontSize: 20,
      lineHeight: '24px',
      letterSpacing: 0,
      color: 'var(--back-button-color)'
      
      
    }}
  >
    НАЗАД
  </Tappable>
);

export default CreateBackButton;
