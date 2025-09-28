import { Group, SimpleCell, Header, Caption } from '@vkontakte/vkui';

type Props = {
  date: string;
  time: string;
  notes: string;
  cityName: string;
  districtName: string;
  pace: string;
  distance: string;
  durationText: string;
};

export const InfoGroup = ({
  date, time, notes, cityName, districtName, pace, distance, durationText,
}: Props) => (
  <Group header={<Header>Информация о пробежке</Header>}>
    <SimpleCell><Caption level="1">Дата</Caption>{date}</SimpleCell>
    <SimpleCell><Caption level="1">Время</Caption>{time}</SimpleCell>

    {notes ? (
      <SimpleCell>
        <Caption level="1">Описание</Caption>
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {notes}
        </div>
      </SimpleCell>
    ) : null}

    <SimpleCell><Caption level="1">Город</Caption>{cityName || '—'}</SimpleCell>
    <SimpleCell><Caption level="1">Район</Caption>{districtName || '—'}</SimpleCell>
    <SimpleCell><Caption level="1">Темп</Caption>{pace || '—'}</SimpleCell>
    <SimpleCell><Caption level="1">Дистанция</Caption>{distance}</SimpleCell>
    <SimpleCell><Caption level="1">Длительность</Caption>{durationText}</SimpleCell>
  </Group>
);
