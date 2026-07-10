import toast from 'react-hot-toast';
import { api } from '@/hooks/api';
import { getFarmId } from '@/utils/farmId';
import { parseUploadedFile, type TemplateType } from './stockTemplates';

export type ImportRowError = { row: number; message: string };

export type ImportResult = {
  created: number;
  details: ImportRowError[];
  message?: string;
};

const STOCK_CATEGORIES = new Set([
  'FOOD',
  'MEDICATION',
  'CONSTRUCTION',
  'WATER',
  'FEED_ACCESSORIES',
  'HYGIENE_MATERIALS',
]);

const UNITS = new Set(['kg', 'liter', 'gram', 'milliliter', 'piece', 'box']);
const STOCK_OUT_REASONS = new Set(['WASTE', 'ADJUSTMENT', 'TRANSFER']);

function normalizeKey(s: string) {
  return s.trim().toLowerCase();
}

function normalizeCategory(raw: string): string | null {
  const upper = raw.trim().toUpperCase().replace(/\s+/g, '_');
  if (STOCK_CATEGORIES.has(upper)) return upper;
  const aliases: Record<string, string> = {
    FEED: 'FOOD',
    FEEDACCESSORIES: 'FEED_ACCESSORIES',
    HYGIENE: 'HYGIENE_MATERIALS',
  };
  return aliases[upper.replace(/_/g, '')] ?? null;
}

function normalizeUnit(raw: string): string | null {
  const u = raw.trim().toLowerCase();
  if (UNITS.has(u)) return u;
  if (u === 'l') return 'liter';
  if (u === 'ml') return 'milliliter';
  if (u === 'g') return 'gram';
  if (u === 'pcs' || u === 'pc') return 'piece';
  return null;
}

export function showImportReport(result: ImportResult, entityLabel: string) {
  const { created, details } = result;
  const skipped = details.length;
  const totalRows = created + skipped;
  const errorPreview = (max = 8) =>
    details
      .slice(0, max)
      .map((d) => `Row ${d.row}: ${d.message}`)
      .join('\n');
  const more = skipped > 8 ? `\n…${skipped - 8} more row(s). Fix issues and re-upload.` : '';

  if (created === 0 && skipped > 0) {
    toast.error(`Import failed — 0 ${entityLabel} imported.\n${errorPreview()}${more}`, { duration: 14000 });
  } else if (created === 0) {
    toast.error(result.message ?? `No ${entityLabel} imported`);
  } else if (skipped > 0) {
    toast(
      `Imported ${created} of ${totalRows} row(s) — ${skipped} skipped.\n${errorPreview()}${more}`,
      { icon: '⚠️', duration: 14000 },
    );
  } else {
    toast.success(totalRows > 0 ? `Imported all ${created} row(s).` : (result.message ?? 'Import completed'));
  }
}

export async function runStockImport(
  file: File,
  type: TemplateType,
  context: {
    suppliers?: any[];
    stocks?: any[];
  },
): Promise<ImportResult> {
  const farmId = getFarmId();
  if (!farmId) {
    return { created: 0, details: [{ row: 0, message: 'No farm selected' }] };
  }

  const buffer = await file.arrayBuffer();
  const rows = parseUploadedFile(buffer, type);
  if (rows.length === 0) {
    return { created: 0, details: [{ row: 0, message: 'File is empty or has no data rows' }] };
  }

  switch (type) {
    case 'suppliers':
      return importSuppliers(rows, farmId);
    case 'items':
      return importItems(rows, farmId, context.suppliers ?? []);
    case 'stock-in':
      return importStockIn(rows, farmId, context.suppliers ?? [], context.stocks ?? []);
    case 'stock-out':
      return importStockOut(rows, farmId, context.stocks ?? []);
    default:
      return { created: 0, details: [{ row: 0, message: 'Unknown import type' }] };
  }
}

async function importSuppliers(rows: Record<string, unknown>[], farmId: string): Promise<ImportResult> {
  let created = 0;
  const details: ImportRowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const name = String(raw.name ?? '').trim();
    if (!name) {
      details.push({ row: i + 2, message: 'Name is required' });
      continue;
    }
    try {
      await api.post(`/suppliers/${farmId}`, {
        name,
        contactPerson: raw.contactPerson || undefined,
        phone: raw.phone || undefined,
        email: raw.email || undefined,
        address: raw.address || undefined,
        status: raw.status || 'active',
      });
      created++;
    } catch (err: any) {
      details.push({
        row: i + 2,
        message: err.response?.data?.message ?? err.message ?? 'Failed to create supplier',
      });
    }
  }

  return { created, details, message: `Imported ${created} supplier(s).` };
}

