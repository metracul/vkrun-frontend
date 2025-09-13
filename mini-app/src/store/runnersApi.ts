import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './index';

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

type BackendList<T> = { items: T[]; nextCursor?: string } | T[];
type RunDto = any;

function asArray<T>(input: BackendList<T>): { items: T[]; nextCursor?: string } {
  return Array.isArray(input) ? { items: input } : input;
}
function normalize(dto: RunDto, idx: number): RunCard {
  return {
    id: dto.id ?? idx,
    fullName: String(dto.fullName ?? dto.userName ?? 'Имя Фамилия'),
    avatarUrl: dto.avatarUrl ?? dto.avatar ?? '',
    cityDistrict: dto.cityDistrict ?? dto.city ?? '',
    dateISO: dto.dateISO ?? dto.date ?? '',
    distanceKm: dto.distanceKm ?? dto.km ?? dto.distance_km,
    pace: dto.pace ?? '',
    title: dto.title ?? dto.type ?? 'Пробежка',
    notes: dto.notes ?? dto.comment ?? '',
  };
}

export interface GetRunsArgs {
  endpoint?: string;
  page?: number;
  limit?: number;
  filters?: Record<string, string | number | boolean | undefined>;
}

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
    getRuns: b.query<{ items: RunCard[]; nextCursor?: string }, GetRunsArgs | void>({
      query: (args) => {
        const { endpoint = '/runs', page, limit, filters = {} } = args ?? {};
        const params = new URLSearchParams();
        if (page != null) params.set('page', String(page));
        if (limit != null) params.set('limit', String(limit));
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null) params.set(k, String(v));
        });
        return { url: endpoint, method: 'GET', params };
      },
      transformResponse: (raw: BackendList<RunDto>) => {
        const { items, nextCursor } = asArray(raw);
        return { items: items.map(normalize), nextCursor };
      },
    }),
  }),
});

export const { useGetRunsQuery } = runnersApi;
