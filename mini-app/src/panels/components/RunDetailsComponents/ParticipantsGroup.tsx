import { Group, SimpleCell, Header, Subhead, Avatar } from '@vkontakte/vkui';
import { Icon24User } from '@vkontakte/icons';

type Item = {
  vkId: number;
  name: string;
  href: string;
  avatarUrl?: string;
};

type Props = {
  count: number;
  items: Item[];
};

export const ParticipantsGroup = ({ count, items }: Props) => (
  <Group header={<Header>Участники ({count})</Header>}>
    {items.length === 0 ? (
      <SimpleCell><Subhead>Пока никого</Subhead></SimpleCell>
    ) : (
      items.map((it) => (
        <SimpleCell
          key={it.vkId}
          Component="a"
          href={it.href}
          target="_blank"
          rel="noopener noreferrer"
          before={<Avatar size={40} src={it.avatarUrl} fallbackIcon={<Icon24User />} />}
          role="link"
          aria-label={`Открыть профиль: ${it.name}`}
        >
          {it.name}
        </SimpleCell>
      ))
    )}
  </Group>
);
