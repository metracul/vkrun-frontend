import * as React from 'react';
import { Tappable } from '@vkontakte/vkui';
import { Icon20SlidersOutline } from '@vkontakte/icons';

type Props = {
  onClick: () => void;
  ariaLabel?: string;
};

export const FiltersIconButton: React.FC<Props> = ({ onClick, ariaLabel = 'Фильтры' }) => {
  return (
    <Tappable
      onClick={onClick}
      hoverMode="background"
      activeMode="opacity"
      style={{
        width: 36.7,
        height: 36.7,
        border: '1.15px solid var(--vkui--color_icon_secondary)', 
        borderRadius: 10,
        background: 'var(--vkui--color_background_content)',
        boxShadow: '0px 9.18px 27.53px rgba(149,157,165,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        color: 'var(--vkui--color_icon_secondary)',
      }}
      aria-label={ariaLabel}
    >
      <Icon20SlidersOutline />
    </Tappable>
  );
};
