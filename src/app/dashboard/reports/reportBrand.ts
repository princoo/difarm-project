export const BRAND = {
  primary: [34, 139, 34] as [number, number, number],
  primaryDark: [22, 101, 52] as [number, number, number],
  primaryLight: [220, 252, 231] as [number, number, number],
  text: [17, 24, 39] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  zebra: [248, 250, 252] as [number, number, number],
  amber: [245, 158, 11] as [number, number, number],
};

export const MARGIN = 42;
export const LOGO_PATH = '/logo.png';

export async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch(LOGO_PATH);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function fmtDate(value?: string | Date | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function fmtNum(value: number, digits = 2) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const WORD_DOC_STYLES = `
  body { font-family: Calibri, Arial, sans-serif; color: #111827; font-size: 11pt; margin: 0; padding: 40px 48px; background: #f8fafc; }
  .page { background: #fff; padding: 28px 32px; border: 1px solid #e2e8f0; }
  .report-header { background: #166534; color: #fff; padding: 18px 22px; margin: -28px -32px 22px; }
  .report-header h1 { color: #fff; font-size: 18pt; margin: 0 0 4pt; border: none; }
  .report-header .meta { color: #dcfce7; font-size: 10pt; margin: 0; }
  h1 { color: #166534; font-size: 20pt; margin: 0 0 4pt; }
  h2 { color: #166534; font-size: 13pt; margin: 20pt 0 8pt; border-bottom: 2px solid #22c55e; padding-bottom: 4pt; }
  h3 { color: #15803d; font-size: 11pt; margin: 12pt 0 6pt; }
  .meta { color: #64748b; font-size: 10pt; margin-bottom: 12pt; }
  .layout-note { color: #64748b; font-size: 9pt; font-style: italic; margin: 0 0 12pt; }
  .kpi-table { width: 100%; border-collapse: separate; border-spacing: 8px; margin: 0 -8px 8pt; }
  .kpi-cell { border: 1px solid #e2e8f0; padding: 10pt 12pt; width: 25%; vertical-align: top; background: #fff; border-left: 4px solid #228b22; }
  .kpi-label { color: #64748b; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.04em; }
  .kpi-value { color: #166534; font-size: 18pt; font-weight: bold; margin-top: 4pt; }
  .kpi-sub { color: #64748b; font-size: 9pt; margin-top: 2pt; }
  .charts-grid { width: 100%; border-collapse: separate; border-spacing: 10px; margin: 0 -10px 8pt; }
  .charts-grid td { width: 50%; vertical-align: top; }
  .chart-panel { border: 1px solid #e2e8f0; padding: 12pt; background: #fff; min-height: 120px; }
  .chart-panel-wide { min-height: 260px; }
  .chart-title { color: #166534; font-size: 11pt; font-weight: bold; margin-bottom: 2pt; }
  .chart-purpose { color: #64748b; font-size: 8pt; margin-bottom: 10pt; }
  .chart-caption { text-align: center; color: #64748b; font-size: 8pt; margin: 8pt 0 0; }
  .chart-empty { color: #94a3b8; font-size: 9pt; }
  .line-legend { margin: 4pt 0 6pt; }
  .line-legend-item { display: inline-block; margin-right: 14pt; font-size: 9pt; color: #374151; }
  .line-legend-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
  .line-chart-wrap { width: 100%; overflow: hidden; }
  .hbar { display: table; width: 100%; margin-bottom: 6pt; }
  .hbar-label { display: table-cell; width: 28%; font-size: 9pt; color: #475569; vertical-align: middle; }
  .hbar-track { display: table-cell; width: 52%; background: #f1f5f9; height: 12px; vertical-align: middle; border-radius: 4px; }
  .hbar-fill { height: 12px; border-radius: 4px; }
  .hbar-value { display: table-cell; width: 20%; text-align: right; font-size: 9pt; font-weight: bold; color: #166534; vertical-align: middle; }
  .vbar-table { width: 100%; border-collapse: collapse; margin-top: 4pt; }
  .vbar-cell { text-align: center; vertical-align: bottom; padding: 0 2px; }
  .vbar-inner { width: 100%; }
  .vbar-fill { border-radius: 3px 3px 0 0; }
  .vbar-label { font-size: 7pt; color: #64748b; margin-top: 4px; }
  .vbar-val { font-size: 7pt; color: #166534; font-weight: bold; }
  .share-bar { display: table; width: 100%; height: 18px; border-radius: 6px; overflow: hidden; margin-bottom: 8pt; }
  .share-seg { display: table-cell; height: 18px; }
  .share-legend-row { font-size: 8pt; color: #475569; }
  .share-legend { margin-right: 10pt; white-space: nowrap; }
  .share-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
  .donut-layout { display: table; width: 100%; }
  .donut-layout > svg { display: table-cell; vertical-align: middle; }
  .donut-legend { display: table-cell; vertical-align: middle; padding-left: 16pt; width: 42%; }
  .donut-legend-item { margin-bottom: 8pt; font-size: 9pt; color: #374151; }
  .donut-swatch { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
  .donut-legend-label { font-weight: bold; color: #111827; }
  .donut-legend-value { display: block; margin-left: 16px; color: #64748b; font-size: 8pt; }
  .needs-panel { border: 1px solid #fde68a; background: #fffbeb; padding: 12pt; margin: 10pt 0; }
  .needs-panel .chart-title { color: #b45309; }
  table.data { border-collapse: collapse; width: 100%; margin: 6pt 0 12pt; }
  table.data th { background: #228b22; color: #fff; padding: 6pt 8pt; text-align: left; font-size: 9pt; }
  table.data td { border: 1px solid #e2e8f0; padding: 5pt 8pt; font-size: 9pt; }
  table.data tr:nth-child(even) td { background: #f8fafc; }
  .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 8pt; margin: 6pt 0; }
  .footer { color: #64748b; font-size: 9pt; margin-top: 24pt; border-top: 1px solid #e2e8f0; padding-top: 8pt; }
  .wireframe-label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin: 14pt 0 6pt; }
`;

/** Full HTML document suitable for iframe srcdoc / Word download. */
export function buildWordDocHtml(title: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:w="urn:schemas-microsoft-com:office:word"
 xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>${WORD_DOC_STYLES}</style>
</head>
<body>
<div class="page">
${bodyHtml}
<p class="footer">DiFarm · Digital Farming Management · Generated ${new Date().toLocaleString('en-GB')} · Layout: KPI cards → charts → tables → needs attention</p>
</div>
</body>
</html>`;
}

export function buildWordDocBlob(title: string, bodyHtml: string) {
  const html = buildWordDocHtml(title, bodyHtml);
  return new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
}

/** Word-compatible HTML document (.doc) — opens in Microsoft Word / LibreOffice. */
export function downloadWordDoc(filename: string, title: string, bodyHtml: string) {
  const blob = buildWordDocBlob(title, bodyHtml);
  downloadBlob(filename.endsWith('.doc') ? filename : `${filename}.doc`, blob);
}

export function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
