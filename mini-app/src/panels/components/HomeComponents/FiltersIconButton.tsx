// src/components/FiltersIconButton.tsx
import * as React from 'react';
import { Tappable } from '@vkontakte/vkui';
// Вариант 1 (как у вас было):
// import { Icon20FilterOutline } from '@vkontakte/icons';
// Вариант 2 (если нужен именно sliders_outline_20 и он есть в вашей версии):
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
        width: 36.70587921142578,
        height: 36.70587921142578,
        border: '1.15px solid rgba(10,16,6,0.3)', // #0A1006 @ 30%
        opacity: 30,
        borderRadius: 10,
        background: 'var(--vkui--color_background_content, #FFFFFF)',
        boxShadow: '0px 9.18px 27.53px rgba(149,157,165,0.2)', // #959DA5 @ 20%
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        color: 'rgba(10, 16, 6, 0.3)', 
      }}
      aria-label={ariaLabel}
    >
      <Icon20SlidersOutline /> 
    </Tappable>
  );
};
