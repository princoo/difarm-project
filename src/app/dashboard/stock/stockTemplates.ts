import * as XLSX from 'xlsx';

export type TemplateType = 'suppliers' | 'items' | 'stock-in' | 'stock-out';

const SUPPLIERS_HEADERS = ['name', 'contactPerson', 'phone', 'email', 'address', 'status'] as const;

const ITEMS_HEADERS = [
  'name',
  'category',
  'unitOfMeasure',
  'unitsPerBox',
  'itemType',
  'reorderLevel',
  'description',
  'supplierName',
  'defaultPurchasePrice',
  'leadTimeDays',
  'quantity',
] as const;

const STOCK_IN_HEADERS = [
  'supplierName',
  'referenceNumber',
  'itemName',
  'quantity',
  'unitCost',
  'expiryDate',
  'expiryNote',
] as const;

const STOCK_OUT_HEADERS = ['referenceNumber', 'itemName', 'quantity', 'reason', 'date'] as const;

export const TEMPLATE_HEADERS: Record<TemplateType, readonly string[]> = {
  suppliers: SUPPLIERS_HEADERS,
  items: ITEMS_HEADERS,
  'stock-in': STOCK_IN_HEADERS,
  'stock-out': STOCK_OUT_HEADERS,
};

const SUPPLIERS_SAMPLE: Record<string, string> = {
  name: 'Farm Supplies Ltd',
  contactPerson: 'Jane Doe',
  phone: '+250788000000',
  email: 'jane@farmsupplies.rw',
  address: 'Kigali',
  status: 'active',
};

const ITEMS_SAMPLE: Record<string, string> = {
  name: 'Cattle Feed 50kg',
  category: 'FOOD',
  unitOfMeasure: 'kg',
  unitsPerBox: '',
  itemType: 'consumable',
  reorderLevel: '10',
  description: 'Dairy cattle feed',
  supplierName: 'Farm Supplies Ltd',
  defaultPurchasePrice: '45000',
  leadTimeDays: '3',
  quantity: '0',
};

const STOCK_IN_SAMPLE: Record<string, string> = {
  supplierName: 'Farm Supplies Ltd',
  referenceNumber: 'INV-001',
  itemName: 'Cattle Feed 50kg',
  quantity: '20',
  unitCost: '44000',
  expiryDate: '2026-12-31',
  expiryNote: '',
};

const STOCK_OUT_SAMPLE: Record<string, string> = {
  referenceNumber: 'USE-001',
  itemName: 'Cattle Feed 50kg',
  quantity: '5',
  reason: 'TRANSFER',
  date: '2026-04-05',
};

export const TEMPLATE_SAMPLE_ROW: Record<TemplateType, Record<string, string>> = {
  suppliers: SUPPLIERS_SAMPLE,
  items: ITEMS_SAMPLE,
  'stock-in': STOCK_IN_SAMPLE,
  'stock-out': STOCK_OUT_SAMPLE,
};

function buildTemplateSheet(type: TemplateType): string[][] {
  const headers = [...TEMPLATE_HEADERS[type]];
  const sample = headers.map((h) => TEMPLATE_SAMPLE_ROW[type][h] ?? '');
  return [headers, sample];
}

export function downloadTemplate(type: TemplateType, format: 'csv' | 'excel') {
  const rows = buildTemplateSheet(type);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const filename = `stock-${type}-template.${format === 'excel' ? 'xlsx' : 'csv'}`;
  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, filename);
  } else {
    const wb = XLSX.utils.book_new();
    const sheetName =
      type === 'stock-in' ? 'StockIn' : type === 'stock-out' ? 'StockOut' : type.charAt(0).toUpperCase() + type.slice(1);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  }
}

export function downloadDataExport(
  rows: string[][],
  fileBaseName: string,
  format: 'csv' | 'excel',
  sheetName = 'Export',
) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const filename = `${fileBaseName}.${format === 'excel' ? 'xlsx' : 'csv'}`;
  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, filename);
  } else {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugHeader(key: string): string {
  return String(key)
    .replace(/^\ufeff/, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-]+/g, '');
}

