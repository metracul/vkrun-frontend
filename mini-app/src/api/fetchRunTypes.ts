import { HttpError } from './createRunSecure';

export type RunTypeDto = {
  key: string;
  displayName: string;
  sortOrder: number;
};

export async function fetchRunTypes(): Promise<RunTypeDto[]> {
  if (import.meta.env.VITE_DEV === 'true') {
    // локальный JSON из src/mock/runTypes.json
    const data = (await import('../mock/runTypes.json')).default as RunTypeDto[];
    return [...data].sort((a, b) =>
      a.sortOrder === b.sortOrder
        ? a.displayName.localeCompare(b.displayName)
        : a.sortOrder - b.sortOrder
    );
  }

  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  const res = await fetch(`${base}/api/v1/dictionaries/run-types`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new HttpError(res.status, text || `HTTP ${res.status}`, { raw: text });
  }
  const data = (await res.json()) as RunTypeDto[];
  return [...data].sort((a, b) =>
    a.sortOrder === b.sortOrder
      ? a.displayName.localeCompare(b.displayName)
      : a.sortOrder - b.sortOrder
  );
}
