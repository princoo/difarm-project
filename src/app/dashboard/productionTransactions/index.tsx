import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DataTableV2, { TableColumnV2 } from '@/components/datatable';
import IconPlus from '@/components/Icon/IconPlus';
import IconCaretDown from '@/components/Icon/IconCaretDown';
import formatDateToLongForm from '@/utils/DateFormattter';
import AddProductionTransactionModal, {
  SaleDraft,
} from './add';
import {
  DailySaleRow,
  useProductionTransaction,
} from '@/hooks/api/production_transaction';
import { isLoggedIn } from '@/hooks/api/auth';
import { getFarmId } from '@/utils/farmId';
import { canCreateEntity } from '@/utils/permissions';
import ProductionTabs from '../production/ProductionTabs';
import { toast } from 'react-hot-toast';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

type PeriodKey = 'day' | 'week' | 'month' | 'year' | 'all' | 'custom';

type UsageStats = {
  from: string | null;
  to: string | null;
  categories: Array<{
    productName: string;
    totalUsed: number;
    soldToDairy: number;
    usedOnFarm: number;
    consumedByUmucunda: number;
    dairyRevenue: number;
    amountPaid: number;
    averageDailyRevenue?: number;
    daysWithDairySales?: number;
    unit: string;
  }>;
  selected: {
    productName: string;
    totalUsed: number;
    soldToDairy: number;
    usedOnFarm: number;
    consumedByUmucunda: number;
    dairyRevenue: number;
    amountPaid: number;
    averageDailyRevenue?: number;
    daysWithDairySales?: number;
    unit: string;
  };
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

const ProductionTransactions = () => {
  const { dailySales, getDailySales, getUsageStats, loading }: any =
    useProductionTransaction();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saleDraft, setSaleDraft] = useState<SaleDraft | null>(null);
  const role = isLoggedIn()?.role ?? '';
  const [farmId, setFarmIdState] = useState<string | null>(() => getFarmId());
  const canCreateRole = canCreateEntity('productionTransactions', role);
  const canCreate = canCreateRole && !!farmId;

  const [period, setPeriod] = useState<PeriodKey>('day');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [productName, setProductName] = useState('MILK');
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const dateRange = useMemo(() => {
    if (period === 'custom') {
      return {
        from: customFrom || undefined,
        to: customTo || undefined,
      };
    }
    return getPeriodRange(period);
  }, [period, customFrom, customTo]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getUsageStats({
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
      if (!categoryRef.current?.contains(e.target as Node)) setCategoryOpen(false);
      if (!periodRef.current?.contains(e.target as Node)) setPeriodOpen(false);
      if (!calendarRef.current?.contains(e.target as Node)) setCalendarOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    getDailySales({
      from: dateRange.from,
      to: dateRange.to,
      productType: productName,
    });
  }, [farmId, dateRange.from, dateRange.to, productName]);

  useEffect(() => {
    loadStats();
  }, [loadStats, farmId]);

  const handleRefetch = () => {
    getDailySales({
      from: dateRange.from,
      to: dateRange.to,
      productType: productName,
    });
    loadStats();
  };

  const openSell = (row?: DailySaleRow) => {
    if (!farmId) {
      toast.error('Select a specific farm before recording production usage.');
      return;
    }
    if (row && row.farmId !== farmId) {
      toast.error('Switch to that farm to record this usage.');
      return;
    }
    if (row && row.remaining <= 0) {
      toast.error('Nothing left unused for this day.');
      return;
    }
    setSaleDraft(
      row
        ? {
            date: row.date,
            productType: row.productType,
            remaining: row.remaining,
            pricePerUnit: row.pricePerUnit,
          }
        : null
    );
    setIsAddModalOpen(true);
  };

  const selected = stats?.selected;
  const unit = selected?.unit || (productName === 'MILK' ? 'L' : 'kg');
  const categoryOptions = useMemo(() => {
    const fromStats = (stats?.categories || []).map((c) => c.productName);
    return [...new Set(['MILK', 'MEAT', ...fromStats, productName])];
  }, [stats, productName]);

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
            Total used
          </p>
          <div className="relative shrink-0" ref={categoryRef}>
            <button
              type="button"
              onClick={() => setCategoryOpen((o) => !o)}
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary"
              title="Select product"
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
          {statsLoading ? '…' : (selected?.totalUsed ?? 0).toLocaleString()}
          <span className="text-sm font-medium text-gray-500 ml-1">{unit}</span>
        </p>
        <p className="text-xs text-gray-500 mt-auto pt-3">In selected period</p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col min-w-0 border-l-4 border-l-sky-500">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 text-center">
          Sold to dairy
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums leading-none">
              {statsLoading ? '…' : (selected?.soldToDairy ?? 0).toLocaleString()}
              <span className="text-sm font-medium text-gray-500 ml-1">{unit}</span>
            </p>
            <p className="text-[10px] text-gray-500 mt-1">Quantity</p>
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums leading-none">
              {statsLoading
                ? '…'
                : Number(selected?.dairyRevenue ?? 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-500 mt-1">Total revenue</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-auto pt-3 text-center">{productName}</p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col min-w-0 border-l-4 border-l-amber-500">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Used on farm
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3 tabular-nums leading-none">
          {statsLoading ? '…' : (selected?.usedOnFarm ?? 0).toLocaleString()}
          <span className="text-sm font-medium text-gray-500 ml-1">{unit}</span>
        </p>
        <p className="text-xs text-gray-500 mt-auto pt-3">{productName}</p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col min-w-0 border-l-4 border-l-emerald-600">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Consumed by umucunda
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3 tabular-nums leading-none">
          {statsLoading
            ? '…'
            : (selected?.consumedByUmucunda ?? 0).toLocaleString()}
          <span className="text-sm font-medium text-gray-500 ml-1">{unit}</span>
        </p>
        <p className="text-xs text-gray-500 mt-auto pt-3">{productName}</p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col min-w-0 border-l-4 border-l-violet-500">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 text-center">
          Avg daily revenue
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3 tabular-nums leading-none text-center">
          {statsLoading
            ? '…'
            : Number(selected?.averageDailyRevenue ?? 0).toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 mt-auto pt-3 text-center">
          {selected?.daysWithDairySales
            ? `Across ${selected.daysWithDairySales} dairy day${
                selected.daysWithDairySales === 1 ? '' : 's'
              }`
            : 'No dairy sales in period'}
        </p>
      </div>
    </div>
  );

  const columns: TableColumnV2<DailySaleRow>[] = [
    {
      title: 'Date',
      accessor: 'date',
      render: (row) => <p>{formatDateToLongForm(row.date)}</p>,
    },
    ...(!farmId
      ? [
          {
            title: 'Farm',
            accessor: 'farmName',
            render: (row: DailySaleRow) => <p>{row.farmName ?? '—'}</p>,
          } as TableColumnV2<DailySaleRow>,
        ]
      : []),
    {
      title: 'Product',
      accessor: 'productType',
      render: (row) => <p>{row.productType}</p>,
    },
    {
      title: 'Available',
      accessor: 'produced',
      render: (row) => (
        <p>
          {Number(row.produced).toLocaleString(undefined, {
            maximumFractionDigits: 6,
          })}
        </p>
      ),
    },
    {
      title: 'Used',
      accessor: 'sold',
      render: (row) => (
        <p>
          {Number(row.sold).toLocaleString(undefined, {
            maximumFractionDigits: 6,
          })}
        </p>
      ),
    },
    {
      title: 'Remaining',
      accessor: 'remaining',
      render: (row) => (
        <p>
          {Number(row.remaining).toLocaleString(undefined, {
            maximumFractionDigits: 6,
          })}
        </p>
      ),
    },
    {
      title: 'Dairy revenue',
      accessor: 'saleValue',
      render: (row) => <p>{Number(row.saleValue).toLocaleString()}</p>,
    },
    {
      title: 'Paid',
      accessor: 'amountPaid',
      render: (row) => <p>{Number(row.amountPaid).toLocaleString()}</p>,
    },
    {
      title: 'Unpaid',
      accessor: 'unpaid',
      render: (row) => (
        <p className={row.unpaid > 0 ? 'text-amber-600 font-semibold' : ''}>
          {Number(row.unpaid).toLocaleString()}
        </p>
      ),
    },
    ...(canCreate
      ? [
          {
            title: 'Actions',
            accessor: 'actions',
            render: (row: DailySaleRow) => (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={row.remaining <= 0}
                onClick={() => openSell(row)}
              >
                Use
              </button>
            ),
          } as TableColumnV2<DailySaleRow>,
        ]
      : []),
  ];

  return (
    <div className="">
      <ProductionTabs />

      {!farmId && canCreateRole && (
        <p className="mb-2 text-sm rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-3 py-1.5 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
          Viewing all farms. Select a specific farm to record production usage.
        </p>
      )}

      <AddProductionTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSaleDraft(null);
        }}
        handleRefetch={handleRefetch}
        draft={saleDraft}
      />

      <div className="w-full">
        <DataTableV2
          columns={columns}
          data={dailySales ?? []}
          isLoading={loading}
          currentPage={1}
          total={dailySales?.length ?? 0}
          lastPage={1}
          previousPage={0}
          nextPage={0}
          tableName={'Daily production usage'}
          toolbarLeading={periodFilters}
          beforeTable={insightCards}
          actions={
            canCreateRole ? (
              <button
                type="button"
                onClick={() => openSell()}
                className="btn btn-primary btn-sm flex items-center gap-1 whitespace-nowrap shrink-0"
                disabled={!farmId}
                title={
                  !farmId
                    ? 'Select a specific farm to record usage'
                    : 'Record production usage'
                }
              >
                <IconPlus />
                Add usage
              </button>
            ) : undefined
          }
        />
      </div>
    </div>
  );
};

export default ProductionTransactions;
