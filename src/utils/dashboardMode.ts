export type DashboardMode = 'LIVESTOCK' | 'AGRICULTURE';

export const DASHBOARD_MODE_KEY = 'DiFarm_dashboard_mode';

const safeStorage = () => (typeof window !== 'undefined' ? localStorage : null);

export function getDashboardMode(): DashboardMode | null {
  const raw = safeStorage()?.getItem(DASHBOARD_MODE_KEY);
  if (raw === 'LIVESTOCK' || raw === 'AGRICULTURE') return raw;
  return null;
}

export function setDashboardMode(mode: DashboardMode): void {
  safeStorage()?.setItem(DASHBOARD_MODE_KEY, mode);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('difarm-dashboard-mode-changed'));
  }
}

export function clearDashboardMode(): void {
  safeStorage()?.removeItem(DASHBOARD_MODE_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('difarm-dashboard-mode-changed'));
  }
}

export function requireDashboardMode(): DashboardMode | null {
  return getDashboardMode();
}
