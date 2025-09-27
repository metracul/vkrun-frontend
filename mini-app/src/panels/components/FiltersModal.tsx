import { FC } from 'react';
import { ModalRoot, ModalPage, Header, Group, FormItem, Input, CustomSelect, Caption, ButtonGroup, Button, Spacing } from '@vkontakte/vkui';
import { PACE_OPTIONS } from '../../constants/pace';

type Props = {
  activeModal: string | null;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;

  runDate: string;
  setRunDate: (v: string) => void;

  districtName: string;
  setDistrictName: (v: string) => void;
  districtOptions: Array<{ value: string; label: string }>;

  distanceFromStr: string;
  setDistanceFromStr: (v: string) => void;
  distanceToStr: string;
  setDistanceToStr: (v: string) => void;
  isDistFromInvalid: boolean;
  isDistToInvalid: boolean;
  distRangeInvalid: boolean;

  paceFrom: string;
  setPaceFrom: (v: string) => void;
  paceTo: string;
  setPaceTo: (v: string) => void;
  paceRangeInvalid: boolean;
};

export const FiltersModal: FC<Props> = (p) => (
  <ModalRoot activeModal={p.activeModal} onClose={p.onClose}>
    <ModalPage id="filters" onClose={p.onClose} header={<Header>Фильтры</Header>}>
      <Group>
        <FormItem top="Дата пробежки">
          <Input type="date" value={p.runDate} onChange={(e) => p.setRunDate((e.target as HTMLInputElement).value)} />
        </FormItem>

        <FormItem top="Район">
          <CustomSelect
            placeholder="Выберите район"
            options={p.districtOptions}
            value={p.districtName}
            onChange={(e) => p.setDistrictName((e.target as HTMLSelectElement).value)}
            allowClearButton
            disabled={p.districtOptions.length === 0}
          />
          {p.districtOptions.length === 0 && (
            <Caption level="1" style={{ marginTop: 6 }}>
              Для выбранного города список районов не задан.
            </Caption>
          )}
        </FormItem>

        <FormItem top="Дистанция (км)">
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="От"
                value={p.distanceFromStr}
                onChange={(e) => p.setDistanceFromStr(e.target.value)}
                status={(p.isDistFromInvalid || p.distRangeInvalid) ? 'error' : 'default'}
              />
              {p.isDistFromInvalid && (
                <Caption level="1" style={{ color: 'var(--vkui--color_text_negative)', marginTop: 4 }}>
                  Введите положительное число &gt; 0 (км)
                </Caption>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="До"
                value={p.distanceToStr}
                onChange={(e) => p.setDistanceToStr(e.target.value)}
                status={(p.isDistToInvalid || p.distRangeInvalid) ? 'error' : 'default'}
              />
              {p.isDistToInvalid && (
                <Caption level="1" style={{ color: 'var(--vkui--color_text_negative)', marginTop: 4 }}>
                  Введите положительное число &gt; 0 (км)
                </Caption>
              )}
            </div>
          </div>
          {p.distRangeInvalid && (
            <Caption level="1" style={{ color: 'var(--vkui--color_text_negative)', marginTop: 6 }}>
              Диапазон задан некорректно: «От» больше «До».
            </Caption>
          )}
        </FormItem>

        <FormItem top="Темп (мин/км)">
          <div style={{ display: 'flex', gap: 8 }}>
            <CustomSelect
              placeholder="От"
              options={PACE_OPTIONS}
              value={p.paceFrom}
              onChange={(e) => p.setPaceFrom((e.target as HTMLSelectElement).value)}
              allowClearButton
              status={p.paceRangeInvalid ? 'error' : 'default'}
            />
            <CustomSelect
              placeholder="До"
              options={PACE_OPTIONS}
              value={p.paceTo}
              onChange={(e) => p.setPaceTo((e.target as HTMLSelectElement).value)}
              allowClearButton
              status={p.paceRangeInvalid ? 'error' : 'default'}
            />
          </div>
          {p.paceRangeInvalid && (
            <Caption level="1" style={{ color: 'var(--vkui--color_text_negative)', marginTop: 6 }}>
              Диапазон темпа задан некорректно: «От» больше «До».
            </Caption>
          )}
        </FormItem>

        <Spacing size={12} />
        <ButtonGroup mode="vertical" align="center" gap="s">
          <Button size="l" appearance="accent" onClick={p.onApply}>Применить</Button>
          <Button size="l" mode="secondary" onClick={p.onReset}>Сбросить</Button>
          <Button size="l" mode="tertiary" onClick={p.onClose}>Закрыть</Button>
        </ButtonGroup>
      </Group>
    </ModalPage>
  </ModalRoot>
);
