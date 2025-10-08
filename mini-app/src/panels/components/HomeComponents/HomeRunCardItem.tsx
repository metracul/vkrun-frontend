import { FC } from 'react';
import { Card, RichCell, Avatar, Footnote, Button } from '@vkontakte/vkui';
import { Icon24User } from '@vkontakte/icons';
import { formatDate } from '../../../utils';

type Profile = { fullName?: string; nameSuffix?: string; avatarUrl?: string };

type Props = {
  run: any;
  profile?: Profile;
  isMine: boolean;
  isDeleting: boolean;
  onOpen: () => void;
  onDeleteClick: (e: React.MouseEvent) => void;
};

export const HomeRunCardItem: FC<Props> = ({
  run: r,
  profile,
  isMine,
  isDeleting,
  onOpen,
  onDeleteClick,
}) => {
  const baseName = profile?.fullName ?? '';
  const displayName = profile?.nameSuffix ? `${baseName} · ${profile.nameSuffix}` : baseName;
  const avatar = profile?.avatarUrl;

  return (
    <Card
      key={r.id}
      mode="shadow"
      onClick={onOpen}
      style={{
        marginTop: 8,
        position: 'relative',
        height: 187,
        background: 'var(--run-card-color)',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        border: '1.15px solid var(--run-card-border-color)',
      }}
    >
      {isMine && (
        <div
          style={{
            position: 'absolute',
            right: 12,
            bottom: 12,
            zIndex: 2,
          }}
        >
          <Button
            size="s"
            mode="secondary"
            appearance="negative"
            disabled={isDeleting}
            onClick={onDeleteClick}
          >
            Удалить
          </Button>
        </div>
      )}

      <RichCell
        before={<Avatar size={48} src={avatar} fallbackIcon={<Icon24User />} />}
        subtitle={[r.cityDistrict, formatDate(r.dateISO)].filter(Boolean).join(' • ')}
        extraSubtitle={[r.distanceKm ? `${r.distanceKm} км` : null, r.pace ? `${r.pace}` : null]
          .filter(Boolean)
          .join(' • ')}
        multiline
        style={{
          paddingRight: 96,
          paddingBottom: 44,
          alignSelf: 'stretch',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        {r.title} — {displayName || 'Получаю данные…'}
        {r.notes ? <Footnote style={{ marginTop: 4 }}>{r.notes}</Footnote> : null}
      </RichCell>
    </Card>
  );
};
