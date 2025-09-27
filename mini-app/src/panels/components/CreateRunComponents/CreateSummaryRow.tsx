import { FC } from 'react';
import { InfoRow } from '@vkontakte/vkui';

export const CreateSummaryRow: FC<{ timeDisplay: string }> = ({ timeDisplay }) => (
  <InfoRow header="Примерное время бега">{timeDisplay}</InfoRow>
);
