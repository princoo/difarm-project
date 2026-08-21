import type { jsPDF } from 'jspdf';
import { escapeHtml, fmtNum } from './reportBrand';

export type ChartDatum = {
  label: string;
  value: number;
  color?: string;
};

const CHART_COLORS = [
  '#228b22',
  '#166534',
  '#4ade80',
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#64748b',
];

/** Horizontal bar chart HTML (Word / reader). */
export function htmlHBarChart(title: string, purpose: string, data: ChartDatum[]) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const rows = data
    .map((d, i) => {
      const pct = Math.max(2, (d.value / max) * 100);
      const color = d.color || CHART_COLORS[i % CHART_COLORS.length];
      return `<div class="hbar">
        <div class="hbar-label">${escapeHtml(d.label)}</div>
        <div class="hbar-track"><div class="hbar-fill" style="width:${pct}%;background:${color};"></div></div>
        <div class="hbar-value">${escapeHtml(fmtNum(d.value, d.value % 1 ? 1 : 0))}</div>
      </div>`;
    })
    .join('');
  return `<div class="chart-panel">
    <div class="chart-title">${escapeHtml(title)}</div>
    <div class="chart-purpose">${escapeHtml(purpose)}</div>
    ${rows || '<p class="chart-empty">No data for this chart.</p>'}
  </div>`;
}

