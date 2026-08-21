import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FarmAdminReport } from './farmAdminReport.types';
import {
  BRAND,
  MARGIN,
  downloadBlob,
  fmtDate,
  fmtNum,
  loadLogoDataUrl,
} from './reportBrand';
import { pdfDonutChart, pdfHBarChart, pdfLineChart, pdfVBarChart } from './reportCharts';

function drawFooter(doc: jsPDF, page: number, totalPages: number, farmName: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 28;
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, footerY - 8, pageWidth - MARGIN, footerY - 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text('DiFarm · Monthly Farm Administrative Report', MARGIN, footerY);
  doc.text(farmName, pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Page ${page} of ${totalPages}`, pageWidth - MARGIN, footerY, { align: 'right' });
}

function drawPageBanner(doc: jsPDF, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BRAND.primaryDark);
  doc.rect(0, 0, pageWidth, 36, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.white);
  doc.text('DiFarm Farm Report', MARGIN, 22);
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(220, 252, 231);
    doc.text(subtitle, pageWidth - MARGIN, 22, { align: 'right' });
  }
}

function drawHero(doc: jsPDF, report: FarmAdminReport, logo: string | null): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerHeight = 110;
  doc.setFillColor(...BRAND.primaryDark);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, headerHeight - 6, pageWidth, 6, 'F');

  if (logo) {
    doc.addImage(logo, 'PNG', MARGIN, 18, 48, 48);
  } else {
    doc.setFillColor(...BRAND.white);
    doc.circle(MARGIN + 24, 42, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...BRAND.primaryDark);
    doc.text('DF', MARGIN + 24, 46, { align: 'center' });
  }

  const textX = logo ? MARGIN + 60 : MARGIN + 56;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...BRAND.white);
  doc.text('DiFarm', textX, 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(220, 252, 231);
  doc.text('Monthly Farm Administrative Report', textX, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.white);
  doc.text(report.farmName, textX, 70);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 252, 231);
  doc.text(report.periodLabel, textX, 86);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generated ${report.generatedAt}`, pageWidth - MARGIN, 40, { align: 'right' });
  doc.text(`By ${report.generatedBy}`, pageWidth - MARGIN, 54, { align: 'right' });

  return headerHeight + 16;
}

function drawKpis(doc: jsPDF, y: number, report: FarmAdminReport): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const gap = 8;
  const cardW = (pageWidth - MARGIN * 2 - gap * 3) / 4;
  const cardH = 56;
  const cards = [
    { label: 'Milk produced', value: fmtNum(report.kpis.milkQuantity), unit: 'Litres' },
    { label: 'Records', value: String(report.kpis.totalRecords), unit: 'entries' },
    { label: 'Cattle producing', value: String(report.kpis.producingCattle), unit: 'animals' },
    { label: 'Dairy revenue', value: fmtNum(report.kpis.revenue, 0), unit: 'RWF' },
    { label: 'Morning yield', value: fmtNum(report.kpis.morningQuantity), unit: 'L / units' },
    { label: 'Evening yield', value: fmtNum(report.kpis.eveningQuantity), unit: 'L / units' },
    { label: 'Used / sold', value: fmtNum(report.kpis.used), unit: 'units' },
    { label: 'Unpaid', value: fmtNum(report.kpis.unpaid, 0), unit: 'RWF' },
  ];

  cards.forEach((kpi, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const x = MARGIN + col * (cardW + gap);
    const cy = y + row * (cardH + gap);
    doc.setFillColor(...BRAND.white);
    doc.setDrawColor(...BRAND.border);
    doc.setLineWidth(0.75);
    doc.roundedRect(x, cy, cardW, cardH, 5, 5, 'FD');
    doc.setFillColor(...BRAND.primary);
    doc.rect(x, cy, 3, cardH, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.muted);
    doc.text(kpi.label.toUpperCase(), x + 10, cy + 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...BRAND.primaryDark);
    doc.text(kpi.value, x + 10, cy + 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.muted);
    doc.text(kpi.unit, x + 10, cy + 44);
  });

  return y + 2 * (cardH + gap) + 8;
}

function sectionTitle(doc: jsPDF, y: number, title: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y > pageHeight - 130) {
    doc.addPage();
    drawPageBanner(doc, 'Continued');
    y = 52;
  }
  doc.setFillColor(...BRAND.primaryLight);
  doc.roundedRect(MARGIN, y - 2, pageWidth - MARGIN * 2, 20, 4, 4, 'F');
  doc.setFillColor(...BRAND.primary);
  doc.circle(MARGIN + 10, y + 8, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.primaryDark);
  doc.text(title, MARGIN + 20, y + 12);
  return y + 28;
}

