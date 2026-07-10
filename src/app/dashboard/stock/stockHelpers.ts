export const STOCK_UNITS = ['kg', 'liter', 'gram', 'milliliter', 'piece', 'box'] as const;
export const ITEM_TYPES = [
  { value: 'consumable', label: 'Consumable' },
  { value: 'asset', label: 'Asset' },
] as const;
export const STOCK_OUT_REASONS = [
  { value: 'WASTE', label: 'Waste / damage' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'TRANSFER', label: 'Stock-out (farm use)' },
] as const;
export const STOCK_IN_STATUSES = [
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

const LOW_STOCK_THRESHOLD = 10;

export function formatTypeLabel(type?: string) {
  if (!type) return '—';
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatStockTableDate(value: string | Date): string {
  const t = new Date(value);
  if (isNaN(t.getTime())) return '—';
  return t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function stockStatus(qty: number, reorderLevel?: number | null): 'ok' | 'low' | 'out' {
  const threshold = reorderLevel != null && reorderLevel > 0 ? reorderLevel : LOW_STOCK_THRESHOLD;
  if (qty <= 0) return 'out';
  if (qty < threshold) return 'low';
  return 'ok';
}

export function stockOutReasonLabel(reason?: string | null) {
  if (!reason) return '—';
  const found = STOCK_OUT_REASONS.find((r) => r.value === reason);
  return found?.label ?? reason.replace(/_/g, ' ').toLowerCase();
}

export function movementTypeLabel(type: string) {
  if (type === 'ADDITION') return 'In';
  if (type === 'CONSUME') return 'Out';
  return type;
}

export function lineValue(qty: number, unitCost?: number | null) {
  return Number(qty) * Number(unitCost ?? 0);
}

export function formatPrice(value?: number | null, unit?: string, unitsPerBox?: number | null) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  const n = Number(value);
  if (unit === 'box' && unitsPerBox != null && unitsPerBox > 0) {
    const perPc = n / unitsPerBox;
    return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}/bx · ${perPc.toLocaleString(undefined, { maximumFractionDigits: 4 })}/pc`;
  }
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatExpiry(expiryDate?: string | null, expiryNote?: string | null) {
  if (expiryDate) return formatStockTableDate(expiryDate);
  if (expiryNote) return expiryNote;
  return '—';
}

export type FlowPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export function getPeriodKeyAndLabel(dateStr: string, period: FlowPeriod): { key: string; label: string } {
  const d = new Date(`${dateStr.slice(0, 10)}T12:00:00`);
  if (period === 'daily') {
    const key = dateStr.slice(0, 10);
    return { key, label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) };
  }
  if (period === 'weekly') {
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    const key = d.toISOString().slice(0, 10);
    return { key, label: `Wk ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` };
  }
  if (period === 'monthly') {
    const key = dateStr.slice(0, 7);
    return { key, label: d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) };
  }
  const key = dateStr.slice(0, 4);
  return { key, label: key };
}
