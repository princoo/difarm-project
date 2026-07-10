/**
 * Role-based access control for DiFarm.
 * SUPERADMIN — full platform access, activates farms & accounts.
 * ADMIN (Farm Admin) — owns farms, creates managers, farm-scoped data.
 * MANAGER — assigned farm(s) only, operational CRUD when farm is active.
 * VETERINARIAN — cattle view + health module on assigned farm.
 */

export type Role = 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'VETERINARIAN';

export type Entity =
  | 'users'
  | 'farms'
  | 'cattle'
  | 'production'
  | 'productionTotals'
  | 'productionTransactions'
  | 'wasteLogs'
  | 'stock'
  | 'stockTransactions'
  | 'vaccinations'
  | 'inseminations'
  | 'veterinarians'
  | 'activityLogs';

export const ROLE_LABELS: Record<Role, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN: 'Farm Admin',
  MANAGER: 'Farm Manager',
  VETERINARIAN: 'Veterinarian',
};

export function roleLabel(role?: string): string {
  if (!role) return 'User';
  return ROLE_LABELS[role as Role] ?? role;
}

export function isSuperAdmin(role?: string): boolean {
  return role === 'SUPERADMIN';
}

export function isFarmAdmin(role?: string): boolean {
  return role === 'ADMIN';
}

export function isManager(role?: string): boolean {
  return role === 'MANAGER';
}

export function isVeterinarian(role?: string): boolean {
  return role === 'VETERINARIAN';
}

const canCreate: Partial<Record<Entity, Role[]>> = {
  users: ['SUPERADMIN', 'ADMIN'],
  farms: ['SUPERADMIN', 'ADMIN'],
  cattle: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  production: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  productionTotals: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  productionTransactions: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  wasteLogs: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  stock: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  stockTransactions: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  vaccinations: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'VETERINARIAN'],
  inseminations: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'VETERINARIAN'],
  veterinarians: ['SUPERADMIN', 'ADMIN'],
  activityLogs: [],
};

const canUpdate: Partial<Record<Entity, Role[]>> = {
  users: ['SUPERADMIN', 'ADMIN'],
  farms: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  cattle: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  production: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  productionTotals: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  productionTransactions: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  wasteLogs: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  stock: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  stockTransactions: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  vaccinations: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'VETERINARIAN'],
  inseminations: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'VETERINARIAN'],
  veterinarians: ['SUPERADMIN', 'ADMIN'],
  activityLogs: [],
};

const canDelete: Partial<Record<Entity, Role[]>> = {
  users: ['SUPERADMIN'],
  farms: ['SUPERADMIN', 'ADMIN'],
  cattle: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  production: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  productionTotals: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  productionTransactions: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  wasteLogs: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  stock: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  stockTransactions: ['SUPERADMIN', 'ADMIN', 'MANAGER'],
  vaccinations: [],
  inseminations: [],
  veterinarians: [],
  activityLogs: [],
};

/** Routes that do not require a selected farm (super admin exempt in RoleGuard). */
export const FARM_OPTIONAL_PATHS = [
  '/account/profile',
  '/register-farm',
];

/** Path prefixes → roles allowed to open them (direct URL + RoleGuard). */
const ROUTE_ROLES: { prefix: string; roles: Role[] }[] = [
  { prefix: '/account/users', roles: ['SUPERADMIN', 'ADMIN'] },
  { prefix: '/account/farms', roles: ['SUPERADMIN', 'ADMIN', 'MANAGER'] },
  { prefix: '/account/cattle', roles: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'VETERINARIAN'] },
  { prefix: '/account/production_totals', roles: ['SUPERADMIN', 'ADMIN', 'MANAGER'] },
  { prefix: '/account/production_transactions', roles: ['SUPERADMIN', 'ADMIN', 'MANAGER'] },
  { prefix: '/account/production', roles: ['SUPERADMIN', 'ADMIN', 'MANAGER'] },
  { prefix: '/account/waste-logs', roles: ['SUPERADMIN', 'ADMIN', 'MANAGER'] },
  { prefix: '/account/stock', roles: ['SUPERADMIN', 'ADMIN', 'MANAGER'] },
  { prefix: '/account/health', roles: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'VETERINARIAN'] },
  { prefix: '/account/activity-logs', roles: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'VETERINARIAN'] },
  { prefix: '/account/profile', roles: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'VETERINARIAN'] },
  { prefix: '/account', roles: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'VETERINARIAN'] },
];

export function canAccessRoute(path: string, role?: string): boolean {
  if (!role) return false;
  const specific = ROUTE_ROLES
    .filter((r) => path === r.prefix || path.startsWith(`${r.prefix}/`) || path.startsWith(r.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  if (!specific) return true;
  return specific.roles.includes(role as Role);
}

export function canCreateEntity(entity: Entity, role: string): boolean {
  const roles = canCreate[entity];
  return Array.isArray(roles) && roles.includes(role as Role);
}

export function canUpdateEntity(entity: Entity, role: string): boolean {
  const roles = canUpdate[entity];
  return Array.isArray(roles) && roles.includes(role as Role);
}

export function canDeleteEntity(entity: Entity, role: string): boolean {
  const roles = canDelete[entity];
  return Array.isArray(roles) && roles.includes(role as Role);
}

export function canViewEntity(entity: Entity, role: string): boolean {
  return (
    canCreateEntity(entity, role) ||
    canUpdateEntity(entity, role) ||
    canDeleteEntity(entity, role) ||
    (entity === 'cattle' && role === 'VETERINARIAN') ||
    (entity === 'activityLogs' && ['SUPERADMIN', 'ADMIN', 'MANAGER', 'VETERINARIAN'].includes(role)) ||
    (entity === 'veterinarians' && role === 'VETERINARIAN') ||
    (entity === 'vaccinations' && role === 'VETERINARIAN') ||
    (entity === 'inseminations' && role === 'VETERINARIAN')
  );
}

export function canActivateFarm(role?: string): boolean {
  return role === 'SUPERADMIN';
}

export function canActivateAccount(role?: string): boolean {
  return role === 'SUPERADMIN';
}

export function canCreateFarmAdmin(role?: string): boolean {
  return role === 'SUPERADMIN';
}

export function canCreateManager(role?: string): boolean {
  return role === 'ADMIN';
}
