'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils';
import { downloadTemplate, type TemplateType } from '@/app/dashboard/stock/stockTemplates';
import { runStockImport, showImportReport } from '@/app/dashboard/stock/stockImport';

const IMPORT_LABELS: Record<TemplateType, string> = {
  suppliers: 'suppliers',
  items: 'items',
  'stock-in': 'stock-in lines',
  'stock-out': 'stock-out lines',
};

export function BulkImportToolbar({
  type,
  onSuccess,
  importContext,
  className,
}: {
  type: TemplateType;
  onSuccess: () => void;
  importContext?: { suppliers?: any[]; stocks?: any[] };
  className?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = (format: 'csv' | 'excel') => {
    try {
      downloadTemplate(type, format);
      toast.success('Template downloaded');
    } catch {
      toast.error('Failed to download template');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await runStockImport(file, type, importContext ?? {});
      showImportReport(result, IMPORT_LABELS[type]);
      if (result.created > 0) onSuccess();
    } catch {
      toast.error('Import failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className={cn('flex flex-nowrap items-center gap-2', className)}>
      <button
        type="button"
        className="stock-import-btn"
        onClick={() => handleDownload('csv')}
      >
        <ArrowDownTrayIcon className="h-3.5 w-3.5" />
        CSV
      </button>
      <button
        type="button"
        className="stock-import-btn"
        onClick={() => handleDownload('excel')}
      >
        <ArrowDownTrayIcon className="h-3.5 w-3.5" />
        Excel
      </button>
      <span className="mx-0.5 text-linked">|</span>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <button
        type="button"
        className="stock-import-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        <ArrowUpTrayIcon className="h-3.5 w-3.5" />
        {uploading ? 'Uploading…' : 'Upload file'}
      </button>
    </div>
  );
}

export function DataSnapshotToolbar({
  onExport,
  onRefresh,
  exportLabel = 'Export',
  className,
}: {
  onExport: (format: 'csv' | 'excel') => void | Promise<void>;
  onRefresh?: () => void | Promise<void>;
  exportLabel?: string;
  className?: string;
}) {
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleExport = async (format: 'csv' | 'excel') => {
    setExporting(true);
    try {
      await Promise.resolve(onExport(format));
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await Promise.resolve(onRefresh());
      toast.success('Data refreshed');
    } catch {
      toast.error('Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium stock-text">{exportLabel}</span>
        <button type="button" className="stock-import-btn" disabled={exporting} onClick={() => handleExport('csv')}>
          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
          CSV
        </button>
        <button type="button" className="stock-import-btn" disabled={exporting} onClick={() => handleExport('excel')}>
          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
          Excel
        </button>
      </div>
      {onRefresh && (
        <button type="button" className="stock-import-btn" disabled={refreshing} onClick={() => void handleRefresh()}>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      )}
    </div>
  );
}
