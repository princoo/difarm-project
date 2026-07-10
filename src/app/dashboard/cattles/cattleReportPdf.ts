import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CattleReport } from './cattleReport.types';
import { activityLabel, inferBirthOrigin, statusLabel } from './cattleStatus';

const BRAND = {
  primary: [34, 139, 34] as [number, number, number],
  primaryDark: [22, 101, 52] as [number, number, number],
  primaryLight: [220, 252, 231] as [number, number, number],
  accent: [245, 158, 11] as [number, number, number],
  text: [17, 24, 39] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  zebra: [248, 250, 252] as [number, number, number],
};

const MARGIN = 42;
const LOGO_PATH = '/logo.png';

function fmtDate(value?: string | Date | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function loadLogoDataUrl(): Promise<string | null> {
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

function drawFooter(doc: jsPDF, page: number, totalPages: number, tagNumber: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 28;

  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, footerY - 8, pageWidth - MARGIN, footerY - 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text('DiFarm · Digital Farming Management', MARGIN, footerY);
  doc.text(`Cattle #${tagNumber}`, pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Page ${page} of ${totalPages}`, pageWidth - MARGIN, footerY, { align: 'right' });
}

function drawPageBanner(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...BRAND.primaryDark);
  doc.rect(0, 0, pageWidth, 36, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.white);
  doc.text(title, MARGIN, 22);
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(220, 252, 231);
    doc.text(subtitle, pageWidth - MARGIN, 22, { align: 'right' });
  }
}

function drawHeroHeader(
  doc: jsPDF,
  report: CattleReport,
  logoDataUrl: string | null
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const cattle = report.profile;
  const headerHeight = 118;

  doc.setFillColor(...BRAND.primaryDark);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  doc.setFillColor(...BRAND.primary);
  doc.rect(0, headerHeight - 6, pageWidth, 6, 'F');

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', MARGIN, 18, 52, 52);
  } else {
    doc.setFillColor(...BRAND.white);
    doc.circle(MARGIN + 26, 44, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...BRAND.primaryDark);
    doc.text('DF', MARGIN + 26, 48, { align: 'center' });
  }

  const textX = logoDataUrl ? MARGIN + 64 : MARGIN + 58;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...BRAND.white);
  doc.text('DiFarm', textX, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(220, 252, 231);
  doc.text('Digital Farming Management System', textX, 52);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.white);
  doc.text('Cattle Performance Report', textX, 72);

  const metaX = pageWidth - MARGIN;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text(`#${cattle.tagNumber}`, metaX, 40, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 252, 231);
  doc.text(`${cattle.breed} · ${cattle.gender}`, metaX, 56, { align: 'right' });
  doc.text(cattle.farm?.name || 'Farm record', metaX, 70, { align: 'right' });
  doc.text(`Generated ${new Date().toLocaleString('en-GB')}`, metaX, 84, { align: 'right' });

  return headerHeight + 16;
}

function drawKpiRow(doc: jsPDF, startY: number, report: CattleReport): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const cattle = report.profile;
  const gap = 10;
  const cardW = (pageWidth - MARGIN * 2 - gap * 3) / 4;
  const cardH = 58;

  const kpis = [
    { label: 'Total milk', value: `${report.production.totalMilk}`, unit: 'L / units' },
    {
      label: 'Est. feed used',
      value: report.expenses.estimatedFeedPerHead.toFixed(1),
      unit: 'units',
    },
    {
      label: 'Milk / feed',
      value: report.economics.milkToFeedRatio != null ? String(report.economics.milkToFeedRatio) : '—',
      unit: 'ratio',
    },
    { label: 'Status', value: statusLabel(cattle.status).split(' ')[0], unit: activityLabel(cattle.status) },
  ];

  kpis.forEach((kpi, i) => {
    const x = MARGIN + i * (cardW + gap);

    doc.setFillColor(...BRAND.white);
    doc.setDrawColor(...BRAND.border);
    doc.setLineWidth(0.75);
    doc.roundedRect(x, startY, cardW, cardH, 6, 6, 'FD');

    doc.setFillColor(...BRAND.primary);
    doc.rect(x, startY, 4, cardH, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text(kpi.label.toUpperCase(), x + 12, startY + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...BRAND.primaryDark);
    doc.text(kpi.value, x + 12, startY + 36);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text(kpi.unit, x + 12, startY + 48);
  });

  return startY + cardH + 22;
}

function tableDefaults() {
  return {
    theme: 'plain' as const,
    margin: { left: MARGIN, right: MARGIN },
    styles: {
      fontSize: 9,
      cellPadding: { top: 6, right: 8, bottom: 6, left: 8 },
      lineColor: BRAND.border,
      lineWidth: 0.4,
      textColor: BRAND.text,
    },
    headStyles: {
      fillColor: BRAND.primary,
      textColor: BRAND.white,
      fontStyle: 'bold' as const,
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: BRAND.zebra },
  };
}

function keyValueTable(doc: jsPDF, startY: number, rows: [string, string][]) {
  autoTable(doc, {
    startY,
    ...tableDefaults(),
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 148, textColor: BRAND.muted },
      1: { cellWidth: 'auto' },
    },
    body: rows,
  });
  return (doc as any).lastAutoTable.finalY + 18;
}

function sectionTitle(doc: jsPDF, y: number, title: string, icon?: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  if (y > pageHeight - 120) {
    doc.addPage();
    drawPageBanner(doc, 'DiFarm Cattle Report', 'Continued');
    y = 52;
  }

  doc.setFillColor(...BRAND.primaryLight);
  doc.roundedRect(MARGIN, y - 2, pageWidth - MARGIN * 2, 22, 4, 4, 'F');

  doc.setFillColor(...BRAND.primary);
  doc.circle(MARGIN + 12, y + 9, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.primaryDark);
  doc.text(icon ? `${icon}  ${title}` : title, MARGIN + 22, y + 13);

  return y + 30;
}

function dataTable(
  doc: jsPDF,
  startY: number,
  head: string[][],
  body: (string | number)[][]
): number {
  autoTable(doc, {
    startY,
    head,
    body,
    ...tableDefaults(),
  });
  return (doc as any).lastAutoTable.finalY + 18;
}

function addFooters(doc: jsPDF, tagNumber: string) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total, tagNumber);
  }
}

