import { FC, useEffect, useState } from 'react';
import {
  NavIdProps, Panel, Group, Spacing, Snackbar,
} from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { createRunSecure } from '../../api/createRunSecure';
import { HttpError } from '../../api/createRunSecure';

import { useCreateRunForm } from './hooks/useCreateRunForm';
import {
  CreateCitySelect, CreateDistrictSelect, CreateDateField, CreateTimeField,
  CreatePaceSelect, CreateDistanceField, CreateDescriptionField, CreateSubmitButton, CreateBackButton
} from '../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedCity } from '../../store/cityFilterSlice';
import { Icon12CancelCircleFillRed } from '@vkontakte/icons';
import styles from './CreateRun.module.css';

export const CreateRun: FC<NavIdProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();
  const f = useCreateRunForm();

  const selectedCity = useAppSelector((s) => s.cityFilter.selectedCity);
  const dispatch = useAppDispatch();

  const [snackbar, setSnackbar] = useState<React.ReactNode | null>(null);

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
      // сравнение по наличию поля status (без instanceof, чтобы избежать проблем разных реалмов)
      const status = (e as HttpError)?.status;

      if (status === 400) {
        setSnackbar(
          <Snackbar
            onClose={() => setSnackbar(null)}
            duration={4000}
            before={<Icon12CancelCircleFillRed />}
          >
            Невозможно создать пробежку длительностью больше 600 минут
          </Snackbar>
        );
      } else if (status === 409) {
        setSnackbar(
          <Snackbar
            onClose={() => setSnackbar(null)}
            duration={4000}
            before={<Icon12CancelCircleFillRed />}
          >
            Такая пробежка уже существует
          </Snackbar>
        );
      } else {
        alert(`Ошибка: ${e?.message ?? 'Неизвестная ошибка'}`);
      }
    } finally {
      f.setLoading(false);
    }

  };


  return (
    <Panel id={id} style={{ background: 'white' }}>
      <Group
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 12,
          minHeight: '100%',
          boxSizing: 'border-box',
          backgroundColor: 'var(--background-panel-color)',
        }}
      >
      <div
          style={{
            width: 36.56,
            height: 36.71,
            marginTop: 40,
            backgroundImage: 'var(--create-logo)',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
          }}
        />

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 600,
          fontSize: 28,
          lineHeight: '100%',
          letterSpacing: 0,
          marginTop: 37,
        }}
      >
        НОВАЯ ПРОБЕЖКА
      </div>
      
      <Group mode="plain">
        <Spacing size={37} />

        <div className={styles.gutters}>
          <CreateCitySelect
            value={selectedCity ?? undefined}
            onChange={(v: string | undefined) => {
              dispatch(setSelectedCity(v ?? null));
              f.setCity(v);
            }}
          />
        </div>

        <div className={styles.gutters}>
          <CreateDistrictSelect city={f.state.city} value={f.state.district} onChange={f.setDistrict} />
        </div>

        <div className={styles.gutters}>
          <div className={styles.grid}>

            <CreateDateField
              value={f.state.date}
              onChange={f.setDate}
              min={f.minDateStr}
              error={f.dateError}
              touched={f.dateTouched}
            />
            <CreatePaceSelect
              value={f.state.pace}
              onChange={f.setPace}
            />
            <CreateDistanceField
              value={f.state.distanceStr}
              onChange={f.setDistanceStr}
              error={f.distanceError}
              touched={f.distanceTouched}
              maxNote={f.distanceMaxed}
            />
            <CreateTimeField
              value={f.state.timeStr}
              onChange={f.setTimeStr}
              error={f.timeError}
              touched={f.timeTouched}
            />
          </div>
        </div>

        <div className={styles.gutters}>
          <CreateDescriptionField value={f.state.desc} onChange={f.setDesc} error={f.descError} touched={f.descTouched} />
        </div>
         <Spacing size={24} />

        <CreateSubmitButton disabled={!f.isFormValid || f.loading} loading={f.loading} onClick={handleSubmit} />
        <CreateBackButton onClick={() => routeNavigator.push('/')} />
        </Group>

      </Group>

      {snackbar}
    </Panel>
  );
};
