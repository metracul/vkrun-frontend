import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './index';

export type RunCard = {
  id: string | number;
  creatorVkId: number;        // важно для профиля VK
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
  creatorId: number;          // vkUserId
  cityName: string;
  districtName?: string | null;
  startAt: string;
  durationMinutes: number;
  distanceKm: number;
  paceSecPerKm?: number | null;
  description?: string | null;
  participantsCount: number;
};

function secToPace(sec?: number | null): string {
  if (sec == null || sec <= 0) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')} /км`;
}

function normalize(dto: RunDto): RunCard {
  return {
    id: dto.id,
    creatorVkId: dto.creatorId,
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

export const runnersApi = createApi({
  reducerPath: 'runnersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
    prepareHeaders: (headers, { getState }) => {
      const qs = (getState() as RootState).vkParams.queryString;
      if (qs) headers.set('X-VK-Params', qs); // бек ожидает
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  endpoints: (b) => ({
    getRuns: b.query<{ items: RunCard[]; nextCursor?: string }, GetRunsArgs | void>({
      query: (args) => {
        const { endpoint = '/api/v1/runs', page, size, filters = {} } = args ?? {};
        const params = new URLSearchParams();
        if (page != null) params.set('page', String(page));
        if (size != null) params.set('size', String(size));
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
        });

        const base = import.meta.env.VITE_API_BASE_URL ?? '';
        const qs = params.toString();

        console.log('[getRuns] →', `${base}${endpoint}${qs ? `?${qs}` : ''}`);
        return { url: endpoint, method: 'GET', params };
      },
      transformResponse: (raw: RunDto[]) => {
        const items = Array.isArray(raw) ? raw.map(normalize) : [];
        return { items };
      },
    }),

    getRunById: b.query<RunCard, string | number>({
      query: (id) => ({
        url: `/api/v1/runs/${id}`,
        method: 'GET',
      }),
      transformResponse: (raw: RunDto) => normalize(raw),
    }),

    // МУТАЦИЯ: записаться на пробежку
    joinRun: b.mutation<void, string | number>({
      query: (id) => ({
        url: `/api/v1/runs/${id}/join`,
        method: 'POST',
        body: { runId: Number(id) }, // бек требует body.runId == path id
      }),
    }),
  }),
});

export const {
  useGetRunsQuery,
  useGetRunByIdQuery,
  usePrefetch,
  useJoinRunMutation, // ← экспорт хука
} = runnersApi;
