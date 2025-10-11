// CreatorCard.tsx
import React from 'react';
import { RichCell, Avatar } from '@vkontakte/vkui';
import { Icon24User } from '@vkontakte/icons';

type Props = {
  creatorName: string;
  creatorHref?: string;
  avatarUrl?: string;
};

// Базовый компонент
const CreatorCardBase: React.FC<Props> = ({ creatorName, creatorHref, avatarUrl }) => (
  <RichCell
    Component={creatorHref ? ('a' as const) : ('div' as const)}
    href={creatorHref}
    target={creatorHref ? '_blank' : undefined}
    rel={creatorHref ? 'noopener noreferrer' : undefined}
    style={{
      paddingLeft: 0,
      paddingRight: 12,
    }}
    before={
      <Avatar
        src={avatarUrl}
        fallbackIcon={<Icon24User />}
        style={{
          width: 83,
          height: 83,
          borderRadius: 57.35,
          border: '2.29px solid rgba(225, 255, 0, 1)',
          boxSizing: 'border-box',
        }}
      />
    }
    multiline
    role={creatorHref ? 'link' : undefined}
    aria-label={creatorHref ? `Открыть профиль: ${creatorName}` : undefined}
  >
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        height: 83,
        width: '100%',
      }}
    >
      {/* Имя — в тёмной теме станет rgba(246, 246, 246, 1) через var(--vkui--color_text_primary) */}
      <div
        style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 400,
          fontSize: 20,
          color: 'var(--vkui--color_text_primary)',
        }}
      >
        {creatorName}
      </div>

      {/* Лейбл — в тёмной теме станет rgba(246, 246, 246, 0.5) через var(--vkui--color_text_secondary) */}
      <div
        style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 400,
          fontSize: 14,
          color: 'var(--vkui--color_text_secondary)',
          marginTop: 3,
        }}
      >
        ОРГАНИЗАТОР
      </div>
    </div>
  </RichCell>
);

// Скелетон
const Skeleton: React.FC = () => (
  <RichCell style={{ paddingLeft: 12, paddingRight: 12 }} multiline>
    Загрузка…
  </RichCell>
);

type CreatorCardType = React.FC<Props> & {
  Skeleton: React.FC;
};

export const CreatorCard: CreatorCardType = Object.assign(CreatorCardBase, { Skeleton });