/** Multi-series line chart — matches DI-FARM “Activity Trend” style for daily production. */
export function htmlLineChart(
  title: string,
  purpose: string,
  series: Array<{ name: string; color: string; points: Array<{ label: string; value: number }> }>,
  options?: { yAxisLabel?: string; unit?: string }
) {
  const labels =
    series[0]?.points.map((p) => p.label) ||
    [];
  const allValues = series.flatMap((s) => s.points.map((p) => p.value));
  const maxRaw = Math.max(...allValues, 1);
  // Nice Y max (round up to a clean step like the 0–500 template)
  const step = niceStep(maxRaw);
  const yMax = Math.ceil(maxRaw / step) * step || step;
  const ticks = [0, 1, 2, 3, 4, 5].map((i) => (yMax / 5) * i);

  const W = 560;
  const H = 220;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xAt = (i: number, n: number) =>
    padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => padT + plotH - (v / yMax) * plotH;

  const gridLines = ticks
    .map((t) => {
      const y = yAt(t);
      return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>
        <text x="${padL - 6}" y="${y + 3}" text-anchor="end" font-size="9" fill="#6b7280" font-family="Calibri, Arial, sans-serif">${fmtNum(t, t % 1 ? 1 : 0)}</text>`;
    })
    .join('');

  // Vertical grid at each point (light)
  const vGrid = labels
    .map((_, i) => {
      const x = xAt(i, labels.length);
      return `<line x1="${x}" y1="${padT}" x2="${x}" y2="${padT + plotH}" stroke="#f3f4f6" stroke-width="1"/>`;
    })
    .join('');

  const polylines = series
    .map((s) => {
      const pts = s.points
        .map((p, i) => `${xAt(i, s.points.length)},${yAt(p.value)}`)
        .join(' ');
      const dots = s.points
        .map(
          (p, i) =>
            `<circle cx="${xAt(i, s.points.length)}" cy="${yAt(p.value)}" r="3.5" fill="${s.color}" stroke="#fff" stroke-width="1.5"/>`
        )
        .join('');
      return `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}`;
    })
    .join('');

  // X labels — show subset if many days
  const labelStep = labels.length > 16 ? 2 : 1;
  const xLabels = labels
    .map((lab, i) => {
      if (i % labelStep !== 0 && i !== labels.length - 1) return '';
      const x = xAt(i, labels.length);
      return `<text x="${x}" y="${H - 10}" text-anchor="middle" font-size="8" fill="#6b7280" font-family="Calibri, Arial, sans-serif">${escapeHtml(lab)}</text>`;
    })
    .join('');

  const legend = series
    .map(
      (s) =>
        `<span class="line-legend-item"><span class="line-legend-dot" style="background:${s.color};"></span>${escapeHtml(s.name)}</span>`
    )
    .join('');

  const yLabel = options?.yAxisLabel || 'Quantity';

  return `<div class="chart-panel chart-panel-wide">
    <div class="chart-title">${escapeHtml(title)}</div>
    <div class="line-legend">${legend}</div>
    <div class="chart-purpose">${escapeHtml(purpose)}${options?.unit ? ` · ${escapeHtml(options.unit)}` : ''}</div>
    <div class="line-chart-wrap">
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(title)}">
        <text x="12" y="${padT + plotH / 2}" fill="#6b7280" font-size="9" font-family="Calibri, Arial, sans-serif" transform="rotate(-90 12 ${padT + plotH / 2})" text-anchor="middle">${escapeHtml(yLabel)}</text>
        ${vGrid}
        ${gridLines}
        <line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="#9ca3af" stroke-width="1.25"/>
        <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#9ca3af" stroke-width="1.25"/>
        ${polylines}
        ${xLabels}
      </svg>
    </div>
    <p class="chart-caption"><em>Chart — Daily production trend</em></p>
  </div>`;
}

function niceStep(max: number) {
  if (max <= 5) return 1;
  if (max <= 20) return 5;
  if (max <= 50) return 10;
  if (max <= 100) return 20;
  if (max <= 250) return 50;
  if (max <= 500) return 100;
  if (max <= 1000) return 200;
  return Math.ceil(max / 5 / 100) * 100 || 100;
}

/** Vertical bar chart HTML for non-line trends (e.g. usage). */
export function htmlVBarChart(title: string, purpose: string, data: ChartDatum[], unit = '') {
  const max = Math.max(...data.map((d) => d.value), 1);
  const bars = data
    .slice(-14)
    .map((d, i) => {
      const h = Math.max(6, Math.round((d.value / max) * 90));
      const color = d.color || CHART_COLORS[i % CHART_COLORS.length];
      return `<td class="vbar-cell">
        <table class="vbar-inner" height="100"><tr>
          <td valign="bottom" align="center" height="100">
            <div class="vbar-fill" style="height:${h}px;width:18px;background:${color};margin:0 auto;"></div>
          </td>
        </tr></table>
        <div class="vbar-label">${escapeHtml(d.label)}</div>
        <div class="vbar-val">${escapeHtml(fmtNum(d.value, d.value % 1 ? 1 : 0))}</div>
      </td>`;
    })
    .join('');
  return `<div class="chart-panel">
    <div class="chart-title">${escapeHtml(title)}</div>
    <div class="chart-purpose">${escapeHtml(purpose)}${unit ? ` · ${escapeHtml(unit)}` : ''}</div>
    <table class="vbar-table" width="100%"><tr>${bars || '<td class="chart-empty">No data for this chart.</td>'}</tr></table>
  </div>`;
}

/** Doughnut / pie chart — Account Status style (labels + %). */
export function htmlDonutChart(
  title: string,
  purpose: string,
  data: ChartDatum[],
  unit = ''
) {
  const slices = data.filter((d) => d.value > 0);
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 140;
  const cy = 130;
  const r = 78;
  const rInner = 42;

  let angle = -Math.PI / 2;
  const arcs: string[] = [];
  const labels: string[] = [];

  slices.forEach((d, i) => {
    const share = d.value / total;
    const sweep = share * Math.PI * 2;
    const start = angle;
    const end = angle + sweep;
    const large = sweep > Math.PI ? 1 : 0;
    const color = d.color || CHART_COLORS[i % CHART_COLORS.length];

    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const xi1 = cx + rInner * Math.cos(end);
    const yi1 = cy + rInner * Math.sin(end);
    const xi2 = cx + rInner * Math.cos(start);
    const yi2 = cy + rInner * Math.sin(start);

    arcs.push(
      `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${rInner} ${rInner} 0 ${large} 0 ${xi2} ${yi2} Z" fill="${color}"/>`
    );

    const mid = start + sweep / 2;
    const lx = cx + (r + 28) * Math.cos(mid);
    const ly = cy + (r + 28) * Math.sin(mid);
    const pct = Math.round(share * 100);
    const anchor = Math.cos(mid) >= 0 ? 'start' : 'end';
    labels.push(
      `<text x="${lx}" y="${ly}" text-anchor="${anchor}" font-size="11" font-family="Calibri, Arial, sans-serif" fill="#111827">${escapeHtml(d.label)}</text>
       <text x="${lx}" y="${ly + 14}" text-anchor="${anchor}" font-size="10" font-family="Calibri, Arial, sans-serif" fill="#64748b">${pct}%</text>`
    );

    angle = end;
  });

  const legend = data
    .map((d, i) => {
      const color = d.color || CHART_COLORS[i % CHART_COLORS.length];
      const pct = total ? ((d.value / total) * 100).toFixed(0) : '0';
      return `<div class="donut-legend-item">
        <span class="donut-swatch" style="background:${color};"></span>
        <span class="donut-legend-label">${escapeHtml(d.label)}</span>
        <span class="donut-legend-value">${escapeHtml(fmtNum(d.value, d.value % 1 ? 1 : 0))}${unit ? ` ${escapeHtml(unit)}` : ''} · ${pct}%</span>
      </div>`;
    })
    .join('');

  const empty = !slices.length;

  return `<div class="chart-panel chart-panel-wide">
    <div class="chart-title">${escapeHtml(title)}</div>
    <div class="chart-purpose">${escapeHtml(purpose)}</div>
    ${
      empty
        ? '<p class="chart-empty">No milk disposition data for this period.</p>'
        : `<div class="donut-layout">
      <svg viewBox="0 0 280 260" width="280" height="260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(title)}">
        ${arcs.join('')}
        <circle cx="${cx}" cy="${cy}" r="${rInner - 2}" fill="#fff"/>
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="11" fill="#64748b" font-family="Calibri, Arial, sans-serif">Total</text>
        <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="16" font-weight="700" fill="#166534" font-family="Calibri, Arial, sans-serif">${escapeHtml(fmtNum(total, total % 1 ? 1 : 0))}${unit ? ` ${escapeHtml(unit)}` : ''}</text>
        ${labels.join('')}
      </svg>
      <div class="donut-legend">${legend}</div>
    </div>`
    }
  </div>`;
}

