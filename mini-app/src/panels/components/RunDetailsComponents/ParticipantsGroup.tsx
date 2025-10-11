import React from 'react';
import { SimpleCell, Subhead, Avatar } from '@vkontakte/vkui';
import { Icon24User } from '@vkontakte/icons';

type Item = {
  vkId: number;
  name: string;
  href: string;
  avatarUrl?: string;
};

type Props = {
  count: number; // оставлен для совместимости
  items: Item[];
};

export const ParticipantsGroup: React.FC<Props> = ({ items }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}
  >
    <div
      style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 500,
        fontSize: '16px',
        color: 'var(--vkui--color_text_primary)', // адаптивный цвет
      }}
    >
      БЕГУНЫ
    </div>

    {items.length === 0 ? (
      <SimpleCell>
        <Subhead>Пока никого</Subhead>
      </SimpleCell>
    ) : (
      items.map((it) => (
        <SimpleCell
          key={it.vkId}
          Component="a"
          href={it.href}
          target="_blank"
          rel="noopener noreferrer"
          before={
            <Avatar
              size={40}
              src={it.avatarUrl}
              fallbackIcon={<Icon24User />}
            />
          }
          role="link"
          aria-label={`Открыть профиль: ${it.name}`}
        >
          {it.name}
        </SimpleCell>
      ))
    )}
  </div>
);