const HEADER_SLUG_TO_FIELD: Record<TemplateType, Record<string, string>> = {
  suppliers: {
    name: 'name',
    contactperson: 'contactPerson',
    contact: 'contactPerson',
    phone: 'phone',
    email: 'email',
    address: 'address',
    status: 'status',
  },
  items: {
    name: 'name',
    itemname: 'name',
    category: 'category',
    type: 'category',
    unitofmeasure: 'unitOfMeasure',
    unit: 'unitOfMeasure',
    uom: 'unitOfMeasure',
    unitsperbox: 'unitsPerBox',
    perbox: 'unitsPerBox',
    itemtype: 'itemType',
    reorderlevel: 'reorderLevel',
    reorder: 'reorderLevel',
    description: 'description',
    suppliername: 'supplierName',
    supplier: 'supplierName',
    defaultpurchaseprice: 'defaultPurchasePrice',
    purchaseprice: 'defaultPurchasePrice',
    defaultprice: 'defaultPurchasePrice',
    price: 'defaultPurchasePrice',
    leadtimedays: 'leadTimeDays',
    leadtime: 'leadTimeDays',
    quantity: 'quantity',
    openingquantity: 'quantity',
  },
  'stock-in': {
    suppliername: 'supplierName',
    supplier: 'supplierName',
    referencenumber: 'referenceNumber',
    reference: 'referenceNumber',
    ref: 'referenceNumber',
    itemname: 'itemName',
    item: 'itemName',
    quantity: 'quantity',
    qty: 'quantity',
    unitcost: 'unitCost',
    cost: 'unitCost',
    expirydate: 'expiryDate',
    expirynote: 'expiryNote',
  },
  'stock-out': {
    referencenumber: 'referenceNumber',
    reference: 'referenceNumber',
    ref: 'referenceNumber',
    itemname: 'itemName',
    item: 'itemName',
    quantity: 'quantity',
    qty: 'quantity',
    reason: 'reason',
    date: 'date',
  },
};

function resolveCellValue(
  row: Record<string, unknown>,
  field: string,
  slugMap: Record<string, string>,
): unknown {
  const direct = row[field];
  if (direct !== undefined && direct !== '') {
    return typeof direct === 'string' ? direct.trim() : direct;
  }
  for (const [k, v] of Object.entries(row)) {
    if (slugMap[slugHeader(k)] !== field) continue;
    if (v !== undefined && v !== '') return typeof v === 'string' ? String(v).trim() : v;
  }
  return '';
}

export function parseUploadedFile(buffer: ArrayBuffer, type: TemplateType): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: 'array', raw: true });
  const firstSheet = wb.SheetNames[0];
  if (!firstSheet) return [];
  const ws = wb.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: false });
  const headers = TEMPLATE_HEADERS[type];
  const slugMap = HEADER_SLUG_TO_FIELD[type];
  return rows
    .map((row) => {
      const out: Record<string, unknown> = {};
      for (const h of headers) {
        const val = resolveCellValue(row, h, slugMap);
        out[h] = typeof val === 'string' ? val.trim() : val;
      }
      return out;
    })
    .filter((row) => Object.values(row).some((v) => v !== '' && v != null));
}

export function buildStockOutExportRows(
  stockOuts: Array<{
    date: string;
    reference?: string | null;
    reason?: string | null;
    quantity: number;
    stock?: { name?: string };
  }>,
): string[][] {
  const headers = [...STOCK_OUT_HEADERS];
  const rows: string[][] = [headers];
  for (const t of stockOuts) {
    const d = new Date(t.date);
    const dateStr = Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
    rows.push([
      t.reference ?? '',
      t.stock?.name ?? '',
      String(t.quantity),
      t.reason ?? 'TRANSFER',
      dateStr,
    ]);
  }
  return rows;
}

export function buildCurrentStockExportRows(
  items: Array<{
    name: string;
    unitOfMeasure?: string;
    quantity: number;
    defaultPurchasePrice?: number | null;
    reorderLevel?: number | null;
  }>,
  stockStatusFn: (qty: number, reorder?: number | null) => string,
): string[][] {
  const headers = ['itemName', 'unit', 'totalQty', 'totalValue', 'reorderStatus'];
  const rows: string[][] = [headers];
  for (const item of items) {
    const qty = Number(item.quantity);
    const value = qty * Number(item.defaultPurchasePrice ?? 0);
    rows.push([
      item.name,
      item.unitOfMeasure ?? 'piece',
      String(qty),
      value.toFixed(2),
      stockStatusFn(qty, item.reorderLevel),
    ]);
  }
  return rows;
}

export function buildHistoryExportRows(
  movements: Array<{
    date: string;
    type: string;
    quantity: number;
    reference?: string | null;
    performedBy?: string | null;
    stock?: { name?: string };
  }>,
): string[][] {
  const headers = ['date', 'itemName', 'movementType', 'quantity', 'reference', 'performedBy'];
  const rows: string[][] = [headers];
  for (const m of movements) {
    rows.push([
      m.date?.slice?.(0, 10) ?? m.date,
      m.stock?.name ?? '',
      m.type === 'ADDITION' ? 'IN' : 'OUT',
      String(m.quantity),
      m.reference ?? '',
      m.performedBy ?? '',
    ]);
  }
  return rows;
}
