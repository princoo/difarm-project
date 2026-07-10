'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { useStock } from '@/hooks/api/stock';
import { useStockTransaction } from '@/hooks/api/stock_transactions';
import { useSuppliers } from '@/hooks/api/suppliers';
import { getFarmId } from '@/utils/farmId';
import { isLoggedIn } from '@/hooks/api/auth';
import { canCreateEntity, canUpdateEntity, canDeleteEntity } from '@/utils/permissions';
import toast from 'react-hot-toast';
import { cn } from '@/utils';
import AddStockModal from './add_stock';
import UpdateStockModal from './update_stock';
import ConfirmDeleteStockModal from './delete';
import AddSupplierModal from './add_supplier';
import UpdateSupplierModal from './update_supplier';
import ConfirmDeleteSupplierModal from './delete_supplier';
import AddStockTransactionModal from '../stock_transaction/add';
import UpdateStockTransactionModal from '../stock_transaction/update';
import ConfirmDeleteTransactionModal from '../stock_transaction/delete';
import {
  formatTypeLabel,
  formatStockTableDate,
  stockStatus,
  stockOutReasonLabel,
  lineValue,
  formatPrice,
  formatExpiry,
  getPeriodKeyAndLabel,
  STOCK_OUT_REASONS,
  type FlowPeriod,
} from './stockHelpers';
import { PosStitchMetricCard } from '@/components/Stock/stitch/PosStitchMetricCard';
import { StockTableTitle } from '@/components/Stock/stitch/StockTableTitle';
import { StockTableIconButton } from '@/components/Stock/stitch/StockTableIconButton';
import { BulkImportToolbar, DataSnapshotToolbar } from '@/components/Stock/stitch/StockImportExport';
import {
  buildCurrentStockExportRows,
  buildHistoryExportRows,
  buildStockOutExportRows,
  downloadDataExport,
} from './stockTemplates';
import {
  posMetricsGridClass,
  posPageShellClass,
  posPanelClass,
  posStitchCardOnShadcnClass,
  posTableScrollClass,
  STOCK_TABLE_ACTIONS_CELL,
  STOCK_TABLE_ACTIONS_HEAD,
} from '@/components/Stock/stitch/layout';
import {
  MagnifyingGlassIcon,
  ChartBarIcon,
  CubeIcon,
  TruckIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  Square3Stack3DIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Tab = 'overview' | 'suppliers' | 'items' | 'receive' | 'stockout' | 'currentstock' | 'history';
type ItemsTableView = 'consumable' | 'asset';

const STOCK_TYPES = ['FOOD', 'MEDICATION', 'CONSTRUCTION', 'WATER', 'FEED_ACCESSORIES', 'HYGIENE_MATERIALS'];

const TABS: { id: Tab; label: string; icon: typeof CubeIcon }[] = [
  { id: 'overview', label: 'Overview', icon: ChartBarIcon },
  { id: 'suppliers', label: 'Suppliers', icon: TruckIcon },
  { id: 'items', label: 'Items', icon: CubeIcon },
  { id: 'receive', label: 'Stock-In', icon: ArrowDownCircleIcon },
  { id: 'stockout', label: 'Stock-Out', icon: ArrowUpCircleIcon },
  { id: 'currentstock', label: 'Current Stock', icon: Square3Stack3DIcon },
  { id: 'history', label: 'Stock History', icon: ClockIcon },
];

function performerDisplay(tx: any) {
  return tx?.performedBy || tx?.createdBy?.name || tx?.createdBy?.email || '—';
}

function supplierNameForTx(t: any) {
  return t.supplier?.name || t.stock?.supplier?.name || '—';
}

function itemCountForSupplier(supplierId: string, stockList: any[]) {
  return stockList.filter((s) => s.supplierId === supplierId).length;
}

function StitchCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(posStitchCardOnShadcnClass, className)}>{children}</div>;
}

