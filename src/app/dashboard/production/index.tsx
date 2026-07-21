import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DataTableV2, { TableColumnV2 } from '@/components/datatable';
import IconPlus from '@/components/Icon/IconPlus';
import IconEdit from '@/components/Icon/IconEdit';
import IconCaretDown from '@/components/Icon/IconCaretDown';
import { toast } from 'react-hot-toast';
import AddProductionModal from './create_prod';
import UpdateProduction from './update_prod';
import { useProduction } from '@/hooks/api/productions';
import { useProductionTransaction as useProductionTotals } from '@/hooks/api/production_totals';
import formatDateToLongForm from '@/utils/DateFormattter';
import ConfirmDeleteModal from './delete';
import { TrashIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from '@/lib/router-compat';
import { isLoggedIn } from '@/hooks/api/auth';
import { getFarmId } from '@/utils/farmId';
import { canCreateEntity, canUpdateEntity, canDeleteEntity } from '@/utils/permissions';
import ProductionTabs from './ProductionTabs';
import UpdateProductionPriceModal from '../productionTotals/updatePrice';

interface ProductionRecord {
  id: string;
  farm: any;
  cattleId: string;
  productName: string;
  quantity: number;
  milkingSession?: 'MORNING' | 'EVENING' | null;
  productionDate: string;
  expirationDate: string;
  cattle: any;
}

type PeriodKey = 'day' | 'week' | 'month' | 'year' | 'all' | 'custom';

type ProductionStats = {
  from: string | null;
  to: string | null;
  systemStartDate: string | null;
  categories: Array<{
    productName: string;
    totalQuantity: number;
    recordCount: number;
    cattleCount: number;
    averagePerCattle: number;
    pricePerUnit: number;
    estimatedValue: number;
    unit: string;
  }>;
  selected: {
    productName: string;
    totalQuantity: number;
    recordCount: number;
    cattleCount: number;
    averagePerCattle: number;
    pricePerUnit: number;
    estimatedValue: number;
    unit: string;
  };
  cattleInPeriod: number;
  milkEstimatedValue: number;
  milkPricePerUnit: number;
  isMilkFocused: boolean;
};

const PERIOD_OPTIONS: Array<{ key: Exclude<PeriodKey, 'custom'>; label: string }> = [
  { key: 'day', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'year', label: 'This year' },
  { key: 'all', label: 'All time' },
];

function formatYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getPeriodRange(period: PeriodKey): { from?: string; to?: string } {
  const now = new Date();
  const to = formatYmd(now);
  if (period === 'all' || period === 'custom') return {};
  if (period === 'day') return { from: to, to };
  if (period === 'week') {
    const start = new Date(now);
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    return { from: formatYmd(start), to };
  }
  if (period === 'month') {
    return { from: formatYmd(new Date(now.getFullYear(), now.getMonth(), 1)), to };
  }
  if (period === 'year') {
    return { from: formatYmd(new Date(now.getFullYear(), 0, 1)), to };
  }
  return {};
}

const Production = () => {
  const [searchParams] = useSearchParams();
  const {
    deleteProduction,
    loading,
    getProductions,
    getProductionStats,
    productions,
  }: any = useProduction();
  const {
    production_transactions: productionTotals,
    getProductionTransactions: getProductionTotals,
    loading: totalsLoading,
  }: any = useProductionTotals();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedProduction, setSelectedProduction] =
    useState<ProductionRecord | null>(null);
  const [selectedTotal, setSelectedTotal] = useState<any | null>(null);
  const [farmId, setFarmIdState] = useState<string | null>(() => getFarmId());
  const [period, setPeriod] = useState<PeriodKey>('day');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [productName, setProductName] = useState('MILK');
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const role = isLoggedIn()?.role ?? '';
  const canCreate = canCreateEntity('production', role);
  const canUpdate = canUpdateEntity('production', role);
  const canDelete = canDeleteEntity('production', role);
  const canUpdateTotals = canUpdateEntity('productionTotals', role) && !!farmId;

  const dateRange = useMemo(() => {
    if (period === 'custom') {
      return {
        from: customFrom || undefined,
        to: customTo || undefined,
      };
    }
    return getPeriodRange(period);
  }, [period, customFrom, customTo]);

  const listQuery = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (dateRange.from) params.set('from', dateRange.from);
    else params.delete('from');
    if (dateRange.to) params.set('to', dateRange.to);
    else params.delete('to');
    params.delete('productName');
    return params;
  }, [searchParams, dateRange]);

  const openAddProduction = () => {
    if (!farmId) {
      toast.error('Select a specific farm before recording production.');
      return;
    }
    setIsAddModalOpen(true);
  };

  const totalsList: any[] = productionTotals?.data?.data ?? [];

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getProductionStats({
        from: dateRange.from,
        to: dateRange.to,
        productName,
      });
      if (data) setStats(data);
    } finally {
      setStatsLoading(false);
    }
  }, [dateRange.from, dateRange.to, productName]);

  useEffect(() => {
    const syncFarm = () => setFarmIdState(getFarmId());
    window.addEventListener('difarm-farm-changed', syncFarm);
    return () => window.removeEventListener('difarm-farm-changed', syncFarm);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!categoryRef.current?.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
      if (!periodRef.current?.contains(e.target as Node)) {
        setPeriodOpen(false);
      }
      if (!calendarRef.current?.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    getProductions(listQuery);
    getProductionTotals();
  }, [listQuery, farmId]);

  useEffect(() => {
    loadStats();
  }, [loadStats, farmId]);

  const handleDelete = async () => {
    if (selectedProduction) {
      try {
        await deleteProduction(selectedProduction.id);
        getProductions(listQuery);
        getProductionTotals();
        loadStats();
      } catch (error) {
        toast.error('Failed to delete production');
      } finally {
        setIsDeleteModalOpen(false);
      }
    }
  };

  const handleRefetch = () => {
    getProductions(listQuery);
    getProductionTotals();
    loadStats();
  };

  const categoryOptions = useMemo(() => {
    const fromStats = (stats?.categories || []).map((c) => c.productName);
    const defaults = ['MILK', 'MEAT'];
    return [...new Set([...defaults, ...fromStats, productName])];
  }, [stats, productName]);

  const selected = stats?.selected;
  const unit = selected?.unit || (productName === 'MILK' ? 'L' : 'kg');
  const stockRow =
    totalsList.find(
      (row: any) => String(row.productType || '').toUpperCase() === productName
    ) ||
    totalsList.find(
      (row: any) => String(row.productType || '').toUpperCase() === 'MILK'
    ) ||
    totalsList[0] ||
    null;
  const periodLabel =
    period === 'all'
      ? stats?.systemStartDate
        ? `Since ${formatDateToLongForm(stats.systemStartDate)}`
        : 'All time'
      : period === 'custom' && (dateRange.from || dateRange.to)
        ? `${dateRange.from || '…'} → ${dateRange.to || '…'}`
        : period === 'custom'
          ? 'Pick a start and end date'
          : PERIOD_OPTIONS.find((p) => p.key === period)?.label || '';

  const periodButtonLabel =
    period === 'custom'
      ? customFrom || customTo
        ? `${customFrom || '…'} → ${customTo || '…'}`
        : 'Custom range'
      : PERIOD_OPTIONS.find((p) => p.key === period)?.label || 'Select period';

  const periodFilters = (
    <div className="flex items-center gap-1.5 ml-1">
      <div className="relative" ref={periodRef}>
        <button
          type="button"
          onClick={() => {
            setPeriodOpen((o) => !o);
            setCalendarOpen(false);
          }}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border border-primary/60 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 hover:border-primary"
          title={periodLabel}
        >
          {periodButtonLabel}
          <IconCaretDown className="w-3 h-3 text-gray-500" />
        </button>
        {periodOpen && (
          <div className="absolute left-0 mt-1 z-30 min-w-[8.5rem] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-lg py-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`block w-full text-left px-2.5 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  period === opt.key
                    ? 'text-primary font-semibold'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
                onClick={() => {
                  setPeriod(opt.key);
                  setPeriodOpen(false);
                  setCalendarOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative" ref={calendarRef}>
        <button
          type="button"
          title="Select custom date range"
          onClick={() => {
            setPeriod('custom');
            setCalendarOpen((o) => !o);
            setPeriodOpen(false);
          }}
          className={`inline-flex items-center justify-center p-1 rounded-full border transition-colors ${
            period === 'custom'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-primary/60 text-gray-700 dark:text-gray-200 hover:border-primary'
          }`}
        >
          <CalendarDaysIcon className="w-4 h-4" />
        </button>
        {calendarOpen && (
          <div className="absolute left-0 mt-1 z-30 w-[min(100vw-2rem,16rem)] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-lg p-2.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Custom date range
            </p>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-2">
              From
              <input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setPeriod('custom');
                  setCustomFrom(e.target.value);
                }}
                className="mt-0.5 form-input block w-full text-xs py-1"
              />
            </label>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-2">
              To
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => {
                  setPeriod('custom');
                  setCustomTo(e.target.value);
                }}
                className="mt-0.5 form-input block w-full text-xs py-1"
              />
            </label>
            <div className="flex justify-between gap-2">
              <button
                type="button"
                className="text-[11px] text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setCustomFrom('');
                  setCustomTo('');
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm py-0.5 px-2 text-xs"
                onClick={() => setCalendarOpen(false)}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const insightCards = (
    <div className="mb-4 grid grid-cols-5 gap-3">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm relative flex flex-col min-w-0 border-l-4 border-l-primary">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Total production
          </p>
          <div className="relative shrink-0" ref={categoryRef}>
            <button
              type="button"
              onClick={() => setCategoryOpen((o) => !o)}
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary"
              title="Select production category"
            >
              {productName}
              <IconCaretDown className="w-3 h-3" />
            </button>
            {categoryOpen && (
              <div className="absolute right-0 mt-1 z-20 min-w-[7.5rem] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-lg py-1">
                {categoryOptions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={`block w-full text-left px-2.5 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      name === productName
                        ? 'text-primary font-semibold'
                        : 'text-gray-700 dark:text-gray-200'
                    }`}
                    onClick={() => {
                      setProductName(name);
                      setCategoryOpen(false);
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3 tabular-nums leading-none">
          {statsLoading ? '…' : (selected?.totalQuantity ?? 0).toLocaleString()}
          <span className="text-sm font-medium text-gray-500 ml-1">{unit}</span>
        </p>
        <p className="text-xs text-gray-500 mt-auto pt-3">
          {period === 'all' ? 'Since system start' : 'In selected period'}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col min-w-0 border-l-4 border-l-sky-500">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Average per cattle
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3 tabular-nums leading-none">
          {statsLoading ? '…' : (selected?.averagePerCattle ?? 0).toLocaleString()}
          <span className="text-sm font-medium text-gray-500 ml-1">{unit}</span>
        </p>
        <p className="text-xs text-gray-500 mt-auto pt-3">
          {productName} · contributing cattle
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col min-w-0 border-l-4 border-l-amber-500">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Estimated milk value
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3 tabular-nums leading-none">
          {statsLoading
            ? '…'
            : Number(stats?.milkEstimatedValue ?? 0).toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 mt-auto pt-3">
          Unit price:{' '}
          {stats?.milkPricePerUnit != null
            ? Number(stats.milkPricePerUnit).toLocaleString()
            : 'Not set'}{' '}
          / L
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col min-w-0 border-l-4 border-l-emerald-600">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {productName === 'MILK' ? 'Cattle milked' : 'Cattle contributing'}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3 tabular-nums leading-none">
          {statsLoading ? '…' : (stats?.cattleInPeriod ?? 0).toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 mt-auto pt-3">
          Unique cattle for {productName}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col min-w-0 border-l-4 border-l-violet-500">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Stock on hand
          </p>
          {canUpdateTotals && stockRow && (
            <button
              type="button"
              className="text-primary shrink-0"
              title="Edit sale price"
              onClick={() => {
                setSelectedTotal(stockRow);
                setIsPriceModalOpen(true);
              }}
            >
              <IconEdit className="w-4 h-4" />
            </button>
          )}
        </div>
        {totalsLoading && !stockRow ? (
          <p className="text-sm text-gray-500 mt-3">Loading…</p>
        ) : stockRow ? (
          <>
            <p className="text-[11px] font-medium text-primary mt-1">
              {String(stockRow.productType).toUpperCase()}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2 tabular-nums leading-none">
              {stockRow.totalQuantity ?? 0}
            </p>
            <p className="text-xs text-gray-500 mt-auto pt-3">
              Sale:{' '}
              {stockRow.pricePerUnit != null
                ? `${Number(stockRow.pricePerUnit).toLocaleString()} / unit`
                : 'Not set'}
            </p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3 tabular-nums leading-none">
              0
            </p>
            <p className="text-xs text-gray-500 mt-auto pt-3">No stock yet</p>
          </>
        )}
      </div>
    </div>
  );

  const columns: TableColumnV2<ProductionRecord>[] = [
    {
      title: 'Cattle Tag',
      accessor: 'cattle.tagNumber',
      render: (row) => <p>{row?.cattle?.tagNumber}</p>,
    },
    {
      title: 'Cattle Breed',
      accessor: 'cattle.breed',
      render: (row) => <p>{row.cattle.breed}</p>,
    },
    {
      title: 'Product Name',
      accessor: 'productName',
      render: (row) => <p>{row.productName}</p>,
    },
    {
      title: 'Milking',
      accessor: 'milkingSession',
      render: (row) => (
        <p>
          {row.productName === 'MILK'
            ? row.milkingSession === 'MORNING'
              ? 'Morning'
              : row.milkingSession === 'EVENING'
                ? 'Evening'
                : '—'
            : '—'}
        </p>
      ),
    },
    {
      title: 'Quantity',
      accessor: 'quantity',
      render: (row) => (
        <p>
          {Number(row.quantity).toLocaleString(undefined, {
            maximumFractionDigits: 6,
          })}{' '}
          {row.productName === 'MILK' ? 'L' : 'kg'}
        </p>
      ),
    },
    {
      title: 'Production Date',
      accessor: 'productionDate',
      render: (row) => <p>{formatDateToLongForm(row.productionDate)}</p>,
    },
    {
      title: 'Expiration Date',
      accessor: 'expirationDate',
      render: (row) => (
        <p>
          {row.productName === 'MILK'
            ? 'Same day'
            : formatDateToLongForm(row.expirationDate)}
        </p>
      ),
    },
    ...(canUpdate || canDelete
      ? [
          {
            title: 'Actions',
            accessor: 'actions',
            render: (row: ProductionRecord) => (
              <div className="flex gap-2 justify-center">
                {canUpdate && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduction(row);
                      setIsUpdateModalOpen(true);
                    }}
                  >
                    <IconEdit className="text-primary" />
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduction(row);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    <TrashIcon className="text-danger w-5 h-5" />
                  </button>
                )}
              </div>
            ),
          } as TableColumnV2<ProductionRecord>,
        ]
      : []),
  ];

  return (
    <div className="">
      <ProductionTabs />

      {canCreate && !farmId && (
        <p className="text-sm text-amber-700 dark:text-amber-200 mb-2">
          Select a specific farm to record production.
        </p>
      )}

      <AddProductionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        handleRefetch={handleRefetch}
      />
      <UpdateProduction
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        production={selectedProduction}
        handleRefetch={handleRefetch}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
      <UpdateProductionPriceModal
        isOpen={isPriceModalOpen}
        onClose={() => {
          setSelectedTotal(null);
          setIsPriceModalOpen(false);
        }}
        transaction={selectedTotal}
        handleRefetch={handleRefetch}
      />

      <div className="w-full">
        <DataTableV2
          columns={columns}
          data={productions?.data?.data ?? []}
          isLoading={loading}
          currentPage={productions?.data?.currentPage ?? 0}
          total={productions?.data?.total}
          lastPage={productions?.data?.totalPages + 1}
          previousPage={productions?.data?.previousPage}
          nextPage={productions?.data?.nextPage}
          tableName={'Production records'}
          toolbarLeading={periodFilters}
          beforeTable={insightCards}
          actions={
            canCreate ? (
              <button
                type="button"
                onClick={openAddProduction}
                className="btn btn-primary btn-sm flex items-center gap-1 whitespace-nowrap shrink-0"
                title={
                  !farmId
                    ? 'Select a specific farm to record production'
                    : 'Add production'
                }
              >
                <IconPlus />
                Add Production
              </button>
            ) : undefined
          }
        />
      </div>
    </div>
  );
};

export default Production;
