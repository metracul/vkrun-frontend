// store/runnersApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './index';
import bridge from '@vkontakte/vk-bridge';
import { getFrozenLaunchQueryString } from '../shared/vkParams';

// === вспомогательные функции для подписи ===
async function sha256HexUtf8(str: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function buildVkSignedHeaders(bodyJson: string) {
  const bodySha256 = await sha256HexUtf8(bodyJson);
  const payload = `body_sha256=${bodySha256}`;
  const { sign, ts } = await bridge.send<'VKWebAppCreateHash'>('VKWebAppCreateHash', { payload });

  const launchQs = getFrozenLaunchQueryString();
  if (!launchQs) throw new Error('No VK launch params');

  return {
    'X-VK-Params': launchQs,
    'X-VK-Request-Id': payload,
    'X-VK-Sign': sign,
    'X-VK-Sign-Ts': String(ts),
  } as const;
}

// === типы ===
export type RunCard = {
  id: string | number;
  fullName: string;
  avatarUrl?: string;
  cityDistrict?: string;
  dateISO?: string;
  distanceKm?: number;
  pace?: string;
  title?: string;
  notes?: string;
};

type RunDto = {
  id: number;
  creatorId: number;
  cityName: string;
  districtName?: string | null;
  startAt: string;
  durationMinutes: number;
  distanceKm: number;
  paceSecPerKm?: number | null;
  description?: string | null;
  participantsCount: number;
};

export interface CreateRunPayload {
  cityId?: number;
  districtId?: number;
  cityName?: string;
  districtName?: string;
  startAt: string;
  durationMinutes: number;
  distanceKm: number;
  paceSecPerKm?: number;
  description?: string;
}

function secToPace(sec?: number | null): string {
  if (sec == null || sec <= 0) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')} /км`;
}

function normalize(dto: RunDto): RunCard {
  return {
    id: dto.id,
    fullName: `id${dto.creatorId}`,
    avatarUrl: '',
    cityDistrict: [dto.cityName, dto.districtName || ''].filter(Boolean).join(', '),
    dateISO: dto.startAt,
    distanceKm: dto.distanceKm,
    pace: secToPace(dto.paceSecPerKm ?? undefined),
    title: 'Пробежка',
    notes: dto.description || '',
  };
}

export interface GetRunsArgs {
  endpoint?: string;
  page?: number;
  size?: number;
  filters?: Record<string, string | number | boolean | undefined>;
}

// === API ===
export const runnersApi = createApi({
  reducerPath: 'runnersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
    prepareHeaders: (headers, { getState }) => {
      const qs = (getState() as RootState).vkParams.queryString;
      if (qs) headers.set('X-VK-Params', qs);
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  endpoints: (b) => ({
    getRuns: b.query<{ items: RunCard[] }, GetRunsArgs | void>({
      query: (args) => {
        const { endpoint = '/api/v1/runs', page, size, filters = {} } = args ?? {};
        const params = new URLSearchParams();
        if (page != null) params.set('page', String(page));
        if (size != null) params.set('size', String(size));
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
        });
        return { url: endpoint, method: 'GET', params };
      },
      transformResponse: (raw: RunDto[]) => {
        const items = Array.isArray(raw) ? raw.map(normalize) : [];
        return { items };
      },
    }),

    // === новая мутация: создание пробежки ===
    createRun: b.mutation<number, CreateRunPayload>({
      async queryFn(body, _api, _extra, baseQuery) {
        try {
          const bodyJson = JSON.stringify(body);
          const signHeaders = await buildVkSignedHeaders(bodyJson);

          const res = await baseQuery({
            url: '/api/v1/runs',
            method: 'POST',
            body: bodyJson,
            headers: {
              'Content-Type': 'application/json',
              ...signHeaders,
            },
          });

          if (res.error) return { error: res.error as any };
          return { data: res.data as number };
        } catch (e: any) {
          return { error: { status: 'CUSTOM_ERROR', error: e?.message || 'sign failed' } as any };
        }
      },
    }),
  }),
});

export const { useGetRunsQuery, useCreateRunMutation } = runnersApi;
