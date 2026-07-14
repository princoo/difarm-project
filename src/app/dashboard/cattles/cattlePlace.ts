/** Shared display helpers for cattle farm + location fields. */

export function formatFarmCoords(farm?: {
  latitude?: string | null;
  longitude?: string | null;
} | null): string {
  const lat = String(farm?.latitude ?? '').trim();
  const lng = String(farm?.longitude ?? '').trim();
  if (lat && lng) return `${lat}, ${lng}`;
  return '';
}

export function cattlePlaceInfo(cattle: {
  location?: string | null;
  farm?: {
    name?: string | null;
    location?: string | null;
    latitude?: string | null;
    longitude?: string | null;
  } | null;
}) {
  const farmName = String(cattle?.farm?.name ?? '').trim();
  const cattleLocation = String(cattle?.location ?? '').trim();
  const farmAddress = String(cattle?.farm?.location ?? '').trim();
  const farmCoords = formatFarmCoords(cattle?.farm);

  return {
    farmName: farmName || '—',
    cattleLocation: cattleLocation || '—',
    farmAddress: farmAddress || '—',
    farmCoords: farmCoords || '—',
    /** Short line for cards: prefer cattle location, else farm coords/address */
    cardPlace:
      cattleLocation ||
      farmCoords ||
      farmAddress ||
      '',
  };
}
