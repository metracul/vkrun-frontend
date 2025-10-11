import { FC, useMemo } from 'react';
import { ModalPage, Group, Tappable } from '@vkontakte/vkui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setSelectedCity } from '../../../store/cityFilterSlice';
import { CITY_OPTIONS } from '../../../constants/locations';

type Props = { id: string; onClose: () => void };

export const HomeCitySelectModalPage: FC<Props> = ({ id, onClose }) => {
  const dispatch = useAppDispatch();
  const current = useAppSelector((s) => s.cityFilter.selectedCity) ?? 'Москва';
  const options = useMemo(() => CITY_OPTIONS.map((o) => o.value), []);

  const selectCity = (name: string) => {
    if (name !== current) {
      dispatch(setSelectedCity(name));
      window.dispatchEvent(new Event('runs:updated'));
    }
    // onClose(); // закрывать модалку при выборе города
  };

  return (
    <div
      style={{
        background: 'var(--modal-background-color)',
        }}
        >
    <ModalPage
      id={id}
      settlingHeight={420}
      dynamicContentHeight
      onClose={onClose}
    >
      
      {/* Градиентная полоска */}
      <div
        style={{
          marginTop: 18,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 79.5,
            height: 4,
            borderRadius: 2,
            background:
              'linear-gradient(90deg, #7B46F8 0%, #CEB9FF 33%, #FEAAEE 67%, #7B46F8 100%)',
          }}
        />
      </div>

      {/* Заголовок ГОРОД */}
      <div
        style={{
          marginTop: 31,
          display: 'flex',
          justifyContent: 'center',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 600,
          fontStyle: 'normal',
          fontSize: 28,
          lineHeight: '100%',
          letterSpacing: 0,
          color: 'var(--gorod-color)',
          textTransform: 'uppercase',
        }}
      >
        ГОРОД
      </div>

      <Group
        mode="plain"
        style={{
          width: 'calc(100% - 24px)',
          margin: '0 auto',
          paddingTop: 24,
          paddingBottom: 40,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxWidth: 390,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            columnGap: 12,
            rowGap: 10.4,
          }}
        >
          {options.map((name) => {
            const isCurrent = name === current;
            return (
              <Tappable
                key={name}
                onClick={() => selectCity(name)}
                hoverMode="opacity"
                activeMode="opacity"
                style={{
                  width: '100%',
                  height: 68,
                  boxSizing: 'border-box',
                  borderRadius: 20,
                  minWidth: 0,
                  padding: 10,
                  background: 'var(--background-modal-city-button)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 500,
                  fontSize: 18,
                  lineHeight: '100%',
                  letterSpacing: 0,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  color: 'var(--modal-city-text-button)',
                  wordBreak: 'keep-all',
                  whiteSpace: 'normal',
                  hyphens: 'auto',
                  border: '2px solid transparent',
                  // градиентная рамка у выбранного города
                  backgroundImage: isCurrent
                    ? 'linear-gradient(var(--background-modal-city-button), var(--background-modal-city-button)), linear-gradient(90deg, rgba(185,155,255,1) 0%, rgba(123,70,248,1) 100%)'
                    : 'none',
                  backgroundOrigin: 'border-box',
                  backgroundClip: isCurrent ? 'padding-box, border-box' : 'border-box',
                }}
              >
                <span
                  style={
                    isCurrent
                      ? {
                          // градиентный текст у выбранного города
                          background:
                            'linear-gradient(90deg, rgba(185,155,255,1) 0%, rgba(123,70,248,1) 100%)',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          color: 'transparent',
                          WebkitTextFillColor: 'transparent',
                        }
                      : {
                          // обычный текст
                          color: 'var(--modal-city-text-button)',
                          background: 'none',
                          WebkitBackgroundClip: 'initial',
                          WebkitTextFillColor: 'initial', // сброс прозрачного текста после выбора
                        }
                  }
                >
                  {name}
                </span>
              </Tappable>
            );
          })}
        </div>
      </Group>
      
    </ModalPage>
    </div>
  );
};