export default function StockManagementPage() {
  const navigate = useNavigate();
  const farmId = getFarmId();
  const role = isLoggedIn()?.role ?? '';
  const canCreate = canCreateEntity('stock', role);
  const canUpdate = canUpdateEntity('stock', role);
  const canDelete = canDeleteEntity('stock', role);
  const canCreateTx = canCreateEntity('stockTransactions', role);
  const canUpdateTx = canUpdateEntity('stockTransactions', role);
  const canDeleteTx = canDeleteEntity('stockTransactions', role);
  const { stocks, getStock, deleteStock, loading: stockLoading }: any = useStock();
  const {
    stock_transactions,
    getStockTransactions,
    deleteTransaction,
    loading: txLoading,
  }: any = useStockTransaction();
  const {
    suppliers,
    getSuppliers,
    deleteSupplier,
    loading: supplierLoading,
  }: any = useSuppliers();

  const [tab, setTab] = useState<Tab>('overview');
  const [overviewFlowPeriod, setOverviewFlowPeriod] = useState<FlowPeriod>('weekly');
  const [itemsTableView, setItemsTableView] = useState<ItemsTableView>('consumable');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState('');
  const [filterTxType, setFilterTxType] = useState('');
  const [filterSupplierStatus, setFilterSupplierStatus] = useState('');
  const [filterReceiveStatus, setFilterReceiveStatus] = useState('');
  const [filterStockOutReason, setFilterStockOutReason] = useState('');

  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isUpdateStockOpen, setIsUpdateStockOpen] = useState(false);
  const [isDeleteStockOpen, setIsDeleteStockOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);

  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isUpdateSupplierOpen, setIsUpdateSupplierOpen] = useState(false);
  const [isDeleteSupplierOpen, setIsDeleteSupplierOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isUpdateTxOpen, setIsUpdateTxOpen] = useState(false);
  const [isDeleteTxOpen, setIsDeleteTxOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [txDefaultType, setTxDefaultType] = useState<'ADDITION' | 'CONSUME' | undefined>();

  const loadAll = useCallback(() => {
    if (!farmId) return;
    getStock('pageSize=100');
    getStockTransactions('pageSize=100');
    getSuppliers('pageSize=100');
  }, [farmId, getStock, getStockTransactions, getSuppliers]);

  useEffect(() => {
    if (!farmId) return;
    getStock('pageSize=100');
    getStockTransactions('pageSize=100', true);
    getSuppliers('pageSize=100');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  const stockList: any[] = stocks?.data?.data ?? [];
  const txList: any[] = stock_transactions?.data?.data ?? [];
  const supplierList: any[] = useMemo(() => {
    if (Array.isArray(suppliers)) return suppliers;
    if (Array.isArray(suppliers?.data)) return suppliers.data;
    if (Array.isArray(suppliers?.data?.data)) return suppliers.data.data;
    return [];
  }, [suppliers]);
  const stockInList = useMemo(() => txList.filter((t) => t.type === 'ADDITION'), [txList]);
  const stockOutList = useMemo(() => txList.filter((t) => t.type === 'CONSUME'), [txList]);

  const overviewData = useMemo(() => {
    const totalQty = stockList.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const totalValue = stockList.reduce(
      (s, i) => s + Number(i.quantity) * Number(i.defaultPurchasePrice ?? 0),
      0,
    );
    const lowOrOutList = stockList
      .filter((i) => stockStatus(Number(i.quantity), i.reorderLevel) !== 'ok')
      .map((item) => ({
        item,
        total_quantity: item.quantity,
        reorder_status: stockStatus(Number(item.quantity), item.reorderLevel),
      }));
    const recentMovements = [...txList]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    const totalInValue = stockInList.reduce(
      (s, t) => s + lineValue(Number(t.quantity), t.unitCost),
      0,
    );
    return {
      totalValue,
      itemCount: stockList.length,
      totalInValue,
      lowOrOutList,
      recentMovements,
      suppliersCount: supplierList.filter((s) => s.status !== 'inactive').length,
    };
  }, [stockList, stockInList, txList, supplierList]);

  const stockFlowData = useMemo(() => {
    const map = new Map<string, { in: number; out: number; label: string }>();
    const add = (dateStr: string, type: 'in' | 'out', qty: number) => {
      const raw = dateStr?.slice(0, 10) || '';
      if (!raw) return;
      const { key, label } = getPeriodKeyAndLabel(raw, overviewFlowPeriod);
      const cur = map.get(key) ?? { in: 0, out: 0, label };
      if (type === 'in') cur.in += qty;
      else cur.out += qty;
      map.set(key, cur);
    };
    stockInList.forEach((t) => add(t.date, 'in', Number(t.quantity)));
    stockOutList.forEach((t) => add(t.date, 'out', Number(t.quantity)));
    const limits: Record<FlowPeriod, number> = { daily: 31, weekly: 16, monthly: 12, yearly: 6 };
    return Array.from(map.entries())
      .map(([key, v]) => ({ ...v, key, net: v.in - v.out }))
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-limits[overviewFlowPeriod]);
  }, [stockInList, stockOutList, overviewFlowPeriod]);

  const q = searchQuery.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    return stockList.filter((item) => {
      const itemType = (item.itemType || 'consumable').toLowerCase();
      if (itemsTableView === 'consumable' && itemType === 'asset') return false;
      if (itemsTableView === 'asset' && itemType !== 'asset') return false;
      if (filterType && item.type !== filterType) return false;
      if (q && !item.name?.toLowerCase().includes(q) && !item.type?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [stockList, filterType, q, itemsTableView]);

  const filteredSuppliers = useMemo(() => {
    return supplierList.filter((s) => {
      if (filterSupplierStatus && s.status !== filterSupplierStatus) return false;
      if (q && !s.name?.toLowerCase().includes(q) && !s.contactPerson?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [supplierList, filterSupplierStatus, q]);

  const filteredCurrent = useMemo(() => {
    return stockList.filter((item) => {
      const st = stockStatus(Number(item.quantity), item.reorderLevel);
      if (filterStockStatus && st !== filterStockStatus) return false;
      if (q && !item.name?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [stockList, filterStockStatus, q]);

  const filterTx = (list: any[], extra?: (t: any) => boolean) =>
    list.filter((t) => {
      if (filterTxType && t.type !== filterTxType) return false;
      if (q && !t.stock?.name?.toLowerCase().includes(q) && !t.reference?.toLowerCase().includes(q)) return false;
      if (extra && !extra(t)) return false;
      return true;
    });

  const filteredIn = filterTx(stockInList, (t) => !filterReceiveStatus || t.status === filterReceiveStatus);
  const filteredOut = filterTx(stockOutList, (t) => !filterStockOutReason || t.reason === filterStockOutReason);
  const filteredHistory = filterTx(txList);

  const stockInTotals = useMemo(
    () => ({
      sumQty: filteredIn.reduce((s, t) => s + Number(t.quantity), 0),
      sumValue: filteredIn.reduce((s, t) => s + lineValue(Number(t.quantity), t.unitCost), 0),
    }),
    [filteredIn],
  );
  const stockOutTotals = useMemo(
    () => ({
      sumQty: filteredOut.reduce((s, t) => s + Number(t.quantity), 0),
      sumValue: filteredOut.reduce((s, t) => s + lineValue(Number(t.quantity), t.unitCost), 0),
    }),
    [filteredOut],
  );

  const openAddTx = (type: 'ADDITION' | 'CONSUME') => {
    setTxDefaultType(type);
    setIsAddTxOpen(true);
  };

  const handleDeleteStock = async () => {
    if (!selectedStock) return;
    try {
      await deleteStock(selectedStock.id);
      loadAll();
    } catch {
      toast.error('Failed to delete stock item');
    } finally {
      setIsDeleteStockOpen(false);
    }
  };

  const handleDeleteTx = async () => {
    if (!selectedTx) return;
    try {
      await deleteTransaction(selectedTx.id);
      loadAll();
    } catch {
      toast.error('Failed to delete transaction');
    } finally {
      setIsDeleteTxOpen(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;
    try {
      await deleteSupplier(selectedSupplier.id);
      loadAll();
    } catch {
      toast.error('Failed to delete supplier');
    } finally {
      setIsDeleteSupplierOpen(false);
    }
  };

  const searchPlaceholder =
    tab === 'overview'
      ? 'Search overview…'
      : tab === 'suppliers'
        ? 'Search suppliers…'
        : tab === 'items'
        ? 'Search items…'
        : tab === 'currentstock'
          ? 'Search current stock…'
          : tab === 'receive'
            ? 'Search stock-in…'
            : tab === 'stockout'
              ? 'Search stock-out…'
              : 'Search history…';

  if (!farmId) {
    return (
      <div className="stock-mgmt-page p-6 text-center">
        <p className="text-linked">Select a farm first to manage stock.</p>
        <button type="button" className="btn btn-primary mt-4" onClick={() => navigate('/choosefarm')}>
          Choose farm
        </button>
      </div>
    );
  }

  return (
    <div className={cn('stock-mgmt-page', posPageShellClass, 'gap-2')}>
      <div className="grid shrink-0 grid-cols-1 items-center gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-x-3">
        <p className="text-xs text-linked sm:justify-self-start">
          <button type="button" onClick={() => navigate('/account')} className="hover:text-primary">
            Dashboard
          </button>
          <span className="mx-1">•</span>
          <span className="text-primary">Stock</span>
        </p>
        <h1 className="text-center text-xl font-bold tracking-tight stock-text sm:justify-self-center sm:text-2xl">
          Stock Management
        </h1>
        <div className="hidden sm:block sm:justify-self-end" aria-hidden />
      </div>

      <div className="flex flex-col gap-2 border-b border-gray-200 pb-1.5 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-1.5 text-sm font-medium transition-colors',
                tab === id ? 'border-primary text-primary' : 'stock-tab-inactive border-transparent',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="relative flex-1 sm:w-44">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-linked" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pos-stitch-control h-8 w-full pl-8 text-sm"
            />
          </div>
          {tab === 'suppliers' && (
            <select
              value={filterSupplierStatus}
              onChange={(e) => setFilterSupplierStatus(e.target.value)}
              className="pos-stitch-control h-8 rounded-md px-2.5 text-sm"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          )}
          {tab === 'items' && (
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pos-stitch-control h-8 rounded-md px-2.5 text-sm"
            >
              <option value="">All categories</option>
              {STOCK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {formatTypeLabel(t)}
                </option>
              ))}
            </select>
          )}
          {tab === 'currentstock' && (
            <select
              value={filterStockStatus}
              onChange={(e) => setFilterStockStatus(e.target.value)}
              className="pos-stitch-control h-8 rounded-md px-2.5 text-sm"
            >
              <option value="">All statuses</option>
              <option value="ok">OK</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          )}
          {tab === 'receive' && (
            <select
              value={filterReceiveStatus}
              onChange={(e) => setFilterReceiveStatus(e.target.value)}
              className="pos-stitch-control h-8 rounded-md px-2.5 text-sm"
            >
              <option value="">All statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}
          {tab === 'stockout' && (
            <select
              value={filterStockOutReason}
              onChange={(e) => setFilterStockOutReason(e.target.value)}
              className="pos-stitch-control h-8 rounded-md px-2.5 text-sm"
            >
              <option value="">All reasons</option>
              {STOCK_OUT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          )}
          {tab === 'history' && (
            <select
              value={filterTxType}
              onChange={(e) => setFilterTxType(e.target.value)}
              className="pos-stitch-control h-8 rounded-md px-2.5 text-sm"
            >
              <option value="">All types</option>
              <option value="ADDITION">In</option>
              <option value="CONSUME">Out</option>
            </select>
          )}
        </div>
      </div>

      <section className={posPanelClass}>
        <div
          className={cn(
            'min-h-0 flex-1',
            ['items', 'suppliers', 'receive', 'stockout', 'currentstock', 'history'].includes(tab)
              ? 'overflow-hidden'
              : 'overflow-y-auto',
          )}
        >
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className={posMetricsGridClass}>
                <PosStitchMetricCard
                  icon={CurrencyDollarIcon}
                  label="Total inventory value"
                  value={overviewData.totalValue.toFixed(2)}
                />
                <PosStitchMetricCard icon={CubeIcon} label="Items (SKUs)" value={overviewData.itemCount} />
                <PosStitchMetricCard
                  icon={ExclamationTriangleIcon}
                  label="Total expenses (all purchases)"
                  value={overviewData.totalInValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  accent="amber"
                />
                <PosStitchMetricCard icon={UserGroupIcon} label="Active suppliers" value={overviewData.suppliersCount} />
              </div>

              <StitchCard className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold stock-text">
                    Stock flow – how stock-in covers stock-out
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setOverviewFlowPeriod(p)}
                        className={cn(
                          'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                          overviewFlowPeriod === p
                            ? 'bg-primary text-white'
                            : 'stock-period-inactive rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                        )}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {txLoading ? (
                  <div className="flex h-80 items-center justify-center text-sm text-linked">
                    Loading stock-in / stock-out summary…
                  </div>
                ) : stockFlowData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={stockFlowData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e6ed" className="dark:opacity-30" />
                        <XAxis dataKey="label" tick={{ fill: '#888ea8', fontSize: 11 }} />
                        <YAxis yAxisId="qty" tick={{ fill: '#888ea8', fontSize: 12 }} />
                        <YAxis yAxisId="net" orientation="right" tick={{ fill: '#888ea8', fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e0e6ed',
                            borderRadius: 8,
                            color: '#0e1726',
                          }}
                          formatter={(value, name) => [
                            Number(value ?? 0),
                            name === 'in' ? 'Stock In' : name === 'out' ? 'Stock Out' : 'Net (In − Out)',
                          ]}
                          labelFormatter={(label) => `Period: ${label}`}
                        />
                        <Legend
                          formatter={(value) =>
                            value === 'in' ? 'Stock In' : value === 'out' ? 'Stock Out' : 'Net balance'
                          }
                        />
                        <Bar yAxisId="qty" dataKey="in" fill="#228B22" radius={[4, 4, 0, 0]} name="in" />
                        <Bar yAxisId="qty" dataKey="out" fill="#e7515a" radius={[4, 4, 0, 0]} name="out" />
                        <Line
                          yAxisId="net"
                          type="monotone"
                          dataKey="net"
                          stroke="#e2a03f"
                          strokeWidth={2}
                          dot={{ fill: '#e2a03f' }}
                          name="net"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="py-12 text-center text-sm text-linked">
                    No stock-in or stock-out data for the selected period
                  </p>
                )}
              </StitchCard>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <StitchCard className="p-5">
                  <StockTableTitle>Low / out of stock</StockTableTitle>
                  {overviewData.lowOrOutList.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 text-left dark:border-gray-700">
                            <th className="py-2 font-medium text-linked">Item</th>
                            <th className="py-2 font-medium text-linked">Qty</th>
                            <th className="py-2 font-medium text-linked">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overviewData.lowOrOutList.slice(0, 10).map((r) => (
                            <tr key={r.item.id} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-2 stock-text">{r.item.name}</td>
                              <td className="py-2 text-linked">{r.total_quantity}</td>
                              <td className="py-2">
                                <span
                                  className={cn(
                                    r.reorder_status === 'out' ? 'text-danger' : 'text-warning',
                                  )}
                                >
                                  {r.reorder_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="py-12 text-center text-sm text-linked">All items OK</p>
                  )}
                </StitchCard>
                <StitchCard className="p-5">
                  <StockTableTitle>Recent activity</StockTableTitle>
                  {overviewData.recentMovements.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 text-left dark:border-gray-700">
                            <th className="py-2 font-medium text-linked">Item</th>
                            <th className="py-2 font-medium text-linked">Type</th>
                            <th className="py-2 font-medium text-linked">Qty</th>
                            <th className="py-2 font-medium text-linked">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overviewData.recentMovements.map((m: any) => (
                            <tr key={m.id} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-2 stock-text">{m.stock?.name || '—'}</td>
                              <td className="py-2 text-linked">
                                {m.type === 'ADDITION' ? 'In' : 'Out'}
                              </td>
                              <td className="py-2 text-linked">{m.quantity}</td>
                              <td className="py-2 text-linked">{new Date(m.date).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="py-12 text-center text-sm text-linked">No movements yet</p>
                  )}
                </StitchCard>
              </div>
            </div>
          )}

          {tab === 'suppliers' && (
            <div className="flex h-full min-h-0 flex-col gap-0">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 pb-1">
                <BulkImportToolbar type="suppliers" onSuccess={loadAll} />
                {canCreate && (
                <button type="button" className="btn btn-primary gap-1" onClick={() => setIsAddSupplierOpen(true)}>
                  <PlusIcon className="h-4 w-4" />
                  Add Supplier
                </button>
                )}
              </div>
              <StitchCard className="flex min-h-0 flex-1 flex-col gap-2 p-3 sm:p-4">
                <StockTableTitle compact>List of all suppliers</StockTableTitle>
                <div className={posTableScrollClass}>
                  <table className="pos-stock-table pos-stock-table-compact min-w-[920px]">
                    <thead>
                      <tr className="pos-stitch-table-head text-left">
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Name</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Contact</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Phone</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Status</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold text-right dark:border-gray-700">Items</th>
                        <th className={cn(STOCK_TABLE_ACTIONS_HEAD, 'whitespace-nowrap')}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierLoading ? (
                        <tr>
                          <td colSpan={6} className="border border-gray-200 px-4 py-10 text-center text-linked dark:border-gray-700">
                            Loading suppliers…
                          </td>
                        </tr>
                      ) : filteredSuppliers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="border border-gray-200 px-4 py-10 text-center text-linked dark:border-gray-700">
                            No suppliers found
                          </td>
                        </tr>
                      ) : (
                        filteredSuppliers.map((s) => (
                          <tr key={s.id}>
                            <td className="border border-gray-200 px-2 py-1.5 align-top font-medium dark:border-gray-700">{s.name}</td>
                            <td className="border border-gray-200 px-2 py-1.5 align-top text-linked dark:border-gray-700">{s.contactPerson ?? '—'}</td>
                            <td className="border border-gray-200 px-2 py-1.5 align-top text-linked dark:border-gray-700">{s.phone ?? '—'}</td>
                            <td className="border border-gray-200 px-2 py-1.5 align-top capitalize text-linked dark:border-gray-700">{s.status ?? 'active'}</td>
                            <td className="border border-gray-200 px-2 py-1.5 text-right tabular-nums dark:border-gray-700">
                              {itemCountForSupplier(s.id, stockList)}
                            </td>
                            <td className={STOCK_TABLE_ACTIONS_CELL}>
                              <div className="flex items-center justify-end gap-0.5">
                                {canUpdate && (
                                <StockTableIconButton
                                  label="Edit supplier"
                                  onClick={() => {
                                    setSelectedSupplier(s);
                                    setIsUpdateSupplierOpen(true);
                                  }}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </StockTableIconButton>
                                )}
                                {canDelete && (
                                <StockTableIconButton
                                  label="Delete supplier"
                                  className="text-danger hover:bg-danger/10"
                                  onClick={() => {
                                    setSelectedSupplier(s);
                                    setIsDeleteSupplierOpen(true);
                                  }}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </StockTableIconButton>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </StitchCard>
            </div>
          )}

          {tab === 'items' && (
            <div className="flex h-full min-h-0 flex-col gap-0">
              <div className="grid shrink-0 grid-cols-1 items-center gap-y-2 pb-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-x-4">
                <div className="flex flex-nowrap items-center gap-3 lg:justify-self-start">
                  <BulkImportToolbar
                    type="items"
                    onSuccess={loadAll}
                    importContext={{ suppliers: supplierList, stocks: stockList }}
                  />
                </div>
                <div className="relative z-10 flex shrink-0 justify-center px-1 lg:px-0">
                  <div className="inline-flex overflow-hidden rounded-full pos-stitch-control p-0.5">
                    <button
                      type="button"
                      onClick={() => setItemsTableView('consumable')}
                      className={cn(
                        'rounded px-3 py-1.5 text-sm font-medium',
                        itemsTableView === 'consumable' ? 'bg-primary text-white' : 'stock-tab-inactive hover:text-primary',
                      )}
                    >
                      Consumables
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemsTableView('asset')}
                      className={cn(
                        'rounded px-3 py-1.5 text-sm font-medium',
                        itemsTableView === 'asset' ? 'bg-primary text-white' : 'stock-tab-inactive hover:text-primary',
                      )}
                    >
                      Assets
                    </button>
                  </div>
                </div>
                <div className="flex min-w-0 items-center justify-end gap-1.5">
                  {canCreate && (
                  <button type="button" className="btn btn-primary shrink-0 gap-1" onClick={() => setIsAddStockOpen(true)}>
                    <PlusIcon className="h-4 w-4" />
                    Add Item
                  </button>
                  )}
                </div>
              </div>
              <StitchCard className="mt-2 flex min-h-0 flex-1 flex-col gap-2 p-3 sm:p-4">
                <StockTableTitle compact>Items list</StockTableTitle>
                <div className={posTableScrollClass}>
                  <table className="pos-stock-table pos-stock-table-compact min-w-[1200px]">
                    <thead>
                      <tr className="pos-stitch-table-head text-left">
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Name</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Category</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Supplier</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Unit</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold text-right dark:border-gray-700">Per box</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Type</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold text-right dark:border-gray-700">Default price</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold text-right dark:border-gray-700">Reorder</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold text-right dark:border-gray-700">Stock</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Status</th>
                        <th className={cn(STOCK_TABLE_ACTIONS_HEAD, 'whitespace-nowrap')}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockLoading ? (
                        <tr>
                          <td colSpan={11} className="border border-gray-200 px-4 py-10 text-center text-linked dark:border-gray-700">
                            Loading items…
                          </td>
                        </tr>
                      ) : filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="border border-gray-200 px-4 py-10 text-center text-linked dark:border-gray-700">
                            No {itemsTableView === 'asset' ? 'assets' : 'consumables'} found
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item) => {
                          const qty = Number(item.quantity);
                          const st = stockStatus(qty, item.reorderLevel);
                          const lowStock = st === 'low';
                          const outOfStock = st === 'out';
                          return (
                            <tr
                              key={item.id}
                              className={cn(outOfStock && 'row-out-of-stock', lowStock && !outOfStock && 'row-low-stock')}
                            >
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top font-medium">{item.name}</td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top text-linked">
                                {formatTypeLabel(item.type)}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top text-linked">
                                {item.supplier?.name ?? '—'}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top capitalize text-linked">
                                {item.unitOfMeasure ?? 'piece'}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 text-right tabular-nums text-linked">
                                {item.unitOfMeasure === 'box' ? (item.unitsPerBox ?? '—') : '—'}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top capitalize text-linked">
                                {item.itemType ?? 'consumable'}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 text-right tabular-nums text-linked">
                                {formatPrice(item.defaultPurchasePrice, item.unitOfMeasure, item.unitsPerBox)}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 text-right tabular-nums text-linked">
                                {item.reorderLevel ?? '—'}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 text-right tabular-nums">
                                <span className={cn(outOfStock && 'text-danger', lowStock && !outOfStock && 'text-warning')}>
                                  {item.quantity}
                                  {lowStock && <ExclamationTriangleIcon className="ml-1 inline h-4 w-4" />}
                                </span>
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top text-linked capitalize">
                                {item.status ?? 'active'}
                              </td>
                              <td className={STOCK_TABLE_ACTIONS_CELL}>
                                <div className="flex items-center justify-end gap-0.5">
                                  {canUpdate && (
                                  <StockTableIconButton
                                    label="Edit"
                                    onClick={() => {
                                      setSelectedStock(item);
                                      setIsUpdateStockOpen(true);
                                    }}
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </StockTableIconButton>
                                  )}
                                  {canDelete && (
                                  <StockTableIconButton
                                    label="Delete"
                                    className="text-danger hover:bg-danger/10"
                                    onClick={() => {
                                      setSelectedStock(item);
                                      setIsDeleteStockOpen(true);
                                    }}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </StockTableIconButton>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </StitchCard>
            </div>
          )}

          {tab === 'receive' && (
            <div className="flex h-full min-h-0 flex-col gap-0">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 pb-1">
                <BulkImportToolbar
                  type="stock-in"
                  onSuccess={loadAll}
                  importContext={{ suppliers: supplierList, stocks: stockList }}
                />
                {canCreateTx ? (
                <button type="button" className="btn btn-primary gap-1" onClick={() => openAddTx('ADDITION')}>
                  <ArrowDownCircleIcon className="h-4 w-4" />
                  Receive Stock
                </button>
                ) : null}
              </div>
              <StitchCard className="flex min-h-0 flex-1 flex-col gap-2 p-3 sm:p-4">
                <div className={cn(posMetricsGridClass, 'shrink-0 gap-2')}>
                  <PosStitchMetricCard
                    icon={ArrowDownCircleIcon}
                    label="Line items"
                    value={filteredIn.length}
                    subtext={filteredIn.length > 0 ? `${filteredIn.length} records` : undefined}
                    inlineLabel
                    className="px-3 py-2"
                  />
                  <PosStitchMetricCard
                    icon={CubeIcon}
                    label="Units received"
                    value={filteredIn.length > 0 ? stockInTotals.sumQty : '—'}
                    inlineLabel
                    className="px-3 py-2"
                  />
                  <PosStitchMetricCard
                    icon={CurrencyDollarIcon}
                    label="Receipt value"
                    value={
                      filteredIn.length > 0
                        ? stockInTotals.sumValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '—'
                    }
                    accent="green"
                    inlineLabel
                    className="px-3 py-2"
                  />
                  <PosStitchMetricCard
                    icon={ChartBarIcon}
                    label="Lifetime total"
                    value={overviewData.totalInValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    subtext={`${stockInList.reduce((s, t) => s + Number(t.quantity), 0).toLocaleString()} units`}
                    accent="amber"
                    inlineLabel
                    className="px-3 py-2"
                  />
                </div>
                <StockTableTitle compact>Stock-in list</StockTableTitle>
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className={posTableScrollClass}>
                    <table className="pos-stock-table pos-stock-table-compact min-w-[1160px]">
                      <thead>
                        <tr className="pos-stitch-table-head text-left">
                          <th className="border border-gray-200 px-2 py-2 font-semibold whitespace-nowrap dark:border-gray-700">Date</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Supplier</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Reference</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Status</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Item</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold text-right dark:border-gray-700">Qty</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Unit</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold text-right whitespace-nowrap dark:border-gray-700">Cost</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold text-right dark:border-gray-700">Line value</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Expiry</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold text-right dark:border-gray-700">Total remaining</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Performed by</th>
                          <th className={cn(STOCK_TABLE_ACTIONS_HEAD, 'whitespace-nowrap')}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {txLoading ? (
                          <tr>
                            <td colSpan={13} className="border border-gray-200 px-4 py-10 text-center text-linked dark:border-gray-700">
                              Loading stock-in records…
                            </td>
                          </tr>
                        ) : filteredIn.length === 0 ? (
                          <tr>
                            <td colSpan={13} className="border border-gray-200 px-4 py-10 text-center text-linked dark:border-gray-700">
                              No stock-ins yet
                            </td>
                          </tr>
                        ) : (
                          filteredIn.map((t) => (
                            <tr key={t.id}>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top text-linked whitespace-nowrap tabular-nums">
                                {formatStockTableDate(t.date)}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top font-medium">
                                {supplierNameForTx(t)}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top text-linked">
                                {t.reference ?? '—'}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top capitalize">
                                <span
                                  className={cn(
                                    t.status === 'CONFIRMED' && 'text-success',
                                    t.status === 'DRAFT' && 'text-warning',
                                  )}
                                >
                                  {(t.status ?? 'CONFIRMED').toLowerCase()}
                                </span>
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top font-medium">
                                {t.stock?.name || '—'}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 text-right tabular-nums">{t.quantity}</td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 capitalize text-linked">
                                {t.stock?.unitOfMeasure ?? 'piece'}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 text-right text-xs tabular-nums whitespace-nowrap text-linked">
                                {formatPrice(t.unitCost, t.stock?.unitOfMeasure, t.stock?.unitsPerBox)}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 text-right tabular-nums">
                                {lineValue(Number(t.quantity), t.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top text-linked">
                                {formatExpiry(t.expiryDate, t.expiryNote)}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 text-right tabular-nums font-medium stock-text dark:border-gray-700">
                                {t.stock?.quantity ?? '—'}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top text-linked">
                                {performerDisplay(t)}
                              </td>
                              <td className={STOCK_TABLE_ACTIONS_CELL}>
                                <div className="flex items-center justify-end gap-0.5">
                                  {canUpdateTx && (
                                  <StockTableIconButton
                                    label="Edit stock-in"
                                    onClick={() => {
                                      setSelectedTx(t);
                                      setIsUpdateTxOpen(true);
                                    }}
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </StockTableIconButton>
                                  )}
                                  {canDeleteTx && (
                                  <StockTableIconButton
                                    label="Delete stock-in"
                                    className="text-danger hover:bg-danger/10"
                                    onClick={() => {
                                      setSelectedTx(t);
                                      setIsDeleteTxOpen(true);
                                    }}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </StockTableIconButton>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </StitchCard>
            </div>
          )}

          {tab === 'stockout' && (
            <div className="flex h-full min-h-0 flex-col gap-0">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 pb-1">
                <BulkImportToolbar
                  type="stock-out"
                  onSuccess={loadAll}
                  importContext={{ stocks: stockList }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <DataSnapshotToolbar
                    exportLabel="Export"
                    onExport={(format) => {
                      const rows = buildStockOutExportRows(filteredOut);
                      downloadDataExport(rows, 'stock-out-export', format, 'StockOut');
                    }}
                    className="!justify-start gap-2"
                  />
                  <span className="hidden text-linked sm:inline">|</span>
                  {canCreateTx && (
                  <button type="button" className="btn btn-primary gap-1" onClick={() => openAddTx('CONSUME')}>
                  <ArrowUpCircleIcon className="h-4 w-4" />
                  Record stock-out
                </button>
                  )}
                </div>
              </div>
              <StitchCard className="flex min-h-0 flex-1 flex-col gap-2 p-3 sm:p-4">
                <div className={cn(posMetricsGridClass, 'shrink-0 gap-2')}>
                  <PosStitchMetricCard
                    icon={ArrowUpCircleIcon}
                    label="Line items"
                    value={filteredOut.length}
                    subtext={filteredOut.length > 0 ? `${filteredOut.length} records` : undefined}
                    inlineLabel
                    className="px-3 py-2"
                  />
                  <PosStitchMetricCard
                    icon={CubeIcon}
                    label="Units withdrawn"
                    value={filteredOut.length > 0 ? stockOutTotals.sumQty : '—'}
                    inlineLabel
                    className="px-3 py-2"
                  />
                  <PosStitchMetricCard
                    icon={CurrencyDollarIcon}
                    label="FIFO value"
                    value={
                      filteredOut.length > 0
                        ? stockOutTotals.sumValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '—'
                    }
                    accent="green"
                    inlineLabel
                    className="px-3 py-2"
                  />
                  <PosStitchMetricCard
                    icon={ChartBarIcon}
                    label="Lifetime total"
                    value={stockOutList.reduce((s, t) => s + Number(t.quantity), 0).toLocaleString()}
                    accent="amber"
                    inlineLabel
                    className="px-3 py-2"
                  />
                </div>
                <StockTableTitle compact>Stock-out list</StockTableTitle>
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className={posTableScrollClass}>
                    <table className="pos-stock-table pos-stock-table-compact min-w-[1040px]">
                      <thead>
                        <tr className="pos-stitch-table-head text-left">
                          <th className="border border-gray-200 px-2 py-2 font-semibold whitespace-nowrap dark:border-gray-700">Date</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Reference</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Reason</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Item</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold text-right dark:border-gray-700">Qty</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Unit</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold text-right dark:border-gray-700">Line value</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold text-right dark:border-gray-700">Total remaining</th>
                          <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Performed by</th>
                          <th className={cn(STOCK_TABLE_ACTIONS_HEAD, 'whitespace-nowrap')}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {txLoading ? (
                          <tr>
                            <td colSpan={10} className="border border-gray-200 px-4 py-10 text-center text-linked dark:border-gray-700">
                              Loading stock-out records…
                            </td>
                          </tr>
                        ) : filteredOut.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="border border-gray-200 px-4 py-10 text-center text-linked dark:border-gray-700">
                              No stock-outs yet
                            </td>
                          </tr>
                        ) : (
                          filteredOut.map((t) => (
                            <tr key={t.id}>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top text-linked whitespace-nowrap tabular-nums">
                                {formatStockTableDate(t.date)}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top text-linked">
                                {t.reference ?? '—'}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top">
                                {stockOutReasonLabel(t.reason)}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top font-medium">
                                {t.stock?.name || '—'}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 text-right tabular-nums">{t.quantity}</td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 capitalize text-linked">
                                {t.stock?.unitOfMeasure ?? 'piece'}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 text-right tabular-nums">
                                {lineValue(Number(t.quantity), t.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 text-right tabular-nums font-medium stock-text dark:border-gray-700">
                                {t.stock?.quantity ?? '—'}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top text-linked">
                                {performerDisplay(t)}
                              </td>
                              <td className={STOCK_TABLE_ACTIONS_CELL}>
                                <div className="flex items-center justify-end gap-0.5">
                                  {canUpdateTx && (
                                  <StockTableIconButton
                                    label="Edit stock-out"
                                    onClick={() => {
                                      setSelectedTx(t);
                                      setIsUpdateTxOpen(true);
                                    }}
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </StockTableIconButton>
                                  )}
                                  {canDeleteTx && (
                                  <StockTableIconButton
                                    label="Delete stock-out"
                                    className="text-danger hover:bg-danger/10"
                                    onClick={() => {
                                      setSelectedTx(t);
                                      setIsDeleteTxOpen(true);
                                    }}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </StockTableIconButton>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </StitchCard>
            </div>
          )}

          {tab === 'currentstock' && (
            <div className="flex h-full min-h-0 flex-col gap-1">
              <DataSnapshotToolbar
                onExport={(format) => {
                  const rows = buildCurrentStockExportRows(filteredCurrent, (qty, reorder) =>
                    stockStatus(qty, reorder),
                  );
                  downloadDataExport(rows, 'current-stock-export', format, 'CurrentStock');
                }}
                onRefresh={loadAll}
              />
              <StitchCard className="flex min-h-0 flex-1 flex-col gap-2 p-3 sm:p-4">
                <StockTableTitle compact>Current stock</StockTableTitle>
                <div className={posTableScrollClass}>
                  <table className="pos-stock-table pos-stock-table-compact min-w-[960px]">
                    <thead>
                      <tr className="pos-stitch-table-head text-left">
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Item</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Unit</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold text-right dark:border-gray-700">Total Qty</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold text-right dark:border-gray-700">Total Value</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Reorder Status</th>
                        <th className={cn(STOCK_TABLE_ACTIONS_HEAD, 'whitespace-nowrap')}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockLoading ? (
                        <tr>
                          <td colSpan={6} className="border border-gray-200 px-4 py-10 text-center text-linked dark:border-gray-700">
                            Loading current stock…
                          </td>
                        </tr>
                      ) : filteredCurrent.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="border border-gray-200 px-4 py-10 text-center text-linked dark:border-gray-700">
                            No items
                          </td>
                        </tr>
                      ) : (
                        filteredCurrent.map((item) => {
                          const qty = Number(item.quantity);
                          const st = stockStatus(qty, item.reorderLevel);
                          const totalValue = qty * Number(item.defaultPurchasePrice ?? 0);
                          return (
                            <tr
                              key={item.id}
                              className={cn(st === 'out' && 'row-out-of-stock', st === 'low' && 'row-low-stock')}
                            >
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top font-medium">{item.name}</td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 capitalize text-linked">
                                {item.unitOfMeasure ?? 'piece'}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 text-right tabular-nums">{item.quantity}</td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 text-right tabular-nums text-linked">
                                {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top">
                                <span
                                  className={cn(
                                    st === 'ok' && 'text-success',
                                    st === 'low' && 'text-warning',
                                    st === 'out' && 'text-danger',
                                  )}
                                >
                                  {st === 'ok' ? 'OK' : st === 'low' ? 'Low stock' : 'Out of stock'}
                                  {st !== 'ok' && <ExclamationTriangleIcon className="ml-1 inline h-4 w-4" />}
                                </span>
                              </td>
                              <td className={STOCK_TABLE_ACTIONS_CELL}>
                                <div className="flex items-center justify-end gap-0.5">
                                  {canUpdate && (
                                  <StockTableIconButton
                                    label="Edit item"
                                    onClick={() => {
                                      setSelectedStock(item);
                                      setIsUpdateStockOpen(true);
                                    }}
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </StockTableIconButton>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </StitchCard>
            </div>
          )}

          {tab === 'history' && (
            <div className="flex h-full min-h-0 flex-col gap-1">
              <DataSnapshotToolbar
                onExport={(format) => {
                  const rows = buildHistoryExportRows(
                    filteredHistory.map((t) => ({
                      date: t.date,
                      type: t.type,
                      quantity: t.quantity,
                      reference: t.reference,
                      performedBy: performerDisplay(t),
                      stock: t.stock,
                    })),
                  );
                  downloadDataExport(rows, 'stock-history-export', format, 'StockHistory');
                }}
                onRefresh={loadAll}
              />
              <StitchCard className="flex min-h-0 flex-1 flex-col gap-2 p-3 sm:p-4">
                <StockTableTitle compact>Stock history</StockTableTitle>
                <div className={posTableScrollClass}>
                  <table className="pos-stock-table pos-stock-table-compact min-w-[1080px]">
                    <thead>
                      <tr className="pos-stitch-table-head text-left">
                        <th className="border border-gray-200 px-2 py-2 font-semibold whitespace-nowrap dark:border-gray-700">Date</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Item</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Type</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold text-right dark:border-gray-700">Quantity</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Reference</th>
                        <th className="border border-gray-200 px-2 py-2 font-semibold dark:border-gray-700">Performed by</th>
                        <th className={cn(STOCK_TABLE_ACTIONS_HEAD, 'whitespace-nowrap')}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txLoading ? (
                        <tr>
                          <td colSpan={7} className="border border-gray-200 px-4 py-10 text-center text-linked dark:border-gray-700">
                            Loading history…
                          </td>
                        </tr>
                      ) : filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="border border-gray-200 px-4 py-10 text-center text-linked dark:border-gray-700">
                            No movements yet
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((t) => (
                          <tr key={t.id}>
                            <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top text-linked whitespace-nowrap tabular-nums">
                              {formatStockTableDate(t.date)}
                            </td>
                            <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top font-medium">
                              {t.stock?.name || '—'}
                            </td>
                            <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top">
                              <span
                                className={cn(
                                  'font-medium',
                                  t.type === 'ADDITION' ? 'text-success' : 'text-danger',
                                )}
                              >
                                {t.type === 'ADDITION' ? 'Stock-In' : 'Stock-Out'}
                              </span>
                            </td>
                            <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 text-right tabular-nums">{t.quantity}</td>
                            <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top text-linked">
                              {t.reference ?? '—'}
                            </td>
                            <td className="border border-gray-200 px-2 py-1.5 dark:border-gray-700 align-top text-linked">
                              {performerDisplay(t)}
                            </td>
                            <td className={STOCK_TABLE_ACTIONS_CELL}>
                              <div className="flex items-center justify-end gap-0.5">
                                {canUpdateTx && (
                                <StockTableIconButton
                                  label="Edit"
                                  onClick={() => {
                                    setSelectedTx(t);
                                    setIsUpdateTxOpen(true);
                                  }}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </StockTableIconButton>
                                )}
                                {canDeleteTx && (
                                <StockTableIconButton
                                  label="Delete"
                                  className="text-danger hover:bg-danger/10"
                                  onClick={() => {
                                    setSelectedTx(t);
                                    setIsDeleteTxOpen(true);
                                  }}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </StockTableIconButton>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </StitchCard>
            </div>
          )}
        </div>
      </section>

      <AddStockModal isOpen={isAddStockOpen} onClose={() => setIsAddStockOpen(false)} handleRefetch={loadAll} />
      <AddSupplierModal isOpen={isAddSupplierOpen} onClose={() => setIsAddSupplierOpen(false)} handleRefetch={loadAll} />
      <UpdateSupplierModal
        isOpen={isUpdateSupplierOpen}
        onClose={() => setIsUpdateSupplierOpen(false)}
        supplier={selectedSupplier}
        handleRefetch={loadAll}
      />
      <ConfirmDeleteSupplierModal
        isOpen={isDeleteSupplierOpen}
        onClose={() => setIsDeleteSupplierOpen(false)}
        onConfirm={handleDeleteSupplier}
        name={selectedSupplier?.name}
      />
      <UpdateStockModal
        isOpen={isUpdateStockOpen}
        onClose={() => setIsUpdateStockOpen(false)}
        stock={selectedStock}
        handleRefetch={loadAll}
      />
      <ConfirmDeleteStockModal
        isOpen={isDeleteStockOpen}
        onClose={() => setIsDeleteStockOpen(false)}
        onConfirm={handleDeleteStock}
      />
      <AddStockTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => {
          setIsAddTxOpen(false);
          setTxDefaultType(undefined);
        }}
        handleRefetch={loadAll}
        defaultType={txDefaultType}
        title={
          txDefaultType === 'ADDITION'
            ? 'Receive Stock'
            : txDefaultType === 'CONSUME'
              ? 'Record Stock-Out'
              : 'Add Stock Transaction'
        }
      />
      <UpdateStockTransactionModal
        isOpen={isUpdateTxOpen}
        onClose={() => setIsUpdateTxOpen(false)}
        transaction={selectedTx}
        handleRefetch={loadAll}
      />
      <ConfirmDeleteTransactionModal
        isOpen={isDeleteTxOpen}
        onClose={() => setIsDeleteTxOpen(false)}
        onConfirm={handleDeleteTx}
      />
    </div>
  );
}
