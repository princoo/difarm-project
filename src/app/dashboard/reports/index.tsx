import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import {
  DocumentTextIcon,
  TableCellsIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { RiDownloadLine } from 'react-icons/ri';
import { useProduction } from '@/hooks/api/productions';
import {
  DailySaleRow,
  useProductionTransaction,
} from '@/hooks/api/production_transaction';
import { isLoggedIn } from '@/hooks/api/auth';
import { getFarmId } from '@/utils/farmId';
import { toast } from 'react-hot-toast';
import { useSafeT } from '@/hooks/useSafeT';
import {
  autoGenerateMonthlyPackages,
  type AutoMonthlyPackage,
  type MonthlyDocMeta,
} from './autoGenerateMonthlyDocs';
import {
  buildFarmAdminReportPdfBlob,
  farmAdminReportPdfFilename,
} from './farmAdminReportPdf';
import {
  buildFarmAdminReportDocBlob,
  buildFarmAdminReportDocHtml,
  farmAdminReportDocFilename,
} from './farmAdminReportDoc';
import { downloadBlob, fmtNum } from './reportBrand';
import ReportReaderModal, { ReportReaderFormat } from './ReportReaderModal';
import type { FarmAdminReport } from './farmAdminReport.types';

type ViewMode = 'list' | 'cards';

function formatYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const VIEW_KEY = 'difarm-reports-view';

export default function Reports() {
  const { t } = useSafeT();
  const { getProductions, productions, loading: productionLoading }: any = useProduction();
  const {
    getDailySales,
    dailySales,
    getProductionTransactions,
    production_transactions,
    loading: usageLoading,
  }: any = useProductionTransaction();

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'cards';
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'cards';
  });
  const [farmId, setFarmId] = useState<string | null>(() => getFarmId());
  const role = isLoggedIn()?.role ?? '';
  const user = isLoggedIn();

  const [readerOpen, setReaderOpen] = useState(false);
  const [readerLoading, setReaderLoading] = useState(false);
  const [activeMeta, setActiveMeta] = useState<MonthlyDocMeta | null>(null);
  const [activeReport, setActiveReport] = useState<FarmAdminReport | null>(null);
  const [wordHtml, setWordHtml] = useState<string | null>(null);
  const [wordBlob, setWordBlob] = useState<Blob | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [initialFormat, setInitialFormat] = useState<ReportReaderFormat>('word');

  useEffect(() => {
    const syncFarm = () => setFarmId(getFarmId());
    window.addEventListener('difarm-farm-changed', syncFarm);
    return () => window.removeEventListener('difarm-farm-changed', syncFarm);
  }, []);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const range = useMemo(() => {
    const from = `${year}-01-01`;
    const endOfYear = new Date(year, 11, 31);
    const today = new Date();
    const to = year === today.getFullYear() ? formatYmd(today) : formatYmd(endOfYear);
    return { from, to };
  }, [year]);

  const load = useCallback(() => {
    getProductions({
      pageSize: 2000,
      from: range.from,
      to: range.to,
    });
    getDailySales({
      from: range.from,
      to: range.to,
    });
    getProductionTransactions({
      pageSize: 2000,
      from: range.from,
      to: range.to,
      productType: 'MILK',
    });
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load, farmId]);

  const productionRows = productions?.data?.data ?? [];
  const usageRows: DailySaleRow[] = dailySales ?? [];
  const transactionRows = useMemo(() => {
    const raw =
      production_transactions?.data?.data ??
      production_transactions?.data ??
      production_transactions ??
      [];
    return Array.isArray(raw) ? raw : [];
  }, [production_transactions]);

  /**
   * Automatic pipeline: whenever live data loads, the system aggregates
   * each month, builds KPIs/charts/alerts, and prepares documentation packages.
   */
  const monthlyPackages: AutoMonthlyPackage[] = useMemo(
    () =>
      autoGenerateMonthlyPackages({
        year,
        productionRows,
        usageRows,
        transactionRows,
        generatedBy: user?.email || user?.phone || user?.role || 'System (auto)',
        defaultFarmName: 'Farm',
      }),
    [
      year,
      productionRows,
      usageRows,
      transactionRows,
      user?.email,
      user?.phone,
      user?.role,
    ]
  );

  const filteredPackages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return monthlyPackages;
    return monthlyPackages.filter((p) =>
      [p.meta.label, p.meta.farmName, p.meta.id].join(' ').toLowerCase().includes(q)
    );
  }, [monthlyPackages, search]);

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return [current, current - 1, current - 2];
  }, []);

  const autoStats = useMemo(() => {
    const withData = monthlyPackages.filter((p) => p.meta.hasData).length;
    const charts = monthlyPackages.reduce((s, p) => s + p.meta.chartCount, 0);
    return { withData, charts, total: monthlyPackages.length };
  }, [monthlyPackages]);

  const setView = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_KEY, mode);
  };

  const closeReader = () => {
    setReaderOpen(false);
    setActiveMeta(null);
    setActiveReport(null);
    setWordHtml(null);
    setWordBlob(null);
    setPdfBlob(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const openPackage = async (pkg: AutoMonthlyPackage, format: ReportReaderFormat = 'word') => {
    setActiveMeta(pkg.meta);
    setActiveReport(pkg.report);
    setInitialFormat(format);
    setReaderOpen(true);
    setReaderLoading(true);
    setWordHtml(null);
    setWordBlob(null);
    setPdfBlob(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }

    try {
      // Documentation is built from the already auto-processed report (summaries + charts)
      const html = buildFarmAdminReportDocHtml(pkg.report);
      const wBlob = buildFarmAdminReportDocBlob(pkg.report);
      setWordHtml(html);
      setWordBlob(wBlob);

      const pBlob = await buildFarmAdminReportPdfBlob(pkg.report);
      setPdfBlob(pBlob);
      setPdfUrl(URL.createObjectURL(pBlob));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to open report');
      closeReader();
    } finally {
      setReaderLoading(false);
    }
  };

  const quickDownload = async (
    pkg: AutoMonthlyPackage,
    format: ReportReaderFormat,
    e: MouseEvent
  ) => {
    e.stopPropagation();
    try {
      if (format === 'pdf') {
        const blob = await buildFarmAdminReportPdfBlob(pkg.report);
        downloadBlob(farmAdminReportPdfFilename(pkg.report), blob);
      } else {
        const blob = buildFarmAdminReportDocBlob(pkg.report);
        downloadBlob(farmAdminReportDocFilename(pkg.report), blob);
      }
      toast.success(`${pkg.meta.label} ${format.toUpperCase()} downloaded`);
    } catch (err: any) {
      toast.error(err?.message || 'Download failed');
    }
  };

  const loading = productionLoading || usageLoading;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('pages.reports')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('pages.monthlyReportsLibrary')} · {year}
            {farmId ? '' : role === 'SUPERADMIN' ? ` · ${t('dashboard.allFarms').toLowerCase()}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="btn btn-outline-primary btn-sm inline-flex items-center gap-1.5"
            title={t('pages.refreshAutoReports')}
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('pages.refresh')}
          </button>

          <select
            className="form-select w-auto text-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-white dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              title={t('pages.listView')}
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('cards')}
              className={`p-1.5 rounded-md ${
                viewMode === 'cards'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              title={t('pages.cardView')}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200">
        <span className="font-medium text-primary">{t('pages.autoPipeline')}</span>
        {' · '}
        {t('pages.autoPipelineHint', {
          months: autoStats.withData,
          charts: autoStats.charts,
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input peer ltr:pl-9 ltr:pr-9 w-56"
            placeholder={t('pages.searchReports')}
          />
          <span className="absolute inset-y-0 left-0 w-9 flex items-center justify-center text-gray-400">
            <MagnifyingGlassIcon className="w-4 h-4" />
          </span>
          {search && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 w-9 flex items-center justify-center text-gray-400"
              onClick={() => setSearch('')}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {filteredPackages.length} {t('pages.monthlyReports').toLowerCase()}
          {loading ? ' · loading…' : ' · auto-updated'}
        </p>
      </div>

      {viewMode === 'list' ? (
        <div className="table-responsive rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>{t('pages.reportDocument')}</th>
                <th>{t('pages.period')}</th>
                <th>{t('pages.records')}</th>
                <th>{t('pages.milk')}</th>
                <th>{t('pages.revenue')}</th>
                <th>Charts</th>
                <th className="text-right">{t('pages.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.length ? (
                filteredPackages.map((pkg) => (
                  <tr
                    key={pkg.meta.id}
                    className="cursor-pointer hover:bg-primary/5"
                    onClick={() => openPackage(pkg, 'word')}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {pkg.meta.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {pkg.meta.farmName}
                            {pkg.meta.autoGenerated ? ' · Auto' : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-gray-600 dark:text-gray-300">
                      {pkg.meta.from} → {pkg.meta.to}
                    </td>
                    <td>{pkg.meta.recordCount.toLocaleString()}</td>
                    <td>{fmtNum(pkg.meta.milkQuantity)} L</td>
                    <td>{fmtNum(pkg.meta.revenue, 0)} RWF</td>
                    <td>
                      <span className="text-xs font-medium text-primary">
                        {pkg.meta.chartCount} charts
                      </span>
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => openPackage(pkg, 'word')}
                        >
                          {t('pages.open')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm text-gray-500"
                          title="Download PDF"
                          onClick={(e) => quickDownload(pkg, 'pdf', e)}
                        >
                          <RiDownloadLine />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-10">
                    {loading ? t('pages.loadingReports') : t('pages.noMonthlyReports')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPackages.length ? (
            filteredPackages.map((pkg) => (
              <button
                key={pkg.meta.id}
                type="button"
                onClick={() => openPackage(pkg, 'word')}
                className="text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition">
                      <DocumentTextIcon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {pkg.meta.label}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{pkg.meta.farmName}</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide text-primary bg-primary/10 px-2 py-1 rounded">
                    Auto
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/80 py-2 px-1">
                    <p className="text-[10px] text-gray-500 uppercase">{t('pages.records')}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {pkg.meta.recordCount}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/80 py-2 px-1">
                    <p className="text-[10px] text-gray-500 uppercase">{t('pages.milk')}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {fmtNum(pkg.meta.milkQuantity, 1)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/80 py-2 px-1">
                    <p className="text-[10px] text-gray-500 uppercase">Charts</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {pkg.meta.chartCount}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-400">
                  {pkg.meta.from} → {pkg.meta.to} · {t('pages.clickToRead')}
                </p>
              </button>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-16 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              {loading ? t('pages.loadingReports') : t('pages.noMonthlyReports')}
            </div>
          )}
        </div>
      )}

      <ReportReaderModal
        open={readerOpen}
        onClose={closeReader}
        title={activeMeta?.label || 'Monthly report'}
        subtitle={
          activeReport
            ? `${activeReport.farmName} · ${activeReport.periodLabel} · Auto-generated`
            : activeMeta
              ? `${activeMeta.farmName} · ${activeMeta.from} → ${activeMeta.to}`
              : undefined
        }
        loading={readerLoading}
        wordHtml={wordHtml}
        pdfUrl={pdfUrl}
        pdfBlob={pdfBlob}
        wordBlob={wordBlob}
        wordFilename={
          activeReport ? farmAdminReportDocFilename(activeReport) : 'report.doc'
        }
        pdfFilename={
          activeReport ? farmAdminReportPdfFilename(activeReport) : 'report.pdf'
        }
        initialFormat={initialFormat}
      />
    </div>
  );
}
