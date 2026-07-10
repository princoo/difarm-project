import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from '@/lib/router-compat';
import { capitalize } from 'lodash';
import { fetchCattleReport } from '@/hooks/api/cattle';
import formatDateToLongForm from '@/utils/DateFormattter';
import CattleAvatar from './CattleAvatar';
import {
  activityLabel,
  inferBirthOrigin,
  isActiveOnFarm,
  statusColor,
  statusLabel,
} from './cattleStatus';
import type { CattleReport } from './cattleReport.types';
import toast from 'react-hot-toast';
import { RingProgress, Text } from '@mantine/core';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  MapPinIcon,
  BuildingOffice2Icon,
  DocumentArrowDownIcon,
  ArrowLeftIcon,
  CheckBadgeIcon,
  ScaleIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';

function computeWellnessScore(report: CattleReport): number {
  const status = report.lifeStatus.status;
  let score = status === 'HEALTHY' ? 88 : status === 'SICK' ? 52 : status === 'SOLD' ? 40 : 35;
  score += Math.min(report.healthRecords.length * 4, 12);
  if (report.lifeStatus.lastCheckupDate) {
    const days =
      (Date.now() - new Date(report.lifeStatus.lastCheckupDate).getTime()) / 86400000;
    if (days < 30) score += 8;
    else if (days < 90) score += 4;
  }
  if (report.production.totalMilk > 0) score += 5;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function MetricPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">{label}</p>
    </div>
  );
}

function SidebarCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function RecordRow({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <BeakerIcon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      {badge && (
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shrink-0">
          {badge}
        </span>
      )}
    </div>
  );
}

function LifeStageBar({
  stages,
}: {
  stages: { label: string; count: number | string; active: boolean; current?: boolean }[];
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
      {stages.map((stage) => (
        <div key={stage.label} className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">{stage.count}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate px-0.5">{stage.label}</p>
          <div
            className={`mt-2 h-1.5 rounded-full mx-1 ${
              stage.current
                ? 'bg-primary ring-2 ring-primary/30 ring-offset-1 dark:ring-offset-gray-800'
                : stage.active
                  ? 'bg-primary/70'
                  : 'bg-gray-200 dark:bg-gray-600'
            }`}
          />
        </div>
      ))}
    </div>
  );
}