/** Stacked status / share chart as proportional blocks. */
export function htmlShareChart(title: string, purpose: string, data: ChartDatum[]) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const segments = data
    .map((d, i) => {
      const pct = (d.value / total) * 100;
      const color = d.color || CHART_COLORS[i % CHART_COLORS.length];
      return `<div class="share-seg" style="width:${pct}%;background:${color};" title="${escapeHtml(d.label)}: ${pct.toFixed(1)}%"></div>`;
    })
    .join('');
  const legend = data
    .map((d, i) => {
      const color = d.color || CHART_COLORS[i % CHART_COLORS.length];
      const pct = ((d.value / total) * 100).toFixed(1);
      return `<span class="share-legend"><span class="share-dot" style="background:${color};"></span>${escapeHtml(d.label)} ${escapeHtml(String(d.value))} (${pct}%)</span>`;
    })
    .join('');
  return `<div class="chart-panel">
    <div class="chart-title">${escapeHtml(title)}</div>
    <div class="chart-purpose">${escapeHtml(purpose)}</div>
    <div class="share-bar">${segments}</div>
    <div class="share-legend-row">${legend}</div>
  </div>`;
}

export function htmlKpiCard(label: string, value: string, secondary: string) {
  return `<td class="kpi-cell">
    <div class="kpi-label">${escapeHtml(label)}</div>
    <div class="kpi-value">${escapeHtml(value)}</div>
    <div class="kpi-sub">${escapeHtml(secondary)}</div>
  </td>`;
}

