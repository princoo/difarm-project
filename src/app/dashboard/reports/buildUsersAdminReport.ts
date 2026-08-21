import type { UsersAdminReport, UsersAdminReportInput } from './usersAdminReport.types';
import { roleLabel } from '@/utils/permissions';

function displayName(u: any) {
  return (
    u?.name ||
    [u?.firstName, u?.lastName].filter(Boolean).join(' ') ||
    u?.account?.name ||
    u?.account?.email ||
    u?.account?.phone ||
    'User'
  );
}

function normalizeRole(raw: string | undefined | null) {
  return String(raw || 'UNKNOWN').toUpperCase();
}

function isActive(u: any) {
  return !!u?.account?.status;
}

function createdAt(u: any): Date | null {
  const raw = u?.createdAt || u?.account?.createdAt || u?.account?.created_at;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function farmLabel(u: any) {
  if (u?.farm?.name) return u.farm.name;
  if (Array.isArray(u?.farms) && u.farms.length) {
    return u.farms.map((f: any) => f?.name || f?.farm?.name).filter(Boolean).join(', ') || '—';
  }
  if (u?.farmName) return u.farmName;
  return '—';
}

export function buildUsersAdminReport(input: UsersAdminReportInput): UsersAdminReport {
  const users = input.users ?? [];
  const logs = input.activityLogs ?? [];
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  let activeUsers = 0;
  let farmers = 0;
  let veterinarians = 0;
  let fieldOfficers = 0;
  let managers = 0;
  let admins = 0;
  let pending = 0;
  let suspended = 0;
  let newUsers30d = 0;
  let deviceLinked = 0;

  const roleMap = new Map<string, number>();
  const farmMap = new Map<string, number>();

  for (const u of users) {
    const role = normalizeRole(u?.account?.role || u?.role);
    roleMap.set(role, (roleMap.get(role) || 0) + 1);

    if (isActive(u)) activeUsers += 1;
    else pending += 1;

    if (role === 'FARMER') farmers += 1;
    else if (role === 'VETERINARIAN') veterinarians += 1;
    else if (role === 'FIELD_OFFICER' || role === 'FIELDOFFICER') fieldOfficers += 1;
    else if (role === 'MANAGER') managers += 1;
    else if (role === 'ADMIN' || role === 'SUPERADMIN') admins += 1;

    if (String(u?.account?.statusLabel || u?.status || '').toLowerCase() === 'suspended') {
      suspended += 1;
    }

    const created = createdAt(u);
    if (created && now - created.getTime() <= thirtyDays) newUsers30d += 1;

    const devices = Number(u?.deviceCount || u?.devices?.length || 0);
    if (devices > 0 || u?.hasDevice) deviceLinked += 1;

    const farm = farmLabel(u);
    farmMap.set(farm, (farmMap.get(farm) || 0) + 1);
  }

  const total = users.length || 1;
  const byRole = [...roleMap.entries()]
    .map(([role, count]) => ({
      role: roleLabel(role) || role,
      count,
      sharePct: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  const byStatus = [
    { status: 'Active', count: activeUsers, sharePct: (activeUsers / total) * 100 },
    { status: 'Pending', count: pending, sharePct: (pending / total) * 100 },
    { status: 'Suspended', count: suspended, sharePct: (suspended / total) * 100 },
  ].filter((s) => s.count > 0 || s.status !== 'Suspended');

  const byFarm = [...farmMap.entries()]
    .map(([farm, count]) => ({ farm, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // Activity trend from logs (last 14 days with activity)
  const dayMap = new Map<string, number>();
  for (const log of logs) {
    if (!log?.createdAt) continue;
    const d = new Date(log.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) || 0) + 1);
  }
  const activityTrend = [...dayMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([day, value]) => ({
      label: new Date(day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      value,
    }));

  const unlinked = users.filter((u) => farmLabel(u) === '—').length;
  const needsAttention: UsersAdminReport['needsAttention'] = [];
  if (pending > 0) {
    needsAttention.push({
      alert: 'Pending approvals',
      example: `${pending} account(s) awaiting approval`,
      action: 'Review',
    });
  }
  if (suspended > 0) {
    needsAttention.push({
      alert: 'Suspended accounts',
      example: `${suspended} suspended account(s) require review`,
      action: 'Audit',
    });
  }
  if (unlinked > 0) {
    needsAttention.push({
      alert: 'Unlinked users',
      example: `${unlinked} user(s) have no farm linked`,
      action: 'Resolve',
    });
  }
  if (deviceLinked === 0 && users.length > 0) {
    needsAttention.push({
      alert: 'Device linkage',
      example: 'No device-linked users detected in this scope',
      action: 'Investigate',
    });
  }

  const rows = users.map((u) => ({
    name: displayName(u),
    role:
      roleLabel(normalizeRole(u?.account?.role || u?.role)) ||
      normalizeRole(u?.account?.role || u?.role),
    phone: u?.account?.phone || '—',
    email: u?.account?.email || '—',
    farm: farmLabel(u),
    status: isActive(u) ? 'Active' : 'Pending',
    lastActive: u?.account?.lastLoginAt
      ? new Date(u.account.lastLoginAt).toLocaleString('en-GB')
      : u?.lastActive || '—',
  }));

  const recentActivity = logs.slice(0, 40).map((log) => ({
    when: log?.createdAt ? new Date(log.createdAt).toLocaleString('en-GB') : '—',
    action: log?.action || 'OTHER',
    actor: log?.account?.email || log?.account?.phone || log?.accountId || '—',
    entity: [log?.entityType, log?.entityId].filter(Boolean).join(' ') || '—',
  }));

  return {
    scopeLabel: input.scopeLabel || 'All users',
    generatedAt: new Date().toLocaleString('en-GB'),
    generatedBy: input.generatedBy || 'Administrator',
    kpis: {
      totalUsers: users.length,
      activeUsers,
      activeRate: users.length ? (activeUsers / users.length) * 100 : 0,
      farmers,
      veterinarians,
      fieldOfficers,
      managers,
      admins,
      pending,
      suspended,
      newUsers30d,
      deviceLinked,
    },
    byRole,
    byStatus,
    byFarm,
    activityTrend,
    needsAttention,
    users: rows,
    recentActivity,
  };
}