export default function CattleDetail() {
  const { cattleId } = useParams<{ cattleId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<CattleReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'production' | 'health' | 'breeding'>('production');

  useEffect(() => {
    if (!cattleId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchCattleReport(cattleId);
        setReport(res.data?.data ?? res.data);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load cattle report');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cattleId]);

  const wellnessScore = useMemo(() => (report ? computeWellnessScore(report) : 0), [report]);

  const comparisonData = useMemo(() => {
    if (!report) return [];
    return [
      { name: 'Milk', value: report.production.totalMilk },
      { name: 'Feed (est.)', value: Math.round(report.expenses.estimatedFeedPerHead) },
    ];
  }, [report]);

  const handleDownloadPdf = async () => {
    if (!report) return;
    setPdfLoading(true);
    try {
      const { generateCattleReportPdf } = await import('./cattleReportPdf');
      await generateCattleReportPdf(report);
      toast.success('PDF report downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">Loading cattle profile…</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6">
        <p className="text-red-500">{error || 'Cattle not found'}</p>
        <button type="button" className="btn btn-primary mt-4" onClick={() => navigate('/account/cattle')}>
          Back to cattle
        </button>
      </div>
    );
  }

  const cattle = report.profile;
  const tags = [
    capitalize(cattle.breed || ''),
    capitalize(cattle.gender || ''),
    inferBirthOrigin(cattle),
    cattle.motherTag ? `Mother #${cattle.motherTag}` : null,
  ].filter(Boolean);

  const lifeStages = [
    { label: 'Registered', count: 1, active: true },
    { label: 'On farm', count: isActiveOnFarm(cattle.status) ? 1 : 0, active: isActiveOnFarm(cattle.status) },
    { label: 'Health', count: report.healthRecords.length, active: report.healthRecords.length > 0 },
    { label: 'Production', count: report.production.records.length, active: report.production.records.length > 0 },
    { label: 'Checked', count: cattle.lastCheckupDate ? 1 : 0, active: !!cattle.lastCheckupDate },
    {
      label: statusLabel(cattle.status).split(' ')[0],
      count: 1,
      active: true,
      current: true,
    },
  ];

  const productionScore = Math.min(100, Math.round(report.production.totalMilk / 5) || 0);
  const careScore = Math.min(100, report.healthRecords.length * 20);
  const efficiencyPct =
    report.economics.milkToFeedRatio != null
      ? Math.min(100, Math.round(report.economics.milkToFeedRatio * 25))
      : 0;
  const weightPct = cattle.weight ? Math.min(100, Math.round((cattle.weight / 800) * 100)) : 0;

  return (
    <div className="min-h-screen bg-[#f0f2f7] dark:bg-gray-950 p-4 md:p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-5">
        <button type="button" onClick={() => navigate('/account/cattle')} className="hover:text-primary">
          Cattle
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">#{cattle.tagNumber}</span>
      </nav>

      <div className="flex flex-col xl:flex-row gap-5 max-w-[1600px] mx-auto">
        {/* ── Left profile sidebar ── */}
        <aside className="w-full xl:w-[300px] shrink-0 space-y-4">
          <SidebarCard className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <CattleAvatar tagNumber={cattle.tagNumber} breed={cattle.breed} size="profile" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">#{cattle.tagNumber}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {capitalize(cattle.breed || '')} · {capitalize(cattle.gender || '')}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(cattle.status)}`}>
                <CheckBadgeIcon className="w-3.5 h-3.5" />
                {statusLabel(cattle.status)}
              </span>
            </div>
          </SidebarCard>

          <SidebarCard className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Attributes</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </SidebarCard>

          <SidebarCard className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3">
                <MapPinIcon className="w-4 h-4 text-gray-400 mb-1" />
                <p className="text-[10px] uppercase text-gray-500">Location</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5 line-clamp-2">
                  {cattle.location || '—'}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3">
                <BuildingOffice2Icon className="w-4 h-4 text-gray-400 mb-1" />
                <p className="text-[10px] uppercase text-gray-500">Farm</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5 line-clamp-2">
                  {cattle.farm?.name || '—'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3">
                <ScaleIcon className="w-4 h-4 text-gray-400 mb-1" />
                <p className="text-[10px] uppercase text-gray-500">Weight</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">
                  {cattle.weight != null ? `${cattle.weight} kg` : '—'}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3">
                <p className="text-[10px] uppercase text-gray-500">DOB</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white mt-2">
                  {cattle.DOB ? formatDateToLongForm(cattle.DOB) : '—'}
                </p>
              </div>
            </div>
          </SidebarCard>

          <SidebarCard className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Health records</p>
            <div className="max-h-40 overflow-y-auto">
              {report.healthRecords.length ? (
                report.healthRecords.slice(0, 5).map((r) => (
                  <RecordRow
                    key={r.id}
                    title={r.vaccineType}
                    subtitle={formatDateToLongForm(r.date)}
                    badge={r.veterinarian?.name?.split(' ')[0]}
                  />
                ))
              ) : (
                <p className="text-xs text-gray-400 py-3">No health records yet</p>
              )}
            </div>
          </SidebarCard>

          <SidebarCard className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Production history</p>
            <div className="max-h-40 overflow-y-auto">
              {report.production.records.length ? (
                report.production.records.slice(0, 5).map((r) => (
                  <RecordRow
                    key={r.id}
                    title={r.productName}
                    subtitle={formatDateToLongForm(r.productionDate)}
                    badge={`${r.quantity} u`}
                  />
                ))
              ) : (
                <p className="text-xs text-gray-400 py-3">No production records yet</p>
              )}
            </div>
          </SidebarCard>

          <div className="space-y-2">
            <button
              type="button"
              className="w-full btn btn-primary py-2.5 gap-2"
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              {pdfLoading ? 'Generating PDF…' : 'Download PDF report'}
            </button>
            <button
              type="button"
              className="w-full btn btn-outline-primary py-2.5 gap-2"
              onClick={() => navigate('/account/cattle')}
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to cattle list
            </button>
          </div>
        </aside>

        {/* ── Main dashboard ── */}
        <main className="flex-1 min-w-0 space-y-5">
          {/* Top metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricPill value={`${wellnessScore}%`} label="Health index" />
            <MetricPill value={`${productionScore}%`} label="Production score" />
            <MetricPill value={`${efficiencyPct}%`} label="Feed efficiency" />
            <MetricPill value={`${careScore}%`} label="Vet care score" />
            <MetricPill value={`${weightPct}%`} label="Weight index" />
            <MetricPill
              value={isActiveOnFarm(cattle.status) ? '100%' : '0%'}
              label="Farm activity"
            />
          </div>

          {/* Analysis row — 3 cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Health gauge */}
            <SidebarCard className="p-5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Health score</p>
              <div className="flex justify-center">
                <RingProgress
                  size={160}
                  thickness={14}
                  roundCaps
                  sections={[{ value: wellnessScore, color: '#228B22' }]}
                  label={
                    <Text ta="center" size="xl" fw={700} className="text-gray-900 dark:text-white">
                      {wellnessScore}
                    </Text>
                  }
                />
              </div>
              <p className="text-xs text-center text-gray-500 mt-3">Overall wellness index</p>
            </SidebarCard>

            {/* Overall summary */}
            <SidebarCard className="p-5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Overall summary</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {wellnessScore >= 80 && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary">
                    High performer
                  </span>
                )}
                {report.production.totalMilk > 0 && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Active producer
                  </span>
                )}
                {isActiveOnFarm(cattle.status) && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    On farm
                  </span>
                )}
              </div>
              <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex gap-2">
                  <span className="text-primary">●</span>
                  <span>
                    <strong className="text-gray-900 dark:text-white">{statusLabel(cattle.status)}</strong>
                    {' — '}
                    {activityLabel(cattle.status)}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">●</span>
                  <span>
                    <strong className="text-gray-900 dark:text-white">{report.production.totalMilk}</strong> total
                    milk units recorded
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">●</span>
                  <span>
                    <strong className="text-gray-900 dark:text-white">{report.healthRecords.length}</strong> veterinary
                    visits on file
                  </span>
                </li>
                {cattle.lastCheckupDate && (
                  <li className="flex gap-2">
                    <span className="text-primary">●</span>
                    <span>
                      Last checkup {formatDateToLongForm(cattle.lastCheckupDate)}
                    </span>
                  </li>
                )}
              </ul>
            </SidebarCard>

            {/* Comparison chart */}
            <SidebarCard className="p-5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Production vs feed</p>
              <p className="text-xs text-gray-500 mb-3">Milk output compared to estimated feed intake</p>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} barGap={8}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} width={36} />
                    <Tooltip />
                    <Bar dataKey="value" name="Units" fill="#228B22" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SidebarCard>
          </div>

          {/* Life cycle pipeline */}
          <SidebarCard className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  #{cattle.tagNumber} life-cycle overview
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Track status from registration to current state</p>
              </div>
              <span className={`self-start px-3 py-1 rounded-full text-xs font-semibold ${statusColor(cattle.status)}`}>
                {activityLabel(cattle.status)}
              </span>
            </div>
            <LifeStageBar stages={lifeStages} />
          </SidebarCard>

          {/* Activity tabs + tables */}
          <SidebarCard className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                #{cattle.tagNumber} activity records
              </h2>
              <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-900/60">
                {(['production', 'health', 'breeding'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      activeTab === tab
                        ? 'bg-white dark:bg-gray-800 text-primary shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'production' && (
              <>
                {report.production.dailyMilk.length > 0 && (
                  <div className="mb-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/40">
                    <p className="text-xs font-semibold uppercase text-gray-500 mb-3">Daily milk pipeline</p>
                    <LifeStageBar
                      stages={report.production.dailyMilk.slice(0, 6).map((d, i, arr) => ({
                        label: new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                        count: d.quantity,
                        active: true,
                        current: i === arr.length - 1,
                      }))}
                    />
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-3 pr-4 font-semibold">Date</th>
                        <th className="pb-3 pr-4 font-semibold">Product</th>
                        <th className="pb-3 font-semibold">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.production.records.length ? (
                        report.production.records.map((r) => (
                          <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700/50">
                            <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                              {formatDateToLongForm(r.productionDate)}
                            </td>
                            <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{r.productName}</td>
                            <td className="py-3 text-gray-700 dark:text-gray-300">{r.quantity}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-gray-400 italic">
                            No production records yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'health' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 pr-4 font-semibold">Date</th>
                      <th className="pb-3 pr-4 font-semibold">Treatment / vaccine</th>
                      <th className="pb-3 font-semibold">Veterinarian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.healthRecords.length ? (
                      report.healthRecords.map((r) => (
                        <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700/50">
                          <td className="py-3 pr-4">{formatDateToLongForm(r.date)}</td>
                          <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{r.vaccineType}</td>
                          <td className="py-3 text-gray-600 dark:text-gray-400">
                            {r.veterinarian?.name || '—'}
                            {r.veterinarian?.phone && (
                              <span className="text-gray-400"> · {r.veterinarian.phone}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-gray-400 italic">
                          No health records yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'breeding' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 pr-4 font-semibold">Date</th>
                      <th className="pb-3 pr-4 font-semibold">Method</th>
                      <th className="pb-3 pr-4 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Veterinarian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.breedingRecords.length ? (
                      report.breedingRecords.map((r) => (
                        <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700/50">
                          <td className="py-3 pr-4">{formatDateToLongForm(r.date)}</td>
                          <td className="py-3 pr-4">{r.method}</td>
                          <td className="py-3 pr-4">{r.type}</td>
                          <td className="py-3">{r.veterinarian?.name || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                          No breeding records yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </SidebarCard>

          {/* Purchase & feed economics row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SidebarCard className="p-5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Purchase & ownership</p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-gray-500">Origin</dt>
                  <dd className="font-medium text-gray-900 dark:text-white mt-0.5">{inferBirthOrigin(cattle)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Mother tag</dt>
                  <dd className="font-medium text-gray-900 dark:text-white mt-0.5">{cattle.motherTag || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Purchase date</dt>
                  <dd className="font-medium text-gray-900 dark:text-white mt-0.5">
                    {cattle.purchaseDate ? formatDateToLongForm(cattle.purchaseDate) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Price (RWF)</dt>
                  <dd className="font-medium text-gray-900 dark:text-white mt-0.5">
                    {cattle.price != null ? cattle.price.toLocaleString() : '—'}
                  </dd>
                </div>
              </dl>
            </SidebarCard>
            <SidebarCard className="p-5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Feed & economics</p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-gray-500">Est. feed (this cattle)</dt>
                  <dd className="font-medium text-gray-900 dark:text-white mt-0.5">
                    {report.expenses.estimatedFeedPerHead.toFixed(1)} units
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Milk / feed ratio</dt>
                  <dd className="font-medium text-gray-900 dark:text-white mt-0.5">
                    {report.economics.milkToFeedRatio ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Farm food consumed</dt>
                  <dd className="font-medium text-gray-900 dark:text-white mt-0.5">
                    {report.expenses.totalFoodConsumed} units
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Active cattle</dt>
                  <dd className="font-medium text-gray-900 dark:text-white mt-0.5">
                    {report.expenses.activeCattleCount}
                  </dd>
                </div>
              </dl>
              <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">{report.expenses.note}</p>
            </SidebarCard>
          </div>
        </main>
      </div>
    </div>
  );
}
