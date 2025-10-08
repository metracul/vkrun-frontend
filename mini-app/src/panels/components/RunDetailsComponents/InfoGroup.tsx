type Props = {
  startAddress?: string;
  date: string;
  time: string;
  cityName: string;
  districtName: string;
  pace: string;
  distance: string;
  durationText: string;
};

export const InfoGroup = ({
  startAddress,
  date,
  time,
  cityName,
  districtName,
  pace,
  distance,
}: Props) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}
  >
    {/* Город + район с кружком слева */}
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 500,
          fontSize: 20,
          lineHeight: '100%',
          letterSpacing: 0,
          color: 'var(--vkui--color_text_primary)',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'rgba(225, 255, 0, 1)',
            border: '1px solid var(--vkui--color_text_primary)',
            boxSizing: 'border-box',
            display: 'inline-block',
            flex: '0 0 auto',
          }}
        />
        <span>{cityName || '—'}, {districtName || '—'}</span>
      </div>
    </div>

    {/* Адрес старта — теперь адаптивный цвет */}
    <div
      style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 500,
        fontSize: 16,
        lineHeight: '100%',
        letterSpacing: 0,
        textAlign: 'center',
        color: 'var(--vkui--color_text_subhead)', // автоматическая адаптация
      }}
    >
      {startAddress || '—'}
    </div>

    {/* Дата */}
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 400,
        fontSize: 18,
        lineHeight: '100%',
        letterSpacing: 0,
        color: 'var(--vkui--color_text_primary)',
      }}>Дата пробежки</div>
      <div style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 400,
        fontSize: 18,
        lineHeight: '100%',
        letterSpacing: 0,
        color: 'var(--vkui--color_text_secondary)',
      }}>{date}</div>
    </div>

    {/* Время */}
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 400,
        fontSize: 18,
        lineHeight: '100%',
        letterSpacing: 0,
        color: 'var(--vkui--color_text_primary)',
      }}>Время старта</div>
      <div style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 400,
        fontSize: 18,
        lineHeight: '100%',
        letterSpacing: 0,
        color: 'var(--vkui--color_text_secondary)',
      }}>{time}</div>
    </div>

    {/* Дистанция */}
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 400,
        fontSize: 18,
        lineHeight: '100%',
        letterSpacing: 0,
        color: 'var(--vkui--color_text_primary)',
      }}>Дистанция</div>
      <div style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 400,
        fontSize: 18,
        lineHeight: '100%',
        letterSpacing: 0,
        color: 'var(--vkui--color_text_secondary)',
      }}>{distance}</div>
    </div>

    {/* Темп */}
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 400,
        fontSize: 18,
        lineHeight: '100%',
        letterSpacing: 0,
        color: 'var(--vkui--color_text_primary)',
      }}>Средний темп</div>
      <div style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 400,
        fontSize: 18,
        lineHeight: '100%',
        letterSpacing: 0,
        color: 'var(--vkui--color_text_secondary)',
      }}>{pace || '—'}</div>
    </div>
  </div>
);
