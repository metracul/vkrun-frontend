import { FC } from 'react';
import {
  ModalPage,
  Header,
  Group,
  Caption,
  Spacing,
  ButtonGroup,
  Button,
} from '@vkontakte/vkui';

type Props = {
  id: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
};

export const HomeDeleteConfirmModalPage: FC<Props> = ({
  id,
  onClose,
  onConfirm,
  isDeleting,
}) => (
  <ModalPage id={id} onClose={onClose} header={<Header>Удалить пробежку?</Header>}>
    <Group>
      <Caption level="1">Действие необратимо.</Caption>
      <Spacing size="m" />
      <ButtonGroup mode="vertical" align="center" gap="s">
        <Button
          size="l"
          appearance="negative"
          loading={isDeleting}
          onClick={onConfirm}
        >
          Удалить
        </Button>
        <Button size="l" mode="secondary" disabled={isDeleting} onClick={onClose}>
          Отмена
        </Button>
      </ButtonGroup>
    </Group>
  </ModalPage>
);
