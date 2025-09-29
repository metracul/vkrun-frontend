// CreateRun.tsx
import { FC, useEffect } from 'react';
import { NavIdProps, Panel, PanelHeader, PanelHeaderBack, Header, Group, Spacing } from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { createRunSecure } from '../../api/createRunSecure';
import { useCreateRunForm } from './hooks/useCreateRunForm';
import {
  CreateCitySelect, CreateDistrictSelect, CreateDateField, CreateTimeField,
  CreatePaceSelect, CreateDistanceField, CreateDescriptionField,
  CreateSummaryRow, CreateSubmitButton
} from '../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedCity } from '../../store/cityFilterSlice';

export const CreateRun: FC<NavIdProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();
  const f = useCreateRunForm();

  const selectedCity = useAppSelector((s) => s.cityFilter.selectedCity);
  const dispatch = useAppDispatch();

  useEffect(() => {
    f.setCity(selectedCity ?? undefined);
  }, [selectedCity]);

  const handleSubmit = async () => {
    if (!f.isFormValid) return;

    const km = parseFloat(f.state.distanceStr.replace(',', '.'));
    const startAtDate = f.state.date && f.state.timeStr ? f.combineDateTime(f.state.date, f.state.timeStr) : null;
    if (!startAtDate || f.paceSec == null) return;

    const body = {
      cityName: f.state.city,
      districtName: f.state.district,
      startAt: startAtDate.toISOString(),
      durationMinutes: Math.max(5, Math.round((km * f.paceSec) / 60)),
      distanceKm: km,
      paceSecPerKm: f.paceSec,
      description: f.state.desc || undefined,
    } as const;

    try {
      f.setLoading(true);
      const id = await createRunSecure(body);
      const fire = () => window.dispatchEvent(new CustomEvent('runs:updated', { detail: { id } }));
      routeNavigator.replace('/');
      setTimeout(fire, 200);
    } catch (e: any) {
      alert(`Ошибка: ${e.message}`);
    } finally {
      f.setLoading(false);
    }
  };

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.push('/')} />}>
        <Header size="l">Создание пробежки</Header>
      </PanelHeader>

      <Group header={<Header size="s">Настрой свою пробежку</Header>}>
        <Spacing size="m" />

        <Header size="m">Укажите ваш город</Header>
        <CreateCitySelect
          value={selectedCity ?? undefined}
          onChange={(v) => {
            dispatch(setSelectedCity(v ?? null));
            f.setCity(v);
          }}
        />

        <Spacing size="s" />
        <Header>Выберите район</Header>
        <CreateDistrictSelect city={f.state.city} value={f.state.district} onChange={f.setDistrict} />

        <Spacing size="s" />
        <Header size="m">Выберите дату забега</Header>
        <CreateDateField value={f.state.date} onChange={f.setDate} min={f.minDateStr} error={f.dateError} touched={f.dateTouched} />

        <Spacing size="s" />
        <Header size="m">Выберите время начала</Header>
        <CreateTimeField value={f.state.timeStr} onChange={f.setTimeStr} />

        <Spacing size="s" />
        <Header size="m">Выберите примерный темп бега, мин/км</Header>
        <CreatePaceSelect value={f.state.pace} onChange={f.setPace} />

        <Spacing size="s" />
        <Header size="m">Укажите дистанцию, км</Header>
        <CreateDistanceField value={f.state.distanceStr} onChange={f.setDistanceStr} error={f.distanceError} touched={f.distanceTouched} />

        <Spacing size="m" />
        <CreateSummaryRow timeDisplay={f.timeDisplay} />

        <Spacing size="s" />
        <Header size="m">Описание</Header>
        <CreateDescriptionField value={f.state.desc} onChange={f.setDesc} />

        <Spacing size="xl" />
        <CreateSubmitButton disabled={!f.isFormValid || f.loading} loading={f.loading} onClick={handleSubmit} />
      </Group>
    </Panel>
  );
};
