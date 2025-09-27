export function parseCreatorIdFromFallback(fullName?: string): number | undefined {
  if (!fullName) return undefined;
  const m = /^id(\d+)$/.exec(fullName.trim());
  return m ? Number(m[1]) : undefined;
}

export function parsePaceToSec(mmss: string) {
  if (!mmss) return undefined;
  const m = /^(\d{1,2}):([0-5]\d)$/.exec(mmss.trim());
  if (!m) return undefined;
  const min = Number(m[1]);
  const sec = Number(m[2]);
  return min * 60 + sec;
}

export function parseNumberOrUndefined(s: string): number | undefined {
  const t = s.trim();
  if (t === '') return undefined;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}
