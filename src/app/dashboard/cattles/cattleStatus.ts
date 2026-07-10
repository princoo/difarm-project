export const CATTLE_STATUSES = ['', 'HEALTHY', 'SICK', 'SOLD', 'PROCESSED', 'DECEASED'] as const;

export function statusLabel(status?: string) {
  switch (status) {
    case 'HEALTHY':
      return 'Healthy';
    case 'SICK':
      return 'Sick (under treatment)';
    case 'SOLD':
      return 'Sold';
    case 'PROCESSED':
      return 'Processed for meat';
    case 'DECEASED':
      return 'Deceased';
    default:
      return status ? status.charAt(0) + status.slice(1).toLowerCase() : 'Unknown';
  }
}

export function isActiveOnFarm(status?: string) {
  return status === 'HEALTHY' || status === 'SICK';
}

export function activityLabel(status?: string) {
  return isActiveOnFarm(status) ? 'Active on farm' : 'Inactive';
}

export function statusColor(status?: string) {
  switch (status) {
    case 'HEALTHY':
      return 'bg-success-light text-success dark:bg-success-dark-light dark:text-success';
    case 'SICK':
      return 'bg-warning-light text-warning dark:bg-warning-dark-light dark:text-warning';
    case 'SOLD':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    case 'PROCESSED':
      return 'bg-info-light text-info dark:bg-info-dark-light dark:text-info';
    case 'DECEASED':
      return 'bg-danger-light text-danger dark:bg-danger-dark-light dark:text-danger';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
}

export function statusDotColor(status?: string) {
  switch (status) {
    case 'HEALTHY':
      return '#22c55e';
    case 'SICK':
      return '#f59e0b';
    case 'SOLD':
      return '#9ca3af';
    case 'PROCESSED':
      return '#3b82f6';
    case 'DECEASED':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

export function inferBirthOrigin(cattle: {
  purchaseDate?: string | Date | null;
  price?: number | null;
  previousOwner?: string | null;
  motherTag?: string | null;
  DOB?: string | Date | null;
}) {
  if (cattle.purchaseDate || cattle.price != null || cattle.previousOwner) {
    return 'Purchased';
  }
  if (cattle.motherTag || cattle.DOB) {
    return 'OnFarm';
  }
  return '—';
}
