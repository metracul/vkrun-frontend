export function tolerantParsePaceToSec(pace?: string): number | undefined {
  if (!pace) return undefined;
  const s = pace.trim().toLowerCase();
  const m = s.match(/^(\d{1,2})[:’'′](\d{1,2})(?:\s*(?:мин)?\s*\/?\s*км)?$/i);
  if (!m) return undefined;
  const min = Number(m[1]);
  const sec = Number(m[2]);
  if (!Number.isFinite(min) || !Number.isFinite(sec) || sec >= 60) return undefined;
  return min * 60 + sec;
}

export function formatTime(dateISO?: string) {
  if (!dateISO) return '';
  const d = new Date(dateISO);
  if (isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