export function htmlNeedsAttention(items: Array<{ alert: string; example: string; action?: string }>) {
  if (!items.length) {
    return `<div class="needs-panel"><div class="chart-title">Needs attention</div><p class="chart-empty">No issues flagged for this period.</p></div>`;
  }
  const rows = items
    .map(
      (i) => `<tr>
      <td><strong>${escapeHtml(i.alert)}</strong></td>
      <td>${escapeHtml(i.example)}</td>
      <td>${escapeHtml(i.action || 'Review')}</td>
    </tr>`
    )
    .join('');
  return `<div class="needs-panel">
    <div class="chart-title">Needs attention</div>
    <table class="data needs-table">
      <thead><tr><th>Alert</th><th>Detail</th><th>Action</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

export function htmlDataTable(headers: string[], rows: (string | number)[][]) {
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');
  return `<table class="data"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

/** Draw a simple horizontal bar chart in PDF. Returns Y after chart. */
export function pdfHBarChart(
  doc: jsPDF,
  startY: number,
  title: string,
  data: ChartDatum[],
  margin: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY;
  if (y > pageHeight - 160) {
    doc.addPage();
    y = 52;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(22, 101, 52);
  doc.text(title, margin, y);
  y += 14;

  const max = Math.max(...data.map((d) => d.value), 1);
  const barMaxW = pageWidth - margin * 2 - 120;

  data.slice(0, 10).forEach((d, i) => {
    const barW = Math.max(4, (d.value / max) * barMaxW);
    const color = hexToRgb(d.color || CHART_COLORS[i % CHART_COLORS.length]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(truncate(d.label, 16), margin, y + 8);
    doc.setFillColor(...color);
    doc.roundedRect(margin + 90, y, barW, 10, 2, 2, 'F');
    doc.setTextColor(17, 24, 39);
    doc.text(fmtNum(d.value, d.value % 1 ? 1 : 0), margin + 96 + barW, y + 8);
    y += 16;
  });

  return y + 10;
}

/** Draw vertical bars for a trend chart. */
export function pdfVBarChart(
  doc: jsPDF,
  startY: number,
  title: string,
  data: ChartDatum[],
  margin: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY;
  if (y > pageHeight - 180) {
    doc.addPage();
    y = 52;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(22, 101, 52);
  doc.text(title, margin, y);
  y += 10;

  const chartH = 90;
  const chartTop = y + 8;
  const chartBottom = chartTop + chartH;
  const items = data.slice(-12);
  const max = Math.max(...items.map((d) => d.value), 1);
  const gap = 6;
  const availW = pageWidth - margin * 2;
  const barW = Math.min(28, (availW - gap * (items.length - 1)) / Math.max(items.length, 1));

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, chartBottom, pageWidth - margin, chartBottom);

  items.forEach((d, i) => {
    const h = Math.max(2, (d.value / max) * chartH);
    const x = margin + i * (barW + gap);
    const color = hexToRgb(d.color || CHART_COLORS[i % CHART_COLORS.length]);
    doc.setFillColor(...color);
    doc.rect(x, chartBottom - h, barW, h, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(truncate(d.label, 6), x + barW / 2, chartBottom + 10, { align: 'center' });
  });

  return chartBottom + 22;
}

/** Multi-series line chart for PDF — Activity Trend style. */
export function pdfLineChart(
  doc: jsPDF,
  startY: number,
  title: string,
  series: Array<{ name: string; color: string; points: Array<{ label: string; value: number }> }>,
  margin: number,
  yAxisLabel = 'Quantity'
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY;
  if (y > pageHeight - 220) {
    doc.addPage();
    y = 52;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(22, 101, 52);
  doc.text(title, margin, y);
  y += 12;

  // Legend
  let legendX = margin;
  series.forEach((s) => {
    const color = hexToRgb(s.color);
    doc.setFillColor(...color);
    doc.circle(legendX + 4, y - 2, 3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);
    doc.text(s.name, legendX + 12, y);
    legendX += doc.getTextWidth(s.name) + 28;
  });
  y += 10;

  const labels = series[0]?.points.map((p) => p.label) || [];
  const allValues = series.flatMap((s) => s.points.map((p) => p.value));
  const maxRaw = Math.max(...allValues, 1);
  const step = niceStep(maxRaw);
  const yMax = Math.ceil(maxRaw / step) * step || step;

  const chartLeft = margin + 28;
  const chartRight = pageWidth - margin;
  const chartTop = y;
  const chartH = 120;
  const chartBottom = chartTop + chartH;
  const chartW = chartRight - chartLeft;

  // Grid + Y ticks
  for (let i = 0; i <= 5; i++) {
    const val = (yMax / 5) * i;
    const yy = chartBottom - (val / yMax) * chartH;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.line(chartLeft, yy, chartRight, yy);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text(fmtNum(val, val % 1 ? 1 : 0), chartLeft - 4, yy + 2, { align: 'right' });
  }

  // Axes
  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(1);
  doc.line(chartLeft, chartBottom, chartRight, chartBottom);
  doc.line(chartLeft, chartTop, chartLeft, chartBottom);

  // Y axis label
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text(yAxisLabel, margin, chartTop + chartH / 2, { angle: 90 });

  const n = Math.max(labels.length, 1);
  const xAt = (i: number) => chartLeft + (n <= 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const yAt = (v: number) => chartBottom - (v / yMax) * chartH;

  series.forEach((s) => {
    const color = hexToRgb(s.color);
    doc.setDrawColor(...color);
    doc.setFillColor(...color);
    doc.setLineWidth(2);
    for (let i = 0; i < s.points.length - 1; i++) {
      doc.line(xAt(i), yAt(s.points[i].value), xAt(i + 1), yAt(s.points[i + 1].value));
    }
    s.points.forEach((p, i) => {
      doc.circle(xAt(i), yAt(p.value), 2.5, 'F');
    });
  });

  // X labels
  const labelStep = labels.length > 16 ? 2 : 1;
  doc.setFontSize(6);
  doc.setTextColor(107, 114, 128);
  labels.forEach((lab, i) => {
    if (i % labelStep !== 0 && i !== labels.length - 1) return;
    doc.text(truncate(lab, 6), xAt(i), chartBottom + 10, { align: 'center' });
  });

  return chartBottom + 24;
}

/** Doughnut chart for PDF (milk consumed). */
export function pdfDonutChart(
  doc: jsPDF,
  startY: number,
  title: string,
  data: ChartDatum[],
  margin: number,
  unit = 'L'
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY;
  if (y > pageHeight - 220) {
    doc.addPage();
    y = 52;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(22, 101, 52);
  doc.text(title, margin, y);
  y += 14;

  const slices = data.filter((d) => d.value > 0);
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  const cx = margin + 90;
  const cy = y + 75;
  const r = 58;
  const rInner = 30;

  let angle = -Math.PI / 2;
  slices.forEach((d, i) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const color = hexToRgb(d.color || CHART_COLORS[i % CHART_COLORS.length]);
    doc.setFillColor(...color);
    // Approximate wedge with triangle fan
    const steps = Math.max(8, Math.ceil(sweep / 0.15));
    for (let s = 0; s < steps; s++) {
      const a0 = angle + (sweep * s) / steps;
      const a1 = angle + (sweep * (s + 1)) / steps;
      const x0 = cx + r * Math.cos(a0);
      const y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      doc.triangle(cx, cy, x0, y0, x1, y1, 'F');
    }
    angle += sweep;
  });

  // Inner hole
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, rInner, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Total', cx, cy - 4, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(22, 101, 52);
  doc.text(`${fmtNum(total, total % 1 ? 1 : 0)} ${unit}`, cx, cy + 10, { align: 'center' });

  // Legend to the right
  let ly = y + 20;
  const lx = margin + 200;
  data.forEach((d, i) => {
    const color = hexToRgb(d.color || CHART_COLORS[i % CHART_COLORS.length]);
    const pct = total ? Math.round((d.value / total) * 100) : 0;
    doc.setFillColor(...color);
    doc.circle(lx, ly - 2, 4, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text(d.label, lx + 10, ly);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${fmtNum(d.value, d.value % 1 ? 1 : 0)} ${unit} · ${pct}%`,
      pageWidth - margin,
      ly,
      { align: 'right' }
    );
    ly += 16;
  });

  return Math.max(cy + r + 20, ly + 8);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
