import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './index';
import bridge from '@vkontakte/vk-bridge';
import { getFrozenLaunchQueryString } from '../shared/vkParams';

export type RunCard = {
  id: string | number;
  creatorVkId: number;
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
  creatorId: number; // vkUserId
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

// --- подпись ТОЛЬКО для POST ---
/** SHA-256 от строки, hex lower */
async function sha256HexUtf8(str: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const view = new Uint8Array(hashBuf);
  return Array.from(view).map(b => b.toString(16).padStart(2, '0')).join('');
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
  };
}

export interface GetRunsArgs {
  endpoint?: string;
  page?: number;
  size?: number;
  filters?: Record<string, string | number | boolean | undefined>;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export const runnersApi = createApi({
  reducerPath: 'runnersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    prepareHeaders: (headers, { getState }) => {
      const qs = (getState() as RootState).vkParams.queryString;
      if (qs) headers.set('X-VK-Params', qs); // для GET
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
        const qs = params.toString();
        console.log('[getRuns] →', `${API_BASE}${endpoint}${qs ? `?${qs}` : ''}`);
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

    // POST /api/v1/runs/{id}/join c телом { runId }, с ПОДПИСЬЮ
    joinRun: b.mutation<void, string | number>({
      async queryFn(id, _api, _extraOptions, fetchWithBQ) {
        try {
          const body = { runId: Number(id) };
          const bodyJson = JSON.stringify(body);
          const signHeaders = await buildVkSignedHeaders(bodyJson);

          const res = await fetchWithBQ({
            url: `/api/v1/runs/${id}/join`,
            method: 'POST',
            body: bodyJson,
            headers: {
              'Content-Type': 'application/json',
              ...signHeaders,
            },
          });

          if (res.error) return { error: res.error as any };
          return { data: undefined };
        } catch (e: any) {
          return { error: { status: 'CUSTOM_ERROR', data: e?.message || 'sign failed' } as any };
        }
      },
    }),
  }),
});

export const {
  useGetRunsQuery,
  useGetRunByIdQuery,
  usePrefetch,
  useJoinRunMutation,
} = runnersApi;