function tableDefaults() {
  return {
    theme: 'plain' as const,
    margin: { left: MARGIN, right: MARGIN },
    styles: {
      fontSize: 8,
      cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
      lineColor: BRAND.border,
      lineWidth: 0.4,
      textColor: BRAND.text,
    },
    headStyles: {
      fillColor: BRAND.primary,
      textColor: BRAND.white,
      fontStyle: 'bold' as const,
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: BRAND.zebra },
  };
}

function dataTable(doc: jsPDF, startY: number, head: string[][], body: (string | number)[][]): number {
  autoTable(doc, { startY, head, body, ...tableDefaults() });
  return (doc as any).lastAutoTable.finalY + 14;
}

export async function buildFarmAdminReportPdfBlob(report: FarmAdminReport) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const logo = await loadLogoDataUrl();
  let y = drawHero(doc, report, logo);

  y = sectionTitle(doc, y, 'Level 1 · KPI cards');
  y = drawKpis(doc, y, report);

  y = sectionTitle(doc, y, 'Level 2 · Charts (auto-generated)');
  for (const chart of report.charts || []) {
    if (chart.type === 'donut') {
      y = pdfDonutChart(doc, y, chart.title, chart.data, MARGIN, chart.unit || 'L');
    } else if (chart.type === 'line' && chart.series?.length) {
      y = pdfLineChart(
        doc,
        y,
        chart.title,
        chart.series,
        MARGIN,
        chart.yAxisLabel || 'Quantity'
      );
    } else if (chart.type === 'vbar') {
      y = pdfVBarChart(doc, y, chart.title, chart.data, MARGIN);
    } else {
      y = pdfHBarChart(doc, y, chart.title, chart.data, MARGIN);
    }
  }

  if (report.alerts.length) {
    y = sectionTitle(doc, y, 'Level 3 · Needs attention');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.text);
    for (const alert of report.alerts) {
      const lines = doc.splitTextToSize(`• ${alert}`, doc.internal.pageSize.getWidth() - MARGIN * 2);
      doc.text(lines, MARGIN, y);
      y += lines.length * 12 + 4;
    }
    y += 6;
  }

  y = sectionTitle(doc, y, 'Level 4 · Operational tables');
  y = dataTable(
    doc,
    y,
    [['Product', 'Quantity', 'Unit', 'Records']],
    report.byProduct.map((r) => [r.product, fmtNum(r.quantity), r.unit, r.records])
  );

  y = dataTable(
    doc,
    y,
    [['Session', 'Quantity', 'Records', 'Share %']],
    report.bySession.map((r) => [r.session, fmtNum(r.quantity), r.records, `${fmtNum(r.sharePct, 1)}%`])
  );

  y = dataTable(
    doc,
    y,
    [['Date', 'Total', 'Morning', 'Evening', 'Other', 'Records']],
    report.byDay.map((r) => [
      fmtDate(r.date),
      fmtNum(r.quantity),
      fmtNum(r.morning),
      fmtNum(r.evening),
      fmtNum(r.other),
      r.records,
    ])
  );

  y = dataTable(
    doc,
    y,
    [['Cattle', 'Total', 'Morning', 'Evening', 'Records']],
    report.byCattle.slice(0, 40).map((r) => [
      r.cattle,
      fmtNum(r.quantity),
      fmtNum(r.morning),
      fmtNum(r.evening),
      r.records,
    ])
  );

  if (report.usageByDay.length) {
    dataTable(
      doc,
      y,
      [['Date', 'Product', 'Available', 'Used', 'Remaining', 'Revenue', 'Unpaid']],
      report.usageByDay.slice(0, 60).map((r) => [
        fmtDate(r.date),
        r.product,
        fmtNum(r.produced),
        fmtNum(r.used),
        fmtNum(r.remaining),
        fmtNum(r.revenue, 0),
        fmtNum(r.unpaid, 0),
      ])
    );
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total, report.farmName);
  }

  return doc.output('blob');
}

export function farmAdminReportPdfFilename(report: FarmAdminReport) {
  const stamp = `${report.from}_${report.to}`.replace(/[^0-9-_]/g, '');
  return `DiFarm-farm-admin-report-${stamp}.pdf`;
}

export async function generateFarmAdminReportPdf(report: FarmAdminReport) {
  const blob = await buildFarmAdminReportPdfBlob(report);
  downloadBlob(farmAdminReportPdfFilename(report), blob);
  return blob;
}