async function importItems(
  rows: Record<string, unknown>[],
  farmId: string,
  suppliers: any[],
): Promise<ImportResult> {
  const supplierByName = new Map(suppliers.map((s) => [normalizeKey(s.name), s.id]));
  let created = 0;
  const details: ImportRowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const name = String(raw.name ?? '').trim();
    if (!name) {
      details.push({ row: i + 2, message: 'Name is required' });
      continue;
    }
    const category = normalizeCategory(String(raw.category ?? 'FOOD'));
    if (!category) {
      details.push({ row: i + 2, message: 'Invalid category. Use FOOD, MEDICATION, CONSTRUCTION, WATER, FEED_ACCESSORIES, HYGIENE_MATERIALS' });
      continue;
    }
    const unitOfMeasure = normalizeUnit(String(raw.unitOfMeasure ?? 'piece'));
    if (!unitOfMeasure) {
      details.push({ row: i + 2, message: 'Invalid unit. Use kg, liter, gram, milliliter, piece, or box' });
      continue;
    }
    const supplierName = String(raw.supplierName ?? '').trim();
    const supplierId = supplierName ? supplierByName.get(normalizeKey(supplierName)) : undefined;
    if (supplierName && !supplierId) {
      details.push({ row: i + 2, message: `Supplier not found: ${supplierName}` });
      continue;
    }
    const qty = raw.quantity !== '' && raw.quantity != null ? Number(raw.quantity) : 0;
    if (Number.isNaN(qty) || qty < 0) {
      details.push({ row: i + 2, message: 'Quantity must be 0 or more' });
      continue;
    }
    try {
      await api.post(`/stocks/${farmId}`, {
        name,
        type: category,
        unitOfMeasure,
        unitsPerBox: unitOfMeasure === 'box' && raw.unitsPerBox ? Number(raw.unitsPerBox) : undefined,
        itemType: raw.itemType || 'consumable',
        reorderLevel: raw.reorderLevel !== '' && raw.reorderLevel != null ? Number(raw.reorderLevel) : undefined,
        description: raw.description || undefined,
        supplierId: supplierId || undefined,
        defaultPurchasePrice:
          raw.defaultPurchasePrice !== '' && raw.defaultPurchasePrice != null
            ? Number(raw.defaultPurchasePrice)
            : undefined,
        leadTimeDays:
          raw.leadTimeDays !== '' && raw.leadTimeDays != null ? Number(raw.leadTimeDays) : undefined,
        quantity: qty,
        status: 'active',
      });
      created++;
    } catch (err: any) {
      details.push({
        row: i + 2,
        message: err.response?.data?.message ?? err.message ?? 'Failed to create item',
      });
    }
  }

  return { created, details, message: `Imported ${created} item(s).` };
}

async function importStockIn(
  rows: Record<string, unknown>[],
  farmId: string,
  suppliers: any[],
  stocks: any[],
): Promise<ImportResult> {
  const supplierByName = new Map(suppliers.map((s) => [normalizeKey(s.name), s.id]));
  const stockByName = new Map(stocks.map((s) => [normalizeKey(s.name), s.id]));
  let created = 0;
  const details: ImportRowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const qty = Number(raw.quantity);
    if (Number.isNaN(qty) || qty <= 0) {
      details.push({ row: i + 2, message: 'Quantity must be a positive number' });
      continue;
    }
    const supplierName = String(raw.supplierName ?? '').trim();
    const supplierId = supplierName ? supplierByName.get(normalizeKey(supplierName)) : undefined;
    if (supplierName && !supplierId) {
      details.push({ row: i + 2, message: `Supplier not found: ${supplierName}` });
      continue;
    }
    const itemName = String(raw.itemName ?? '').trim();
    const stockId = itemName ? stockByName.get(normalizeKey(itemName)) : undefined;
    if (!stockId) {
      details.push({ row: i + 2, message: `Item not found: ${itemName}` });
      continue;
    }
    try {
      await api.post(`/stock-transactions/${farmId}`, {
        stockId,
        quantity: qty,
        type: 'ADDITION',
        supplierId,
        reference: raw.referenceNumber || undefined,
        unitCost: raw.unitCost !== '' && raw.unitCost != null ? Number(raw.unitCost) : undefined,
        expiryDate: raw.expiryDate || undefined,
        expiryNote: raw.expiryNote || undefined,
        status: 'CONFIRMED',
      });
      created++;
    } catch (err: any) {
      details.push({
        row: i + 2,
        message: err.response?.data?.message ?? err.message ?? 'Failed to create stock-in',
      });
    }
  }

  return { created, details, message: `Imported ${created} stock-in line(s).` };
}

async function importStockOut(
  rows: Record<string, unknown>[],
  farmId: string,
  stocks: any[],
): Promise<ImportResult> {
  const stockByName = new Map(stocks.map((s) => [normalizeKey(s.name), s.id]));
  let created = 0;
  const details: ImportRowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const qty = Number(raw.quantity);
    if (Number.isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      details.push({ row: i + 2, message: 'Quantity must be a positive integer' });
      continue;
    }
    const reason = String(raw.reason ?? 'TRANSFER').trim().toUpperCase();
    if (!STOCK_OUT_REASONS.has(reason)) {
      details.push({ row: i + 2, message: `Invalid reason: ${raw.reason}. Use WASTE, ADJUSTMENT, or TRANSFER` });
      continue;
    }
    const itemName = String(raw.itemName ?? '').trim();
    const stockId = itemName ? stockByName.get(normalizeKey(itemName)) : undefined;
    if (!stockId) {
      details.push({ row: i + 2, message: `Item not found: ${itemName}` });
      continue;
    }
    let date: string | undefined;
    const dateStr = String(raw.date ?? '').trim();
    if (dateStr) {
      const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
      if (Number.isNaN(d.getTime())) {
        details.push({ row: i + 2, message: `Invalid date: ${dateStr}` });
        continue;
      }
      date = d.toISOString();
    }
    try {
      await api.post(`/stock-transactions/${farmId}`, {
        stockId,
        quantity: qty,
        type: 'CONSUME',
        reference: raw.referenceNumber || undefined,
        reason,
        date,
      });
      created++;
    } catch (err: any) {
      details.push({
        row: i + 2,
        message: err.response?.data?.message ?? err.message ?? 'Failed to create stock-out',
      });
    }
  }

  return { created, details, message: `Imported ${created} stock-out line(s).` };
}
