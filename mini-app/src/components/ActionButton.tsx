import * as React from 'react';
import { Button } from '@vkontakte/vkui';

type Props = {
  mode: 'join' | 'leave';
  label: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /**
   * Если true — компонент не задаёт inline-цвета/рамки,
   * оставляя внешний вид на CSS-классы вызывающей стороны.
   * Полезно для HomeRunCardItem с .run-card__pobegu.
   */
  unstyled?: boolean;
  size?: 's' | 'm' | 'l';
  stretched?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export const ActionButton: React.FC<Props> = ({
  mode,
  label,
  disabled,
  onClick,
  unstyled = false,
  size = 'm',
  stretched,
  className,
  style,
}) => {
  const isJoin = mode === 'join';

  // Базовые inline-стили — только если не unstyled.
  const baseStyle: React.CSSProperties = unstyled
    ? {}
    : {
        borderRadius: 22.94,
        border: isJoin ? '1.15px solid rgba(3, 4, 3, 1)' : '1.15px solid rgba(255, 0, 0, 1)',
        backgroundColor: isJoin ? 'rgba(225, 255, 0, 1)' : 'rgba(246, 246, 246, 1)',
        color: isJoin ? 'rgba(3, 4, 3, 1)' : 'rgba(255, 0, 0, 1)',
        minHeight: 62,
        letterSpacing: '0',
        textAlign: 'center',
      };

  return (
    <Button
      type="button"
      // appearance/mode оставляем как у вас; в карточке их перекроет CSS с !important
      appearance={isJoin ? 'accent' : 'negative'}
      mode={isJoin ? undefined : 'secondary'}
      disabled={disabled}
      onClick={onClick}
      size={size}
      stretched={stretched}
      className={className}
      style={{ ...baseStyle, ...style }}
    >
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 20 }}>
        {label}
      </span>
    </Button>
  );
};
