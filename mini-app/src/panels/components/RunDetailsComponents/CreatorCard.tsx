import { Card, RichCell, Avatar } from '@vkontakte/vkui';
import { Icon24User } from '@vkontakte/icons';

type Props = {
  creatorName: string;
  creatorHref?: string;
  avatarUrl?: string;
};

export const CreatorCard = ({ creatorName, creatorHref, avatarUrl }: Props) => (
  <Card mode="shadow">
    <RichCell
      Component={creatorHref ? ('a' as const) : ('div' as const)}
      href={creatorHref}
      target={creatorHref ? '_blank' : undefined}
      rel={creatorHref ? 'noopener noreferrer' : undefined}
      before={<Avatar size={56} src={avatarUrl} fallbackIcon={<Icon24User />} />}
      multiline
      role={creatorHref ? 'link' : undefined}
      aria-label={creatorHref ? `Открыть профиль: ${creatorName}` : undefined}
    >
      {creatorName}
    </RichCell>
  </Card>
);

CreatorCard.Skeleton = function Skeleton() {
  return (
    <Card mode="shadow">
      <RichCell multiline>Загрузка…</RichCell>
    </Card>
  );
};
