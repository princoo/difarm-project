import type { UsersAdminReport } from './usersAdminReport.types';
import {
  buildWordDocBlob,
  buildWordDocHtml,
  downloadBlob,
  escapeHtml,
  fmtNum,
} from './reportBrand';
import {
  htmlDataTable,
  htmlHBarChart,
  htmlKpiCard,
  htmlNeedsAttention,
  htmlShareChart,
  htmlVBarChart,
} from './reportCharts';

export function buildUsersAdminReportDocBody(report: UsersAdminReport) {
  const roleChart = htmlHBarChart(
    'Users by role',
    'Who is using DI-FARM? (composition of the user base)',
    report.byRole.map((r) => ({ label: r.role, value: r.count }))
  );

  const statusChart = htmlShareChart(
    'Account status',
    'How many accounts need attention?',
    report.byStatus.map((s) => ({
      label: s.status,
      value: s.count,
      color:
        s.status === 'Active' ? '#228b22' : s.status === 'Pending' ? '#f59e0b' : '#ef4444',
    }))
  );

  const activityChart = htmlVBarChart(
    'User activity trend',
    'Is adoption and engagement increasing or declining?',
    report.activityTrend.length
      ? report.activityTrend
      : [{ label: '—', value: 0 }],
    'actions / day'
  );

  const farmChart = htmlHBarChart(
    'Users by farm',
    'How many users are linked to farms?',
    report.byFarm
      .filter((f) => f.farm !== '—')
      .slice(0, 8)
      .map((f) => ({ label: f.farm, value: f.count }))
  );

  return `
    <div class="report-header">
      <h1>DiFarm — Users Dashboard Administrative Report</h1>
      <p class="meta">
        ${escapeHtml(report.scopeLabel)} · Generated ${escapeHtml(report.generatedAt)} · By ${escapeHtml(report.generatedBy)}<br/>
        Product: DI-FARM Digital Livestock Management Platform
      </p>
    </div>

    <p class="layout-note">
      Purpose: give decision-makers a clear view of users, adoption, activity, permissions and livestock-system usage.
      Layout: KPI cards → charts → needs attention → operational users table (per DI-FARM User Dashboard &amp; Reporting Design).
    </p>

    <div class="wireframe-label">Level 1 · KPI cards</div>
    <table class="kpi-table">
      <tr>
        ${htmlKpiCard('Total users', String(report.kpis.totalUsers), 'registered')}
        ${htmlKpiCard('Active users', String(report.kpis.activeUsers), `${fmtNum(report.kpis.activeRate, 1)}% of users`)}
        ${htmlKpiCard('Farmers', String(report.kpis.farmers), usersPct(report.kpis.farmers, report.kpis.totalUsers))}
        ${htmlKpiCard('New users', String(report.kpis.newUsers30d), 'Last 30 days')}
      </tr>
      <tr>
        ${htmlKpiCard('Veterinarians', String(report.kpis.veterinarians), 'Registered')}
        ${htmlKpiCard('Field / managers', String(report.kpis.fieldOfficers + report.kpis.managers), 'Registered')}
        ${htmlKpiCard('Pending', String(report.kpis.pending), 'Need approval')}
        ${htmlKpiCard('Device-linked', String(report.kpis.deviceLinked), 'Users connected')}
      </tr>
    </table>

    <div class="wireframe-label">Level 2 · Charts</div>
    <table class="charts-grid">
      <tr>
        <td>${roleChart}</td>
        <td>${statusChart}</td>
      </tr>
      <tr>
        <td>${activityChart}</td>
        <td>${farmChart}</td>
      </tr>
    </table>

    <div class="wireframe-label">Level 3 · Needs attention</div>
    ${htmlNeedsAttention(report.needsAttention)}

    <div class="wireframe-label">Level 4 · Main users table</div>
    <h2>Users</h2>
    ${htmlDataTable(
      ['User', 'Role', 'Phone', 'Email', 'Farm', 'Status', 'Last active'],
      report.users.map((u) => [u.name, u.role, u.phone, u.email, u.farm, u.status, u.lastActive])
    )}

    ${
      report.recentActivity.length
        ? `<h2>User activity report</h2>
    ${htmlDataTable(
      ['When', 'Action', 'Actor', 'Entity'],
      report.recentActivity.map((a) => [a.when, a.action, a.actor, a.entity])
    )}`
        : ''
    }

    <h2>Users by role (detail)</h2>
    ${htmlDataTable(
      ['Role', 'Count', 'Share %'],
      report.byRole.map((r) => [r.role, r.count, `${fmtNum(r.sharePct, 1)}%`])
    )}

    <h2>Account status (detail)</h2>
    ${htmlDataTable(
      ['Status', 'Count', 'Share %'],
      report.byStatus.map((r) => [r.status, r.count, `${fmtNum(r.sharePct, 1)}%`])
    )}
  `;
}

function usersPct(part: number, total: number) {
  if (!total) return '0% of users';
  return `${fmtNum((part / total) * 100, 1)}% of users`;
}

export function usersAdminReportDocFilename() {
  return `DiFarm-users-admin-report-${new Date().toISOString().slice(0, 10)}.doc`;
}

export function buildUsersAdminReportDocHtml(report: UsersAdminReport) {
  return buildWordDocHtml('DiFarm Users Administrative Report', buildUsersAdminReportDocBody(report));
}

export function buildUsersAdminReportDocBlob(report: UsersAdminReport) {
  return buildWordDocBlob('DiFarm Users Administrative Report', buildUsersAdminReportDocBody(report));
}

export function generateUsersAdminReportDoc(report: UsersAdminReport) {
  const blob = buildUsersAdminReportDocBlob(report);
  downloadBlob(usersAdminReportDocFilename(), blob);
  return blob;
}
