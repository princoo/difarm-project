/** Normalize Express 5 param/query value to a single string. */
export function asString(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? '');
  if (value == null) return '';
  return String(value);
}

export function asOptionalString(value: unknown): string | undefined {
  const s = asString(value).trim();
  return s ? s : undefined;
}

export function asNumber(value: unknown, fallback = 0): number {
  const n = Number(asString(value));
  return Number.isFinite(n) ? n : fallback;
}