export async function generateCattleReportPdf(report: CattleReport) {
  const cattle = report.profile;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const logoDataUrl = await loadLogoDataUrl();

  let y = drawHeroHeader(doc, report, logoDataUrl);
  y = drawKpiRow(doc, y, report);

  y = sectionTitle(doc, y, 'Profile & identification');
  y = keyValueTable(doc, y, [
    ['Tag number', cattle.tagNumber],
    ['Breed', cattle.breed],
    ['Gender', cattle.gender],
    ['Weight', cattle.weight != null ? `${cattle.weight} kg` : '—'],
    ['Date of birth', fmtDate(cattle.DOB)],
    ['Birth origin', inferBirthOrigin(cattle)],
    ['Mother tag', cattle.motherTag || '—'],
    ['Farm', cattle.farm?.name || '—'],
    ['Location', cattle.location || '—'],
    ['Purchase date', fmtDate(cattle.purchaseDate)],
    ['Purchase price', cattle.price != null ? `${cattle.price.toLocaleString()} RWF` : '—'],
    ['Previous owner', cattle.previousOwner || '—'],
  ]);

  y = sectionTitle(doc, y, 'Life status & health');
  y = keyValueTable(doc, y, [
    ['Health status', statusLabel(report.lifeStatus.status)],
    ['Farm activity', activityLabel(report.lifeStatus.status)],
    ['Last checkup', fmtDate(report.lifeStatus.lastCheckupDate)],
    ['Vaccine notes', report.lifeStatus.vaccineHistory || '—'],
  ]);

  if (report.healthRecords.length) {
    y = sectionTitle(doc, y, 'Veterinary & vaccination history');
    y = dataTable(
      doc,
      y,
      [['Date', 'Treatment / vaccine', 'Veterinarian', 'Contact']],
      report.healthRecords.map((r) => [
        fmtDate(r.date),
        r.vaccineType,
        r.veterinarian?.name || '—',
        r.veterinarian?.phone || r.veterinarian?.email || '—',
      ])
    );
  }

  y = sectionTitle(doc, y, 'Milk & production performance');
  y = keyValueTable(doc, y, [
    ['Total milk produced', `${report.production.totalMilk} L / units`],
    ['Total all products', `${report.production.totalProduction} units`],
    ['Production entries', String(report.production.records.length)],
  ]);

  if (report.production.dailyMilk.length) {
    y = sectionTitle(doc, y, 'Daily milk statistics');
    y = dataTable(
      doc,
      y,
      [['Date', 'Milk quantity (L/units)']],
      report.production.dailyMilk.map((d) => [fmtDate(d.date), String(d.quantity)])
    );
  }

  if (report.production.records.length) {
    y = sectionTitle(doc, y, 'All production records');
    y = dataTable(
      doc,
      y,
      [['Date', 'Product', 'Quantity']],
      report.production.records.map((r) => [
        fmtDate(r.productionDate),
        r.productName,
        String(r.quantity),
      ])
    );
  }

  y = sectionTitle(doc, y, 'Feed consumption & economics');
  y = keyValueTable(doc, y, [
    ['Total farm food consumed', `${report.expenses.totalFoodConsumed} units`],
    ['Active cattle on farm', String(report.expenses.activeCattleCount)],
    ['Estimated feed (this cattle)', `${report.expenses.estimatedFeedPerHead.toFixed(1)} units`],
    [
      'Milk-to-feed ratio',
      report.economics.milkToFeedRatio != null ? String(report.economics.milkToFeedRatio) : '—',
    ],
  ]);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  const noteLines = doc.splitTextToSize(report.expenses.note, doc.internal.pageSize.getWidth() - MARGIN * 2);
  doc.text(noteLines, MARGIN, y);
  y += noteLines.length * 11 + 8;

  if (report.expenses.foodTransactions.length) {
    y = sectionTitle(doc, y, 'Farm food consumption log');
    dataTable(
      doc,
      y,
      [['Date', 'Food item', 'Quantity consumed']],
      report.expenses.foodTransactions.slice(0, 30).map((t) => [
        fmtDate(t.date),
        t.stockName,
        String(t.quantity),
      ])
    );
  }

  if (report.breedingRecords.length) {
    const pageHeight = doc.internal.pageSize.getHeight();
    if ((doc as any).lastAutoTable?.finalY > pageHeight - 100) {
      doc.addPage();
      drawPageBanner(doc, 'DiFarm Cattle Report', 'Breeding records');
      y = 52;
    } else {
      y = (doc as any).lastAutoTable?.finalY + 18 || y;
    }
    y = sectionTitle(doc, y, 'Breeding & insemination records');
    dataTable(
      doc,
      y,
      [['Date', 'Method', 'Type', 'Veterinarian']],
      report.breedingRecords.map((r) => [
        fmtDate(r.date),
        r.method,
        r.type,
        r.veterinarian?.name || '—',
      ])
    );
  }

  addFooters(doc, cattle.tagNumber);
  doc.save(`DiFarm-cattle-report-${cattle.tagNumber}.pdf`);
}
