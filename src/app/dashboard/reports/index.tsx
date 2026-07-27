import { useCallback, useEffect, useMemo, useState } from 'react';
import { RiDownloadLine } from 'react-icons/ri';
import { FiFilter } from 'react-icons/fi';
import IconSearch from '@/components/Icon/IconSearch';
import IconXCircle from '@/components/Icon/IconXCircle';
import { useProduction } from '@/hooks/api/productions';
import {
  DailySaleRow,
  useProductionTransaction,
} from '@/hooks/api/production_transaction';
import { isLoggedIn } from '@/hooks/api/auth';
import { getFarmId } from '@/utils/farmId';
import formatDateToLongForm from '@/utils/DateFormattter';
import { toast } from 'react-hot-toast';

type ReportTab = 'production' | 'usage';

function formatYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const escape = (value: string | number) => {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { getProductions, productions, loading: productionLoading }: any = useProduction();
  const { getDailySales, dailySales, loading: usageLoading }: any =
    useProductionTransaction();

  const [tab, setTab] = useState<ReportTab>('production');
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [from, setFrom] = useState(() => formatYmd(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [to, setTo] = useState(() => formatYmd(new Date()));
  const [showFilters, setShowFilters] = useState(true);
  const [farmId, setFarmId] = useState<string | null>(() => getFarmId());
  const role = isLoggedIn()?.role ?? '';

  useEffect(() => {
    const syncFarm = () => setFarmId(getFarmId());
    window.addEventListener('difarm-farm-changed', syncFarm);
    return () => window.removeEventListener('difarm-farm-changed', syncFarm);
  }, []);

  const load = useCallback(() => {
    getProductions({
      pageSize: 500,
      from: from || undefined,
      to: to || undefined,
      productName: productFilter || undefined,
    });
    getDailySales({
      from: from || undefined,
      to: to || undefined,
      productType: productFilter || undefined,
    });
  }, [from, to, productFilter]);

  useEffect(() => {
    load();
  }, [load, farmId]);

  const productionRows = productions?.data?.data ?? [];
  const usageRows: DailySaleRow[] = dailySales ?? [];

  const filteredProduction = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return productionRows;
    return productionRows.filter((row: any) => {
      const haystack = [
        row.productName,
        row.cattle?.tagNumber,
        row.cattle?.breed,
        row.farm?.name,
        row.milkingSession,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [productionRows, search]);

  const filteredUsage = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return usageRows;
    return usageRows.filter((row) => {
      const haystack = [row.productType, row.farmName, row.date]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [usageRows, search]);

  const productionTotals = useMemo(() => {
    const quantity = filteredProduction.reduce(
      (sum: number, row: any) => sum + (Number(row.quantity) || 0),
      0
    );
    return { quantity, count: filteredProduction.length };
  }, [filteredProduction]);

  const usageTotals = useMemo(() => {
    return filteredUsage.reduce(
      (acc, row) => {
        acc.produced += Number(row.produced) || 0;
        acc.used += Number(row.sold) || 0;
        acc.remaining += Number(row.remaining) || 0;
        acc.revenue += Number(row.saleValue) || 0;
        return acc;
      },
      { produced: 0, used: 0, remaining: 0, revenue: 0 }
    );
  }, [filteredUsage]);

  const productOptions = useMemo(() => {
    const fromProd = productionRows.map((r: any) => String(r.productName || '').toUpperCase());
    const fromUsage = usageRows.map((r) => String(r.productType || '').toUpperCase());
    return [...new Set(['MILK', 'MEAT', ...fromProd, ...fromUsage].filter(Boolean))];
  }, [productionRows, usageRows]);

  const handleExport = () => {
    const stamp = formatYmd(new Date());
    if (tab === 'production') {
      if (!filteredProduction.length) {
        toast.error('No production rows to export.');
        return;
      }
      downloadCsv(
        `difarm-production-report-${stamp}.csv`,
        ['Date', 'Product', 'Cattle', 'Session', 'Quantity', 'Unit', 'Farm'],
        filteredProduction.map((row: any) => [
          formatDateToLongForm(row.productionDate),
          row.productName || '',
          row.cattle?.tagNumber || '',
          row.milkingSession || '',
          Number(row.quantity) || 0,
          row.productName === 'MILK' ? 'L' : 'kg',
          row.farm?.name || '',
        ])
      );
      toast.success('Production report exported');
      return;
    }

    if (!filteredUsage.length) {
      toast.error('No usage rows to export.');
      return;
    }
    downloadCsv(
      `difarm-usage-report-${stamp}.csv`,
      ['Date', 'Product', 'Available', 'Used', 'Remaining', 'Dairy revenue', 'Paid', 'Unpaid', 'Farm'],
      filteredUsage.map((row) => [
        row.date,
        row.productType,
        Number(row.produced) || 0,
        Number(row.sold) || 0,
        Number(row.remaining) || 0,
        Number(row.saleValue) || 0,
        Number(row.amountPaid) || 0,
        Number(row.unpaid) || 0,
        row.farmName || '',
      ])
    );
    toast.success('Usage report exported');
  };

  const loading = productionLoading || usageLoading;
  const reportDateLabel =
    from && to ? `${from} → ${to}` : from || to || formatYmd(new Date());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Production & usage summary · {reportDateLabel}
            {farmId ? '' : role === 'SUPERADMIN' ? ' · all farms' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="btn btn-primary btn-sm inline-flex items-center gap-2"
        >
          <RiDownloadLine />
          Export CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-900">
          <button
            type="button"
            onClick={() => setTab('production')}
            className={`px-3 py-1.5 text-sm rounded-md ${
              tab === 'production'
                ? 'bg-primary text-white'
                : 'text-gray-700 dark:text-gray-200'
            }`}
          >
            Production report
          </button>
          <button
            type="button"
            onClick={() => setTab('usage')}
            className={`px-3 py-1.5 text-sm rounded-md ${
              tab === 'usage'
                ? 'bg-primary text-white'
                : 'text-gray-700 dark:text-gray-200'
            }`}
          >
            Usage report
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input peer ltr:pl-9 ltr:pr-9 w-52"
              placeholder="Search..."
            />
            <span className="absolute inset-y-0 left-0 w-9 flex items-center justify-center text-gray-400">
              <IconSearch className="w-4 h-4" />
            </span>
            {search && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 w-9 flex items-center justify-center text-gray-400"
                onClick={() => setSearch('')}
              >
                <IconXCircle className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="btn btn-outline-primary btn-sm inline-flex items-center gap-2"
          >
            <FiFilter />
            Filter
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Product</label>
            <select
              className="form-select mt-1"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <option value="">All products</option>
              {productOptions.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">From</label>
            <input
              type="date"
              className="form-input mt-1"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">To</label>
            <input
              type="date"
              className="form-input mt-1"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
        <p>
          {(tab === 'production' ? filteredProduction.length : filteredUsage.length).toLocaleString()}{' '}
          results
          {loading ? ' · loading…' : ''}
        </p>
      </div>

      <div className="table-responsive mb-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        {tab === 'production' ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Cattle</th>
                <th>Session</th>
                <th>Quantity</th>
                <th>U.M.</th>
                <th>Farm</th>
              </tr>
            </thead>
            <tbody>
              {filteredProduction.length ? (
                filteredProduction.map((row: any) => (
                  <tr key={row.id}>
                    <td>{formatDateToLongForm(row.productionDate)}</td>
                    <td>{row.productName}</td>
                    <td>{row.cattle?.tagNumber || '—'}</td>
                    <td>
                      {row.milkingSession === 'MORNING'
                        ? 'Morning'
                        : row.milkingSession === 'EVENING'
                          ? 'Evening'
                          : '—'}
                    </td>
                    <td>
                      {Number(row.quantity).toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })}
                    </td>
                    <td>{row.productName === 'MILK' ? 'L' : 'kg'}</td>
                    <td>{row.farm?.name || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-8">
                    {loading ? 'Loading report…' : 'No production records for this period.'}
                  </td>
                </tr>
              )}
              {!!filteredProduction.length && (
                <tr className="bg-primary/10 font-semibold">
                  <td>Total</td>
                  <td></td>
                  <td></td>
                  <td>{productionTotals.count} records</td>
                  <td>
                    {productionTotals.quantity.toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Available</th>
                <th>Used</th>
                <th>Remaining</th>
                <th>Dairy revenue</th>
                <th>Paid</th>
                <th>Unpaid</th>
                <th>Farm</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsage.length ? (
                filteredUsage.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDateToLongForm(row.date)}</td>
                    <td>{row.productType}</td>
                    <td>
                      {Number(row.produced).toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })}
                    </td>
                    <td>
                      {Number(row.sold).toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })}
                    </td>
                    <td>
                      {Number(row.remaining).toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })}
                    </td>
                    <td>{Number(row.saleValue).toLocaleString()}</td>
                    <td>{Number(row.amountPaid).toLocaleString()}</td>
                    <td className={row.unpaid > 0 ? 'text-amber-600 font-semibold' : ''}>
                      {Number(row.unpaid).toLocaleString()}
                    </td>
                    <td>{row.farmName || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center text-gray-500 py-8">
                    {loading ? 'Loading report…' : 'No usage records for this period.'}
                  </td>
                </tr>
              )}
              {!!filteredUsage.length && (
                <tr className="bg-primary/10 font-semibold">
                  <td>Total</td>
                  <td></td>
                  <td>
                    {usageTotals.produced.toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td>
                    {usageTotals.used.toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td>
                    {usageTotals.remaining.toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td>{usageTotals.revenue.toLocaleString()}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
