import { z } from 'zod';

export const FARM_TYPES = [
  'Dairy',
  'Beef',
  'Mixed Livestock',
  'Poultry',
  'Crop-Livestock',
  'Goat & Sheep',
  'Other',
] as const;

export const LIVESTOCK_OPTIONS = [
  'Cattle',
  'Goats',
  'Sheep',
  'Poultry',
  'Pigs',
  'Rabbits',
  'Bees',
] as const;

export const WATER_SOURCES = [
  'Borehole',
  'River / Stream',
  'Municipal',
  'Rainwater harvesting',
  'Dam / Pond',
  'Other',
] as const;

export const VET_ACCESS_OPTIONS = [
  'On-site veterinarian',
  'District vet visits',
  'Private vet on call',
  'No regular access',
] as const;

export const farmOnboardingSchema = z.object({
  name: z.string().min(3, 'Farm name is required (min 3 characters)'),
  registrationNo: z.string().optional(),
  type: z.string().min(1, 'Select farm type'),
  yearEstablished: z.string().optional(),
  description: z.string().optional(),

  locationText: z.string().min(3, 'Complete the location section'),

  size: z.string().min(1, 'Total land size is required'),
  grazingArea: z.string().optional(),
  housingCapacity: z.string().optional(),
  waterSource: z.string().optional(),
  hasElectricity: z.boolean().optional(),
  veterinaryAccess: z.string().optional(),
  landmarks: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),

  primaryLivestock: z.array(z.string()).min(1, 'Select at least one livestock type'),
  breeds: z.string().optional(),
  herdSizeEstimate: z.string().optional(),

  contactPhone: z.string().min(5, 'Farm contact phone is required'),
  contactEmail: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  emergencyContact: z.string().optional(),
});

export type FarmOnboardingValues = z.infer<typeof farmOnboardingSchema>;

export const ONBOARDING_STEPS = [
  { id: 1, key: 'identity', title: 'Farm identity', subtitle: 'Name, type & overview' },
  { id: 2, key: 'location', title: 'Location', subtitle: 'Address & geography' },
  { id: 3, key: 'land', title: 'Land & facilities', subtitle: 'Size, water & infrastructure' },
  { id: 4, key: 'livestock', title: 'Livestock profile', subtitle: 'Animals & herd size' },
  { id: 5, key: 'contact', title: 'Contact & review', subtitle: 'Reach you & submit' },
] as const;

/** Map a farm API record into onboarding form values. */
export function farmToOnboardingValues(farm: Record<string, any>): FarmOnboardingValues {
  const livestockRaw = String(farm.primaryLivestock ?? '');
  const primaryLivestock = livestockRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const str = (v: unknown) =>
    v == null || v === '' ? '' : String(v);

  return {
    name: str(farm.name),
    registrationNo: str(farm.registrationNo),
    type: str(farm.type),
    yearEstablished: str(farm.yearEstablished),
    description: str(farm.description),
    locationText: str(farm.location),
    size: str(farm.size),
    grazingArea: str(farm.grazingArea),
    housingCapacity: str(farm.housingCapacity),
    waterSource: str(farm.waterSource),
    hasElectricity: Boolean(farm.hasElectricity),
    veterinaryAccess: str(farm.veterinaryAccess),
    landmarks: str(farm.landmarks),
    latitude: str(farm.latitude),
    longitude: str(farm.longitude),
    primaryLivestock:
      primaryLivestock.length > 0 ? primaryLivestock : [],
    breeds: str(farm.breeds),
    herdSizeEstimate: str(farm.herdSizeEstimate),
    contactPhone: str(farm.contactPhone),
    contactEmail: str(farm.contactEmail),
    emergencyContact: str(farm.emergencyContact),
  };
}

export function buildFarmPayload(values: FarmOnboardingValues, ownerId?: string) {
  const parseOptionalInt = (v?: string) => {
    if (!v?.trim()) return undefined;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : undefined;
  };
  const parseOptionalFloat = (v?: string) => {
    if (!v?.trim()) return undefined;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : undefined;
  };

  return {
    name: values.name.trim(),
    location: values.locationText.trim(),
    size: parseFloat(values.size),
    type: values.type,
    ownerId,
    registrationNo: values.registrationNo?.trim() || undefined,
    description: values.description?.trim() || undefined,
    yearEstablished: parseOptionalInt(values.yearEstablished),
    grazingArea: parseOptionalFloat(values.grazingArea),
    housingCapacity: parseOptionalInt(values.housingCapacity),
    waterSource: values.waterSource || undefined,
    hasElectricity: values.hasElectricity ?? false,
    veterinaryAccess: values.veterinaryAccess || undefined,
    landmarks: values.landmarks?.trim() || undefined,
    latitude: values.latitude?.trim() || undefined,
    longitude: values.longitude?.trim() || undefined,
    primaryLivestock: values.primaryLivestock.join(', '),
    breeds: values.breeds?.trim() || undefined,
    herdSizeEstimate: parseOptionalInt(values.herdSizeEstimate),
    contactPhone: values.contactPhone.trim(),
    contactEmail: values.contactEmail?.trim() || undefined,
    emergencyContact: values.emergencyContact?.trim() || undefined,
  };
}
