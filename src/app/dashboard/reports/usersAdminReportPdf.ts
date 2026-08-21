import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { UsersAdminReport } from './usersAdminReport.types';
import {
  BRAND,
  MARGIN,
  downloadBlob,
  fmtNum,
  loadLogoDataUrl,
} from './reportBrand';
import { pdfHBarChart, pdfVBarChart } from './reportCharts';

function drawFooter(doc: jsPDF, page: number, total: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 28;
  doc.setDrawColor(...BRAND.border);
  doc.line(MARGIN, footerY - 8, pageWidth - MARGIN, footerY - 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text('DiFarm · Users Administrative Report', MARGIN, footerY);
  doc.text(`Page ${page} of ${total}`, pageWidth - MARGIN, footerY, { align: 'right' });
}

function drawBanner(doc: jsPDF, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BRAND.primaryDark);
  doc.rect(0, 0, pageWidth, 36, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.white);
  doc.text('DiFarm Users Report', MARGIN, 22);
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(220, 252, 231);
    doc.text(subtitle, pageWidth - MARGIN, 22, { align: 'right' });
  }
}

function sectionTitle(doc: jsPDF, y: number, title: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y > pageHeight - 130) {
    doc.addPage();
    drawBanner(doc, 'Continued');
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
      cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
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

export async function generateUsersAdminReportPdf(report: UsersAdminReport) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const logo = await loadLogoDataUrl();
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerHeight = 100;

  doc.setFillColor(...BRAND.primaryDark);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, headerHeight - 6, pageWidth, 6, 'F');

  if (logo) doc.addImage(logo, 'PNG', MARGIN, 16, 46, 46);
  const textX = logo ? MARGIN + 58 : MARGIN;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BRAND.white);
  doc.text('DiFarm', textX, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(220, 252, 231);
  doc.text('Users Dashboard Administrative Report', textX, 48);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.white);
  doc.text(report.scopeLabel, textX, 68);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(220, 252, 231);
  doc.text(`Generated ${report.generatedAt} · ${report.generatedBy}`, pageWidth - MARGIN, 32, {
    align: 'right',
  });

  let y = headerHeight + 12;
  y = sectionTitle(doc, y, 'Level 1 · KPI cards');

  const gap = 8;
  const cardW = (pageWidth - MARGIN * 2 - gap * 3) / 4;
  const cardH = 52;
  const cards = [
    { label: 'Total users', value: String(report.kpis.totalUsers), unit: 'registered' },
    {
      label: 'Active users',
      value: String(report.kpis.activeUsers),
      unit: `${fmtNum(report.kpis.activeRate, 1)}% of users`,
    },
    { label: 'Farmers', value: String(report.kpis.farmers), unit: 'accounts' },
    { label: 'New (30 days)', value: String(report.kpis.newUsers30d), unit: 'registrations' },
    { label: 'Veterinarians', value: String(report.kpis.veterinarians), unit: 'registered' },
    {
      label: 'Managers / field',
      value: String(report.kpis.managers + report.kpis.fieldOfficers),
      unit: 'registered',
    },
    { label: 'Pending', value: String(report.kpis.pending), unit: 'need approval' },
    { label: 'Device-linked', value: String(report.kpis.deviceLinked), unit: 'users' },
  ];

  cards.forEach((kpi, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const x = MARGIN + col * (cardW + gap);
    const cy = y + row * (cardH + gap);
    doc.setFillColor(...BRAND.white);
    doc.setDrawColor(...BRAND.border);
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
  y += 2 * (cardH + gap) + 6;

  y = sectionTitle(doc, y, 'Level 2 · Charts');
  y = pdfHBarChart(
    doc,
    y,
    'Users by role',
    report.byRole.map((r) => ({ label: r.role, value: r.count })),
    MARGIN
  );
  y = pdfHBarChart(
    doc,
    y,
    'Account status',
    report.byStatus.map((s) => ({
      label: s.status,
      value: s.count,
      color: s.status === 'Active' ? '#228b22' : s.status === 'Pending' ? '#f59e0b' : '#ef4444',
    })),
    MARGIN
  );
  y = pdfVBarChart(
    doc,
    y,
    'User activity trend',
    report.activityTrend.length ? report.activityTrend : [{ label: '—', value: 0 }],
    MARGIN
  );
  y = pdfHBarChart(
    doc,
    y,
    'Users by farm',
    report.byFarm
      .filter((f) => f.farm !== '—')
      .slice(0, 8)
      .map((f) => ({ label: f.farm, value: f.count })),
    MARGIN
  );

  if (report.needsAttention.length) {
    y = sectionTitle(doc, y, 'Level 3 · Needs attention');
    autoTable(doc, {
      startY: y,
      head: [['Alert', 'Detail', 'Action']],
      body: report.needsAttention.map((a) => [a.alert, a.example, a.action]),
      ...tableDefaults(),
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  }

  y = sectionTitle(doc, y, 'Level 4 · Users table');
  autoTable(doc, {
    startY: y,
    head: [['User', 'Role', 'Phone', 'Email', 'Farm', 'Status']],
    body: report.users.slice(0, 80).map((u) => [
      u.name,
      u.role,
      u.phone,
      u.email,
      u.farm,
      u.status,
    ]),
    ...tableDefaults(),
  });
  y = (doc as any).lastAutoTable.finalY + 14;

  if (report.recentActivity.length) {
    y = sectionTitle(doc, y, 'User activity report');
    autoTable(doc, {
      startY: y,
      head: [['When', 'Action', 'Actor', 'Entity']],
      body: report.recentActivity.map((a) => [a.when, a.action, a.actor, a.entity]),
      ...tableDefaults(),
    });
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }

  downloadBlob(
    `DiFarm-users-admin-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    doc.output('blob')
  );
}
